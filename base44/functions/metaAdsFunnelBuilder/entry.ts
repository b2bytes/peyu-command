import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsFunnelBuilder · Arma el EMBUDO FULL-FUNNEL completo de una agencia
// en UN solo paso, con las audiencias de retargeting estructuradas y la
// exclusión de compradores ya cableada.
// ----------------------------------------------------------------------------
// El gran faltante #3: no bastaba con audiencias sueltas. Una agencia arma un
// SISTEMA de 3 etapas que se excluyen entre sí para no malgastar:
//
//   TOFU (frío / adquisición) → Advantage+ Shopping. Andromeda busca clientes
//        nuevos. Excluye a quienes ya interactuaron y a compradores.
//   MOFU (tibio / retargeting de catálogo) → DPA retargeting: a quien vio un
//        producto y NO lo compró, le muestra ESE producto. Excluye compradores.
//   BOFU (caliente) → ya cubierto por MOFU al excluir compradores.
//
// Esta función:
//   1. Crea (o reutiliza) las audiencias clave: compradores (180d), visitantes
//      de producto/ViewContent (14d), add-to-cart (14d).
//   2. Devuelve un PLAN claro de qué campañas lanzar con qué exclusiones, y
//      los audience_ids reales para pasárselos a metaAdsCreateAdvantagePlus /
//      metaAdsCatalog. No lanza campañas (eso lo hacen las funciones existentes
//      con el plan), para mantener todo PAUSED y revisable.
//
// Payload:
//   { buyers_days?: 180, viewers_days?: 14, cart_days?: 14, crear?: true }
//   crear=false → solo lista las audiencias existentes y arma el plan.
// ============================================================================

const GRAPH_VERSION = 'v21.0';
const PEYU_PIXEL_ID = '769018551017679';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ') || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso sobre la cuenta o las audiencias.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido: ' + msg, detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

async function graphPost(path, params, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  return res.json();
}

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
  return res.json();
}

// Crea una custom audience basada en un evento del pixel, o devuelve la existente
// si ya hay una con el mismo nombre (idempotente — no duplica audiencias).
async function ensurePixelAudience(accountId, existing, name, event, days, token) {
  const found = existing.find((a) => a.name === name);
  if (found) return { id: found.id, name, reused: true };
  const rule = {
    inclusions: {
      operator: 'or',
      rules: [{ event_sources: [{ type: 'pixel', id: PEYU_PIXEL_ID }], retention_seconds: days * 86400, filter: { operator: 'and', filters: [{ field: 'event', operator: 'eq', value: event }] } }],
    },
  };
  const data = await graphPost(`${accountId}/customaudiences`, { name, prefill: true, rule: JSON.stringify(rule) }, token);
  if (data.error) return { error: data.error };
  return { id: data.id, name, reused: false };
}

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
    const buyersDays = Number(body.buyers_days) || 180;
    const viewersDays = Number(body.viewers_days) || 14;
    const cartDays = Number(body.cart_days) || 14;
    const crear = body.crear !== false; // default true

    // Audiencias existentes (para no duplicar).
    const existingData = await graphGet(`${accountId}/customaudiences?fields=id,name,approximate_count_lower_bound,subtype&limit=200`, token);
    if (existingData.error) return Response.json({ ok: false, ...diagnoseMetaError(existingData.error) });
    const existing = existingData.data || [];

    const audiencias = {};
    if (crear) {
      const buyers = await ensurePixelAudience(accountId, existing, 'PEYU · Compradores (Purchase)', 'Purchase', buyersDays, token);
      if (buyers.error) return Response.json({ ok: false, step: 'buyers', ...diagnoseMetaError(buyers.error) });
      const viewers = await ensurePixelAudience(accountId, existing, 'PEYU · Vieron producto (ViewContent)', 'ViewContent', viewersDays, token);
      if (viewers.error) return Response.json({ ok: false, step: 'viewers', ...diagnoseMetaError(viewers.error) });
      const carts = await ensurePixelAudience(accountId, existing, 'PEYU · Agregaron al carro (AddToCart)', 'AddToCart', cartDays, token);
      if (carts.error) return Response.json({ ok: false, step: 'carts', ...diagnoseMetaError(carts.error) });
      audiencias.compradores = buyers;
      audiencias.vieron_producto = viewers;
      audiencias.agregaron_carro = carts;
    } else {
      // Solo mapear las que ya existan por nombre.
      const byName = (n) => { const f = existing.find((a) => a.name === n); return f ? { id: f.id, name: n, reused: true } : null; };
      audiencias.compradores = byName('PEYU · Compradores (Purchase)');
      audiencias.vieron_producto = byName('PEYU · Vieron producto (ViewContent)');
      audiencias.agregaron_carro = byName('PEYU · Agregaron al carro (AddToCart)');
    }

    const buyersId = audiencias.compradores?.id || null;
    const viewersId = audiencias.vieron_producto?.id || null;

    // Plan full-funnel con las exclusiones ya resueltas.
    const plan = [
      {
        etapa: 'TOFU · Adquisición (frío)',
        herramienta: 'metaAdsCreateAdvantagePlus',
        objetivo: 'Clientes NUEVOS — Andromeda busca audiencia. Es la base del volumen.',
        config_sugerida: { existing_customer_budget_pct: 10, conversion_event: 'PURCHASE', excluir_audiencias: buyersId ? [buyersId] : [] },
        nota: 'Advantage+ excluye compradores con existing_customer_budget_pct bajo; opcionalmente excluye también la audiencia de compradores.',
      },
      {
        etapa: 'MOFU · Retargeting de catálogo (tibio)',
        herramienta: 'metaAdsCatalog (action create_dpa, retargeting:true)',
        objetivo: 'A quien vio un producto y NO lo compró, mostrarle ESE producto. El anuncio que más convierte.',
        config_sugerida: { retargeting: true, retargeting_days: viewersDays, excluir_compradores: true },
        nota: 'La función DPA ya excluye Purchase dentro de la ventana. Cierra el embudo.',
      },
    ];

    return Response.json({
      ok: true,
      modo: crear ? 'audiencias_creadas' : 'solo_lectura',
      message: crear
        ? 'Embudo full-funnel listo: creé/reutilicé las 3 audiencias clave (compradores, vieron producto, agregaron al carro). Abajo el plan de 2 campañas con las exclusiones ya cableadas. Lánzalas con metaAdsCreateAdvantagePlus (TOFU) y metaAdsCatalog DPA retargeting (MOFU), todo en PAUSADO.'
        : 'Estado actual de las audiencias del embudo. Pasa crear:true para crear las que falten.',
      audiencias,
      audience_ids: { compradores: buyersId, vieron_producto: viewersId, agregaron_carro: audiencias.agregaron_carro?.id || null },
      plan_full_funnel: plan,
      ventanas: { compradores_dias: buyersDays, vieron_producto_dias: viewersDays, carro_dias: cartDays },
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});