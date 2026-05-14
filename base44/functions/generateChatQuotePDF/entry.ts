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

// Resuelve precio por volumen según las escalas de Producto.
function pickEscalonado(producto, qty) {
  if (qty >= 500 && producto.precio_500_mas) return producto.precio_500_mas;
  if (qty >= 200 && producto.precio_200_499) return producto.precio_200_499;
  if (qty >= 50  && producto.precio_50_199)  return producto.precio_50_199;
  if (qty >= 10  && producto.precio_base_b2b) return producto.precio_base_b2b;
  return producto.precio_b2c || producto.precio_base_b2b || 9990;
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

    // 2. Calcular precios
    const cantidad = Math.max(1, parseInt(qty, 10) || 1);
    const precioUnit = pickEscalonado(producto, cantidad);
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

    // 4. Generar PDF — mismo estilo que exportCotizacionPDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 20;

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
    doc.text('www.peyu.cl  ·  hola@peyu.cl  ·  +56 9 3376 6573', margin, 29);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN', W - margin, 14, { align: 'right' });
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
    if (contacto) doc.text(`Contacto: ${contacto}`, margin + 4, y + 14);
    if (email) doc.text(`Email: ${email}`, margin + 4, y + 19);
    if (telefono) doc.text(`Teléfono: ${telefono}`, margin + 4, y + 24);

    // Tabla productos
    y = 89;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setFillColor(15, 139, 108);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, y - 5, W - 2 * margin, 8, 'F');
    doc.text('Producto / SKU', margin + 3, y);
    doc.text('Personal.', 105, y);
    doc.text('Cant.', 138, y);
    doc.text('P. Unit.', 155, y);
    doc.text('Total', W - margin - 3, y, { align: 'right' });

    y += 8;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(250, 250, 248);
    doc.rect(margin, y - 5, W - 2 * margin, 8, 'F');
    const nombreCorto = (producto.nombre || sku).length > 32
      ? (producto.nombre || sku).slice(0, 32) + '…'
      : (producto.nombre || sku);
    doc.text(`${nombreCorto}`, margin + 3, y);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(sku, margin + 3, y + 3.5);
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(requierePersonal ? personalizacion : '—', 105, y);
    doc.text(cantidad.toString(), 142, y, { align: 'right' });
    doc.text(`$${precioUnit.toLocaleString('es-CL')}`, 172, y, { align: 'right' });
    doc.text(`$${subtotal.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });
    y += 10;

    if (feePersonal > 0) {
      doc.text('Fee Personalización (<10u)', margin + 3, y);
      doc.text(`$${feePersonal.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });
      y += 8;
    }

    // Separador + Total
    doc.setDrawColor(15, 139, 108);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL (CLP, IVA incluido)', margin + 3, y);
    doc.setTextColor(15, 139, 108);
    doc.text(`$${total.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });

    if (cantidad >= 10 && requierePersonal) {
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 139, 108);
      doc.text('✓ Láser UV incluido GRATIS desde 10 unidades', margin + 3, y);
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
      `Lead time estimado: ${leadTime} días hábiles${requierePersonal ? ' con personalización' : ' sin personalización'}.`,
      `Validez de cotización: 15 días corridos (hasta ${vence.toLocaleDateString('es-CL')}).`,
      'Personalización: Láser UV incluida desde 10 unidades. Requiere logo en formato AI/PDF vectorial.',
      'Despacho: A coordinar. Envío gratis sobre $40.000 a través de Bluex/Starken.',
      'Material: 100% plástico reciclado post-consumo. Certificación disponible a solicitud.',
      'Esta cotización fue generada automáticamente desde el chat Peyu. Para confirmar, responde a hola@peyu.cl indicando el número.',
    ];
    condiciones.forEach(c => {
      const lines = doc.splitTextToSize(`• ${c}`, W - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 4.8;
    });

    // Impacto ambiental (badge final)
    if (cantidad >= 50) {
      y += 4;
      doc.setFillColor(231, 244, 239);
      doc.rect(margin, y - 4, W - 2 * margin, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 139, 108);
      doc.text('🌱 Impacto de tu compra', margin + 3, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const kgRescatados = Math.round(cantidad * 0.05 * 10) / 10;
      const litrosAhorrados = cantidad * 12.5;
      doc.text(`Esta orden rescata ~${kgRescatados}kg de plástico del océano y ahorra ${litrosAhorrados.toLocaleString('es-CL')}L de agua vs producción virgen.`, margin + 3, y + 5);
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
    doc.text('Para confirmar tu pedido responde este documento o escríbenos a hola@peyu.cl', W / 2, footerY + 13, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('♻ Cada compra evita que el plástico llegue al vertedero', W / 2, footerY + 20, { align: 'center' });

    // Devolver PDF como base64 (el frontend lo descarga sin pasar por backend)
    const pdfBytes = doc.output('arraybuffer');
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return Response.json({
      ok: true,
      cotizacion_id: cot.id,
      numero,
      total,
      pdf_base64: base64,
      filename: `Cotizacion-Peyu-${numero}.pdf`,
    });
  } catch (error) {
    console.error('generateChatQuotePDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});