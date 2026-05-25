// ============================================================================
// PEYU · bulkGeneratePromoVariants
// ----------------------------------------------------------------------------
// Genera variantes de post (imagen IA premium + copy nativo) para varios
// productos y las deja en cola de aprobación como ContentPost (En revisión).
//
// Body:
//   {
//     producto_ids: string[],          // hasta 20
//     redes: ['Instagram','LinkedIn'], // 1 post por red
//     variantes_por_red: 1,
//     pilar: 'Producto',
//     tono: 'auténtico chileno…',
//     tema_extra: '',
//     estilo: 'lifestyle' | 'editorial' | 'flat_lay' | 'studio' | 'eco_natural' | 'corporate',
//     aspect_ratio_override?: '1:1' | '4:5' | '9:16',  // si no, auto por red
//   }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PEYU_BRAND = {
  green:     '#0F8B6C',
  arena:     '#E7D8C6',
  terracota: '#D96B4D',
  light_green: '#A7D9C9',
};

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
    setting: 'top-down flat lay on a textured surface (recycled paper, linen, or fine wood) tinted in PEYU sand beige, surrounded by complementary natural elements',
    mood: 'intentional, curated, Pinterest-ready',
    composition: 'overhead 90° angle, balanced asymmetrical arrangement',
  },
  studio: {
    label: 'Studio',
    setting: 'professional studio photography: seamless paper backdrop in deep emerald PEYU green with soft beige floor',
    mood: 'premium e-commerce, crisp, confident',
    composition: 'product centered, slight three-quarter angle, soft studio lighting',
  },
  eco_natural: {
    label: 'Eco Natural',
    setting: 'outdoor natural setting: product on moss, river stones or weathered wood under dappled forest light',
    mood: 'connected to nature, sustainable, Chilean Patagonia vibe',
    composition: 'product nested within nature, golden hour soft light',
  },
  corporate: {
    label: 'Corporativo',
    setting: 'modern minimalist office desk: warm walnut wood, an open laptop slightly out of focus, a leather notebook',
    mood: 'professional, B2B premium, executive-grade',
    composition: 'three-quarter angle, business context, soft window light from the side',
  },
};

// Por red, qué aspect ratio y specs de copy
const RED_SPECS = {
  Instagram: { ideal: 150,  hashtags: '5-8', cta: 'Link en bio · DM',         ratio: '4:5' },
  LinkedIn:  { ideal: 1200, hashtags: '3-5', cta: 'Agenda demo · Cotiza',     ratio: '1:1' },
  Facebook:  { ideal: 300,  hashtags: '2-3', cta: 'Más info · WhatsApp',      ratio: '1:1' },
  TikTok:    { ideal: 120,  hashtags: '4-7', cta: 'Link bio · Comenta',       ratio: '9:16' },
};

const RATIO_LABEL = {
  '1:1':  'square 1:1 (1080×1080)',
  '4:5':  'portrait 4:5 (1080×1350) — IG feed optimized',
  '9:16': 'vertical 9:16 (1080×1920) — Stories/Reels',
};

function buildImagePrompt(producto, briefVisual, estiloId, aspectRatio) {
  const estilo = ESTILOS[estiloId] || ESTILOS.lifestyle;
  const ratio  = RATIO_LABEL[aspectRatio] || RATIO_LABEL['1:1'];

  const materialEn = producto.material?.includes('Trigo')
    ? 'compostable wheat fiber'
    : '100% recycled plastic';

  return `Award-winning ${ratio} social campaign photograph for "${producto.nombre}" by PEYU Chile, made of ${materialEn}.

═══ HERO (NON-NEGOTIABLE) ═══
Reference image is the product. PRESERVE EXACTLY: shape, color, material finish, proportions. NO redesign, NO recolor. Sharp focus, recognizable.

═══ STYLE: ${estilo.label.toUpperCase()} ═══
Scene: ${estilo.setting}.
Mood: ${estilo.mood}.
Composition: ${estilo.composition}.

═══ CREATIVE BRIEF FROM COPYWRITER ═══
${briefVisual || 'Editorial product hero shot, minimalist sustainable styling.'}

═══ PEYU PALETTE (dominant background/accents) ═══
Emerald ${PEYU_BRAND.green} · sand beige ${PEYU_BRAND.arena} · sage ${PEYU_BRAND.light_green} · terracotta accent ${PEYU_BRAND.terracota} (max 8%). Chilean eco-luxury, never neon, never cold.

═══ TECHNICAL ═══
Photorealistic 4K, medium-format aesthetic, soft directional natural light, organic shadows, texture-rich surfaces (linen, raw wood, ceramic, recycled paper), warm film-grade color, magazine-ready.

═══ STRICT NEGATIVES ═══
✗ NO text, NO logos, NO watermarks, NO captions, NO typography.
✗ NO eco clichés (recycle symbols, leaves on product, "eco" badges).
✗ NO oversaturation, NO harsh flash.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const {
      producto_ids = [],
      redes = ['Instagram', 'LinkedIn'],
      variantes_por_red = 1,
      pilar = 'Producto',
      tono = 'auténtico chileno moderno, sin greenwashing',
      tema_extra = '',
      estilo = 'lifestyle',
      aspect_ratio_override = null,
    } = await req.json();

    if (!Array.isArray(producto_ids) || producto_ids.length === 0) {
      return Response.json({ error: 'producto_ids requerido (array)' }, { status: 400 });
    }
    if (producto_ids.length > 20) {
      return Response.json({ error: 'Máximo 20 productos por llamada' }, { status: 400 });
    }

    const resultados = [];

    for (const pid of producto_ids) {
      try {
        const producto = await base44.asServiceRole.entities.Producto.get(pid);
        if (!producto || !producto.imagen_url) {
          resultados.push({ producto_id: pid, ok: false, error: 'Producto sin imagen principal' });
          continue;
        }

        for (const red of redes) {
          const spec = RED_SPECS[red] || RED_SPECS.Instagram;
          const aspectRatio = aspect_ratio_override || spec.ratio;

          const llmPrompt = `Eres Content Creator IA de PEYU Chile (regalos corporativos 100% plástico reciclado, láser UV, fundada 2021).

TAREA: Crear ${variantes_por_red} variante(s) de post para ${red} sobre:
- ${producto.nombre} (SKU ${producto.sku})
- Categoría: ${producto.categoria} · Material: ${producto.material}
- Precio B2C: $${producto.precio_b2c || 'n/d'} · Personalización láser desde ${producto.moq_personalizacion || 10} u
- Descripción: ${producto.descripcion?.slice(0, 300) || 'Producto sustentable PEYU'}

PILAR: ${pilar}
TONO: ${tono}
ESTILO VISUAL: ${ESTILOS[estilo]?.label || 'Lifestyle'} (${ESTILOS[estilo]?.mood || ''})
${tema_extra ? `CONTEXTO ADICIONAL: ${tema_extra}` : ''}

ESPECS ${red}: caption ~${spec.ideal} chars, ${spec.hashtags} hashtags, CTA tipo "${spec.cta}".

REGLAS COPY:
✅ Hook fuerte en primera línea
✅ Datos concretos (precio, moq, garantía, ley REP)
✅ Hashtags mix nicho + geo Chile
✅ CTA explícito
✅ Brief visual detallado para imagen IA (mín 50 palabras, escena específica, COHERENTE con el estilo visual ${ESTILOS[estilo]?.label || 'Lifestyle'})
❌ NO greenwashing, NO clichés "salva el planeta"

JSON estricto:
{
  "variantes": [
    {
      "titulo_interno": "string",
      "copy": "string",
      "hashtags": "string",
      "cta": "string",
      "hook": "string (primeros 150 chars)",
      "brief_visual": "string (mín 50 palabras coherente con estilo ${ESTILOS[estilo]?.label})",
      "hora_optima": "string (HH:MM)",
      "score": "number (1-10)"
    }
  ]
}`;

          const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: llmPrompt,
            response_json_schema: {
              type: 'object',
              properties: {
                variantes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      titulo_interno: { type: 'string' },
                      copy: { type: 'string' },
                      hashtags: { type: 'string' },
                      cta: { type: 'string' },
                      hook: { type: 'string' },
                      brief_visual: { type: 'string' },
                      hora_optima: { type: 'string' },
                      score: { type: 'number' },
                    },
                    required: ['titulo_interno', 'copy', 'hashtags', 'brief_visual'],
                  },
                },
              },
              required: ['variantes'],
            },
          });

          const variantes = llm?.variantes || [];
          for (const v of variantes) {
            let imagen_url = '';
            try {
              const imgPrompt = buildImagePrompt(producto, v.brief_visual, estilo, aspectRatio);
              const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
                prompt: imgPrompt,
                existing_image_urls: [producto.imagen_url],
              });
              imagen_url = imgRes?.url || '';
            } catch (e) {
              console.error(`img fail ${producto.sku}/${red}:`, e.message);
            }

            const post = await base44.asServiceRole.entities.ContentPost.create({
              titulo: v.titulo_interno || `${producto.nombre} · ${red}`,
              red_social: red,
              tipo_post: red === 'TikTok' ? 'Reel' : 'Post Imagen',
              copy: v.copy || '',
              hashtags: v.hashtags || '',
              cta: v.cta || spec.cta,
              imagen_url,
              hora_publicacion: v.hora_optima || '',
              estado: 'En revisión',
              pillar_contenido: pilar,
              objetivo: 'Engagement',
              producto_relacionado_sku: producto.sku,
              generado_por_ia: true,
              agente_creador: 'bulkGeneratePromoVariants',
              notas: `Estilo: ${ESTILOS[estilo]?.label || estilo} · Ratio: ${aspectRatio} · Score: ${v.score || '?'}/10 · Hook: ${v.hook || ''}`,
            });

            resultados.push({
              ok: true,
              producto_id: pid,
              producto_sku: producto.sku,
              red,
              post_id: post.id,
              imagen_url,
              titulo: post.titulo,
              estilo,
              aspect_ratio: aspectRatio,
            });
          }
        }
      } catch (err) {
        resultados.push({ producto_id: pid, ok: false, error: err.message });
      }
    }

    return Response.json({
      ok: true,
      total: resultados.length,
      exitosos: resultados.filter(r => r.ok).length,
      fallidos: resultados.filter(r => !r.ok).length,
      estilo_usado: estilo,
      resultados,
    });
  } catch (error) {
    console.error('bulkGeneratePromoVariants error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});