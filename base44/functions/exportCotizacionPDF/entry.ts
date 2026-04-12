import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { cotizacion_id } = body;

  // Fetch cotización
  const cotizaciones = await base44.entities.Cotizacion.filter({ id: cotizacion_id });
  if (!cotizaciones.length) return Response.json({ error: 'Cotización no encontrada' }, { status: 404 });
  const cot = cotizaciones[0];

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;

  // ── Header verde ──
  doc.setFillColor(15, 139, 108);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PEYU', margin, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Productos con Propósito | 100% Plástico Reciclado', margin, 23);
  doc.text('www.peyu.cl  ·  hola@peyu.cl  ·  +56 9 XXXX XXXX', margin, 29);

  // Número cotización (derecha)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`COTIZACIÓN`, W - margin, 14, { align: 'right' });
  doc.setFontSize(14);
  doc.text(cot.numero || `COT-${cotizacion_id?.slice(-6)?.toUpperCase()}`, W - margin, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fechaEnvio = cot.fecha_envio ? new Date(cot.fecha_envio + 'T12:00:00').toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL');
  const fechaVence = cot.fecha_vencimiento ? new Date(cot.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CL') : 'A convenir';
  doc.text(`Fecha: ${fechaEnvio}`, W - margin, 30, { align: 'right' });
  doc.text(`Vence: ${fechaVence}`, W - margin, 35, { align: 'right' });

  // ── Datos cliente ──
  doc.setTextColor(30, 30, 30);
  let y = 50;
  doc.setFillColor(245, 245, 240);
  doc.rect(margin, y - 5, W - 2 * margin, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('PARA', margin + 4, y + 1);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text(cot.empresa || 'Cliente', margin + 4, y + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(cot.contacto || '', margin + 4, y + 14);
  doc.text(cot.email || '', margin + 4, y + 19);

  // ── Tabla de productos ──
  y = 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setFillColor(15, 139, 108);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, y - 5, W - 2 * margin, 8, 'F');
  doc.text('Producto / SKU', margin + 3, y);
  doc.text('Tipo Personal.', 105, y);
  doc.text('Cant.', 138, y);
  doc.text('P. Unit.', 155, y);
  doc.text('Total', W - margin - 3, y, { align: 'right' });

  y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');

  // Fila producto principal
  const precioUnitario = cot.precio_unitario || 0;
  const cantidad = cot.cantidad || 1;
  const descuento = cot.descuento_pct || 0;
  const precioConDesc = Math.round(precioUnitario * (1 - descuento / 100));
  const subtotalProd = precioConDesc * cantidad;

  const rowBg = (i) => { if (i % 2 === 0) { doc.setFillColor(250, 250, 248); doc.rect(margin, y - 5, W - 2 * margin, 8, 'F'); } };
  rowBg(0);
  doc.text(cot.sku || 'Producto personalizado', margin + 3, y);
  doc.text(cot.personalizacion_tipo || 'Sin personalización', 105, y);
  doc.text(cantidad.toString(), 142, y, { align: 'right' });
  doc.text(`$${precioConDesc.toLocaleString('es-CL')}`, 172, y, { align: 'right' });
  doc.text(`$${subtotalProd.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });

  y += 10;

  // Fees adicionales
  const fees = [];
  if (cot.fee_personalizacion > 0) fees.push({ concepto: 'Fee Personalización', monto: cot.fee_personalizacion });
  if (cot.fee_packaging > 0) fees.push({ concepto: `Packaging ${cot.packaging || ''}`, monto: cot.fee_packaging });
  if (cot.es_express) fees.push({ concepto: 'Recargo Express (+12%)', monto: Math.round(subtotalProd * 0.12) });

  fees.forEach((f, i) => {
    rowBg(i + 1);
    doc.text(f.concepto, margin + 3, y);
    doc.text(`$${f.monto.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });
    y += 8;
  });

  // Línea separadora
  doc.setDrawColor(15, 139, 108);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Total
  const totalFinal = cot.total || (subtotalProd + fees.reduce((s, f) => s + f.monto, 0));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL (CLP, IVA incluido)', margin + 3, y);
  doc.setTextColor(15, 139, 108);
  doc.text(`$${totalFinal.toLocaleString('es-CL')}`, W - margin - 3, y, { align: 'right' });

  y += 6;
  if (descuento > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`* Incluye descuento del ${descuento}% sobre precio lista`, margin + 3, y);
  }

  // ── Condiciones comerciales ──
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
    `Forma de pago: 50% anticipo al confirmar · 50% contra entrega`,
    `Lead time: ${cot.personalizacion_tipo !== 'Sin personalización' ? (cot.lead_time_dias || 10) + ' días hábiles con personalización' : (cot.lead_time_dias || 5) + ' días hábiles sin personalización'}`,
    `Validez de cotización: ${fechaVence}`,
    `Personalización: Láser UV incluida desde 10 unidades. Se requiere logo en formato AI/PDF vectorial.`,
    `Despacho: A coordinar. El costo de envío no está incluido salvo indicación expresa.`,
    `Material: 100% plástico reciclado post-consumo. Certificación disponible a solicitud.`,
  ];

  condiciones.forEach(c => {
    doc.text(`• ${c}`, margin, y);
    y += 5.5;
  });

  // ── Notas ──
  if (cot.notas) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text('Notas', margin, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(cot.notas, W - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  // ── Footer ──
  const footerY = 270;
  doc.setFillColor(15, 139, 108);
  doc.rect(0, footerY, W, 27, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PEYU Chile SPA  ·  RUT: 77.XXX.XXX-X  ·  Fabricantes de productos sostenibles', W / 2, footerY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Para confirmar tu pedido responde este documento firmado o escríbenos a hola@peyu.cl', W / 2, footerY + 13, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('♻ Cada compra evita que el plástico llegue al vertedero', W / 2, footerY + 20, { align: 'center' });

  const pdfBytes = doc.output('arraybuffer');

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Cotizacion-Peyu-${(cot.numero || cotizacion_id?.slice(-6))}.pdf"`,
    },
  });
});