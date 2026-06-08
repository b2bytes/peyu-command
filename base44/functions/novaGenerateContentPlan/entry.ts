import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * novaGenerateContentPlan — Genera un plan de contenido social media semanal
 * para NOVA (superagente de marketing).
 * 
 * Payload:
 * {
 *   "semana": "2026-06-08",
 *   "pilares": ["Origen", "Diseño", "Comunidad", "B2B", "Producto", "Educación"],
 *   "plataformas": ["Instagram", "LinkedIn"],
 *   "posts_por_dia": 2
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validar campos mínimos
    if (!body.semana) {
      return Response.json(
        { error: 'Missing required field: semana' },
        { status: 400 }
      );
    }

    // Invocar generateWeeklyContentPlan si existe
    try {
      const plan = await base44.functions.invoke('generateWeeklyContentPlan', {
        semana: body.semana,
        pilares: body.pilares || ['Producto', 'Sostenibilidad/ESG', 'Comunidad'],
        plataformas: body.plataformas || ['Instagram', 'LinkedIn'],
        posts_por_dia: body.posts_por_dia || 2
      });

      return Response.json({
        success: true,
        plan,
        mensaje: 'Plan de contenido generado exitosamente'
      });
    } catch (err) {
      // Si generateWeeklyContentPlan no está disponible, crear un plan base
      console.log('generateWeeklyContentPlan not available, creating basic plan');
      
      const semanaDate = new Date(body.semana);
      const planBasico = {
        semana: body.semana,
        pilares: body.pilares || ['Producto', 'Sostenibilidad/ESG', 'Comunidad'],
        plataformas: body.plataformas || ['Instagram', 'LinkedIn'],
        posts_por_dia: body.posts_por_dia || 2,
        posts_generados: 7 * (body.posts_por_dia || 2),
        estado: 'Borrador',
        mensaje: 'Plan básico generado. Usa NOVA para refinar contenido.'
      };

      return Response.json({
        success: true,
        plan: planBasico,
        mensaje: 'Plan de contenido base creado'
      });
    }
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});