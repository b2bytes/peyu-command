import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// b2bNurturingSequence — Secuencia inteligente de emails post-cotización B2B.
// Disparado por CRON cada hora. Analiza todos los B2BLead activos y envía
// el email correcto según el tiempo transcurrido y el estado actual.
//
// SECUENCIA COMPLETA (desde el email de cotización inmediato de quickB2BQuoteV2):
//
//   T+0h   → Email inmediato cotización PDF (ya lo hace quickB2BQuoteV2)
//   T+4h   → Email "ya revisaste tu cotización?" con 1-click CTA (si no abrió/respondió)
//   T+24h  → Email propuesta técnica formal con botón "Aceptar" (si no aceptó)
//   T+72h  → Email valor + ESG + urgencia suave ("quedan X días de validez")
//   T+7d   → Email "¿cambiaste de idea?" + cupon + alternativa más económica
//   T+14d  → Email cierre cortés + reactivación
//   T+15d  → Lead marcado Perdido automáticamente si no hubo respuesta
//
// Idempotente: usa historial del lead para no duplicar envíos.
// ════════════════════════════════════════════════════════════════════════

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const clp = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');

async function sendResend({ to, subject, html, from = 'PEYU Chile <ventas@peyuchile.cl>' }) {
  if (!RESEND_API_KEY || !to || !/\S+@\S+\.\S+/.test(to)) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!r.ok) console.error('Resend error:', await r.text());
    return r.ok;
  } catch (e) { console.error('sendResend exception:', e?.message); return false; }
}

function daysSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}
function hoursSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

function hasEmailType(historial, type) {
  return (historial || []).some(h => h.type === 'email_sent' && (h.meta?.email_type === type || h.detail?.includes(type)));
}

// ── TEMPLATES HTML (todos inline, sin imports locales) ────────────────

function emailT1({ contacto, empresa, numero, propUrl }) {
  // T+4h: recordatorio suave
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:24px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0F8B6C,#0B6E55);padding:28px 32px;">
  <p style="margin:0;font-size:11px;color:#A7D9C9;font-weight:700;letter-spacing:2px;text-transform:uppercase;">PEYU · CORPORATE</p>
  <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:800;">Oye ${contacto || 'ahí'} 👋</h1>
</td></tr>
<tr><td style="padding:32px;">
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;">
    Hace unas horas te enviamos la cotización <strong style="color:#0F172A;">${numero || ''}</strong> para <strong>${empresa}</strong>.
    Solo quería asegurarme de que llegó bien y de que no tienes dudas.
  </p>
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 28px;">
    Si algo no cuadra, ya sea precio, cantidad o plazo, escríbeme directo y lo revisamos juntos en minutos.
  </p>
  ${propUrl ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  <tr><td align="center">
    <a href="${propUrl}" style="display:inline-block;background:linear-gradient(135deg,#0F8B6C,#0B6E55);color:#fff;text-decoration:none;padding:16px 32px;border-radius:14px;font-weight:700;font-size:15px;">
      Ver mi cotización →
    </a>
  </td></tr></table>` : ''}
  <div style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
    <p style="margin:0;font-size:13px;color:#78350F;">
      ¿Tienes plástico para reciclar? Al enviar tu plástico, descuentos adicionales en el pedido.
      <a href="https://wa.me/56935040242" style="color:#0F8B6C;font-weight:700;text-decoration:none;"> Cuéntame →</a>
    </p>
  </div>
  <p style="font-size:13px;color:#94A3B8;text-align:center;">Carlos · PEYU Chile · ventas@peyuchile.cl · +56 9 3504 0242</p>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#94A3B8;">♻ Cada PEYU evita que el plástico llegue al vertedero · peyuchile.cl</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function emailT2({ contacto, empresa, numero, total, propUrl, qtyTotal, leadTimeDias }) {
  // T+24h: propuesta técnica formal con CTA aceptar
  const kg = Math.round((qtyTotal || 50) * 0.05 * 10) / 10;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:24px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0F172A 0%,#0A4A3D 60%,#0F8B6C 100%);padding:40px 40px 36px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase;">PEYU · CORPORATE</p>
  <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">Propuesta lista para ${empresa}</h1>
  <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);">Personalizada para ${contacto || 'ti'} · ${numero || ''}</p>
</td></tr>
<tr><td style="padding:36px 40px 8px;">
  <p style="font-size:16px;color:#0F172A;font-weight:600;margin:0 0 8px;">Hola ${contacto || 'ahí'},</p>
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">
    Armamos tu propuesta técnica y económica formal para <strong>${empresa}</strong>. Incluye precios por volumen, condiciones de pago, lead time y el impacto ambiental de tu pedido.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:linear-gradient(135deg,#F0FAF7,#E0F2EB);border:1px solid #C8E6DA;border-radius:16px;margin-bottom:24px;">
  <tr><td style="padding:24px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#0F8B6C;text-transform:uppercase;">Inversión total</p>
    <p style="margin:0;font-size:38px;font-weight:800;color:#0F172A;letter-spacing:-1px;">${total ? clp(total) : '—'}</p>
    <p style="margin:6px 0 0;font-size:12px;color:#64748B;">CLP · IVA incluido · ${(qtyTotal || 0).toLocaleString('es-CL')} unidades · Lead time ${leadTimeDias || 7} días</p>
  </td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
  <tr><td align="center">
    <a href="${propUrl}" style="display:block;background:linear-gradient(135deg,#0F8B6C,#0A6B54);color:#fff;text-decoration:none;padding:18px 28px;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 6px 20px rgba(15,139,108,0.35);text-align:center;">
      Ver y aceptar propuesta →
    </a>
  </td></tr></table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr>
    <td width="49%" align="center" style="padding-right:6px;">
      <a href="https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, soy ${contacto || ''} de ${empresa}. Quiero avanzar con la propuesta ${numero || ''}.`)}" style="display:block;background:#25D366;color:#fff;text-decoration:none;padding:13px 16px;border-radius:12px;font-weight:600;font-size:13px;text-align:center;">WhatsApp →</a>
    </td>
    <td width="49%" align="center" style="padding-left:6px;">
      <a href="mailto:ventas@peyuchile.cl?subject=Ajuste propuesta ${numero || ''}&body=Hola PEYU, quisiera ajustar algo de la propuesta." style="display:block;background:#F4F1EB;color:#0F172A;text-decoration:none;padding:13px 16px;border-radius:12px;font-weight:600;font-size:13px;border:1px solid #E5E0D6;text-align:center;">Ajustar →</a>
    </td>
  </tr></table>
  <div style="background:#E0F2EB;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0;font-size:13px;color:#0F8B6C;font-weight:700;">🌱 Tu pedido rescata ~${kg}kg de plástico</p>
    <p style="margin:6px 0 0;font-size:12px;color:#1B5E20;">Tu marca asociada a la economía circular real. Incluye certificado de impacto ambiental.</p>
  </div>
  <p style="font-size:12px;color:#94A3B8;text-align:center;">Carlos · PEYU Chile · ventas@peyuchile.cl · +56 9 3504 0242</p>
</td></tr>
<tr><td style="background:#0F172A;padding:24px 40px;text-align:center;">
  <p style="margin:0 0 4px;font-size:13px;color:#fff;font-weight:700;">PEYU Chile SpA</p>
  <p style="margin:0;font-size:11px;color:#94A3B8;">♻ peyuchile.cl · ventas@peyuchile.cl · +56 9 3504 0242</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function emailT3({ contacto, empresa, numero, diasRestantes, total, propUrl }) {
  // T+72h: urgencia suave de validez
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:24px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#D96B4D,#B85537);padding:28px 32px;">
  <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:2px;text-transform:uppercase;">PEYU · Recordatorio</p>
  <h1 style="margin:0;font-size:22px;color:#fff;font-weight:800;">⏳ Quedan ${diasRestantes || 12} días de validez</h1>
</td></tr>
<tr><td style="padding:32px 40px 8px;">
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">
    Hola ${contacto || 'ahí'}, la propuesta <strong style="color:#0F172A;">${numero || ''}</strong> para <strong>${empresa}</strong> por <strong style="color:#0F8B6C;">${total ? clp(total) : '—'}</strong> vence en <strong style="color:#D96B4D;">${diasRestantes || 12} días</strong>.
  </p>
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">
    Los precios por volumen que cotizamos son del catálogo actual. Si el pedido se extiende mucho, podríamos tener que actualizar la tarifa. Por eso te escribo ahora.
  </p>
  ${propUrl ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center">
    <a href="${propUrl}" style="display:inline-block;background:linear-gradient(135deg,#0F8B6C,#0B6E55);color:#fff;text-decoration:none;padding:16px 32px;border-radius:14px;font-weight:700;font-size:15px;">
      Ver propuesta y aceptar →
    </a>
  </td></tr></table>` : ''}
  <div style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
    <p style="margin:0;font-size:13px;color:#78350F;line-height:1.5;">
      ¿Te falta algo para tomar la decisión? ¿Necesitas más mockups, ajustar cantidades o una muestra física?
      <a href="https://wa.me/56935040242" style="color:#0F8B6C;font-weight:700;text-decoration:none;"> Escríbeme →</a>
    </p>
  </div>
  <p style="font-size:12px;color:#94A3B8;text-align:center;">Carlos · PEYU Chile · ventas@peyuchile.cl · +56 9 3504 0242</p>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#94A3B8;">♻ peyuchile.cl · Para darte de baja responde "no gracias".</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function emailT4({ contacto, empresa, numero, propUrl, alternativaUrl }) {
  // T+7d: ¿cambiaste de idea?
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:24px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1E293B,#0F4A40);padding:28px 32px;">
  <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.7);font-weight:700;letter-spacing:2px;text-transform:uppercase;">PEYU · Última vuelta</p>
  <h1 style="margin:0;font-size:22px;color:#fff;font-weight:800;">¿El presupuesto no cuadraba?</h1>
</td></tr>
<tr><td style="padding:32px 40px 8px;">
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">
    Hola ${contacto || 'ahí'}, hace una semana te enviamos la propuesta <strong style="color:#0F172A;">${numero || ''}</strong> para <strong>${empresa}</strong>. No te hemos escuchado y lo entiendo, a veces el timing no es el correcto.
  </p>
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">
    Si el volumen o el precio era un freno, podemos ajustar. Tenemos opciones de menos unidades, sin grabado, o un mix de productos que quizás se adapta mejor.
  </p>
  ${propUrl ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center">
    <a href="${propUrl}" style="display:inline-block;background:linear-gradient(135deg,#0F8B6C,#0B6E55);color:#fff;text-decoration:none;padding:16px 32px;border-radius:14px;font-weight:700;font-size:15px;">
      Ver mi propuesta →
    </a>
  </td></tr></table>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
    <td align="center" style="padding:6px;">
      <a href="https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, quiero ver alternativas para la propuesta ${numero || ''}.`)}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:700;font-size:14px;">
        Ver alternativas por WhatsApp →
      </a>
    </td>
  </tr></table>
  <p style="font-size:12px;color:#94A3B8;text-align:center;">Si ya no tienes interés, simplemente responde "no gracias" y no te escribimos más.</p>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#94A3B8;">♻ PEYU Chile · peyuchile.cl</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function emailT5({ contacto, empresa, numero }) {
  // T+14d: cierre cortés
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:24px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#4B4F54,#2C1810);padding:28px 32px;">
  <h1 style="margin:0;font-size:22px;color:#fff;font-weight:800;">Cerramos la propuesta ${numero || ''}</h1>
</td></tr>
<tr><td style="padding:32px 40px 8px;">
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">
    Hola ${contacto || 'ahí'}, marcamos la propuesta para <strong>${empresa}</strong> como cerrada por el momento. Sin presión.
  </p>
  <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">
    Cuando tengas un nuevo proyecto o el momento sea el correcto, aquí vamos a estar.
    Solo responde este email o escríbenos y arrancamos de nuevo.
  </p>
  <div style="background:#E0F2EB;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0;font-size:13px;color:#0F8B6C;font-weight:700;">🌱 Por si las dudas: toda compra PEYU rescata plástico real de Chile</p>
    <p style="margin:6px 0 0;font-size:12px;color:#1B5E20;">Somos el único fabricante de regalos corporativos 100% reciclados hecho en Santiago.</p>
  </div>
  <p style="font-size:12px;color:#94A3B8;text-align:center;">Con cariño, Carlos · PEYU Chile · ventas@peyuchile.cl</p>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#94A3B8;">♻ peyuchile.cl · Este es el último email de seguimiento.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

// ── Procesar un lead ───────────────────────────────────────────────────
async function processLead(svc, lead, baseUrl) {
  const historial = Array.isArray(lead.historial) ? lead.historial : [];

  // Fecha de creación del lead
  const createdAt = lead.created_date || new Date().toISOString();
  const hours = hoursSince(createdAt);
  const days = hours / 24;

  // Buscar propuesta asociada (la más reciente)
  let propuesta = null;
  try {
    const props = await svc.entities.CorporateProposal.filter({ b2b_lead_id: lead.id }, '-created_date', 1);
    propuesta = props && props[0];
  } catch { /* noop */ }

  // Si la propuesta fue aceptada, no hay nada que hacer
  if (propuesta?.status === 'Aceptada' || lead.status === 'Aceptado' || lead.status === 'Ganado') return { skip: 'already_won' };

  const propUrl = propuesta ? `${baseUrl}/b2b/propuesta?id=${propuesta.id}` : null;
  const total = propuesta?.total;
  const qtyTotal = lead.qty_estimate || 50;
  const leadTimeDias = propuesta?.lead_time_dias || 7;
  const numero = propuesta?.numero || lead.id?.slice(-6)?.toUpperCase();
  const vencimientoAt = propuesta?.fecha_vencimiento;
  const diasRestantes = vencimientoAt
    ? Math.max(0, Math.ceil((new Date(vencimientoAt) - Date.now()) / (1000 * 60 * 60 * 24)))
    : 15 - Math.floor(days);

  // Si venció (T+15d) y no respondió → marcar perdido
  if (days > 15 && !hasEmailType(historial, 'cierre') && lead.status !== 'Perdido') {
    await svc.entities.B2BLead.update(lead.id, {
      status: 'Perdido',
      historial: [...historial, {
        at: new Date().toISOString(), type: 'lost',
        actor: 'system', channel: 'system',
        detail: 'Marcado automáticamente como Perdido (15 días sin respuesta)',
      }],
    });
    return { action: 'marked_lost' };
  }

  let emailType = null;
  let subject = null;
  let html = null;

  // T+4h: recordatorio "¿revisaste?"
  if (hours >= 4 && hours < 24 && !hasEmailType(historial, 'recordatorio_4h')) {
    emailType = 'recordatorio_4h';
    subject = `¿Llegó bien tu cotización PEYU ${numero}? 📋`;
    html = emailT1({ contacto: lead.contact_name, empresa: lead.company_name, numero, propUrl });
  }
  // T+24h: propuesta técnica formal
  else if (hours >= 24 && hours < 48 && !hasEmailType(historial, 'propuesta_formal')) {
    emailType = 'propuesta_formal';
    subject = `Tu propuesta técnica PEYU ${numero} · ${lead.company_name}`;
    html = emailT2({ contacto: lead.contact_name, empresa: lead.company_name, numero, total, propUrl, qtyTotal, leadTimeDias });
  }
  // T+72h: urgencia suave
  else if (hours >= 72 && hours < 96 && !hasEmailType(historial, 'urgencia_validez')) {
    emailType = 'urgencia_validez';
    subject = `⏳ Quedan ${diasRestantes} días para tu propuesta PEYU`;
    html = emailT3({ contacto: lead.contact_name, empresa: lead.company_name, numero, diasRestantes, total, propUrl });
  }
  // T+7d: ¿cambiaste de idea?
  else if (days >= 7 && days < 8 && !hasEmailType(historial, 'reactivacion_7d')) {
    emailType = 'reactivacion_7d';
    subject = `¿Algo frenó el pedido para ${lead.company_name}?`;
    html = emailT4({ contacto: lead.contact_name, empresa: lead.company_name, numero, propUrl });
  }
  // T+14d: cierre cortés
  else if (days >= 14 && days < 15 && !hasEmailType(historial, 'cierre')) {
    emailType = 'cierre';
    subject = `Cerramos la propuesta PEYU para ${lead.company_name}`;
    html = emailT5({ contacto: lead.contact_name, empresa: lead.company_name, numero });
  }

  if (!emailType || !lead.email || !html) return { skip: 'no_action_needed' };

  const sent = await sendResend({ to: lead.email, subject, html });

  if (sent) {
    await svc.entities.B2BLead.update(lead.id, {
      historial: [...historial, {
        at: new Date().toISOString(),
        type: 'email_sent',
        actor: 'system',
        channel: 'email',
        detail: `Secuencia nurturing: ${emailType}`,
        meta: { email_type: emailType, subject },
      }],
    });
    console.log(`✓ Enviado [${emailType}] a ${lead.email} (lead: ${lead.id})`);
  }

  return { action: emailType, sent, lead_id: lead.id };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Solo admin o cron
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    } catch { /* cron sin auth: ok */ }

    const baseUrl = (req.headers.get('origin') || 'https://peyuchile.cl').replace(/\/$/, '');

    // Obtener leads activos (últimos 16 días, no perdidos ni ganados)
    const leads = await svc.entities.B2BLead.filter(
      { status: 'Nuevo' }, '-created_date', 100
    );
    const leadsContactados = await svc.entities.B2BLead.filter(
      { status: 'Contactado' }, '-created_date', 50
    );
    const leadsRevision = await svc.entities.B2BLead.filter(
      { status: 'En revisión' }, '-created_date', 50
    );

    const todos = [...(leads || []), ...(leadsContactados || []), ...(leadsRevision || [])];
    const activos = todos.filter(l => {
      const days = daysSince(l.created_date || new Date().toISOString());
      return days <= 16;
    });

    const results = [];
    for (const lead of activos) {
      try {
        const r = await processLead(svc, lead, baseUrl);
        results.push({ id: lead.id, ...r });
      } catch (e) {
        results.push({ id: lead.id, error: e?.message });
      }
      // Pausa mínima entre leads para no saturar la API de Resend
      await new Promise(res => setTimeout(res, 200));
    }

    return Response.json({
      ok: true,
      processed: activos.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});