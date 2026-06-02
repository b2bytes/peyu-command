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

// ============================================================================
// PASO 1 · ANÁLISIS DE VISIÓN — Detecta la zona grabable correcta del producto.
// Un modelo de visión inspecciona la foto real del producto y devuelve, en
// lenguaje natural, EXACTAMENTE dónde un láser grabaría el logo (la superficie
// plana primaria visible). Este contexto se inyecta luego en el prompt de
// generación para que el grabado caiga SIEMPRE en el lugar físicamente correcto.
// Best practice 2026: pipeline visión→generación (grounding espacial).
// ============================================================================
async function analyzeEngravingZone(base44, productImageUrl, productName, productCategory) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a laser-engraving production expert. Look at this product photo: "${productName}"${productCategory ? ` (${productCategory})` : ''}, made of recycled plastic by Peyu Chile.

Identify the SINGLE best surface where a UV laser would physically engrave a customer's logo. Real laser engraving only works on a flat (or gently curved) visible primary face — never floating in air, never on edges, never on the background.

Return concise, production-accurate guidance.`,
      file_urls: [productImageUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          engraving_zone: { type: 'string', description: 'The exact surface to engrave, e.g. "the flat front face of the phone case, lower-center area"' },
          zone_position: { type: 'string', description: 'Spatial position in the image: e.g. "center", "upper third", "front panel"' },
          surface_curvature: { type: 'string', description: 'flat | gently curved | cylindrical' },
          recommended_size: { type: 'string', description: 'e.g. "about 35% of the visible flat surface"' },
          avoid_areas: { type: 'string', description: 'Areas where the logo must NOT appear (edges, camera holes, background, etc.)' },
        },
        required: ['engraving_zone', 'zone_position'],
      },
    });
    return res || null;
  } catch (e) {
    console.warn('Vision zone analysis failed, continuing without it:', e?.message);
    return null;
  }
}

// ============================================================================
// LÁSER INTELIGENTE POR COLOR — El grabado láser es SIEMPRE monocromo (1 tono),
// pero ese tono debe contrastar con el color de la carcasa para ser visible:
//   · Carcasas OSCURAS (negro, azul) → láser CLARO (gris claro/blanco humo).
//   · Carcasas CLARAS (amarillo, rosado, turquesa, beige, blanco) → láser OSCURO.
// Detectamos el color desde el label que viene de la ficha (es texto en español).
// ============================================================================
const DARK_COLOR_HINTS = ['negro', 'azul', 'azul marino', 'marino', 'gris oscuro', 'café', 'cafe', 'marron', 'marrón', 'violeta', 'morado', 'verde oscuro'];

function buildLaserToneInstruction(color) {
  if (!color) return '';
  const c = String(color).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isDark = DARK_COLOR_HINTS.some(h => c.includes(h.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) || /(^|\s)(negr|azul|marin|oscur)/.test(c);
  if (isDark) {
    return ` 🔦 LASER TONE (monochrome, single color): the case color is DARK ("${color}"), so the engraving must appear in a LIGHT smoky-grey / off-white etched tone so it is clearly visible against the dark surface. Still ONE single tone — real UV laser engraving is monochrome — only lighter than the case.`;
  }
  return ` 🔦 LASER TONE (monochrome, single color): the case color is LIGHT ("${color}"), so the engraving must appear in a DARK charcoal-grey etched tone so it is clearly visible against the light surface. Still ONE single tone — real UV laser engraving is monochrome — only darker than the case.`;
}

// Construye una instrucción de placement a partir del análisis de visión.
function buildZoneInstruction(zone) {
  if (!zone) return '';
  return `\n\n🎯 EXACT ENGRAVING PLACEMENT (analyzed from the real product photo — OBEY STRICTLY): ` +
    `Engrave ONLY on ${zone.engraving_zone}. Position: ${zone.zone_position}. ` +
    (zone.surface_curvature ? `Surface is ${zone.surface_curvature}, so the engraving must follow that curvature. ` : '') +
    (zone.recommended_size ? `Size: ${zone.recommended_size}. ` : '') +
    (zone.avoid_areas ? `NEVER place the logo on: ${zone.avoid_areas}. ` : '') +
    `The engraving must sit physically ON this surface — not floating, not on the background, not on edges.`;
}

// Construye el prompt según el tipo de mockup (logo/retrato/foto/jenga).
function buildPromptByType({ mockupType, productName, productCategory, hasProductRef, hasArtRef, text, color, zoneInstruction = '', laserTone = '' }) {
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
      zoneInstruction + laserTone +
      `\nFinal output: photorealistic, identical background/framing/angle/lighting to the first reference.`;
  }
  if (text && text.trim()) {
    return base +
      `⚠️ The customer's text is "${text}". Engrave it LITERALLY, character-by-character, preserving letters, accents, spaces and punctuation EXACTLY. ` +
      `TASK: UV laser engraving of "${text}" onto the product surface. Clean sans-serif (Inter/Helvetica), micro depth, subtle darkening inside strokes, tiny shadow, follows curvature, blends with marbled recycled plastic. NO stickers, NO flat overlay, NO glow. Centered on the engraving zone. ` +
      zoneInstruction + laserTone +
      `\nFinal output: photorealistic, identical to the first reference image with the engraving added physically.`;
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

    // PASO 1 · Visión: detectar zona grabable real ANTES de generar.
    // Solo aplica a grabados de logo/texto sobre un producto real (no retrato/foto/jenga
    // que ya tienen su propia lógica de superficie). Esto corrige el problema de
    // posicionamiento: el grabado caerá siempre en la cara correcta del artículo.
    let zoneInstruction = '';
    const needsZone = hasProductRef && (mockupType === 'logo') && (hasLogoRef || (text && text.trim()));
    if (needsZone) {
      const zone = await analyzeEngravingZone(base44, productImageUrl, productName, productCategory);
      zoneInstruction = buildZoneInstruction(zone);
    }

    const laserTone = buildLaserToneInstruction(color);

    const prompt = buildPromptByType({
      mockupType,
      productName,
      productCategory,
      hasProductRef,
      hasArtRef: hasLogoRef,
      text,
      color,
      zoneInstruction,
      laserTone,
    });

    const references = [];
    if (hasProductRef) references.push(productImageUrl);
    if (hasLogoRef) references.push(effectiveLogoUrl);

    // 🔁 Generación robusta con reintentos. El bug reportado por Diego: a veces
    // GenerateImage falla intermitentemente (timeout/red) y el mockup queda vacío.
    // Estrategia: 2 intentos con refs directas → 1 con refs espejadas a Base44 →
    // 1 sin refs (solo prompt). Backoff corto entre intentos. Logueamos cada fallo.
    const genWithRetry = async (urls, intentos = 2) => {
      for (let i = 0; i < intentos; i++) {
        try {
          const r = await base44.integrations.Core.GenerateImage(
            urls && urls.length ? { prompt, existing_image_urls: urls } : { prompt }
          );
          if (r?.url) return r;
          console.warn(`GenerateImage devolvió sin url (intento ${i + 1}/${intentos})`);
        } catch (err) {
          console.error(`GenerateImage falló (intento ${i + 1}/${intentos}):`, err?.message || err);
        }
        if (i < intentos - 1) await new Promise(res => setTimeout(res, 800 * (i + 1)));
      }
      return null;
    };

    let result = null;

    // 1) Refs directas (2 intentos)
    if (references.length > 0) {
      result = await genWithRetry(references, 2);
    }

    // 2) Refs espejadas a Base44 (1 intento) — sortea bloqueos de hotlink de Woo
    if (!result && references.length > 0) {
      console.warn('Mockup: refs directas fallaron, espejando a Base44…');
      const mirrored = [];
      for (const url of references) {
        const m = await mirrorToBase44(base44, url);
        if (m) mirrored.push(m);
      }
      if (mirrored.length > 0) result = await genWithRetry(mirrored, 1);
    }

    // 3) Sin refs, solo prompt (1 intento) — última red de seguridad
    if (!result) {
      console.warn('Mockup: generando solo con prompt (sin refs)…');
      result = await genWithRetry(null, 1);
    }

    // 4) Fallback final: si TODO falló, devolvemos la imagen original del producto
    // para que la UI nunca quede en blanco. Marcamos success:false para que el
    // frontend muestre el aviso correcto.
    if (!result?.url) {
      console.error('Mockup: todos los intentos fallaron. Fallback a imagen del producto.', { productName, sku, color });
      return Response.json({
        mockup_url: hasProductRef ? productImageUrl : null,
        success: false,
        fallback: true,
        error: 'No se pudo generar el mockup tras varios intentos. Mostrando producto base.',
        product: productName,
        mockup_type: mockupType,
      });
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