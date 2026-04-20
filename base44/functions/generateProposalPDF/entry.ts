import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.1';

// PEYU brand colors
const TEAL = [15, 139, 108];
const DARK = [30, 41, 59];
const GRAY = [100, 116, 139];
const LIGHT = [241, 245, 249];

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// jsPDF con fuente Helvetica solo soporta caracteres WinAnsi (Latin1).
// Emojis, símbolos especiales y ciertos acentos ampliados salen como "Þ", "þ", "ð" o cuadros.
// Limpia el texto preservando tildes/ñ/ü y reemplaza símbolos por equivalentes ASCII seguros.
function safeTxt(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    // Símbolos comunes que jsPDF/helvetica no renderiza
    .replace(/[✓✔☑]/g, '>')
    .replace(/[✗✘❌]/g, 'x')
    .replace(/[♻]/g, '[R]')
    .replace(/[🌍🌎🌏]/g, '[ES]')
    .replace(/[🔋⚡]/g, '[E]')
    .replace(/[🛡️🛡]/g, '[G]')
    .replace(/[🌱🌿🍃]/g, '[Eco]')
    .replace(/[📦🎁]/g, '')
    .replace(/[★☆]/g, '*')
    .replace(/[–—]/g, '-')
    .replace(/[""«»]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/[·•]/g, '-')
    .replace(/°/g, 'o')
    // Elimina cualquier caracter no imprimible / fuera de WinAnsi (emojis restantes, símbolos raros)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[^\x20-\xFF]/g, '');
}

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
    doc.text(safeTxt('REGALOS CORPORATIVOS - 100% RECICLADOS - HECHO EN CHILE'), 20, 48);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(safeTxt('Propuesta Comercial'), 20, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(200, 215, 225);
    doc.text(safeTxt(`Preparada para ${p.empresa}`), 20, 82);

    // Numero & fecha (right)
    doc.setFontSize(9);
    doc.setTextColor(167, 217, 201);
    if (p.numero) doc.text(safeTxt(`N° ${p.numero}`), pw - 20, 40, { align: 'right' });
    doc.setTextColor(200, 215, 225);
    doc.text(safeTxt(`Emision: ${fechaEnvio}`), pw - 20, 48, { align: 'right' });
    if (fechaVenc) doc.text(safeTxt(`Validez: ${fechaVenc}`), pw - 20, 54, { align: 'right' });

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
    doc.text(safeTxt(p.empresa || '-'), 22, y + 17);
    doc.text(safeTxt(p.contacto || '-'), 82, y + 17);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    if (p.email) doc.text(safeTxt(p.email), 82, y + 23);

    // Total big
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...TEAL);
    doc.text(fmtCLP(p.total), pw - 22, y + 19, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(safeTxt('CLP - IVA incluido'), pw - 22, y + 25, { align: 'right' });

    // Mini metrics row
    const metricsY = y + 30;
    const metrics = [
      ['Lead time', `${p.lead_time_dias || 7} dias`],
      ['Anticipo', `${p.anticipo_pct || 50}%`],
      ['Validez', `${p.validity_days || 15} dias`],
      ['Items', `${items.length}`],
    ];
    metrics.forEach((m, i) => {
      const x = 22 + i * 45;
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'bold');
      doc.text(safeTxt(m[0].toUpperCase()), x, metricsY);
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.text(safeTxt(m[1]), x, metricsY + 5);
    });

    y += 52;

    // ----- MOCKUP -----
    // Cargamos imagen con byte-safe chunking (evita stack overflow con imágenes grandes)
    async function fetchImageAsBase64(url) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('fetch failed');
      const buf = new Uint8Array(await resp.arrayBuffer());
      let bin = '';
      const CHUNK = 0x8000;
      for (let i = 0; i < buf.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, buf.subarray(i, i + CHUNK));
      }
      const b64 = btoa(bin);
      const ct = (resp.headers.get('content-type') || '').toLowerCase();
      const fmt = ct.includes('png') || url.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      return { b64, fmt };
    }

    if (p.mockup_urls?.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text(safeTxt('Vista previa del producto'), 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(safeTxt('Mockup referencial con tu logo aplicado en laser UV'), 15, y + 5);

      let mockupRendered = false;
      try {
        const { b64, fmt } = await fetchImageAsBase64(p.mockup_urls[0]);
        doc.addImage(`data:image/${fmt.toLowerCase()};base64,${b64}`, fmt, 15, y + 9, 70, 70);
        mockupRendered = true;
      } catch (e) {
        console.warn('Mockup no renderizado:', e?.message);
        doc.setFillColor(...LIGHT);
        doc.roundedRect(15, y + 9, 70, 70, 3, 3, 'F');
        doc.setTextColor(...GRAY);
        doc.setFontSize(8);
        doc.text(safeTxt('(Mockup adjunto digitalmente)'), 50, y + 48, { align: 'center' });
      }

      // ESG box to the right of mockup
      doc.setFillColor(...TEAL);
      doc.roundedRect(95, y + 9, pw - 110, 70, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(safeTxt('Impacto ESG'), 102, y + 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const esgLines = [
        '> Plastico post-consumo rescatado',
        '> Fabricacion 100% local - Chile',
        '> Proceso con energia renovable',
        '> Garantia 10 anos sobre defectos',
        '> Reduce tu huella corporativa',
      ];
      esgLines.forEach((l, i) => doc.text(safeTxt(l), 102, y + 32 + i * 7));

      y += 90;
      if (!mockupRendered) void 0;
    }

    // ----- TABLA DE ITEMS -----
    if (y > ph - 80) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(safeTxt('Detalle tecnico y economico'), 15, y);
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
      const name = safeTxt(it.nombre || it.name || it.producto || '-').substring(0, 40);
      doc.text(name, 20, y);
      if (it.personalizacion) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...TEAL);
        doc.text(safeTxt('+ Personalizacion laser UV'), 20, y + 4);
        doc.setFontSize(9);
      }
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.text(`${it.cantidad || it.qty || 0}`, 115, y);
      doc.text(fmtCLP(it.precio_unitario), 140, y);
      doc.setTextColor(...TEAL);
      doc.text(it.descuento_pct ? `-${it.descuento_pct}%` : '-', 165, y);
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
      doc.text(safeTxt(label), pw - 80, y);
      doc.text(fmtCLP(val), pw - 20, y, { align: 'right' });
      y += bold ? 7 : 5;
    };

    if (p.subtotal) totRow('Subtotal', p.subtotal);
    if (p.descuento_pct > 0) totRow(`Descuento (${p.descuento_pct}%)`, -Math.round((p.subtotal || 0) * p.descuento_pct / 100), false, TEAL);
    if (p.fee_personalizacion > 0) totRow('Fee personalizacion', p.fee_personalizacion);
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
    doc.text(safeTxt('Terminos y condiciones'), 22, y + 8);

    const conds = [
      `Anticipo ${p.anticipo_pct || 50}% para iniciar produccion. Saldo contra despacho.`,
      `Entrega en ${p.lead_time_dias || 7} dias habiles desde anticipo y aprobacion de mockup.`,
      'Garantia de 10 anos contra defectos de fabricacion en plastico reciclado.',
      'Grabado laser UV incluido gratis desde 10 unidades. Area estandar 40x25mm.',
      'Despacho a todo Chile via Starken/Chilexpress. Costo segun destino.',
      `Propuesta valida por ${p.validity_days || 15} dias desde la fecha de emision.`,
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    conds.forEach((c, i) => doc.text(safeTxt(`>  ${c}`), 22, y + 16 + i * 5.5));

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
    doc.text(safeTxt('peyuchile.com - +56 9 3504 0242 - hola@peyuchile.com'), 15, footerY + 12);
    doc.setTextColor(200, 215, 225);
    doc.text(safeTxt('Providencia - Macul - Santiago, Chile'), pw - 15, footerY + 12, { align: 'right' });

    // Encoding byte-safe (chunked) — evita stack overflow con PDFs grandes
    const pdfBytes = new Uint8Array(doc.output('arraybuffer'));
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < pdfBytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, pdfBytes.subarray(i, i + CHUNK));
    }
    const pdfBase64 = btoa(bin);

    return Response.json({
      success: true,
      pdf_base64: pdfBase64,
      filename: `PEYU-Propuesta-${p.numero || proposalId}.pdf`,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});