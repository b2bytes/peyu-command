import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Personalización láser: tarifa por unidad según tipo, GRATIS desde 10u ──
const FEE_PERSONALIZACION = { frase: 3990, peyu: 4990, archivo: 7990, logo: 7990, propio: 7990 };
const MOQ_PERS_GRATIS = 10;

function feePersonalizacionItem(item) {
  if (!item.personalizacion && !item.tipo_personalizacion) return { feeUnit: 0, fee: 0, gratis: false, tipo: null };
  const qty = item.qty || item.cantidad || 0;
  const tipo = (item.tipo_personalizacion || 'frase').toLowerCase();
  const feeUnit = FEE_PERSONALIZACION[tipo] ?? FEE_PERSONALIZACION.frase;
  const gratis = qty >= MOQ_PERS_GRATIS;
  return { feeUnit, fee: gratis ? 0 : feeUnit * qty, gratis, tipo };
}

// ¿El producto tiene tabla B2B oficial (precio_b2b_tramos con al menos 1 valor)?
function tieneTramosOficiales(item) {
  const t = item.precio_b2b_tramos;
  if (!t || typeof t !== 'object') return false;
  return ['unitario','t10_49','t50_99','t100_249','t250_499','t500_999','t1000_1999','t2000_mas']
    .some(k => Number(t[k]) > 0);
}

// Precio unitario desde la tabla B2B oficial (8 tramos sin IVA). Cero inventos.
function calcUnitPrice(item) {
  const qty = item.qty || item.cantidad || 0;
  const t = item.precio_b2b_tramos || {};
  if (qty >= 2000 && t.t2000_mas)   return { unit: t.t2000_mas,   tier: '2000+ u.' };
  if (qty >= 1000 && t.t1000_1999)  return { unit: t.t1000_1999,  tier: '1000-1999 u.' };
  if (qty >= 500 && t.t500_999)     return { unit: t.t500_999,    tier: '500-999 u.' };
  if (qty >= 250 && t.t250_499)     return { unit: t.t250_499,    tier: '250-499 u.' };
  if (qty >= 100 && t.t100_249)     return { unit: t.t100_249,    tier: '100-249 u.' };
  if (qty >= 50 && t.t50_99)        return { unit: t.t50_99,      tier: '50-99 u.' };
  if (qty >= 10 && t.t10_49)        return { unit: t.t10_49,      tier: '10-49 u.' };
  return { unit: t.unitario || 0,   tier: '1-9 u.' };
}

function calcPricing(items) {
  let subtotal = 0;
  let feePersonalizacionTotal = 0;
  const breakdown = items.map(item => {
    const qty = item.qty || item.cantidad || 0;
    const { unit, tier } = calcUnitPrice(item);
    const refB2C = item.precio_b2c || unit;
    const descuentoPct = refB2C > 0 ? Math.max(0, Math.round((1 - unit / refB2C) * 100)) : 0;
    const lineTotal = unit * qty;
    subtotal += lineTotal;

    const pers = feePersonalizacionItem(item);
    feePersonalizacionTotal += pers.fee;

    return {
      ...item,
      precio_unitario: unit,
      descuento_pct: descuentoPct,
      tier,
      line_total: lineTotal,
      fee_personalizacion_unit: pers.feeUnit,
      fee_personalizacion: pers.fee,
      personalizacion_gratis: pers.gratis,
      tipo_personalizacion: pers.tipo,
    };
  });
  return { breakdown, subtotal, feePersonalizacionTotal };
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

    // FIX 2 — Solo productos con tabla B2B oficial. Sin descuentos inventados.
    const sinTabla = items.filter(it => !tieneTramosOficiales(it));
    const itemsValidos = items.filter(tieneTramosOficiales);
    if (itemsValidos.length === 0) {
      return Response.json({
        error: 'precio_a_consultar',
        message: 'Los productos no tienen tarifa B2B oficial (precio_b2b_tramos). No se puede cotizar automáticamente.',
        productos_sin_tarifa: sinTabla.map(i => i.nombre || i.name).filter(Boolean),
      }, { status: 422 });
    }

    // Calculate pricing (tabla oficial) + fee personalización real (FIX 1)
    const { breakdown, subtotal, feePersonalizacionTotal } = calcPricing(itemsValidos);
    const hasPersonalization = itemsValidos.some(i => i.personalizacion || i.tipo_personalizacion);
    const feePersonalizacion = feePersonalizacionTotal;
    const total = subtotal + feePersonalizacion;
    const leadTime = calcLeadTime(itemsValidos);

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