// ============================================================================
// notifyNewConsulta
// ----------------------------------------------------------------------------
// Disparada por entity automation cuando se crea una Consulta nueva (chat,
// WhatsApp, formulario web). Notifica al equipo a ti@ y ventas@peyuchile.cl
// para respuesta inmediata.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporta payload entity automation o llamada manual
    const consultaId = body?.data?.id || body?.event?.entity_id || body?.consultaId;
    if (!consultaId) {
      return Response.json({ error: 'consultaId requerido' }, { status: 400 });
    }

    // Recargar para tener el dato fresco (puede llegar payload_too_large)
    const items = await base44.asServiceRole.entities.Consulta.filter({ id: consultaId });
    const c = items?.[0];
    if (!c) return Response.json({ error: 'Consulta no encontrada' }, { status: 404 });

    const isCaliente = c.calidad === 'Caliente' || c.tipo === 'Cotización Corporativa';
    const subject = isCaliente
      ? `🔥 Consulta CALIENTE · ${c.nombre || 'sin nombre'} · ${c.canal}`
      : `💬 Nueva consulta · ${c.nombre || 'sin nombre'} · ${c.canal}`;

    const fmt = (v) => v || '—';
    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#F4F1EB;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border-top:4px solid ${isCaliente ? '#DC2626' : '#0F8B6C'};">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:${isCaliente ? '#DC2626' : '#0F8B6C'};text-transform:uppercase;">${isCaliente ? '🔥 Lead caliente' : '💬 Nueva consulta'}</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#0F172A;">${fmt(c.nombre)}</h1>

    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748B;width:120px;">Canal</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${fmt(c.canal)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Tipo</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${fmt(c.tipo)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Calidad</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${fmt(c.calidad)}</td></tr>
      ${c.telefono ? `<tr><td style="padding:6px 0;color:#64748B;">WhatsApp</td><td style="padding:6px 0;"><a href="https://wa.me/${c.telefono.replace(/\D/g, '')}" style="color:#0F8B6C;font-weight:600;text-decoration:none;">${c.telefono} →</a></td></tr>` : ''}
      ${c.cantidad_estimada ? `<tr><td style="padding:6px 0;color:#64748B;">Cantidad</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${c.cantidad_estimada} u</td></tr>` : ''}
      ${c.fecha_requerida ? `<tr><td style="padding:6px 0;color:#64748B;">Necesita para</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${c.fecha_requerida}</td></tr>` : ''}
    </table>

    ${c.mensaje ? `
    <div style="margin-top:16px;padding:14px 16px;background:#F8FAFC;border-radius:10px;border-left:3px solid #94A3B8;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;">Mensaje original</p>
      <p style="margin:0;font-size:14px;color:#0F172A;line-height:1.5;white-space:pre-wrap;">${c.mensaje}</p>
    </div>` : ''}

    <p style="margin-top:20px;text-align:center;">
      <a href="https://peyuchile.cl/admin/soporte" style="display:inline-block;background:#0F172A;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">Responder en panel →</a>
    </p>
  </div>
</body></html>`;

    await Promise.all([
      base44.integrations.Core.SendEmail({
        from_name: 'PEYU Consultas',
        to: 'ti@peyuchile.cl',
        subject,
        body: html,
      }),
      base44.integrations.Core.SendEmail({
        from_name: 'PEYU Consultas',
        to: 'ventas@peyuchile.cl',
        subject,
        body: html,
      }),
    ]);

    return Response.json({ ok: true, consultaId, calidad: c.calidad, isCaliente });
  } catch (error) {
    console.error('notifyNewConsulta error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});