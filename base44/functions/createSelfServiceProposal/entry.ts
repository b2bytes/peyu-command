import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// ── Gmail API inline (evita subllamada function→function que da 403 en flujo público) ──
function encodeHeader(str) {
  if (!str) return '';
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}
function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
// Adjunta un PDF (base64) al correo usando multipart/mixed que envuelve un
// multipart/alternative (texto + html). Asunto en RFC 2047 UTF-8 (encodeHeader).
async function sendViaGmail(accessToken, { to, cc, replyTo, subject, html, fromName = 'PEYU Chile', pdfBase64 = null, pdfName = 'propuesta.pdf' }) {
  const altB = `peyu_alt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mixB = `peyu_mix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const plain = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  const altPart = [
    `Content-Type: multipart/alternative; boundary="${altB}"`,
    '',
    `--${altB}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plain,
    '',
    `--${altB}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${altB}--`,
  ].join('\r\n');

  const headers = [
    `From: ${encodeHeader(fromName)} <ti@peyuchile.cl>`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
  ].filter((l) => l !== null);

  let message;
  if (pdfBase64) {
    // Gmail exige el base64 del adjunto en líneas de máx 76 chars.
    const wrapped = pdfBase64.replace(/.{76}/g, '$&\r\n');
    message = [
      ...headers,
      `Content-Type: multipart/mixed; boundary="${mixB}"`,
      '',
      `--${mixB}`,
      altPart,
      '',
      `--${mixB}`,
      `Content-Type: application/pdf; name="${pdfName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${pdfName}"`,
      '',
      wrapped,
      '',
      `--${mixB}--`,
    ].join('\r\n');
  } else {
    message = [...headers, altPart].join('\r\n');
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(message) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gmail API ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

// ── Personalización láser: tarifa por unidad según tipo, GRATIS desde 10u ──
// frase $3.990 · diseño PEYU (galería) $4.990 · diseño/logo cliente $7.990
const FEE_PERSONALIZACION = { frase: 3990, peyu: 4990, archivo: 7990, logo: 7990, propio: 7990 };
const MOQ_PERS_GRATIS = 10;

function feePersonalizacionItem(item) {
  // No hay personalización en este ítem → sin cargo.
  if (!item.personalizacion && !item.tipo_personalizacion) return { feeUnit: 0, fee: 0, gratis: false, tipo: null };
  const qty = item.qty || item.cantidad || 0;
  const tipo = (item.tipo_personalizacion || 'frase').toLowerCase();
  const feeUnit = FEE_PERSONALIZACION[tipo] ?? FEE_PERSONALIZACION.frase;
  const gratis = qty >= MOQ_PERS_GRATIS;
  const fee = gratis ? 0 : feeUnit * qty;
  return { feeUnit, fee, gratis, tipo };
}

function buildProposalEmailHtml({ proposal, items, proposalUrl, subtotalNeto, iva }) {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #EEF1F0;font-size:14px;color:#0F172A;font-weight:600;">${it.nombre || '-'}${it.tier ? `<div style="font-size:11px;color:#64748B;margin-top:2px;">Tramo ${it.tier}</div>` : ''}${it.personalizacion ? '<div style="font-size:11px;color:#0F8B6C;margin-top:2px;">+ Personalización láser UV</div>' : ''}</td>
      <td style="padding:12px;border-bottom:1px solid #EEF1F0;text-align:center;font-size:14px;color:#475569;">${it.cantidad || it.qty || 0}</td>
      <td style="padding:12px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:14px;color:#475569;">${fmtCLP(it.precio_unitario)}<div style="font-size:10px;color:#94A3B8;">neto c/u</div></td>
      <td style="padding:12px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:14px;font-weight:700;color:#0F172A;">${fmtCLP(it.line_total)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">
<tr><td style="background:linear-gradient(135deg,#0F172A 0%,#0A4A3D 60%,#0F8B6C 100%);padding:36px;color:#fff;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase;">PEYU · COTIZACIÓN INSTANTÁNEA</p>
<h1 style="margin:0;font-size:24px;font-weight:800;">Tu propuesta está lista 🐢</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);">Propuesta <strong style="color:#fff;">N° ${proposal.numero}</strong> · Precios por volumen aplicados</p>
</td></tr>
<tr><td style="padding:32px 36px 8px;">
<p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${proposal.contacto},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">Generamos tu propuesta corporativa al instante. Aquí está el detalle con tus descuentos por volumen ya aplicados.</p>
<table role="presentation" width="100%" style="background:linear-gradient(135deg,#F0FAF7,#E0F2EB);border:1px solid #C8E6DA;border-radius:16px;margin-bottom:24px;"><tr><td style="padding:22px 26px;">
<table role="presentation" width="100%" style="margin-bottom:8px;">
  <tr><td style="font-size:14px;color:#475569;padding:3px 0;">Subtotal neto</td><td style="font-size:14px;color:#475569;text-align:right;padding:3px 0;">${fmtCLP(subtotalNeto)}</td></tr>
  <tr><td style="font-size:14px;color:#475569;padding:3px 0;">IVA (19%)</td><td style="font-size:14px;color:#475569;text-align:right;padding:3px 0;">${fmtCLP(iva)}</td></tr>
  <tr><td style="font-size:16px;font-weight:800;color:#0F172A;padding:8px 0 0;border-top:1px solid #C8E6DA;">Total con IVA</td><td style="font-size:22px;font-weight:800;color:#0F172A;text-align:right;padding:8px 0 0;border-top:1px solid #C8E6DA;">${fmtCLP(proposal.total)}</td></tr>
</table>
<p style="margin:4px 0 0;font-size:12px;color:#64748B;">CLP · Lead time ${proposal.lead_time_dias} días · Validez ${proposal.validity_days || 15} días</p>
</td></tr></table>
<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:28px;"><thead><tr style="background:#0F172A;">
<th style="padding:10px 12px;text-align:left;font-size:11px;color:#fff;text-transform:uppercase;border-radius:8px 0 0 8px;">Producto</th>
<th style="padding:10px;text-align:center;font-size:11px;color:#fff;text-transform:uppercase;">Cant.</th>
<th style="padding:10px;text-align:right;font-size:11px;color:#fff;text-transform:uppercase;">Unit.</th>
<th style="padding:10px 12px;text-align:right;font-size:11px;color:#fff;text-transform:uppercase;border-radius:0 8px 8px 0;">Total</th>
</tr></thead><tbody>${rows}</tbody></table>
<table role="presentation" width="100%" style="margin-bottom:24px;"><tr><td align="center">
<a href="${proposalUrl}" style="display:block;background:linear-gradient(135deg,#0F8B6C,#0A6B54);color:#fff;text-decoration:none;padding:16px 28px;border-radius:14px;font-weight:700;font-size:15px;text-align:center;">Ver propuesta online y descargar PDF →</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#78350F;background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;padding:14px 18px;line-height:1.5;"><strong>¿Ajustamos algo?</strong> Responde este email o escríbenos al <a href="https://wa.me/56935040242" style="color:#0F8B6C;font-weight:700;text-decoration:none;">+56 9 3504 0242</a>.</p>
</td></tr>
<tr><td style="background:#0F172A;padding:24px 36px;text-align:center;">
<p style="margin:0 0 4px;font-size:13px;color:#fff;font-weight:700;">PEYU Chile SpA</p>
<p style="margin:0;font-size:11px;color:#94A3B8;">Plástico que renace · <a href="https://peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">peyuchile.cl</a> · ti@peyuchile.cl</p>
</td></tr></table></td></tr></table></body></html>`;
}

// === Construcción del prompt del mockup con POSICIÓN del grabado ===
// posicion: 'arriba' | 'centro' | 'abajo'. Es clave para que el logo NO quede
// donde no es. Se describe explícitamente la ubicación sobre la superficie.
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

// === Pricing usando la TABLA REAL del producto ===
// Prioridad 1: precio_b2b_tramos (catálogo oficial V2, 8 tramos sin IVA).
// Prioridad 2: tabla legacy (precio_50_199, precio_200_499, etc).
// Prioridad 3: fallback porcentual.
function calcUnitPrice(item) {
  const qty = item.qty || item.cantidad || 0;

  // ── Prioridad 1: precio_b2b_tramos (8 llaves del catálogo oficial) ──
  const t = item.precio_b2b_tramos;
  if (t && typeof t === 'object') {
    if (qty >= 2000 && t.t2000_mas)      return { unit: t.t2000_mas,      tier: '2000+ u.' };
    if (qty >= 1000 && t.t1000_1999)     return { unit: t.t1000_1999,     tier: '1000-1999 u.' };
    if (qty >= 500 && t.t500_999)        return { unit: t.t500_999,       tier: '500-999 u.' };
    if (qty >= 250 && t.t250_499)        return { unit: t.t250_499,       tier: '250-499 u.' };
    if (qty >= 100 && t.t100_249)        return { unit: t.t100_249,       tier: '100-249 u.' };
    if (qty >= 50 && t.t50_99)           return { unit: t.t50_99,         tier: '50-99 u.' };
    if (qty >= 10 && t.t10_49)           return { unit: t.t10_49,         tier: '10-49 u.' };
    if (t.unitario)                      return { unit: t.unitario,       tier: '1-9 u.' };
  }

  const base = item.precio_base_b2b || item.precio_base || item.precio_b2c || 5000;

  // ── Prioridad 2: tabla legacy ──
  if (qty >= 500 && item.precio_500_mas) return { unit: item.precio_500_mas, tier: '500+ u.' };
  if (qty >= 200 && item.precio_200_499) return { unit: item.precio_200_499, tier: '200-499 u.' };
  if (qty >= 50 && item.precio_50_199) return { unit: item.precio_50_199, tier: '50-199 u.' };
  if (qty >= 10 && item.precio_base_b2b) return { unit: item.precio_base_b2b, tier: '10-49 u.' };

  // ── Prioridad 3: fallback porcentual ──
  let discount = 0;
  if (qty >= 500) discount = 0.25;
  else if (qty >= 200) discount = 0.15;
  else if (qty >= 50) discount = 0.08;
  return { unit: Math.round(base * (1 - discount)), tier: '1-9 u.' };
}

// ¿El producto tiene tabla B2B oficial (precio_b2b_tramos con al menos 1 valor)?
function tieneTramosOficiales(item) {
  const t = item.precio_b2b_tramos;
  if (!t || typeof t !== 'object') return false;
  return ['unitario','t10_49','t50_99','t100_249','t250_499','t500_999','t1000_1999','t2000_mas']
    .some(k => Number(t[k]) > 0);
}

function calcPricing(items) {
  let subtotal = 0;
  let feePersonalizacionTotal = 0;
  const breakdown = items.map(item => {
    const qty = item.qty || item.cantidad || 0;
    const { unit, tier } = calcUnitPrice(item);
    const refB2C = item.precio_b2c || item.precio_base_b2b || unit;
    const descuentoPct = refB2C > 0 ? Math.round((1 - unit / refB2C) * 100) : 0;
    const lineTotal = unit * qty;
    subtotal += lineTotal;

    // FIX 1 — Fee de personalización láser por ítem (gratis ≥10u).
    const pers = feePersonalizacionItem(item);
    feePersonalizacionTotal += pers.fee;

    return {
      ...item,
      precio_unitario: unit,
      descuento_pct: Math.max(0, descuentoPct),
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
    const prodDays = Math.ceil(qty / 1500);
    const laserDays = item.personalizacion ? Math.ceil(qty / 1500) : 0;
    maxDays = Math.max(maxDays, prodDays + laserDays + 2);
  }
  return Math.min(maxDays, 20);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      contact_name, company_name, email, phone, rut, items, logoUrl, notes,
      giro = '',
      direccion_facturacion = '',
      posicion_grabado = 'centro',
      metodo_entrega = 'Despacho a domicilio',
      direccion_entrega = '',
      comuna_entrega = '',
    } = await req.json();

    if (!contact_name || !company_name || !email) {
      return Response.json({ error: 'contact_name, company_name y email son requeridos' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return Response.json({ error: 'Debes incluir al menos un producto' }, { status: 400 });
    }

    // FIX 2 — Cero precios fabricados: el cotizador SOLO acepta productos con
    // tabla B2B oficial (precio_b2b_tramos). Los que no la tienen se derivan a
    // contacto y NO entran a la propuesta con descuentos inventados.
    const sinTabla = items.filter(it => !tieneTramosOficiales(it));
    const itemsValidos = items.filter(tieneTramosOficiales);
    if (itemsValidos.length === 0) {
      return Response.json({
        error: 'precio_a_consultar',
        message: 'Estos productos no tienen tarifa B2B oficial. Te derivamos a un ejecutivo para cotizar.',
        productos_sin_tarifa: sinTabla.map(i => i.nombre || i.name).filter(Boolean),
      }, { status: 422 });
    }

    // 1. Crear B2BLead
    const totalQty = itemsValidos.reduce((s, i) => s + (i.qty || i.cantidad || 0), 0);
    const hasPersonalization = itemsValidos.some(i => i.personalizacion || i.tipo_personalizacion);
    const lead = await base44.asServiceRole.entities.B2BLead.create({
      source: 'Formulario Web',
      contact_name,
      company_name,
      email,
      phone: phone || '',
      rut: rut || '',
      product_interest: itemsValidos.map(i => i.nombre || i.name).filter(Boolean).join(', ').slice(0, 200),
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

    // 2. Calcular precios (tabla B2B oficial) + fee personalización + lead time
    // IVA: los tramos son NETOS. neto = subtotal + fee · iva = round(neto*0.19) · total = neto + iva.
    const { breakdown, subtotal, feePersonalizacionTotal } = calcPricing(itemsValidos);
    const neto = subtotal + feePersonalizacionTotal;
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    const leadTime = calcLeadTime(itemsValidos);

    // 3. Numero + vencimiento
    const propNum = `PEY-${Date.now().toString().slice(-6)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    // 4. Mockup con TIMEOUT DURO. GenerateImage tarda ~10-15s y a veces más; si
    //    se cuelga, NO debe bloquear toda la cotización (era la causa raíz del
    //    botón "Generando..." infinito). Lo limitamos con Promise.race y, si
    //    excede, seguimos sin mockup (el cliente igual recibe su propuesta).
    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);

    let mockupUrls = [];
    if (hasPersonalization) {
      try {
        const firstItem = breakdown[0] || {};
        const productName = firstItem.nombre || firstItem.name || 'Producto Peyu';
        const productCategory = firstItem.categoria || '';
        const productImageUrl = firstItem.imagen_url || '';
        const hasLogoRef = /\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(logoUrl || '');
        const engraveText = hasLogoRef ? '' : company_name;

        const { prompt, references } = buildMockupPrompt({
          productName, productCategory, productImageUrl, logoUrl,
          engraveText, posicion: posicion_grabado,
        });

        const genImage = references.length > 0
          ? base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: references })
              .catch(() => base44.integrations.Core.GenerateImage({ prompt }))
          : base44.integrations.Core.GenerateImage({ prompt });

        const imgRes = await withTimeout(genImage, 25000);
        if (imgRes?.url) mockupUrls = [imgRes.url];
      } catch (e) {
        console.warn('Mockup opcional falló/timeout, continuando sin él:', e?.message);
      }
    }

    // 5. Crear propuesta (esto SIEMPRE ocurre — es el corazón del flujo)
    const proposal = await base44.asServiceRole.entities.CorporateProposal.create({
      numero: propNum,
      b2b_lead_id: lead.id,
      empresa: company_name,
      contacto: contact_name,
      email,
      giro,
      direccion_facturacion,
      items_json: JSON.stringify(breakdown),
      subtotal,
      fee_personalizacion: feePersonalizacionTotal,
      total,
      lead_time_dias: leadTime,
      validity_days: 15,
      anticipo_pct: 50,
      status: 'Enviada',
      auto_generated: true,
      mockup_urls: mockupUrls,
      logo_url: logoUrl || '',
      posicion_grabado,
      metodo_entrega,
      direccion_entrega,
      comuna_entrega,
      terms: 'Anticipo 50% para iniciar produccion. Saldo contra despacho. Garantia 10 anos en plastico reciclado. Fabricacion 100% en Chile.',
      production_notes: `Pedido self-service de ${company_name}. ${hasPersonalization ? `Requiere personalizacion laser UV (grabado ${posicion_grabado}).` : ''} Entrega: ${metodo_entrega}${direccion_entrega ? ` - ${direccion_entrega}${comuna_entrega ? ', ' + comuna_entrega : ''}` : ''}. Lead time: ${leadTime} dias habiles.`,
      fecha_envio: new Date().toISOString().split('T')[0],
      fecha_vencimiento: expiryDate.toISOString().split('T')[0],
    });

    // 6. Email automático INLINE vía Gmail (ti@peyuchile.cl). Best-effort: si
    //    falla NO bloquea la respuesta (el cliente puede reenviar desde la
    //    pantalla de éxito). Se inlinea para evitar la subllamada
    //    function→function, que da 403 en este flujo público.
    // 6.a Generar el PDF para adjuntarlo. La subllamada SDK function→function da
    //     403 en el flujo público, así que llamamos al endpoint HTTP directamente
    //     reenviando el Authorization/apikey del request original.
    // Las funciones NO se pueden invocar desde el dominio de plataforma; hay que
    // pegarle al SUBDOMINIO de la app. Lo derivamos del appId y reenviamos el
    // Authorization/api_key del request original para conservar el contexto.
    let pdfBase64 = null;
    let pdfError = null;
    try {
      const appId = Deno.env.get('BASE44_APP_ID');
      const pdfUrl = `https://${appId}.base44.app/api/apps/${appId}/functions/generateProposalPDF`;
      const fwdHeaders = { 'Content-Type': 'application/json' };
      const auth = req.headers.get('authorization');
      const apikey = req.headers.get('api_key') || req.headers.get('apikey') || req.headers.get('x-api-key');
      if (auth) fwdHeaders['Authorization'] = auth;
      if (apikey) fwdHeaders['api_key'] = apikey;
      const pdfResp = await withTimeout(
        fetch(pdfUrl, { method: 'POST', headers: fwdHeaders, body: JSON.stringify({ proposalId: proposal.id }) }),
        20000,
      );
      if (pdfResp.ok) {
        const body = await pdfResp.json();
        if (body?.pdf_base64) pdfBase64 = body.pdf_base64;
        else pdfError = 'respuesta sin pdf_base64';
      } else {
        pdfError = `PDF endpoint ${pdfResp.status}: ${(await pdfResp.text()).slice(0, 160)}`;
      }
    } catch (e) {
      pdfError = e?.message || 'error desconocido';
      console.warn('PDF para adjunto falló:', pdfError);
    }

    let emailSent = false;
    let emailError = null;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://peyuchile.cl';
      const baseUrl = origin.replace(/\/$/, '').split('/').slice(0, 3).join('/');
      const proposalUrl = `${baseUrl}/b2b/propuesta?id=${proposal.id}`;
      await withTimeout(
        sendViaGmail(accessToken, {
          to: email,
          cc: 'ventas@peyuchile.cl',
          replyTo: 'ventas@peyuchile.cl',
          subject: `Propuesta PEYU N° ${propNum} · ${fmtCLP(total)}`,
          html: buildProposalEmailHtml({ proposal: { ...proposal, numero: propNum, contacto: contact_name }, items: breakdown, proposalUrl, subtotalNeto: neto, iva }),
          fromName: 'PEYU Chile',
          pdfBase64,
          pdfName: `PEYU-Propuesta-${propNum}.pdf`,
        }),
        20000,
      );
      emailSent = true;
    } catch (e) {
      // FIX 3 — nada de fallar en silencio: registramos y reportamos al frontend.
      emailError = e?.message || 'Error desconocido enviando el correo';
      console.error('Email/adjunto falló:', emailError);
    }

    return Response.json({
      success: true,
      proposal_id: proposal.id,
      numero: propNum,
      total,
      subtotal,
      neto,
      iva,
      fee_personalizacion: feePersonalizacionTotal,
      lead_time_dias: leadTime,
      items: breakdown,
      mockup_urls: mockupUrls,
      proposal_url: `/b2b/propuesta?id=${proposal.id}`,
      pdf_attached: !!pdfBase64,
      pdf_error: pdfError,
      email_sent: emailSent,
      email_error: emailError,
      email_to: email,
      productos_sin_tarifa: sinTabla.map(i => i.nombre || i.name).filter(Boolean),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});