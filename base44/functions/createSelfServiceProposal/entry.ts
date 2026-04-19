import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Volume pricing rules (mismo que createCorporateProposal)
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
    const prodDays = Math.ceil(qty / 1500);
    const laserDays = item.personalizacion ? Math.ceil(qty / 1500) : 0;
    maxDays = Math.max(maxDays, prodDays + laserDays + 2);
  }
  return Math.min(maxDays, 20);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contact_name, company_name, email, phone, rut, items, logoUrl, notes } = await req.json();

    if (!contact_name || !company_name || !email) {
      return Response.json({ error: 'contact_name, company_name y email son requeridos' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return Response.json({ error: 'Debes incluir al menos un producto' }, { status: 400 });
    }

    // 1. Crear B2BLead (self-service)
    const totalQty = items.reduce((s, i) => s + (i.qty || i.cantidad || 0), 0);
    const hasPersonalization = items.some(i => i.personalizacion);
    const lead = await base44.asServiceRole.entities.B2BLead.create({
      source: 'Formulario Web',
      contact_name,
      company_name,
      email,
      phone: phone || '',
      rut: rut || '',
      product_interest: items.map(i => i.nombre || i.name).filter(Boolean).join(', ').slice(0, 200),
      qty_estimate: totalQty,
      personalization_needs: hasPersonalization,
      logo_url: logoUrl || '',
      brief_url: logoUrl || '',
      notes: notes || 'Propuesta generada en auto-servicio por el cliente',
      status: 'Propuesta enviada',
      urgency: 'Normal',
      lead_score: 50,
      utm_source: 'self_service',
    });

    // 2. Calcular precios y lead time
    const { breakdown, subtotal } = calcPricing(items);
    const feePersonalizacion = 0;
    const total = subtotal + feePersonalizacion;
    const leadTime = calcLeadTime(items);

    // 3. Generar número y validez
    const propNum = `PEY-${Date.now().toString().slice(-6)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    // 4. Generar mockup con IA (no bloqueante si falla)
    let mockupUrls = [];
    try {
      const firstItem = breakdown[0] || {};
      const prompt = `Professional corporate gift product mockup photograph for Peyu Chile sustainable brand. Product: "${firstItem.nombre || firstItem.name || 'Peyu corporate gift'}" made from 100% recycled plastic, manufactured in Chile. Clean studio photography, soft white/neutral background, professional soft lighting. High quality product shot showing the unique marbled texture of recycled plastic material. ${logoUrl ? `Corporate logo applied to product via UV laser engraving. Professional corporate gift presentation.` : `Laser UV engraved text "${company_name}" clearly visible on the product surface. Corporate branding.`} Sustainable eco-design aesthetic, premium quality, Chilean manufacturing. Shot angle: 3/4 view showing product details.`;
      const isRaster = logoUrl && /\.(png|jpg|jpeg|webp)(\?|$)/i.test(logoUrl);
      let imgRes;
      try {
        imgRes = await base44.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: isRaster ? [logoUrl] : undefined,
        });
      } catch {
        imgRes = await base44.integrations.Core.GenerateImage({ prompt });
      }
      if (imgRes?.url) mockupUrls = [imgRes.url];
    } catch (e) {
      console.warn('Mockup opcional falló, continuando:', e?.message);
    }

    // 5. Generar terms + production_notes con IA (opcional)
    let aiProposal = null;
    try {
      aiProposal = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera "terms" y "production_notes" para una propuesta comercial self-service de Peyu Chile.
Empresa: ${company_name}
Productos: ${breakdown.map(i => `${i.cantidad || i.qty}x ${i.nombre || i.name}`).join(', ')}
Total: $${total.toLocaleString('es-CL')} CLP
Lead time: ${leadTime} días hábiles
Personalización: ${hasPersonalization ? 'Sí, láser UV' : 'No'}

Responde SOLO JSON:
{
  "terms": "1 párrafo con condiciones (anticipo 50%, garantía 10 años, envío Chile)",
  "production_notes": "1 párrafo de notas para producción"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            terms: { type: "string" },
            production_notes: { type: "string" }
          }
        }
      });
    } catch {}

    // 6. Crear propuesta
    const proposal = await base44.asServiceRole.entities.CorporateProposal.create({
      numero: propNum,
      b2b_lead_id: lead.id,
      empresa: company_name,
      contacto: contact_name,
      email,
      items_json: JSON.stringify(breakdown),
      subtotal,
      fee_personalizacion: feePersonalizacion,
      total,
      lead_time_dias: leadTime,
      validity_days: 15,
      anticipo_pct: 50,
      status: 'Enviada',
      auto_generated: true,
      mockup_urls: mockupUrls,
      terms: aiProposal?.terms || 'Anticipo 50% para iniciar producción. Saldo contra despacho. Garantía 10 años en plástico reciclado. Fabricación 100% en Chile.',
      production_notes: aiProposal?.production_notes || `Pedido self-service de ${company_name}. ${hasPersonalization ? 'Requiere personalización láser UV.' : ''} Lead time: ${leadTime} días hábiles.`,
      fecha_envio: new Date().toISOString().split('T')[0],
      fecha_vencimiento: expiryDate.toISOString().split('T')[0],
    });

    return Response.json({
      success: true,
      proposal_id: proposal.id,
      numero: propNum,
      total,
      subtotal,
      lead_time_dias: leadTime,
      items: breakdown,
      mockup_urls: mockupUrls,
      proposal_url: `/b2b/propuesta?id=${proposal.id}`,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});