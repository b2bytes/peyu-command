// ============================================================================
// PEYU · bulkGeneratePromoVariants
// ----------------------------------------------------------------------------
// Genera N variantes de post (imagen + copy IG/LinkedIn) para varios productos
// y las deja en la cola de aprobación como ContentPost(estado='En revisión').
//
// Body:
//   {
//     producto_ids: string[],          // productos a procesar
//     redes: ['Instagram','LinkedIn'], // redes destino (1 post por red)
//     variantes_por_red: 1,            // cuántas variantes por red/producto
//     pilar: 'Producto',               // pilar de contenido
//     tono: 'auténtico chileno…',      // override de tono
//     tema_extra: '',                  // tema/contexto adicional opcional
//   }
//
// Cada variante crea:
//   • 1 imagen IA con branding PEYU (1:1)
//   • 1 ContentPost en estado 'En revisión'
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PEYU_BRAND = { green: '#0F8B6C', arena: '#E7D8C6', terracota: '#D96B4D' };

const RED_SPECS = {
  Instagram: { ideal: 150, hashtags: '5-8', cta: 'Link en bio · DM', ratio: '1:1' },
  LinkedIn: { ideal: 1200, hashtags: '3-5', cta: 'Agenda demo · Cotiza', ratio: '1:1' },
  Facebook: { ideal: 300, hashtags: '2-3', cta: 'Más info · WhatsApp', ratio: '1:1' },
  TikTok: { ideal: 120, hashtags: '4-7', cta: 'Link bio · Comenta', ratio: '9:16' },
};

function buildImagePrompt(producto, briefVisual) {
  const materialEn = producto.material?.includes('Trigo')
    ? 'compostable wheat fiber'
    : '100% recycled plastic';
  return `Premium social media image (1:1 square) for "${producto.nombre}" by PEYU Chile, made of ${materialEn}.

PRESERVE THE PRODUCT EXACTLY: same shape, color, texture, proportions as the reference image. Do not redesign.

COMPOSITION: product on the LEFT 50% sharp focus, RIGHT 50% intentional clean negative space for copy (no text, no logos, no watermarks). Soft natural daylight, premium magazine quality.

PEYU PALETTE: deep emerald green ${PEYU_BRAND.green}, warm sand beige ${PEYU_BRAND.arena}, subtle terracotta accents ${PEYU_BRAND.terracota}. Eco-luxury Scandinavian-Chilean mood.

CREATIVE BRIEF: ${briefVisual || 'editorial product hero shot, minimalist sustainable styling'}.

ABSOLUTELY NO text, NO logos, NO captions in the image.`;
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

          const llmPrompt = `Eres Content Creator IA de PEYU Chile (regalos corporativos 100% plástico reciclado, láser UV, fundada 2021).

TAREA: Crear ${variantes_por_red} variante(s) de post para ${red} sobre el producto:
- ${producto.nombre} (SKU ${producto.sku})
- Categoría: ${producto.categoria} · Material: ${producto.material}
- Precio B2C: $${producto.precio_b2c || 'n/d'} · Personalización láser desde ${producto.moq_personalizacion || 10} u
- Descripción: ${producto.descripcion?.slice(0, 300) || 'Producto sustentable PEYU'}

PILAR: ${pilar}
TONO: ${tono}
${tema_extra ? `CONTEXTO ADICIONAL: ${tema_extra}` : ''}

ESPECS ${red}: caption ~${spec.ideal} chars, ${spec.hashtags} hashtags, CTA tipo "${spec.cta}".

REGLAS:
✅ Hook fuerte en primera línea
✅ Datos concretos (precio, moq, garantía 10 años, ley REP)
✅ Hashtags mix nicho + geo Chile
✅ CTA explícito
✅ Brief visual detallado para imagen IA (mín 50 palabras, escenario realista)
❌ NO greenwashing, NO clichés, NO "salva el planeta"

JSON estricto:
{
  "variantes": [
    {
      "titulo_interno": "string",
      "copy": "string (caption nativo)",
      "hashtags": "string (separados por espacio con #)",
      "cta": "string",
      "hook": "string (primeros 150 chars)",
      "brief_visual": "string (mín 50 palabras, descriptivo, realista)",
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
            // Imagen con referencia al producto real
            let imagen_url = '';
            try {
              const imgPrompt = buildImagePrompt(producto, v.brief_visual);
              const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
                prompt: imgPrompt,
                existing_image_urls: [producto.imagen_url],
              });
              imagen_url = imgRes?.url || '';
            } catch (e) {
              console.error(`img fail ${producto.sku}/${red}:`, e.message);
            }

            // Crear ContentPost en cola de aprobación
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
              notas: `Score predicho: ${v.score || '?'}/10 · Hook: ${v.hook || ''}`,
            });

            resultados.push({
              ok: true,
              producto_id: pid,
              producto_sku: producto.sku,
              red,
              post_id: post.id,
              imagen_url,
              titulo: post.titulo,
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
      resultados,
    });
  } catch (error) {
    console.error('bulkGeneratePromoVariants error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});