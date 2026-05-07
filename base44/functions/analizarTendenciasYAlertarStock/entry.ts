// ============================================================================
// analizarTendenciasYAlertarStock
// ----------------------------------------------------------------------------
// Cruza ventas últimas 4 semanas (PedidoWeb) con stock actual (Producto) y
// proyecta cuántos días de stock quedan para los SKUs más populares.
// Si algún SKU popular tiene <14 días de cobertura, manda alerta al equipo.
//
// Solo admin puede invocar (o se ejecuta como CRON desde automation).
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALERT_THRESHOLD_DAYS = 14; // <14 días de stock = alerta
const TOP_N = 15;                // analizar top 15 SKUs por venta
const LOOKBACK_DAYS = 28;        // ventana de análisis: 4 semanas
const ALERT_EMAIL = 'alfonsovambe@gmail.com';
const RESEND_FROM = 'PEYU Chile <onboarding@resend.dev>';

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

async function sendAlert({ html, subject }) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [ALERT_EMAIL],
      subject,
      html,
      reply_to: 'ventas@peyuchile.cl',
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function buildAlertHtml(criticos, marginales, lookbackDays) {
  const row = (it) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #EEE;">
        <strong style="color:#0F172A;">${it.nombre}</strong>
        <div style="font-size:11px;color:#64748B;font-family:monospace;">${it.sku}</div>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #EEE;text-align:right;font-variant-numeric:tabular-nums;">${it.unidades_vendidas} u</td>
      <td style="padding:10px 14px;border-bottom:1px solid #EEE;text-align:right;font-variant-numeric:tabular-nums;">${it.velocidad_diaria.toFixed(1)} u/d</td>
      <td style="padding:10px 14px;border-bottom:1px solid #EEE;text-align:right;font-variant-numeric:tabular-nums;">${it.stock_actual} u</td>
      <td style="padding:10px 14px;border-bottom:1px solid #EEE;text-align:right;">
        <strong style="color:${it.dias_cobertura < 7 ? '#DC2626' : '#F59E0B'};font-variant-numeric:tabular-nums;">${it.dias_cobertura} días</strong>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #EEE;text-align:right;font-variant-numeric:tabular-nums;">${it.unidades_a_reponer} u</td>
    </tr>`;

  const tabla = (titulo, color, items) => items.length === 0 ? '' : `
    <p style="margin:24px 0 8px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:${color};text-transform:uppercase;">${titulo} · ${items.length}</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;font-size:13px;">
      <thead><tr style="background:#F9FAFB;">
        <th style="padding:10px 14px;text-align:left;color:#64748B;font-weight:600;font-size:11px;letter-spacing:0.5px;">Producto</th>
        <th style="padding:10px 14px;text-align:right;color:#64748B;font-weight:600;font-size:11px;">Vendidas (${lookbackDays}d)</th>
        <th style="padding:10px 14px;text-align:right;color:#64748B;font-weight:600;font-size:11px;">Velocidad</th>
        <th style="padding:10px 14px;text-align:right;color:#64748B;font-weight:600;font-size:11px;">Stock</th>
        <th style="padding:10px 14px;text-align:right;color:#64748B;font-weight:600;font-size:11px;">Cobertura</th>
        <th style="padding:10px 14px;text-align:right;color:#64748B;font-weight:600;font-size:11px;">Reponer</th>
      </tr></thead>
      <tbody>${items.map(row).join('')}</tbody>
    </table>`;

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#F4F1EB;padding:24px;margin:0;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border-top:4px solid #DC2626;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#DC2626;text-transform:uppercase;">⚠️ Alerta Reposición Materia Prima</p>
      <h1 style="margin:0 0 6px;font-size:22px;color:#0F172A;">${criticos.length + marginales.length} SKUs populares con stock bajo</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#64748B;line-height:1.55;">
        Análisis de ventas últimos <strong>${lookbackDays} días</strong> cruzado con inventario actual.
        Productos con menos de <strong>${ALERT_THRESHOLD_DAYS} días</strong> de cobertura proyectada.
      </p>
      ${tabla('🔴 Crítico — menos de 7 días', '#DC2626', criticos)}
      ${tabla('🟡 Marginal — entre 7 y 14 días', '#F59E0B', marginales)}
      <div style="margin-top:24px;padding:14px 18px;background:#F0FAF7;border-left:4px solid #0F8B6C;border-radius:8px;font-size:13px;color:#0A6B54;line-height:1.5;">
        <strong>Acción sugerida:</strong> revisar OCs abiertas y emitir reposición a proveedores de material reciclado para los SKUs críticos.
      </div>
      <p style="margin-top:18px;text-align:center;">
        <a href="https://peyuchile.cl/admin/inventario" style="display:inline-block;background:#0F172A;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">Ver inventario →</a>
        <a href="https://peyuchile.cl/admin/compras" style="display:inline-block;background:#0F8B6C;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;margin-left:8px;">Crear OC →</a>
      </p>
    </div>
  </body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Permitir invocación admin (manual) o sin auth (desde scheduled automation)
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user; // automations corren sin user
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);
    const sinceStr = since.toISOString().split('T')[0];

    // ── 1. Pedidos últimas 4 semanas (excluye cancelados/reembolsados) ─────
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-fecha', 1000);
    const pedidosRecientes = pedidos.filter(p =>
      p.fecha >= sinceStr &&
      !['Cancelado', 'Reembolsado'].includes(p.estado)
    );

    // ── 2. Agregar ventas por SKU ──────────────────────────────────────────
    const ventasPorSku = {};
    for (const p of pedidosRecientes) {
      if (!p.sku || !p.cantidad) continue;
      ventasPorSku[p.sku] = (ventasPorSku[p.sku] || 0) + p.cantidad;
    }

    // ── 3. Top SKUs ────────────────────────────────────────────────────────
    const topSkus = Object.entries(ventasPorSku)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N);

    if (topSkus.length === 0) {
      return Response.json({ ok: true, alerted: false, reason: 'Sin ventas en el período' });
    }

    // ── 4. Cruzar con productos para obtener stock ─────────────────────────
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true });
    const skuMap = Object.fromEntries(productos.map(p => [p.sku, p]));

    const analisis = topSkus.map(([sku, vendidas]) => {
      const prod = skuMap[sku];
      if (!prod) return null;
      const velocidad = vendidas / LOOKBACK_DAYS;
      const stock = prod.stock_actual || 0;
      const dias = velocidad > 0 ? Math.floor(stock / velocidad) : 999;
      // Reponer: cubrir 30 días + buffer 20%
      const reponer = Math.max(0, Math.ceil(velocidad * 30 * 1.2) - stock);
      return {
        sku,
        nombre: prod.nombre,
        unidades_vendidas: vendidas,
        velocidad_diaria: velocidad,
        stock_actual: stock,
        dias_cobertura: dias,
        unidades_a_reponer: reponer,
      };
    }).filter(Boolean);

    // ── 5. Filtrar críticos y marginales ───────────────────────────────────
    const criticos = analisis.filter(a => a.dias_cobertura < 7).sort((a, b) => a.dias_cobertura - b.dias_cobertura);
    const marginales = analisis.filter(a => a.dias_cobertura >= 7 && a.dias_cobertura < ALERT_THRESHOLD_DAYS).sort((a, b) => a.dias_cobertura - b.dias_cobertura);

    if (criticos.length === 0 && marginales.length === 0) {
      return Response.json({
        ok: true,
        alerted: false,
        analizados: analisis.length,
        reason: 'Todos los SKUs populares tienen cobertura > 14 días',
      });
    }

    // ── 6. Enviar alerta ───────────────────────────────────────────────────
    const subject = `⚠️ Reposición materia prima · ${criticos.length} crítico(s) · ${marginales.length} marginal(es)`;
    const html = buildAlertHtml(criticos, marginales, LOOKBACK_DAYS);
    await sendAlert({ html, subject });

    return Response.json({
      ok: true,
      alerted: true,
      trigger: isCron ? 'cron' : 'manual',
      criticos: criticos.length,
      marginales: marginales.length,
      analizados: analisis.length,
      detalle: { criticos, marginales },
    });
  } catch (error) {
    console.error('analizarTendenciasYAlertarStock error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});