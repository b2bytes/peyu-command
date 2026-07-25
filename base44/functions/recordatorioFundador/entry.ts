// ============================================================================
// recordatorioFundador — Envía un recordatorio por correo a los admins de PEYU.
// Pensado para automatizaciones programadas (one-time o recurrentes): se le
// pasa {titulo, mensaje} en function_args y avisa al equipo fundador.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const titulo = body.titulo || 'Recordatorio PEYU';
    const mensaje = body.mensaje || 'Tienes una tarea pendiente.';

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const destinatarios = (admins || []).map((u) => u.email).filter(Boolean);

    if (destinatarios.length === 0) {
      return Response.json({ ok: false, error: 'No hay admins registrados para notificar' });
    }

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#0F8B6C,#0B6E55);color:#fff;border-radius:16px;padding:20px">
          <h2 style="margin:0;font-size:18px">⏰ ${titulo}</h2>
        </div>
        <p style="color:#334155;font-size:14px;line-height:1.6;margin-top:18px;white-space:pre-line">${mensaje}</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Recordatorio automático · PEYU Chile</p>
      </div>`;

    const enviados = [];
    for (const to of destinatarios) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject: `⏰ ${titulo}`,
        body: html,
        from_name: 'PEYU · Recordatorios',
      });
      enviados.push(to);
    }

    return Response.json({ ok: true, enviados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});