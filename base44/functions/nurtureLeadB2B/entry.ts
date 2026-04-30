import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 10:00 — Nurturing automático de leads B2B "tibios".
 * Atiende los leads con score 30-59 que no han avanzado, enviándoles
 * 2 emails educativos espaciados (regla simple basada en created_date).
 *
 * Día 3 desde creación → Email #1 "Cómo funciona PEYU + casos"
 * Día 7 desde creación → Email #2 "Calcula tu impacto + ejemplos reales"
 *
 * Solo dispara sobre leads en estado "Nuevo" o "Contactado" sin propuesta.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.B2BLead.list('-created_date', 200);
    const ahora = new Date();

    const elegibles = leads.filter(l => {
      if (!l.email) return false;
      if (!['Nuevo', 'Contactado'].includes(l.status)) return false;
      const score = l.lead_score || 0;
      if (score < 30 || score >= 60) return false;
      return true;
    });

    const dias = (date) => Math.floor((ahora - new Date(date)) / (1000 * 60 * 60 * 24));

    let email1Enviados = 0;
    let email2Enviados = 0;

    for (const lead of elegibles) {
      const d = dias(lead.created_date);
      const notas = lead.notes || '';
      const email1Sent = notas.includes('[NURTURE_1]');
      const email2Sent = notas.includes('[NURTURE_2]');

      try {
        if (d >= 3 && d < 7 && !email1Sent) {
          await base44.integrations.Core.SendEmail({
            from_name: 'Felipe · PEYU Chile',
            to: lead.email,
            subject: `${lead.contact_name || 'Hola'}, así trabajamos en PEYU 🌱`,
            body: emailNurture1(lead),
          });
          await base44.asServiceRole.entities.B2BLead.update(lead.id, {
            notes: `${notas}\n[NURTURE_1] enviado ${ahora.toISOString().split('T')[0]}`.trim(),
          });
          email1Enviados++;
        } else if (d >= 7 && d < 14 && !email2Sent) {
          await base44.integrations.Core.SendEmail({
            from_name: 'Felipe · PEYU Chile',
            to: lead.email,
            subject: `${lead.contact_name || 'Hola'}, casos reales de impacto B2B 📊`,
            body: emailNurture2(lead),
          });
          await base44.asServiceRole.entities.B2BLead.update(lead.id, {
            notes: `${notas}\n[NURTURE_2] enviado ${ahora.toISOString().split('T')[0]}`.trim(),
          });
          email2Enviados++;
        }
      } catch (e) {
        console.error(`Error nurturing ${lead.email}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      leads_revisados: leads.length,
      elegibles: elegibles.length,
      email1_enviados: email1Enviados,
      email2_enviados: email2Enviados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function emailNurture1(lead) {
  const empresa = lead.company_name || 'tu empresa';
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#006D5B);padding:24px 28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE · Cómo trabajamos</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">Hola ${lead.contact_name || ''} 👋</h1>
  </div>
  <div style="padding:24px 28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">Vi que te interesaste en nuestros productos para <strong>${empresa}</strong>. Quería compartirte cómo trabajamos para que tengas el contexto completo:</p>
    <div style="background:#f0faf7;border-radius:10px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:700;color:#006D5B">🏭 Producción 100% en Chile</p>
      <p style="margin:0;font-size:13px">Fabricamos en Quinta Normal con plástico reciclado certificado. Sin importaciones de China = lead times reales de 7-14 días.</p>
    </div>
    <div style="background:#fef9e7;border-radius:10px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:700;color:#92400e">🎨 Personalización láser UV gratis</p>
      <p style="margin:0;font-size:13px">Desde 10 unidades. Te entregamos mockups antes de producir, sin costo.</p>
    </div>
    <div style="background:#eff6ff;border-radius:10px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:700;color:#1e40af">♻️ Impacto medible</p>
      <p style="margin:0;font-size:13px">Cada producto evita botellas plásticas del relleno sanitario. Te damos el reporte para tu reporte ESG corporativo.</p>
    </div>
    <p style="margin:24px 0 16px">¿Te tomas 15 minutos para que te muestre el catálogo y armemos algo a tu medida?</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://peyuchile.cl/b2b/contacto" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:13px">Agendar reunión →</a>
    </div>
    <p style="margin:0;color:#6b7280;font-size:12px">Felipe · Director Comercial PEYU<br>+56 9 7707 6280 · ventas@peyuchile.cl</p>
  </div>
</div></body></html>`;
}

function emailNurture2(lead) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#0F8B6C);padding:24px 28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE · Casos reales</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">Empresas que ya confían en nosotros</h1>
  </div>
  <div style="padding:24px 28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">${lead.contact_name || 'Hola'}, te dejo 3 casos rápidos de impacto medible:</p>
    <div style="border-left:3px solid #0F8B6C;padding:0 0 0 16px;margin:16px 0">
      <p style="margin:0;font-weight:700;color:#0F172A">🏢 Empresa Tech (200 colaboradores)</p>
      <p style="margin:6px 0;font-size:13px">300 organizadores escritorio personalizados → 1.200 botellas recicladas + entrega en 12 días.</p>
    </div>
    <div style="border-left:3px solid #D96B4D;padding:0 0 0 16px;margin:16px 0">
      <p style="margin:0;font-weight:700;color:#0F172A">🎓 Universidad privada</p>
      <p style="margin:6px 0;font-size:13px">500 sets bienvenida alumnos → reporte ESG con métricas de huella + logo láser premium.</p>
    </div>
    <div style="border-left:3px solid #0F8B6C;padding:0 0 0 16px;margin:16px 0">
      <p style="margin:0;font-weight:700;color:#0F172A">🏥 Clínica corporativa</p>
      <p style="margin:6px 0;font-size:13px">150 unidades regalo de fin de año → ahorro de 35% vs proveedor importado anterior.</p>
    </div>
    <div style="background:#f0faf7;border-radius:10px;padding:16px;margin:24px 0;text-align:center">
      <p style="margin:0 0 8px;font-weight:700;color:#006D5B">Calcula tu impacto en 1 minuto</p>
      <a href="https://peyuchile.cl/b2b/self-service" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:13px;margin-top:8px">Cotizar ahora →</a>
    </div>
    <p style="margin:0;color:#6b7280;font-size:12px">Felipe · PEYU Chile<br>+56 9 7707 6280</p>
  </div>
</div></body></html>`;
}