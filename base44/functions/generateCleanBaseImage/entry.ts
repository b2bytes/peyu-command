import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// generateCleanBaseImage — Genera la versión "base limpia" de la foto de un
// producto: la MISMA foto pero SIN el logo PEYU grabado en la superficie,
// reconstruyendo la textura/color del material donde estaba la marca.
// ----------------------------------------------------------------------------
// Se usa como lienzo del personalizador: el logo del cliente se compone sobre
// esta base limpia, así nunca quedan dos logos superpuestos.
//
// Guarda el resultado en Producto.imagen_base_limpia_url (idempotente: si ya
// existe y force!==true, lo devuelve sin regenerar).
//
// Payload: { productoId } o { sku }  (+ force opcional)
// Auth: admin o secret interno (MADRE_V2_SECRET).
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { productoId, sku, force } = body;

    // Auth: admin logueado o secret interno. EXCEPCIÓN: visitantes del shop
    // pueden gatillar la generación AUTOMÁTICA (idempotente: solo si el
    // producto aún no tiene base limpia). Regenerar con force sigue siendo
    // exclusivo de admin/interno.
    const internalSecret = req.headers.get('x-internal-secret');
    const isInternal = internalSecret && internalSecret === Deno.env.get('MADRE_V2_SECRET');
    if (!isInternal) {
      const user = await base44.auth.me().catch(() => null);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin && force) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Buscar producto
    let producto = null;
    if (productoId) {
      const list = await base44.asServiceRole.entities.Producto.filter({ id: productoId });
      producto = list?.[0] || null;
    } else if (sku) {
      const list = await base44.asServiceRole.entities.Producto.filter({ sku });
      producto = list?.[0] || null;
    }
    if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });

    // Idempotencia
    if (producto.imagen_base_limpia_url && !force) {
      return Response.json({
        success: true,
        cached: true,
        clean_url: producto.imagen_base_limpia_url,
        producto_id: producto.id,
      });
    }

    const sourceUrl = producto.imagen_url
      || (Array.isArray(producto.galeria_urls) ? producto.galeria_urls[0] : null);
    if (!sourceUrl) return Response.json({ error: 'El producto no tiene imagen base' }, { status: 400 });

    const prompt = `This is a product photo of "${producto.nombre}" by Peyu Chile, made of recycled marbled plastic. ` +
      `The product surface currently has the "PEYU" brand logo laser-engraved on it. ` +
      `TASK: Remove the PEYU brand logo/engraving completely and reconstruct the surface where it was, ` +
      `so that area shows ONLY the clean natural marbled recycled-plastic material with the same color, texture and lighting as the rest of the surface — as if no logo was ever engraved. ` +
      `Keep EVERYTHING else identical: same product, same shape, same color, same angle, same background, same lighting, same framing. ` +
      `Do NOT add any new text, logo or mark. The engraving area must look blank and natural. Photorealistic output.`;

    let result = null;
    for (let i = 0; i < 2; i++) {
      try {
        result = await base44.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: [sourceUrl],
        });
        if (result?.url) break;
      } catch (e) {
        console.error(`GenerateImage falló (intento ${i + 1}):`, e?.message);
      }
      if (i === 0) await new Promise(r => setTimeout(r, 800));
    }

    if (!result?.url) {
      return Response.json({ error: 'No se pudo generar la base limpia tras varios intentos' }, { status: 502 });
    }

    await base44.asServiceRole.entities.Producto.update(producto.id, {
      imagen_base_limpia_url: result.url,
    });

    return Response.json({
      success: true,
      cached: false,
      clean_url: result.url,
      producto_id: producto.id,
      sku: producto.sku,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});