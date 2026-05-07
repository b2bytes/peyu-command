import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 08:00 — Daily Briefing al equipo PEYU.
 * Resume KPIs del día anterior + actividad pendiente para hoy.
 *
 * Incluye:
 *   - Pedidos web nuevos (24h)
 *   - Leads B2B nuevos (24h) con scores
 *   - Propuestas aceptadas/rechazadas (24h)
 *   - Tareas pendientes / propuestas próximas a expirar
 *   - Clientes en riesgo
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const proximas48h = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);

    const isRecent = (d) => d && new Date(d) >= hace24h;
    const sumTotal = (arr, key = 'total') => arr.reduce((s, x) => s + (x[key] || 0), 0);

    // Cargar datos relevantes en paralelo (límites razonables)
    const [pedidos, leads, propuestas, clientes] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 50),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 50),
      base44.asServiceRole.entities.CorporateProposal.list('-created_date', 100),
      base44.asServiceRole.entities.Cliente.list(null, 200),
    ]);

    const pedidosHoy = pedidos.filter(p => isRecent(p.created_date));
    const leadsHoy = leads.filter(l => isRecent(l.created_date));
    const propuestasAceptadas = propuestas.filter(p =>
      p.status === 'Aceptada' && isRecent(p.updated_date)
    );
    const propuestasRechazadas = propuestas.filter(p =>
      p.status === 'Rechazada' && isRecent(p.updated_date)
    );

    // Propuestas por expirar (próximas 48h)
    const porExpirar = propuestas.filter(p => {
      if (p.status !== 'Enviada' || !p.fecha_vencimiento) return false;
      const venc = new Date(p.fecha_vencimiento);
      return venc <= proximas48h && venc >= ahora;
    });

    // Clientes en riesgo
    const enRiesgo = clientes.filter(c => c.estado === 'En Riesgo').slice(0, 10);

    // Top leads del día por score
    const topLeads = leadsHoy
      .filter(l => l.lead_score >= 60)
      .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
      .slice(0, 5);

    const ventasHoyB2C = sumTotal(pedidosHoy);
    const ventasHoyB2B = sumTotal(propuestasAceptadas);
    const totalHoy = ventasHoyB2C + ventasHoyB2B;

    const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
    const fechaAyer = hace24h.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    const html = `<!DOCTYPE html><html lang="es"><body style="font-family:Inter,Arial,sans-serif;background:#F7F7F5;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#0F8B6C);padding:24px 28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Daily Briefing · PEYU</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">Buenos días equipo ☀️</h1>
    <p style="color:#A7D9C9;font-size:13px;margin:4px 0 0">Resumen de ${fechaAyer}</p>
  </div>

  <div style="padding:24px 28px">
    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
      <div style="background:#f0faf7;border-radius:10px;padding:14px">
        <p style="color:#006D5B;font-size:11px;margin:0;text-transform:uppercase;font-weight:700">Ventas B2C</p>
        <p style="color:#0F8B6C;font-size:22px;font-weight:900;margin:4px 0 0">${fmt(ventasHoyB2C)}</p>
        <p style="color:#4B4F54;font-size:11px;margin:2px 0 0">${pedidosHoy.length} pedidos</p>
      </div>
      <div style="background:#fef9e7;border-radius:10px;padding:14px">
        <p style="color:#92400e;font-size:11px;margin:0;text-transform:uppercase;font-weight:700">Cerrado B2B</p>
        <p style="color:#d97706;font-size:22px;font-weight:900;margin:4px 0 0">${fmt(ventasHoyB2B)}</p>
        <p style="color:#4B4F54;font-size:11px;margin:2px 0 0">${propuestasAceptadas.length} propuestas</p>
      </div>
      <div style="background:#eff6ff;border-radius:10px;padding:14px">
        <p style="color:#1e40af;font-size:11px;margin:0;text-transform:uppercase;font-weight:700">Leads nuevos</p>
        <p style="color:#1e40af;font-size:22px;font-weight:900;margin:4px 0 0">${leadsHoy.length}</p>
        <p style="color:#4B4F54;font-size:11px;margin:2px 0 0">${topLeads.length} con score ≥60</p>
      </div>
      <div style="background:${propuestasRechazadas.length > 0 ? '#fef2f2' : '#f3f4f6'};border-radius:10px;padding:14px">
        <p style="color:${propuestasRechazadas.length > 0 ? '#991b1b' : '#6b7280'};font-size:11px;margin:0;text-transform:uppercase;font-weight:700">Total cerrado</p>
        <p style="color:#0F172A;font-size:22px;font-weight:900;margin:4px 0 0">${fmt(totalHoy)}</p>
      </div>
    </div>

    ${topLeads.length > 0 ? `
    <h2 style="color:#0F172A;font-size:15px;font-weight:700;margin:20px 0 10px">🔥 Top Leads B2B (last 24h)</h2>
    <table style="width:100%;font-size:13px;border-collapse:collapse">
      ${topLeads.map(l => `
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:8px 0">
            <strong>${l.company_name || 'Sin empresa'}</strong>
            <span style="color:#6b7280">· ${l.contact_name || ''}</span>
          </td>
          <td style="text-align:right;padding:8px 0">
            <span style="background:${l.lead_score >= 80 ? '#dcfce7' : '#fef9e7'};color:${l.lead_score >= 80 ? '#166534' : '#92400e'};padding:2px 8px;border-radius:999px;font-weight:700;font-size:11px">${l.lead_score || 0}/100</span>
          </td>
        </tr>
      `).join('')}
    </table>
    ` : ''}

    ${porExpirar.length > 0 ? `
    <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:14px;border-radius:8px;margin:20px 0">
      <p style="color:#92400e;font-weight:700;font-size:13px;margin:0 0 8px">⏰ ${porExpirar.length} propuestas vencen en 48h</p>
      <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:12px">
        ${porExpirar.slice(0, 5).map(p => `<li><strong>${p.empresa}</strong> · ${fmt(p.total)} · vence ${p.fecha_vencimiento}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${enRiesgo.length > 0 ? `
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px;border-radius:8px;margin:20px 0">
      <p style="color:#991b1b;font-weight:700;font-size:13px;margin:0 0 8px">⚠️ ${enRiesgo.length} clientes en riesgo</p>
      <p style="color:#4B4F54;font-size:12px;margin:0">Sin compras hace >180 días. Revisar en Cliente 360 y agendar contacto.</p>
    </div>
    ` : ''}

    <div style="text-align:center;margin-top:24px">
      <a href="https://peyuchile.cl/admin/" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:13px">Ir al dashboard →</a>
    </div>

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
      Daily Briefing automático · PEYU Chile · ${ahora.toLocaleDateString('es-CL')}
    </p>
  </div>
</div></body></html>`;

    const briefingSubject = `☀️ Daily PEYU · ${fmt(totalHoy)} cerrado · ${leadsHoy.length} leads · ${fechaAyer}`;
    await Promise.all([
      base44.integrations.Core.SendEmail({
        from_name: 'PEYU Daily Briefing',
        to: 'ti@peyuchile.cl',
        subject: briefingSubject,
        body: html,
      }),
      base44.integrations.Core.SendEmail({
        from_name: 'PEYU Daily Briefing',
        to: 'ventas@peyuchile.cl',
        subject: briefingSubject,
        body: html,
      }),
    ]);

    return Response.json({
      ok: true,
      pedidosHoy: pedidosHoy.length,
      leadsHoy: leadsHoy.length,
      propuestasAceptadas: propuestasAceptadas.length,
      ventasHoy: totalHoy,
      porExpirar: porExpirar.length,
      enRiesgo: enRiesgo.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});