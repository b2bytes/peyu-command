// ============================================================================
// PEYU · generateWeeklyContentPlan
// ----------------------------------------------------------------------------
// A partir de un TEMA SEMANAL, genera un plan de 7 posts diarios:
//   • Cada día tiene un sub-tema/ángulo único derivado del tema base
//   • Cada día se asocia a un producto del catálogo (rotación inteligente)
//   • La IA usa los Backlinks recientes como "insights frescos" (PR/menciones)
//   • Genera copy + imagen IA (con producto como referencia)
//   • Crea un ContentCalendar + 7 ContentPost en estado 'En revisión'
//
// Body:
//   {
//     tema_semanal: 'Día de la Tierra · economía circular',
//     fecha_inicio: '2026-05-12',                   // YYYY-MM-DD lunes
//     red_social: 'Instagram',
//     hora_default: '19:00',
//     producto_ids: [ ... ],                        // pool a rotar (opcional)
//     usar_backlinks: true,                         // inyectar PR como contexto
//     pilares_rotacion: ['Producto','Sostenibilidad/ESG','Educativo','Detrás de escena','Testimonios','Comunidad','Promoción'],
//     incluir_imagen: true,
//   }
//
// Devuelve: { ok, calendar_id, posts: [...] }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PEYU_BRAND = { green: '#0F8B6C', arena: '#E7D8C6', terracota: '#D96B4D' };
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildImagePrompt(producto, briefVisual) {
  const materialEn = producto?.material?.includes('Trigo')
    ? 'compostable wheat fiber'
    : '100% recycled plastic';
  return `Premium 1:1 social media image for PEYU Chile (eco-design brand, ${materialEn}).
${producto ? `PRODUCT: "${producto.nombre}" — preserve shape/color/proportions exactly as reference image.` : ''}
COMPOSITION: subject left 50%, right 50% clean negative space (no text). Soft natural daylight, editorial magazine quality.
PEYU PALETTE: emerald ${PEYU_BRAND.green}, sand ${PEYU_BRAND.arena}, terracotta ${PEYU_BRAND.terracota}. Eco-luxury Scandinavian-Chilean mood.
CREATIVE BRIEF: ${briefVisual}.
NO text, NO logos, NO watermarks in image.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const {
      tema_semanal,
      fecha_inicio,
      red_social = 'Instagram',
      hora_default = '19:00',
      producto_ids = [],
      usar_backlinks = true,
      pilares_rotacion = ['Producto', 'Sostenibilidad/ESG', 'Educativo', 'Detrás de escena', 'Testimonios', 'Comunidad', 'Promoción'],
      incluir_imagen = true,
    } = await req.json();

    if (!tema_semanal) return Response.json({ error: 'tema_semanal requerido' }, { status: 400 });
    if (!fecha_inicio) return Response.json({ error: 'fecha_inicio requerida (YYYY-MM-DD)' }, { status: 400 });

    // ── 1. Cargar pool de productos (con imagen) ───────────────────────────
    let pool = [];
    if (producto_ids.length > 0) {
      pool = await Promise.all(producto_ids.map(id => base44.asServiceRole.entities.Producto.get(id).catch(() => null)));
      pool = pool.filter(p => p && p.imagen_url);
    } else {
      const all = await base44.asServiceRole.entities.Producto.list('-updated_date', 60);
      pool = all.filter(p => p.activo !== false && p.imagen_url).slice(0, 20);
    }
    if (pool.length === 0) {
      return Response.json({ error: 'No hay productos con imagen disponibles' }, { status: 400 });
    }

    // ── 2. Cargar Backlinks recientes (insights de PR / autoridad) ─────────
    let backlinksCtx = '';
    if (usar_backlinks) {
      try {
        const bls = await base44.asServiceRole.entities.Backlink.list('-fecha_publicacion', 12);
        const altos = bls.filter(b => b.autoridad?.startsWith('Alta') || b.tipo === 'Prensa / Medio').slice(0, 6);
        if (altos.length > 0) {
          backlinksCtx = '\n\nMENCIONES / PR RECIENTES (úsalos como social proof concreto, NO inventes):\n' +
            altos.map(b => `- ${b.dominio || ''}: "${b.titulo || ''}" (${b.tipo})`).join('\n');
        }
      } catch (e) {
        console.warn('No se pudieron cargar backlinks:', e.message);
      }
    }

    // ── 3. Pedir al LLM 7 ángulos diarios coherentes con el tema semanal ──
    const planPrompt = `Eres el Director de Contenidos de PEYU Chile (regalos corporativos 100% plástico reciclado, láser UV, fundada 2021, 217K IG followers, tiendas Providencia/Macul, peyuchile.cl).

TAREA: Diseñar un plan editorial de 7 días sobre un tema semanal único. Cada día debe ser un ángulo distinto pero coherente, escalando narrativa de Lunes (gancho/intro) a Domingo (CTA fuerte).

TEMA SEMANAL: "${tema_semanal}"
RED SOCIAL: ${red_social}
PILARES DISPONIBLES (rota para variedad): ${pilares_rotacion.join(', ')}

PRODUCTOS DISPONIBLES (rotar uno por día):
${pool.map((p, i) => `${i + 1}. ${p.nombre} (SKU ${p.sku}) · ${p.categoria} · ${p.material}`).join('\n')}
${backlinksCtx}

Para cada uno de los 7 días genera:
- dia (Lunes…Domingo)
- pilar (uno de ${pilares_rotacion.join('/')})
- producto_index (1-${pool.length}, rotando para no repetir muy seguido)
- titulo_interno
- angulo (1 frase que define la idea del día)
- copy (caption nativo de ${red_social}, datos concretos, hook fuerte primera línea)
- hashtags (mix nicho chileno + geo)
- cta (acción clara)
- brief_visual (mín 50 palabras, realista, con producto y escenario, lo usaremos para imagen IA)
- hora_optima (HH:MM)
- score (1-10 predicción engagement)

REGLAS:
✅ Cada día se siente único pero parte del mismo arco narrativo.
✅ Si hay menciones de PR, úsalas en al menos 1 día como social proof.
✅ Datos concretos (precio, moq, kg reciclados, garantía 10 años, ley REP).
❌ NO greenwashing, NO clichés, NO inventar premios/clientes.

JSON estricto.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: planPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          estrategia_semanal: { type: 'string' },
          dias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dia: { type: 'string' },
                pilar: { type: 'string' },
                producto_index: { type: 'number' },
                titulo_interno: { type: 'string' },
                angulo: { type: 'string' },
                copy: { type: 'string' },
                hashtags: { type: 'string' },
                cta: { type: 'string' },
                brief_visual: { type: 'string' },
                hora_optima: { type: 'string' },
                score: { type: 'number' },
              },
              required: ['dia', 'titulo_interno', 'copy', 'brief_visual'],
            },
          },
        },
        required: ['dias'],
      },
    });

    const dias = (llm?.dias || []).slice(0, 7);
    if (dias.length === 0) {
      return Response.json({ error: 'LLM no devolvió plan' }, { status: 500 });
    }

    // ── 4. Crear ContentCalendar ───────────────────────────────────────────
    const fecha_fin = addDays(fecha_inicio, 6);
    const calendar = await base44.asServiceRole.entities.ContentCalendar.create({
      nombre: `Semana · ${tema_semanal}`.slice(0, 80),
      periodo: 'Semanal',
      fecha_inicio,
      fecha_fin,
      objetivo_principal: tema_semanal,
      temas_clave: [tema_semanal, ...pilares_rotacion.slice(0, 3)],
      redes_incluidas: [red_social],
      frecuencia_post_semana: 7,
      num_posts_planificados: 7,
      num_posts_publicados: 0,
      estado: 'Activo',
      generado_por_ia: true,
      notas_estrategia: llm?.estrategia_semanal || '',
    });

    // ── 5. Generar imagen + ContentPost por día ────────────────────────────
    const posts = [];
    for (let i = 0; i < dias.length; i++) {
      const d = dias[i];
      const idx = Math.max(0, Math.min(pool.length - 1, (d.producto_index || (i + 1)) - 1));
      const producto = pool[idx];
      const fecha = addDays(fecha_inicio, i);

      let imagen_url = '';
      if (incluir_imagen) {
        try {
          const imgPrompt = buildImagePrompt(producto, d.brief_visual);
          const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt: imgPrompt,
            existing_image_urls: producto?.imagen_url ? [producto.imagen_url] : [],
          });
          imagen_url = imgRes?.url || '';
        } catch (e) {
          console.error(`img day ${i + 1}:`, e.message);
        }
      }

      const post = await base44.asServiceRole.entities.ContentPost.create({
        titulo: d.titulo_interno || `Día ${i + 1} · ${tema_semanal}`,
        red_social,
        tipo_post: red_social === 'TikTok' ? 'Reel' : 'Post Imagen',
        copy: d.copy || '',
        hashtags: d.hashtags || '',
        cta: d.cta || 'peyuchile.cl',
        imagen_url,
        fecha_publicacion: fecha,
        hora_publicacion: d.hora_optima || hora_default,
        estado: 'En revisión',
        pillar_contenido: d.pilar || pilares_rotacion[i % pilares_rotacion.length],
        objetivo: 'Engagement',
        producto_relacionado_sku: producto?.sku || '',
        campana_id: calendar.id,
        generado_por_ia: true,
        agente_creador: 'generateWeeklyContentPlan',
        notas: `Día ${DIAS[i] || ''} · Ángulo: ${d.angulo || ''} · Score: ${d.score || '?'}/10`,
      });

      posts.push({
        post_id: post.id,
        dia: d.dia || DIAS[i],
        fecha,
        titulo: post.titulo,
        producto_sku: producto?.sku,
        imagen_url,
      });
    }

    return Response.json({
      ok: true,
      calendar_id: calendar.id,
      tema_semanal,
      fecha_inicio,
      fecha_fin,
      estrategia: llm?.estrategia_semanal || '',
      posts,
      backlinks_usados: usar_backlinks,
    });
  } catch (error) {
    console.error('generateWeeklyContentPlan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});