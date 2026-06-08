// ════════════════════════════════════════════════════════════════════════
// b2bProposalEmailSequence — Secuencia inteligente de emails post-propuesta B2B.
//
// Flujo (días desde envío de propuesta):
//   Día 0  → Email 1: "Tu propuesta PEYU está lista" (inmediato, con PDF)
//   Día 2  → Email 2: Valor + ESG + muestras (nurturing)
//   Día 5  → Email 3: Urgencia suave + caso de éxito cliente similar
//   Día 10 → Email 4: Última oportunidad + descuento exclusivo 5%
//
// Se llama con: { proposal_id } y verifica qué emails faltan por enviar.
// Idempotente: no reenvía si ya se envió el step.
// ════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Construye el HTML de cada email de la secuencia
function buildEmail(step, proposal) {
  const empresa = proposal.empresa || 'equipo';
  const contacto = proposal.contacto || '';
  const numero = proposal.numero || '';
  const total = proposal.total
    ? `$${Math.round(proposal.total).toLocaleString('es-CL')}`
    : '';
  const validez = proposal.validity_days || 15;
  const link = `https://peyuchile.cl/b2b/propuesta?id=${proposal.id}`;

  const base = `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FDFAF7;border-radius:16px;overflow:hidden;border:1px solid #EBE3D6;">
      <div style="background:linear-gradient(135deg,#2C1810,#4A3025);padding:32px 36px;">
        <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png" alt="PEYU" style="height:36px;object-fit:contain;" />
      </div>
      <div style="padding:36px;">
        CONTENT
      </div>
      <div style="padding:20px 36px;background:#F5EFE8;border-top:1px solid #EBE3D6;text-align:center;">
        <p style="color:#A08070;font-size:12px;margin:0;">PEYU Chile · Plástico reciclado · peyuchile.cl · contacto@peyuchile.cl</p>
        <p style="color:#C0C0B8;font-size:11px;margin:4px 0 0;">Recibes este email porque solicitaste una propuesta corporativa.</p>
      </div>
    </div>
  `;

  const steps = {
    1: {
      subject: `${numero ? `[${numero}] ` : ''}Tu propuesta PEYU está lista, ${empresa} 🎉`,
      content: `
        <h2 style="font-size:24px;color:#2C1810;margin:0 0 8px;">¡Hola${contacto ? `, ${contacto}` : ''}!</h2>
        <p style="color:#7A6050;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Tu propuesta corporativa <strong style="color:#0F8B6C;">${numero}</strong> está lista y adjunta a este correo. 
          Incluye precios por volumen, lead time y condiciones de personalización láser.
        </p>
        ${total ? `<div style="background:white;border-radius:12px;padding:20px;margin:0 0 20px;border:1.5px solid #EBE3D6;text-align:center;">
          <p style="color:#A08070;font-size:13px;margin:0 0 4px;">Total estimado de tu pedido</p>
          <p style="color:#0F8B6C;font-size:32px;font-weight:900;margin:0;">${total}</p>
          <p style="color:#A08070;font-size:12px;margin:4px 0 0;">Válida por ${validez} días · precios netos + IVA</p>
        </div>` : ''}
        <div style="margin:0 0 24px;">
          <p style="color:#2A2420;font-size:14px;font-weight:700;margin:0 0 12px;">¿Qué incluye tu propuesta?</p>
          <ul style="color:#7A6050;font-size:14px;padding-left:20px;line-height:2;">
            <li>Precios por volumen con descuentos reales (hasta −54%)</li>
            <li>Personalización láser de tu logo (desde 10 unidades)</li>
            <li>Lead time estimado y condiciones de pago</li>
            <li>Reporte de impacto ambiental ESG</li>
          </ul>
        </div>
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#0F8B6C,#0B6E55);color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-bottom:20px;">
          Ver propuesta completa →
        </a>
        <p style="color:#A08070;font-size:13px;margin:16px 0 0;">
          ¿Tienes preguntas? Escríbenos a <a href="mailto:corporativo@peyuchile.cl" style="color:#0F8B6C;">corporativo@peyuchile.cl</a> 
          o al <a href="https://wa.me/56935040242" style="color:#0F8B6C;">+56 9 3504 0242</a>.
        </p>
      `,
    },
    2: {
      subject: `${empresa}: por qué las empresas eligen PEYU 🌿`,
      content: `
        <h2 style="font-size:22px;color:#2C1810;margin:0 0 8px;">Hola${contacto ? `, ${contacto}` : ''},</h2>
        <p style="color:#7A6050;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Queremos contarte un poco más de lo que hace diferente a PEYU, más allá del precio.
        </p>
        <div style="display:grid;gap:12px;margin:0 0 24px;">
          ${[
            ['♻️ 100% plástico reciclado', 'Cada pieza nace de tapitas plásticas recolectadas en Santiago. Reemplazar plástico virgen por reciclado reduce la huella de carbono hasta un 73%.'],
            ['🔬 Marmolado único', 'La textura es irrepetible — cada lote tiene su propio patrón. Eso hace que el regalo corporativo sea verdaderamente especial.'],
            ['⚡ Grabado láser permanente', 'Tu logo grabado con precisión de 0.1mm. No se borra, no se descascara. Ideal para regalos institucionales de alto impacto.'],
            ['📊 Reporte ESG incluido', 'Te entregamos certificado de kg de plástico rescatado por tu pedido, listo para tu informe de sostenibilidad.'],
          ].map(([title, desc]) => `
            <div style="background:white;border-radius:12px;padding:16px;border:1px solid #EBE3D6;">
              <p style="font-size:15px;font-weight:700;color:#2A2420;margin:0 0 6px;">${title}</p>
              <p style="font-size:13px;color:#7A6050;margin:0;line-height:1.6;">${desc}</p>
            </div>
          `).join('')}
        </div>
        <a href="${link}" style="display:inline-block;background:#2C1810;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
          Revisar mi propuesta ${numero} →
        </a>
        <p style="color:#A08070;font-size:13px;margin:16px 0 0;">
          ¿Quieres agendar una llamada? <a href="https://wa.me/56935040242" style="color:#0F8B6C;">Escríbenos por WhatsApp</a> y coordinamos en minutos.
        </p>
      `,
    },
    3: {
      subject: `${empresa}, ¿pudiste revisar tu propuesta? 👀`,
      content: `
        <h2 style="font-size:22px;color:#2C1810;margin:0 0 8px;">Hola${contacto ? `, ${contacto}` : ''},</h2>
        <p style="color:#7A6050;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hace unos días te enviamos la propuesta <strong>${numero}</strong>. ¿Pudiste revisarla?
        </p>
        <div style="background:white;border-radius:12px;padding:20px;margin:0 0 24px;border-left:4px solid #0F8B6C;">
          <p style="font-size:14px;font-weight:700;color:#2A2420;margin:0 0 8px;">"Usamos PEYU en nuestro evento corporativo de 300 personas. El impacto fue enorme — los asistentes lo comentaron meses después."</p>
          <p style="font-size:12px;color:#A08070;margin:0;">— Cliente corporativo, sector financiero, Santiago</p>
        </div>
        <p style="color:#7A6050;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Entendemos que los procesos de aprobación toman tiempo. Si necesitas más información, 
          ajustar cantidades o ver muestras físicas antes de decidir, con gusto lo coordinamos.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 20px;">
          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#0F8B6C,#0B6E55);color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;">
            Ver propuesta →
          </a>
          <a href="https://wa.me/56935040242?text=Hola, quiero coordinar una llamada sobre la propuesta ${numero}" 
             style="display:inline-block;background:white;border:1.5px solid #D4C4B0;color:#2C1810;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;">
            Agendar llamada
          </a>
        </div>
        <p style="color:#A08070;font-size:13px;">La propuesta vence en ${validez} días desde su emisión.</p>
      `,
    },
    4: {
      subject: `Último recordatorio: propuesta ${numero} por vencer ⏰`,
      content: `
        <h2 style="font-size:22px;color:#2C1810;margin:0 0 8px;">Hola${contacto ? `, ${contacto}` : ''},</h2>
        <p style="color:#7A6050;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Tu propuesta <strong>${numero}</strong> está próxima a vencer. Queremos que puedas aprovecharla con los mejores términos.
        </p>
        <div style="background:linear-gradient(135deg,#FFF8F0,#FFF0E8);border-radius:12px;padding:20px;margin:0 0 24px;border:1.5px solid #F4D0B0;text-align:center;">
          <p style="font-size:13px;color:#C0785C;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Oferta especial · Solo para ti</p>
          <p style="font-size:28px;font-weight:900;color:#2C1810;margin:0 0 4px;">5% adicional</p>
          <p style="font-size:13px;color:#7A6050;margin:0;">de descuento si confirmas antes del vencimiento de la propuesta</p>
        </div>
        <p style="color:#7A6050;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Responde este correo con "CONFIRMO" o escríbenos por WhatsApp y aplicamos el descuento adicional a tu orden.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 20px;">
          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#C0785C,#A86440);color:white;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
            Confirmar mi pedido →
          </a>
          <a href="https://wa.me/56935040242?text=Quiero confirmar la propuesta ${numero} con el 5% adicional"
             style="display:inline-block;background:white;border:1.5px solid #D4C4B0;color:#2C1810;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
            WhatsApp
          </a>
        </div>
        <p style="color:#A08070;font-size:12px;">
          Si ya tomaste la decisión de no seguir adelante, no hay problema. Responde este email y te sacamos de la secuencia. 
          Siempre disponibles para cuando lo necesites.
        </p>
      `,
    },
  };

  const s = steps[step];
  if (!s) return null;
  return { subject: s.subject, html: base.replace('CONTENT', s.content) };
}

// Días de espera entre cada step de la secuencia
const STEP_DAYS = { 1: 0, 2: 2, 3: 5, 4: 10 };

async function sendStepToProposal(base44, proposal, targetStep) {
  const stepsSent = (proposal.historial || [])
    .filter((h) => h.type === 'email_sent' && h.meta?.sequence === 'proposal_nurturing')
    .map((h) => h.meta.step);

  if (stepsSent.includes(targetStep)) return { skipped: true };
  if (targetStep > 4) return { done: true };
  if (!proposal.email) return { error: 'sin email' };
  // No enviar a propuestas ya cerradas
  if (['Aceptada', 'Rechazada', 'Vencida'].includes(proposal.status)) return { skipped: true, reason: 'propuesta cerrada' };

  const email = buildEmail(targetStep, proposal);
  if (!email) return { error: 'step inválido' };

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'PEYU Corporativo <corporativo@peyuchile.cl>',
      to: [proposal.email],
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    return { error: `Resend: ${err}` };
  }

  const now = new Date().toISOString();
  const historial = [
    ...(proposal.historial || []),
    {
      at: now,
      type: 'email_sent',
      actor: 'sistema',
      channel: 'email',
      detail: `Secuencia nurturing B2B — Step ${targetStep}: ${email.subject}`,
      meta: { sequence: 'proposal_nurturing', step: targetStep },
    },
  ];
  await base44.asServiceRole.entities.CorporateProposal.update(proposal.id, {
    historial,
    recordatorios_enviados: (proposal.recordatorios_enviados || 0) + 1,
    ultimo_recordatorio_at: now,
  });

  return { sent: true, step: targetStep, subject: email.subject };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { proposal_id, step, days_since_sent } = body;

    // ── Modo 1: envío manual a una propuesta específica ──
    if (proposal_id) {
      const proposals = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposal_id });
      const proposal = proposals?.[0];
      if (!proposal) return Response.json({ error: 'Propuesta no encontrada' }, { status: 404 });
      const result = await sendStepToProposal(base44, proposal, step || 1);
      return Response.json({ ok: true, ...result });
    }

    // ── Modo 2: CRON diario — procesa todas las propuestas "Enviada" según días ──
    // Calcula qué step le corresponde a cada propuesta según días transcurridos desde fecha_envio
    const today = new Date();
    const allProposals = await base44.asServiceRole.entities.CorporateProposal.filter({ status: 'Enviada' });
    const results = [];

    for (const proposal of (allProposals || [])) {
      if (!proposal.fecha_envio || !proposal.email) continue;
      const sentDate = new Date(proposal.fecha_envio);
      const daysDiff = Math.floor((today - sentDate) / (1000 * 60 * 60 * 24));

      // Determina el targetStep según días transcurridos
      let targetStep = null;
      for (const [s, d] of Object.entries(STEP_DAYS)) {
        if (daysDiff >= d) targetStep = parseInt(s);
      }
      if (!targetStep) continue;

      const result = await sendStepToProposal(base44, proposal, targetStep);
      if (result.sent) results.push({ proposal_id: proposal.id, ...result });
    }

    return Response.json({ ok: true, processed: results.length, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});