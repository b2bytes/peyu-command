// ============================================================================
// PEYU · generateProductPromoImage
// ----------------------------------------------------------------------------
// Genera una imagen promocional premium para redes sociales con la identidad
// PEYU (verde corporativo · arena cálida · terracota acento) preservando
// el producto real como hero.
//
// Body:
//   {
//     producto_id: string,                 // requerido (modo manual)
//     estilo?: 'lifestyle' | 'editorial' | 'flat_lay' | 'studio' | 'eco_natural' | 'corporate',
//     aspect_ratio?: '1:1' | '4:5' | '9:16',
//     escena_custom?: string,              // descripción adicional opcional
//   }
//
// Modos:
//   A) Manual (frontend):    POST { producto_id, estilo?, aspect_ratio?, escena_custom? }
//   B) Entity automation:    payload con event.type='create' y data=producto (defaults)
//
// Respuesta: { success, producto_id, imagen_promo_url, prompt_usado, message }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PEYU_BRAND = {
  green:     '#0F8B6C',
  arena:     '#E7D8C6',
  terracota: '#D96B4D',
  light_green: '#A7D9C9',
};

// ── Estilos visuales pre-configurados (cada uno cuenta una historia distinta) ──
const ESTILOS = {
  lifestyle: {
    label: 'Lifestyle',
    setting: 'natural lifestyle scene: morning light streaming through linen curtains, a hand reaching for the product on a wooden desk with a steaming ceramic mug nearby, plants in the background out of focus',
    mood: 'warm, candid, aspirational morning routine',
    composition: 'product slightly off-center (rule of thirds), shallow depth of field, bokeh background',
  },
  editorial: {
    label: 'Editorial',
    setting: 'high-end magazine editorial: clean architectural backdrop in PEYU palette colors, sculptural shadow play, subtle gradient lighting',
    mood: 'refined, fashion-forward, gallery-worthy',
    composition: 'centered hero shot with dramatic lighting, minimal props, generous negative space',
  },
  flat_lay: {
    label: 'Flat Lay',
    setting: 'top-down flat lay on a textured surface (recycled paper, linen, or fine wood) tinted in PEYU sand beige, surrounded by complementary natural elements: dried branches, ceramic dishes, hand-bound notebook',
    mood: 'intentional, curated, Pinterest-ready',
    composition: 'overhead 90° angle, balanced asymmetrical arrangement',
  },
  studio: {
    label: 'Studio',
    setting: 'professional studio photography: seamless paper backdrop in deep emerald PEYU green with soft beige floor, subtle product reflection',
    mood: 'premium e-commerce, crisp, confident',
    composition: 'product centered, slight three-quarter angle, soft studio lighting from upper left',
  },
  eco_natural: {
    label: 'Eco Natural',
    setting: 'outdoor natural setting: product resting on moss, smooth river stones or weathered wood under dappled forest light, soft green ambient',
    mood: 'connected to nature, sustainable, Chilean Patagonia vibe',
    composition: 'product nested within nature, golden hour soft light, organic textures',
  },
  corporate: {
    label: 'Corporativo',
    setting: 'modern minimalist office desk: warm walnut wood, an open laptop slightly out of focus, a leather notebook, the PEYU product as the protagonist accessory',
    mood: 'professional, B2B premium, executive-grade',
    composition: 'three-quarter angle, business context, soft window light from the side',
  },
};

// ── Aspect ratios para cada red ──
const RATIOS = {
  '1:1':  'square 1:1 format (1080×1080) — Instagram feed, LinkedIn',
  '4:5':  'portrait 4:5 format (1080×1350) — Instagram feed optimized for max screen real estate',
  '9:16': 'vertical 9:16 format (1080×1920) — Instagram Stories, Reels, TikTok',
};

function buildPromoPrompt(p, opts = {}) {
  const estilo = ESTILOS[opts.estilo] || ESTILOS.lifestyle;
  const ratio = RATIOS[opts.aspect_ratio] || RATIOS['1:1'];

  const materialEn = p.material?.includes('Trigo')
    ? 'compostable wheat fiber with subtle natural texture'
    : '100% recycled plastic with smooth refined finish';

  const categoriaEn = ({
    'Escritorio': 'premium desk accessory',
    'Hogar': 'home product',
    'Entretenimiento': 'lifestyle item',
    'Corporativo': 'executive corporate gift',
    'Carcasas B2C': 'phone case',
  })[p.categoria] || 'sustainable lifestyle product';

  return `Award-winning social media campaign photograph in ${ratio} for "${p.nombre}", a ${categoriaEn} crafted from ${materialEn} by PEYU Chile.

═══ HERO PRODUCT (NON-NEGOTIABLE) ═══
The product in the reference image is the absolute hero. It MUST appear in the final image with:
• Exactly the same shape, silhouette, proportions, color and material finish as the reference.
• Sharp focus, perfectly lit, instantly recognizable.
• NO redesign, NO color shift, NO restyling, NO substitution.
Treat this like high-end product photography for a brand campaign — the product is sacred.

═══ STYLE: ${estilo.label.toUpperCase()} ═══
Scene: ${estilo.setting}
Mood: ${estilo.mood}
Composition: ${estilo.composition}
${opts.escena_custom ? `Additional creative direction: ${opts.escena_custom}` : ''}

═══ PEYU BRAND COLOR PALETTE ═══
The image must FEEL like PEYU — use these as dominant background / accent / surface colors:
• Deep emerald green ${PEYU_BRAND.green} (signature)
• Warm sand beige ${PEYU_BRAND.arena} (neutral)
• Soft sage ${PEYU_BRAND.light_green} (secondary)
• Terracotta ${PEYU_BRAND.terracota} (accent, max 8% of frame)
The palette should breathe Chilean eco-luxury — never neon, never cold, never gray.

═══ TECHNICAL ═══
• Photorealistic, 4K quality, shot on Hasselblad medium-format aesthetic.
• Soft directional natural light, no harsh flash, gentle organic shadows.
• Texture-rich surfaces (linen, raw wood, ceramic, recycled paper, natural stone).
• Slight film grain, warm color grade, magazine-ready.

═══ STRICT NEGATIVES ═══
✗ NO text, NO logos, NO watermarks, NO captions, NO typography of any kind.
✗ NO competing brand elements.
✗ NO harsh artificial lighting, NO oversaturation.
✗ NO greenwashing clichés (leaves stuck on product, recycle symbols, "eco" badges).
✗ NO distortion of the product.

The result must look like a real photograph from a high-end sustainable lifestyle brand campaign.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let producto;
    let producto_id = body.producto_id;
    const opts = {
      estilo: body.estilo,
      aspect_ratio: body.aspect_ratio,
      escena_custom: body.escena_custom,
    };

    if (body.event?.type && body.data) {
      // Entity automation
      producto = body.data;
      producto_id = producto.id;
      if (!producto.imagen_url) {
        return Response.json({
          success: false,
          skipped: true,
          message: 'Producto sin imagen_url — promo diferida.',
        });
      }
    } else {
      // Manual
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!producto_id) {
        return Response.json({ error: 'producto_id required' }, { status: 400 });
      }
      producto = await base44.asServiceRole.entities.Producto.get(producto_id);
      if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
      if (!producto.imagen_url) {
        return Response.json({
          error: 'El producto no tiene imagen principal. Carga una imagen antes de generar la promo.',
        }, { status: 400 });
      }
    }

    const prompt = buildPromoPrompt(producto, opts);
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
      estilo_usado: opts.estilo || 'lifestyle',
      aspect_ratio: opts.aspect_ratio || '1:1',
      message: `✓ Imagen "${ESTILOS[opts.estilo]?.label || 'Lifestyle'}" generada para "${producto.nombre}"`,
    });
  } catch (err) {
    console.error('generateProductPromoImage error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});