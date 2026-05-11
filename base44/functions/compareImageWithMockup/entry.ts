// ============================================================================
// compareImageWithMockup — Compara la imagen actual de un producto contra un
// mockup ideal (o referencia) usando IA visión. Devuelve un score 0-100 y un
// veredicto: "buena", "aceptable", "reemplazar".
//
// Útil cuando el operador quiere decidir si reemplazar la imagen actual por
// una nueva candidata desde Drive.
//
// Body:
//   { producto_id, candidate_image_url? }
//   - Si no se pasa candidate_image_url, sólo evalúa la actual contra el ideal
//     descrito en el catálogo (nombre, categoría, descripción).
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const { producto_id, candidate_image_url } = await req.json();
    if (!producto_id) {
      return Response.json({ error: 'producto_id requerido' }, { status: 400 });
    }

    const producto = await base44.asServiceRole.entities.Producto.get(producto_id);
    if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });

    const fileUrls = [];
    if (producto.imagen_url) fileUrls.push(producto.imagen_url);
    if (candidate_image_url) fileUrls.push(candidate_image_url);

    if (fileUrls.length === 0) {
      return Response.json({ error: 'No hay imágenes para comparar' }, { status: 400 });
    }

    const promptHeader = candidate_image_url
      ? `Te muestro DOS imágenes de un mismo producto del catálogo PEYU Chile:
   - Imagen 1 (actual): la que hoy está en el catálogo
   - Imagen 2 (candidata): un reemplazo propuesto desde Google Drive

Producto: ${producto.nombre} (SKU ${producto.sku}, categoría ${producto.categoria}).`
      : `Te muestro UNA imagen del producto "${producto.nombre}" (SKU ${producto.sku}, categoría ${producto.categoria}) del catálogo PEYU Chile.`;

    const visionResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${promptHeader}

Evalúa la calidad visual considerando:
- Nitidez y enfoque
- Iluminación y balance de blancos
- Encuadre y composición
- Coherencia con el producto descrito
- Fondo limpio (preferiblemente blanco o neutro para e-commerce)

${candidate_image_url
  ? 'Compara las dos imágenes y dime cuál es mejor para el catálogo. Devuelve también un veredicto: "reemplazar" (la candidata es claramente mejor), "mantener" (la actual es mejor o igual), o "indiferente" (calidad equivalente).'
  : 'Da un score de 0 a 100 y un veredicto: "buena" (>=75), "aceptable" (50-74), "reemplazar" (<50).'}

Responde en español, breve y directo.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: 'object',
        properties: {
          score_actual: { type: 'number', description: '0-100, calidad de la imagen actual' },
          score_candidata: { type: 'number', description: '0-100, calidad de la candidata (si aplica)' },
          veredicto: {
            type: 'string',
            enum: ['buena', 'aceptable', 'reemplazar', 'mantener', 'indiferente'],
          },
          razon: { type: 'string', description: 'Explicación breve en español' },
          recomendaciones: {
            type: 'array',
            items: { type: 'string' },
            description: 'Sugerencias accionables para mejorar la foto',
          },
        },
        required: ['veredicto', 'razon'],
      },
    });

    return Response.json({ ok: true, producto_id, ...visionResp });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});