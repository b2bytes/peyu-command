import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ════════════════════════════════════════════════════════════════════════
// exportCotizacionPDF — Cotización con el DISEÑO UNIFICADO PEYU 2026.
// Misma plantilla profesional que generateProposalPDF, generateChatQuotePDF
// y quickB2BQuoteV2: paleta ECO, hero verde bosque, card de cliente, tabla
// oscura, totales justificados a la derecha y footer corporativo.
// safeTxt garantiza que los datos del cliente y producto se rendericen
// perfecto (WinAnsi: ñ/tildes OK, sin glifos rotos ni emojis corruptos).
// ════════════════════════════════════════════════════════════════════════

const INK = [44, 24, 16], FOREST = [11, 70, 52], TEAL = [15, 139, 108], LEAF = [52, 168, 128],
      MINT = [235, 248, 244], SAND = [250, 246, 238], ARENA = [231, 216, 198], TERRACOTA = [217, 107, 77],
      STONE = [100, 110, 104], STONE2 = [140, 150, 145], CREAM = [170, 220, 205], WHITE = [255, 255, 255];
const PMX = 16;
const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// jsPDF/Helvetica solo soporta WinAnsi. Limpia preservando ñ/tildes.
function safeTxt(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/[✓✔☑]/g, '>').replace(/[✗✘❌]/g, 'x').replace(/[♻]/g, '')
    .replace(/[–—]/g, '-').replace(/[""«»]/g, '"').replace(/['']/g, "'")
    .replace(/…/g, '...').replace(/[·•]/g, '-').replace(/°/g, 'o')
    .replace(/[\u0000-\u001F\u007F]/g, '').replace(/[^\x20-\xFF]/g, '');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { cotizacion_id } = body;

  const cotizaciones = await base44.entities.Cotizacion.filter({ id: cotizacion_id });
  if (!cotizaciones.length) return Response.json({ error: 'Cotización no encontrada' }, { status: 404 });
  const cot = cotizaciones[0];

  // Nombre REAL del producto desde el catálogo (cot.sku suele traer solo el
  // código). Así la tabla muestra "Pack 6 Cachos" en vez de "61411".
  let prodNombre = cot.sku || 'Producto personalizado';
  let prodSku = '';
  if (cot.sku) {
    try {
      const prods = await base44.asServiceRole.entities.Producto.filter({ sku: cot.sku }, '-updated_date', 1);
      if (prods?.length && prods[0].nombre) { prodNombre = prods[0].nombre; prodSku = cot.sku; }
    } catch { /* fallback al sku */ }
  }

  // ── Datos económicos (misma lógica de siempre) ──
  const precioUnitario = cot.precio_unitario || 0;
  const cantidad = cot.cantidad || 1;
  const descuento = cot.descuento_pct || 0;
  const precioConDesc = Math.round(precioUnitario * (1 - descuento / 100));
  const subtotalProd = precioConDesc * cantidad;
  const fees = [];
  if (cot.fee_personalizacion > 0) fees.push(['Fee Personalizacion', cot.fee_personalizacion]);
  if (cot.fee_packaging > 0) fees.push([`Packaging ${cot.packaging || ''}`, cot.fee_packaging]);
  if (cot.es_express) fees.push(['Recargo Express (+12%)', Math.round(subtotalProd * 0.12)]);
  const totalFinal = cot.total || (subtotalProd + fees.reduce((s, f) => s + f[1], 0));

  const numero = cot.numero || `COT-${cotizacion_id?.slice(-6)?.toUpperCase()}`;
  const fechaEnvio = cot.fecha_envio ? new Date(cot.fecha_envio + 'T12:00:00').toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL');
  const fechaVence = cot.fecha_vencimiento ? new Date(cot.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CL') : 'A convenir';
  const requierePersonal = cot.personalizacion_tipo && cot.personalizacion_tipo !== 'Sin personalización';

  // ── Logo oficial PEYU (tortuga + PEYU tinta) — Manual de Marca ──
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

  // Logo PEYU completo sobre chip arena (contraste sobre hero verde bosque)
  const lgS = 22, lgX = PMX, lgY = 8;
  if (peyuLogoB64) {
    try {
      doc.setFillColor(...SAND);
      doc.roundedRect(lgX, lgY, lgS, lgS, 3, 3, 'F');
      doc.addImage(`data:image/png;base64,${peyuLogoB64}`, 'PNG', lgX + 1.5, lgY + 1.5, lgS - 3, lgS - 3);
    } catch { T('PEYU', PMX, 20, { size: 22, font: 'bold', color: WHITE }); }
  } else {
    T('PEYU', PMX, 20, { size: 22, font: 'bold', color: WHITE });
  }
  T('Plastico que renace - 100% reciclado - Hecho en Chile', PMX, 27, { size: 8, color: CREAM });
  T('COTIZACION N°', RX, 16, { size: 7, font: 'bold', color: CREAM, align: 'right', spacing: 1 });
  T(numero, RX, 24, { size: 14, font: 'bold', color: WHITE, align: 'right' });

  T('Cotizacion Comercial', PMX, 44, { size: 20, font: 'bold', color: WHITE });
  T(`Preparada para ${(cot.empresa || 'Cliente').substring(0, 40)}`, PMX, 52, { size: 10, color: [210, 228, 220] });
  T(`Emision  ${fechaEnvio}`, RX, 44, { size: 8, color: [210, 228, 220], align: 'right' });
  T(`Valida hasta  ${fechaVence}`, RX, 50, { size: 8, color: [210, 228, 220], align: 'right' });

  y = heroH + 10;

  // ═══ CARD CLIENTE + TOTAL ═══
  const cardH = 40;
  doc.setFillColor(...SAND); doc.roundedRect(PMX, y, CW, cardH, 4, 4, 'F');
  doc.setFillColor(...TEAL); doc.roundedRect(PMX, y, 2.5, cardH, 1, 1, 'F');
  const cx = PMX + 8;
  T('CLIENTE', cx, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
  T((cot.empresa || 'Cliente').substring(0, 40), cx, y + 16, { size: 13, font: 'bold', color: INK });
  let fY = y + 22;
  if (cot.contacto) { T(cot.contacto.substring(0, 48), cx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
  if (cot.email) { T(cot.email.substring(0, 48), cx, fY, { size: 8.5, color: STONE }); }

  T('MONTO TOTAL', RX - 8, y + 8, { size: 7, font: 'bold', color: TEAL, align: 'right', spacing: 1 });
  T(fmtCLP(totalFinal), RX - 8, y + 20, { size: 19, font: 'bold', color: FOREST, align: 'right' });
  T('CLP (IVA incluido)', RX - 8, y + 26, { size: 7, color: STONE, align: 'right' });
  y += cardH + 6;

  // ═══ STRIP MÉTRICAS ═══
  const mH = 17;
  doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, mH, 3, 3, 'F');
  const metr = [
    ['CANTIDAD', `${cantidad} u`],
    ['LEAD TIME', `${cot.lead_time_dias || (requierePersonal ? 10 : 5)} dias`],
    ['PERSONALIZACION', requierePersonal ? cot.personalizacion_tipo : 'No'],
    ['VALIDEZ', fechaVence],
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

  const rows = [
    {
      nombre: prodNombre,
      meta: prodSku ? `SKU ${prodSku}` : '',
      pers: requierePersonal ? cot.personalizacion_tipo : '-',
      cant: `${cantidad}`,
      unit: fmtCLP(precioConDesc),
      total: fmtCLP(subtotalProd),
    },
    ...fees.map((f) => ({ nombre: f[0], meta: '', pers: '', cant: '', unit: '', total: fmtCLP(f[1]) })),
  ];
  rows.forEach((r, i) => {
    const rowH = r.meta ? 11 : 10;
    doc.setFillColor(...(i % 2 === 0 ? MINT : WHITE));
    doc.roundedRect(PMX, y - 4, CW, rowH, 1.5, 1.5, 'F');
    T(r.nombre.substring(0, 42), COL_PROD, y + 1.5, { size: 9, font: i === 0 ? 'bold' : 'normal', color: INK });
    if (r.meta) T(r.meta, COL_PROD, y + 5, { size: 6.5, color: STONE2 });
    if (r.pers) T(r.pers.substring(0, 20), COL_PERS, y + 1.5, { size: 8, color: STONE });
    if (r.cant) T(r.cant, COL_CANT, y + 1.5, { size: 9, font: 'bold', color: STONE, align: 'center' });
    if (r.unit) T(r.unit, COL_UNIT, y + 1.5, { size: 9, color: INK, align: 'right' });
    T(r.total, COL_TOT, y + 1.5, { size: 9, font: 'bold', color: FOREST, align: 'right' });
    y += rowH;
  });

  // ═══ TOTALES (justificados a la derecha) ═══
  y += 4;
  const TLX = pw - 78, TVX = RX;
  if (descuento > 0) {
    T(`Incluye descuento ${descuento}% sobre precio lista`, TLX, y, { size: 8, color: STONE });
    y += 6;
  }
  doc.setDrawColor(...TEAL); doc.setLineWidth(0.8); doc.line(TLX, y, TVX, y);
  y += 7;
  T('TOTAL (IVA INCLUIDO)', TLX, y, { size: 12, font: 'bold', color: FOREST });
  T(fmtCLP(totalFinal), TVX, y, { size: 13, font: 'bold', color: FOREST, align: 'right' });
  y += 10;

  // ═══ CONDICIONES ═══
  const conds = [
    'Forma de pago: 50% anticipo al confirmar - 50% contra entrega.',
    `Lead time: ${cot.lead_time_dias || (requierePersonal ? 10 : 5)} dias habiles ${requierePersonal ? 'con' : 'sin'} personalizacion.`,
    `Validez de cotizacion: ${fechaVence}.`,
    'Personalizacion laser UV incluida desde 10 unidades (logo en formato AI/PDF vectorial).',
    'Despacho a coordinar. El costo de envio no esta incluido salvo indicacion expresa.',
    'Material 100% plastico reciclado post-consumo. Certificacion disponible a solicitud.',
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

  // ═══ NOTAS ═══
  if (cot.notas) {
    const lines = doc.splitTextToSize(safeTxt(cot.notas), CW - 16);
    const notasH = 12 + lines.length * 4.5;
    if (y + notasH > ph - 26) { doc.addPage(); y = 20; }
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, notasH, 3, 3, 'F');
    T('NOTAS', PMX + 8, y + 7, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
    doc.setTextColor(STONE[0], STONE[1], STONE[2]);
    doc.text(lines, PMX + 8, y + 13);
    y += notasH + 4;
  }

  // ═══ FOOTER (todas las páginas) ═══
  const pages = doc.getNumberOfPages();
  for (let pg = 1; pg <= pages; pg++) {
    doc.setPage(pg);
    const fy = ph - 18;
    doc.setFillColor(...INK); doc.rect(0, fy, pw, 18, 'F');
    doc.setFillColor(...TEAL); doc.rect(0, fy, pw, 1.5, 'F');
    T('PEYU Chile SpA - RUT 77.069.974-6', PMX, fy + 7, { size: 9, font: 'bold', color: WHITE });
    T('Pedro de Valdivia 6603, Macul - F. Bilbao 3775, Providencia', PMX, fy + 12, { size: 6.5, color: CREAM });
    T('Plastico que renace - Hecho en Chile', PMX, fy + 16, { size: 6.5, color: [180, 200, 195] });
    T('peyuchile.cl - ventas@peyuchile.cl', RX, fy + 8, { size: 8, font: 'bold', color: WHITE, align: 'right' });
    T('WhatsApp +56 9 3504 0242', RX, fy + 13, { size: 7.5, font: 'bold', color: CREAM, align: 'right' });
  }

  const pdfBytes = doc.output('arraybuffer');
  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Cotizacion-Peyu-${(cot.numero || cotizacion_id?.slice(-6))}.pdf"`,
    },
  });
});