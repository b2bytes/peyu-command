import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON · Día 1 de cada mes 10:00 — NPS automático trimestral B2B.
 * Cada 3 meses (enero, abril, julio, octubre) envía encuesta NPS a clientes
 * B2B Activos / VIP con al menos 1 pedido en los últimos 6 meses.
 *
 * Si HOY no es mes de envío, sale sin hacer nada (autocontrolado por cron mensual).
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
    const mes = ahora.getMonth(); // 0-indexed
    const mesesEnvio = [0, 3, 6, 9]; // ene, abr, jul, oct

    if (!mesesEnvio.includes(mes)) {
      return Response.json({ ok: true, skipped: `Mes ${mes + 1} no es trimestre NPS` });
    }

    const hace180 = new Date(ahora.getTime() - 180 * 24 * 60 * 60 * 1000);

    const clientes = await base44.asServiceRole.entities.Cliente.list(null, 500);
    const elegibles = clientes.filter(c => {
      if (!c.email) return false;
      const esB2B = c.tipo === 'B2B Corporativo' || c.tipo === 'B2B Pyme';
      if (!esB2B) return false;
      if (!['Activo', 'VIP'].includes(c.estado)) return false;
      if (!c.fecha_ultima_compra) return false;
      const ultima = new Date(c.fecha_ultima_compra);
      return ultima >= hace180;
    });

    const trimestre = `Q${Math.floor(mes / 3) + 1} ${ahora.getFullYear()}`;
    let enviados = 0;

    for (const c of elegibles) {
      try {
        // Evitar reenvío si ya tiene marca del trimestre actual
        if (c.notas?.includes(`[NPS_${trimestre}]`)) continue;

        const linkBase = `https://peyuchile.cl/soporte?nps=${encodeURIComponent(c.email)}&q=${encodeURIComponent(trimestre)}`;
        const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#0F172A);padding:28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE · ${trimestre}</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:6px 0 0">${c.contacto || c.empresa}, ¿nos recomendarías?</h1>
  </div>
  <div style="padding:28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">Tu opinión vale oro para nosotros. ${c.empresa} es parte importante de PEYU y nos ayudaría mucho saber tu experiencia este trimestre.</p>
    <p style="margin:0 0 24px;font-weight:700;color:#0F172A">En una escala del 0 al 10, ¿qué tan probable es que recomiendes PEYU a otra empresa?</p>

    <div style="text-align:center;margin:24px 0">
      <table style="margin:0 auto;border-collapse:separate;border-spacing:4px">
        <tr>
          ${[0, 1, 2, 3, 4, 5, 6].map(n => `
            <td><a href="${linkBase}&score=${n}" style="display:block;width:40px;height:40px;line-height:40px;background:#fef2f2;color:#dc2626;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">${n}</a></td>
          `).join('')}
        </tr>
        <tr>
          ${[7, 8].map(n => `
            <td><a href="${linkBase}&score=${n}" style="display:block;width:40px;height:40px;line-height:40px;background:#fef9e7;color:#92400e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">${n}</a></td>
          `).join('')}
          ${[9, 10].map(n => `
            <td><a href="${linkBase}&score=${n}" style="display:block;width:40px;height:40px;line-height:40px;background:#f0faf7;color:#006D5B;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">${n}</a></td>
          `).join('')}
        </tr>
      </table>
      <p style="font-size:11px;color:#9ca3af;margin:8px 0 0">0 = Nada probable · 10 = Totalmente probable</p>
    </div>

    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:24px 0;text-align:center">
      <p style="font-size:12px;color:#006D5B;margin:0;font-weight:700">🎁 Como agradecimiento</p>
      <p style="font-size:13px;color:#4B4F54;margin:6px 0 0">Al responder recibes <strong>5% OFF</strong> en tu próxima compra B2B (mínimo 50u).</p>
    </div>

    <p style="margin:0;font-size:12px;color:#6b7280;text-align:center">Solo te toma 10 segundos · 1 click</p>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0">
    <p style="margin:0;color:#6b7280;font-size:11px;text-align:center">Peyu Chile SPA · ventas@peyuchile.cl · +56 9 7707 6280</p>
  </div>
</div></body></html>`;

        await base44.integrations.Core.SendEmail({
          from_name: 'Peyu Chile',
          to: c.email,
          subject: `${c.contacto || c.empresa}, ¿nos recomendarías? · ${trimestre} NPS`,
          body: html,
        });

        await base44.asServiceRole.entities.Cliente.update(c.id, {
          notas: `${c.notas || ''}\n[NPS_${trimestre}] enviado ${ahora.toISOString().split('T')[0]}`.trim(),
        });

        enviados++;
      } catch (e) {
        console.error(`Error NPS cliente ${c.empresa}:`, e.message);
      }
    }

    // Reporte interno
    if (enviados > 0) {
      await base44.integrations.Core.SendEmail({
        from_name: 'PEYU NPS Trimestral',
        to: 'ti@peyuchile.cl',
        subject: `📊 NPS ${trimestre} · ${enviados} encuestas enviadas`,
        body: `<div style="font-family:Inter,Arial,sans-serif;padding:20px"><h2 style="color:#0F8B6C">NPS ${trimestre} desplegado</h2><p>Se enviaron <strong>${enviados}</strong> encuestas NPS a clientes B2B activos con compras en los últimos 6 meses.</p><p>Las respuestas llegan a través del formulario de soporte y deben ser revisadas en /admin/clientes para actualizar el campo nps_score.</p></div>`,
      });
    }

    return Response.json({
      ok: true,
      trimestre,
      total_clientes_b2b: clientes.filter(c => c.tipo?.startsWith('B2B')).length,
      elegibles: elegibles.length,
      enviados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});