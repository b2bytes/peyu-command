import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.1';

// ============================================================================
// generateProposalPDF — PDF premium de propuesta corporativa PEYU
// ============================================================================
// Rediseño 2026: portada editorial, tipografía con jerarquía clara, métricas
// destacadas, tabla con mejor legibilidad, sección de aceptación digital.
// ----------------------------------------------------------------------------

// Paleta PEYU (RGB)
const INK   = [15, 23, 42];     // #0F172A — texto principal
const TEAL  = [15, 139, 108];   // #0F8B6C — acento principal
const TEAL2 = [10, 107, 84];    // #0A6B54 — gradiente
const SAND  = [244, 241, 235];  // #F4F1EB — fondo claro
const SAND2 = [229, 224, 214];  // #E5E0D6 — bordes claros
const MIST  = [248, 250, 252];  // #F8FAFC — bg suave
const SLATE = [100, 116, 139];  // #64748B — texto secundario
const SLATE2= [148, 163, 184];  // #94A3B8 — labels
const CREAM = [167, 217, 201];  // #A7D9C9 — accent claro

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// Logo PEYU oficial (blanco, fondo transparente) para incrustar en el header.
const PEYU_LOGO_URL = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/df49bff0d_generated_image.png';

// jsPDF/Helvetica solo soporta WinAnsi. Limpia el texto preservando ñ/tildes
// y reemplazando símbolos no representables.
function safeTxt(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/[✓✔☑]/g, '>')
    .replace(/[✗✘❌]/g, 'x')
    .replace(/[♻]/g, '[R]')
    .replace(/[🌍🌎🌏]/g, '')
    .replace(/[🔋⚡]/g, '')
    .replace(/[🛡️🛡]/g, '')
    .replace(/[🌱🌿🍃]/g, '')
    .replace(/[📦🎁🎉🐢]/g, '')
    .replace(/[★☆]/g, '*')
    .replace(/[–—]/g, '-')
    .replace(/[""«»]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/[·•]/g, '-')
    .replace(/°/g, 'o')
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

    // Helper: descarga una imagen y la devuelve en base64 (para incrustar en el PDF)
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
    // Precarga las imágenes de producto de cada ítem (para la tabla técnica)
    const itemImages = {};
    await Promise.all(items.map(async (it, idx) => {
      const u = it.imagen_url || '';
      if (/^https?:\/\//i.test(u)) {
        try { itemImages[idx] = await fetchImageAsBase64(u); } catch { /* sin imagen */ }
      }
    }));

    // Logo PEYU oficial (header) + logo del cliente si lo subió.
    let peyuLogo = null;
    try { peyuLogo = await fetchImageAsBase64(PEYU_LOGO_URL); } catch { /* fallback a texto */ }
    let clientLogo = null;
    if (/^https?:\/\//i.test(p.logo_url || '')) {
      try { clientLogo = await fetchImageAsBase64(p.logo_url); } catch { /* sin logo cliente */ }
    }

    // ─── Garantía contextual: si la propuesta es solo carcasas/compostables, no
    // aplicamos el discurso "10 años" (incorrecto para esos materiales).
    const esSoloCompostable = items.length > 0 && items.every(it => {
      const txt = `${it?.nombre || it?.name || ''} ${it?.sku || ''} ${it?.material || ''} ${it?.categoria || ''}`.toLowerCase();
      return /carcasa|compostable|trigo|fibra/.test(txt);
    });
    const garantiaLabel = esSoloCompostable
      ? 'Material compostable industrial'
      : 'Garantia 10 anos';
    const garantiaTermino = esSoloCompostable
      ? 'Material compostable industrial. Carcasas se composta en 2-3 anos al fin de su vida util.'
      : 'Garantia de 10 anos contra defectos de fabricacion en plastico reciclado.';
    const fechaEnvio = p.fecha_envio || new Date().toISOString().split('T')[0];
    const fechaVenc = p.fecha_vencimiento || '';

    const baseUrl = (req.headers.get('origin') || 'https://peyuchile.cl').replace(/\/$/, '');
    const acceptUrl = `${baseUrl}/b2b/propuesta?id=${proposalId}&action=accept`;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();   // 210
    const ph = doc.internal.pageSize.getHeight();  // 297
    let y = 0;

    // ═══════════════════════════════════════════════════
    //  PORTADA — Hero editorial
    // ═══════════════════════════════════════════════════

    // Background hero
    doc.setFillColor(...INK);
    doc.rect(0, 0, pw, 95, 'F');

    // Diagonal teal gradient effect (aproximación con triángulos)
    doc.setFillColor(...TEAL);
    doc.triangle(0, 0, 80, 0, 0, 80, 'F');
    doc.setFillColor(10, 74, 61);
    doc.triangle(0, 0, 50, 0, 0, 50, 'F');

    // Brand — logo PEYU real incrustado (con fallback a texto)
    if (peyuLogo) {
      try {
        doc.addImage(`data:image/${peyuLogo.fmt.toLowerCase()};base64,${peyuLogo.b64}`, peyuLogo.fmt, 18, 16, 46, 20);
      } catch {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(32);
        doc.text('PEYU', 18, 32);
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.text('PEYU', 18, 32);
    }

    // Tagline
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CREAM);
    doc.setCharSpace(1.2);
    doc.text(safeTxt('REGALOS CORPORATIVOS - 100% RECICLADO - HECHO EN CHILE'), 18, 39);
    doc.setCharSpace(0);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text(safeTxt('Propuesta'), 18, 62);
    doc.setTextColor(...CREAM);
    doc.text(safeTxt('Comercial'), 18, 73);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 215, 225);
    doc.text(safeTxt(`Preparada para ${p.empresa}`), 18, 84);

    // N° + fechas (right column)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CREAM);
    doc.setCharSpace(1);
    if (p.numero) doc.text(safeTxt(`PROPUESTA N°`), pw - 18, 22, { align: 'right' });
    doc.setCharSpace(0);
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    if (p.numero) doc.text(safeTxt(p.numero), pw - 18, 30, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 215, 225);
    doc.text(safeTxt(`Emision: ${fechaEnvio}`), pw - 18, 78, { align: 'right' });
    if (fechaVenc) doc.text(safeTxt(`Validez hasta: ${fechaVenc}`), pw - 18, 84, { align: 'right' });

    y = 110;

    // ═══════════════════════════════════════════════════
    //  CARD CLIENTE + TOTAL DESTACADO
    // ═══════════════════════════════════════════════════

    // Card grande con sombra simulada
    doc.setFillColor(...SAND);
    doc.roundedRect(15, y, pw - 30, 48, 4, 4, 'F');

    // Columna izquierda: cliente
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE2);
    doc.setCharSpace(1);
    doc.text(safeTxt('CLIENTE'), 22, y + 9);
    doc.setCharSpace(0);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text(safeTxt(p.empresa || '-'), 22, y + 17);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE);
    doc.text(safeTxt(p.contacto || '-'), 22, y + 23);
    if (p.email) doc.text(safeTxt(p.email), 22, y + 28);

    // Logo del cliente (si lo subió): chip blanco centrado en la columna media.
    if (clientLogo) {
      try {
        const lx = pw / 2 - 6, ly = y + 6, ls = 22;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(lx - 2, ly - 2, ls + 4, ls + 4, 2, 2, 'F');
        doc.addImage(`data:image/${clientLogo.fmt.toLowerCase()};base64,${clientLogo.b64}`, clientLogo.fmt, lx, ly, ls, ls);
        doc.setFontSize(5.5);
        doc.setTextColor(...SLATE2);
        doc.setFont('helvetica', 'bold');
        doc.text(safeTxt('SU MARCA'), lx + ls / 2, ly + ls + 4, { align: 'center' });
      } catch { /* sin logo cliente */ }
    }

    // Columna derecha: total grande
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEAL);
    doc.setCharSpace(1);
    doc.text(safeTxt('INVERSION TOTAL'), pw - 22, y + 9, { align: 'right' });
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...INK);
    doc.text(safeTxt(fmtCLP(p.total)), pw - 22, y + 22, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.setFont('helvetica', 'normal');
    doc.text(safeTxt('CLP - IVA incluido'), pw - 22, y + 28, { align: 'right' });

    // Mini metrics row dentro de la card (4 columnas)
    const metricsY = y + 38;
    doc.setDrawColor(...SAND2);
    doc.setLineWidth(0.3);
    doc.line(22, metricsY - 3, pw - 22, metricsY - 3);

    const metrics = [
      ['LEAD TIME', `${p.lead_time_dias || 7} dias`],
      ['ANTICIPO', `${p.anticipo_pct || 50}%`],
      ['VALIDEZ', `${p.validity_days || 15} dias`],
      ['ITEMS', `${items.length}`],
    ];
    const colWidth = (pw - 44) / 4;
    metrics.forEach((m, i) => {
      const x = 22 + i * colWidth;
      doc.setFontSize(6);
      doc.setTextColor(...SLATE2);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(0.8);
      doc.text(safeTxt(m[0]), x, metricsY + 2);
      doc.setCharSpace(0);
      doc.setTextColor(...INK);
      doc.setFontSize(10);
      doc.text(safeTxt(m[1]), x, metricsY + 7);
    });

    y += 60;

    // ═══════════════════════════════════════════════════
    //  MOCKUP + ESG (dos columnas)
    // ═══════════════════════════════════════════════════

    if (p.mockup_urls?.length > 0) {
      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...SLATE2);
      doc.setCharSpace(1.2);
      doc.text(safeTxt('VISTA PREVIA Y BENEFICIOS'), 15, y);
      doc.setCharSpace(0);
      y += 6;

      try {
        const { b64, fmt } = await fetchImageAsBase64(p.mockup_urls[0]);
        // Frame
        doc.setFillColor(...SAND);
        doc.roundedRect(15, y, 78, 78, 3, 3, 'F');
        doc.addImage(`data:image/${fmt.toLowerCase()};base64,${b64}`, fmt, 17, y + 2, 74, 74);
      } catch (e) {
        doc.setFillColor(...MIST);
        doc.roundedRect(15, y, 78, 78, 3, 3, 'F');
        doc.setTextColor(...SLATE2);
        doc.setFontSize(8);
        doc.text(safeTxt('Mockup digital adjunto'), 54, y + 40, { align: 'center' });
      }

      // Pie del mockup
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE);
      doc.text(safeTxt('Mockup referencial - laser UV simulado'), 54, y + 84, { align: 'center' });

      // ESG card (right)
      doc.setFillColor(...TEAL);
      doc.roundedRect(98, y, pw - 113, 78, 3, 3, 'F');

      doc.setTextColor(...CREAM);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setCharSpace(1.2);
      doc.text(safeTxt('IMPACTO ESG'), 103, y + 8);
      doc.setCharSpace(0);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text(safeTxt('Compra con'), 103, y + 18);
      doc.text(safeTxt('proposito.'), 103, y + 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const esgLines = [
        esSoloCompostable ? '> Fibra de trigo / compostable' : '> 100% plastico reciclado',
        '> Hecho en Chile',
        '> Energia renovable',
        `> ${garantiaLabel}`,
        '> Reduce huella corporativa',
      ];
      esgLines.forEach((l, i) => {
        doc.setTextColor(...CREAM);
        doc.text(safeTxt(l), 103, y + 38 + i * 6);
      });

      y += 86;
    }

    // ═══════════════════════════════════════════════════
    //  TABLA DE ITEMS — Detalle técnico-económico
    // ═══════════════════════════════════════════════════

    if (y > ph - 80) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE2);
    doc.setCharSpace(1.2);
    doc.text(safeTxt('DETALLE TECNICO Y ECONOMICO'), 15, y);
    doc.setCharSpace(0);
    y += 6;

    // Header de tabla (oscuro premium)
    doc.setFillColor(...INK);
    doc.roundedRect(15, y, pw - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(0.5);
    doc.text(safeTxt('PRODUCTO'), 38, y + 6.5);
    doc.text(safeTxt('CANT.'), 117, y + 6.5, { align: 'center' });
    doc.text(safeTxt('UNITARIO'), 142, y + 6.5, { align: 'right' });
    doc.text(safeTxt('DESC.'), 162, y + 6.5, { align: 'center' });
    doc.text(safeTxt('TOTAL'), pw - 20, y + 6.5, { align: 'right' });
    doc.setCharSpace(0);
    y += 13;

    // Filas con THUMBNAIL del producto elegido (diseño técnico completo)
    items.forEach((it, i) => {
      const rowH = 18; // alto fijo para acomodar la miniatura
      if (y - 5 + rowH > ph - 40) { doc.addPage(); y = 20; }

      // zebra suave
      if (i % 2 === 0) {
        doc.setFillColor(...MIST);
        doc.roundedRect(15, y - 5, pw - 30, rowH, 1.5, 1.5, 'F');
      }

      // Thumbnail del producto
      const imgX = 18, imgY = y - 3, imgS = 14;
      doc.setFillColor(...SAND);
      doc.roundedRect(imgX, imgY, imgS, imgS, 2, 2, 'F');
      const img = itemImages[i];
      if (img) {
        try {
          doc.addImage(`data:image/${img.fmt.toLowerCase()};base64,${img.b64}`, img.fmt, imgX + 0.8, imgY + 0.8, imgS - 1.6, imgS - 1.6);
        } catch { /* fallback al frame vacío */ }
      }

      const textY = y + 3;
      // Producto (nombre + SKU)
      doc.setTextColor(...INK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const name = safeTxt(it.nombre || it.name || it.producto || '-').substring(0, 36);
      doc.text(name, 38, textY - 1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE2);
      const meta = [it.sku ? `SKU ${it.sku}` : '', it.categoria || '', it.tier ? `Tramo ${it.tier}` : ''].filter(Boolean).join('  -  ');
      if (meta) doc.text(safeTxt(meta).substring(0, 50), 38, textY + 3);

      if (it.personalizacion) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...TEAL);
        doc.text(safeTxt('+ Grabado laser UV incluido'), 38, textY + 6.5);
      }

      // Cant. (centrado)
      doc.setTextColor(...SLATE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`${it.cantidad || it.qty || 0}`, 117, textY, { align: 'center' });

      // Unitario
      doc.setTextColor(...INK);
      doc.text(safeTxt(fmtCLP(it.precio_unitario)), 142, textY, { align: 'right' });

      // Descuento
      doc.setTextColor(...TEAL);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(it.descuento_pct ? `-${it.descuento_pct}%` : '-', 162, textY, { align: 'center' });

      // Subtotal
      doc.setTextColor(...INK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(safeTxt(fmtCLP(it.line_total || (it.precio_unitario * (it.cantidad || it.qty)))), pw - 20, textY, { align: 'right' });

      y += rowH - 2;
    });

    // ═══════════════════════════════════════════════════
    //  TOTALES
    // ═══════════════════════════════════════════════════
    y += 4;

    const totRow = (label, val, opts = {}) => {
      const { bold = false, color = SLATE, valColor = INK, big = false } = opts;
      doc.setFontSize(big ? 13 : (bold ? 10 : 9));
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      doc.text(safeTxt(label), pw - 75, y);
      doc.setTextColor(...valColor);
      doc.setFont('helvetica', 'bold');
      doc.text(safeTxt(fmtCLP(val)), pw - 20, y, { align: 'right' });
      y += big ? 9 : (bold ? 7 : 6);
    };

    if (p.subtotal) totRow('Subtotal', p.subtotal);
    if (p.descuento_pct > 0) {
      totRow(`Descuento por volumen (${p.descuento_pct}%)`, -Math.round((p.subtotal || 0) * p.descuento_pct / 100), { color: TEAL, valColor: TEAL });
    }
    if (p.fee_personalizacion > 0) totRow('Fee personalizacion', p.fee_personalizacion);
    if (p.fee_packaging > 0) totRow('Fee packaging', p.fee_packaging);

    // Línea separadora
    y += 2;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.8);
    doc.line(pw - 75, y, pw - 15, y);
    y += 7;

    // TOTAL grande
    totRow('TOTAL', p.total, { bold: true, big: true, color: INK, valColor: TEAL });

    // ═══════════════════════════════════════════════════
    //  CTA: ACEPTACIÓN DIGITAL
    // ═══════════════════════════════════════════════════

    if (y > ph - 65) { doc.addPage(); y = 20; }
    y += 4;

    // Banner de aceptación
    doc.setFillColor(...TEAL);
    doc.roundedRect(15, y, pw - 30, 28, 4, 4, 'F');

    doc.setTextColor(...CREAM);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setCharSpace(1.2);
    doc.text(safeTxt('ACEPTAR EN UN CLIC'), 22, y + 9);
    doc.setCharSpace(0);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(safeTxt('Acepta esta propuesta online'), 22, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...CREAM);
    doc.text(safeTxt('Activa la produccion al instante'), 22, y + 23);

    // "Botón" con link real
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pw - 70, y + 8, 53, 12, 3, 3, 'F');
    doc.setTextColor(...TEAL);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.textWithLink(safeTxt('ACEPTAR ONLINE >'), pw - 43.5, y + 15.5, { url: acceptUrl, align: 'center' });

    y += 36;

    // ═══════════════════════════════════════════════════
    //  MÉTODO DE ENTREGA
    // ═══════════════════════════════════════════════════
    if (y > ph - 40) { doc.addPage(); y = 20; }

    const esRetiro = (p.metodo_entrega || '').toLowerCase().includes('retiro');
    doc.setFillColor(...MIST);
    doc.roundedRect(15, y, pw - 30, 24, 3, 3, 'F');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.line(15, y, 15, y + 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE2);
    doc.setCharSpace(1.2);
    doc.text(safeTxt('METODO DE ENTREGA'), 22, y + 7);
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(safeTxt(esRetiro ? 'Retiro en tienda' : 'Despacho a domicilio'), 22, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    const lugar = esRetiro
      ? 'Av. Quilin 3340, Macul - Santiago (con cita previa)'
      : `${p.direccion_entrega || 'Direccion a confirmar'}${p.comuna_entrega ? ', ' + p.comuna_entrega : ''}`;
    doc.text(safeTxt(lugar).substring(0, 90), 22, y + 20);

    y += 32;

    // ═══════════════════════════════════════════════════
    //  CONDICIONES
    // ═══════════════════════════════════════════════════

    if (y > ph - 60) { doc.addPage(); y = 20; }

    doc.setFillColor(...SAND);
    doc.roundedRect(15, y, pw - 30, 52, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE2);
    doc.setCharSpace(1.2);
    doc.text(safeTxt('TERMINOS Y CONDICIONES'), 22, y + 8);
    doc.setCharSpace(0);

    const conds = [
      `Anticipo ${p.anticipo_pct || 50}% para iniciar produccion. Saldo contra despacho.`,
      `Entrega en ${p.lead_time_dias || 7} dias habiles desde anticipo y aprobacion de mockup.`,
      garantiaTermino,
      'Grabado laser UV gratis desde 10 unidades. Area estandar 40x25mm.',
      esRetiro
        ? 'Retiro en tienda sin costo, coordinado por email cuando el pedido este listo.'
        : 'Despacho a todo Chile via Starken/Chilexpress/BlueExpress.',
      `Propuesta valida por ${p.validity_days || 15} dias desde la emision.`,
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    conds.forEach((c, i) => {
      // bullet teal
      doc.setTextColor(...TEAL);
      doc.setFont('helvetica', 'bold');
      doc.text('>', 22, y + 16 + i * 5.8);
      doc.setTextColor(...SLATE);
      doc.setFont('helvetica', 'normal');
      doc.text(safeTxt(c), 27, y + 16 + i * 5.8);
    });

    y += 60;

    // ═══════════════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════════════

    const footerY = ph - 22;
    doc.setFillColor(...INK);
    doc.rect(0, footerY, pw, 22, 'F');

    // accent line teal
    doc.setFillColor(...TEAL);
    doc.rect(0, footerY, pw, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('PEYU Chile SpA', 15, footerY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...CREAM);
    doc.text(safeTxt('Plastico que renace - Providencia - Macul'), 15, footerY + 14);

    doc.setTextColor(200, 215, 225);
    doc.setFontSize(7);
    doc.text(safeTxt('peyuchile.cl'), pw - 15, footerY + 9, { align: 'right' });
    doc.text(safeTxt('+56 9 3504 0242 - ventas@peyuchile.cl'), pw - 15, footerY + 14, { align: 'right' });

    // ═══════════════════════════════════════════════════
    //  ENCODING + RETURN
    // ═══════════════════════════════════════════════════

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