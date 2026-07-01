import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// composeHeroSlide — Compone un slide del carrusel del home.
// Recorta el producto de su foto original (quita el fondo blanco con IA, SIN
// alterar los colores del producto) y lo coloca DETRÁS un fondo de diseño.
// Guarda el resultado en HeroCarruselSlide.imagen_carrusel_url — NO toca el
// catálogo (Producto.imagen_url queda intacto).
//
// Payload: { sku, cat, nombre, producto_url, fondo_url }
// ════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { sku, cat, nombre, producto_url, fondo_url } = await req.json();
    if (!sku || !producto_url || !fondo_url) {
      return Response.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // 1) Recortar el producto (quitar fondo) y componerlo sobre el fondo de
    //    diseño usando edición de imagen por IA. La instrucción es explícita:
    //    NO cambiar el producto, solo reemplazar el fondo detrás de él.
    const prompt =
      'Replace ONLY the background of this product photo. Keep the product EXACTLY as it is — ' +
      'same colors, same shape, same lighting, same shadows, do not recolor or filter the product in any way. ' +
      'Remove the original plain/white background and place the product on this new decorative studio backdrop: ' +
      'a soft warm-toned gradient background. The product must remain crisp and untouched in the foreground, ' +
      'centered, with a subtle natural contact shadow. Square 1:1 composition, clean e-commerce hero look.';

    const result = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: [producto_url, fondo_url],
    });
    const finalUrl = result?.url;
    if (!finalUrl) return Response.json({ error: 'No se generó la imagen' }, { status: 500 });

    // 2) Upsert del slide (NO toca Producto).
    const existing = await base44.asServiceRole.entities.HeroCarruselSlide.filter({ sku }, undefined, 1);
    if (existing?.[0]) {
      await base44.asServiceRole.entities.HeroCarruselSlide.update(existing[0].id, {
        cat, nombre, imagen_carrusel_url: finalUrl,
      });
    } else {
      await base44.asServiceRole.entities.HeroCarruselSlide.create({
        sku, cat, nombre, imagen_carrusel_url: finalUrl,
      });
    }

    return Response.json({ ok: true, imagen_carrusel_url: finalUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});