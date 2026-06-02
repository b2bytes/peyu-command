import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reporte de avances de certificación E2E a los fundadores PEYU.
// Envío puntual vía Resend. Usa el dominio sandbox de Resend como FROM
// (siempre entrega) y reply-to a ventas@b2business.lat.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return Response.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });

    const FROM = 'B2Business · LyaLab <onboarding@resend.dev>';
    const TO = ['jnilo@peyuchile.cl', 'ventas@peyuchile.cl'];
    const CC = ['admin@lyalab.tech'];
    const REPLY_TO = 'ventas@b2business.lat';

    const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.6">
  <div style="background:linear-gradient(135deg,#0F8B6C,#0B6E55);padding:28px 32px;border-radius:16px 16px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">🐢 PEYU · Reporte de Avances</h1>
    <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px">Certificación End-to-End de los flujos de venta · 2 jun 2026</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:28px 32px;border-radius:0 0 16px 16px">
    <p>Hola equipo,</p>
    <p>Completamos la <strong>certificación End-to-End</strong> de los principales funnels de venta de PEYU. Resumen de resultados:</p>

    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">
      <thead>
        <tr style="background:#f0fdf8">
          <th align="left" style="padding:10px;border:1px solid #e5e7eb">Flujo</th>
          <th align="left" style="padding:10px;border:1px solid #e5e7eb">Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:10px;border:1px solid #e5e7eb">Mockup B2C (ficha de producto con grabado láser)</td><td style="padding:10px;border:1px solid #e5e7eb">✅ Operativo</td></tr>
        <tr><td style="padding:10px;border:1px solid #e5e7eb">Cotizador B2B self-service (precios por tramo)</td><td style="padding:10px;border:1px solid #e5e7eb">✅ Operativo</td></tr>
        <tr><td style="padding:10px;border:1px solid #e5e7eb">Chat conversacional /v2 (asistente Peyu)</td><td style="padding:10px;border:1px solid #e5e7eb">✅ Operativo</td></tr>
        <tr><td style="padding:10px;border:1px solid #e5e7eb">Captura automática de leads desde el chat (B2C/B2B)</td><td style="padding:10px;border:1px solid #e5e7eb">✅ Operativo</td></tr>
        <tr><td style="padding:10px;border:1px solid #e5e7eb">Cobro de personalización láser (gratis desde 10u)</td><td style="padding:10px;border:1px solid #e5e7eb">✅ Operativo</td></tr>
        <tr><td style="padding:10px;border:1px solid #e5e7eb">Banner de campaña Cyber (activable por flag)</td><td style="padding:10px;border:1px solid #e5e7eb">✅ Operativo</td></tr>
      </tbody>
    </table>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;margin:18px 0">
      <p style="margin:0 0 6px;font-weight:600;color:#9a3412">⚠️ Único pendiente — acción de Diego</p>
      <p style="margin:0;font-size:14px;color:#7c2d12">El envío automático de correos a clientes B2B está limitado porque la cuenta de <strong>Resend está en modo sandbox</strong>. Hay que verificar el dominio <strong>peyuchile.cl</strong> en resend.com/domains (agregar registros DNS). Mientras tanto, las propuestas siempre se crean y quedan accesibles por link.</p>
    </div>

    <p>El sistema está certificado y operativo en producción. Quedamos atentos.</p>
    <p style="margin-top:24px;color:#6b7280;font-size:13px">— Equipo B2Business · LyaLab</p>
  </div>
</div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        cc: CC,
        reply_to: REPLY_TO,
        subject: 'PEYU · Reporte de avances — Certificación E2E completada ✅',
        html,
      }),
    });

    const result = await r.json();
    if (!r.ok) {
      return Response.json({ error: `Resend ${r.status}`, detail: result }, { status: r.status });
    }

    return Response.json({ success: true, id: result.id, to: TO, cc: CC });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});