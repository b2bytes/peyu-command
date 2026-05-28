import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// regenerateProposalMockup — Regenera el mockup de una propuesta con la
// POSICIÓN del grabado corregida (arriba / centro / abajo).
// Útil cuando la IA puso el logo donde no era. Usa la imagen real del producto
// + el logo del cliente como referencias y guarda el nuevo mockup en la propuesta.
// ============================================================================

function buildMockupPrompt({ productName, productCategory, productImageUrl, logoUrl, engraveText, posicion }) {
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

  const posMap = {
    arriba: 'in the UPPER third / top area of the main flat front surface of the product',
    centro: 'perfectly CENTERED on the main flat front surface of the product',
    abajo: 'in the LOWER third / bottom area of the main flat front surface of the product',
  };
  const placement = posMap[posicion] || posMap.centro;

  let prompt = '';
  if (hasProductRef) {
    prompt += `⚠️ ABSOLUTE CRITICAL RULE: The FIRST reference image IS the exact product the customer chose. You MUST use it as the base. DO NOT generate a new product. DO NOT change shape, color, material, angle, lighting, background, or framing. You are ONLY allowed to add a laser engraving on top of it. `;
    prompt += `Product: "${productName}"${productCategory ? ` (${productCategory})` : ''} — Peyu Chile, made in Chile from 100% recycled plastic. `;
    prompt += `⚠️ PLACEMENT RULE: The engraving MUST be placed ${placement}. Do NOT place it anywhere else. It must be well-centered horizontally and clearly readable, respecting the natural engraving area of this specific product. `;
    if (hasLogoRef) {
      prompt += `⚠️ LOGO RULE: The SECOND reference image IS the customer's EXACT logo. Reproduce it LITERALLY — same shapes, letters, proportions. DO NOT invent, redesign, simplify or substitute. If it contains text, copy character-by-character. `;
      prompt += `TASK: Add a UV laser engraving that is a 1:1 reproduction of the SECOND image onto the product surface, ${placement}. Physically engraved look: monochrome single tone, micro depth, subtle darkening, follows curvature. NO stickers, NO overlay, NO glow. Proportional to engraving area (30-40% of flat surface). Preserve aspect ratio. `;
    } else if (engraveText) {
      prompt += `TASK: Engrave the text "${engraveText}" onto the product, ${placement}, clean sans-serif typography, physically engraved look, micro depth, subtle shadow, follows curvature. NO stickers, NO overlay. Copy character-by-character. `;
    }
    prompt += `Output: photorealistic, identical background/angle/lighting to the reference, sharp focus, high detail.`;
  } else {
    prompt += `Photorealistic product photograph of a Peyu Chile corporate gift: "${productName}". 100% recycled plastic, marbled texture, made in Chile. Studio photography, soft neutral background, 3/4 view. `;
    if (engraveText) prompt += `UV laser engraved text "${engraveText}" placed ${placement}. `;
    if (hasLogoRef) prompt += `UV laser engraved corporate logo (reference image) placed ${placement}. `;
  }

  const references = [];
  if (hasProductRef) references.push(productImageUrl);
  if (hasLogoRef) references.push(effectiveLogoUrl);

  return { prompt, references };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { proposalId, posicion } = await req.json();
    if (!proposalId) return Response.json({ error: 'proposalId requerido' }, { status: 400 });

    const list = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
    if (!list || list.length === 0) return Response.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    const p = list[0];

    const posicion_grabado = posicion || p.posicion_grabado || 'centro';

    const items = (() => { try { return p.items_json ? JSON.parse(p.items_json) : []; } catch { return []; } })();
    const firstItem = items[0] || {};
    const productName = firstItem.nombre || firstItem.name || 'Producto Peyu';
    const productCategory = firstItem.categoria || '';
    const productImageUrl = firstItem.imagen_url || '';
    const logoUrl = p.logo_url || '';
    const hasLogoRef = /\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(logoUrl);
    const engraveText = hasLogoRef ? '' : (p.empresa || '');

    const { prompt, references } = buildMockupPrompt({
      productName, productCategory, productImageUrl, logoUrl, engraveText, posicion: posicion_grabado,
    });

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

    if (!imgRes?.url) return Response.json({ error: 'No se pudo generar el mockup' }, { status: 500 });

    // Guardamos el nuevo mockup como el principal (al inicio del arreglo)
    const prevMockups = Array.isArray(p.mockup_urls) ? p.mockup_urls : [];
    const newMockups = [imgRes.url, ...prevMockups].slice(0, 4);

    await base44.asServiceRole.entities.CorporateProposal.update(proposalId, {
      mockup_urls: newMockups,
      posicion_grabado,
    });

    return Response.json({
      success: true,
      mockup_url: imgRes.url,
      mockup_urls: newMockups,
      posicion_grabado,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});