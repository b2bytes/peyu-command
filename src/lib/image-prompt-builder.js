// ============================================================================
// image-prompt-builder.js — Lógica compartida para construir prompts de IA
// de generación de imágenes de producto PEYU.
//
// Usado por:
//   • components/admin-products/AIImageEnhancer (generación uno-a-uno)
//   • components/admin-products/BulkImageGeneratorPanel (generación masiva)
//
// Razonamiento que aplica:
//   1. Título del producto (extrae cantidad si dice "Pack 6", "Set 4", etc.)
//   2. Material (describe visualmente: reciclado, fibra de trigo, etc.)
//   3. Categoría + canal
//   4. Descripción del catálogo (resumida)
//   5. Cantidad de unidades a mostrar
//   6. PROHIBICIONES ABSOLUTAS de marcas/logos/texto (Google Shopping compliance)
// ============================================================================

export const ESTILOS = [
  { id: 'lifestyle', label: 'Lifestyle',      prompt: 'in a lifestyle scene, soft natural daylight, scandinavian wooden desk surface, plants softly blurred in the background, shallow depth of field' },
  { id: 'studio',    label: 'Estudio limpio', prompt: 'on a seamless white studio background, soft single-source studio lighting, subtle drop shadow, professional product catalog photography' },
  { id: 'corporate', label: 'Corporativo',    prompt: 'in a corporate office environment, modern minimalist desk, neutral business setting, warm professional lighting' },
  { id: 'eco',       label: 'Eco / Natural',  prompt: 'on a natural eco surface (wood, linen, recycled paper), surrounded by leaves and natural fibers, earthy tones, sustainability mood' },
];

export function describirMaterial(material = '') {
  const m = material.toLowerCase();
  if (m.includes('reciclado')) {
    return 'made of 100% recycled plastic with a subtle marbled/speckled texture (visible color flecks from recycled HDPE/PP plastic), matte finish, slightly irregular natural surface that proves it is reclaimed material — NOT shiny mass-produced plastic';
  }
  if (m.includes('trigo') || m.includes('compostable')) {
    return 'made of compostable wheat fiber bioplastic, soft beige/cream color with a natural fibrous texture, matte organic finish, slight grain visible — looks earthy and biodegradable';
  }
  return `made of ${material}`;
}

export function resumirDescripcion(desc = '', maxChars = 280) {
  if (!desc) return '';
  const limpio = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (limpio.length <= maxChars) return limpio;
  return limpio.slice(0, maxChars).replace(/\s\S*$/, '') + '…';
}

export function detectarCantidad(nombre = '') {
  const m = nombre.match(/(?:pack|set|kit|combo|promo(?:ci[oó]n)?|caja|grupo)\s*(?:de\s+)?(\d{1,2})/i)
        || nombre.match(/\b(\d{1,2})\s*(?:unidades?|u\.?|pcs|piezas?)\b/i)
        || nombre.match(/\b(\d{1,2})\s*x\s+/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 2 && n <= 20 ? n : null;
}

export function detectarItem(nombre = '') {
  const lower = nombre.toLowerCase();
  const items = ['cachos', 'cacho', 'posavasos', 'posacachos', 'maceteros', 'macetero',
                 'sujetadores', 'sujetador', 'paletas', 'paleta', 'pocillos', 'pocillo',
                 'llaveros', 'llavero', 'soportes', 'soporte'];
  for (const it of items) if (lower.includes(it)) return it;
  return 'unidades';
}

/**
 * Construye el prompt completo para una imagen del producto.
 *
 * @param {object} producto - { nombre, categoria, material, canal, descripcion }
 * @param {object} styleObj - uno de ESTILOS
 * @param {boolean} tieneReferencia - true si vamos a pasar existing_image_urls
 * @param {string} instruccionExtra - texto libre opcional del admin
 * @returns {string} prompt listo para GenerateImage
 */
export function buildPrompt(producto, styleObj, tieneReferencia, instruccionExtra = '') {
  const cantidadEsperada = detectarCantidad(producto.nombre);
  const itemNombre = detectarItem(producto.nombre);

  const reglaCantidad = cantidadEsperada
    ? `\n\nCRITICAL — EXACT QUANTITY REQUIRED:
- This product is a "${producto.nombre}". You MUST show EXACTLY ${cantidadEsperada} ${itemNombre} in the image. Not fewer, not more.
- Count them visually before finishing. The image MUST contain ${cantidadEsperada} individual ${itemNombre} clearly visible.
- Arrange them neatly so all ${cantidadEsperada} are clearly countable.`
    : '';

  const reglaExtra = instruccionExtra && instruccionExtra.trim()
    ? `\n\nADDITIONAL ADMIN INSTRUCTION:\n${instruccionExtra.trim()}`
    : '';

  const descripcionResumida = resumirDescripcion(producto.descripcion);
  const materialVisual = describirMaterial(producto.material);
  const contextoProducto = `
PRODUCT BRIEF (use this to understand what to show):
- Name: ${producto.nombre}
- Category: ${producto.categoria}
- Material: ${materialVisual}
- Channel: ${producto.canal || 'B2C + B2B'}${descripcionResumida ? `\n- Real product description (from catalog): "${descripcionResumida}"` : ''}`;

  const reglasAntiMarca = `

ABSOLUTE PROHIBITIONS (Google Shopping policy — STRICTLY ENFORCED):
- ❌ NO brand names, NO company names, NO text of any kind anywhere in the image.
- ❌ NO logos: not on the product, not in the background, not on packaging, not on props.
- ❌ NO watermarks, NO captions, NO labels with readable text.
- ❌ NO third-party trademarks (Apple, Nike, Coca-Cola, IKEA, Starbucks, etc.) visible on any object, screen, book cover, mug, sign, or surface.
- ❌ NO competitor products or branded competitor packaging.
- ❌ NO PEYU logo either — this image must be 100% brand-neutral.
- ✅ The product itself must appear completely UNBRANDED — plain surface, no engraved/printed brand marks.
- ✅ If props appear (laptop, phone, mug, notebook), they must be GENERIC and brandless.
- ✅ All text-like surfaces (book spines, packaging, screens, signs) must be blank or blurred.`;

  if (tieneReferencia) {
    return `Take the EXACT product shown in the reference image(s) and place it in a new scene.${contextoProducto}

CRITICAL — DO NOT CHANGE THE PRODUCT:
- The product must look IDENTICAL to the reference: same shape, exact same color, same material texture, same proportions, same details and finishings.
- Do not redesign, restyle, recolor, or alter the product in any way.
- IMPORTANT: If the reference shows any logo or brand mark on the product, REMOVE it cleanly in the output. The output product must be unbranded.
- Keep the product as the clear hero of the composition, centered and in sharp focus.${reglaCantidad}

ONLY CHANGE THE BACKGROUND, SETTING AND LIGHTING:
${styleObj.prompt}.${reglaExtra}${reglasAntiMarca}

Photography style: premium e-commerce product photography, high resolution, sharp focus on the product, natural realistic shadows. Looks like a real DSLR product photo, not 3D render.`;
  }

  return `Create a realistic, premium product photograph for an e-commerce listing of a sustainable Chilean product.${contextoProducto}

CRITICAL — DESIGN THE PRODUCT FROM THE BRIEF:
- Render the product as accurately as possible based on the name, category and description above.
- Make sure the MATERIAL is visually unmistakable: ${materialVisual}. This is the most important visual detail — the viewer must instantly recognize the product is made of this material.
- If the description mentions specific features (size, color, finish, parts), include them faithfully.
- Single hero product, well composed, sharp focus, realistic proportions.${reglaCantidad}

SCENE / BACKGROUND:
${styleObj.prompt}.${reglaExtra}${reglasAntiMarca}

Photography style: sustainability-forward, natural, warm and premium. High resolution, realistic shadows. Looks like a real DSLR product photo, not 3D render.`;
}