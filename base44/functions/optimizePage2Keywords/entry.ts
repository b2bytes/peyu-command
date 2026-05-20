// ============================================================================
// optimizePage2Keywords · Optimiza meta tags para queries atascadas en página 2
// ----------------------------------------------------------------------------
// Flujo:
//   1. Pide a GSC las queries en posición 11-20 de los últimos N días.
//   2. Para cada query, pide a GSC la URL principal que rankea (top page).
//   3. Si la URL es /producto/:id, identifica el producto.
//   4. Llama a generateSEOMetaBulk con esos product_ids, inyectando las queries
//      como keyword hints en el prompt para que la IA priorice esas frases.
//   5. Devuelve resumen: queries detectadas, productos optimizados, errores.
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
    const days = Math.min(Math.max(parseInt(body.days || 28, 10), 1), 90);
    const country = (body.country || 'chl').toLowerCase();
    const site = 'sc-domain:peyuchile.cl';
    const dryRun = body.dry_run === true;

    // ── 1. Token GSC ──────────────────────────────────────────────────
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 3600 * 1000);
    const fmt = d => d.toISOString().slice(0, 10);

    // ── 2. Queries en posición 11-20 ──────────────────────────────────
    const queryListRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 100,
          dataState: 'all',
          dimensionFilterGroups: country !== 'all' ? [{
            filters: [{ dimension: 'country', operator: 'equals', expression: country }],
          }] : [],
        }),
      }
    );

    if (!queryListRes.ok) {
      const err = await queryListRes.text();
      return Response.json({ error: `GSC queries: ${err}` }, { status: 500 });
    }

    const queryData = await queryListRes.json();
    const page2Queries = (queryData.rows || [])
      .map(r => ({
        query: r.keys?.[0] || '',
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        position: r.position || 999,
        ctr: r.ctr || 0,
      }))
      .filter(q => q.position > 10 && q.position <= 20)
      .sort((a, b) => b.impressions - a.impressions);

    if (page2Queries.length === 0) {
      return Response.json({ ok: true, page2_queries: [], optimized: 0, message: 'No hay queries en página 2' });
    }

    // Limitar a top 15 por impresiones para evitar timeout
    const queriesToProcess = page2Queries.slice(0, 15);

    // ── 3. Obtener URL top de cada query EN PARALELO ──────────────────
    const queryToUrl = await Promise.all(queriesToProcess.map(async (q) => {
      try {
        const pageRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: fmt(startDate),
              endDate: fmt(endDate),
              dimensions: ['page'],
              rowLimit: 1,
              dataState: 'all',
              dimensionFilterGroups: [{
                filters: [
                  { dimension: 'query', operator: 'equals', expression: q.query },
                  ...(country !== 'all' ? [{ dimension: 'country', operator: 'equals', expression: country }] : []),
                ],
              }],
            }),
          }
        );
        if (!pageRes.ok) return { ...q, url: null };
        const data = await pageRes.json();
        return { ...q, url: data.rows?.[0]?.keys?.[0] || null };
      } catch {
        return { ...q, url: null };
      }
    }));

    // ── 4. Mapear URLs a productos ─────────────────────────────────────
    // Las URLs de GSC vienen del WordPress legacy con slugs (ej:
    // /producto/carcasa-para-iphone-11/), no con el id Base44. Por eso
    // matcheamos el slug contra el nombre del producto normalizado.
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, 'nombre', 500);

    const normalize = s => (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Index: slug -> producto
    const slugMap = new Map();
    for (const p of productos) {
      slugMap.set(normalize(p.nombre), p);
      if (p.sku) slugMap.set(normalize(p.sku), p);
    }

    // Agrupar queries por producto
    const productKeywords = new Map(); // id -> { producto, queries[] }
    const orphanQueries = [];

    for (const q of queryToUrl) {
      if (!q.url) { orphanQueries.push(q); continue; }
      const match = q.url.match(/\/producto\/([^/?#]+)/);
      if (!match) { orphanQueries.push(q); continue; }
      const slug = match[1].replace(/\/$/, '').toLowerCase();

      // 1. Match exacto
      let producto = slugMap.get(slug);
      // 2. Match parcial: slug del producto contenido en slug GSC o viceversa
      if (!producto) {
        for (const [key, p] of slugMap.entries()) {
          if (key.length < 6) continue; // evitar matches triviales
          if (slug.includes(key) || key.includes(slug)) { producto = p; break; }
        }
      }
      if (!producto) { orphanQueries.push({ ...q, slug_gsc: slug }); continue; }
      const id = producto.id;
      if (!productKeywords.has(id)) productKeywords.set(id, { producto, queries: [] });
      productKeywords.get(id).queries.push(q);
    }

    if (productKeywords.size === 0) {
      return Response.json({
        ok: true,
        page2_queries: queryToUrl,
        orphan_queries: orphanQueries,
        optimized: 0,
        message: 'Ninguna query de página 2 mapea a un producto del catálogo',
      });
    }

    // ── 5. Generar meta tags con IA EN PARALELO ────────────────────────
    const optimizations = [];
    const errors = [];
    const now = new Date().toISOString();

    const tasks = Array.from(productKeywords.entries()).map(async ([id, { producto, queries }]) => {
      try {
        const topQueries = queries.map(q => q.query).slice(0, 5);
        const prompt = `Eres experto SEO de e-commerce sustentable en Chile. Vas a regenerar meta tags de un producto de PEYU (marca chilena de productos hechos con plástico 100% reciclado y fibra de trigo compostable) para EMPUJARLO de página 2 a página 1 en Google Chile.

Producto:
- Nombre: ${producto.nombre}
- SKU: ${producto.sku}
- Categoría: ${producto.categoria || 'sin categoría'}
- Material: ${producto.material || 'reciclado'}
- Precio B2C: ${producto.precio_b2c || 'N/A'} CLP
- Descripción actual: ${(producto.descripcion || '').slice(0, 400)}

CRÍTICO — Queries reales donde ya aparece en posición 11-20 (DEBES priorizar incluirlas naturalmente):
${topQueries.map((q, i) => `${i + 1}. "${q}" (pos ${queries[i].position.toFixed(1)}, ${queries[i].impressions} impresiones)`).join('\n')}

Genera:
1. **meta_title**: 50-60 chars. Incluye la query #1 textual al inicio si es posible, palabra clave sustentable, y termina con "| PEYU".
2. **meta_description**: 150-160 chars. Persuasiva, menciona material reciclado/sustentable, incluye al menos otra query de la lista, CTA suave.
3. **focus_keyword**: la query #1 (la de más impresiones), normalizada en minúsculas.

REGLAS:
- No inventes precios ni características fuera de los datos.
- No uses "barato" ni "oferta".
- Español chileno neutro, sin emojis ni comillas dobles internas.
- Respeta límites exactos de caracteres.

Devuelve JSON: { meta_title, meta_description, focus_keyword }`;

        const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          model: 'gpt_5_mini',
          response_json_schema: {
            type: 'object',
            properties: {
              meta_title: { type: 'string' },
              meta_description: { type: 'string' },
              focus_keyword: { type: 'string' },
            },
            required: ['meta_title', 'meta_description', 'focus_keyword'],
          },
        });

        const suggestion = {
          id: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          queries_target: topQueries,
          current_meta_title: producto.seo_meta_title || '',
          current_meta_description: producto.seo_meta_description || '',
          meta_title: (aiRes?.meta_title || '').trim(),
          meta_description: (aiRes?.meta_description || '').trim(),
          focus_keyword: (aiRes?.focus_keyword || '').trim(),
          meta_title_length: (aiRes?.meta_title || '').length,
          meta_description_length: (aiRes?.meta_description || '').length,
        };

        // Aplicar si no es dry_run
        if (!dryRun && suggestion.meta_title && suggestion.meta_description) {
          const history = Array.isArray(producto.seo_history) ? producto.seo_history : [];
          history.push({
            at: now,
            meta_title: suggestion.meta_title,
            meta_description: suggestion.meta_description,
            focus_keyword: suggestion.focus_keyword,
            score: producto.seo_score || 0,
            reason: `page2_optimization · queries: ${topQueries.slice(0, 3).join(', ')}`,
          });

          await base44.asServiceRole.entities.Producto.update(producto.id, {
            seo_meta_title: suggestion.meta_title,
            seo_meta_description: suggestion.meta_description,
            seo_focus_keyword: suggestion.focus_keyword,
            seo_optimized_at: now,
            seo_history: history.slice(-20),
          });
          suggestion.applied = true;
        } else {
          suggestion.applied = false;
        }

        optimizations.push(suggestion);
      } catch (e) {
        errors.push({ producto_id: id, sku: producto.sku, error: e.message });
      }
    });

    await Promise.all(tasks);

    return Response.json({
      ok: true,
      window_days: days,
      page2_queries_total: page2Queries.length,
      products_optimized: optimizations.filter(o => o.applied).length,
      products_processed: optimizations.length,
      orphan_queries: orphanQueries, // queries sin producto mapeado (categorías, blog, home)
      optimizations,
      errors,
      dry_run: dryRun,
    });
  } catch (error) {
    console.error('optimizePage2Keywords error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});