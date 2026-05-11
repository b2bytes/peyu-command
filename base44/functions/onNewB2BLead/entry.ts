import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger automático al crear un B2BLead.
 * Orquesta el pipeline completo:
 *   1. Score el lead con IA
 *   2. Si tiene logo → genera mockup automáticamente
 *   3. Si score ≥ 70 y tiene producto + cantidad → crea propuesta corporativa (Borrador)
 *   4. Notifica al equipo via email
 *
 * Diseñado para ser llamado por una entity automation on-create.
 * Es resiliente: cada paso es independiente y no bloquea los siguientes.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporta payload de entity automation (data.entity_id) o llamada manual ({leadId})
    const leadId = body?.data?.id || body?.event?.entity_id || body?.leadId;

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }

    const log = { leadId, steps: [] };

    // 1) SCORE del lead
    let leadScore = 0;
    let urgency = 'Normal';
    try {
      const scoreRes = await base44.functions.invoke('scoreLead', { leadId });
      leadScore = scoreRes.data?.lead_score || 0;
      urgency = scoreRes.data?.urgency || 'Normal';
      log.steps.push({ step: 'score', ok: true, leadScore, urgency });
    } catch (e) {
      log.steps.push({ step: 'score', ok: false, error: e.message });
    }

    // Recargar lead actualizado tras scoring
    const leads = await base44.asServiceRole.entities.B2BLead.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead no encontrado tras score', log }, { status: 404 });
    }
    const lead = leads[0];

    // 2) MOCKUP automático si hay logo
    let mockupUrl = null;
    const hasLogo = !!lead.logo_url && /\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(lead.logo_url);
    if (hasLogo) {
      try {
        // Buscar el producto referenciado para usar la imagen real como base
        let productImageUrl = null;
        let productCategory = null;
        if (lead.product_interest) {
          const prods = await base44.asServiceRole.entities.Producto.filter({
            nombre: lead.product_interest
          });
          if (prods?.[0]) {
            productImageUrl = prods[0].imagen_url;
            productCategory = prods[0].categoria;
          }
        }

        const mockupRes = await base44.functions.invoke('generateMockup', {
          productName: lead.product_interest || 'Producto Peyu',
          productCategory,
          productImageUrl,
          logoUrl: lead.logo_url,
          mockupType: 'logo',
        });
        mockupUrl = mockupRes.data?.mockup_url;

        if (mockupUrl) {
          const currentMockups = lead.mockup_urls || [];
          await base44.asServiceRole.entities.B2BLead.update(leadId, {
            mockup_urls: [...currentMockups, mockupUrl],
          });
        }
        log.steps.push({ step: 'mockup', ok: !!mockupUrl, url: mockupUrl });
      } catch (e) {
        log.steps.push({ step: 'mockup', ok: false, error: e.message });
      }
    } else {
      log.steps.push({ step: 'mockup', ok: false, reason: 'sin_logo' });
    }

    // 3) PROPUESTA automática si score alto + datos suficientes
    const qualifiesForProposal =
      leadScore >= 70 &&
      lead.product_interest &&
      (lead.qty_estimate || 0) > 0;

    let proposalId = null;
    if (qualifiesForProposal) {
      try {
        // Buscar producto exacto para precios
        const prods = await base44.asServiceRole.entities.Producto.filter({
          nombre: lead.product_interest
        });
        const prod = prods?.[0];
        const basePrice = prod?.precio_base_b2b || prod?.precio_b2c || 5000;

        const items = [{
          sku: prod?.sku,
          nombre: lead.product_interest,
          qty: lead.qty_estimate,
          precio_base: basePrice,
          personalizacion: !!lead.personalization_needs || !!lead.logo_url,
        }];

        const propRes = await base44.functions.invoke('createCorporateProposal', {
          leadId,
          items,
          notes: lead.notes || '',
        });
        proposalId = propRes.data?.proposal_id;
        log.steps.push({ step: 'proposal', ok: !!proposalId, id: proposalId, numero: propRes.data?.numero });
      } catch (e) {
        log.steps.push({ step: 'proposal', ok: false, error: e.message });
      }
    } else {
      log.steps.push({
        step: 'proposal',
        ok: false,
        reason: leadScore < 70 ? 'score_bajo' : 'datos_insuficientes',
        score: leadScore,
      });
    }

    // 4) NOTIFICACIÓN al equipo (Carlos / ventas)
    try {
      const summary = `
Lead score: ${leadScore}/100 (${urgency})
Empresa: ${lead.company_name || 'N/A'}
Contacto: ${lead.contact_name || 'N/A'} · ${lead.email || ''} · ${lead.phone || ''}
Producto: ${lead.product_interest || 'N/A'}
Cantidad: ${lead.qty_estimate || '-'} u.
Logo: ${hasLogo ? 'Sí' : 'No'}
Mockup auto-generado: ${mockupUrl ? 'Sí' : 'No'}
Propuesta auto-creada: ${proposalId ? `Sí (${proposalId})` : 'No'}
${lead.notes ? `\nNotas:\n${lead.notes}` : ''}
      `.trim();

      const subject = leadScore >= 70
        ? `🔥 Lead B2B Alto · ${lead.company_name || 'sin nombre'} · ${leadScore}pts`
        : `📥 Nuevo Lead B2B · ${lead.company_name || 'sin nombre'} · ${leadScore}pts`;

      // Notifica a todos los buzones del equipo comercial
      const TEAM_INBOXES = ['jnilo@peyuchile.cl', 'ventas@peyuchile.cl', 'ti@peyuchile.cl'];
      await Promise.all(TEAM_INBOXES.map(to =>
        base44.integrations.Core.SendEmail({
          from_name: 'PEYU Pipeline B2B',
          to,
          subject,
          body: summary,
        })
      ));
      log.steps.push({ step: 'notify', ok: true });
    } catch (e) {
      log.steps.push({ step: 'notify', ok: false, error: e.message });
    }

    return Response.json({
      success: true,
      leadScore,
      urgency,
      mockupUrl,
      proposalId,
      log,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});