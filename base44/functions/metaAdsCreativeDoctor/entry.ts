import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreativeDoctor · El "experto creativo de clase mundial" del agente.
// ----------------------------------------------------------------------------
// Audita un anuncio (o una campaña entera) cruzando TRES señales:
//   1. El contenido real del creativo (copy, titular, CTA, link, formato) —
//      leído en vivo desde Meta.
//   2. El rendimiento real (CTR, CPC, frecuencia, conversiones, ROAS) — para
//      saber si el problema es el hook, la oferta, la audiencia o la fatiga.
//   3. Tendencias vivas del mercado (búsqueda en internet, junio 2026) — para
//      que las variantes propuestas estén alineadas con lo que funciona HOY en
//      Meta/Instagram.
//
// Devuelve un DIAGNÓSTICO experto + VARIANTES creativas listas para aplicar:
// cada variante trae primary_text, headline, description y cta nuevos, más una
// idea visual — todo en el formato que metaAdsUpdateAdCreative / metaAdsCreateMultiAd
// consumen directo. El agente puede aplicar una variante con un clic.
//
// Payload:
//   { ad_id: '123' }                      → audita y mejora UN anuncio
//   { campaign_id: '123' }                → audita los anuncios de una campaña
//   { date_preset?: 'last_14d',           → ventana de rendimiento
//     objetivo?: 'conversion'|'engagement'|'awareness',
//     n_variantes?: 3,                     → cuántas variantes generar por anuncio
//     incluir_tendencias?: true }          → cruzar con tendencias vivas (default true)
//
// Devuelve: { ok, ads:[{ ad_id, nombre, metricas, diagnostico, severidad,
//   variantes:[{ angulo, primary_text, headline, description, cta, idea_visual,
//   por_que }] }], tendencias_aplicadas? }
// ============================================================================

const GRAPH_VERSION = 'v21.0';

const CONTEXTO_PEYU = `PEYU (peyuchile.cl) es una marca chilena de diseño consciente: plástico 100% reciclado y fibra de trigo compostable. B2C: carcasas de celular ecológicas, escritorio, hogar. B2B: regalos corporativos personalizados con logo grabado a láser. Mercado Chile. Tono: cálido, chileno, premium-accesible, sostenibilidad real y con humor cuando cabe. Landings: B2C peyuchile.cl/CatalogoNuevo, B2B peyuchile.cl/EmpresasNuevo.`;

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

async function graphGet(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  return res.json();
}

// Lee el contenido creativo de un anuncio (copy/titular/CTA/link/formato).
function parseCreative(ad) {
  const cr = ad.creative || {};
  const oss = cr.object_story_spec || {};
  const ld = oss.link_data || oss.video_data || {};
  const isCarousel = Array.isArray(ld.child_attachments) && ld.child_attachments.length > 0;
  return {
    primary_text: ld.message || cr.body || '',
    headline: ld.name || ld.title || cr.title || '',
    description: ld.description || ld.link_description || '',
    cta: ld.call_to_action?.type || cr.call_to_action_type || '',
    link: ld.link || ld.call_to_action?.value?.link || '',
    formato: oss.video_data ? 'video' : (isCarousel ? 'carrusel' : 'imagen'),
  };
}

// Convierte insights crudos de Meta en métricas legibles + flags.
function readMetrics(insights) {
  const d = (insights?.data || [])[0] || {};
  const num = (x) => Number(x || 0);
  const impressions = num(d.impressions);
  const clicks = num(d.clicks);
  const spend = num(d.spend);
  const reach = num(d.reach);
  const frequency = num(d.frequency);
  const ctr = num(d.ctr);
  const cpc = num(d.cpc);
  const cpm = num(d.cpm);
  // Conversiones / valor (Purchase/Lead) desde actions.
  let conversions = 0, value = 0;
  for (const a of d.actions || []) {
    if (/purchase|lead|complete_registration|offsite_conversion/i.test(a.action_type)) conversions += num(a.value);
  }
  for (const a of d.action_values || []) {
    if (/purchase|offsite_conversion/i.test(a.action_type)) value += num(a.value);
  }
  const roas = spend > 0 ? value / spend : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const flags = [];
  if (impressions > 1000 && ctr < 1) flags.push('CTR bajo (<1%): el hook/creativo no engancha en el feed.');
  if (frequency >= 3) flags.push(`Frecuencia alta (${frequency.toFixed(1)}): fatiga creativa, la gente ya lo vio demasiado — urge renovar el creativo.`);
  if (spend > 8000 && conversions === 0) flags.push('Gasto sin conversiones: la oferta o la audiencia no convierten.');
  if (cpm > 9000) flags.push('CPM alto: público saturado o subasta cara.');
  return { impressions, clicks, spend, reach, frequency: Number(frequency.toFixed(2)), ctr: Number(ctr.toFixed(2)), cpc: Math.round(cpc), cpm: Math.round(cpm), conversions, value: Math.round(value), roas: Number(roas.toFixed(2)), cpa: Math.round(cpa), flags };
}

const VARIANT_SCHEMA = {
  type: 'object',
  properties: {
    diagnostico: { type: 'string', description: 'Diagnóstico experto: qué falla (hook, oferta, CTA, fatiga, audiencia) y por qué, cruzando creativo + métricas.' },
    severidad: { type: 'string', enum: ['critico', 'mejorable', 'sano'] },
    variantes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          angulo: { type: 'string', description: 'El ángulo psicológico/creativo de esta variante (ej: prueba social, urgencia, beneficio ambiental, humor chileno, UGC).' },
          primary_text: { type: 'string', description: 'Copy principal listo para usar (con emojis si suma, tono PEYU, máx ~125 palabras, hook en la 1ª línea).' },
          headline: { type: 'string', description: 'Titular corto y potente (máx ~40 chars).' },
          description: { type: 'string', description: 'Descripción de apoyo (máx ~30 chars), opcional.' },
          cta: { type: 'string', description: 'CTA de Meta: SHOP_NOW | LEARN_MORE | GET_QUOTE | SIGN_UP | CONTACT_US | ORDER_NOW | SEND_MESSAGE.' },
          idea_visual: { type: 'string', description: 'Idea concreta del visual/video que mejor acompaña este copy (hook de 3s, qué mostrar, formato 9:16 o 1:1).' },
          por_que: { type: 'string', description: 'Por qué esta variante debería mejorar el engagement/conversión, en 1 frase.' },
        },
        required: ['angulo', 'primary_text', 'headline', 'cta', 'idea_visual', 'por_que'],
      },
    },
  },
  required: ['diagnostico', 'severidad', 'variantes'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) return Response.json({ ok: false, error: 'Faltan credenciales de Meta.' });

    const body = await req.json().catch(() => ({}));
    const datePreset = body.date_preset || 'last_14d';
    const objetivo = body.objetivo || 'conversion';
    const nVariantes = Math.min(Math.max(Number(body.n_variantes) || 3, 1), 5);
    const incluirTendencias = body.incluir_tendencias !== false;

    // 1 · Resolver QUÉ anuncio auditar. Auditamos UN anuncio por llamada (rápido,
    // conversacional): si viene campaign_id, elegimos el de MAYOR gasto reciente —
    // el que más importa optimizar. El agente puede iterar pidiendo otros.
    let adId = body.ad_id || null;
    if (!adId && body.campaign_id) {
      const data = await graphGet(`${body.campaign_id}/ads?fields=id&effective_status=["ACTIVE","PAUSED"]&limit=25`, token);
      if (data.error) return Response.json({ ok: false, error: data.error.message });
      const ids = (data.data || []).map((a) => a.id);
      if (!ids.length) return Response.json({ ok: false, error: 'La campaña no tiene anuncios para auditar.' });
      // Elegir el de mayor spend en la ventana (lee insights por anuncio en paralelo).
      const spends = await Promise.all(ids.map(async (id) => {
        const ins = await graphGet(`${id}/insights?fields=spend&date_preset=${datePreset}`, token);
        return { id, spend: Number((ins?.data || [])[0]?.spend || 0) };
      }));
      spends.sort((a, b) => b.spend - a.spend);
      adId = spends[0].id;
    }
    if (!adId) return Response.json({ ok: false, error: 'Pasa ad_id (un anuncio) o campaign_id (auditará su anuncio de mayor gasto).' });

    // 2 · Leer creativo + métricas del anuncio (en paralelo).
    const fields = 'name,status,creative{object_story_spec,body,title,call_to_action_type}';
    const [adData, ins] = await Promise.all([
      graphGet(`${adId}?fields=${fields}`, token),
      graphGet(`${adId}/insights?fields=impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,actions,action_values&date_preset=${datePreset}`, token),
    ]);
    if (adData.error) return Response.json({ ok: false, error: adData.error.message });
    const creative = parseCreative(adData);
    const metricas = readMetrics(ins);

    // 3 · Generar variantes expertas. Tendencias vivas (web search) + variantes
    // creativas corren EN PARALELO con Gemini Flash para no exceder el tiempo.
    let tendencias = null;
    const tendenciasPromise = incluirTendencias
      ? base44.integrations.Core.InvokeLLM({
          prompt: `${CONTEXTO_PEYU}\n\nDame las 4 tendencias VIVAS (2026) más relevantes HOY para anuncios de Meta/Instagram de una marca como PEYU en Chile: formatos que más enganchan (Reels, UGC, hooks), ángulos de copy que convierten, y comportamiento de compra eco/regalo corporativo. Concreto y accionable.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: { type: 'object', properties: { tendencias: { type: 'array', items: { type: 'string' } } }, required: ['tendencias'] },
        }).then((r) => r?.tendencias || null).catch(() => null)
      : Promise.resolve(null);

    const buildPrompt = (tend) => `${CONTEXTO_PEYU}\n\nEres un director creativo de performance marketing de clase mundial (nivel Meta Creative Shop). Audita este anuncio de PEYU y proponlo MEJOR.\n\nOBJETIVO PRIORITARIO: ${objetivo}.\n\nCONTENIDO ACTUAL:\n- Formato: ${creative.formato}\n- Copy: ${creative.primary_text || '(vacío)'}\n- Titular: ${creative.headline || '(vacío)'}\n- Descripción: ${creative.description || '(vacío)'}\n- CTA: ${creative.cta || '(ninguno)'}\n\nRENDIMIENTO REAL (${datePreset}):\n- Impresiones: ${metricas.impressions} · Clics: ${metricas.clicks} · CTR: ${metricas.ctr}% · CPC: $${metricas.cpc} · CPM: $${metricas.cpm} · Frecuencia: ${metricas.frequency}\n- Conversiones: ${metricas.conversions} · ROAS: ${metricas.roas} · CPA: $${metricas.cpa}\n- Señales: ${metricas.flags.length ? metricas.flags.join(' ') : 'sin flags críticos'}\n${tend ? `\nTENDENCIAS VIVAS A APROVECHAR:\n- ${tend.join('\n- ')}` : ''}\n\nDiagnostica como experto qué falla (hook, oferta, CTA, fatiga creativa, audiencia) cruzando creativo + métricas. Luego entrega ${nVariantes} VARIANTES creativas distintas y listas para aplicar, cada una con un ÁNGULO psicológico diferente (prueba social, urgencia/escasez, beneficio ambiental tangible, humor chileno, UGC/autenticidad, autoridad). Cada variante: copy potente con hook en la 1ª línea, titular, descripción corta, CTA de Meta adecuado, y una idea de visual/video. Español chileno, tono PEYU. Deben subir engagement Y conversión.`;

    tendencias = await tendenciasPromise;
    let ia;
    try {
      ia = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(tendencias),
        model: 'gemini_3_flash',
        response_json_schema: VARIANT_SCHEMA,
      });
    } catch (e) {
      return Response.json({ ok: false, ad_id: adId, nombre: adData.name, metricas, error: 'No se pudieron generar variantes: ' + e.message });
    }

    return Response.json({
      ok: true,
      objetivo,
      date_preset: datePreset,
      tendencias_aplicadas: tendencias,
      ad: {
        ad_id: adId,
        nombre: adData.name,
        status: adData.status,
        creativo_actual: creative,
        metricas,
        diagnostico: ia?.diagnostico || '',
        severidad: ia?.severidad || 'mejorable',
        variantes: ia?.variantes || [],
      },
      nota: 'Auditamos el anuncio de mayor gasto. Cada variante trae primary_text, headline, description y cta listos. Aplica una con metaAdsUpdateAdCreative (mismo ad_id, sin borrarlo) o lánzalas como A/B con metaAdsCreateMultiAd. La idea_visual úsala con agentGenerateMedia si falta el creativo. Para auditar otro anuncio, pásame su ad_id.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});