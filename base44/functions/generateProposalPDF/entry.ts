import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ============================================================================
// generateProposalPDF — PDF premium ECO de propuesta corporativa PEYU (2026)
// ----------------------------------------------------------------------------
// Rediseño total: layout limpio con grid de márgenes consistente, logo cuadrado
// alineado, precios perfectamente justificados a la derecha, paleta ecológica
// (verdes naturales + arena), jerarquía tipográfica clara y secciones aireadas.
// ----------------------------------------------------------------------------

// ─── Paleta ECO PEYU 2026 (RGB) — mejorada con más contraste ───
const INK    = [44, 24, 16];     // #2C1810 — Tinta oficial Manual de Marca Peyu
const FOREST = [11, 70, 52];     // #0B4634 — verde bosque más saturado
const TEAL   = [15, 139, 108];   // #0F8B6C — verde PEYU signature
const LEAF   = [52, 168, 128];   // #34A880 — verde hoja cálido
const MINT   = [235, 248, 244];  // #EBF8F4 — menta premium (fondos)
const SAND   = [250, 246, 238];  // #FAF6EE — arena premium (cards)
const SAND2  = [220, 210, 195];  // #DCD2C3 — borde arena refinado
const STONE  = [100, 110, 104];  // #646E68 — gris piedra cálido
const STONE2 = [140, 150, 145];  // #8C9691 — labels premium
const CREAM  = [170, 220, 205];  // #AADCCD — crema eco refined
const WHITE  = [255, 255, 255];

// Márgenes del documento (grid consistente)
const MX = 16;                   // margen lateral

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// Logo oficial PEYU (tortuga + PEYU tinta) — Manual de Marca Peyu.
// Se renderiza sobre chip arena claro para contraste sobre el hero verde.
const PEYU_LOGO_URL = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/cead5fbd1_image.png';

// jsPDF/Helvetica solo soporta WinAnsi. Limpia el texto preservando ñ/tildes.
function safeTxt(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/[✓✔☑]/g, '>')
    .replace(/[✗✘❌]/g, 'x')
    .replace(/[♻]/g, '[R]')
    .replace(/[🌍🌎🌏🌱🌿🍃🌳]/g, '')
    .replace(/[🔋⚡]/g, '')
    .replace(/[🛡️🛡]/g, '')
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

    // Helper: descarga una imagen y la devuelve en base64.
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

    const itemImages = {};
    await Promise.all(items.map(async (it, idx) => {
      const u = it.imagen_url || '';
      if (/^https?:\/\//i.test(u)) {
        try { itemImages[idx] = await fetchImageAsBase64(u); } catch { /* sin imagen */ }
      }
    }));

    let peyuLogo = null;
    try { peyuLogo = await fetchImageAsBase64(PEYU_LOGO_URL); } catch { /* fallback a texto */ }
    let clientLogo = null;
    if (/^https?:\/\//i.test(p.logo_url || '')) {
      try { clientLogo = await fetchImageAsBase64(p.logo_url); } catch { /* sin logo cliente */ }
    }

    // Garantía contextual.
    const esSoloCompostable = items.length > 0 && items.every(it => {
      const txt = `${it?.nombre || it?.name || ''} ${it?.sku || ''} ${it?.material || ''} ${it?.categoria || ''}`.toLowerCase();
      return /carcasa|compostable|trigo|fibra/.test(txt);
    });
    const garantiaLabel = esSoloCompostable ? 'Compostable industrial' : 'Garantia 10 anos';
    const garantiaTermino = esSoloCompostable
      ? 'Material compostable industrial. Las carcasas se compostan en 2-3 anos al fin de su vida util.'
      : 'Garantia de 10 anos contra defectos de fabricacion en plastico reciclado.';
    const fechaEnvio = p.fecha_envio || new Date().toISOString().split('T')[0];
    const fechaVenc = p.fecha_vencimiento || '';

    const baseUrl = (req.headers.get('origin') || 'https://peyuchile.cl').replace(/\/$/, '');
    const acceptUrl = `${baseUrl}/b2b/propuesta?id=${proposalId}&action=accept`;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();   // 210
    const ph = doc.internal.pageSize.getHeight();  // 297
    const RX = pw - MX;                            // borde derecho (194)
    const CW = pw - MX * 2;                        // ancho útil (178)
    let y = 0;

    // jsPDF 4.x eliminó doc.setGlobalAlpha. Para sombras semitransparentes se
    // usa GState (saveGraphicsState → setGState(opacity) → restoreGraphicsState).
    // Helper resiliente: si la versión no soporta GState, dibuja sin opacidad.
    const shadowRect = (x, yy, w, h, r) => {
      doc.setFillColor(0, 0, 0);
      try {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.07 }));
        doc.roundedRect(x, yy, w, h, r, r, 'F');
        doc.restoreGraphicsState();
      } catch {
        // Sin soporte de opacidad: omitimos la sombra para no romper el PDF.
      }
    };

    // helper de texto rápido con suavizado mejorado
    const T = (txt, x, yy, { size = 9, font = 'normal', color = INK, align = 'left', spacing = 0, maxWidth = 999 } = {}) => {
      doc.setFont('helvetica', font);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setLineDash([]);
      if (spacing) doc.setCharSpace(spacing);
      doc.text(safeTxt(txt), x, yy, { align, maxWidth });
      if (spacing) doc.setCharSpace(0);
    };

    // ═══════════════════════════════════════════════════
    //  HERO — encabezado ecológico
    // ═══════════════════════════════════════════════════
    const heroH = 72;
    doc.setFillColor(...FOREST);
    doc.rect(0, 0, pw, heroH, 'F');
    // Capa orgánica de profundidad (círculos suaves a la derecha)
    doc.setFillColor(...TEAL);
    doc.circle(pw - 6, 10, 34, 'F');
    doc.setFillColor(...LEAF);
    doc.circle(pw + 6, heroH - 4, 26, 'F');
    // Banda inferior con gradiente eco (separa hero del cuerpo)
    doc.setFillColor(...CREAM);
    doc.rect(0, heroH, pw, 2, 'F');
    doc.setFillColor(...MINT);
    doc.rect(0, heroH + 2, pw, 1, 'F');

    // Logo PEYU completo (tortuga + PEYU tinta) — chip arena vertical (logo vertical)
    const lgW = 24, lgH = 32, lgX = MX, lgY = 8;
    shadowRect(lgX + 0.5, lgY + 0.5, lgW, lgH, 4);

    if (peyuLogo) {
     try {
       doc.setFillColor(...SAND);
       doc.roundedRect(lgX, lgY, lgW, lgH, 4, 4, 'F');
       doc.addImage(`data:image/${peyuLogo.fmt.toLowerCase()};base64,${peyuLogo.b64}`, peyuLogo.fmt, lgX + 2, lgY + 2, lgW - 4, lgH - 4);
     } catch {
       T('PEYU', lgX, lgY + 20, { size: 22, font: 'bold', color: WHITE });
     }
    } else {
     T('PEYU', lgX, lgY + 20, { size: 22, font: 'bold', color: WHITE });
    }

    // Tagline al lado del logo (el logo oficial ya incluye "PEYU")
    T('Plastico que renace - 100% reciclado', lgX + lgW + 5, lgY + 12, { size: 8, font: 'normal', color: CREAM });
    T('Hecho en Chile', lgX + lgW + 5, lgY + 18, { size: 7, font: 'bold', color: CREAM });

    // Bloque N° propuesta (derecha, alineado al margen)
    T('PROPUESTA N°', RX, lgY + 6, { size: 7, font: 'bold', color: CREAM, align: 'right', spacing: 1 });
    T(p.numero || '-', RX, lgY + 14, { size: 14, font: 'bold', color: WHITE, align: 'right' });

    // Título grande
    T('Propuesta Comercial', MX, 50, { size: 22, font: 'bold', color: WHITE });
    T(`Preparada para ${(p.empresa || 'Cliente').substring(0, 40)}`, MX, 59, { size: 10, font: 'normal', color: [210, 228, 220] });

    // Fechas (derecha)
    T(`Emision  ${fechaEnvio}`, RX, 50, { size: 8, font: 'normal', color: [210, 228, 220], align: 'right' });
    if (fechaVenc) T(`Valida hasta  ${fechaVenc}`, RX, 56, { size: 8, font: 'normal', color: [210, 228, 220], align: 'right' });
    T('100% reciclado - Hecho en Chile', RX, 64, { size: 7, font: 'bold', color: CREAM, align: 'right', spacing: 0.5 });

    y = heroH + 12;

    // ═══════════════════════════════════════════════════
    //  CARD: CLIENTE + TOTAL
    // ═══════════════════════════════════════════════════
    const cardH = 46;
    // Sombra suave de card
    shadowRect(MX + 1, y + 1, CW, cardH, 4);

    doc.setFillColor(...SAND);
    doc.roundedRect(MX, y, CW, cardH, 4, 4, 'F');
    // Acento vertical eco a la izquierda con sombra
    doc.setFillColor(...TEAL);
    doc.roundedRect(MX, y, 2.5, cardH, 1, 1, 'F');

    const cpadX = MX + 8;
    // Columna cliente
    T('CLIENTE', cpadX, y + 9, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    T((p.empresa || '-').substring(0, 38), cpadX, y + 17, { size: 13, font: 'bold', color: INK });
    T((p.contacto || '-').substring(0, 48), cpadX, y + 23.5, { size: 8.5, font: 'normal', color: STONE });
    let fY = y + 23.5;
    if (p.email) { fY += 4.5; T(p.email.substring(0, 48), cpadX, fY, { size: 8.5, font: 'normal', color: STONE }); }
    if (p.giro) { fY += 4.5; T(`Giro: ${p.giro}`.substring(0, 46), cpadX, fY, { size: 7.5, color: STONE }); }
    if (p.direccion_facturacion) { fY += 4.5; T(`Facturacion: ${p.direccion_facturacion}`.substring(0, 46), cpadX, fY, { size: 7.5, color: STONE }); }

    // Logo cliente destacado (si existe)
    if (clientLogo) {
      try {
        const cl = 24, clx = pw / 2, cly = y + 5;
        // Fondo con sombra
        shadowRect(clx - cl/2 + 0.5, cly + 0.5, cl, cl, 3);
        // Card blanca
        doc.setFillColor(...WHITE);
        doc.roundedRect(clx - cl/2, cly, cl, cl, 3, 3, 'F');
        // Borde teal
        doc.setDrawColor(...TEAL);
        doc.setLineWidth(1.2);
        doc.roundedRect(clx - cl/2, cly, cl, cl, 3, 3, 'S');
        // Imagen
        doc.addImage(`data:image/${clientLogo.fmt.toLowerCase()};base64,${clientLogo.b64}`, clientLogo.fmt, clx - cl/2 + 2, cly + 2, cl - 4, cl - 4);
        T('LOGO CLIENTE', clx, cly + cl + 5, { size: 6, font: 'bold', color: TEAL, align: 'center' });
      } catch { /* sin logo */ }
    }

    // Columna total (derecha, justificado). Claridad total: neto + IVA = total.
    T('MONTO TOTAL', RX - 8, y + 9, { size: 7, font: 'bold', color: TEAL, align: 'right', spacing: 1 });
    T(fmtCLP(p.total), RX - 8, y + 21, { size: 21, font: 'bold', color: FOREST, align: 'right' });
    T('CLP (incluye IVA 19% · ver detalle)', RX - 8, y + 27, { size: 7, font: 'normal', color: STONE, align: 'right' });

    y += cardH + 6;

    // ── Strip de métricas (4 columnas alineadas) ──
    const mH = 18;
    doc.setFillColor(...MINT);
    doc.roundedRect(MX, y, CW, mH, 3, 3, 'F');
    const metrics = [
      ['LEAD TIME', `${p.lead_time_dias || 7} dias`],
      ['ANTICIPO', `${p.anticipo_pct || 50}%`],
      ['VALIDEZ', `${p.validity_days || 15} dias`],
      ['ITEMS', `${items.length}`],
    ];
    const mCol = CW / 4;
    metrics.forEach((m, i) => {
      const cx = MX + i * mCol + mCol / 2;
      T(m[0], cx, y + 7, { size: 6, font: 'bold', color: STONE2, align: 'center', spacing: 0.6 });
      T(m[1], cx, y + 13.5, { size: 11, font: 'bold', color: FOREST, align: 'center' });
      if (i > 0) { // separadores verticales
        doc.setDrawColor(...CREAM); doc.setLineWidth(0.3);
        doc.line(MX + i * mCol, y + 4, MX + i * mCol, y + mH - 4);
      }
    });

    y += mH + 10;

    // ═══════════════════════════════════════════════════
    //  RELATO DE MARCA — el viaje eco
    // ═══════════════════════════════════════════════════
    const relatoH = 22;
    doc.setFillColor(...MINT);
    doc.roundedRect(MX, y, CW, relatoH, 3, 3, 'F');
    doc.setFillColor(...LEAF);
    doc.roundedRect(MX, y, 2.5, relatoH, 1, 1, 'F');
    T('TU REGALO TIENE UNA HISTORIA', MX + 8, y + 7, { size: 7, font: 'bold', color: TEAL, spacing: 0.8 });
    T('Cada producto PEYU nace de tapitas plasticas que rescatamos del mar y de la calle. Las fundimos,', MX + 8, y + 12.5, { size: 8, color: STONE });
    T('moldeamos y grabamos tu logo con laser: un objeto util que cuenta que tu marca elige cuidar el', MX + 8, y + 16.5, { size: 8, color: STONE });
    T('planeta. No regalas un objeto, regalas un gesto.', MX + 8, y + 20.5, { size: 8, color: STONE });
    y += relatoH + 10;

    // ═══════════════════════════════════════════════════
    //  MOCKUP + ESG (dos columnas)
    // Solo se muestra si existe un mockup REAL del cliente o una foto del
    // producto. Si la propuesta fue rápida (sin personalización), no se
    // inventa ninguna imagen.
    // Prioridad: 1) mockup del cliente en items, 2) mockup_urls de la propuesta
    // (solo si fue generado, no es placeholder), 3) foto del producto del item.
    // ═══════════════════════════════════════════════════
    {
      // Determinar la mejor imagen a mostrar (o null si no hay ninguna real)
      let imagenMockup = null; // { url, esReal } esReal=true si es mockup del cliente
      let captionMockup = '';

      // 1) Mockup real del cliente: buscamos en items_detalle o en items del JSON
      const itemConMockup = items.find((it) => it.mockup_url && /^https?:\/\//i.test(it.mockup_url));
      if (itemConMockup) {
        imagenMockup = { url: itemConMockup.mockup_url, esReal: true };
        captionMockup = 'Mockup aprobado por el cliente';
      }

      // 2) mockup_urls de la propuesta — solo si es URL base44 (subida por nosotros, no generada por el sistema)
      if (!imagenMockup && p.mockup_urls?.length > 0) {
        const urlMockup = p.mockup_urls[0];
        if (/^https?:\/\//i.test(urlMockup)) {
          imagenMockup = { url: urlMockup, esReal: true };
          captionMockup = 'Vista previa del grabado laser UV';
        }
      }

      // 3) Si no hay mockup del cliente pero hay foto del producto del 1er item
      if (!imagenMockup) {
        const primerItem = items[0];
        const fotoProducto = primerItem?.imagen_url || '';
        if (/^https?:\/\//i.test(fotoProducto)) {
          imagenMockup = { url: fotoProducto, esReal: false };
          captionMockup = 'Foto referencial del producto';
        }
      }

      // Render solo si hay imagen real
      if (imagenMockup) {
        T('VISTA PREVIA Y BENEFICIOS', MX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
        y += 6;

        const colGap = 6;
        const mockW = (CW - colGap) * 0.46;
        const esgW = CW - colGap - mockW;
        const boxH = 76;

        // Box de imagen
        doc.setFillColor(...SAND);
        doc.roundedRect(MX, y, mockW, boxH, 3, 3, 'F');
        try {
          const { b64, fmt } = await fetchImageAsBase64(imagenMockup.url);
          doc.addImage(`data:image/${fmt.toLowerCase()};base64,${b64}`, fmt, MX + 2, y + 2, mockW - 4, boxH - 10);
        } catch {
          T('Imagen no disponible', MX + mockW / 2, y + boxH / 2, { size: 8, color: STONE2, align: 'center' });
        }
        T(captionMockup, MX + mockW / 2, y + boxH - 3.5, { size: 6.5, color: STONE, align: 'center' });

        // ESG card
        const esgX = MX + mockW + colGap;
        doc.setFillColor(...TEAL);
        doc.roundedRect(esgX, y, esgW, boxH, 3, 3, 'F');
        T('IMPACTO ESG', esgX + 6, y + 9, { size: 6.5, font: 'bold', color: CREAM, spacing: 1 });
        T('Compra con', esgX + 6, y + 19, { size: 13, font: 'bold', color: WHITE });
        T('proposito.', esgX + 6, y + 26, { size: 13, font: 'bold', color: WHITE });
        const esgLines = [
          esSoloCompostable ? 'Fibra de trigo / compostable' : '100% plastico reciclado',
          'Hecho en Chile',
          'Energia renovable',
          garantiaLabel,
          'Reduce tu huella corporativa',
        ];
        esgLines.forEach((l, i) => {
          T('>', esgX + 6, y + 38 + i * 6.5, { size: 8, font: 'bold', color: CREAM });
          T(l, esgX + 10, y + 38 + i * 6.5, { size: 8, color: WHITE });
        });

        y += boxH + 12;
      } else {
        // Sin imagen: solo mostrar la card ESG en ancho completo
        T('IMPACTO ESG', MX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
        y += 6;
        const esgH = 38;
        doc.setFillColor(...TEAL);
        doc.roundedRect(MX, y, CW, esgH, 3, 3, 'F');
        T('Compra con proposito.', MX + 8, y + 13, { size: 13, font: 'bold', color: WHITE });
        const esgLines = [
          esSoloCompostable ? 'Fibra de trigo / compostable' : '100% plastico reciclado',
          'Hecho en Chile',
          'Energia renovable',
          garantiaLabel,
          'Reduce tu huella corporativa',
        ];
        const mid = Math.ceil(esgLines.length / 2);
        esgLines.forEach((l, i) => {
          const colX = i < mid ? MX + 8 : MX + CW / 2 + 6;
          const rowY = y + 23 + (i % mid) * 5.5;
          T('>', colX, rowY, { size: 8, font: 'bold', color: CREAM });
          T(l, colX + 4, rowY, { size: 8, color: WHITE });
        });
        y += esgH + 10;
      }
    }

    // ═══════════════════════════════════════════════════
    //  TABLA DE ITEMS — coordenadas de columna fijas
    // ═══════════════════════════════════════════════════
    if (y > ph - 80) { doc.addPage(); y = 20; }

    T('DETALLE TECNICO Y ECONOMICO', MX, y, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    y += 6;

    // Columnas (X fijos para alineación perfecta) — agregamos columna para NETO label
    const COL_PROD = MX + 22;     // nombre tras la miniatura
    const COL_CANT = MX + 98;     // centrado
    const COL_UNIT = MX + 132;    // derecha
    const COL_DESC = MX + 148;    // centrado
    const COL_TOT  = RX;          // derecha

    // Header oscuro
    doc.setFillColor(...INK);
    doc.roundedRect(MX, y, CW, 9, 2, 2, 'F');
    T('PRODUCTO', COL_PROD, y + 6, { size: 7, font: 'bold', color: WHITE, spacing: 0.4 });
    T('CANT.', COL_CANT, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'center' });
    T('UNITARIO (NETO)', COL_UNIT, y + 6, { size: 6.5, font: 'bold', color: WHITE, align: 'right' });
    T('DESC.', COL_DESC, y + 6, { size: 7, font: 'bold', color: WHITE, align: 'center' });
    T('TOTAL (NETO)', COL_TOT, y + 6, { size: 6.5, font: 'bold', color: WHITE, align: 'right' });
    y += 12;

    items.forEach((it, i) => {
      const rowH = 20;
      if (y - 4 + rowH > ph - 38) { doc.addPage(); y = 20; }

      // Fondo alternado: blanco / menta suave
      if (i % 2 === 0) {
        doc.setFillColor(...MINT);
        doc.roundedRect(MX, y - 4, CW, rowH, 1.5, 1.5, 'F');
      } else {
        doc.setFillColor(...WHITE);
        doc.roundedRect(MX, y - 4, CW, rowH, 1.5, 1.5, 'F');
      }

      // Línea divisoria sutil
      doc.setDrawColor(...SAND2);
      doc.setLineWidth(0.2);
      doc.line(MX, y + rowH - 4, RX, y + rowH - 4);

      // Thumbnail premium
      const imgX = MX + 3, imgY = y - 2, imgS = 16;
      doc.setFillColor(...SAND);
      doc.roundedRect(imgX, imgY, imgS, imgS, 2.5, 2.5, 'F');
      doc.setDrawColor(...SAND2);
      doc.setLineWidth(0.4);
      doc.roundedRect(imgX, imgY, imgS, imgS, 2.5, 2.5, 'S');
      const img = itemImages[i];
      if (img) {
        try { doc.addImage(`data:image/${img.fmt.toLowerCase()};base64,${img.b64}`, img.fmt, imgX + 1, imgY + 1, imgS - 2, imgS - 2); } catch { /* */ }
      }

      const tY = y + 4;
      // Nombre + meta
      T(safeTxt(it.nombre || it.name || it.producto || '-').substring(0, 32), COL_PROD, tY - 1.5, { size: 10, font: 'bold', color: INK });
      const meta = [it.sku ? `SKU ${it.sku}` : '', it.categoria || '', it.tier ? `Tramo ${it.tier}` : ''].filter(Boolean).join('  -  ');
      if (meta) T(meta.substring(0, 48), COL_PROD, tY + 3, { size: 6.8, color: STONE2 });
      if (it.personalizacion) T('▸ Grabado laser UV incluido', COL_PROD, tY + 6.5, { size: 6.8, font: 'bold', color: TEAL });

      // Cant (centrado)
      T(`${it.cantidad || it.qty || 0}`, COL_CANT, tY, { size: 10, font: 'bold', color: STONE, align: 'center' });
      // Unitario (derecha)
      T(fmtCLP(it.precio_unitario), COL_UNIT, tY, { size: 10, font: 'bold', color: INK, align: 'right' });
      // Descuento (centrado)
      T(it.descuento_pct ? `-${it.descuento_pct}%` : '-', COL_DESC, tY, { size: 9, font: 'bold', color: it.descuento_pct ? TEAL : STONE2, align: 'center' });
      // Total (derecha) — resaltado
      T(fmtCLP(it.line_total || (it.precio_unitario * (it.cantidad || it.qty))), COL_TOT, tY, { size: 10, font: 'bold', color: FOREST, align: 'right' });

      y += rowH;
    });

    // ═══════════════════════════════════════════════════
    //  TOTALES — bloque alineado a la derecha
    // ═══════════════════════════════════════════════════
    y += 4;
    const fee = p.fee_personalizacion > 0 ? p.fee_personalizacion : 0;
    const netoBase = (p.subtotal || 0) + fee + (p.fee_packaging > 0 ? p.fee_packaging : 0);
    const ivaCalc = Math.max(0, Math.round((p.total || netoBase) - netoBase));

    const TOT_LABEL_X = pw - 78;   // etiquetas
    const TOT_VAL_X = RX;          // valores justificados a la derecha
    const totRow = (label, val, { big = false, color = STONE, valColor = INK } = {}) => {
      T(label, TOT_LABEL_X, y, { size: big ? 12 : 9, font: big ? 'bold' : 'normal', color });
      T(fmtCLP(val), TOT_VAL_X, y, { size: big ? 13 : 9.5, font: 'bold', color: valColor, align: 'right' });
      y += big ? 9 : 6;
    };

    if (p.subtotal) totRow('Subtotal neto', p.subtotal);
    if (fee > 0) totRow('Fee personalizacion (neto)', fee);
    if (p.fee_packaging > 0) totRow('Fee packaging (neto)', p.fee_packaging);
    if (p.descuento_pct > 0) totRow(`Descuento ${p.descuento_pct}% (neto)`, -(p.descuento || 0));

    // Separador antes de IVA
    y += 2;
    doc.setDrawColor(...SAND2);
    doc.setLineWidth(0.5);
    doc.line(TOT_LABEL_X, y, TOT_VAL_X, y);
    y += 6;

    // Total neto (resaltado)
    totRow('Subtotal neto', netoBase, { color: FOREST, valColor: FOREST });
    // IVA — línea clara
    totRow('+ IVA 19%', ivaCalc, { color: STONE, valColor: TEAL });

    y += 1.5;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.8);
    doc.line(TOT_LABEL_X, y, TOT_VAL_X, y);
    y += 7;
    totRow('TOTAL FINAL (CON IVA)', p.total, { big: true, color: FOREST, valColor: FOREST });

    // ═══════════════════════════════════════════════════
    //  CTA ACEPTACIÓN DIGITAL
    // ═══════════════════════════════════════════════════
    if (y > ph - 60) { doc.addPage(); y = 20; }
    y += 4;
    const ctaH = 26;
    doc.setFillColor(...FOREST);
    doc.roundedRect(MX, y, CW, ctaH, 4, 4, 'F');
    doc.setFillColor(...TEAL);
    doc.circle(MX + CW - 8, y + 4, 14, 'F');

    T('ACEPTAR EN UN CLIC', MX + 8, y + 9, { size: 7, font: 'bold', color: CREAM, spacing: 1 });
    T('Acepta esta propuesta online', MX + 8, y + 17, { size: 12, font: 'bold', color: WHITE });
    T('Activa la produccion al instante', MX + 8, y + 22.5, { size: 7.5, color: CREAM });

    // Botón blanco con link
    const btnW = 50, btnX = RX - btnW - 4, btnY = y + 7;
    doc.setFillColor(...WHITE);
    doc.roundedRect(btnX, btnY, btnW, 12, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...FOREST);
    doc.textWithLink(safeTxt('ACEPTAR ONLINE >'), btnX + btnW / 2, btnY + 7.8, { url: acceptUrl, align: 'center' });

    y += ctaH + 8;

    // ═══════════════════════════════════════════════════
    //  MÉTODO DE ENTREGA
    // ═══════════════════════════════════════════════════
    if (y > ph - 40) { doc.addPage(); y = 20; }
    const esRetiro = (p.metodo_entrega || '').toLowerCase().includes('retiro');
    const delH = 22;
    doc.setFillColor(...MINT);
    doc.roundedRect(MX, y, CW, delH, 3, 3, 'F');
    doc.setFillColor(...TEAL);
    doc.roundedRect(MX, y, 2.5, delH, 1, 1, 'F');

    T('METODO DE ENTREGA', MX + 8, y + 7, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    T(esRetiro ? 'Retiro en tienda' : 'Despacho a domicilio', MX + 8, y + 14, { size: 11, font: 'bold', color: FOREST });
    const lugar = esRetiro
      ? 'Av. Quilin 3340, Macul - Santiago (con cita previa)'
      : `${p.direccion_entrega || 'Direccion a confirmar'}${p.comuna_entrega ? ', ' + p.comuna_entrega : ''}`;
    T(lugar.substring(0, 88), MX + 8, y + 19, { size: 8, color: STONE });

    y += delH + 8;

    // ═══════════════════════════════════════════════════
    //  CONDICIONES
    // ═══════════════════════════════════════════════════
    if (y > ph - 58) { doc.addPage(); y = 20; }
    const conds = [
      'Retiro en tienda: 50% al confirmar, 50% contra entrega.',
      'Despacho a domicilio: abono del 100% al confirmar.',
      'Segunda compra del cliente: opcion de pago a 30 dias.',
      `Entrega en ${p.lead_time_dias || 7} dias habiles desde el pago y aprobacion de mockup.`,
      garantiaTermino,
      'Grabado laser UV gratis desde 10 unidades. Area estandar 40x25mm.',
      esRetiro
        ? 'Retiro en tienda sin costo, coordinado por email cuando este listo.'
        : 'Despacho a todo Chile via Starken / Chilexpress / BlueExpress.',
      `Propuesta valida por ${p.validity_days || 15} dias desde la emision.`,
    ];
    const condH = 18 + conds.length * 5.8;
    doc.setFillColor(...SAND);
    doc.roundedRect(MX, y, CW, condH, 3, 3, 'F');
    T('TERMINOS Y CONDICIONES', MX + 8, y + 8, { size: 7, font: 'bold', color: STONE2, spacing: 1 });
    conds.forEach((c, i) => {
      const cy = y + 16 + i * 5.8;
      T('>', MX + 8, cy, { size: 8, font: 'bold', color: TEAL });
      T(c, MX + 12.5, cy, { size: 8, color: STONE });
    });

    y += condH + 8;

    // ═══════════════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════════════
    const footerY = ph - 20;
    doc.setFillColor(...INK);
    doc.rect(0, footerY, pw, 20, 'F');
    doc.setFillColor(...TEAL);
    doc.rect(0, footerY, pw, 1.5, 'F');

    T('PEYU Chile SpA', MX, footerY + 7, { size: 10, font: 'bold', color: WHITE });
    T('RUT 77.069.974-6 - Giro: produccion y reciclaje', MX, footerY + 12, { size: 7, color: CREAM });
    T('Pedro de Valdivia 6603, Macul - F. Bilbao 3775, Providencia', MX, footerY + 16.5, { size: 6.5, color: CREAM });
    T('peyuchile.cl', RX, footerY + 7, { size: 9, font: 'bold', color: WHITE, align: 'right' });
    T('ventas@peyuchile.cl', RX, footerY + 12, { size: 7, color: [210, 228, 220], align: 'right' });
    T('WhatsApp +56 9 3504 0242', RX, footerY + 16.5, { size: 7, font: 'bold', color: CREAM, align: 'right' });

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