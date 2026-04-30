import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON · Domingo 19:00 — Predicción de demanda semanal por SKU.
 * Analiza pedidos de los últimos 60 días + tendencia + estacionalidad
 * y usa IA para generar plan de producción para los próximos 7 días.
 *
 * Considera:
 *   - Volumen histórico semanal por SKU
 *   - Tendencia (creciente/estable/decreciente)
 *   - Stock actual vs MOQ
 *   - Lead time del producto
 *
 * Genera plan que se envía al equipo + crea Tareas en Operaciones.
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
    const hace60 = new Date(ahora.getTime() - 60 * 24 * 60 * 60 * 1000);
    const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [pedidos, productos] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500),
      base44.asServiceRole.entities.Producto.filter({ activo: true }),
    ]);

    const inRange = (d, from, to) => {
      const x = new Date(d);
      return x >= from && x <= to;
    };

    const ventasUltimos60 = pedidos.filter(p =>
      inRange(p.created_date, hace60, ahora) &&
      ['Confirmado', 'En Producción', 'Despachado', 'Entregado'].includes(p.estado)
    );
    const ventasUltimos30 = ventasUltimos60.filter(p => inRange(p.created_date, hace30, ahora));

    // Agregación por SKU
    const skuStats = {};
    productos.forEach(p => {
      if (!p.sku) return;
      skuStats[p.sku] = {
        nombre: p.nombre,
        stock: p.stock_actual || 0,
        moq: p.moq_personalizacion || 1,
        lead_time: p.lead_time_sin_personal || 7,
        vendidos_60d: 0,
        vendidos_30d: 0,
        revenue_60d: 0,
      };
    });

    ventasUltimos60.forEach(p => {
      if (skuStats[p.sku]) {
        const qty = p.cantidad || 1;
        skuStats[p.sku].vendidos_60d += qty;
        skuStats[p.sku].revenue_60d += p.total || 0;
        if (inRange(p.created_date, hace30, ahora)) {
          skuStats[p.sku].vendidos_30d += qty;
        }
      }
    });

    // Calcular tendencia y promedio semanal
    const skusActivos = Object.entries(skuStats)
      .filter(([_, s]) => s.vendidos_60d > 0)
      .map(([sku, s]) => {
        const promSemanal60 = s.vendidos_60d / 8.5;
        const promSemanal30 = s.vendidos_30d / 4.3;
        const tendencia = promSemanal60 > 0
          ? Math.round(((promSemanal30 - promSemanal60) / promSemanal60) * 100)
          : 0;
        const semanasStock = promSemanal30 > 0 ? s.stock / promSemanal30 : 999;
        return { sku, ...s, prom_semanal: Math.round(promSemanal30 * 10) / 10, tendencia, semanas_stock: Math.round(semanasStock * 10) / 10 };
      })
      .sort((a, b) => b.revenue_60d - a.revenue_60d)
      .slice(0, 12);

    if (skusActivos.length === 0) {
      return Response.json({ ok: true, message: 'Sin ventas en últimos 60d, no hay predicción' });
    }

    const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
    const dataBrief = skusActivos.map(s =>
      `- ${s.sku} (${s.nombre}): ${s.prom_semanal}u/sem · stock ${s.stock} (${s.semanas_stock}sem) · tendencia ${s.tendencia > 0 ? '+' : ''}${s.tendencia}% · lead ${s.lead_time}d`
    ).join('\n');

    const ai = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres el planner de operaciones de PEYU Chile (fabricación local plástico reciclado). Genera un plan semanal de producción.

DATOS últimos 60 días por SKU (top 12 por revenue):
${dataBrief}

Genera plan en JSON. Para cada SKU prioritario, evalúa:
- Riesgo stock-out (semanas_stock < 2 → ALTO; 2-4 → MEDIO; >4 → BAJO)
- Cantidad recomendada a producir esta semana (considera lead time + tendencia)
- Justifica por qué

Responde JSON con:
- resumen_ejecutivo (string, 2 líneas)
- skus_criticos (array de objects con: sku, accion ["URGENTE_PRODUCIR"|"PRODUCIR"|"MONITOREAR"], cantidad_sugerida (number), razon (string máx 100 chars))
- alertas (array de strings, situaciones que requieren atención humana)`,
      response_json_schema: {
        type: 'object',
        properties: {
          resumen_ejecutivo: { type: 'string' },
          skus_criticos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                accion: { type: 'string' },
                cantidad_sugerida: { type: 'number' },
                razon: { type: 'string' },
              },
            },
          },
          alertas: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Crear tareas para SKUs URGENTES
    const urgentes = (ai?.skus_criticos || []).filter(s => s.accion === 'URGENTE_PRODUCIR');
    for (const u of urgentes) {
      const stat = skusActivos.find(s => s.sku === u.sku);
      await base44.asServiceRole.entities.Tarea.create({
        titulo: `🏭 Producir ${u.sku} · ${u.cantidad_sugerida}u`,
        descripcion: `${u.razon}\n\nStock actual: ${stat?.stock || 0}u · Demanda: ${stat?.prom_semanal || 0}u/sem · Lead time: ${stat?.lead_time || 7}d`,
        tipo: 'Operacional',
        prioridad: 'Alta',
        estado: 'Pendiente',
        asignado_a: 'ti@peyuchile.cl',
        fecha_vencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }).catch((e) => console.error('Error tarea producción:', e.message));
    }

    // Email reporte
    const colorAccion = (a) => a === 'URGENTE_PRODUCIR' ? '#dc2626' : a === 'PRODUCIR' ? '#f59e0b' : '#6b7280';
    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#7c3aed);padding:24px 28px">
    <p style="color:#ddd6fe;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">Demand Forecast · IA</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">🔮 Plan de producción semanal</h1>
    <p style="color:#ddd6fe;font-size:13px;margin:6px 0 0">Semana del ${ahora.toLocaleDateString('es-CL')}</p>
  </div>

  <div style="padding:24px 28px">
    <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:14px;border-radius:8px;margin:0 0 20px">
      <p style="font-size:12px;color:#5b21b6;font-weight:700;margin:0 0 6px;text-transform:uppercase">Resumen</p>
      <p style="font-size:13px;color:#4B4F54;margin:0;line-height:1.6">${ai?.resumen_ejecutivo || ''}</p>
    </div>

    <h2 style="color:#0F172A;font-size:14px;font-weight:700;margin:0 0 12px">📦 SKUs prioritarios</h2>
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      <thead>
        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
          <th style="padding:8px;text-align:left;color:#6b7280;font-weight:700">SKU</th>
          <th style="padding:8px;text-align:center;color:#6b7280;font-weight:700">Acción</th>
          <th style="padding:8px;text-align:right;color:#6b7280;font-weight:700">Cant.</th>
        </tr>
      </thead>
      <tbody>
        ${(ai?.skus_criticos || []).map(s => `
          <tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:10px 8px"><strong style="font-family:monospace">${s.sku}</strong><br><span style="color:#6b7280;font-size:11px">${s.razon}</span></td>
            <td style="padding:10px 8px;text-align:center"><span style="background:${colorAccion(s.accion)}1a;color:${colorAccion(s.accion)};padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700">${s.accion}</span></td>
            <td style="padding:10px 8px;text-align:right"><strong style="color:#0F8B6C;font-size:14px">${s.cantidad_sugerida}u</strong></td>
          </tr>`).join('')}
      </tbody>
    </table>

    ${ai?.alertas?.length ? `
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px;border-radius:8px;margin:20px 0 0">
      <p style="color:#991b1b;font-weight:700;font-size:13px;margin:0 0 8px">⚠️ Alertas</p>
      <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:12px;line-height:1.6">
        ${ai.alertas.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>` : ''}

    ${urgentes.length > 0 ? `<p style="color:#dc2626;font-size:12px;margin-top:16px;text-align:center">🔥 ${urgentes.length} tarea(s) URGENTE creada(s) en /admin/plan</p>` : ''}
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU Demand Forecast',
      to: 'ti@peyuchile.cl',
      subject: `🔮 Plan producción · ${urgentes.length} SKU(s) urgente(s) · ${(ai?.skus_criticos || []).length} en plan`,
      body: html,
    });

    return Response.json({
      ok: true,
      skus_analizados: skusActivos.length,
      urgentes: urgentes.length,
      tareas_creadas: urgentes.length,
      forecast: ai,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});