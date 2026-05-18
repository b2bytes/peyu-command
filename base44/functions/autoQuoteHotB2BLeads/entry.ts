// ============================================================================
// PEYU · autoQuoteHotB2BLeads
// ----------------------------------------------------------------------------
// Pieza final del flujo "Vendedor por email automático":
//
//   1) ingestGmailInquiry   ← lee Gmail y crea Consulta (canal=Email)
//   2) triageConsultaIA     ← IA califica calidad/urgencia + borrador
//   3) >>> autoQuoteHotB2BLeads  ← (ESTA) cada 15 min:
//        - busca Consultas tipo="Cotización Corporativa" + calidad="Caliente"
//          que NO hayan sido cotizadas todavía
//        - extrae con IA: empresa, contacto, cantidad, producto, fecha
//        - crea B2BLead → corre scoreLead
//        - si lead_score >= 70 → genera CorporateProposal + envía con
//          sendProposalEmail (Carlos · PEYU)
//        - marca Consulta como respondida + notifica al fundador SOLO al
//          enviar propuesta (sin notificación por cada lead caliente)
//
// Diseñado idempotente: si ya hay una propuesta vinculada al lead asociado a la
// Consulta, no la reprocesa. Marca la Consulta con tag [AUTO_QUOTED:propId].
//
// Solo admin (manual) o sin auth desde scheduled automation.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAG_QUOTED = '[AUTO_QUOTED:';
const RESEND_FROM = 'PEYU Auto-Vendedor <onboarding@resend.dev>';
const FOUNDER_EMAIL = 'alfonsovambe@gmail.com';
const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// Lookback: solo Consultas creadas en los últimos 7 días
const LOOKBACK_DAYS = 7;
// Hard limit por corrida (cada 15 min) para no saturar
const MAX_PER_RUN = 5;

async function notifyFounderProposalSent({ consulta, lead, proposal, breakdown }) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;

  const itemsHtml = (breakdown || []).map(i =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${i.nombre || i.name || i.producto}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${i.qty || i.cantidad}u</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${fmtCLP(i.line_total || 0)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;background:#F4F1EB;padding:24px;margin:0;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border-top:4px solid #0F8B6C;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#0F8B6C;text-transform:uppercase;">✨ Auto-Vendedor PEYU</p>
    <h1 style="margin:0 0 6px;font-size:22px;color:#0F172A;">Propuesta enviada sola: ${lead.company_name}</h1>
    <p style="margin:0 0 18px;font-size:13px;color:#64748B;line-height:1.55;">
      Detecté un lead caliente por email (score <strong>${lead.lead_score || 0}/100</strong>) y envié la propuesta <strong>${proposal.numero}</strong> automáticamente. No tuviste que mover un dedo.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#FAFAF8;border-radius:10px;overflow:hidden;font-size:13px;margin-bottom:14px;">
      <tr><td style="padding:8px 12px;color:#64748B;width:35%;">Empresa</td><td style="padding:8px 12px;font-weight:600;color:#0F172A;">${lead.company_name}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748B;">Contacto</td><td style="padding:8px 12px;font-weight:600;color:#0F172A;">${lead.contact_name} · ${lead.email}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748B;">Cantidad</td><td style="padding:8px 12px;font-weight:600;color:#0F172A;">${lead.qty_estimate || '—'} u</td></tr>
      <tr><td style="padding:8px 12px;color:#64748B;">Total propuesta</td><td style="padding:8px 12px;font-weight:700;color:#0F8B6C;font-size:15px;">${fmtCLP(proposal.total)}</td></tr>
    </table>
    ${itemsHtml ? `<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:18px;">${itemsHtml}</table>` : ''}
    <div style="margin-top:18px;padding:12px 16px;background:#F0FAF7;border-left:4px solid #0F8B6C;border-radius:8px;font-size:13px;color:#0A6B54;line-height:1.5;">
      <strong>Acción opcional:</strong> revisa el correo del cliente para ajustar tono/condiciones, o espera la respuesta. El cliente puede aceptar con 1 click.
    </div>
    <p style="margin-top:18px;text-align:center;">
      <a href="https://peyuchile.cl/admin/propuestas" style="display:inline-block;background:#0F172A;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">Ver propuesta →</a>
    </p>
  </div></body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [FOUNDER_EMAIL],
      subject: `✨ Propuesta auto-enviada · ${lead.company_name} · ${fmtCLP(proposal.total)}`,
      html,
      reply_to: 'ventas@peyuchile.cl',
    }),
  }).catch(e => console.warn('notify founder failed:', e.message));
}

/**
 * Extrae con IA los datos estructurados de la Consulta para construir un B2BLead.
 */
async function extractLeadFromConsulta(base44, consulta) {
  const ai = await base44.integrations.Core.InvokeLLM({
    prompt: `Eres analista comercial B2B de PEYU Chile (regalos corporativos en plástico 100% reciclado, fabricación local, láser UV gratis desde 10u).

Lee esta consulta entrante por email y extrae los datos estructurados para crear un lead B2B:

Nombre del remitente: "${consulta.nombre || ''}"
Email: "${consulta.created_by || consulta.email || ''}"
Mensaje completo:
"""
${consulta.mensaje || ''}
"""

Responde SOLO JSON con esta forma (usa null si no se menciona):
{
  "contact_name": "nombre persona (no empresa)",
  "company_name": "razón social / nombre comercial empresa",
  "phone": "+569... si lo menciona",
  "rut": "RUT empresa si lo menciona",
  "product_interest": "qué producto / categoría pide (ej: 'cachos', 'maceteros', 'set escritorio')",
  "qty_estimate": número de unidades (entero, null si no menciona),
  "delivery_date": "fecha requerida en formato YYYY-MM-DD o null",
  "personalization_needs": true si menciona logo/grabado/personalizado,
  "summary": "resumen de 200 chars de lo que pide y para qué evento/fecha"
}

Reglas:
- Si menciona "unas 100", "alrededor de 50", extrae el número.
- Si dice "para fin de año" sin fecha, deja delivery_date null.
- Si el contacto y empresa son la misma persona natural, company_name = nombre.
- Si NO es un lead corporativo real, qty_estimate = null.`,
    response_json_schema: {
      type: 'object',
      properties: {
        contact_name: { type: 'string' },
        company_name: { type: 'string' },
        phone: { type: 'string' },
        rut: { type: 'string' },
        product_interest: { type: 'string' },
        qty_estimate: { type: 'number' },
        delivery_date: { type: 'string' },
        personalization_needs: { type: 'boolean' },
        summary: { type: 'string' },
      },
    },
  });
  return ai || {};
}

/**
 * Encuentra el producto del catálogo que mejor matchea con la descripción del cliente.
 */
async function pickBestProduct(base44, productInterest, qty) {
  const all = await base44.asServiceRole.entities.Producto.filter({
    activo: true,
    canal: 'B2B + B2C',
  });
  if (!all.length) return null;

  // Match por palabras clave en nombre
  const q = (productInterest || '').toLowerCase();
  const scored = all.map(p => {
    const name = (p.nombre || '').toLowerCase();
    let score = 0;
    for (const word of q.split(/\s+/).filter(w => w.length > 2)) {
      if (name.includes(word)) score += 10;
    }
    if (p.precio_base_b2b) score += 1;
    if ((p.stock_actual || 0) >= (qty || 0)) score += 3;
    return { p, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.p || all[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Permitir invocación admin (manual) o sin auth (scheduled automation)
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since = new Date(Date.now() - LOOKBACK_DAYS * 86400 * 1000).toISOString();

    // ── 1) Buscar Consultas calientes B2B no cotizadas ─────────────────────
    const consultas = await base44.asServiceRole.entities.Consulta.filter({
      canal: 'Email',
      calidad: 'Caliente',
      tipo: 'Cotización Corporativa',
    });
    const candidatas = consultas
      .filter(c => (c.created_date || '') >= since)
      .filter(c => !(c.notas || '').includes(TAG_QUOTED))
      .filter(c => c.estado !== 'Cerrado' && c.estado !== 'Descartado')
      .slice(0, MAX_PER_RUN);

    if (!candidatas.length) {
      return Response.json({
        ok: true,
        processed: 0,
        reason: 'Sin consultas calientes B2B pendientes',
      });
    }

    const results = [];

    for (const consulta of candidatas) {
      try {
        // Extraer datos del lead con IA
        const extracted = await extractLeadFromConsulta(base44, consulta);

        // Validar mínimos
        const qty = parseInt(extracted.qty_estimate) || 0;
        const email = consulta.created_by || extracted.email || '';

        if (!extracted.company_name || qty < 10 || !email) {
          await base44.asServiceRole.entities.Consulta.update(consulta.id, {
            notas: `${consulta.notas || ''}\n${TAG_QUOTED}skipped:datos_insuficientes]`.trim(),
          });
          results.push({ consulta_id: consulta.id, status: 'skipped', reason: 'datos insuficientes (empresa, qty>=10, email)' });
          continue;
        }

        // Crear B2BLead
        const lead = await base44.asServiceRole.entities.B2BLead.create({
          source: 'Email',
          contact_name: extracted.contact_name || consulta.nombre || email,
          company_name: extracted.company_name,
          email,
          phone: extracted.phone || consulta.telefono || '',
          rut: extracted.rut || '',
          product_interest: extracted.product_interest || '',
          qty_estimate: qty,
          delivery_date: extracted.delivery_date || '',
          personalization_needs: !!extracted.personalization_needs,
          status: 'Nuevo',
          urgency: 'Alta',
          notes: `📧 Auto-extraído de Gmail por autoQuoteHotB2BLeads.\nResumen IA: ${extracted.summary || ''}\nMensaje original:\n${(consulta.mensaje || '').slice(0, 600)}`,
        });

        // Score lead (urgency + perfil empresa con web search)
        const scoreRes = await base44.functions.invoke('scoreLead', { leadId: lead.id });
        const finalScore = scoreRes?.data?.lead_score ?? 0;

        // Solo cotizar si score >= 70
        if (finalScore < 70) {
          await base44.asServiceRole.entities.Consulta.update(consulta.id, {
            notas: `${consulta.notas || ''}\n${TAG_QUOTED}skipped:score_${finalScore}]`.trim(),
            estado: 'En seguimiento',
          });
          results.push({ consulta_id: consulta.id, lead_id: lead.id, status: 'skipped', reason: `score ${finalScore} < 70` });
          continue;
        }

        // Elegir producto del catálogo
        const producto = await pickBestProduct(base44, extracted.product_interest, qty);
        if (!producto) {
          results.push({ consulta_id: consulta.id, lead_id: lead.id, status: 'skipped', reason: 'sin producto del catálogo' });
          continue;
        }

        // Construir items para la propuesta
        const items = [{
          nombre: producto.nombre,
          sku: producto.sku,
          qty,
          precio_base: producto.precio_base_b2b || producto.precio_b2c || 5000,
          personalizacion: !!extracted.personalization_needs,
        }];

        // Crear propuesta corporativa
        const propRes = await base44.functions.invoke('createCorporateProposal', {
          leadId: lead.id,
          items,
          notes: extracted.summary || '',
        });
        const proposalId = propRes?.data?.proposal_id;
        if (!proposalId) {
          results.push({ consulta_id: consulta.id, lead_id: lead.id, status: 'error', reason: 'createCorporateProposal sin id' });
          continue;
        }

        // Enviar propuesta por email al cliente (+ copia interna)
        const sendRes = await base44.functions.invoke('sendProposalEmail', { proposalId });
        if (!sendRes?.data?.success) {
          results.push({ consulta_id: consulta.id, lead_id: lead.id, proposal_id: proposalId, status: 'error', reason: 'sendProposalEmail falló' });
          continue;
        }

        // Releer propuesta para tener total y breakdown
        const propList = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
        const proposal = propList?.[0];
        const breakdown = (() => { try { return JSON.parse(proposal?.items_json || '[]'); } catch { return []; } })();

        // Marcar Consulta como respondida (idempotente)
        await base44.asServiceRole.entities.Consulta.update(consulta.id, {
          estado: 'Respondido',
          respuesta: `[AUTO] Propuesta ${proposal?.numero || proposalId} enviada por ${fmtCLP(proposal?.total || 0)}`,
          tiempo_respuesta_hrs: Math.round((Date.now() - new Date(consulta.created_date).getTime()) / 3600000 * 10) / 10,
          convertido_lead: true,
          notas: `${consulta.notas || ''}\n${TAG_QUOTED}${proposalId}]`.trim(),
        });

        // Notificar al fundador SOLO ahora (propuesta efectivamente enviada)
        await notifyFounderProposalSent({ consulta, lead, proposal, breakdown });

        results.push({
          consulta_id: consulta.id,
          lead_id: lead.id,
          proposal_id: proposalId,
          score: finalScore,
          total: proposal?.total,
          status: 'sent',
        });
      } catch (err) {
        console.error('autoQuote loop error:', err);
        results.push({ consulta_id: consulta.id, status: 'error', reason: err.message });
      }
    }

    return Response.json({
      ok: true,
      processed: candidatas.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      details: results,
    });
  } catch (error) {
    console.error('autoQuoteHotB2BLeads error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});