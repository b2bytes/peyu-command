import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ════════════════════════════════════════════════════════════════════════
// quickB2BQuoteV2 — Cotización rápida por volumen para clientes corporativos,
// desde la plataforma nueva (Shop v2). ADITIVO: crea (o actualiza) un B2BLead
// con los productos y cantidades solicitadas, calcula el precio por volumen
// usando precio_b2b_tramos del catálogo y devuelve el desglose para mostrar
// al cliente. Idempotente por email. Nunca borra nada. No toca B2C.
// ════════════════════════════════════════════════════════════════════════

const TRAMOS_B2B = [
  { min: 2000, key: 't2000_mas',  label: '2000+ u' },
  { min: 1000, key: 't1000_1999', label: '1000–1999 u' },
  { min: 500,  key: 't500_999',   label: '500–999 u' },
  { min: 250,  key: 't250_499',   label: '250–499 u' },
  { min: 100,  key: 't100_249',   label: '100–249 u' },
  { min: 50,   key: 't50_99',     label: '50–99 u' },
  { min: 10,   key: 't10_49',     label: '10–49 u' },
  { min: 1,    key: 'unitario',   label: '1–9 u' },
];

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

function unitBase(p) {
  return num(p?.precio_unitario_oficial_clp) ?? num(p?.precio_b2c) ?? 0;
}

// Precio unitario B2B para una cantidad (escala por volumen real del catálogo).
function priceForQty(producto, qty) {
  const tramos = producto?.precio_b2b_tramos;
  const base = (tramos && num(tramos.unitario)) || unitBase(producto);
  if (!tramos || typeof tramos !== 'object') {
    return { precio: base, label: '1–9 u', ahorroPct: 0 };
  }
  const idx = TRAMOS_B2B.findIndex((t) => qty >= t.min);
  if (idx < 0) return { precio: base, label: '1–9 u', ahorroPct: 0 };
  for (let i = idx; i < TRAMOS_B2B.length; i++) {
    const precio = num(tramos[TRAMOS_B2B[i].key]);
    if (precio) {
      const ahorroPct = base ? Math.round((1 - precio / base) * 100) : 0;
      return { precio, label: TRAMOS_B2B[i].label, ahorroPct };
    }
  }
  return { precio: base, label: '1–9 u', ahorroPct: 0 };
}

function scoreLead(company, qtyTotal) {
  let s = 50;
  if (company) s += 20;
  if (qtyTotal >= 100) s += 25;
  else if (qtyTotal >= 10) s += 15;
  return Math.min(s, 100);
}

function genQuoteNumero() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `COT-${y}${m}-${rand}`;
}

// ─── DISEÑO UNIFICADO PEYU PDF 2026 ──────────────────────────────────────
// Misma plantilla profesional que generateProposalPDF / exportCotizacionPDF:
// paleta ECO, hero verde bosque, card de cliente, tabla oscura, totales
// justificados y footer corporativo. safeTxt garantiza que los datos del
// cliente y producto se rendericen perfecto (WinAnsi, sin glifos rotos).
const INK = [44, 24, 16], FOREST = [11, 70, 52], TEAL = [15, 139, 108], LEAF = [52, 168, 128],
      MINT = [235, 248, 244], SAND = [250, 246, 238], ARENA = [231, 216, 198], TERRACOTA = [217, 107, 77],
      STONE = [100, 110, 104], STONE2 = [140, 150, 145], CREAM = [170, 220, 205], WHITE = [255, 255, 255];
const PMX = 16;
const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

function safeTxt(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/[✓✔☑]/g, '>').replace(/[✗✘❌]/g, 'x').replace(/[♻]/g, '')
    .replace(/[–—]/g, '-').replace(/[""«»]/g, '"').replace(/['']/g, "'")
    .replace(/…/g, '...').replace(/[·•]/g, '-').replace(/°/g, 'o')
    .replace(/[\u0000-\u001F\u007F]/g, '').replace(/[^\x20-\xFF]/g, '');
}

// base64 chunked: evita stack overflow con PDFs grandes.
function b64FromDoc(doc) {
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function buildQuotePDF({ numero, empresa, contacto, email, telefono, rut, lineas, totalNeto, iva, totalConIva, qtyTotal, deliveryDate, personalizacion, peyuLogoB64 }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = 210, ph = 297, RX = pw - PMX, CW = pw - PMX * 2;
  const hoy = new Date();
  const vence = new Date(hoy.getTime() + 15 * 86400000);
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
  T('Plastico que renace - 100% reciclado - Hecho en Chile', PMX, 27, { size: 8, color: CREAM });
  T('COTIZACION N°', RX, 16, { size: 7, font: 'bold', color: CREAM, align: 'right', spacing: 1 });
  T(numero, RX, 24, { size: 14, font: 'bold', color: WHITE, align: 'right' });

  T('Cotizacion por Volumen', PMX, 44, { size: 20, font: 'bold', color: WHITE });
  T(`Preparada para ${(empresa || contacto || 'Cliente').substring(0, 40)}`, PMX, 52, { size: 10, color: [210, 228, 220] });
  T(`Emision  ${hoy.toLocaleDateString('es-CL')}`, RX, 44, { size: 8, color: [210, 228, 220], align: 'right' });
  T(`Valida hasta  ${vence.toLocaleDateString('es-CL')}`, RX, 50, { size: 8, color: [210, 228, 220], align: 'right' });

  y = heroH + 10;

  // ═══ CARD CLIENTE + TOTAL ═══
  const cardH = 40;
  doc.setFillColor(...SAND); doc.roundedRect(PMX, y, CW, cardH, 4, 4, 'F');
  doc.setFillColor(...TEAL); doc.roundedRect(PMX, y, 2.5, cardH, 1, 1, 'F');
  const cx = PMX + 8;
  T('CLIENTE', cx, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
  T((empresa || contacto || 'Cliente').substring(0, 40), cx, y + 16, { size: 13, font: 'bold', color: INK });
  let fY = y + 22;
  if (contacto) { T(contacto.substring(0, 48), cx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
  if (email) { T(email.substring(0, 48), cx, fY, { size: 8.5, color: STONE }); fY += 4.5; }
  const extra = [rut ? `RUT ${rut}` : '', telefono || ''].filter(Boolean).join('  -  ');
  if (extra) T(extra.substring(0, 52), cx, fY, { size: 7.5, color: STONE });

  T('MONTO TOTAL', RX - 8, y + 8, { size: 7, font: 'bold', color: TEAL, align: 'right', spacing: 1 });
  T(fmtCLP(totalConIva), RX - 8, y + 20, { size: 19, font: 'bold', color: FOREST, align: 'right' });
  T('CLP (incluye IVA 19% - ver detalle)', RX - 8, y + 26, { size: 7, color: STONE, align: 'right' });
  y += cardH + 6;

  // ═══ STRIP MÉTRICAS ═══
  const mH = 17;
  doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, mH, 3, 3, 'F');
  const metr = [
    ['UNIDADES', `${qtyTotal}`],
    ['ITEMS', `${lineas.length}`],
    ['VALIDEZ', '15 dias'],
    ['ENTREGA', deliveryDate ? String(deliveryDate).substring(0, 12) : 'A convenir'],
  ];
  const mCol = CW / 4;
  metr.forEach((m, i) => {
    const mx = PMX + i * mCol + mCol / 2;
    T(m[0], mx, y + 6.5, { size: 6, font: 'bold', color: STONE2, align: 'center', spacing: 0.6 });
    T(m[1], mx, y + 13, { size: 10, font: 'bold', color: FOREST, align: 'center' });
    if (i > 0) { doc.setDrawColor(...CREAM); doc.setLineWidth(0.3); doc.line(PMX + i * mCol, y + 4, PMX + i * mCol, y + mH - 4); }
  });
  y += mH + 10;

  // ═══ TABLA DE ITEMS ═══
  T('DETALLE ECONOMICO', PMX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
  y += 5;
  const COL_PROD = PMX + 4, COL_TRAMO = PMX + 96, COL_CANT = PMX + 124, COL_UNIT = PMX + 152, COL_TOT = RX - 4;
  doc.setFillColor(...INK); doc.roundedRect(PMX, y, CW, 9, 2, 2, 'F');
  T('PRODUCTO', COL_PROD, y + 6, { size: 7, font: 'bold', color: WHITE, spacing: 0.4 });
  T('TRAMO', COL_TRAMO, y + 6, { size: 7, font: 'bold', color: WHITE });
  T('CANT.', COL_CANT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'center' });
  T('UNIT. (NETO)', COL_UNIT, y + 6, { size: 6.5, font: 'bold', color: WHITE, align: 'right' });
  T('TOTAL (NETO)', COL_TOT, y + 6, { size: 6.5, font: 'bold', color: WHITE, align: 'right' });
  y += 12;

  lineas.forEach((l, i) => {
    const rowH = 11;
    if (y - 4 + rowH > ph - 60) { doc.addPage(); y = 20; }
    doc.setFillColor(...(i % 2 === 0 ? MINT : WHITE));
    doc.roundedRect(PMX, y - 4, CW, rowH, 1.5, 1.5, 'F');
    T((l.nombre || l.sku).substring(0, 40), COL_PROD, y + 1, { size: 9, font: 'bold', color: INK });
    T(l.sku || '', COL_PROD, y + 4.5, { size: 6.5, color: STONE2 });
    T(l.tramo || '-', COL_TRAMO, y + 1, { size: 8, color: STONE });
    if (l.ahorro_pct > 0) T(`-${l.ahorro_pct}% volumen`, COL_TRAMO, y + 4.5, { size: 6.5, font: 'bold', color: TEAL });
    T(`${l.cantidad}`, COL_CANT, y + 1, { size: 9, font: 'bold', color: STONE, align: 'center' });
    T(fmtCLP(l.precio_unitario), COL_UNIT, y + 1, { size: 9, color: INK, align: 'right' });
    T(fmtCLP(l.subtotal), COL_TOT, y + 1, { size: 9, font: 'bold', color: FOREST, align: 'right' });
    y += rowH;
  });

  // ═══ TOTALES (justificados a la derecha) ═══
  y += 4;
  if (y > ph - 70) { doc.addPage(); y = 20; }
  const TLX = pw - 78, TVX = RX;
  const tRow = (label, val, { big = false, color = STONE, valColor = INK } = {}) => {
    T(label, TLX, y, { size: big ? 12 : 9, font: big ? 'bold' : 'normal', color });
    T(fmtCLP(val), TVX, y, { size: big ? 13 : 9.5, font: 'bold', color: valColor, align: 'right' });
    y += big ? 9 : 6;
  };
  tRow(`Neto (${qtyTotal} u)`, totalNeto, { color: FOREST, valColor: FOREST });
  tRow('+ IVA 19%', iva, { valColor: TEAL });
  doc.setDrawColor(...TEAL); doc.setLineWidth(0.8); doc.line(TLX, y, TVX, y);
  y += 7;
  tRow('TOTAL (CON IVA)', totalConIva, { big: true, color: FOREST, valColor: FOREST });
  if (personalizacion) {
    T('> Grabado laser UV de tu logo incluido GRATIS desde 10 unidades por producto', PMX, y, { size: 7.5, font: 'bold', color: TEAL });
    y += 6;
  }

  // ═══ CONDICIONES ═══
  y += 4;
  const conds = [
    'Forma de pago: 50% anticipo al confirmar - 50% contra entrega.',
    `Validez: 15 dias corridos (hasta ${vence.toLocaleDateString('es-CL')}).`,
    'Precios netos por volumen segun catalogo oficial PEYU. El IVA se detalla aparte.',
    'Personalizacion laser UV incluida desde 10 unidades por producto (logo AI/PDF vectorial).',
    'Despacho a coordinar via Bluex/Starken. Envio no incluido salvo indicacion expresa.',
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

  // ═══ IMPACTO AMBIENTAL ═══
  if (qtyTotal >= 50 && y + 16 < ph - 26) {
    doc.setFillColor(...MINT); doc.roundedRect(PMX, y, CW, 14, 3, 3, 'F');
    const kg = Math.round(qtyTotal * 0.05 * 10) / 10;
    T('IMPACTO DE TU PEDIDO', PMX + 8, y + 5.5, { size: 6.5, font: 'bold', color: TEAL, spacing: 0.8 });
    T(`Esta orden rescata ~${kg}kg de plastico y ahorra ${(qtyTotal * 12.5).toLocaleString('es-CL')}L de agua vs produccion virgen.`, PMX + 8, y + 10.5, { size: 8, color: STONE });
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

  return b64FromDoc(doc);
}

// ─── Email helpers (HTML inline, sin imports locales) ───────────────────
const clp = (n) => `$${Math.round(n || 0).toLocaleString('es-CL')}`;

// Filas de la tabla de productos para el email del cliente.
function lineasHTML(lineas) {
  return lineas.map((l, i) => `
    <tr style="background:${i % 2 ? '#FAF7F2' : '#ffffff'}">
      <td style="padding:10px 12px;font-size:13px;color:#2A2420">
        <strong>${l.cantidad}×</strong> ${l.nombre}
        <div style="font-size:11px;color:#A78B6F;margin-top:2px">${clp(l.precio_unitario)}/u · ${l.tramo}${l.ahorro_pct > 0 ? ` · −${l.ahorro_pct}%` : ''}</div>
      </td>
      <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:700;color:#2A2420;white-space:nowrap">${clp(l.subtotal)}</td>
    </tr>`).join('');
}

// Email al CLIENTE: relato cálido + desglose + impacto + CTA. Diseño PEYU.
function buildClientEmail({ numero, contacto, empresa, lineas, totalNeto, iva, totalConIva, qtyTotal, deliveryDate, personalizacion }) {
  const kg = Math.round(qtyTotal * 0.05 * 10) / 10;
  const litros = (qtyTotal * 12.5).toLocaleString('es-CL');
  const waMsg = encodeURIComponent(`Hola PEYU, quiero avanzar con la cotización ${numero}`);
  return `
  <div style="margin:0;padding:0;background:#F2ECE2">
    <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#2A2420">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0F8B6C,#0B6E55);padding:32px 28px;border-radius:0 0 24px 24px;text-align:center">
        <div style="font-size:32px;margin-bottom:6px">🐢</div>
        <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px">PEYU</h1>
        <p style="color:#d7f0e8;margin:6px 0 0;font-size:13px">Productos con propósito · 100% plástico reciclado</p>
      </div>

      <!-- Relato -->
      <div style="padding:32px 28px 8px">
        <p style="font-size:17px;line-height:1.5;margin:0 0 16px">Hola${contacto ? ` ${contacto}` : ''} 👋</p>
        <p style="font-size:15px;line-height:1.7;color:#4B4F54;margin:0 0 14px">
          Gracias por pensar en <strong style="color:#2A2420">PEYU</strong> para ${empresa ? `<strong style="color:#2A2420">${empresa}</strong>` : 'tu empresa'}.
          Cada producto que ves aquí <strong style="color:#0F8B6C">nació de plástico que estaba destinado al vertedero</strong> —
          tapitas, envases y residuos que rescatamos y transformamos en Santiago 🇨🇱.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4B4F54;margin:0 0 20px">
          Preparamos tu cotización por volumen <strong style="color:#2A2420">${numero}</strong>. Aquí está el detalle:
        </p>
      </div>

      <!-- Tabla productos -->
      <div style="padding:0 28px">
        <table style="width:100%;border-collapse:collapse;border:1px solid #EBE3D6;border-radius:16px;overflow:hidden">
          <thead>
            <tr style="background:#0F8B6C">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Producto</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Total</th>
            </tr>
          </thead>
          <tbody>${lineasHTML(lineas)}</tbody>
        </table>
      </div>

      <!-- Totales -->
      <div style="padding:16px 28px 8px">
        <table style="width:100%;font-size:14px">
          <tr><td style="padding:4px 0;color:#A78B6F">Neto (${qtyTotal} u)</td><td style="padding:4px 0;text-align:right;color:#4B4F54">${clp(totalNeto)}</td></tr>
          <tr><td style="padding:4px 0;color:#A78B6F">IVA (19%)</td><td style="padding:4px 0;text-align:right;color:#4B4F54">${clp(iva)}</td></tr>
          <tr><td style="padding:10px 0 0;font-size:16px;font-weight:800;color:#2A2420;border-top:2px solid #0F8B6C">Total</td><td style="padding:10px 0 0;text-align:right;font-size:18px;font-weight:800;color:#0F8B6C;border-top:2px solid #0F8B6C">${clp(totalConIva)}</td></tr>
        </table>
      </div>

      ${personalizacion ? `
      <div style="margin:16px 28px;padding:12px 16px;background:#FBE9E1;border-radius:12px;font-size:13px;color:#D96B4D">
        ✨ <strong>Grabado láser de tu logo incluido GRATIS</strong> desde 10 unidades por producto.
      </div>` : ''}

      <!-- Impacto: la historia que importa -->
      <div style="margin:20px 28px;padding:20px;background:#E7F4EF;border-radius:16px">
        <p style="font-size:13px;font-weight:700;color:#0F8B6C;margin:0 0 8px">🌱 El impacto de tu pedido</p>
        <p style="font-size:14px;line-height:1.6;color:#2A2420;margin:0">
          Esta orden rescata <strong>~${kg}kg de plástico</strong> y ahorra <strong>${litros}L de agua</strong>
          frente a fabricar lo mismo con material virgen. Tu marca, contando una historia real de economía circular.
        </p>
      </div>

      <!-- CTA -->
      <div style="padding:8px 28px 28px;text-align:center">
        <a href="https://wa.me/56935040242?text=${waMsg}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;font-size:15px">
          Avanzar por WhatsApp →
        </a>
        <p style="font-size:12px;color:#A78B6F;margin:16px 0 0;line-height:1.6">
          Adjuntamos tu cotización en PDF. Validez: 15 días.<br/>
          Un ejecutivo te contactará en 24h hábiles para afinar plazos y personalización${deliveryDate ? ` (fecha requerida: ${deliveryDate})` : ''}.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#2A2420;padding:20px 28px;border-radius:24px 24px 0 0;text-align:center">
        <p style="color:#fff;font-size:13px;font-weight:700;margin:0">PEYU Chile SPA</p>
        <p style="color:#A78B6F;font-size:11px;margin:6px 0 0">♻ Cada compra evita que el plástico llegue al vertedero</p>
        <p style="color:#A78B6F;font-size:11px;margin:4px 0 0">ventas@peyuchile.cl · +56 9 3504 0242 · peyuchile.cl</p>
      </div>
    </div>
  </div>`;
}

// Email al EQUIPO: alerta accionable con scoring, datos y desglose. HTML.
function buildTeamEmail({ numero, leadScore, urgency, empresa, contacto, email, telefono, rut, giro, lineas, totalConIva, qtyTotal, deliveryDate, personalizacion, esRecotizacion }) {
  const hot = leadScore >= 80;
  const accent = hot ? '#D96B4D' : '#0F8B6C';
  const waMsg = encodeURIComponent(`Hola ${contacto || ''}, soy del equipo PEYU. Vi tu cotización ${numero} y quiero ayudarte a avanzar.`);
  return `
  <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a">
    <div style="background:${accent};padding:20px 24px;border-radius:12px 12px 0 0">
      <p style="color:#fff;margin:0;font-size:12px;opacity:0.85;text-transform:uppercase;letter-spacing:1px">${esRecotizacion ? '🔄 Re-cotización' : '📥 Nueva cotización'} · Shop v2</p>
      <h1 style="color:#fff;margin:6px 0 0;font-size:20px">${empresa || 'Empresa sin nombre'}</h1>
      <p style="color:#fff;margin:4px 0 0;font-size:13px;opacity:0.9">Score ${leadScore}/100 · ${urgency} · ${numero}</p>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <table style="width:100%;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:5px 0;color:#888;width:120px">Contacto</td><td style="padding:5px 0;font-weight:600">${contacto || '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#888">Email</td><td style="padding:5px 0"><a href="mailto:${email}" style="color:${accent}">${email || '—'}</a></td></tr>
        <tr><td style="padding:5px 0;color:#888">Teléfono</td><td style="padding:5px 0">${telefono || '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#888">RUT</td><td style="padding:5px 0">${rut || '—'}</td></tr>
        ${giro ? `<tr><td style="padding:5px 0;color:#888">Giro</td><td style="padding:5px 0">${giro}</td></tr>` : ''}
        ${deliveryDate ? `<tr><td style="padding:5px 0;color:#888">Fecha req.</td><td style="padding:5px 0">${deliveryDate}</td></tr>` : ''}
        <tr><td style="padding:5px 0;color:#888">Personaliz.</td><td style="padding:5px 0">${personalizacion ? '✅ Sí (logo láser)' : 'No'}</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;font-size:13px">
        <tbody>${lineasHTML(lineas)}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;font-weight:800;color:${accent};margin:12px 0 0">${qtyTotal} u · ${clp(totalConIva)} <span style="font-size:11px;color:#888;font-weight:400">(IVA incl.)</span></p>

      <div style="margin-top:20px;text-align:center">
        <a href="https://wa.me/${(telefono || '').replace(/[^0-9]/g, '') || '56935040242'}?text=${waMsg}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-weight:700;font-size:14px">Contactar al cliente →</a>
      </div>
      <p style="font-size:11px;color:#aaa;text-align:center;margin:14px 0 0">PEYU Pipeline B2B · cotización generada desde /CotizacionRapida</p>
    </div>
  </div>`;
}

// ─── Gmail API fallback (multipart/mixed con PDF adjunto) ────────────────
// Resend exige dominio verificado; si falla, enviamos el correo al cliente
// vía Gmail (ti@peyuchile.cl), que ya está conectado y es estable.
function encHeader(str) {
  if (!str) return '';
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}
function toB64Url(bin) {
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sendQuoteViaGmail(base44, { to, subject, html, pdfBase64, filename }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const boundary = `peyu-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const plain = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const parts = [
    `From: ${encHeader('PEYU Chile')} <ti@peyuchile.cl>`,
    `To: ${to}`,
    'Reply-To: ventas@peyuchile.cl',
    `Subject: ${encHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html))).replace(/(.{76})/g, '$1\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: application/pdf',
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    pdfBase64.replace(/(.{76})/g, '$1\r\n'),
    '',
    `--${boundary}--`,
  ].join('\r\n');
  // El MIME mezcla texto ya UTF-8-safe y base64 ASCII: codificamos byte a byte.
  let raw = '';
  for (let i = 0; i < parts.length; i++) raw += parts.charCodeAt(i) <= 0xFF ? parts[i] : '?';
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toB64Url(raw) }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const contact_name = (body.contact_name || '').toString().slice(0, 200).trim();
    const company_name = (body.company_name || '').toString().slice(0, 200).trim();
    const email = (body.email || '').toString().slice(0, 200).trim();
    const phone = (body.phone || '').toString().slice(0, 60).trim() || undefined;
    const rut = (body.rut || '').toString().slice(0, 40).trim() || undefined;
    const giro = (body.giro || '').toString().slice(0, 200).trim() || undefined;
    const cargo = (body.cargo || '').toString().slice(0, 120).trim() || undefined;
    const direccion = (body.direccion || '').toString().slice(0, 300).trim() || undefined;
    const comuna = (body.comuna || '').toString().slice(0, 120).trim() || undefined;
    const delivery_date = (body.delivery_date || '').toString().slice(0, 60) || undefined;
    const urgency = ['Alta', 'Normal', 'Baja'].includes(body.urgency) ? body.urgency : 'Normal';
    const clientNotes = (body.notes || '').toString().slice(0, 1000).trim();
    const personalization_needs = !!body.personalization_needs;
    const logo_url = (body.logo_url || '').toString().slice(0, 500).trim() || undefined;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!contact_name || !company_name || !email) {
      return Response.json({ error: 'Faltan datos: nombre, empresa y email son obligatorios.' }, { status: 400 });
    }
    if (!items.length) {
      return Response.json({ error: 'Agrega al menos un producto a cotizar.' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // ─── Resolver precios reales por volumen desde el catálogo ───
    const lineas = [];
    let totalNeto = 0;
    let qtyTotal = 0;

    for (const it of items) {
      const sku = (it.sku || '').toString();
      const qty = Math.max(1, Math.floor(Number(it.qty) || 0));
      if (!sku || qty < 1) continue;

      let producto = null;
      try {
        const found = await svc.entities.Producto.filter({ sku }, '-updated_date', 1);
        producto = found && found[0];
      } catch { /* noop */ }
      if (!producto) continue;

      const { precio, label, ahorroPct } = priceForQty(producto, qty);
      const subtotal = precio * qty;
      totalNeto += subtotal;
      qtyTotal += qty;

      lineas.push({
        sku,
        nombre: producto.nombre,
        cantidad: qty,
        precio_unitario: precio,
        tramo: label,
        ahorro_pct: ahorroPct,
        subtotal,
      });
    }

    if (!lineas.length) {
      return Response.json({ error: 'No se encontraron productos válidos para cotizar.' }, { status: 400 });
    }

    const iva = Math.round(totalNeto * 0.19);
    const totalConIva = totalNeto + iva;
    const lead_score = scoreLead(company_name, qtyTotal);
    const nowIso = new Date().toISOString();

    const resumenItems = lineas
      .map((l) => `${l.cantidad}× ${l.nombre} @ $${l.precio_unitario.toLocaleString('es-CL')} (${l.tramo})`)
      .join(' · ');
    const datosNegocio = [
      giro && `Giro: ${giro}`,
      cargo && `Cargo: ${cargo}`,
      (direccion || comuna) && `Despacho: ${[direccion, comuna].filter(Boolean).join(', ')}`,
      clientNotes && `Nota del cliente: ${clientNotes}`,
    ].filter(Boolean).join('. ');
    const notes = `Cotización rápida por volumen desde plataforma nueva (Shop v2). ` +
      `${resumenItems}. Total neto: $${totalNeto.toLocaleString('es-CL')} (sin IVA). ` +
      `Fecha requerida: ${delivery_date || 'N/D'}. Urgencia: ${urgency}.` +
      (datosNegocio ? ` ${datosNegocio}.` : '');

    const histEntry = {
      at: nowIso,
      type: 'created',
      actor: contact_name || email,
      channel: 'web',
      detail: 'Cotización rápida por volumen (Shop v2)',
      meta: { lead_score, qty_total: qtyTotal, total_neto: totalNeto, total_con_iva: totalConIva, lineas },
    };

    // ─── IDEMPOTENCIA: B2BLead previo por email ───
    let existing = null;
    try {
      const found = await svc.entities.B2BLead.filter({ email }, '-created_date', 5);
      existing = (found || []).find((l) => (l.notes || '').includes('Shop v2')) || (found || [])[0] || null;
    } catch { /* noop */ }

    let leadId;
    const productInterest = lineas.map((l) => l.nombre).slice(0, 3).join(', ').slice(0, 200);

    if (existing) {
      const prevHist = Array.isArray(existing.historial) ? existing.historial : [];
      const updated = await svc.entities.B2BLead.update(existing.id, {
        contact_name,
        company_name,
        phone: phone ?? existing.phone,
        rut: rut ?? existing.rut,
        qty_estimate: qtyTotal,
        product_interest: productInterest || existing.product_interest,
        delivery_date: delivery_date ?? existing.delivery_date,
        personalization_needs,
        logo_url: logo_url ?? existing.logo_url,
        urgency,
        lead_score,
        notes,
        historial: [...prevHist, { ...histEntry, type: 'note', detail: 'Re-cotización rápida (Shop v2)' }],
      });
      leadId = updated?.id || existing.id;
    } else {
      const created = await svc.entities.B2BLead.create({
        source: 'Formulario Web',
        contact_name,
        company_name,
        email,
        phone,
        rut,
        qty_estimate: qtyTotal,
        product_interest: productInterest,
        delivery_date,
        personalization_needs,
        logo_url,
        lead_score,
        status: 'Nuevo',
        urgency,
        notes,
        historial: [histEntry],
      });
      leadId = created?.id;
    }

    // ─── Generar PDF de la cotización (multi-producto, estilo PEYU) ───
    const numero = genQuoteNumero();
    let pdfBase64 = null;
    let filename = `Cotizacion-Peyu-${numero}.pdf`;

    // Fetch logo oficial PEYU para el hero del PDF
    let peyuLogoB64 = null;
    try {
      const lr = await fetch('https://media.base44.com/images/public/69d99b9d61f699701129c103/cead5fbd1_image.png');
      if (lr.ok) {
        const lbuf = new Uint8Array(await lr.arrayBuffer());
        let lbin = '';
        for (let i = 0; i < lbuf.length; i += 0x8000) lbin += String.fromCharCode.apply(null, lbuf.subarray(i, i + 0x8000));
        peyuLogoB64 = btoa(lbin);
      }
    } catch { /* sin logo → fallback texto */ }

    try {
      pdfBase64 = buildQuotePDF({
        numero,
        empresa: company_name,
        contacto: contact_name,
        email,
        telefono: phone,
        rut,
        lineas,
        totalNeto,
        iva,
        totalConIva,
        qtyTotal,
        deliveryDate: delivery_date,
        personalizacion: personalization_needs,
        peyuLogoB64,
      });
    } catch (e) {
      console.error('Error generando PDF cotización B2B:', e?.message || e);
    }

    // ─── Correos (best-effort, nunca rompen el flujo) ───
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const esRecotizacion = !!existing;

    // 1) Email al CLIENTE con relato + PDF adjunto.
    //    Entrega INMEDIATA vía Gmail (ti@peyuchile.cl) como método principal —
    //    es la conexión estable y verificada. Resend queda como respaldo.
    const clientHtml = buildClientEmail({
      numero, contacto: contact_name, empresa: company_name,
      lineas, totalNeto, iva, totalConIva, qtyTotal,
      deliveryDate: delivery_date, personalizacion: personalization_needs,
    });
    const clientSubject = `Tu cotización PEYU ${numero} · ${qtyTotal} unidades 100% recicladas`;

    let emailEnviado = false;
    if (pdfBase64 && email && /\S+@\S+\.\S+/.test(email)) {
      try {
        emailEnviado = await sendQuoteViaGmail(base44, {
          to: email,
          subject: clientSubject,
          html: clientHtml,
          pdfBase64,
          filename,
        });
        if (!emailEnviado) console.error('Gmail cliente: no enviado');
      } catch (e) {
        console.error('Gmail cliente error:', e?.message || e);
      }
    }

    // Respaldo: si Gmail no envió, intentamos vía Resend con el PDF adjunto.
    if (!emailEnviado && RESEND_API_KEY && pdfBase64 && email && /\S+@\S+\.\S+/.test(email)) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'PEYU Chile <ventas@peyuchile.cl>',
            to: [email],
            reply_to: 'ventas@peyuchile.cl',
            subject: `🐢 ${clientSubject}`,
            html: clientHtml,
            attachments: [{ filename, content: pdfBase64 }],
          }),
        });
        emailEnviado = r.ok;
        if (!r.ok) console.error('Resend respaldo cliente error:', await r.text());
      } catch (e) {
        console.error('Resend respaldo cliente error:', e?.message || e);
      }
    }

    // 2) Email al EQUIPO (HTML accionable). Cubre creación Y re-cotización
    //    (onNewB2BLead solo dispara en create; esto cierra el hueco).
    let emailEquipoEnviado = false;
    const TEAM_INBOXES = ['jnilo@peyuchile.cl', 'ventas@peyuchile.cl', 'ti@peyuchile.cl'];
    if (RESEND_API_KEY) {
      try {
        const hot = lead_score >= 80;
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'PEYU Pipeline B2B <ventas@peyuchile.cl>',
            to: TEAM_INBOXES,
            subject: `${hot ? '🔥' : '📥'} ${esRecotizacion ? 'Re-cotización' : 'Cotización'} B2B · ${company_name || 'sin nombre'} · ${lead_score}pts · ${clp(totalConIva)}`,
            html: buildTeamEmail({
              numero, leadScore: lead_score, urgency,
              empresa: company_name, contacto: contact_name, email, telefono: phone, rut, giro,
              lineas, totalConIva, qtyTotal, deliveryDate: delivery_date,
              personalizacion: personalization_needs, esRecotizacion,
            }),
          }),
        });
        emailEquipoEnviado = r.ok;
        if (!r.ok) console.error('Resend equipo error:', await r.text());
      } catch (e) {
        console.error('Error email equipo:', e?.message || e);
      }
    }

    return Response.json({
      ok: true,
      lead_id: leadId,
      lead_score,
      numero,
      lineas,
      qty_total: qtyTotal,
      total_neto: totalNeto,
      iva,
      total_con_iva: totalConIva,
      pdf_base64: pdfBase64,
      filename,
      email_enviado: emailEnviado,
      email_equipo_enviado: emailEquipoEnviado,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});