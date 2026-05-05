// ============================================================================
// PEYU · discoverBacklinks
// ----------------------------------------------------------------------------
// Descubre backlinks reales de PEYU usando búsqueda en internet via InvokeLLM
// (gemini con add_context_from_internet=true).
//
// Estrategia: lanza una serie de queries dirigidas a medios chilenos
// (diarios, TV, prensa especializada, blogs sustentables) y guarda los hits
// como entidades Backlink. Deduplicación por URL.
//
// Ejecutable solo por admin. Idempotente (no duplica URLs ya guardadas).
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Queries específicas por canal — cada una busca menciones reales de PEYU
// en medios chilenos. Hechas pequeñas y dirigidas para que el LLM no alucine.
const QUERIES = [
  {
    label: 'Prensa nacional',
    prompt: 'Busca menciones, entrevistas, reportajes o artículos sobre la empresa chilena "PEYU" (peyuchile.cl) que recicla plástico para hacer regalos corporativos. Busca específicamente en: emol.com, latercera.com, biobiochile.cl, cooperativa.cl, df.cl, t13.cl, 24horas.cl, elmostrador.cl, cnnchile.com, meganoticias.cl, chvnoticias.cl, paiscircular.cl, diariosustentable.cl. Devuelve cada mención REAL como objeto con url, titulo, dominio, fecha (si aparece), extracto. NO inventes. Solo URLs que realmente existen.',
  },
  {
    label: 'Sustentabilidad / Economía circular',
    prompt: 'Busca menciones reales de la empresa chilena "PEYU" o "peyuchile" en sitios de sustentabilidad y economía circular en Chile: paiscircular.cl, fch.cl, sofofa.cl, construye2025.cl, hub-sustentabilidad.com, revistaei.cl, pactochilenodelosplasticos.cl, recyclapp.cl. Cada resultado: url, titulo, dominio, fecha si aparece, extracto. NO inventes URLs.',
  },
  {
    label: 'Blogs y directorios B2B',
    prompt: 'Busca menciones reales o linkbacks a peyuchile.cl o peyu.cl en blogs y directorios chilenos sobre regalos corporativos, sustentabilidad, emprendimiento. Ejemplos: tiendarevivir.cl, unsdg.cl, regalacorporativo.cl, startupchile.com, corfo.cl, sercotec.cl, pyme-rurales.cl, biobiochile.cl/blogs. Cada resultado: url, titulo, dominio, extracto. Solo URLs verificables.',
  },
  {
    label: 'YouTube / TV / Podcasts',
    prompt: 'Busca videos en YouTube y reportajes de TV chilena que mencionen a la empresa "PEYU" (reciclaje plástico, regalos corporativos, peyuchile). Canales: 24horas, MegaNoticias, Chilevisión, Canal13, CNN Chile, Tele13, BiobíoTV, BancoEstado, T13. Cada hit: url (link a video o nota), titulo, canal/dominio, fecha. Solo enlaces reales.',
  },
  {
    label: 'Redes sociales (menciones de terceros)',
    prompt: 'Busca posts, reels o videos en Instagram, TikTok, LinkedIn o Facebook donde otras cuentas (no @peyuchile) mencionen, etiqueten o linkeen a peyuchile.cl. Cuentas relevantes: empresas chilenas, influencers de sustentabilidad, BancoEstado, CNN Chile, medios. Cada hit: url, titulo, dominio (instagram.com/tiktok.com/etc), autor, extracto. Solo URLs reales.',
  },
];

const SCHEMA = {
  type: 'object',
  properties: {
    hits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          titulo: { type: 'string' },
          dominio: { type: 'string' },
          extracto: { type: 'string' },
          fecha_publicacion: { type: 'string' },
          autor: { type: 'string' },
        },
        required: ['url', 'titulo'],
      },
    },
  },
  required: ['hits'],
};

// ── Heurísticas para clasificar el dominio ───────────────────────────────────
const HIGH_AUTHORITY = [
  'emol.com', 'latercera.com', 'biobiochile.cl', 'cooperativa.cl',
  't13.cl', '24horas.cl', 'df.cl', 'elmostrador.cl', 'cnnchile.com',
  'meganoticias.cl', 'chvnoticias.cl', 'tele13.cl', 'paiscircular.cl',
  'sofofa.cl', 'corfo.cl', 'sercotec.cl', 'fch.cl', 'startupchile.com',
  'gob.cl', 'pulso.cl', 'duna.cl', 'adnradio.cl',
];
const SOCIAL = ['instagram.com', 'tiktok.com', 'facebook.com', 'youtube.com', 'linkedin.com', 'twitter.com', 'x.com'];

function classify(dominio = '') {
  const d = dominio.toLowerCase().replace(/^www\./, '');
  if (HIGH_AUTHORITY.some(h => d.endsWith(h))) {
    return { tipo: 'Prensa / Medio', categoria: 'Prensa', autoridad: 'Alta (Emol, T13, BioBio, gov)' };
  }
  if (SOCIAL.some(s => d.endsWith(s))) {
    let tipo = 'Otro';
    if (d.includes('instagram')) tipo = 'Instagram';
    else if (d.includes('tiktok')) tipo = 'TikTok';
    else if (d.includes('facebook')) tipo = 'Facebook';
    else if (d.includes('youtube')) tipo = 'YouTube';
    else if (d.includes('linkedin')) tipo = 'LinkedIn';
    return { tipo, categoria: 'Mención de terceros', autoridad: 'Media (Blogs, Medios nicho)' };
  }
  return { tipo: 'Blog', categoria: 'Mención de terceros', autoridad: 'Media (Blogs, Medios nicho)' };
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Permite invocación de admin (UI) o de scheduler interno (sin user).
    // Si hay user, debe ser admin. Si no hay user, asumimos scheduler/CRON.
    let user = null;
    try { user = await base44.auth.me(); } catch { /* CRON */ }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // 1. Cargar URLs ya existentes para deduplicar
    const existing = await base44.asServiceRole.entities.Backlink.list('-created_date', 1000);
    const existingUrls = new Set((existing || []).map(x => (x.url || '').replace(/\/$/, '')));

    // 2. Lanzar búsquedas en paralelo
    const results = await Promise.allSettled(
      QUERIES.map(q =>
        base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: q.prompt,
          add_context_from_internet: true,
          response_json_schema: SCHEMA,
          model: 'gemini_3_flash',
        }).then(r => ({ label: q.label, hits: r?.hits || [] }))
      )
    );

    // 3. Consolidar y deduplicar
    const allHits = [];
    const perQuery = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        perQuery.push({ label: r.value.label, count: r.value.hits.length });
        allHits.push(...r.value.hits.map(h => ({ ...h, _source: r.value.label })));
      } else {
        perQuery.push({ label: '?', count: 0, error: String(r.reason).slice(0, 200) });
      }
    }

    // Deduplicar por URL normalizada
    const seenUrls = new Set();
    const newBacklinks = [];
    for (const hit of allHits) {
      const url = (hit.url || '').trim().replace(/\/$/, '');
      if (!url || !url.startsWith('http')) continue;
      if (seenUrls.has(url) || existingUrls.has(url)) continue;
      seenUrls.add(url);

      const dominio = hit.dominio || extractDomain(url);
      // Filtro: ignorar resultados que no mencionan peyu en titulo/extracto/url
      const blob = `${url} ${hit.titulo || ''} ${hit.extracto || ''}`.toLowerCase();
      if (!blob.includes('peyu')) continue;

      const { tipo, categoria, autoridad } = classify(dominio);
      newBacklinks.push({
        url,
        titulo: (hit.titulo || '').slice(0, 200),
        extracto: (hit.extracto || '').slice(0, 800),
        dominio,
        tipo,
        categoria,
        autoridad,
        dofollow: false, // por defecto false (la mayoría son nofollow)
        idioma: 'Español',
        fecha_publicacion: hit.fecha_publicacion || '',
        estado: 'Sin verificar',
        notas: `Auto-descubierto vía ${hit._source}${hit.autor ? ` · @${hit.autor}` : ''}`,
      });
    }

    // 4. Guardar
    let createdCount = 0;
    if (newBacklinks.length) {
      await base44.asServiceRole.entities.Backlink.bulkCreate(newBacklinks);
      createdCount = newBacklinks.length;
    }

    // 5. Log en IndexationLog (si existe)
    try {
      await base44.asServiceRole.entities.IndexationLog.create({
        action_type: 'discover_backlinks',
        site_url: 'https://peyuchile.cl',
        status: 'success',
        response_summary: `Descubrió ${createdCount} backlinks nuevos en ${perQuery.length} queries`,
        meta: { perQuery, createdCount, totalExisting: existing.length },
      });
    } catch { /* tabla puede no existir */ }

    return Response.json({
      ok: true,
      created: createdCount,
      total_existing: existing.length,
      per_query: perQuery,
      sample: newBacklinks.slice(0, 5).map(b => ({ url: b.url, dominio: b.dominio, titulo: b.titulo })),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});