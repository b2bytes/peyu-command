import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON semanal · Detección de oportunidades de upsell B2B.
 * Cruza Clientes con histórico de compras y detecta:
 *   - Recompras crecientes (qty actual > qty histórico promedio)
 *   - Clientes con 3+ pedidos en 6 meses (fidelización avanzada)
 *   - Empresas con alta frecuencia → candidatos a contrato anual
 *
 * Genera Tareas tipo "Llamar para upsell / contrato anual".
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientes = await base44.asServiceRole.entities.Cliente.list(null, 500);
    const ahora = new Date();
    const hace180 = new Date(ahora.getTime() - 180 * 24 * 60 * 60 * 1000);

    const oportunidades = [];

    for (const c of clientes) {
      if (!c.tipo?.startsWith('B2B') && c.tipo !== 'B2C Recurrente') continue;
      if (!c.fecha_ultima_compra) continue;

      const ultimaCompra = new Date(c.fecha_ultima_compra);
      const activo = ultimaCompra >= hace180;
      if (!activo) continue;

      const score =
        (c.num_pedidos || 0) * 10 +
        (c.total_compras_clp >= 500_000 ? 30 : 0) +
        (c.total_compras_clp >= 2_000_000 ? 30 : 0) +
        (c.estado === 'VIP' ? 20 : 0) +
        ((c.nps_score || 0) * 2);

      const candidato =
        (c.num_pedidos >= 3 && c.total_compras_clp >= 500_000) ||
        c.estado === 'VIP' ||
        c.total_compras_clp >= 2_000_000;

      if (!candidato) continue;

      // Razón principal del upsell
      let razon = '';
      let accion = '';
      if (c.total_compras_clp >= 2_000_000) {
        razon = `Cliente top con $${(c.total_compras_clp / 1_000_000).toFixed(1)}M acumulados`;
        accion = 'Proponer contrato anual con descuento por volumen';
      } else if (c.num_pedidos >= 5) {
        razon = `Cliente recurrente con ${c.num_pedidos} pedidos`;
        accion = 'Ofrecer plan corporativo trimestral con personalización gratis';
      } else {
        razon = `Cliente fidelizado (${c.num_pedidos} pedidos · ticket $${(c.ticket_promedio || 0).toLocaleString('es-CL')})`;
        accion = 'Propuesta de upsell: nuevos productos + mockup gratis';
      }

      oportunidades.push({ cliente: c, score, razon, accion });
    }

    oportunidades.sort((a, b) => b.score - a.score);
    const top = oportunidades.slice(0, 15);

    // Crear tareas para los top 5 (no spamear con muchas)
    const top5 = top.slice(0, 5);
    let tareasCreadas = 0;
    for (const op of top5) {
      try {
        await base44.asServiceRole.entities.Tarea.create({
          titulo: `Upsell: ${op.cliente.empresa}`,
          descripcion: `${op.razon}\n\nAcción sugerida: ${op.accion}\n\nContacto: ${op.cliente.contacto || 'N/A'} · ${op.cliente.email || ''} · ${op.cliente.telefono || ''}\nCanal preferido: ${op.cliente.canal_preferido || 'N/A'}`,
          prioridad: op.score >= 80 ? 'Alta' : 'Media',
          estado: 'Pendiente',
          tipo: 'Comercial',
          fecha_limite: new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          asignado_a: 'ventas@peyuchile.cl',
        });
        tareasCreadas++;
      } catch (e) {
        console.warn(`Error creando tarea para ${op.cliente.empresa}:`, e.message);
      }
    }

    // Email resumen al equipo
    if (top.length > 0) {
      const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
      const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#D96B4D);padding:24px 28px">
    <p style="color:#fed7aa;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU Sales Intelligence</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">🎯 ${top.length} Oportunidades de Upsell</h1>
  </div>
  <div style="padding:24px 28px">
    <p style="color:#4B4F54;font-size:13px;line-height:1.6;margin:0 0 16px">
      Detectamos ${top.length} clientes con patrones de fidelidad que indican oportunidad de upsell. Se crearon ${tareasCreadas} tareas comerciales para los top 5.
    </p>
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      ${top.slice(0, 10).map((op, i) => `
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 6px;width:30px;color:#9ca3af">#${i + 1}</td>
          <td style="padding:10px 6px">
            <strong>${op.cliente.empresa}</strong><br>
            <span style="color:#6b7280;font-size:11px">${op.razon}</span>
          </td>
          <td style="padding:10px 6px;text-align:right;white-space:nowrap">
            <strong style="color:#0F8B6C">${fmt(op.cliente.total_compras_clp)}</strong><br>
            <span style="color:#6b7280;font-size:11px">${op.cliente.num_pedidos || 0} pedidos</span>
          </td>
        </tr>
      `).join('')}
    </table>
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:20px 0 0">
      Las tareas top 5 ya están en /admin/calendario · Asignadas a ventas@peyuchile.cl
    </p>
  </div>
</div></body></html>`;

      await base44.integrations.Core.SendEmail({
        from_name: 'PEYU Sales Intelligence',
        to: 'ti@peyuchile.cl',
        subject: `🎯 ${top.length} oportunidades upsell · ${tareasCreadas} tareas creadas`,
        body: html,
      });
    }

    return Response.json({
      ok: true,
      oportunidades_detectadas: top.length,
      tareas_creadas: tareasCreadas,
      top: top.slice(0, 5).map(o => ({ empresa: o.cliente.empresa, score: o.score, razon: o.razon })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});