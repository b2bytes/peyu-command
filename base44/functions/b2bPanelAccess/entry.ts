// Panel B2B self-service — autenticación ligera por email + OTP de 6 dígitos.
//
// Modos:
//  - action="request": genera OTP, lo guarda en el B2BLead más reciente del email y lo envía por mail.
//  - action="verify" : valida OTP y devuelve todas las CorporateProposal + mockups + leads de esa empresa.
//
// Decisión de diseño:
//  - No creamos entidad nueva para OTP. Guardamos el código en el campo `notes` del B2BLead más reciente
//    como "[OTP:123456|exp:1712345678]" y lo borramos tras verificar. Evita sumar tablas.
//  - Las cotizaciones se agrupan por email (identidad de la empresa en el panel).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutos
const OTP_RE = /\[OTP:(\d{6})\|exp:(\d+)\]/;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function stripOTP(notes) {
  return (notes || '').replace(OTP_RE, '').trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { action, email, code } = body || {};

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email requerido' }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase().trim();

    // ───────────── REQUEST OTP ─────────────
    if (action === 'request') {
      // Busca leads de este email
      const leads = await svc.entities.B2BLead.filter({ email: normalizedEmail });
      if (!leads || leads.length === 0) {
        return Response.json({
          error: 'No encontramos cotizaciones con ese email. Si nunca has cotizado con nosotros, usa el formulario de contacto.',
        }, { status: 404 });
      }

      // Tomamos el más reciente para guardar el OTP
      const sorted = [...leads].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
      const latest = sorted[0];
      const otp = generateOTP();
      const expires = Date.now() + OTP_TTL_MS;
      const cleanNotes = stripOTP(latest.notes);
      const newNotes = `${cleanNotes}\n[OTP:${otp}|exp:${expires}]`.trim();

      await svc.entities.B2BLead.update(latest.id, { notes: newNotes });

      // Email
      try {
        await svc.integrations.Core.SendEmail({
          to: normalizedEmail,
          from_name: 'PEYU Chile',
          subject: `Tu código de acceso: ${otp}`,
          body: `Hola ${latest.contact_name || ''},

Tu código para acceder a tu panel B2B de PEYU es:

    ${otp}

Es válido por 10 minutos. Si no solicitaste este código, ignora este correo.

— Equipo PEYU Chile
peyuchile.com`,
        });
      } catch (mailErr) {
        console.warn('Fallo envío email OTP:', mailErr?.message);
        return Response.json({ error: 'No pudimos enviar el código. Intenta más tarde.' }, { status: 500 });
      }

      return Response.json({
        success: true,
        message: `Enviamos un código a ${normalizedEmail}. Revisa tu correo.`,
        masked_company: latest.company_name,
      });
    }

    // ───────────── VERIFY OTP ─────────────
    if (action === 'verify') {
      if (!code || !/^\d{6}$/.test(String(code))) {
        return Response.json({ error: 'Código inválido' }, { status: 400 });
      }

      const leads = await svc.entities.B2BLead.filter({ email: normalizedEmail });
      if (!leads || leads.length === 0) {
        return Response.json({ error: 'Email no encontrado' }, { status: 404 });
      }

      // Busca cualquier lead con OTP válido
      let validLead = null;
      for (const l of leads) {
        const m = (l.notes || '').match(OTP_RE);
        if (!m) continue;
        const [, storedCode, expStr] = m;
        const exp = parseInt(expStr, 10);
        if (storedCode === String(code) && Date.now() < exp) {
          validLead = l;
          break;
        }
      }

      if (!validLead) {
        return Response.json({ error: 'Código incorrecto o expirado' }, { status: 401 });
      }

      // Limpia el OTP usado
      await svc.entities.B2BLead.update(validLead.id, { notes: stripOTP(validLead.notes) });

      // Carga propuestas de ese email (histórico completo)
      const proposals = await svc.entities.CorporateProposal.filter({ email: normalizedEmail });

      // Recolecta todos los mockups: de las propuestas + de los leads
      const mockups = [];
      for (const p of proposals) {
        for (const url of (p.mockup_urls || [])) {
          mockups.push({ url, source: 'proposal', ref: p.numero, date: p.fecha_envio || p.created_date });
        }
      }
      for (const l of leads) {
        for (const url of (l.mockup_urls || [])) {
          mockups.push({ url, source: 'lead', ref: l.company_name, date: l.created_date });
        }
      }

      // Datos de perfil (del lead más reciente)
      const sorted = [...leads].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
      const profile = sorted[0];

      // Token de sesión simple (válido 24h) — solo para que el front lo reenvíe y evitar re-OTP
      const sessionToken = btoa(`${normalizedEmail}:${Date.now() + 24 * 60 * 60 * 1000}`);

      return Response.json({
        success: true,
        session_token: sessionToken,
        profile: {
          email: normalizedEmail,
          company_name: profile.company_name,
          contact_name: profile.contact_name,
          phone: profile.phone,
          rut: profile.rut,
          logo_url: profile.logo_url || '',
        },
        proposals: proposals
          .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))
          .map(p => ({
            id: p.id,
            numero: p.numero,
            total: p.total,
            subtotal: p.subtotal,
            status: p.status,
            fecha_envio: p.fecha_envio || p.created_date,
            fecha_vencimiento: p.fecha_vencimiento,
            lead_time_dias: p.lead_time_dias,
            items: p.items_json ? JSON.parse(p.items_json) : [],
            mockup_urls: p.mockup_urls || [],
          })),
        mockups,
        total_leads: leads.length,
      });
    }

    return Response.json({ error: 'action debe ser "request" o "verify"' }, { status: 400 });
  } catch (error) {
    console.error('b2bPanelAccess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});