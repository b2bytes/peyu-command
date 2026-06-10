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

// Genera el PDF de cotización B2B multi-producto (mismo estilo PEYU que el
// cotizador del chat). Devuelve base64 listo para descargar/adjuntar.
function buildQuotePDF({ numero, empresa, contacto, email, telefono, rut, lineas, totalNeto, iva, totalConIva, qtyTotal, deliveryDate, personalizacion }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;
  const hoy = new Date();
  const vence = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);

  // Header verde PEYU
  doc.setFillColor(15, 139, 108);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PEYU', margin, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Productos con Propósito | 100% Plástico Reciclado', margin, 23);
  doc.text('www.peyuchile.cl  ·  ventas@peyuchile.cl  ·  +56 9 3504 0242', margin, 29);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN POR VOLUMEN', W - margin, 14, { align: 'right' });
  doc.setFontSize(14);
  doc.text(numero, W - margin, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${hoy.toLocaleDateString('es-CL')}`, W - margin, 30, { align: 'right' });
  doc.text(`Vence: ${vence.toLocaleDateString('es-CL')}`, W - margin, 35, { align: 'right' });

  // Datos cliente
  doc.setTextColor(30, 30, 30);
  let y = 50;
  doc.setFillColor(245, 245, 240);
  doc.rect(margin, y - 5, W - 2 * margin, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('PARA', margin + 4, y + 1);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text(empresa || contacto || 'Cliente', margin + 4, y + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (rut) doc.text(`RUT: ${rut}`, margin + 4, y + 14);
  if (contacto) doc.text(`Contacto: ${contacto}`, margin + 90, y + 14);
  if (email) doc.text(`Email: ${email}`, margin + 4, y + 19);
  if (telefono) doc.text(`Teléfono: ${telefono}`, margin + 90, y + 19);
  if (deliveryDate) doc.text(`Fecha requerida: ${deliveryDate}`, margin + 4, y + 24);

  // Tabla productos
  y = 89;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setFillColor(15, 139, 108);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, y - 5, W - 2 * margin, 8, 'F');
  doc.text('Producto', margin + 3, y);
  doc.text('Tramo', 108, y);
  doc.text('Cant.', 140, y);
  doc.text('P. Unit.', 158, y);
  doc.text('Total', W - margin - 3, y, { align: 'right' });

  y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  lineas.forEach((l, i) => {
    if (i % 2 === 0) { doc.setFillColor(250, 250, 248); doc.rect(margin, y - 5, W - 2 * margin, 8, 'F'); }
    const nombreCorto = (l.nombre || l.sku).length > 30 ? (l.nombre || l.sku).slice(0, 30) + '…' : (l.nombre || l.sku);
    doc.setTextColor(30, 30, 30);
    doc.text(nombreCorto, margin + 3, y);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(l.tramo || '', 108, y);
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(l.cantidad.toString(), 148, y, { align: 'right' });
    doc.text(`$${l.precio_unitario.toLocaleString('es-CL')}`, 176, y, { align: 'right' });
    doc.text(`$${l.subtotal.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });
    y += 8;
  });

  // Separador + Totales
  doc.setDrawColor(15, 139, 108);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Neto (${qtyTotal} u)`, margin + 3, y);
  doc.text(`$${totalNeto.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });
  y += 6;
  doc.text('IVA (19%)', margin + 3, y);
  doc.text(`$${iva.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('TOTAL (CLP, IVA incluido)', margin + 3, y);
  doc.setTextColor(15, 139, 108);
  doc.text(`$${totalConIva.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });

  if (personalizacion) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 139, 108);
    doc.text('✓ Personalización láser UV incluida GRATIS desde 10 unidades por producto', margin + 3, y);
  }

  // Condiciones
  y += 14;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Condiciones Comerciales', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  const condiciones = [
    'Forma de pago: 50% anticipo al confirmar · 50% contra entrega.',
    `Validez de cotización: 15 días corridos (hasta ${vence.toLocaleDateString('es-CL')}).`,
    'Precios netos por volumen según catálogo oficial PEYU (sin IVA). El IVA se detalla aparte.',
    'Personalización: Láser UV incluida desde 10 unidades por producto. Requiere logo en formato AI/PDF vectorial.',
    'Despacho: A coordinar vía Bluex/Starken. El costo de envío no está incluido salvo indicación expresa.',
    'Material: 100% plástico reciclado post-consumo. Certificación e informe de impacto disponibles a solicitud.',
  ];
  condiciones.forEach((c) => {
    const lines = doc.splitTextToSize(`• ${c}`, W - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 4.8;
  });

  // Impacto ambiental
  if (qtyTotal >= 50) {
    y += 4;
    doc.setFillColor(231, 244, 239);
    doc.rect(margin, y - 4, W - 2 * margin, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 139, 108);
    doc.text('🌱 Impacto de tu pedido corporativo', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const kg = Math.round(qtyTotal * 0.05 * 10) / 10;
    const litros = qtyTotal * 12.5;
    doc.text(`Esta orden rescata ~${kg}kg de plástico y ahorra ${litros.toLocaleString('es-CL')}L de agua vs producción virgen.`, margin + 3, y + 5);
  }

  // Footer
  const footerY = 270;
  doc.setFillColor(15, 139, 108);
  doc.rect(0, footerY, W, 27, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PEYU Chile SPA  ·  Fabricantes de productos sostenibles', W / 2, footerY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Para confirmar tu pedido responde este documento o escríbenos a ventas@peyuchile.cl', W / 2, footerY + 13, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('♻ Cada compra evita que el plástico llegue al vertedero', W / 2, footerY + 20, { align: 'center' });

  const pdfBytes = doc.output('arraybuffer');
  return btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
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
      });
    } catch (e) {
      console.error('Error generando PDF cotización B2B:', e?.message || e);
    }

    // ─── Correos (best-effort, nunca rompen el flujo) ───
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const esRecotizacion = !!existing;

    // 1) Email al CLIENTE con relato + PDF adjunto.
    let emailEnviado = false;
    if (RESEND_API_KEY && pdfBase64 && email && /\S+@\S+\.\S+/.test(email)) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'PEYU Chile <ventas@peyuchile.cl>',
            to: [email],
            reply_to: 'ventas@peyuchile.cl',
            subject: `🐢 Tu cotización PEYU ${numero} · ${qtyTotal} unidades, 100% recicladas`,
            html: buildClientEmail({
              numero, contacto: contact_name, empresa: company_name,
              lineas, totalNeto, iva, totalConIva, qtyTotal,
              deliveryDate: delivery_date, personalizacion: personalization_needs,
            }),
            attachments: [{ filename, content: pdfBase64 }],
          }),
        });
        emailEnviado = r.ok;
        if (!r.ok) console.error('Resend cliente error:', await r.text());
      } catch (e) {
        console.error('Error email cliente:', e?.message || e);
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