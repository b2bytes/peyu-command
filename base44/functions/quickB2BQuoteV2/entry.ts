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
      meta: { lead_score, qty_total: qtyTotal, total_neto: totalNeto },
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

    // ─── Enviar PDF al correo del cliente (best-effort, no rompe el flujo) ───
    let emailEnviado = false;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (pdfBase64 && email && /\S+@\S+\.\S+/.test(email) && RESEND_API_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'PEYU Chile <ventas@peyuchile.cl>',
            to: [email],
            subject: `Tu cotización corporativa PEYU ${numero} · ${qtyTotal} unidades`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
                <div style="background:#0F8B6C;padding:24px;border-radius:12px 12px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:22px">PEYU 🐢</h1>
                  <p style="color:#d7f0e8;margin:4px 0 0;font-size:13px">Productos con propósito · 100% plástico reciclado</p>
                </div>
                <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px">
                  <p>Hola${contact_name ? ` ${contact_name}` : ''} 👋</p>
                  <p>Te adjuntamos tu cotización por volumen <strong>${numero}</strong> para <strong>${company_name}</strong>:</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
                    <tr><td style="padding:6px 0;color:#666">Unidades totales</td><td style="padding:6px 0;text-align:right;font-weight:600">${qtyTotal} u.</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Neto</td><td style="padding:6px 0;text-align:right;font-weight:600">$${totalNeto.toLocaleString('es-CL')}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;border-top:2px solid #0F8B6C">Total (IVA incl.)</td><td style="padding:6px 0;text-align:right;font-weight:800;color:#0F8B6C;border-top:2px solid #0F8B6C">$${totalConIva.toLocaleString('es-CL')}</td></tr>
                  </table>
                  <p style="font-size:13px;color:#666">Validez: 15 días. Un ejecutivo te contactará en 24h hábiles para afinar plazos y personalización.</p>
                  <a href="https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, quiero avanzar con la cotización ${numero}`)}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;font-size:14px;margin-top:8px">Avanzar por WhatsApp</a>
                </div>
              </div>`,
            attachments: [{ filename, content: pdfBase64 }],
          }),
        });
        emailEnviado = r.ok;
        if (!r.ok) console.error('Resend cotización B2B error:', await r.text());
      } catch (e) {
        console.error('Error enviando cotización B2B por email:', e?.message || e);
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
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});