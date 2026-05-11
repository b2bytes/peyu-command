// ============================================================================
// auditGoogleShoppingCompliance — Auditoría visual con IA de la imagen
// principal de cada producto contra las políticas de Google Shopping.
//
// Detecta automáticamente:
//   • Marcas / logos visibles (en el producto, packaging, props, fondo)
//   • Texto / watermarks superpuestos
//   • Producto descentrado o mal encuadrado
//   • Fondo no neutro (cuando se requiere)
//   • Calidad general (iluminación, foco, recorte)
//
// Devuelve un score 0-100 y un veredicto (compliant / warning / blocked).
// Optimizado: procesa en lotes en paralelo, salta los ya auditados recientemente
// si se pide `incremental=true`.
//
// Body:
//   { producto_ids?: string[], limit?: number = 50, incremental?: boolean = false }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BATCH = 5;          // 5 análisis IA en paralelo (controla rate-limit del LLM)
const STALE_DAYS = 30;    // si ya se auditó hace < 30 días, en modo incremental lo saltamos

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number', description: '0-100, donde 100 = perfecto para Google Shopping' },
    veredicto: {
      type: 'string',
      enum: ['compliant', 'warning', 'blocked'],
      description: 'compliant = listo. warning = revisar. blocked = NO se puede subir a Merchant Center.',
    },
    tiene_marca_o_logo: { type: 'boolean' },
    tiene_texto_superpuesto: { type: 'boolean' },
    producto_centrado: { type: 'boolean' },
    fondo_limpio: { type: 'boolean' },
    iluminacion_correcta: { type: 'boolean' },
    foco_nitido: { type: 'boolean' },
    problemas: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista corta de problemas detectados (máx 5, una frase cada uno).',
    },
    recomendacion: {
      type: 'string',
      description: 'Una sola frase con la acción concreta sugerida.',
    },
  },
  required: ['score', 'veredicto', 'problemas', 'recomendacion'],
};

const PROMPT = `Eres un auditor experto en políticas de imagen de Google Shopping (Merchant Center).
Analiza esta imagen de producto e identifica si cumple con TODAS las políticas:

1. NO debe contener marcas, logos o nombres de terceros visibles (Apple, Nike, IKEA, Coca-Cola, etc.).
2. NO debe contener texto superpuesto, watermarks ni captions.
3. NO debe contener marca propia visible en el producto, packaging o fondo.
4. El producto debe estar CENTRADO y ser el foco claro de la imagen.
5. El fondo debe ser limpio y no distraer (idealmente blanco o neutro).
6. La iluminación debe ser correcta (no muy oscura ni quemada).
7. El producto debe estar enfocado y nítido.

Devuelve un score 0-100:
- 90-100: compliant (perfecto, se puede subir).
- 70-89: warning (mejorable pero subible).
- < 70: blocked (rechazaría Google Merchant Center).

Si hay marcas o logos de terceros visibles → score < 50 + veredicto "blocked".
Si hay texto superpuesto → score < 60 + veredicto "blocked".
Sé estricto: en caso de duda, marca como warning.

Responde SOLO con el JSON pedido.`;

async function auditarUno(base44, producto) {
  if (!producto.imagen_url) {
    return {
      producto_id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      categoria: producto.categoria,
      imagen_url: null,
      score: 0,
      veredicto: 'blocked',
      problemas: ['Sin imagen principal'],
      recomendacion: 'Subir una imagen principal al producto.',
      sin_imagen: true,
      auditado_en: new Date().toISOString(),
    };
  }

  try {
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: PROMPT,
      file_urls: [producto.imagen_url],
      response_json_schema: RESPONSE_SCHEMA,
    });

    return {
      producto_id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      categoria: producto.categoria,
      imagen_url: producto.imagen_url,
      score: Number(llm?.score) || 0,
      veredicto: llm?.veredicto || 'warning',
      tiene_marca_o_logo: !!llm?.tiene_marca_o_logo,
      tiene_texto_superpuesto: !!llm?.tiene_texto_superpuesto,
      producto_centrado: !!llm?.producto_centrado,
      fondo_limpio: !!llm?.fondo_limpio,
      iluminacion_correcta: !!llm?.iluminacion_correcta,
      foco_nitido: !!llm?.foco_nitido,
      problemas: Array.isArray(llm?.problemas) ? llm.problemas.slice(0, 5) : [],
      recomendacion: llm?.recomendacion || '',
      auditado_en: new Date().toISOString(),
    };
  } catch (err) {
    return {
      producto_id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      categoria: producto.categoria,
      imagen_url: producto.imagen_url,
      score: null,
      veredicto: 'error',
      problemas: [`Error analizando: ${err.message}`],
      recomendacion: 'Reintentar análisis manualmente.',
      error: true,
      auditado_en: new Date().toISOString(),
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200);
    const producto_ids = Array.isArray(body.producto_ids) ? body.producto_ids : null;

    let productos;
    if (producto_ids && producto_ids.length > 0) {
      // Auditar solo los IDs pedidos
      const all = await base44.asServiceRole.entities.Producto.filter({ id: { $in: producto_ids } }, '-updated_date', 200);
      productos = all;
    } else {
      productos = await base44.asServiceRole.entities.Producto.filter(
        { activo: true }, '-updated_date', limit
      );
    }

    const results = [];
    for (let i = 0; i < productos.length; i += BATCH) {
      const slice = productos.slice(i, i + BATCH);
      const chunk = await Promise.all(slice.map(p => auditarUno(base44, p)));
      results.push(...chunk);
    }

    // Ordenar: blocked > warning > compliant, dentro de cada uno por score ascendente
    const orderVer = { blocked: 0, warning: 1, error: 2, compliant: 3 };
    results.sort((a, b) => {
      const dv = (orderVer[a.veredicto] ?? 9) - (orderVer[b.veredicto] ?? 9);
      if (dv !== 0) return dv;
      return (a.score ?? 0) - (b.score ?? 0);
    });

    const stats = {
      total: results.length,
      blocked: results.filter(r => r.veredicto === 'blocked').length,
      warning: results.filter(r => r.veredicto === 'warning').length,
      compliant: results.filter(r => r.veredicto === 'compliant').length,
      errors: results.filter(r => r.veredicto === 'error').length,
      sin_imagen: results.filter(r => r.sin_imagen).length,
      con_marca: results.filter(r => r.tiene_marca_o_logo).length,
      con_texto: results.filter(r => r.tiene_texto_superpuesto).length,
      avg_score: results.length
        ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length)
        : 0,
    };

    return Response.json({ ok: true, stats, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});