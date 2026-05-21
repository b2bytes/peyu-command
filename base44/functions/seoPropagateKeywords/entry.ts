// ============================================================================
// seoPropagateKeywords · Propaga las 9 keywords prioritarias de mayo-2026
// a productos del catálogo cuya categoría/nombre/SKU matchea con la temática.
// Regenera meta_title, meta_description, focus_keyword y opcionalmente
// description usando IA. Solo admin. Soporta dry_run para previsualizar.
// ----------------------------------------------------------------------------
// Mapeo keyword → patrones de matching:
//   organizador escritorio sustentable    → categoria=Escritorio | nombre~organizador|porta|lapicero|escritorio
//   carcasas iphone recicladas            → categoria=Carcasas B2C | nombre~carcasa|case|funda|iphone
//   macetero reciclado                    → nombre~macetero|maceta|planta
//   bandeja plástico reciclado            → nombre~bandeja|tray|servir
//   productos reciclados oficina          → categoria=Escritorio (fallback amplio)
//   merchandising sustentable             → canal incluye B2B
//   regalos sustentables                  → categoria=Hogar|Entretenimiento|Corporativo
//   regalos corporativos reciclados       → canal incluye B2B + tagline corporativo
//   regalos ecológicos chile              → genérico (fallback)
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const KEYWORD_MAP = [
  {
    keyword: 'organizador escritorio sustentable',
    categories: ['Escritorio'],
    nameRegex: /organizador|porta\s?l[áa]piz|lapicero|escritorio|desk/i,
    angle: 'organización del escritorio sostenible y oficina ordenada',
  },
  {
    keyword: 'carcasas iphone recicladas',
    categories: ['Carcasas B2C'],
    nameRegex: /carcasa|case|funda|iphone/i,
    angle: 'protección del iPhone con material reciclado chileno',
  },
  {
    keyword: 'macetero reciclado',
    nameRegex: /macetero|maceta|planta|jard[íi]n/i,
    angle: 'jardín en casa con materiales recuperados',
  },
  {
    keyword: 'bandeja plástico reciclado',
    nameRegex: /bandeja|tray|servir|porta\s?vaso/i,
    angle: 'bandejas y servidores reutilizables para hogar y oficina',
  },
  {
    keyword: 'productos reciclados oficina',
    categories: ['Escritorio', 'Corporativo'],
    angle: 'productos para oficina hechos con plástico reciclado',
  },
  {
    keyword: 'merchandising sustentable',
    canalRegex: /B2B/i,
    angle: 'merchandising corporativo con material reciclado certificado',
  },
  {
    keyword: 'regalos sustentables',
    categories: ['Hogar', 'Entretenimiento', 'Corporativo'],
    angle: 'regalo memorable con propósito ambiental',
  },
  {
    keyword: 'regalos corporativos reciclados',
    canalRegex: /B2B/i,
    angle: 'regalo corporativo con trazabilidad de plástico reciclado chileno',
  },
];

function findKeywordForProduct(p) {
  const nombre = (p.nombre || '').toLowerCase();
  for (const m of KEYWORD_MAP) {
    const catMatch = m.categories ? m.categories.includes(p.categoria) : true;
    const nameMatch = m.nameRegex ? m.nameRegex.test(nombre) : true;
    const canalMatch = m.canalRegex ? m.canalRegex.test(p.canal || '') : true;
    // Necesita al menos uno de los criterios específicos (no solo el catch-all true)
    const hasSpecific = !!(m.categories || m.nameRegex || m.canalRegex);
    if (hasSpecific && catMatch && nameMatch && canalMatch) {
      return m;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default true por seguridad
    const onlyMissing = body.only_missing === true; // solo productos sin meta_title
    const onlyNotPriority = body.only_not_priority === true; // solo los que aún NO tienen una keyword prioritaria
    const limit = Math.min(parseInt(body.limit, 10) || 100, 200);

    const PRIORITY_KEYWORDS = new Set(KEYWORD_MAP.map(m => m.keyword));

    const productos = await base44.asServiceRole.entities.Producto.list();
    const targets = [];

    for (const p of productos) {
      if (!p.activo) continue;
      if (onlyMissing && p.seo_meta_title) continue;
      if (onlyNotPriority && p.seo_focus_keyword && PRIORITY_KEYWORDS.has(p.seo_focus_keyword)) continue;
      const match = findKeywordForProduct(p);
      if (!match) continue;
      targets.push({ producto: p, match });
      if (targets.length >= limit) break;
    }

    const results = [];
    const errors = [];

    // Procesa en batches paralelos de 3 con pausa de 1s para evitar rate-limit del LLM
    const BATCH_SIZE = 3;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      if (i > 0) await new Promise(r => setTimeout(r, 1000));
      const batch = targets.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch.map(async (t) => {
        const { producto, match } = t;
        const prompt = `
Eres SEO senior de PEYU Chile (regalos sustentables de plástico 100% reciclado).

PRODUCTO:
- Nombre: ${producto.nombre}
- SKU: ${producto.sku}
- Categoría: ${producto.categoria}
- Material: ${producto.material}
- Canal: ${producto.canal}
- Descripción actual: ${(producto.descripcion || '').slice(0, 200)}

KEYWORD PRIORITARIA OBJETIVO: "${match.keyword}"
ÁNGULO: ${match.angle}

Genera SEO optimizado para Google.cl:
1. meta_title (50-60 chars EXACTOS): debe empezar con la keyword prioritaria si es natural, incluir el nombre del producto, y terminar con "| PEYU"
2. meta_description (140-158 chars): incluye keyword + beneficio + CTA implícito. Menciona "plástico 100% reciclado" y "Chile".
3. focus_keyword: la keyword prioritaria exacta.

Tono: profesional pero cercano, chileno (no español-españa). Evita "comprar" repetido, no exageres ("el mejor"), prioriza intención de búsqueda real.
`;
        const aiRes = await base44.integrations.Core.InvokeLLM({
          prompt,
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

        const change = {
          id: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          categoria: producto.categoria,
          target_keyword: match.keyword,
          meta_title: aiRes.meta_title,
          meta_title_length: aiRes.meta_title.length,
          meta_description: aiRes.meta_description,
          meta_description_length: aiRes.meta_description.length,
          focus_keyword: aiRes.focus_keyword,
          previous_meta_title: producto.seo_meta_title || null,
          previous_meta_description: producto.seo_meta_description || null,
          applied: false,
        };

        if (!dryRun) {
          const history = Array.isArray(producto.seo_history) ? producto.seo_history : [];
          await base44.asServiceRole.entities.Producto.update(producto.id, {
            seo_meta_title: aiRes.meta_title,
            seo_meta_description: aiRes.meta_description,
            seo_focus_keyword: aiRes.focus_keyword,
            seo_optimized_at: new Date().toISOString(),
            seo_history: [
              ...history,
              {
                at: new Date().toISOString(),
                meta_title: aiRes.meta_title,
                meta_description: aiRes.meta_description,
                focus_keyword: aiRes.focus_keyword,
                reason: `propagación keyword prioritaria: "${match.keyword}"`,
              },
            ].slice(-20),
          });
          change.applied = true;
        }

        return change;
      }));

      batchResults.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          results.push(r.value);
        } else {
          errors.push({ sku: batch[idx].producto.sku, error: r.reason?.message || String(r.reason) });
        }
      });
    }

    // Agrupar por keyword para reporte
    const byKeyword = {};
    for (const r of results) {
      byKeyword[r.target_keyword] = (byKeyword[r.target_keyword] || 0) + 1;
    }

    return Response.json({
      ok: true,
      dry_run: dryRun,
      total_products_scanned: productos.length,
      matched_products: targets.length,
      optimized: results.length,
      errors: errors.length,
      by_keyword: byKeyword,
      changes: results,
      errors_detail: errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});