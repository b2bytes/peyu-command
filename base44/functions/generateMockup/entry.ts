import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Solo imágenes raster que GenerateImage puede leer como referencia
const isRasterImage = (url) => !!url && /\.(png|jpg|jpeg|webp)(\?|$)/i.test(url);

// Intenta descargar una imagen desde una o más variantes de URL
async function tryFetchImage(url) {
  // Candidatos: URL original + variantes + proxy público (weserv.nl proxea imágenes evitando hotlink blocks)
  const candidates = [url];
  try {
    const u = new URL(url);
    candidates.push(`${u.origin}${u.pathname}`);
    if (/^i[0-9]\.wp\.com$/.test(u.hostname)) {
      const rest = u.pathname.replace(/^\//, '');
      candidates.push(`https://${rest}`);
    }
    // Proxy público images.weserv.nl — hace re-fetch desde su servidor y sirve la imagen como jpg
    // weserv requiere URL limpia sin protocolo ni querystring
    try {
      const u2 = new URL(url);
      const cleanNoQs = `${u2.hostname}${u2.pathname}`; // sin protocolo ni query
      candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(cleanNoQs)}&output=jpg&w=800`);
      // Para wp.com, también probar con el hostname original del sitio
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
      } else {
        console.warn('Fetch candidate !ok:', res.status, candidate);
      }
    } catch (e) {
      console.warn('Fetch candidate error:', candidate, e?.message);
    }
  }
  return null;
}

// Re-subir imagen externa a base44 storage (para que GenerateImage pueda leerla)
async function mirrorToBase44(base44, url) {
  try {
    const fetched = await tryFetchImage(url);
    if (!fetched) return null;
    const { buf, contentType } = fetched;
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const file = new File([buf], `mirror.${ext}`, { type: contentType });
    const upload = await base44.integrations.Core.UploadFile({ file });
    return upload?.file_url || null;
  } catch (e) {
    console.warn('Mirror excepción:', e?.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { productName, productCategory, productImageUrl, logoUrl, text, color, sku, jobId } = await req.json();

    if (!productName) {
      return Response.json({ error: 'productName es requerido' }, { status: 400 });
    }

    // Construir prompt: enfatizar que la imagen de referencia ES el producto a usar
    const hasProductRef = isRasterImage(productImageUrl);
    const hasLogoRef = isRasterImage(logoUrl);

    let prompt = '';

    if (hasProductRef) {
      // La imagen de referencia es el producto real → no inventar uno nuevo
      prompt += `⚠️ ABSOLUTE CRITICAL RULE: The FIRST reference image IS the exact product the customer chose from our e-commerce. You MUST use it as the base image. DO NOT generate a new product. DO NOT change the product shape, color, material, angle, lighting, background, or framing. Preserve the image EXACTLY as provided — you are ONLY allowed to add a laser engraving on top of it. `;
      prompt += `Product: "${productName}"${productCategory ? ` (category: ${productCategory})` : ''} — Peyu Chile, made in Chile from 100% recycled plastic. `;

      if (hasLogoRef) {
        prompt += `TASK: Add a UV laser engraving of the provided logo (SECOND reference image) onto the product surface shown in the first image. `;
        prompt += `The engraving MUST look PHYSICALLY ENGRAVED into the recycled plastic: micro depth, subtle darkening or lighter etched tone depending on base color, tiny shadow inside the engraved strokes, follows the product curvature and marbled texture. NO floating stickers, NO flat overlay, NO glow, NO added light sources. `;
        prompt += `Keep the logo proportional to the product's engraving area (roughly 30-40% of the visible flat surface). Center it on the natural engraving zone of the product. `;
      } else if (text && text.trim()) {
        prompt += `TASK: Add a UV laser engraving of the text "${text}" onto the product surface shown in the first image. `;
        prompt += `The text MUST look PHYSICALLY ENGRAVED into the recycled plastic: clean sans-serif typography (like Inter or Helvetica), micro depth, subtle darkening inside the strokes, tiny shadow, follows the product curvature, blends with the marbled recycled plastic texture. NO floating stickers, NO flat overlay, NO glow. `;
        prompt += `Size the text proportionally to the product's engraving area. Center it on the natural engraving zone. `;
      } else {
        prompt += `Show the product identical to the reference, no engraving added. `;
      }

      prompt += `Final output: photorealistic, identical background/framing/angle/lighting to the first reference image, sharp focus on the engraved area, high detail. The result must look like the SAME product photo with the engraving added physically.`;
    } else {
      // Fallback: no tenemos imagen del producto → generamos desde cero con descripción
      prompt += `Photorealistic product photograph of a Peyu Chile corporate gift: "${productName}"`;
      if (productCategory) prompt += ` (${productCategory})`;
      prompt += `. Made from 100% recycled plastic with visible marbled texture, manufactured in Chile. `;
      prompt += `Clean studio photography, soft neutral background, professional soft lighting, 3/4 view. `;
      if (text && text.trim()) {
        prompt += `UV laser engraved text "${text}" clearly visible on the product surface — looks physically engraved, subtle depth, integrated with the material. `;
      }
      if (hasLogoRef) {
        prompt += `UV laser engraved corporate logo (reference image) on the product surface — looks physically engraved into the recycled plastic, subtle depth, integrated with the material. `;
      }
      if (color) prompt += `Product color: ${color}. `;
      prompt += `Sustainable eco-design, premium quality.`;
    }

    // Pasar referencias: producto primero (si existe), luego logo
    const references = [];
    if (hasProductRef) references.push(productImageUrl);
    if (hasLogoRef) references.push(logoUrl);

    let result;
    if (references.length > 0) {
      try {
        result = await base44.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: references,
        });
      } catch (imgErr) {
        console.warn('Referencias directas fallaron, intentando mirror:', imgErr?.message);
        // Segundo intento: re-subir imágenes a base44 storage (CDN-agnóstico)
        const mirrored = [];
        for (const url of references) {
          const m = await mirrorToBase44(base44, url);
          if (m) {
            console.log('Mirror exitoso:', url, '→', m);
            mirrored.push(m);
          } else {
            console.warn('Mirror falló para:', url);
          }
        }
        if (mirrored.length > 0) {
          try {
            result = await base44.integrations.Core.GenerateImage({
              prompt,
              existing_image_urls: mirrored,
            });
          } catch (e2) {
            console.warn('Mirror también falló en GenerateImage:', e2?.message);
            result = null;
          }
        }
      }
    }
    if (!result) {
      result = await base44.integrations.Core.GenerateImage({ prompt });
    }

    // Si hay jobId, actualizar el PersonalizationJob
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
      used_product_reference: hasProductRef,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});