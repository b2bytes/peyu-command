import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 14:00 — Recordatorio de pago anticipo B2B.
 * Detecta CorporateProposal en estado "Aceptada" cuya updated_date sea
 * hace ≥3 días y aún no tengan registro de pago anticipo (notas no contienen
 * "[ANTICIPO_PAGADO]"). Envía recordatorio al cliente + alerta interna si >7d.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const propuestas = await base44.asServiceRole.entities.CorporateProposal.list('-updated_date', 100);
    const aceptadas = propuestas.filter(p => p.status === 'Aceptada' && p.email);

    const ahora = new Date();
    const dias = (d) => Math.floor((ahora - new Date(d)) / (1000 * 60 * 60 * 24));

    let recordatoriosEnviados = 0;
    let alertasInternas = 0;
    const morosos = [];

    for (const prop of aceptadas) {
      const d = dias(prop.updated_date);
      if (d < 3) continue;

      const notas = prop.production_notes || '';
      if (notas.includes('[ANTICIPO_PAGADO]')) continue;

      // Marca para evitar reenvío diario - solo recordatorios cada 3 días
      const ultimoRecordatorio = (notas.match(/\[ANTICIPO_REM_(\d{4}-\d{2}-\d{2})\]/g) || []).slice(-1)[0];
      const diasDesdeUlt = ultimoRecordatorio
        ? dias(ultimoRecordatorio.match(/\d{4}-\d{2}-\d{2}/)[0])
        : 999;
      if (diasDesdeUlt < 3) continue;

      const anticipoPct = prop.anticipo_pct || 50;
      const montoAnticipo = Math.round(((prop.total || 0) * anticipoPct) / 100);
      const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

      try {
        // Email al cliente
        const tono = d > 7 ? 'firme pero cordial' : 'cordial recordatorio';
        const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#006D5B);padding:24px 28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE · Anticipo pendiente</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">${prop.contacto || 'Hola'}, hagamos avanzar tu pedido 🚀</h1>
  </div>
  <div style="padding:24px 28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">Tenemos lista la propuesta <strong>${prop.numero || prop.id}</strong> que aceptaste hace ${d} días. Para iniciar producción necesitamos confirmar el anticipo del ${anticipoPct}%:</p>
    <div style="background:#f0faf7;border-radius:12px;padding:18px;margin:16px 0;text-align:center">
      <p style="margin:0;color:#006D5B;font-size:11px;font-weight:700;letter-spacing:1px">ANTICIPO ${anticipoPct}%</p>
      <p style="margin:6px 0 0;font-size:30px;font-weight:900;color:#0F8B6C">${fmt(montoAnticipo)}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#4B4F54">Total propuesta: ${fmt(prop.total)}</p>
    </div>
    <div style="background:#fef9e7;border-radius:10px;padding:14px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:13px">📋 Datos de transferencia</p>
      <p style="margin:0;font-size:12px;color:#4B4F54;line-height:1.7">
        <strong>Peyu Chile SPA</strong> · RUT 77.953.484-3<br>
        Banco Estado · Cuenta Vista Empresarial<br>
        N° 12700016253 · ventas@peyuchile.cl
      </p>
    </div>
    <p style="margin:16px 0;font-size:13px;color:#4B4F54">Una vez confirmado el pago, tu lead time inicia y entregamos en ${prop.lead_time_dias || 14} días hábiles.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://wa.me/56977076280?text=Hola,%20envío%20comprobante%20de%20anticipo%20propuesta%20${encodeURIComponent(prop.numero || prop.id)}"
         style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:13px">
        Enviar comprobante por WhatsApp →
      </a>
    </div>
    ${d > 7 ? `<p style="margin:16px 0 0;font-size:12px;color:#92400e;background:#fef9e7;padding:10px;border-radius:8px;text-align:center"><strong>Importante:</strong> Tu propuesta vence pronto. Si necesitas ajustar plazos, escríbenos al WhatsApp.</p>` : ''}
  </div>
</div></body></html>`;

        await base44.integrations.Core.SendEmail({
          from_name: 'Peyu Chile · Producción',
          to: prop.email,
          subject: `${prop.contacto || prop.empresa}, recordatorio anticipo ${prop.numero || ''} · ${fmt(montoAnticipo)}`,
          body: html,
        });

        // Marcar la propuesta para no spamear
        await base44.asServiceRole.entities.CorporateProposal.update(prop.id, {
          production_notes: `${notas}\n[ANTICIPO_REM_${ahora.toISOString().split('T')[0]}]`.trim(),
        });

        recordatoriosEnviados++;

        // Si lleva >7 días, alertar al equipo interno
        if (d > 7) {
          morosos.push({ empresa: prop.empresa, dias: d, monto: montoAnticipo, numero: prop.numero });
          alertasInternas++;
        }
      } catch (e) {
        console.error(`Error recordatorio prop ${prop.id}:`, e.message);
      }
    }

    // Email interno consolidado si hay morosos
    if (morosos.length > 0) {
      const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
      const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#fff5f5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #f59e0b;padding:24px">
  <h2 style="color:#92400e;margin:0 0 12px;font-size:18px">⚠️ ${morosos.length} propuesta(s) sin anticipo &gt; 7 días</h2>
  <p style="color:#4B4F54;font-size:13px;margin:0 0 16px">Estas propuestas fueron aceptadas pero el cliente aún no transfiere el anticipo. Recomendado: llamar.</p>
  <table style="width:100%;font-size:12px;border-collapse:collapse">
    ${morosos.map(m => `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:8px 4px"><strong>${m.empresa}</strong><br><span style="color:#6b7280;font-size:11px">${m.numero || ''}</span></td>
        <td style="padding:8px 4px;text-align:center"><span style="background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:999px;font-weight:700;font-size:11px">${m.dias}d</span></td>
        <td style="padding:8px 4px;text-align:right"><strong style="color:#0F8B6C">${fmt(m.monto)}</strong></td>
      </tr>`).join('')}
  </table>
</div></body></html>`;

      await base44.integrations.Core.SendEmail({
        from_name: 'PEYU Cobranzas',
        to: 'ti@peyuchile.cl',
        subject: `⚠️ ${morosos.length} propuesta(s) sin anticipo >7 días`,
        body: html,
      });
    }

    return Response.json({
      ok: true,
      propuestas_aceptadas: aceptadas.length,
      recordatorios_enviados: recordatoriosEnviados,
      morosos_alertados: alertasInternas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});