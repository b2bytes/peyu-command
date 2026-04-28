import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Imágenes raster que GenerateImage puede leer directamente como referencia
const isRasterImage = (url) => !!url && /\.(png|jpg|jpeg|webp)(\?|$)/i.test(url);
// SVG y otros vectoriales: se aceptan pero se convierten a PNG antes de pasarlos
const isSvgImage = (url) => !!url && /\.svg(\?|$)/i.test(url);

// Convierte un SVG remoto a PNG usando el proxy público weserv.nl (rasteriza SVG a PNG)
function svgToPngUrl(svgUrl) {
  try {
    const u = new URL(svgUrl);
    const clean = `${u.hostname}${u.pathname}`;
    return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&output=png&w=1024`;
  } catch {
    return null;
  }
}

// Intenta descargar una imagen desde una o más variantes de URL
async function tryFetchImage(url) {
  const candidates = [url];
  try {
    const u = new URL(url);
    candidates.push(`${u.origin}${u.pathname}`);
    if (/^i[0-9]\.wp\.com$/.test(u.hostname)) {
      const rest = u.pathname.replace(/^\//, '');
      candidates.push(`https://${rest}`);
    }
    try {
      const u2 = new URL(url);
      const cleanNoQs = `${u2.hostname}${u2.pathname}`;
      candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(cleanNoQs)}&output=jpg&w=800`);
      if (/^i[0-9]\.wp\.com$/.test(u2.hostname)) {
        const rest = u2.pathname.replace(/^\//, '');
        candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(rest)}&output=jpg&w=800`);
      }
    } catch {}
  } catch {}

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept': 'image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
    'Referer': 'https://peyuchile.cl/',
  };

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { redirect: 'follow', headers });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 0) {
          return { buf, contentType: res.headers.get('content-type') || 'image/jpeg', finalUrl: candidate };
        }
      }
    } catch {}
  }
  return null;
}

async function mirrorToBase44(base44, url) {
  try {
    const fetched = await tryFetchImage(url);
    if (!fetched) return null;
    const { buf, contentType } = fetched;
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const file = new File([buf], `mirror.${ext}`, { type: contentType });
    const upload = await base44.integrations.Core.UploadFile({ file });
    return upload?.file_url || null;
  } catch {
    return null;
  }
}

// Construye el prompt según el tipo de mockup (logo/retrato/foto/jenga).
function buildPromptByType({ mockupType, productName, productCategory, hasProductRef, hasArtRef, text, color }) {
  const base = hasProductRef
    ? `⚠️ ABSOLUTE CRITICAL RULE: The FIRST reference image IS the exact product the customer chose from our e-commerce. You MUST use it as the base. DO NOT generate a new product. DO NOT change the product shape, color, material, angle, lighting, background, or framing. Preserve the image EXACTLY as provided — only add the personalization on top. Product: "${productName}"${productCategory ? ` (category: ${productCategory})` : ''} — Peyu Chile, made in Chile from 100% recycled plastic. `
    : `Photorealistic product photograph of a Peyu Chile gift: "${productName}"${productCategory ? ` (${productCategory})` : ''}. Made from 100% recycled plastic with visible marbled texture, manufactured in Chile. Clean studio photography, soft neutral background, professional soft lighting, 3/4 view. ${color ? `Product color: ${color}. ` : ''}`;

  if (mockupType === 'retrato') {
    if (hasArtRef) {
      return base +
        `⚠️ TASK: Place the SECOND reference image (the customer's photo/portrait) INSIDE the frame area of the wall art product shown in the first image. ` +
        `Reproduce the photo at full color, high fidelity — DO NOT alter, recolor, crop or restyle the customer's photo. Fit it naturally inside the visible frame/canvas area, preserving its aspect ratio (add minimal natural padding if needed). ` +
        `The result must look like a real printed canvas/photo art piece with the customer's image properly framed. Subtle realistic finish (matte print texture, minimal frame shadow), no glow, no overlay effects. ` +
        (text && text.trim() ? `Additionally, add a small elegant text "${text}" engraved or printed below the photo, in tasteful serif typography. Copy character-by-character exactly. ` : '') +
        `Final output: photorealistic, same background/framing/lighting as the first reference. The result must look like the SAME product photo with the customer's image inserted into the frame.`;
    }
    if (text && text.trim()) {
      return base +
        `⚠️ TASK: Add an elegant printed/engraved text "${text}" centered on the wall art surface shown in the first image. Use refined serif typography. Copy character-by-character. Photorealistic, same framing as reference.`;
    }
    return base + `Show the product identical to the reference, no personalization yet.`;
  }

  if (mockupType === 'foto') {
    if (hasArtRef) {
      return base +
        `⚠️ TASK: Print the SECOND reference image (the customer's photo) onto the top surface of the coaster shown in the first image. ` +
        `Reproduce the photo at full color, high fidelity, fitting the circular/square coaster surface naturally (crop if needed but preserve key composition). DO NOT alter the photo's colors. ` +
        `The result must look like a sublimation print on recycled plastic — slight matte sheen, follows the disc curvature, integrated with the material. NO flat sticker look, NO floating overlay. ` +
        (text && text.trim() ? `Optionally add a small text "${text}" along the edge or below the photo. ` : '') +
        `Final output: photorealistic, identical background/framing/lighting as the first reference.`;
    }
    return base + (text && text.trim()
      ? `⚠️ TASK: Print the text "${text}" centered on the coaster surface shown in the first image. Use clean modern sans-serif typography. Copy character-by-character.`
      : `Show the product identical to the reference, no personalization yet.`);
  }

  if (mockupType === 'jenga') {
    const subject = hasArtRef
      ? `the SECOND reference image (the customer's logo) — reproduced literally, monochrome, faithful 1:1 to the original shapes/letters/proportions`
      : (text && text.trim()
          ? `the text "${text}" in clean sans-serif typography, copied character-by-character exactly as written`
          : null);
    if (!subject) return base + `Show the product identical to the reference, no personalization yet.`;
    return base +
      `⚠️ TASK: Add UV laser engravings of ${subject} onto SOME selected pieces of the Jenga tower shown in the first image — NOT on all blocks. ` +
      `Engrave it on roughly 6-10 visible pieces distributed naturally across the tower (some on the top blocks, some mid-tower, some near the bottom), keeping the structural integrity and visual rhythm. Other blocks remain completely blank. ` +
      `Each engraving must look PHYSICALLY BURNED into the recycled plastic: monochrome single tone, micro depth, subtle darkening, follows the block surface, integrated with the marbled texture. NO stickers, NO flat overlays, NO glow, NO color fills. ` +
      `Vary the orientation slightly per block to look natural (some horizontal, some rotated). Final output: photorealistic, same background/framing/lighting as reference.`;
  }

  // DEFAULT: logo grabado láser sobre cualquier producto
  if (hasArtRef) {
    return base +
      `⚠️ SECOND CRITICAL RULE: The SECOND reference image IS the customer's EXACT logo. Reproduce it LITERALLY — same shapes, letters, proportions. DO NOT redesign, simplify or substitute. If it has text, copy character-by-character. Treat it as a stencil to be burned. ` +
      `TASK: Add a UV laser engraving that is a faithful 1:1 reproduction of the SECOND reference image onto the product surface in the first image. ` +
      `The engraving MUST look PHYSICALLY ENGRAVED into the recycled plastic: monochrome single tone (lasers engrave in one tone determined by the material), micro depth, subtle darkening or lighter etched tone, tiny shadow inside the strokes, follows curvature and marbled texture. NO floating stickers, NO flat overlay, NO glow, NO color fills. ` +
      `Keep the logo proportional (~30-40% of the visible flat surface), centered on the natural engraving zone, preserving aspect ratio. ` +
      (text && text.trim() ? `Engrave the tagline "${text}" in clean sans-serif below the logo, same engraved style, smaller size. Copy character-by-character. ` : '') +
      `Final output: photorealistic, identical background/framing/angle/lighting to the first reference.`;
  }
  if (text && text.trim()) {
    return base +
      `⚠️ The customer's text is "${text}". Engrave it LITERALLY, character-by-character, preserving letters, accents, spaces and punctuation EXACTLY. ` +
      `TASK: UV laser engraving of "${text}" onto the product surface. Clean sans-serif (Inter/Helvetica), micro depth, subtle darkening inside strokes, tiny shadow, follows curvature, blends with marbled recycled plastic. NO stickers, NO flat overlay, NO glow. Centered on the engraving zone. ` +
      `Final output: photorealistic, identical to the first reference image with the engraving added physically.`;
  }
  return base + `Show the product identical to the reference, no engraving added.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { productName, productCategory, productImageUrl, logoUrl, text, color, sku, jobId, mockupType = 'logo' } = await req.json();

    if (!productName) {
      return Response.json({ error: 'productName es requerido' }, { status: 400 });
    }

    const hasProductRef = isRasterImage(productImageUrl);

    let effectiveLogoUrl = null;
    if (isRasterImage(logoUrl)) {
      effectiveLogoUrl = logoUrl;
    } else if (isSvgImage(logoUrl)) {
      effectiveLogoUrl = svgToPngUrl(logoUrl) || logoUrl;
    }
    const hasLogoRef = !!effectiveLogoUrl;

    const prompt = buildPromptByType({
      mockupType,
      productName,
      productCategory,
      hasProductRef,
      hasArtRef: hasLogoRef,
      text,
      color,
    });

    const references = [];
    if (hasProductRef) references.push(productImageUrl);
    if (hasLogoRef) references.push(effectiveLogoUrl);

    let result;
    if (references.length > 0) {
      try {
        result = await base44.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: references,
        });
      } catch (imgErr) {
        console.warn('Referencias directas fallaron, intentando mirror:', imgErr?.message);
        const mirrored = [];
        for (const url of references) {
          const m = await mirrorToBase44(base44, url);
          if (m) mirrored.push(m);
        }
        if (mirrored.length > 0) {
          try {
            result = await base44.integrations.Core.GenerateImage({
              prompt,
              existing_image_urls: mirrored,
            });
          } catch {
            result = null;
          }
        }
      }
    }
    if (!result) {
      result = await base44.integrations.Core.GenerateImage({ prompt });
    }

    if (jobId) {
      const job = await base44.asServiceRole.entities.PersonalizationJob.filter({ id: jobId });
      if (job && job.length > 0) {
        const currentUrls = job[0].mockup_urls || [];
        await base44.asServiceRole.entities.PersonalizationJob.update(jobId, {
          mockup_urls: [...currentUrls, result.url],
          status: 'Preview generado',
        });
      }
    }

    return Response.json({
      mockup_url: result.url,
      success: true,
      product: productName,
      mockup_type: mockupType,
      used_product_reference: hasProductRef,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});