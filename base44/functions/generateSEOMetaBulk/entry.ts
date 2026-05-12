import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateSEOMetaBulk
 * --------------------
 * Analiza productos activos (título + descripción + categoría + material)
 * y genera meta_title (50-60 chars) + meta_description (150-160 chars)
 * optimizados para SEO usando IA.
 *
 * Modos:
 *  - action: "preview" → solo genera sugerencias, NO escribe en DB.
 *  - action: "apply"   → aplica las sugerencias provistas en `suggestions`.
 *  - action: "generate_and_apply" → genera + aplica en un solo paso.
 *
 * Filtros:
 *  - only_missing: true → solo productos sin seo_meta_title/description.
 *  - product_ids: [...] → solo IDs específicos.
 *  - limit: número máximo a procesar (default 50).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      action = 'preview',
      only_missing = false,
      product_ids = null,
      limit = 50,
      suggestions = null,
    } = body;

    // ── APPLY: aplicar sugerencias provistas ──────────────────────────
    if (action === 'apply') {
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return Response.json({ error: 'suggestions[] requerido para action=apply' }, { status: 400 });
      }

      let applied = 0;
      const errors = [];
      const now = new Date().toISOString();

      for (const s of suggestions) {
        if (!s.id || !s.meta_title || !s.meta_description) continue;
        try {
          const current = await base44.asServiceRole.entities.Producto.filter({ id: s.id }, '', 1);
          const prev = current?.[0] || {};
          const history = Array.isArray(prev.seo_history) ? prev.seo_history : [];
          history.push({
            at: now,
            meta_title: s.meta_title,
            meta_description: s.meta_description,
            focus_keyword: s.focus_keyword || prev.seo_focus_keyword || '',
            score: prev.seo_score || 0,
            reason: 'bulk_ai_generation',
          });

          await base44.asServiceRole.entities.Producto.update(s.id, {
            seo_meta_title: s.meta_title,
            seo_meta_description: s.meta_description,
            seo_focus_keyword: s.focus_keyword || prev.seo_focus_keyword || '',
            seo_optimized_at: now,
            seo_history: history.slice(-20),
          });
          applied++;
        } catch (e) {
          errors.push({ id: s.id, error: e.message });
        }
      }

      return Response.json({ ok: true, applied, errors });
    }

    // ── PREVIEW / GENERATE_AND_APPLY: generar con IA ─────────────────
    let productos;
    if (product_ids && Array.isArray(product_ids) && product_ids.length > 0) {
      const all = await base44.asServiceRole.entities.Producto.list('nombre', 500);
      productos = all.filter(p => product_ids.includes(p.id));
    } else {
      productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, 'nombre', 500);
    }

    if (only_missing) {
      productos = productos.filter(p => !p.seo_meta_title || !p.seo_meta_description);
    }

    productos = productos.slice(0, Math.min(limit, 100));

    if (productos.length === 0) {
      return Response.json({ ok: true, suggestions: [], message: 'No hay productos que procesar' });
    }

    // Construir payload reducido para la IA
    const inputProducts = productos.map(p => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      material: p.material,
      descripcion: (p.descripcion || '').slice(0, 400),
      precio_b2c: p.precio_b2c,
      focus_keyword_actual: p.seo_focus_keyword || '',
    }));

    const prompt = `Eres un experto SEO especializado en e-commerce sustentable en Chile. Tu tarea es generar meta tags optimizados para Google para los siguientes productos de PEYU (marca chilena de productos sustentables hechos con plástico 100% reciclado y fibra de trigo compostable).

Para CADA producto genera:
1. **meta_title**: entre 50 y 60 caracteres. Debe incluir el nombre del producto, una palabra clave fuerte (ej: "reciclado", "sustentable", "compostable") y terminar con "| PEYU".
2. **meta_description**: entre 150 y 160 caracteres. Debe ser persuasiva, mencionar el material, beneficio sustentable y un CTA suave. No usar comillas dobles internas.
3. **focus_keyword**: 2-4 palabras clave principales para ese producto (en minúsculas, separadas por espacios).

REGLAS ESTRICTAS:
- NUNCA inventes precios, marcas externas, ni características que no estén en los datos.
- NO uses palabras como "barato" o "oferta" salvo que el producto lo amerite.
- Escribe en español chileno neutro, sin emojis.
- Respeta los límites de caracteres con precisión.

Productos a procesar:
${JSON.stringify(inputProducts, null, 2)}

Devuelve un JSON con un array "results" donde cada item tenga: id, meta_title, meta_description, focus_keyword.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                meta_title: { type: 'string' },
                meta_description: { type: 'string' },
                focus_keyword: { type: 'string' },
              },
              required: ['id', 'meta_title', 'meta_description', 'focus_keyword'],
            },
          },
        },
        required: ['results'],
      },
    });

    const results = (aiResponse?.results || []).map(r => {
      const original = productos.find(p => p.id === r.id);
      return {
        id: r.id,
        sku: original?.sku || '',
        nombre: original?.nombre || '',
        current_meta_title: original?.seo_meta_title || '',
        current_meta_description: original?.seo_meta_description || '',
        meta_title: r.meta_title?.trim() || '',
        meta_description: r.meta_description?.trim() || '',
        focus_keyword: r.focus_keyword?.trim() || '',
        meta_title_length: (r.meta_title || '').length,
        meta_description_length: (r.meta_description || '').length,
      };
    });

    // ── GENERATE_AND_APPLY: aplicar inmediatamente ────────────────────
    if (action === 'generate_and_apply') {
      let applied = 0;
      const errors = [];
      const now = new Date().toISOString();

      for (const s of results) {
        if (!s.meta_title || !s.meta_description) continue;
        try {
          const prev = productos.find(p => p.id === s.id) || {};
          const history = Array.isArray(prev.seo_history) ? prev.seo_history : [];
          history.push({
            at: now,
            meta_title: s.meta_title,
            meta_description: s.meta_description,
            focus_keyword: s.focus_keyword,
            score: prev.seo_score || 0,
            reason: 'bulk_ai_generation',
          });

          await base44.asServiceRole.entities.Producto.update(s.id, {
            seo_meta_title: s.meta_title,
            seo_meta_description: s.meta_description,
            seo_focus_keyword: s.focus_keyword,
            seo_optimized_at: now,
            seo_history: history.slice(-20),
          });
          applied++;
        } catch (e) {
          errors.push({ id: s.id, error: e.message });
        }
      }

      return Response.json({ ok: true, suggestions: results, applied, errors });
    }

    // ── PREVIEW: solo devolver sugerencias ────────────────────────────
    return Response.json({
      ok: true,
      suggestions: results,
      total: results.length,
      processed: productos.length,
    });
  } catch (error) {
    console.error('generateSEOMetaBulk error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});