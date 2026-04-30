import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON · Lunes 07:00 — Insights Ejecutivos Semanales.
 * Cruza datos de la última semana (pedidos, leads, propuestas, consultas)
 * y usa IA para identificar tendencias, anomalías y 3 acciones recomendadas
 * para la semana en curso.
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
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace14 = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [pedidos, leads, propuestas, consultas, clientes] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 200),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 200),
      base44.asServiceRole.entities.CorporateProposal.list('-created_date', 200),
      base44.asServiceRole.entities.Consulta.list('-created_date', 100),
      base44.asServiceRole.entities.Cliente.list(null, 200),
    ]);

    const inRange = (d, from, to) => {
      const x = new Date(d);
      return x >= from && x <= to;
    };

    // Semana actual (últimos 7d)
    const wPedidos = pedidos.filter(p => inRange(p.created_date, hace7, ahora));
    const wLeads = leads.filter(l => inRange(l.created_date, hace7, ahora));
    const wPropuestas = propuestas.filter(p => inRange(p.created_date, hace7, ahora));
    const wConsultas = consultas.filter(c => inRange(c.created_date, hace7, ahora));

    // Semana anterior (-14d a -7d)
    const pPedidos = pedidos.filter(p => inRange(p.created_date, hace14, hace7));
    const pLeads = leads.filter(l => inRange(l.created_date, hace14, hace7));
    const pPropuestas = propuestas.filter(p => inRange(p.created_date, hace14, hace7));

    const ventasW = wPedidos.reduce((s, p) => s + (p.total || 0), 0);
    const ventasP = pPedidos.reduce((s, p) => s + (p.total || 0), 0);
    const cerradoW = wPropuestas.filter(p => p.status === 'Aceptada').reduce((s, p) => s + (p.total || 0), 0);

    const deltaVentas = ventasP > 0 ? Math.round(((ventasW - ventasP) / ventasP) * 100) : 0;
    const deltaLeads = pLeads.length > 0 ? Math.round(((wLeads.length - pLeads.length) / pLeads.length) * 100) : 0;

    // Top SKUs vendidos
    const skuSales = {};
    wPedidos.forEach(p => {
      if (p.sku) skuSales[p.sku] = (skuSales[p.sku] || 0) + (p.cantidad || 1);
    });
    const topSkus = Object.entries(skuSales).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Conversion rate consultas → pedidos
    const consultasResp = wConsultas.filter(c => c.estado === 'Respondido').length;

    // Brief para IA
    const brief = `
DATOS PEYU CHILE - Semana ${hace7.toLocaleDateString('es-CL')} a ${ahora.toLocaleDateString('es-CL')}:

VENTAS B2C:
- Pedidos esta semana: ${wPedidos.length} ($${ventasW.toLocaleString('es-CL')})
- Pedidos semana anterior: ${pPedidos.length} ($${ventasP.toLocaleString('es-CL')})
- Variación: ${deltaVentas > 0 ? '+' : ''}${deltaVentas}%
- Top SKUs: ${topSkus.map(([sku, qty]) => `${sku} (${qty}u)`).join(', ') || 'N/A'}

PIPELINE B2B:
- Leads nuevos: ${wLeads.length} (vs ${pLeads.length} sem anterior, ${deltaLeads > 0 ? '+' : ''}${deltaLeads}%)
- Score promedio leads: ${wLeads.length > 0 ? Math.round(wLeads.reduce((s, l) => s + (l.lead_score || 0), 0) / wLeads.length) : 0}/100
- Propuestas enviadas: ${wPropuestas.filter(p => p.status === 'Enviada').length}
- Propuestas cerradas (Aceptadas): ${wPropuestas.filter(p => p.status === 'Aceptada').length} ($${cerradoW.toLocaleString('es-CL')})
- Propuestas rechazadas: ${wPropuestas.filter(p => p.status === 'Rechazada').length}

SOPORTE/CONSULTAS:
- Consultas recibidas: ${wConsultas.length}
- Respondidas: ${consultasResp}
- SLA respuesta: ${wConsultas.length > 0 ? Math.round((consultasResp / wConsultas.length) * 100) : 0}%

BASE DE CLIENTES:
- Total: ${clientes.length}
- VIP: ${clientes.filter(c => c.estado === 'VIP').length}
- En riesgo: ${clientes.filter(c => c.estado === 'En Riesgo').length}
`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres el analista estratégico interno de PEYU Chile (regalos corporativos sostenibles, plástico reciclado, fabricación local).
Analiza estos datos semanales y genera un briefing ejecutivo CONCISO en español formal Chile:

${brief}

Responde JSON con:
- titular (string, 1 línea atrayente con número clave de la semana)
- tendencias (array de 2-3 strings, observaciones clave)
- alertas (array de strings, riesgos detectados — vacío si no hay)
- acciones_semana (array de exactamente 3 strings, acciones concretas y priorizadas para esta semana)`,
      response_json_schema: {
        type: 'object',
        properties: {
          titular: { type: 'string' },
          tendencias: { type: 'array', items: { type: 'string' } },
          alertas: { type: 'array', items: { type: 'string' } },
          acciones_semana: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#0F8B6C);padding:28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">Weekly Insights · IA</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:6px 0 0">${insights?.titular || 'Resumen semanal PEYU'}</h1>
    <p style="color:#A7D9C9;font-size:13px;margin:6px 0 0">Semana del ${hace7.toLocaleDateString('es-CL')} al ${ahora.toLocaleDateString('es-CL')}</p>
  </div>

  <div style="padding:24px 28px">
    <!-- Métricas clave -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
      <div style="background:#f0faf7;border-radius:10px;padding:12px">
        <p style="color:#006D5B;font-size:10px;margin:0;text-transform:uppercase;font-weight:700">Ventas B2C</p>
        <p style="color:#0F8B6C;font-size:20px;font-weight:900;margin:4px 0 0">${fmt(ventasW)}</p>
        <p style="color:${deltaVentas >= 0 ? '#0F8B6C' : '#dc2626'};font-size:11px;margin:2px 0 0;font-weight:700">${deltaVentas >= 0 ? '↑' : '↓'} ${Math.abs(deltaVentas)}% vs sem anterior</p>
      </div>
      <div style="background:#fef9e7;border-radius:10px;padding:12px">
        <p style="color:#92400e;font-size:10px;margin:0;text-transform:uppercase;font-weight:700">Cerrado B2B</p>
        <p style="color:#d97706;font-size:20px;font-weight:900;margin:4px 0 0">${fmt(cerradoW)}</p>
        <p style="color:#92400e;font-size:11px;margin:2px 0 0">${wPropuestas.filter(p => p.status === 'Aceptada').length} propuestas aceptadas</p>
      </div>
      <div style="background:#eff6ff;border-radius:10px;padding:12px">
        <p style="color:#1e40af;font-size:10px;margin:0;text-transform:uppercase;font-weight:700">Leads B2B</p>
        <p style="color:#1e40af;font-size:20px;font-weight:900;margin:4px 0 0">${wLeads.length}</p>
        <p style="color:${deltaLeads >= 0 ? '#0F8B6C' : '#dc2626'};font-size:11px;margin:2px 0 0;font-weight:700">${deltaLeads >= 0 ? '↑' : '↓'} ${Math.abs(deltaLeads)}% vs sem anterior</p>
      </div>
      <div style="background:#f3f4f6;border-radius:10px;padding:12px">
        <p style="color:#6b7280;font-size:10px;margin:0;text-transform:uppercase;font-weight:700">Consultas</p>
        <p style="color:#0F172A;font-size:20px;font-weight:900;margin:4px 0 0">${wConsultas.length}</p>
        <p style="color:#6b7280;font-size:11px;margin:2px 0 0">SLA: ${wConsultas.length > 0 ? Math.round((consultasResp / wConsultas.length) * 100) : 0}%</p>
      </div>
    </div>

    ${insights?.tendencias?.length ? `
    <h2 style="color:#0F172A;font-size:14px;font-weight:700;margin:20px 0 8px">📊 Tendencias detectadas</h2>
    <ul style="margin:0;padding-left:20px;color:#4B4F54;font-size:13px;line-height:1.7">
      ${insights.tendencias.map(t => `<li>${t}</li>`).join('')}
    </ul>` : ''}

    ${insights?.alertas?.length ? `
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px;border-radius:8px;margin:20px 0">
      <p style="color:#991b1b;font-weight:700;font-size:13px;margin:0 0 8px">⚠️ Alertas</p>
      <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:12px;line-height:1.6">
        ${insights.alertas.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>` : ''}

    ${insights?.acciones_semana?.length ? `
    <div style="background:#f0faf7;border-radius:10px;padding:16px;margin:20px 0">
      <p style="color:#006D5B;font-weight:700;font-size:13px;margin:0 0 10px">🎯 Acciones para esta semana</p>
      <ol style="margin:0;padding-left:20px;color:#4B4F54;font-size:13px;line-height:1.7">
        ${insights.acciones_semana.map(a => `<li>${a}</li>`).join('')}
      </ol>
    </div>` : ''}

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0">
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
      Insights generados automáticamente · PEYU Chile · ${ahora.toLocaleDateString('es-CL')}
    </p>
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU Strategic Intelligence',
      to: 'ti@peyuchile.cl',
      subject: `📊 Weekly Insights · ${insights?.titular?.slice(0, 60) || 'Resumen semanal'}`,
      body: html,
    });

    return Response.json({
      ok: true,
      semana: { ventas: ventasW, leads: wLeads.length, cerrado_b2b: cerradoW },
      delta: { ventas_pct: deltaVentas, leads_pct: deltaLeads },
      insights,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});