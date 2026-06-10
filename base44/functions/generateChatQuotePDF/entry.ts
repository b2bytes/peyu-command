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
      notas: [
        `Cotización generada desde el chat Peyu 🐢`,
        telefono ? `Teléfono: ${telefono}` : null,
        fecha_requerida ? `Fecha requerida: ${fecha_requerida}` : null,
        conversation_id ? `Conversación: ${conversation_id}` : null,
      ].filter(Boolean).join(' · '),
    });

    // 4. Generar PDF — DISEÑO UNIFICADO PEYU 2026 (misma plantilla que
    // generateProposalPDF / exportCotizacionPDF / quickB2BQuoteV2).
    const INK = [18, 28, 24], FOREST = [11, 70, 52], TEAL = [15, 139, 108], LEAF = [52, 168, 128],
          MINT = [235, 248, 244], SAND = [250, 246, 238], STONE = [100, 110, 104],
          STONE2 = [140, 150, 145], CREAM = [170, 220, 205], WHITE = [255, 255, 255];
    const PMX = 16;
    const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');
    // safeTxt: datos del cliente/producto siempre perfectos (WinAnsi, sin glifos rotos)
    const safeTxt = (s) => {
      if (s === undefined || s === null) return '';
      return String(s)
        .replace(/[✓✔☑]/g, '>').replace(/[✗✘❌]/g, 'x').replace(/[♻]/g, '')
        .replace(/[–—]/g, '-').replace(/[""«»]/g, '"').replace(/['']/g, "'")
        .replace(/…/g, '...').replace(/[·•]/g, '-').replace(/°/g, 'o')
        .replace(/[\u0000-\u001F\u007F]/g, '').replace(/[^\x20-\xFF]/g, '');
    };

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

    // ═══ HERO ═══
    const heroH = 62;
    doc.setFillColor(...FOREST); doc.rect(0, 0, pw, heroH, 'F');
    doc.setFillColor(...TEAL); doc.circle(pw - 6, 8, 30, 'F');
    doc.setFillColor(...LEAF); doc.circle(pw + 6, heroH - 4, 22, 'F');
    doc.setFillColor(...CREAM); doc.rect(0, heroH, pw, 2, 'F');

    T('PEYU', PMX, 20, { size: 22, font: 'bold', color: WHITE });
    T('Plastico que renace - 100% reciclado - Hecho en Chile', PMX, 27, { size: 8, color: CREAM });
    T('COTIZACION N°', RX, 16, { size: 7, font: 'bold', color: CREAM, align: 'right', spacing: 1 });
    T(numero, RX, 24, { size: 14, font: 'bold', color: WHITE, align: 'right' });

    T('Cotizacion Comercial', PMX, 44, { size: 20, font: 'bold', color: WHITE });
    T(`Preparada para ${(empresa || contacto || 'Cliente').substring(0, 40)}`, PMX, 52, { size: 10, color: [210, 228, 220] });
    T(`Emision  ${hoy.toLocaleDateString('es-CL')}`, RX, 44, { size: 8, color: [210, 228, 220], align: 'right' });
    T(`Valida hasta  ${vence.toLocaleDateString('es-CL')}`, RX, 50, { size: 8, color: [210, 228, 220], align: 'right' });

    y = heroH + 10;

    // ═══ CARD CLIENTE + TOTAL ═══
    const cardH = 40;
    doc.setFillColor(...SAND); doc.roundedRect(PMX, y, CW, cardH, 4, 4, 'F');
    doc.setFillColor(...TEAL); doc.roundedRect(PMX, y, 2.5, cardH, 1, 1, 'F');
    const cpx = PMX + 8;
    T('CLIENTE', cpx, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    T((empresa || contacto || 'Cliente').substring(0, 40), cpx, y + 16, { size: 13, font: 'bold', color: INK });
    let fY = y + 22;
    if (contacto) { T(contacto.substring(0, 48), cpx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
    if (email) { T(email.substring(0, 48), cpx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
    if (telefono) T(telefono.substring(0, 40), cpx, fY, { size: 7.5, color: STONE });

    T('MONTO TOTAL', RX - 8, y + 8, { size: 7, font: 'bold', color: TEAL, align: 'right', spacing: 1 });
    T(fmtCLP(total), RX - 8, y + 20, { size: 19, font: 'bold', color: FOREST, align: 'right' });
    T('CLP (IVA incluido)', RX - 8, y + 26, { size: 7, color: STONE, align: 'right' });
    y += cardH + 6;

    // ═══ STRIP MÉTRICAS ═══
    const mH = 17;
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, mH, 3, 3, 'F');
    const metr = [
      ['CANTIDAD', `${cantidad} u`],
      ['LEAD TIME', `${leadTime} dias`],
      ['PERSONALIZACION', requierePersonal ? personalizacion : 'No'],
      ['VALIDEZ', '15 dias'],
    ];
    const mCol = CW / 4;
    metr.forEach((m, i) => {
      const mx = PMX + i * mCol + mCol / 2;
      T(m[0], mx, y + 6.5, { size: 6, font: 'bold', color: STONE2, align: 'center', spacing: 0.5 });
      T(String(m[1]).substring(0, 16), mx, y + 13, { size: 9.5, font: 'bold', color: FOREST, align: 'center' });
      if (i > 0) { doc.setDrawColor(...CREAM); doc.setLineWidth(0.3); doc.line(PMX + i * mCol, y + 4, PMX + i * mCol, y + mH - 4); }
    });
    y += mH + 10;

    // ═══ TABLA ═══
    T('DETALLE ECONOMICO', PMX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    y += 5;
    const COL_PROD = PMX + 4, COL_PERS = PMX + 92, COL_CANT = PMX + 128, COL_UNIT = PMX + 154, COL_TOT = RX - 4;
    doc.setFillColor(...INK); doc.roundedRect(PMX, y, CW, 9, 2, 2, 'F');
    T('PRODUCTO', COL_PROD, y + 6, { size: 7, font: 'bold', color: WHITE, spacing: 0.4 });
    T('PERSONALIZACION', COL_PERS, y + 6, { size: 6.5, font: 'bold', color: WHITE });
    T('CANT.', COL_CANT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'center' });
    T('P. UNIT.', COL_UNIT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'right' });
    T('TOTAL', COL_TOT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'right' });
    y += 12;

    // Fila producto
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y - 4, CW, 11, 1.5, 1.5, 'F');
    T((producto.nombre || sku).substring(0, 40), COL_PROD, y + 1, { size: 9, font: 'bold', color: INK });
    T(sku, COL_PROD, y + 4.5, { size: 6.5, color: STONE2 });
    T(requierePersonal ? personalizacion : '-', COL_PERS, y + 1, { size: 8, color: STONE });
    T(`${cantidad}`, COL_CANT, y + 1, { size: 9, font: 'bold', color: STONE, align: 'center' });
    T(fmtCLP(precioUnit), COL_UNIT, y + 1, { size: 9, color: INK, align: 'right' });
    T(fmtCLP(subtotal), COL_TOT, y + 1, { size: 9, font: 'bold', color: FOREST, align: 'right' });
    y += 11;

    if (feePersonal > 0) {
      doc.setFillColor(...WHITE); doc.roundedRect(PMX, y - 4, CW, 10, 1.5, 1.5, 'F');
      T('Fee Personalizacion (<10u)', COL_PROD, y + 1.5, { size: 9, color: INK });
      T(fmtCLP(feePersonal), COL_TOT, y + 1.5, { size: 9, font: 'bold', color: FOREST, align: 'right' });
      y += 10;
    }

    // ═══ TOTALES ═══
    y += 4;
    const TLX = pw - 78, TVX = RX;
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.8); doc.line(TLX, y, TVX, y);
    y += 7;
    T('TOTAL (IVA INCLUIDO)', TLX, y, { size: 12, font: 'bold', color: FOREST });
    T(fmtCLP(total), TVX, y, { size: 13, font: 'bold', color: FOREST, align: 'right' });
    y += 7;
    if (cantidad >= 10 && requierePersonal) {
      T('> Laser UV de tu logo incluido GRATIS desde 10 unidades', PMX, y, { size: 7.5, font: 'bold', color: TEAL });
      y += 6;
    }

    // ═══ CONDICIONES ═══
    y += 4;
    const conds = [
      'Forma de pago: 50% anticipo al confirmar - 50% contra entrega.',
      `Lead time estimado: ${leadTime} dias habiles ${requierePersonal ? 'con' : 'sin'} personalizacion.`,
      `Validez: 15 dias corridos (hasta ${vence.toLocaleDateString('es-CL')}).`,
      'Personalizacion laser UV incluida desde 10 unidades (logo AI/PDF vectorial).',
      'Despacho a coordinar. Envio gratis sobre $40.000 via Bluex/Starken.',
      'Material 100% plastico reciclado post-consumo. Certificacion disponible a solicitud.',
      'Cotizacion generada desde el chat Peyu. Para confirmar, responde a ventas@peyuchile.cl indicando el numero.',
    ];
    const condH = 14 + conds.length * 5.5;
    if (y + condH > ph - 26) { doc.addPage(); y = 20; }
    doc.setFillColor(...SAND); doc.roundedRect(PMX, y, CW, condH, 3, 3, 'F');
    T('CONDICIONES COMERCIALES', PMX + 8, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    conds.forEach((c, i) => {
      const cy = y + 15 + i * 5.5;
      T('>', PMX + 8, cy, { size: 8, font: 'bold', color: TEAL });
      T(c, PMX + 12.5, cy, { size: 8, color: STONE });
    });
    y += condH + 6;

    // ═══ IMPACTO AMBIENTAL ═══
    if (cantidad >= 50 && y + 16 < ph - 26) {
      doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, 14, 3, 3, 'F');
      const kgRescatados = Math.round(cantidad * 0.05 * 10) / 10;
      T('IMPACTO DE TU COMPRA', PMX + 8, y + 5.5, { size: 6.5, font: 'bold', color: TEAL, spacing: 0.8 });
      T(`Esta orden rescata ~${kgRescatados}kg de plastico y ahorra ${(cantidad * 12.5).toLocaleString('es-CL')}L de agua vs produccion virgen.`, PMX + 8, y + 10.5, { size: 8, color: STONE });
    }

    // ═══ FOOTER (todas las páginas) ═══
    const pages = doc.getNumberOfPages();
    for (let pg = 1; pg <= pages; pg++) {
      doc.setPage(pg);
      const fy = ph - 18;
      doc.setFillColor(...INK); doc.rect(0, fy, pw, 18, 'F');
      doc.setFillColor(...TEAL); doc.rect(0, fy, pw, 1.5, 'F');
      T('PEYU Chile SpA', PMX, fy + 8, { size: 9, font: 'bold', color: WHITE });
      T('Plastico que renace - Hecho en Chile', PMX, fy + 13, { size: 7, color: CREAM });
      T('peyuchile.cl', RX, fy + 8, { size: 7.5, color: [210, 228, 220], align: 'right' });
      T('+56 9 3504 0242 - ventas@peyuchile.cl', RX, fy + 13, { size: 7, color: [210, 228, 220], align: 'right' });
    }

    // Devolver PDF como base64 (chunked: evita stack overflow en PDFs grandes)
    const pdfU8 = new Uint8Array(doc.output('arraybuffer'));
    let pdfBin = '';
    for (let i = 0; i < pdfU8.length; i += 0x8000) {
      pdfBin += String.fromCharCode.apply(null, pdfU8.subarray(i, i + 0x8000));
    }
    const base64 = btoa(pdfBin);

    // 📧 Enviar la cotización al correo del cliente (si dejó email) vía Resend,
    // con el PDF adjunto. Best-effort: si falla el email NO rompemos la descarga.
    let emailEnviado = false;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (email && /\S+@\S+\.\S+/.test(email) && RESEND_API_KEY) {
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
            subject: `Tu cotización PEYU ${numero} · ${producto.nombre} x${cantidad}u`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
                <div style="background:#0F8B6C;padding:24px;border-radius:12px 12px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:22px">PEYU 🐢</h1>
                  <p style="color:#d7f0e8;margin:4px 0 0;font-size:13px">Productos con propósito · 100% plástico reciclado</p>
                </div>
                <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px">
                  <p>Hola${contacto ? ` ${contacto}` : ''} 👋</p>
                  <p>Te adjuntamos tu cotización <strong>${numero}</strong> generada desde el chat:</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
                    <tr><td style="padding:6px 0;color:#666">Producto</td><td style="padding:6px 0;text-align:right;font-weight:600">${producto.nombre}</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Cantidad</td><td style="padding:6px 0;text-align:right;font-weight:600">${cantidad} u.</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Precio unitario</td><td style="padding:6px 0;text-align:right;font-weight:600">$${precioUnit.toLocaleString('es-CL')}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;border-top:2px solid #0F8B6C">Total (IVA incl.)</td><td style="padding:6px 0;text-align:right;font-weight:800;color:#0F8B6C;border-top:2px solid #0F8B6C">$${total.toLocaleString('es-CL')}</td></tr>
                  </table>
                  ${cantidad >= 10 ? '<p style="color:#0F8B6C;font-weight:600;font-size:13px">✓ Personalización láser UV incluida GRATIS desde 10 unidades.</p>' : ''}
                  <p style="font-size:13px;color:#666">Validez: 15 días · Lead time estimado: ${leadTime} días hábiles. Para confirmar, responde este correo indicando el número de cotización.</p>
                  <a href="https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, quiero confirmar la cotización ${numero}`)}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;font-size:14px;margin-top:8px">Confirmar por WhatsApp</a>
                </div>
              </div>`,
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
      numero,
      total,
      pdf_base64: base64,
      filename: `Cotizacion-Peyu-${numero}.pdf`,
      email_enviado: emailEnviado,
    });
  } catch (error) {
    console.error('generateChatQuotePDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});