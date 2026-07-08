// ════════════════════════════════════════════════════════════════════════
// generateChatQuotePDF — Cotización PDF desde el chat conversacional.
// ────────────────────────────────────────────────────────────────────────
// Llamada desde el botón [[QUOTE_PDF]] que renderiza el agente cuando ya
// capturó: producto + cantidad + (empresa o email). NO requiere auth: es
// pública porque el flujo es para visitantes del shop.
//
// Flujo:
//   1. Recibe { conversation_id, sku, qty, empresa?, contacto?, email?,
//      telefono?, fecha_requerida?, personalizacion? }.
//   2. Resuelve precio escalonado del producto según volumen B2B.
//   3. Crea registro Cotizacion (estado=Borrador) con numero auto.
//   4. Renderiza PDF (mismo estilo que exportCotizacionPDF) y lo devuelve
//      como base64 + el id de la cotización para auditar luego.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Tramos B2B oficiales (objeto precio_b2b_tramos). Fuente de verdad del cotizador.
// q>=2000→t2000_mas · >=1000→t1000_1999 · >=500→t500_999 · >=250→t250_499
// >=100→t100_249 · >=50→t50_99 · >=10→t10_49 · <10→unitario.
const TRAMOS_B2B = [
  { min: 2000, key: 't2000_mas' },
  { min: 1000, key: 't1000_1999' },
  { min: 500,  key: 't500_999' },
  { min: 250,  key: 't250_499' },
  { min: 100,  key: 't100_249' },
  { min: 50,   key: 't50_99' },
  { min: 10,   key: 't10_49' },
  { min: 1,    key: 'unitario' },
];
const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

// Resuelve el precio unitario por volumen leyendo precio_b2b_tramos (igual que
// lib/catalog-pricing.getB2BPriceForQty). Cae al tramo anterior con precio si
// uno está vacío. Devuelve null si el producto NO tiene tramos cargados.
function pickEscalonado(producto, qty) {
  const tramos = producto?.precio_b2b_tramos;
  if (!tramos || typeof tramos !== 'object') return null; // sin tramos → no cotizable
  const idx = TRAMOS_B2B.findIndex((t) => qty >= t.min);
  if (idx < 0) return null;
  for (let i = idx; i < TRAMOS_B2B.length; i++) {
    const precio = num(tramos[TRAMOS_B2B[i].key]);
    if (precio) return precio;
  }
  return null;
}

// ── Email helpers (Gmail API, RFC 2822 con adjunto PDF) ──
function encodeHeader(str) {
  if (!str) return '';
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}
function buildMimeWithPdf({ from, to, subject, html, pdfB64, filename }) {
  const boundary = `peyu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].join('\r\n');
  const body = [
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    pdfB64.replace(/(.{76})/g, '$1\r\n'),
    '',
    `--${boundary}--`,
  ].join('\r\n');
  return `${headers}\r\n\r\n${body}`;
}

function genCotNumero() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `COT-${y}${m}-${rand}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      conversation_id,
      sku,
      qty,
      empresa,
      contacto,
      email,
      telefono,
      fecha_requerida,
      personalizacion = 'Láser UV',
      mockup_url,
      logo_url,
      source = 'chat',
    } = body || {};

    if (!sku || !qty) {
      return Response.json({ error: 'Faltan sku o qty' }, { status: 400 });
    }

    // 1. Buscar producto (service role: el chat es público)
    const productos = await base44.asServiceRole.entities.Producto.filter({ sku });
    if (!productos?.length) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    const producto = productos[0];

    // 🖼️ Descargar imágenes para embeber en el PDF: mockup del grabado
    // (imagen/frase/logo que eligió el cliente) + foto del producto. Best-effort.
    async function fetchImg(url) {
      if (!/^https?:\/\//i.test(url || '')) return null;
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        const fmt = ct.includes('png') || (url || '').toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
        return { data: `data:image/${fmt.toLowerCase()};base64,${btoa(bin)}`, fmt };
      } catch { return null; }
    }
    const [mockupImg, productImg] = await Promise.all([
      fetchImg(mockup_url),
      fetchImg(producto.imagen_url),
    ]);

    // 2. Calcular precios por TRAMO de volumen (precio_b2b_tramos).
    const cantidad = Math.max(1, parseInt(qty, 10) || 1);
    const precioUnit = pickEscalonado(producto, cantidad);
    if (!precioUnit) {
      // Producto sin tramos B2B cargados → NO cotizable (no inventamos precio).
      return Response.json({
        error: `El producto ${sku} no tiene precios por volumen cargados. Contáctanos para cotizar este producto.`,
        no_b2b_tramos: true,
      }, { status: 422 });
    }
    const subtotal = precioUnit * cantidad;

    // Personalización: GRATIS desde 10u (política PEYU), serigrafía siempre fee.
    const requierePersonal = personalizacion && personalizacion !== 'Sin personalización';
    const feePersonal = (requierePersonal && cantidad < 10) ? 25000 : 0;

    const total = subtotal + feePersonal;
    const leadTime = requierePersonal ? 12 : 6;

    const hoy = new Date();
    const vence = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);
    const fechaEnvioStr = hoy.toISOString().slice(0, 10);
    const fechaVenceStr = vence.toISOString().slice(0, 10);

    // 2.5 · Si viene del WhatsApp (source='whatsapp'), crear/actualizar B2BLead
    //      para que el founder vea el lead en /admin/pipeline.
    let leadId = null;
    if (source === 'whatsapp' && empresa && contacto) {
      const nowIso = hoy.toISOString();
      const leadScore = Math.min(100, 50 + (empresa ? 20 : 0) + (cantidad >= 10 ? 20 : 0) + (requierePersonal ? 10 : 0));
      try {
        const existing = await base44.asServiceRole.entities.B2BLead.filter({ email: email || empresa }, '-created_date', 3);
        if (existing && existing.length > 0) {
          const prev = existing[0];
          const prevHist = Array.isArray(prev.historial) ? prev.historial : [];
          const updated = await base44.asServiceRole.entities.B2BLead.update(prev.id, {
            contact_name: contacto,
            company_name: empresa,
            phone: telefono || prev.phone,
            product_interest: sku,
            qty_estimate: cantidad,
            delivery_date: fecha_requerida || prev.delivery_date,
            personalization_needs: requierePersonal,
            status: 'Propuesta enviada',
            urgency: cantidad >= 100 ? 'Alta' : 'Normal',
            notes: `Lead B2B desde WhatsApp. ${cantidad}u de ${sku}. ${fecha_requerida ? `Fecha req: ${fecha_requerida}.` : ''}`,
            historial: [...prevHist, {
              at: nowIso, type: 'proposal_sent', actor: 'agente_whatsapp',
              channel: 'whatsapp', detail: `Cotización ${''} enviada al email ${email || 'N/D'}`,
            }],
          });
          leadId = updated?.id || prev.id;
        } else {
          const created = await base44.asServiceRole.entities.B2BLead.create({
            source: 'WhatsApp',
            contact_name: contacto,
            company_name: empresa,
            email: email || '',
            phone: telefono || '',
            product_interest: sku,
            qty_estimate: cantidad,
            delivery_date: fecha_requerida || '',
            personalization_needs: requierePersonal,
            lead_score: leadScore,
            status: 'Propuesta enviada',
            urgency: cantidad >= 100 ? 'Alta' : 'Normal',
            notes: `Lead B2B desde WhatsApp. ${cantidad}u de ${sku}. ${fecha_requerida ? `Fecha req: ${fecha_requerida}.` : ''}`,
            historial: [{
              at: nowIso, type: 'created', actor: 'agente_whatsapp',
              channel: 'whatsapp', detail: `Lead capturado desde WhatsApp: ${empresa} quiere ${cantidad}u de ${sku}`,
            }, {
              at: nowIso, type: 'proposal_sent', actor: 'agente_whatsapp',
              channel: 'whatsapp', detail: `Cotización enviada al email ${email || 'N/D'}`,
            }],
          });
          leadId = created?.id;
        }
      } catch (e) {
        console.error('Error creando B2BLead desde WhatsApp:', e?.message || e);
      }
    }

    // 3. Crear registro Cotización (estado Borrador, viene del chat)
    const numero = genCotNumero();
    const cot = await base44.asServiceRole.entities.Cotizacion.create({
      numero,
      empresa: empresa || contacto || 'Cliente Chat',
      contacto: contacto || '',
      email: email || '',
      sku,
      cantidad,
      precio_unitario: precioUnit,
      descuento_pct: 0,
      fee_personalizacion: feePersonal,
      fee_packaging: 0,
      total,
      personalizacion_tipo: requierePersonal ? personalizacion : 'Sin personalización',
      packaging: 'Estándar (stock)',
      lead_time_dias: leadTime,
      estado: 'Borrador',
      fecha_envio: fechaEnvioStr,
      fecha_vencimiento: fechaVenceStr,
      mockup_url: mockup_url || '',
      notas: [
        `Cotización generada desde el chat Peyu 🐢`,
        telefono ? `Teléfono: ${telefono}` : null,
        logo_url ? `Logo/arte del cliente: ${logo_url}` : null,
        fecha_requerida ? `Fecha requerida: ${fecha_requerida}` : null,
        conversation_id ? `Conversación: ${conversation_id}` : null,
      ].filter(Boolean).join(' · '),
    });

    // 4. Generar PDF — PROPUESTA PEYU 2026 · viaje de marca + económico.
    const INK = [44, 24, 16], FOREST = [11, 70, 52], TEAL = [15, 139, 108], LEAF = [52, 168, 128],
          MINT = [235, 248, 244], SAND = [250, 246, 238], STONE = [100, 110, 104],
          STONE2 = [140, 150, 145], CREAM = [170, 220, 205], WHITE = [255, 255, 255];
    const PMX = 16;
    const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');
    // safeTxt: WinAnsi soporta tildes y ñ — solo limpiamos glifos no imprimibles
    // (emojis, comillas curvas, guiones largos) preservando acentos correctos.
    const safeTxt = (s) => {
      if (s === undefined || s === null) return '';
      return String(s)
        .replace(/[✓✔☑]/g, '>').replace(/[✗✘❌]/g, 'x').replace(/[♻🐢🌱💚]/g, '')
        .replace(/[–—]/g, '-').replace(/[""«»]/g, '"').replace(/['']/g, "'")
        .replace(/…/g, '...').replace(/[•]/g, '-')
        .replace(/[\u0000-\u001F\u007F]/g, '').replace(/[^\x20-\xFF]/g, '');
    };

    // ── Condiciones de pago reales (Joaquín):
    //   • Con retiro: 50% adelanto, 50% contra entrega.
    //   • Con despacho: abono 100%.
    //   • Segunda compra del cliente: hasta 30 días.
    const formaPagoRetiro = 'Retiro en tienda: 50% al confirmar, 50% contra entrega.';
    const formaPagoDespacho = 'Despacho a domicilio: abono del 100% al confirmar.';

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = 210, ph = 297, RX = pw - PMX, CW = pw - PMX * 2;
    let y = 0;
    const T = (txt, x, yy, { size = 9, font = 'normal', color = INK, align = 'left', spacing = 0 } = {}) => {
      doc.setFont('helvetica', font); doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      if (spacing) doc.setCharSpace(spacing);
      doc.text(safeTxt(txt), x, yy, { align });
      if (spacing) doc.setCharSpace(0);
    };

    // ── Logo oficial PEYU (tortuga + PEYU tinta) sobre chip arena claro ──
    const PEYU_LOGO_URL = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/cead5fbd1_image.png';
    let peyuLogoB64 = null;
    try {
      const lr = await fetch(PEYU_LOGO_URL);
      if (lr.ok) {
        const lbuf = new Uint8Array(await lr.arrayBuffer());
        let lbin = '';
        for (let i = 0; i < lbuf.length; i += 0x8000) lbin += String.fromCharCode.apply(null, lbuf.subarray(i, i + 0x8000));
        peyuLogoB64 = btoa(lbin);
      }
    } catch { /* sin logo → fallback texto */ }

    // ═══ HERO ═══
    const heroH = 60;
    doc.setFillColor(...FOREST); doc.rect(0, 0, pw, heroH, 'F');
    doc.setFillColor(...TEAL); doc.circle(pw - 4, 6, 28, 'F');
    doc.setFillColor(...LEAF); doc.circle(pw + 8, heroH - 2, 20, 'F');
    doc.setFillColor(...CREAM); doc.rect(0, heroH, pw, 2, 'F');

    // Logo PEYU completo sobre chip arena vertical (logo vertical: tortuga + PEYU)
    const lgW = 22, lgH = 30, lgX = PMX, lgY = 6;
    if (peyuLogoB64) {
      try {
        doc.setFillColor(...SAND);
        doc.roundedRect(lgX, lgY, lgW, lgH, 3, 3, 'F');
        doc.addImage(`data:image/png;base64,${peyuLogoB64}`, 'PNG', lgX + 1.5, lgY + 1.5, lgW - 3, lgH - 3);
      } catch { T('PEYU', PMX, 20, { size: 22, font: 'bold', color: WHITE }); }
    } else {
      T('PEYU', PMX, 20, { size: 22, font: 'bold', color: WHITE });
    }
    T('Plástico que renace · 100% reciclado · Hecho en Chile', PMX, 28, { size: 8, color: CREAM });
    T('PROPUESTA N°', RX, 15, { size: 7, font: 'bold', color: CREAM, align: 'right', spacing: 1 });
    T(numero, RX, 23, { size: 14, font: 'bold', color: WHITE, align: 'right' });

    T('Propuesta Comercial', PMX, 44, { size: 20, font: 'bold', color: WHITE });
    T(`Preparada para ${(empresa || contacto || 'Cliente').substring(0, 38)}`, PMX, 52, { size: 10, color: [210, 228, 220] });
    T(`Emisión  ${hoy.toLocaleDateString('es-CL')}`, RX, 44, { size: 8, color: [210, 228, 220], align: 'right' });
    T(`Válida hasta  ${vence.toLocaleDateString('es-CL')}`, RX, 50, { size: 8, color: [210, 228, 220], align: 'right' });

    y = heroH + 9;

    // ═══ RELATO DE MARCA (el viaje eco) ═══
    const relatoH = 22;
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, relatoH, 3, 3, 'F');
    doc.setFillColor(...LEAF); doc.roundedRect(PMX, y, 2.5, relatoH, 1, 1, 'F');
    T('TU REGALO TIENE UNA HISTORIA', PMX + 8, y + 7, { size: 7, font: 'bold', color: TEAL, spacing: 0.8 });
    T('Cada producto PEYU nace de tapitas plásticas que rescatamos del mar y de la calle. Las', PMX + 8, y + 12.5, { size: 8, color: STONE });
    T('fundimos, moldeamos y grabamos tu logo con láser: un objeto útil que cuenta que tu marca elige', PMX + 8, y + 16.5, { size: 8, color: STONE });
    T('cuidar el planeta. No regalas un objeto, regalas un gesto.', PMX + 8, y + 20.5, { size: 8, color: STONE });
    y += relatoH + 8;

    // ═══ CARD CLIENTE + TOTAL ═══
    const cardH = 38;
    doc.setFillColor(...SAND); doc.roundedRect(PMX, y, CW, cardH, 4, 4, 'F');
    doc.setFillColor(...TEAL); doc.roundedRect(PMX, y, 2.5, cardH, 1, 1, 'F');
    const cpx = PMX + 8;
    T('CLIENTE', cpx, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    T((empresa || contacto || 'Cliente').substring(0, 36), cpx, y + 15.5, { size: 13, font: 'bold', color: INK });
    let fY = y + 21.5;
    if (contacto && empresa) { T(contacto.substring(0, 46), cpx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
    if (email) { T(email.substring(0, 46), cpx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
    if (telefono) T(telefono.substring(0, 40), cpx, fY, { size: 8, color: STONE });

    T('INVERSIÓN TOTAL', RX - 8, y + 8, { size: 7, font: 'bold', color: TEAL, align: 'right', spacing: 1 });
    T(fmtCLP(total), RX - 8, y + 20, { size: 20, font: 'bold', color: FOREST, align: 'right' });
    T('CLP · IVA incluido', RX - 8, y + 26, { size: 7.5, color: STONE, align: 'right' });
    y += cardH + 7;

    // ═══ STRIP MÉTRICAS ═══
    const mH = 17;
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, mH, 3, 3, 'F');
    const metr = [
      ['CANTIDAD', `${cantidad} u`],
      ['LEAD TIME', `${leadTime} días`],
      ['PERSONALIZACIÓN', requierePersonal ? personalizacion : 'No'],
      ['VALIDEZ', '15 días'],
    ];
    const mCol = CW / 4;
    metr.forEach((m, i) => {
      const mx = PMX + i * mCol + mCol / 2;
      T(m[0], mx, y + 6.5, { size: 6, font: 'bold', color: STONE2, align: 'center', spacing: 0.4 });
      T(String(m[1]).substring(0, 16), mx, y + 13, { size: 9.5, font: 'bold', color: FOREST, align: 'center' });
      if (i > 0) { doc.setDrawColor(...CREAM); doc.setLineWidth(0.3); doc.line(PMX + i * mCol, y + 4, PMX + i * mCol, y + mH - 4); }
    });
    y += mH + 9;

    // ═══ TABLA ═══
    T('DETALLE ECONÓMICO', PMX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    y += 5;
    const COL_PROD = PMX + 4, COL_PERS = PMX + 90, COL_CANT = PMX + 124, COL_UNIT = PMX + 150, COL_TOT = RX - 4;
    doc.setFillColor(...INK); doc.roundedRect(PMX, y, CW, 9, 2, 2, 'F');
    T('PRODUCTO', COL_PROD, y + 6, { size: 7, font: 'bold', color: WHITE, spacing: 0.4 });
    T('PERSONALIZ.', COL_PERS, y + 6, { size: 6.5, font: 'bold', color: WHITE });
    T('CANT.', COL_CANT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'center' });
    T('P. UNIT.', COL_UNIT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'right' });
    T('TOTAL', COL_TOT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'right' });
    y += 12;

    // Fila producto
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y - 4, CW, 11, 1.5, 1.5, 'F');
    T((producto.nombre || sku).substring(0, 38), COL_PROD, y + 1, { size: 9, font: 'bold', color: INK });
    T(sku, COL_PROD, y + 4.5, { size: 6.5, color: STONE2 });
    T(requierePersonal ? personalizacion : '-', COL_PERS, y + 1, { size: 7.5, color: STONE });
    T(`${cantidad}`, COL_CANT, y + 1, { size: 9, font: 'bold', color: STONE, align: 'center' });
    T(fmtCLP(precioUnit), COL_UNIT, y + 1, { size: 9, color: INK, align: 'right' });
    T(fmtCLP(subtotal), COL_TOT, y + 1, { size: 9, font: 'bold', color: FOREST, align: 'right' });
    y += 11;

    if (feePersonal > 0) {
      doc.setFillColor(...WHITE); doc.roundedRect(PMX, y - 4, CW, 10, 1.5, 1.5, 'F');
      T('Fee personalización (<10u)', COL_PROD, y + 1.5, { size: 9, color: INK });
      T(fmtCLP(feePersonal), COL_TOT, y + 1.5, { size: 9, font: 'bold', color: FOREST, align: 'right' });
      y += 10;
    }

    // ═══ TOTALES (sin solapamiento: línea ancha + label arriba, monto debajo) ═══
    y += 5;
    const TBX = pw - 86; // inicio del bloque de totales
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.9); doc.line(TBX, y, RX, y);
    y += 8;
    T('TOTAL (IVA INCLUIDO)', TBX, y, { size: 10.5, font: 'bold', color: FOREST });
    T(fmtCLP(total), RX, y, { size: 14, font: 'bold', color: FOREST, align: 'right' });
    y += 7;
    if (cantidad >= 10 && requierePersonal) {
      T('> Grabado láser UV de tu logo INCLUIDO GRATIS desde 10 unidades', PMX, y, { size: 7.5, font: 'bold', color: TEAL });
      y += 6;
    }

    // ═══ VISTA PREVIA DEL GRABADO (mockup con la imagen/frase/logo del cliente) ═══
    if (mockupImg || productImg) {
      const imgBoxH = 64;
      if (y + imgBoxH + 12 > ph - 40) { doc.addPage(); y = 20; }
      y += 3;
      T(mockupImg ? 'ASÍ SE VERÁ TU GRABADO' : 'PRODUCTO COTIZADO', PMX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
      y += 4;
      const dual = mockupImg && productImg;
      const boxW = dual ? (CW - 6) / 2 : CW * 0.55;
      const drawImgBox = (img, x, label) => {
        doc.setFillColor(...SAND); doc.roundedRect(x, y, boxW, imgBoxH, 3, 3, 'F');
        try { doc.addImage(img.data, img.fmt, x + 2, y + 2, boxW - 4, imgBoxH - 10); } catch { /* imagen inválida */ }
        T(label, x + boxW / 2, y + imgBoxH - 3.5, { size: 6.5, color: STONE, align: 'center' });
      };
      if (dual) {
        drawImgBox(mockupImg, PMX, 'Mockup referencial · láser UV simulado');
        drawImgBox(productImg, PMX + boxW + 6, 'Producto original');
      } else {
        drawImgBox(mockupImg || productImg, PMX, mockupImg ? 'Mockup referencial · láser UV simulado' : 'Foto referencial del producto');
      }
      if (mockupImg) {
        T('El equipo revisa tu archivo antes de producir para que el grabado quede perfecto.', PMX, y + imgBoxH + 4.5, { size: 7, color: STONE });
        y += imgBoxH + 10;
      } else {
        y += imgBoxH + 8;
      }
    }

    // ═══ CONDICIONES COMERCIALES (datos reales Joaquín) ═══
    y += 3;
    const conds = [
      formaPagoRetiro,
      formaPagoDespacho,
      'Segunda compra del cliente: opción de pago a 30 días.',
      `Lead time estimado: ${leadTime} días hábiles ${requierePersonal ? 'con' : 'sin'} personalización.`,
      `Validez de la propuesta: 15 días corridos (hasta ${vence.toLocaleDateString('es-CL')}).`,
      'Personalización láser UV incluida desde 10 unidades (logo en AI/PDF vectorial).',
      'Despacho a coordinar vía BlueExpress/Starken a todo Chile.',
      'Material 100% plástico reciclado post-consumo. Certificación a solicitud.',
    ];
    const condH = 14 + conds.length * 5.3;
    if (y + condH > ph - 40) { doc.addPage(); y = 20; }
    doc.setFillColor(...SAND); doc.roundedRect(PMX, y, CW, condH, 3, 3, 'F');
    T('CONDICIONES COMERCIALES', PMX + 8, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    conds.forEach((c, i) => {
      const cy = y + 15 + i * 5.3;
      T('>', PMX + 8, cy, { size: 8, font: 'bold', color: TEAL });
      T(c, PMX + 12.5, cy, { size: 7.8, color: STONE });
    });
    y += condH + 7;

    // ═══ IMPACTO AMBIENTAL + CTA APROBAR ═══
    if (y + 30 > ph - 40) { doc.addPage(); y = 20; }
    // Impacto
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, 15, 3, 3, 'F');
    const kgRescatados = Math.round(cantidad * 0.05 * 10) / 10;
    const tapitas = Math.round(cantidad * 18);
    T('EL IMPACTO DE ESTA ORDEN', PMX + 8, y + 6, { size: 6.5, font: 'bold', color: TEAL, spacing: 0.8 });
    T(`Rescata ~${tapitas.toLocaleString('es-CL')} tapitas (~${kgRescatados}kg de plástico) y ahorra ${(cantidad * 12.5).toLocaleString('es-CL')}L de agua vs producción virgen.`, PMX + 8, y + 11.5, { size: 8, color: STONE });
    y += 15 + 7;

    // CTA Aprobar propuesta — link a la página pública que dispara el embudo.
    const aprobarLink = `https://peyuchile.cl/aprobar-propuesta?cot=${cot.id}`;
    const btnW = 110, btnH = 13, btnX = PMX, btnY = y;
    doc.setFillColor(...TEAL); doc.roundedRect(btnX, btnY, btnW, btnH, 6.5, 6.5, 'F');
    T('APROBAR PROPUESTA  >', btnX + btnW / 2, btnY + 8.5, { size: 10, font: 'bold', color: WHITE, align: 'center' });
    doc.link(btnX, btnY, btnW, btnH, { url: aprobarLink });
    T('Responde a ventas@peyuchile.cl', RX, btnY + 5, { size: 7.5, color: STONE, align: 'right' });
    T('o WhatsApp +56 9 3504 0242', RX, btnY + 10, { size: 7.5, font: 'bold', color: TEAL, align: 'right' });
    y += btnH + 8;

    // ═══ FOOTER (todas las páginas) · datos legales reales ═══
    const pages = doc.getNumberOfPages();
    for (let pg = 1; pg <= pages; pg++) {
      doc.setPage(pg);
      const fy = ph - 22;
      doc.setFillColor(...INK); doc.rect(0, fy, pw, 22, 'F');
      doc.setFillColor(...TEAL); doc.rect(0, fy, pw, 1.5, 'F');
      T('PEYU Chile SpA · RUT 77.069.974-6', PMX, fy + 7.5, { size: 9, font: 'bold', color: WHITE });
      T('Pedro de Valdivia 6603, Macul · F. Bilbao 3775, Providencia', PMX, fy + 12.5, { size: 6.5, color: CREAM });
      T('Plástico que renace · Hecho en Chile', PMX, fy + 17, { size: 6.5, color: [180, 200, 195] });
      T('peyuchile.cl · ventas@peyuchile.cl', RX, fy + 7.5, { size: 8, font: 'bold', color: WHITE, align: 'right' });
      T('WhatsApp +56 9 3504 0242', RX, fy + 12.5, { size: 7.5, font: 'bold', color: CREAM, align: 'right' });
    }

    // Devolver PDF como base64 (chunked: evita stack overflow en PDFs grandes)
    const pdfU8 = new Uint8Array(doc.output('arraybuffer'));
    let pdfBin = '';
    for (let i = 0; i < pdfU8.length; i += 0x8000) {
      pdfBin += String.fromCharCode.apply(null, pdfU8.subarray(i, i + 0x8000));
    }
    const base64 = btoa(pdfBin);

    // 📎 Subir el PDF a storage → link público compartible por WhatsApp.
    // Sin esto el agente solo tenía base64 y NO podía pasarle el PDF al cliente.
    let pdfUrl = '';
    try {
      const file = new File([pdfU8], `Cotizacion-Peyu-${numero}.pdf`, { type: 'application/pdf' });
      const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      pdfUrl = up?.file_url || '';
      if (pdfUrl) {
        await base44.asServiceRole.entities.Cotizacion.update(cot.id, {
          notas: `${cot.notas || ''} · PDF: ${pdfUrl}`,
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error subiendo PDF a storage:', e?.message || e);
    }

    // 💌 Email HTML "estable" (tablas + estilos inline, compatible Gmail/Outlook
    // móvil) con viaje de marca, mockup del cliente y doble CTA de aprobación.
    const waAprobarUrl = `https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, apruebo la propuesta ${numero}. Quiero avanzar 🐢`)}`;
    const tapitasEmail = Math.round(cantidad * 18);
    const emailHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:24px 0">
        <tr><td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
            <tr><td style="background:#0B4634;padding:28px 28px 22px;border-radius:16px 16px 0 0">
              <p style="color:#fff;margin:0;font-size:24px;font-weight:800">PEYU 🐢</p>
              <p style="color:#AADCCD;margin:6px 0 0;font-size:13px">Plástico que renace · 100% reciclado · Hecho en Chile</p>
              <p style="color:#fff;margin:18px 0 0;font-size:19px;font-weight:700">Tu propuesta ${numero} está lista${contacto ? `, ${contacto}` : ''} ✨</p>
            </td></tr>
            <tr><td style="background:#ffffff;padding:26px 28px;border:1px solid #E5DED2;border-top:0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;background:#FAF6EE;border-radius:12px;padding:4px">
                <tr><td style="padding:10px 14px;color:#646E68">Producto</td><td style="padding:10px 14px;text-align:right;font-weight:700">${producto.nombre}</td></tr>
                <tr><td style="padding:10px 14px;color:#646E68">Cantidad</td><td style="padding:10px 14px;text-align:right;font-weight:700">${cantidad} unidades</td></tr>
                <tr><td style="padding:10px 14px;color:#646E68">Precio unitario</td><td style="padding:10px 14px;text-align:right;font-weight:700">$${precioUnit.toLocaleString('es-CL')}</td></tr>
                <tr><td style="padding:12px 14px;color:#0B4634;font-weight:800;border-top:2px solid #0F8B6C">Total (IVA incl.)</td><td style="padding:12px 14px;text-align:right;font-weight:800;font-size:18px;color:#0F8B6C;border-top:2px solid #0F8B6C">$${total.toLocaleString('es-CL')}</td></tr>
              </table>
              ${mockup_url ? `<div style="text-align:center;margin:20px 0 6px"><img src="${mockup_url}" alt="Así se verá tu grabado" width="360" style="max-width:100%;border-radius:14px;border:1px solid #E5DED2"/><p style="font-size:12px;color:#8C9691;margin:8px 0 0">🎨 Así se verá tu grabado láser (mockup referencial — lo afinamos antes de producir)</p></div>` : ''}
              ${cantidad >= 10 && requierePersonal ? '<p style="background:#EBF8F4;border-radius:10px;padding:10px 14px;color:#0B6E55;font-weight:700;font-size:13px;margin:16px 0 0">✓ Grabado láser UV de tu logo INCLUIDO GRATIS (desde 10 unidades)</p>' : ''}
              <p style="font-size:13px;color:#646E68;line-height:1.6;margin:18px 0 0">Cada unidad rescata tapitas del mar y de la calle — esta orden recupera <strong>~${tapitasEmail.toLocaleString('es-CL')} tapitas</strong> 🌱 No regalas un objeto, regalas un gesto.</p>
              <div style="text-align:center;margin:24px 0 6px">
                <a href="${aprobarLink}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:800;font-size:15px">Aprobar propuesta →</a>
                <br/>
                <a href="${waAprobarUrl}" style="display:inline-block;margin-top:12px;color:#0B6E55;text-decoration:none;padding:11px 24px;border-radius:999px;font-weight:700;font-size:13px;border:2px solid #0F8B6C">💬 Aprobar o consultar por WhatsApp</a>
              </div>
              <p style="font-size:12px;color:#8C9691;text-align:center;margin:14px 0 0">Validez 15 días · Lead time ${leadTime} días hábiles · PDF con el detalle completo adjunto</p>
            </td></tr>
            <tr><td style="background:#121C18;padding:18px 28px;border-radius:0 0 16px 16px">
              <p style="color:#fff;font-size:12px;font-weight:700;margin:0">PEYUCHILE SpA · peyuchile.cl</p>
              <p style="color:#AADCCD;font-size:11px;margin:4px 0 0">ventas@peyuchile.cl · WhatsApp +56 9 3504 0242 · Pedro de Valdivia 6603, Macul</p>
            </td></tr>
          </table>
        </td></tr>
      </table>`;

    // 📧 Enviar al correo del cliente. PRIMERO Gmail API (conector activo,
    // ti@peyuchile.cl — Resend estaba fallando por dominio no verificado).
    // Fallback: Resend. Best-effort: si falla NO rompemos la respuesta.
    let emailEnviado = false;
    if (email && /\S+@\S+\.\S+/.test(email)) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const mime = buildMimeWithPdf({
          from: `${encodeHeader('PEYU Chile')} <ti@peyuchile.cl>`,
          to: email,
          subject: `Tu propuesta PEYU ${numero} · ${producto.nombre} x${cantidad}u`,
          html: emailHtml,
          pdfB64: base64,
          filename: `Cotizacion-Peyu-${numero}.pdf`,
        });
        const raw = btoa(unescape(encodeURIComponent(mime))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const gr = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw }),
        });
        emailEnviado = gr.ok;
        if (!gr.ok) console.error('Gmail cotización error:', (await gr.text()).slice(0, 400));
      } catch (e) {
        console.error('Error enviando cotización vía Gmail:', e?.message || e);
      }
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!emailEnviado && email && /\S+@\S+\.\S+/.test(email) && RESEND_API_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PEYU Chile <ventas@peyuchile.cl>',
            to: [email],
            subject: `Tu propuesta PEYU ${numero} · ${producto.nombre} x${cantidad}u`,
            html: emailHtml,
            attachments: [{ filename: `Cotizacion-Peyu-${numero}.pdf`, content: base64 }],
          }),
        });
        emailEnviado = r.ok;
        if (!r.ok) console.error('Resend cotización error:', await r.text());
      } catch (e) {
        console.error('Error enviando cotización por email:', e?.message || e);
      }
    }

    return Response.json({
      ok: true,
      cotizacion_id: cot.id,
      lead_id: leadId,
      numero,
      total,
      pdf_base64: base64,
      pdf_url: pdfUrl,
      filename: `Cotizacion-Peyu-${numero}.pdf`,
      email_enviado: emailEnviado,
      admin_url_pipeline: '/admin/pipeline',
      admin_url_cotizaciones: '/admin/cotizaciones',
      mockup_url: mockup_url || null,
      mensaje_cliente: `¡Listo${contacto ? `, *${contacto}*` : ''}! 🐢 Tu propuesta *${numero}* quedó lista:\n\n📦 *${producto.nombre}* × ${cantidad}u\n💰 Unitario $${(precioUnit || 0).toLocaleString('es-CL')} · *Total $${(total || 0).toLocaleString('es-CL')} CLP* (IVA incl.)${requierePersonal ? `\n🎨 Grabado láser: ${personalizacion}${cantidad >= 10 ? ' — *GRATIS* desde 10u ✅' : ` — fee $${feePersonal.toLocaleString('es-CL')}`}${mockup_url ? ' (mockup incluido en el PDF)' : ''}` : ''}\n🚚 Lead time: ${leadTime} días hábiles · Validez: 15 días${emailEnviado ? `\n📧 Copia enviada a ${email} ✅` : (email ? `\n📧 No pude enviarla al correo — el PDF de abajo es el oficial y el equipo te la reenviará` : '')}\n\n📄 Tu propuesta completa en PDF:\n${pdfUrl || '(PDF disponible vía el equipo PEYU)'}\n\n¿Avanzamos? Puedo resolver cualquier duda o ajustar cantidades aquí mismo 💚`,
      mensaje_founder: `📋 Lead: /admin/pipeline · 📄 Cotización ${numero}: /admin/cotizaciones · 📧 Email ${emailEnviado ? 'enviado ✅' : 'NO enviado ⚠️'}${pdfUrl ? ' · PDF hospedado ✅' : ''}`,
    });
  } catch (error) {
    console.error('generateChatQuotePDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});