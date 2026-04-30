import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 09:00 — Alerta de stock bajo + sugerencia de reorden.
 * Detecta SKUs activos con stock_actual ≤ umbral y envía email al equipo
 * con cantidad sugerida basada en lead_time + ventas históricas.
 *
 * Umbrales:
 *   - Crítico: stock <= 20 unidades
 *   - Bajo: stock <= 50 unidades
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productos = await base44.asServiceRole.entities.Producto.list(null, 300);
    const activos = productos.filter(p => p.activo !== false && p.stock_actual != null);

    const criticos = activos.filter(p => p.stock_actual <= 20);
    const bajos = activos.filter(p => p.stock_actual > 20 && p.stock_actual <= 50);

    if (criticos.length === 0 && bajos.length === 0) {
      return Response.json({ ok: true, criticos: 0, bajos: 0, message: 'Sin alertas de stock' });
    }

    // Calcular sugerencia de reorden: cubrir 30 días + buffer del lead time
    const sugerirReorden = (p) => {
      const lead = p.lead_time_sin_personal || 7;
      // Sin histórico real de ventas en este CRON, sugerimos cobertura conservadora
      const buffer = Math.max(60, lead * 8); // mínimo 60u o 8x el lead time
      return buffer;
    };

    const fmtRow = (p, severity) => {
      const sugerencia = sugerirReorden(p);
      const color = severity === 'critico' ? '#dc2626' : '#d97706';
      const bg = severity === 'critico' ? '#fef2f2' : '#fef9e7';
      return `
        <tr style="border-bottom:1px solid #f0f0f0;background:${bg}">
          <td style="padding:10px 8px;font-family:monospace;font-size:11px;color:#6b7280">${p.sku}</td>
          <td style="padding:10px 8px;font-size:13px;color:#0F172A"><strong>${p.nombre}</strong></td>
          <td style="padding:10px 8px;text-align:center"><span style="background:${color};color:#fff;padding:3px 10px;border-radius:999px;font-weight:700;font-size:11px">${p.stock_actual} u</span></td>
          <td style="padding:10px 8px;text-align:right;font-size:13px;color:#0F8B6C"><strong>+${sugerencia} u</strong></td>
        </tr>`;
    };

    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#dc2626,#f59e0b);padding:24px 28px">
    <p style="color:#fef9c3;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU Inventario</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">📦 Alerta Stock · ${criticos.length + bajos.length} SKUs</h1>
    <p style="color:#fef9c3;font-size:13px;margin:6px 0 0">${criticos.length} críticos · ${bajos.length} bajos</p>
  </div>

  <div style="padding:24px 28px">
    ${criticos.length > 0 ? `
      <h2 style="color:#dc2626;font-size:14px;font-weight:700;margin:0 0 12px">🔴 Stock crítico (≤ 20 u)</h2>
      <table style="width:100%;font-size:12px;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">
        <thead style="background:#f9fafb">
          <tr>
            <th style="padding:8px;text-align:left;color:#6b7280;font-size:11px">SKU</th>
            <th style="padding:8px;text-align:left;color:#6b7280;font-size:11px">Producto</th>
            <th style="padding:8px;text-align:center;color:#6b7280;font-size:11px">Stock</th>
            <th style="padding:8px;text-align:right;color:#6b7280;font-size:11px">Reorden sugerido</th>
          </tr>
        </thead>
        <tbody>${criticos.map(p => fmtRow(p, 'critico')).join('')}</tbody>
      </table>
    ` : ''}

    ${bajos.length > 0 ? `
      <h2 style="color:#d97706;font-size:14px;font-weight:700;margin:24px 0 12px">🟡 Stock bajo (21-50 u)</h2>
      <table style="width:100%;font-size:12px;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">
        <tbody>${bajos.map(p => fmtRow(p, 'bajo')).join('')}</tbody>
      </table>
    ` : ''}

    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:20px 0">
      <p style="color:#006D5B;font-size:12px;font-weight:600;margin:0 0 6px">💡 Recomendaciones</p>
      <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:12px;line-height:1.7">
        <li>Para SKUs críticos, gatillar producción HOY mismo</li>
        <li>Cantidades sugeridas basadas en lead time × cobertura conservadora (8x)</li>
        <li>Revisar ventas históricas antes de confirmar volumen</li>
      </ul>
    </div>

    <div style="text-align:center;margin-top:16px">
      <a href="https://peyuchile.cl/admin/inventario" style="display:inline-block;background:#0F172A;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px">Gestionar inventario →</a>
    </div>
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU Inventario',
      to: 'ti@peyuchile.cl',
      subject: `📦 Stock Alert · ${criticos.length} críticos · ${bajos.length} bajos`,
      body: html,
    });

    return Response.json({
      ok: true,
      criticos: criticos.length,
      bajos: bajos.length,
      total_alertas: criticos.length + bajos.length,
      skus_criticos: criticos.map(p => p.sku),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});