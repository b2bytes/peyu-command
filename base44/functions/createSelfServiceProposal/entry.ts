import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// === Pricing usando la TABLA REAL del producto (misma lógica que ProductoDetalle.jsx) ===
function calcUnitPrice(item) {
  const qty = item.qty || item.cantidad || 0;
  const base = item.precio_base_b2b || item.precio_base || item.precio_b2c || 5000;

  // Tabla por tramos — idéntica a ProductoDetalle
  if (qty >= 500 && item.precio_500_mas) return { unit: item.precio_500_mas, tier: '500+ u.' };
  if (qty >= 200 && item.precio_200_499) return { unit: item.precio_200_499, tier: '200-499 u.' };
  if (qty >= 50 && item.precio_50_199) return { unit: item.precio_50_199, tier: '50-199 u.' };
  if (qty >= 10 && item.precio_base_b2b) return { unit: item.precio_base_b2b, tier: '10-49 u.' };

  // Fallback sólo si el producto no trae la tabla
  let discount = 0;
  if (qty >= 500) discount = 0.25;
  else if (qty >= 200) discount = 0.15;
  else if (qty >= 50) discount = 0.08;
  return { unit: Math.round(base * (1 - discount)), tier: '1-9 u.' };
}

function calcPricing(items) {
  let subtotal = 0;
  const breakdown = items.map(item => {
    const qty = item.qty || item.cantidad || 0;
    const { unit, tier } = calcUnitPrice(item);
    const refB2C = item.precio_b2c || item.precio_base_b2b || unit;
    const descuentoPct = refB2C > 0 ? Math.round((1 - unit / refB2C) * 100) : 0;
    const lineTotal = unit * qty;
    subtotal += lineTotal;
    return {
      ...item,
      precio_unitario: unit,
      descuento_pct: Math.max(0, descuentoPct),
      tier,
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

    // 1. Crear B2BLead
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

    // 2. Calcular precios (misma tabla que ProductoDetalle) y lead time
    const { breakdown, subtotal } = calcPricing(items);
    const total = subtotal;
    const leadTime = calcLeadTime(items);

    // 3. Numero + vencimiento
    const propNum = `PEY-${Date.now().toString().slice(-6)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    // 4. Mockup: misma técnica que `generateMockup` (imagen del producto + logo como referencia)
    //    La replicamos inline aquí para evitar llamadas cruzadas function→function que pueden
    //    sufrir timeouts. GenerateImage tarda ~10-15s, por eso lo ejecutamos directamente.
    let mockupUrls = [];
    if (hasPersonalization) {
      try {
        const firstItem = breakdown[0] || {};
        const productName = firstItem.nombre || firstItem.name || 'Producto Peyu';
        const productCategory = firstItem.categoria || '';
        const productImageUrl = firstItem.imagen_url || '';

        const isRaster = (u) => !!u && /\.(png|jpg|jpeg|webp)(\?|$)/i.test(u);
        const isSvg = (u) => !!u && /\.svg(\?|$)/i.test(u);
        const svgToPng = (u) => {
          try {
            const url = new URL(u);
            return `https://images.weserv.nl/?url=${encodeURIComponent(url.hostname + url.pathname)}&output=png&w=1024`;
          } catch { return null; }
        };

        const hasProductRef = isRaster(productImageUrl);
        let effectiveLogoUrl = null;
        if (isRaster(logoUrl)) effectiveLogoUrl = logoUrl;
        else if (isSvg(logoUrl)) effectiveLogoUrl = svgToPng(logoUrl) || logoUrl;
        const hasLogoRef = !!effectiveLogoUrl;
        const engraveText = hasLogoRef ? '' : company_name;

        let prompt = '';
        if (hasProductRef) {
          prompt += `⚠️ ABSOLUTE CRITICAL RULE: The FIRST reference image IS the exact product the customer chose. You MUST use it as the base. DO NOT generate a new product. DO NOT change shape, color, material, angle, lighting, background, or framing. You are ONLY allowed to add a laser engraving on top of it. `;
          prompt += `Product: "${productName}"${productCategory ? ` (${productCategory})` : ''} — Peyu Chile, made in Chile from 100% recycled plastic. `;
          if (hasLogoRef) {
            prompt += `⚠️ SECOND CRITICAL RULE: The SECOND reference image IS the customer's EXACT logo. Reproduce it LITERALLY — same shapes, letters, proportions. DO NOT invent, redesign, simplify or substitute. If it contains text, copy character-by-character. `;
            prompt += `TASK: Add a UV laser engraving that is a 1:1 reproduction of the SECOND image onto the product surface. Physically engraved look: monochrome single tone, micro depth, subtle darkening, follows curvature. NO stickers, NO overlay, NO glow. Proportional to engraving area (30-40% of flat surface). Preserve aspect ratio. `;
          } else if (engraveText) {
            prompt += `TASK: Engrave the text "${engraveText}" onto the product, clean sans-serif typography, physically engraved look, micro depth, subtle shadow, follows curvature. NO stickers, NO overlay. Copy character-by-character. `;
          }
          prompt += `Output: photorealistic, identical background/angle/lighting to the reference, sharp focus, high detail.`;
        } else {
          prompt += `Photorealistic product photograph of a Peyu Chile corporate gift: "${productName}". 100% recycled plastic, marbled texture, made in Chile. Studio photography, soft neutral background, 3/4 view. `;
          if (engraveText) prompt += `UV laser engraved text "${engraveText}" on the surface. `;
          if (hasLogoRef) prompt += `UV laser engraved corporate logo (reference image) on the surface. `;
        }

        const references = [];
        if (hasProductRef) references.push(productImageUrl);
        if (hasLogoRef) references.push(effectiveLogoUrl);

        let imgRes;
        if (references.length > 0) {
          try {
            imgRes = await base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: references });
          } catch {
            imgRes = await base44.integrations.Core.GenerateImage({ prompt });
          }
        } else {
          imgRes = await base44.integrations.Core.GenerateImage({ prompt });
        }
        if (imgRes?.url) mockupUrls = [imgRes.url];
      } catch (e) {
        console.warn('Mockup opcional falló, continuando sin él:', e?.message);
      }
    }

    // 5. Crear propuesta
    const proposal = await base44.asServiceRole.entities.CorporateProposal.create({
      numero: propNum,
      b2b_lead_id: lead.id,
      empresa: company_name,
      contacto: contact_name,
      email,
      items_json: JSON.stringify(breakdown),
      subtotal,
      fee_personalizacion: 0,
      total,
      lead_time_dias: leadTime,
      validity_days: 15,
      anticipo_pct: 50,
      status: 'Enviada',
      auto_generated: true,
      mockup_urls: mockupUrls,
      terms: 'Anticipo 50% para iniciar produccion. Saldo contra despacho. Garantia 10 anos en plastico reciclado. Fabricacion 100% en Chile.',
      production_notes: `Pedido self-service de ${company_name}. ${hasPersonalization ? 'Requiere personalizacion laser UV.' : ''} Lead time: ${leadTime} dias habiles.`,
      fecha_envio: new Date().toISOString().split('T')[0],
      fecha_vencimiento: expiryDate.toISOString().split('T')[0],
    });

    // 6. Disparar email automático con resumen + link a la propuesta.
    //    Lo hacemos vía invoke para que el cliente vea la respuesta rápido;
    //    si falla no bloquea la creación (el cliente ya tiene la propuesta online).
    let emailSent = false;
    try {
      const emailRes = await base44.functions.invoke('sendSelfServiceProposalEmail', {
        proposalId: proposal.id,
        form: { contact_name, company_name, email, phone, rut, notes },
      });
      emailSent = !!emailRes?.data?.success;
    } catch (e) {
      console.warn('Email automático falló:', e?.message);
    }

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
      email_sent: emailSent,
      email_to: email,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});