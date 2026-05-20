// ============================================================================
// exploreKeywordOpportunities · Mix Semillas + IA expande + GSC verifica
// ----------------------------------------------------------------------------
// Flujo:
//   1) Toma semillas del usuario (ej: "regalos sustentables").
//   2) IA expande cada una con ~8 variantes chilenas relevantes para PEYU.
//   3) Para cada keyword (semilla + variantes), consulta GSC con filtro
//      query=equals para obtener la posición promedio real en Google Chile.
//   4) Clasifica cada keyword:
//      - top3       → ya estamos primeros (1-3)
//      - top10      → primera página (4-10)
//      - page2      → segunda página (11-20)
//      - deep       → 21-100
//      - opportunity→ Google nunca nos mostró = no rankeamos
// ----------------------------------------------------------------------------
// Body: { seeds: string[], variants_per_seed?: number, days?: number }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const seeds = Array.isArray(body.seeds) ? body.seeds.map(s => String(s).trim()).filter(Boolean) : [];
    const variantsPerSeed = Math.min(Math.max(parseInt(body.variants_per_seed || 8, 10), 3), 15);
    const days = Math.min(Math.max(parseInt(body.days || 90, 10), 28), 180);

    if (seeds.length === 0) {
      return Response.json({ error: 'Debes enviar al menos una semilla en `seeds`.' }, { status: 400 });
    }
    if (seeds.length > 20) {
      return Response.json({ error: 'Máximo 20 semillas por llamada.' }, { status: 400 });
    }

    // ── 1. Expandir semillas con IA ─────────────────────────────────────────
    const expandPrompt = `Eres un experto SEO de e-commerce chileno. PEYU es una marca chilena de productos sustentables hechos con plástico 100% reciclado y fibra de trigo compostable. Vende productos de escritorio, hogar, entretenimiento, carcasas para celulares y regalos corporativos personalizables (grabado láser para empresas).

Tu tarea: para cada SEMILLA de keyword, genera EXACTAMENTE ${variantsPerSeed} variantes realistas que un comprador chileno (B2C o B2B) escribiría en Google.cl al buscar este tipo de producto.

Reglas:
- Variantes con modificadores chilenos: "Chile", "Santiago", "empresa", "oficina", "regalo", "personalizado", "reciclado", "sustentable", "ecológico", "corporativo".
- Combinaciones de long-tail con intención clara (informacional o comercial).
- Nada de plurales triviales (no me sirvas "regalos sustentable" y "regalos sustentables" como variantes distintas).
- Español neutro chileno, en minúsculas, sin tildes mal puestas.
- No incluyas la semilla original en las variantes.

Semillas:
${seeds.map((s, i) => `${i + 1}. "${s}"`).join('\n')}

Devuelve JSON con esta estructura exacta:
{
  "expansions": [
    { "seed": "semilla original", "variants": ["variante 1", "variante 2", ...] }
  ]
}`;

    const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: expandPrompt,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          expansions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                seed: { type: 'string' },
                variants: { type: 'array', items: { type: 'string' } },
              },
              required: ['seed', 'variants'],
            },
          },
        },
        required: ['expansions'],
      },
    });

    const expansions = aiRes?.expansions || [];
    // Aplanar a lista única (semilla + variantes), deduplicada
    const allKeywords = new Map(); // keyword -> seed
    for (const exp of expansions) {
      const seed = exp.seed || '';
      // semilla original
      if (seed && !allKeywords.has(seed.toLowerCase())) {
        allKeywords.set(seed.toLowerCase(), seed);
      }
      for (const v of (exp.variants || [])) {
        const norm = String(v).trim().toLowerCase();
        if (norm && !allKeywords.has(norm)) {
          allKeywords.set(norm, String(v).trim());
        }
      }
    }
    // Asegurarse de incluir semillas que la IA olvidó
    for (const s of seeds) {
      const norm = s.toLowerCase();
      if (!allKeywords.has(norm)) allKeywords.set(norm, s);
    }

    const keywordList = Array.from(allKeywords.values());

    // ── 2. Consultar GSC en paralelo con filtro exacto por query ────────────
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 3600 * 1000);
    const fmt = d => d.toISOString().slice(0, 10);
    const site = 'sc-domain:peyuchile.cl';

    const gscUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;

    // Limitamos concurrencia para no saturar la API GSC (~10 simultáneas).
    const CONCURRENCY = 10;
    const results = [];
    for (let i = 0; i < keywordList.length; i += CONCURRENCY) {
      const batch = keywordList.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(async (kw) => {
        try {
          const res = await fetch(gscUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: fmt(startDate),
              endDate: fmt(endDate),
              dimensions: ['query'],
              rowLimit: 1,
              dataState: 'all',
              dimensionFilterGroups: [{
                filters: [
                  { dimension: 'query', operator: 'equals', expression: kw.toLowerCase() },
                  { dimension: 'country', operator: 'equals', expression: 'chl' },
                ],
              }],
            }),
          });
          if (!res.ok) return { keyword: kw, error: `GSC ${res.status}`, status: 'error' };
          const data = await res.json();
          const row = data.rows?.[0];
          if (!row) {
            // Google NUNCA nos mostró para esta búsqueda → oportunidad pura
            return {
              keyword: kw,
              position: null,
              impressions: 0,
              clicks: 0,
              ctr: 0,
              status: 'opportunity',
            };
          }
          const position = row.position || 999;
          let status = 'deep';
          if (position <= 3)      status = 'top3';
          else if (position <= 10) status = 'top10';
          else if (position <= 20) status = 'page2';
          return {
            keyword: kw,
            position,
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr || 0,
            status,
          };
        } catch (e) {
          return { keyword: kw, error: e.message, status: 'error' };
        }
      }));
      results.push(...batchResults);
    }

    // ── 3. Re-asociar cada resultado a su semilla original ──────────────────
    const seedMap = new Map(); // keyword normalizada -> seed
    for (const exp of expansions) {
      const seed = exp.seed || '';
      if (seed) seedMap.set(seed.toLowerCase(), seed);
      for (const v of (exp.variants || [])) {
        const norm = String(v).trim().toLowerCase();
        if (norm && !seedMap.has(norm)) seedMap.set(norm, seed);
      }
    }
    for (const r of results) {
      r.parent_seed = seedMap.get(r.keyword.toLowerCase()) || null;
    }

    // ── 4. Resumen por bucket ───────────────────────────────────────────────
    const summary = {
      total: results.length,
      top3: results.filter(r => r.status === 'top3').length,
      top10: results.filter(r => r.status === 'top10').length,
      page2: results.filter(r => r.status === 'page2').length,
      deep: results.filter(r => r.status === 'deep').length,
      opportunity: results.filter(r => r.status === 'opportunity').length,
      error: results.filter(r => r.status === 'error').length,
    };

    return Response.json({
      ok: true,
      window_days: days,
      seeds,
      variants_per_seed: variantsPerSeed,
      summary,
      keywords: results,
    });
  } catch (error) {
    console.error('exploreKeywordOpportunities error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});