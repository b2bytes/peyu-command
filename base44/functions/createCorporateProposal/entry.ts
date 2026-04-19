import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Volume pricing rules (aligned with Peyu's real pricing)
function calcPricing(items) {
  let subtotal = 0;
  const breakdown = items.map(item => {
    const qty = item.qty || item.cantidad || 0;
    const basePrice = item.precio_base || item.precio_b2b || item.precio_base_b2b || 5000;
    let discount = 0;
    if (qty >= 500) discount = 0.25;
    else if (qty >= 200) discount = 0.15;
    else if (qty >= 50) discount = 0.08;
    const unitPrice = Math.round(basePrice * (1 - discount));
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    return {
      ...item,
      precio_unitario: unitPrice,
      descuento_pct: Math.round(discount * 100),
      line_total: lineTotal,
    };
  });
  return { breakdown, subtotal };
}

function calcLeadTime(items) {
  let maxDays = 7;
  for (const item of items) {
    const qty = item.qty || item.cantidad || 0;
    const prodDays = Math.ceil(qty / 1500); // 1 laser = 1500/day
    const laserDays = item.personalizacion ? Math.ceil(qty / 1500) : 0;
    maxDays = Math.max(maxDays, prodDays + laserDays + 2);
  }
  return Math.min(maxDays, 20);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, items, notes } = await req.json();

    if (!leadId) return Response.json({ error: 'leadId requerido' }, { status: 400 });
    if (!items || items.length === 0) return Response.json({ error: 'items requerido' }, { status: 400 });

    // Get lead
    const leads = await base44.asServiceRole.entities.B2BLead.filter({ id: leadId });
    if (!leads || leads.length === 0) return Response.json({ error: 'Lead no encontrado' }, { status: 404 });
    const lead = leads[0];

    // Calculate pricing
    const { breakdown, subtotal } = calcPricing(items);
    const hasPersonalization = items.some(i => i.personalizacion);
    const feePersonalizacion = hasPersonalization && subtotal > 0 && items[0]?.qty < 10 ? 5000 * items[0]?.qty : 0;
    const total = subtotal + feePersonalizacion;
    const leadTime = calcLeadTime(items);

    // Generate proposal number
    const propNum = `PEY-${Date.now().toString().slice(-6)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    // Use AI to generate professional proposal text
    const aiProposal = await base44.integrations.Core.InvokeLLM({
      prompt: `Genera el campo "terms" y "production_notes" para una propuesta comercial de Peyu Chile (empresa de regalos corporativos sustentables con plástico 100% reciclado fabricado en Chile).

Empresa cliente: ${lead.company_name}
Contacto: ${lead.contact_name}
Productos: ${breakdown.map(i => `${i.qty || i.cantidad}x ${i.nombre || i.name || i.producto}`).join(', ')}
Total: $${total.toLocaleString('es-CL')} CLP
Lead time: ${leadTime} días hábiles
Personalización: ${hasPersonalization ? 'Sí, con grabado láser UV' : 'No'}
Notas del cliente: ${notes || lead.notes || 'Ninguna'}

Responde SOLO JSON:
{
  "terms": "string de 1 párrafo con condiciones comerciales clave (anticipo 50%, garantía, envío)",
  "production_notes": "string de 1 párrafo con notas de producción para el equipo"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          terms: { type: "string" },
          production_notes: { type: "string" }
        }
      }
    });

    // Heredar mockups del lead (si se generaron al crear el B2BLead)
    const leadMockups = Array.isArray(lead.mockup_urls) ? lead.mockup_urls : [];

    // Si el lead no tiene mockup pero tiene logo, generar uno ahora para que entre al PDF
    let finalMockups = leadMockups;
    if (finalMockups.length === 0 && (lead.logo_url || lead.company_name)) {
      try {
        const first = breakdown[0] || {};
        const mockupRes = await base44.integrations.Core.GenerateImage({
          prompt: `Professional corporate gift product mockup for Peyu Chile. Product: "${first.nombre || first.name || first.producto || lead.product_interest || 'Peyu product'}" made of 100% recycled plastic, manufactured in Chile. Clean studio photography, soft white background, marbled recycled plastic texture. ${lead.logo_url ? `Corporate logo applied via UV laser engraving. Professional corporate gift presentation.` : `Laser UV engraved text "${lead.company_name}" clearly visible on the product surface.`} Shot 3/4 view. Premium quality.`,
          existing_image_urls: lead.logo_url && /\.(png|jpg|jpeg|webp|svg)$/i.test(lead.logo_url.split('?')[0]) ? [lead.logo_url] : undefined,
        });
        if (mockupRes?.url) finalMockups = [mockupRes.url];
      } catch { /* no bloqueante */ }
    }

    // Create proposal entity
    const proposal = await base44.asServiceRole.entities.CorporateProposal.create({
      numero: propNum,
      b2b_lead_id: leadId,
      empresa: lead.company_name,
      contacto: lead.contact_name,
      email: lead.email,
      items_json: JSON.stringify(breakdown),
      subtotal,
      fee_personalizacion: feePersonalizacion,
      total,
      lead_time_dias: leadTime,
      validity_days: 15,
      anticipo_pct: 50,
      status: 'Borrador',
      auto_generated: true,
      mockup_urls: finalMockups,
      terms: aiProposal?.terms || 'Anticipo 50% para iniciar producción. Saldo a despacho. Garantía 10 años en productos de plástico reciclado. Fabricación 100% en Chile.',
      production_notes: aiProposal?.production_notes || `Pedido corporativo para ${lead.company_name}. ${hasPersonalization ? 'Requiere personalización láser UV.' : ''} Lead time: ${leadTime} días hábiles.`,
      fecha_envio: new Date().toISOString().split('T')[0],
      fecha_vencimiento: expiryDate.toISOString().split('T')[0],
    });

    // Update lead status
    await base44.asServiceRole.entities.B2BLead.update(leadId, {
      status: 'En revisión',
    });

    return Response.json({
      success: true,
      proposal_id: proposal.id,
      numero: propNum,
      total,
      subtotal,
      lead_time_dias: leadTime,
      items: breakdown,
      proposal_url: `/b2b/propuesta?id=${proposal.id}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});