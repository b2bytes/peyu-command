// ============================================================================
// PEYU · generateProductPromoImage
// ----------------------------------------------------------------------------
// Genera una imagen promocional cuadrada (1:1) lista para redes sociales:
//   - Toma la imagen principal del producto como referencia visual
//   - Construye un prompt premium con branding PEYU (verde corporativo, copy
//     sustentable, espacio para textos sobre fondo)
//   - Llama a Core.GenerateImage (DALL-E / Gemini detrás)
//   - Guarda la URL en `imagen_promo_url` y la suma a `galeria_urls`
//
// Modos de invocación:
//   A) Manual (frontend):    POST { producto_id }
//   B) Entity automation:    payload con event.type = 'create' y data = producto
//
// Contrato de respuesta: { success, producto_id, imagen_promo_url, message }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PEYU_BRAND = {
  green: '#0F8B6C',
  arena: '#E7D8C6',
  terracota: '#D96B4D',
};

// Construye el prompt en inglés (mejor calidad) preservando producto + ADN PEYU.
function buildPromoPrompt(p) {
  const materialEn = p.material?.includes('Trigo')
    ? 'compostable wheat fiber'
    : '100% recycled plastic';

  const categoriaEn = ({
    'Escritorio': 'desk accessory',
    'Hogar': 'home product',
    'Entretenimiento': 'entertainment item',
    'Corporativo': 'corporate gift',
    'Carcasas B2C': 'phone case',
  })[p.categoria] || 'sustainable product';

  return `Premium social media promotional image (1:1 square format) for "${p.nombre}", a ${categoriaEn} made from ${materialEn} by PEYU Chile.

CRITICAL — PRESERVE THE PRODUCT EXACTLY:
- The product must look IDENTICAL to the reference image: same shape, exact same color, same material texture, same proportions, same details.
- Do not redesign, restyle or recolor the product. Keep it as the clear hero of the composition.

COMPOSITION:
- The product takes the LEFT 50% of the frame, centered vertically, sharp focus.
- The RIGHT 50% is intentional negative space (clean, uncluttered) where social-media copy can be added later. Do NOT add any text, logo, watermark, or graphic to this area — just clean background.
- Soft natural daylight, premium product photography aesthetic, magazine-quality.

PEYU BRAND PALETTE (use as background / accents):
- Primary: deep emerald green ${PEYU_BRAND.green}
- Secondary: warm sand beige ${PEYU_BRAND.arena}
- Accent (subtle, max 5%): terracotta ${PEYU_BRAND.terracota}
- Background should evoke sustainability: gradient of these brand colors, or natural eco surface (linen, recycled paper, wood) tinted with the brand greens.

MOOD & STYLE:
- Eco-luxury, Scandinavian-Chilean fusion, optimistic and premium.
- Subtle organic shadows, no harsh lighting.
- 4K resolution, photorealistic, suitable for Instagram feed and LinkedIn corporate posts.
- ABSOLUTELY NO text, NO PEYU logo, NO watermark, NO captions in the image (text is added later in design tools).`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // ── Resolver el producto: viene del payload (manual) o del event (auto) ──
    let producto;
    let producto_id = body.producto_id;

    if (body.event?.type && body.data) {
      // Entity automation: data es el producto
      producto = body.data;
      producto_id = producto.id;
      // Si la creación viene SIN imagen principal, no podemos generar una promo
      // que preserve el producto → salimos sin error.
      if (!producto.imagen_url) {
        return Response.json({
          success: false,
          skipped: true,
          message: 'Producto creado sin imagen_url — promo image diferida hasta que se cargue una imagen principal.',
        });
      }
    } else {
      // Llamada manual: requiere admin
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!producto_id) {
        return Response.json({ error: 'producto_id required' }, { status: 400 });
      }
      producto = await base44.asServiceRole.entities.Producto.get(producto_id);
      if (!producto) {
        return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
      }
      if (!producto.imagen_url) {
        return Response.json({
          error: 'El producto no tiene imagen principal. Carga una imagen antes de generar la promo.',
        }, { status: 400 });
      }
    }

    // ── Generar imagen con referencia al producto real ──────────────────
    const prompt = buildPromoPrompt(producto);
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: [producto.imagen_url],
    });

    const imageUrl = result?.url;
    if (!imageUrl) {
      return Response.json({
        success: false,
        error: 'GenerateImage no devolvió URL',
        raw: result,
      }, { status: 500 });
    }

    // ── Persistir en el producto (campo dedicado + galería) ─────────────
    const galeriaActual = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
    await base44.asServiceRole.entities.Producto.update(producto_id, {
      imagen_promo_url: imageUrl,
      imagen_promo_generada_at: new Date().toISOString(),
      galeria_urls: [imageUrl, ...galeriaActual.filter(u => u !== imageUrl)],
    });

    return Response.json({
      success: true,
      producto_id,
      producto_nombre: producto.nombre,
      imagen_promo_url: imageUrl,
      message: `✓ Imagen promocional generada para "${producto.nombre}"`,
    });
  } catch (err) {
    console.error('generateProductPromoImage error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});