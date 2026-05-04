import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Endpoint público para suscribir email al newsletter PEYU.
 * Valida formato, evita duplicados, segmenta por origen y dispara email de bienvenida.
 *
 * Payload: { email, nombre?, segmento?, origen, page_path?, intereses?, utm_source?, utm_campaign? }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, nombre, segmento = 'General', origen, page_path, intereses, utm_source, utm_campaign } = body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!origen) {
      return Response.json({ error: 'Falta origen' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // ¿Ya existe?
    const existing = await base44.asServiceRole.entities.Suscriptor.filter({ email: emailLower });
    if (existing && existing.length > 0) {
      const sub = existing[0];
      // Si estaba dado de baja, reactivar
      if (sub.estado === 'Baja') {
        await base44.asServiceRole.entities.Suscriptor.update(sub.id, {
          estado: 'Activo',
          origen,
          page_path,
        });
      }
      return Response.json({ ok: true, already: true, message: 'Ya estás suscrito 🐢' });
    }

    // Crear nuevo
    const sub = await base44.asServiceRole.entities.Suscriptor.create({
      email: emailLower,
      nombre: nombre || '',
      segmento,
      origen,
      page_path: page_path || '',
      intereses: intereses || [],
      utm_source: utm_source || '',
      utm_campaign: utm_campaign || '',
      estado: 'Activo',
      double_opt_in: false,
    });

    // Email de bienvenida (best-effort, no bloquea respuesta)
    try {
      const subjects = {
        B2C: '¡Bienvenido al club PEYU! 🐢🌱',
        B2B: '¡Bienvenido al programa corporativo PEYU! 💼',
        Blog: 'Tu primera dosis de ideas sostenibles 📚',
        General: '¡Bienvenido a PEYU Chile! 🐢',
      };
      const bodies = {
        B2C: `<h2>¡Hola${nombre ? ' ' + nombre : ''}! 🐢</h2><p>Gracias por sumarte al club PEYU. Te enviaremos:</p><ul><li>🎁 Drops exclusivos antes que nadie</li><li>💚 Cupones solo para suscriptores</li><li>🌱 Historias del impacto que generas</li></ul><p>Mientras tanto, <a href="https://peyuchile.cl/shop">explora la tienda</a>.</p>`,
        B2B: `<h2>¡Bienvenido al programa corporativo!</h2><p>Cada mes recibirás:</p><ul><li>📅 Calendario corporativo de fechas clave (Día del Trabajador, Patrias, Navidad)</li><li>📊 Reporte ESG cuantificado</li><li>💼 Casos de éxito de empresas como la tuya</li></ul><p><a href="https://peyuchile.cl/b2b/catalogo">Ver catálogo corporativo →</a></p>`,
        Blog: `<h2>📚 Bienvenido al newsletter PEYU</h2><p>Cada 15 días: ideas de regalos sostenibles, tendencias en economía circular, y guías para regalar bonito sin dañar el planeta.</p><p><a href="https://peyuchile.cl/blog">Lee los últimos artículos →</a></p>`,
        General: `<h2>¡Hola! 🐢</h2><p>Gracias por sumarte. Te avisaremos cuando haya novedades.</p>`,
      };

      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Peyu 🐢 · PEYU Chile',
        to: emailLower,
        subject: subjects[segmento] || subjects.General,
        body: bodies[segmento] || bodies.General,
      });
    } catch (e) {
      console.warn('Email bienvenida falló:', e?.message);
    }

    return Response.json({ ok: true, id: sub.id, segmento });
  } catch (error) {
    console.error('suscribirNewsletter error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});