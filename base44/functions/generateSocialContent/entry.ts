import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ═══════════════════════════════════════════════════════════════════════════
// Generador Agéntico de Contenido PEYU
// Pipeline: Contexto → Relato inteligente (LLM) → Imagen IA → Guardar en DB
// ═══════════════════════════════════════════════════════════════════════════

const PILARES = {
  'Producto':        'Foco en features, beneficios, lifestyle, personalización láser UV.',
  'Sostenibilidad/ESG':'Plástico 100% reciclado, economía circular, Ley REP, kg rescatados, huella CO2.',
  'Educativo':       'Datos concretos, tips reciclaje, mitos desmentidos, impacto ambiental real.',
  'Detrás de escena':'Taller, inyectoras, equipo, proceso productivo, historia emprendedora.',
  'Testimonios':     'Clientes B2B/B2C reales, casos de éxito, resultados medibles.',
  'Promoción':       'Descuentos, lanzamientos, fechas especiales, urgencia real.',
  'Comunidad':       'Educación ambiental, talleres, colaboraciones, valores PEYU.',
  'Branding':        'Posicionamiento, diferenciadores, manifesto PEYU.',
};

const RED_SPECS = {
  'Instagram':  { max_caption: 2200, ideal: 150, hashtags: '5-8', ratio: '4:5 o 1:1', cta: 'Link en bio · DM · Swipe' },
  'Facebook':   { max_caption: 63206, ideal: 300, hashtags: '2-3', ratio: '1:1', cta: 'Más info · WhatsApp' },
  'LinkedIn':   { max_caption: 3000, ideal: 1200, hashtags: '3-5', ratio: '1:1 o 16:9', cta: 'Agenda demo · Cotiza' },
  'TikTok':     { max_caption: 2200, ideal: 120, hashtags: '4-7', ratio: '9:16 (Reel)', cta: 'Link bio · Comenta' },
  'Twitter/X':  { max_caption: 280, ideal: 240, hashtags: '2', ratio: '16:9', cta: 'Hilo · Link' },
  'Pinterest':  { max_caption: 500, ideal: 400, hashtags: '5 (SEO)', ratio: '2:3', cta: 'Visita · Guarda' },
  'Threads':    { max_caption: 500, ideal: 300, hashtags: '2-3', ratio: '1:1', cta: 'Responde · Link' },
  'YouTube':    { max_caption: 5000, ideal: 500, hashtags: '3-5', ratio: '16:9', cta: 'Suscríbete · Link descripción' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      red_social = 'Instagram',
      tipo_post = 'Post Imagen',
      pilar = 'Producto',
      tema,                  // idea del usuario ("kit escritorio", "lanzamiento maceteros", "Día de la Tierra")
      objetivo = 'Engagement',
      producto_sku = '',
      tono = 'auténtico chileno moderno, sin greenwashing, datos concretos',
      incluir_imagen = true,
      auto_guardar = true,
      num_variantes = 1,
      fecha_publicacion = '',
    } = await req.json();

    if (!tema) return Response.json({ error: 'Falta el campo "tema"' }, { status: 400 });

    // ── 1. Contexto enriquecido: producto + ESG + backlinks recientes ──────
    let productoCtx = '';
    if (producto_sku) {
      const [prod] = await base44.asServiceRole.entities.Producto.filter({ sku: producto_sku });
      if (prod) {
        productoCtx = `\nPRODUCTO: ${prod.nombre} (SKU ${prod.sku})\n- Categoría: ${prod.categoria} · Material: ${prod.material}\n- Precio B2C: $${prod.precio_b2c || 'n/d'} · Personalización láser desde ${prod.moq_personalizacion || 10} u\n- Descripción: ${prod.descripcion || 'Producto Peyu 100% reciclado'}`;
      }
    }

    const spec = RED_SPECS[red_social] || RED_SPECS['Instagram'];
    const pilarDesc = PILARES[pilar] || '';

    // ── 2. Relato inteligente con LLM (usando modelo de alta calidad) ─────
    const prompt = `Eres el Content Creator IA de PEYU Chile, empresa de regalos corporativos 100% plástico reciclado con grabado láser UV (fundada 2021, 217K followers IG, tiendas Providencia y Macul, WhatsApp +56 9 3504 0242, peyuchile.cl).

TAREA: Crear ${num_variantes} variante(s) de contenido nativo de alta calidad para ${red_social} (${tipo_post}).

ESPECIFICACIONES RED "${red_social}":
- Caption ideal: ~${spec.ideal} chars (máx ${spec.max_caption})
- Hashtags: ${spec.hashtags}
- Formato visual: ${spec.ratio}
- CTA típico: ${spec.cta}

PILAR DE CONTENIDO: "${pilar}" → ${pilarDesc}
OBJETIVO: ${objetivo}
TEMA: ${tema}
TONO: ${tono}
${productoCtx}

DIFERENCIADORES PEYU QUE PUEDES USAR (solo si aplican naturalmente):
- 100% plástico reciclado chileno · Ley REP compliant · Garantía 10 años
- Personalización láser UV gratuita desde 10 unidades (B2B)
- 2 tiendas físicas + envíos a todo Chile
- Clientes: Adidas, Nestlé, BancoEstado, DUOC UC, UAI, Falabella
- Salió en Emol · CNN Chile · BancoEstado

REGLAS ESTRICTAS:
✅ Gancho fuerte en primera línea (para IG/TikTok ≤150 chars; LinkedIn con storytelling)
✅ Datos concretos (kg reciclados, % ahorro CO2, años garantía)
✅ Hashtags mix: nicho (#plasticoreciclado #economiacircular) + trending + geo (#chile #santiago)
✅ CTA explícito y medible
✅ Brief visual DETALLADO y realista (lo usaremos para generar imagen con IA)
❌ NO greenwashing, NO "salva el planeta", NO clichés
❌ NO inventar premios, clientes o datos

RESPONDE EN JSON ESTRICTO con este schema:
{
  "variantes": [
    {
      "titulo_interno": "string (nombre corto para el equipo)",
      "copy": "string (caption completo nativo de la red)",
      "hashtags": "string (los hashtags separados por espacio con #)",
      "cta": "string (la llamada a la acción)",
      "hook_primera_linea": "string (los primeros 150 chars que engancharán)",
      "brief_visual": "string (DESCRIPCIÓN MUY DETALLADA para generar imagen: producto, entorno, iluminación, estilo fotográfico, composición, colores, mood. Mín 60 palabras. SIEMPRE mostrando que es plástico reciclado con estética premium tipo Aesop/Muji, luz natural cálida, fondo minimalista)",
      "hora_optima": "string (ej '19:00', basada en best practices de la red)",
      "score_predicho": "number (1-10, tu predicción de engagement)"
    }
  ],
  "estrategia": "string (2-3 líneas explicando por qué este ángulo funcionará)"
}`;

    const llmResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
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
                hook_primera_linea: { type: 'string' },
                brief_visual: { type: 'string' },
                hora_optima: { type: 'string' },
                score_predicho: { type: 'number' },
              },
              required: ['titulo_interno', 'copy', 'hashtags', 'cta', 'brief_visual'],
            },
          },
          estrategia: { type: 'string' },
        },
        required: ['variantes'],
      },
    });

    const variantes = llmResp?.variantes || [];
    if (!variantes.length) return Response.json({ error: 'LLM no generó variantes' }, { status: 500 });

    // ── 3. Generar imagen real con IA para cada variante (si se pidió) ────
    const resultados = [];
    for (const v of variantes) {
      let imagen_url = '';
      let asset_id = null;
      if (incluir_imagen) {
        try {
          const imgPrompt = `Professional marketing photograph for PEYU Chile (recycled plastic products, premium eco-design brand). ${v.brief_visual}. Shot on Sony A7IV, 50mm, natural warm window light, minimalist aesthetic similar to Aesop / Muji / The Ordinary, shallow depth of field, subtle sustainable-minded styling, real recycled plastic texture visible, product hero shot, no text overlays, no watermarks, photo-realistic, editorial quality.`;
          const { url } = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: imgPrompt });
          imagen_url = url;

          if (auto_guardar && url) {
            const asset = await base44.asServiceRole.entities.ContentAsset.create({
              nombre: `IA · ${v.titulo_interno}`.slice(0, 80),
              tipo: 'Imagen',
              url,
              thumbnail_url: url,
              formato: red_social === 'TikTok' ? 'Reel 9:16' : red_social === 'Pinterest' ? 'Pinterest 2:3' : 'Cuadrado 1:1',
              generado_por_ia: true,
              prompt_ia: imgPrompt.slice(0, 500),
              categoria: pilar === 'Producto' ? 'Producto' : pilar === 'Sostenibilidad/ESG' ? 'Sostenibilidad' : 'Branding',
              producto_sku: producto_sku || '',
              aprobado: false,
            });
            asset_id = asset.id;
          }
        } catch (e) {
          console.error('Image gen failed:', e.message);
        }
      }

      // ── 4. Guardar el ContentPost ──────────────────────────────────────
      let post_id = null;
      if (auto_guardar) {
        const post = await base44.asServiceRole.entities.ContentPost.create({
          titulo: v.titulo_interno,
          red_social,
          tipo_post,
          copy: v.copy,
          hashtags: v.hashtags,
          cta: v.cta,
          imagen_url,
          fecha_publicacion: fecha_publicacion || '',
          hora_publicacion: v.hora_optima || '',
          estado: 'Borrador',
          pillar_contenido: pilar,
          objetivo,
          producto_relacionado_sku: producto_sku || '',
          generado_por_ia: true,
          agente_creador: 'content_creator_v2',
          notas: `Estrategia: ${llmResp.estrategia || ''} · Score predicho: ${v.score_predicho || '?'}/10`,
        });
        post_id = post.id;
      }

      resultados.push({ ...v, imagen_url, asset_id, post_id });
    }

    return Response.json({
      ok: true,
      estrategia: llmResp.estrategia,
      variantes: resultados,
      red_social,
      pilar,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});