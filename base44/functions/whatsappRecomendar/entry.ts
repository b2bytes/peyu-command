import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// whatsappRecomendar — Recomendaciones de productos con IA para WhatsApp.
// ----------------------------------------------------------------------------
// El agente llama esta función cuando el cliente dice algo vago como "quiero
// un regalo" o "algo para mi oficina". Usa InvokeLLM para analizar la intención
// y recomienda los 3 productos mejores del catálogo real, con razón de cada uno.
//
// Payload: { mensaje_cliente, presupuesto_max?, para_quien? }
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { mensaje_cliente, presupuesto_max, para_quien } = await req.json().catch(() => ({}));

    if (!mensaje_cliente) {
      return Response.json({ error: 'Indica mensaje_cliente (lo que dijo el cliente).' }, { status: 400 });
    }

    // Traer catálogo activo con stock
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 60);
    const catalogoCompacto = productos.map(p => ({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria_v2 || p.categoria,
      precio: p.precio_b2c,
      stock: p.stock_actual,
      colores: (p.colores?.length ? p.colores : (p.colores_v2 || [])).slice(0, 4),
      incluye: (p.incluye_v2 || p.incluye || '').slice(0, 120),
      personalizable: !!p.area_laser_mm,
      foto: p.imagen_url ? 'si' : 'no',
    }));

    // LLM recomienda
    const prompt = `Eres un asesor de ventas de PEYU Chile (marca sustentable, plástico reciclado). 
Un cliente dijo por WhatsApp: "${mensaje_cliente}"
${presupuesto_max ? `Presupuesto máximo: $${presupuesto_max} CLP.` : ''}
${para_quien ? `Es para: ${para_quien}.` : ''}

Catálogo disponible (JSON):
${JSON.stringify(catalogoCompacto)}

Recomienda los 3 productos MEJORES para este cliente. Para cada uno da:
- sku (EXACTO del catálogo)
- nombre
- precio
- razon: 1 línea de por qué le sirve (en español chileno, cálido, máximo 80 chars)

Devuelve SOLO un JSON: {"recomendaciones":[{"sku","nombre","precio","razon","foto_url"}]}`;
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recomendaciones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                nombre: { type: 'string' },
                precio: { type: 'number' },
                razon: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Mapear foto_url real desde el catálogo
    const recomendaciones = (llmRes.recomendaciones || []).map(r => {
      const prod = productos.find(p => p.sku === r.sku);
      return {
        sku: r.sku,
        nombre: r.nombre,
        precio: r.precio,
        razon: r.razon,
        foto_url: prod?.imagen_url || null,
        stock: prod?.stock_actual ?? null,
        colores: prod?.colores?.length ? prod.colores : (prod?.colores_v2 || []),
        personalizable: !!prod?.area_laser_mm,
      };
    }).filter(r => r.foto_url); // solo productos con foto

    return Response.json({
      ok: true,
      count: recomendaciones.length,
      recomendaciones,
      nota: recomendaciones.length === 0
        ? 'La IA no pudo recomendar. Pide más detalles al cliente y reintenta.'
        : 'Envía cada producto con su foto_url en línea aparte + la razon como texto.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});