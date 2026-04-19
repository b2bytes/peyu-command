import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.1';

// PEYU brand colors
const TEAL = [15, 139, 108];
const DARK = [30, 41, 59];
const GRAY = [100, 116, 139];
const LIGHT = [241, 245, 249];

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { proposalId } = await req.json();

    if (!proposalId) return Response.json({ error: 'proposalId requerido' }, { status: 400 });

    const list = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
    if (!list || list.length === 0) return Response.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    const p = list[0];

    const items = (() => { try { return p.items_json ? JSON.parse(p.items_json) : []; } catch { return []; } })();
    const fechaEnvio = p.fecha_envio || new Date().toISOString().split('T')[0];
    const fechaVenc = p.fecha_vencimiento || '';

    // ==========================================================
    //  PDF — A4 portrait
    // ==========================================================
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();   // 210
    const ph = doc.internal.pageSize.getHeight();  // 297
    let y = 0;

    // ----- PORTADA -----
    // Dark hero band
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pw, 110, 'F');

    // Teal accent corner
    doc.setFillColor(...TEAL);
    doc.triangle(0, 0, 60, 0, 0, 60, 'F');

    // Brand
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('PEYU', 20, 40);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(167, 217, 201);
    doc.text('REGALOS CORPORATIVOS · 100% RECICLADOS · HECHO EN CHILE', 20, 48);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Propuesta Comercial', 20, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(200, 215, 225);
    doc.text(`Preparada para ${p.empresa}`, 20, 82);

    // Numero & fecha (right)
    doc.setFontSize(9);
    doc.setTextColor(167, 217, 201);
    if (p.numero) doc.text(`N° ${p.numero}`, pw - 20, 40, { align: 'right' });
    doc.setTextColor(200, 215, 225);
    doc.text(`Emisión: ${fechaEnvio}`, pw - 20, 48, { align: 'right' });
    if (fechaVenc) doc.text(`Validez: ${fechaVenc}`, pw - 20, 54, { align: 'right' });

    y = 125;

    // ----- CLIENTE + RESUMEN -----
    doc.setFillColor(...LIGHT);
    doc.roundedRect(15, y, pw - 30, 40, 3, 3, 'F');

    doc.setTextColor(...GRAY);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 22, y + 9);
    doc.text('CONTACTO', 82, y + 9);
    doc.text('TOTAL', pw - 22, y + 9, { align: 'right' });

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.text(p.empresa || '—', 22, y + 17);
    doc.text(p.contacto || '—', 82, y + 17);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    if (p.email) doc.text(p.email, 82, y + 23);

    // Total big
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...TEAL);
    doc.text(fmtCLP(p.total), pw - 22, y + 19, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('CLP · IVA incluido', pw - 22, y + 25, { align: 'right' });

    // Mini metrics row
    const metricsY = y + 30;
    const metrics = [
      ['Lead time', `${p.lead_time_dias || 7} días`],
      ['Anticipo', `${p.anticipo_pct || 50}%`],
      ['Validez', `${p.validity_days || 15} días`],
      ['Ítems', `${items.length}`],
    ];
    metrics.forEach((m, i) => {
      const x = 22 + i * 45;
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'bold');
      doc.text(m[0].toUpperCase(), x, metricsY);
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.text(m[1], x, metricsY + 5);
    });

    y += 52;

    // ----- MOCKUP -----
    if (p.mockup_urls?.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text('Vista previa del producto', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text('Mockup referencial con tu logo aplicado en láser UV', 15, y + 5);

      try {
        const img = p.mockup_urls[0];
        const resp = await fetch(img);
        const buf = await resp.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const fmt = img.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
        doc.addImage(`data:image/${fmt.toLowerCase()};base64,${b64}`, fmt, 15, y + 9, 70, 70);
      } catch {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(15, y + 9, 70, 70, 3, 3, 'F');
        doc.setTextColor(...GRAY);
        doc.setFontSize(8);
        doc.text('(Mockup adjunto digitalmente)', 50, y + 48, { align: 'center' });
      }

      // ESG box to the right of mockup
      doc.setFillColor(...TEAL);
      doc.roundedRect(95, y + 9, pw - 110, 70, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Impacto ESG', 102, y + 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const esgLines = [
        '♻  Plástico post-consumo rescatado',
        '🌍  Fabricación 100% local — Chile',
        '🔋  Proceso con energía renovable',
        '🛡  Garantía 10 años sobre defectos',
        '🌱  Reduce tu huella corporativa',
      ];
      esgLines.forEach((l, i) => doc.text(l, 102, y + 32 + i * 7));

      y += 90;
    }

    // ----- TABLA DE ITEMS -----
    if (y > ph - 80) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text('Detalle técnico y económico', 15, y);
    y += 8;

    // Header
    doc.setFillColor(...DARK);
    doc.roundedRect(15, y, pw - 30, 9, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTO', 20, y + 6);
    doc.text('CANT.', 115, y + 6);
    doc.text('P. UNIT.', 140, y + 6);
    doc.text('DESC.', 165, y + 6);
    doc.text('SUBTOTAL', pw - 20, y + 6, { align: 'right' });
    y += 12;

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    items.forEach((it, i) => {
      if (y > ph - 30) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 248);
        doc.rect(15, y - 5, pw - 30, 11, 'F');
      }
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      const name = (it.nombre || it.name || it.producto || '—').substring(0, 40);
      doc.text(name, 20, y);
      if (it.personalizacion) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...TEAL);
        doc.text('+ Personalización láser UV', 20, y + 4);
        doc.setFontSize(9);
      }
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.text(`${it.cantidad || it.qty || 0}`, 115, y);
      doc.text(fmtCLP(it.precio_unitario), 140, y);
      doc.setTextColor(...TEAL);
      doc.text(it.descuento_pct ? `-${it.descuento_pct}%` : '—', 165, y);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(fmtCLP(it.line_total || (it.precio_unitario * (it.cantidad || it.qty))), pw - 20, y, { align: 'right' });
      y += it.personalizacion ? 11 : 9;
    });

    // Totales
    y += 3;
    doc.setDrawColor(...LIGHT);
    doc.line(15, y, pw - 15, y);
    y += 6;

    const totRow = (label, val, bold = false, color = DARK) => {
      doc.setFontSize(bold ? 11 : 9);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      doc.text(label, pw - 80, y);
      doc.text(fmtCLP(val), pw - 20, y, { align: 'right' });
      y += bold ? 7 : 5;
    };

    if (p.subtotal) totRow('Subtotal', p.subtotal);
    if (p.descuento_pct > 0) totRow(`Descuento (${p.descuento_pct}%)`, -Math.round((p.subtotal || 0) * p.descuento_pct / 100), false, TEAL);
    if (p.fee_personalizacion > 0) totRow('Fee personalización', p.fee_personalizacion);
    if (p.fee_packaging > 0) totRow('Fee packaging', p.fee_packaging);
    y += 2;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.8);
    doc.line(pw - 80, y, pw - 15, y);
    y += 6;
    totRow('TOTAL', p.total, true, TEAL);

    // ----- CONDICIONES -----
    if (y > ph - 60) { doc.addPage(); y = 20; }
    y += 6;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(15, y, pw - 30, 52, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('Términos y condiciones', 22, y + 8);

    const conds = [
      `Anticipo ${p.anticipo_pct || 50}% para iniciar producción. Saldo contra despacho.`,
      `Entrega en ${p.lead_time_dias || 7} días hábiles desde anticipo y aprobación de mockup.`,
      'Garantía de 10 años contra defectos de fabricación en plástico reciclado.',
      'Grabado láser UV incluido gratis desde 10 unidades. Área estándar 40×25mm.',
      'Despacho a todo Chile vía Starken/Chilexpress. Costo según destino.',
      `Propuesta válida por ${p.validity_days || 15} días desde la fecha de emisión.`,
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    conds.forEach((c, i) => doc.text(`✓  ${c}`, 22, y + 16 + i * 5.5));

    y += 58;

    // ----- FOOTER fijo en última página -----
    const footerY = ph - 18;
    doc.setFillColor(...DARK);
    doc.rect(0, footerY, pw, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('PEYU Chile SpA', 15, footerY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(167, 217, 201);
    doc.text('peyuchile.com · +56 9 3504 0242 · hola@peyuchile.com', 15, footerY + 12);
    doc.setTextColor(200, 215, 225);
    doc.text('Providencia · Macul · Santiago, Chile', pw - 15, footerY + 12, { align: 'right' });

    const pdfBytes = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return Response.json({
      success: true,
      pdf_base64: pdfBase64,
      filename: `PEYU-Propuesta-${p.numero || proposalId}.pdf`,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});