// ════════════════════════════════════════════════════════════════════════
// peyu-manual-pdf — Genera el Manual de Marca de Peyu como PDF diseñado
// (formato slide horizontal, mismo lenguaje que el manual de referencia):
// portada → relato → por qué → concepto → paletas → tipografía → aplicaciones
// → viaje → usos → versión minimalista → gracias.
// ════════════════════════════════════════════════════════════════════════
import { jsPDF } from 'jspdf';
import {
  LOGO_OFICIAL, RELATO, POR_QUE_TORTUGA, POR_QUE_NOMBRE, CONCEPTO,
  PALETA_PRINCIPAL, PALETA_SECUNDARIA, TIPOGRAFIA, FORMAS,
  APLICACIONES, VIAJE, USOS,
} from '@/lib/peyu-brand-manual';

const FOREST = [11, 70, 52], TEAL = [15, 139, 108], MINT = [167, 217, 201],
  CREAM = [248, 243, 237], ARENA = [231, 216, 198], TERRA = [217, 107, 77],
  INK = [44, 24, 16], WHITE = [255, 255, 255];

const W = 297, H = 210, MX = 18;

const safe = (s) => String(s ?? '')
  .replace(/[🐢🌊🛡️🏠🇨🇱✨]/gu, '').replace(/[–—]/g, '-')
  .replace(/[""«»]/g, '"').replace(/['']/g, "'").replace(/…/g, '...')
  .replace(/→/g, '>').replace(/·/g, '-').replace(/[^\x20-\xFF]/g, '');

async function toDataURL(url) {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
  } catch { return null; }
}

export async function generarManualPeyuPDF() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const logo = await toDataURL(LOGO_OFICIAL);

  const T = (txt, x, y, { size = 10, font = 'normal', color = CREAM, align = 'left', spacing = 0, maxW = 0 } = {}) => {
    doc.setFont('helvetica', font); doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    if (spacing) doc.setCharSpace(spacing);
    if (maxW) doc.text(doc.splitTextToSize(safe(txt), maxW), x, y, { align });
    else doc.text(safe(txt), x, y, { align });
    if (spacing) doc.setCharSpace(0);
  };

  // Fondo + anillos decorativos (lenguaje del manual de referencia)
  const bg = (dark = true) => {
    doc.setFillColor(...(dark ? FOREST : CREAM)); doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(...(dark ? [255, 255, 255] : ARENA));
    doc.setLineWidth(3);
    if (dark) { doc.setDrawColor(255, 255, 255); }
    // anillos esquinas (opacidad simulada con tonos)
    doc.setDrawColor(...(dark ? [34, 96, 76] : [238, 227, 212]));
    doc.circle(-8, -8, 40, 'S'); doc.circle(-8, -8, 52, 'S');
    doc.circle(W + 8, H + 8, 40, 'S'); doc.circle(W + 8, H + 8, 52, 'S');
    doc.setLineWidth(0.2);
  };

  // Header de sección (label izq + logo card der)
  const header = (label, dark = true) => {
    T(label, MX, 22, { size: 13, font: 'bold', color: dark ? CREAM : INK, spacing: 0.6 });
    doc.setFillColor(...TEAL); doc.roundedRect(MX, 26, 24, 1.4, 0.7, 0.7, 'F');
    if (logo) {
      doc.setFillColor(...CREAM); doc.roundedRect(W - MX - 44, 12, 44, 14, 3, 3, 'F');
      try { doc.addImage(logo, 'PNG', W - MX - 41, 14.5, 38, 9); } catch { /* noop */ }
    }
  };

  const footer = (n) => {
    T('MANUAL DE MARCA - PEYU LA TORTUGA', MX, H - 8, { size: 6.5, color: MINT, spacing: 1 });
    T(String(n).padStart(2, '0'), W - MX, H - 8, { size: 8, font: 'bold', color: MINT, align: 'right' });
  };

  // ═══ 1 · PORTADA ═══
  bg(true);
  T('"Peyu" la Mascota de', W / 2, 62, { size: 30, font: 'bold', color: WHITE, align: 'center' });
  if (logo) {
    doc.setFillColor(...CREAM); doc.roundedRect(W / 2 - 62, 80, 124, 42, 6, 6, 'F');
    try { doc.addImage(logo, 'PNG', W / 2 - 54, 88, 108, 26); } catch { /* noop */ }
  } else {
    T('PEYU', W / 2, 105, { size: 44, font: 'bold', color: WHITE, align: 'center' });
  }
  T('Manual de Marca de la Mascota - Edicion 2026', W / 2, 138, { size: 11, color: MINT, align: 'center' });
  T('"Hasta que el plastico deje de ser basura"', W / 2, 148, { size: 10, font: 'italic', color: ARENA, align: 'center' });
  footer(1);

  // ═══ 2 · RELATO ═══
  doc.addPage(); bg(true); header('RELATO MASCOTA');
  T(RELATO.titulo, MX, 42, { size: 12, font: 'bold', color: WHITE });
  let y = 54;
  RELATO.parrafos.forEach((p) => {
    T('-', MX + 2, y, { size: 10, font: 'bold', color: MINT });
    T(p, MX + 9, y, { size: 9.5, color: CREAM, maxW: W - MX * 2 - 12 });
    y += doc.splitTextToSize(safe(p), W - MX * 2 - 12).length * 4.6 + 4.5;
  });
  footer(2);

  // ═══ 3 · POR QUÉ ═══
  doc.addPage(); bg(true); header('RELATO MASCOTA');
  T('POR QUE UNA TORTUGA?', MX, 42, { size: 13, font: 'bold', color: WHITE });
  y = 52;
  POR_QUE_TORTUGA.forEach((it) => {
    doc.setFillColor(...TEAL); doc.circle(MX + 3, y - 1.2, 1.5, 'F');
    T(`${it.titulo}: `, MX + 9, y, { size: 10, font: 'bold', color: MINT });
    T(it.texto, MX + 9, y + 5, { size: 9, color: CREAM, maxW: W - MX * 2 - 12 });
    y += 15;
  });
  T('por que "Peyu"?', MX, y + 6, { size: 12, font: 'bold', color: WHITE });
  y += 15;
  POR_QUE_NOMBRE.forEach((p) => {
    doc.setFillColor(...TERRA); doc.circle(MX + 3, y - 1.2, 1.5, 'F');
    T(p, MX + 9, y, { size: 9, color: CREAM, maxW: W - MX * 2 - 12 });
    y += 9;
  });
  footer(3);

  // ═══ 4 · CONCEPTO ═══
  doc.addPage(); bg(true); header('CONCEPTO MASCOTA');
  T(`Nombre: ${CONCEPTO.nombre}`, MX, 44, { size: 11, color: CREAM });
  T(`Especie: ${CONCEPTO.especie}`, MX, 51, { size: 11, color: CREAM });
  T(CONCEPTO.descripcion, MX, 63, { size: 10, color: CREAM, maxW: W - MX * 2 });
  T('Sus rasgos principales son:', MX, 82, { size: 10.5, font: 'bold', color: WHITE });
  y = 92;
  CONCEPTO.rasgos.forEach((r) => {
    doc.setFillColor(...TEAL); doc.circle(MX + 3, y - 1.2, 1.5, 'F');
    T(`${r.rasgo}  >  ${r.arrow}`, MX + 9, y, { size: 10, color: CREAM });
    y += 10;
  });
  footer(4);

  // ═══ 5 · PALETA PRINCIPAL ═══
  doc.addPage(); bg(true); header('PALETA DE COLORES MASCOTA');
  T('Color', MX, 44, { size: 9, font: 'bold', color: MINT });
  T('Uso', MX + 78, 44, { size: 9, font: 'bold', color: MINT });
  T('HEX', MX + 178, 44, { size: 9, font: 'bold', color: MINT });
  T('RGB', MX + 214, 44, { size: 9, font: 'bold', color: MINT });
  y = 55;
  PALETA_PRINCIPAL.forEach((c) => {
    const rgb = c.rgb.split(',').map((n) => parseInt(n, 10));
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.setDrawColor(...CREAM); doc.setLineWidth(0.4);
    doc.roundedRect(MX, y - 5, 10, 7, 1.5, 1.5, 'FD');
    T(c.nombre, MX + 14, y, { size: 9.5, color: CREAM });
    T(c.uso, MX + 78, y, { size: 9, color: CREAM });
    T(c.hex, MX + 178, y, { size: 9.5, font: 'bold', color: WHITE });
    T(c.rgb, MX + 214, y, { size: 9, color: CREAM });
    y += 13;
  });
  footer(5);

  // ═══ 6 · PALETA SECUNDARIA + TIPOGRAFÍA ═══
  doc.addPage(); bg(true); header('PALETA SECUNDARIA / TIPOGRAFIA');
  y = 46;
  PALETA_SECUNDARIA.forEach((c) => {
    const hex = c.hex.replace('#', '');
    doc.setFillColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    doc.setDrawColor(...CREAM); doc.roundedRect(MX, y - 5, 10, 7, 1.5, 1.5, 'FD');
    T(`${c.nombre} - ${c.uso}`, MX + 14, y, { size: 9.5, color: CREAM });
    T(c.hex, W - MX, y, { size: 9.5, font: 'bold', color: WHITE, align: 'right' });
    y += 12;
  });
  T('TIPOGRAFIA', MX, y + 8, { size: 11, font: 'bold', color: WHITE }); y += 18;
  TIPOGRAFIA.forEach((t) => {
    T(t.fuente, MX, y, { size: 10.5, font: 'bold', color: MINT });
    T(t.rol, MX + 55, y, { size: 9, color: CREAM, maxW: W - MX * 2 - 60 });
    y += 11;
  });
  T('FORMAS', MX, y + 6, { size: 11, font: 'bold', color: WHITE }); y += 15;
  FORMAS.forEach((f) => {
    doc.setFillColor(...TERRA); doc.circle(MX + 3, y - 1.2, 1.3, 'F');
    T(f, MX + 8, y, { size: 8.5, color: CREAM, maxW: W - MX * 2 - 10 });
    y += 8.5;
  });
  footer(6);

  // ═══ 7 · APLICACIONES ═══
  doc.addPage(); bg(true); header('APLICACIONES EN LA WEB PEYU');
  y = 44;
  APLICACIONES.forEach((a) => {
    doc.setFillColor(18, 84, 64); doc.roundedRect(MX, y - 6, W - MX * 2, 22, 3, 3, 'F');
    T(a.donde, MX + 6, y + 1, { size: 10, font: 'bold', color: WHITE });
    doc.setFillColor(...TEAL); doc.roundedRect(W - MX - 38, y - 3, 32, 6.5, 3, 3, 'F');
    T(a.canal, W - MX - 22, y + 1.2, { size: 7, font: 'bold', color: WHITE, align: 'center' });
    T(a.detalle, MX + 6, y + 8, { size: 8, color: CREAM, maxW: W - MX * 2 - 50 });
    y += 26;
  });
  footer(7);

  // ═══ 8 · EL VIAJE DE PEYU ═══
  doc.addPage(); bg(true); header('EL VIAJE DE PEYU');
  T('Peyu acompana el recorrido completo del cliente: de visitante a embajador.', MX, 42, { size: 10, color: CREAM });
  const colW = (W - MX * 2 - 16) / 5;
  VIAJE.forEach((v, i) => {
    const x = MX + i * (colW + 4);
    doc.setFillColor(18, 84, 64); doc.roundedRect(x, 54, colW, 90, 4, 4, 'F');
    doc.setFillColor(...TEAL); doc.circle(x + colW / 2, 66, 6, 'F');
    T(v.paso, x + colW / 2, 68, { size: 11, font: 'bold', color: WHITE, align: 'center' });
    T(v.etapa, x + colW / 2, 82, { size: 10.5, font: 'bold', color: MINT, align: 'center' });
    T(v.detalle, x + 4, 92, { size: 7.5, color: CREAM, maxW: colW - 8 });
    if (i < 4) T('>', x + colW + 1, 100, { size: 12, font: 'bold', color: TERRA });
  });
  footer(8);

  // ═══ 9 · USOS ═══
  doc.addPage(); bg(true); header('USOS CORRECTOS E INCORRECTOS');
  const half = (W - MX * 2 - 10) / 2;
  doc.setFillColor(18, 84, 64); doc.roundedRect(MX, 40, half, 120, 4, 4, 'F');
  doc.setFillColor(84, 30, 22); doc.roundedRect(MX + half + 10, 40, half, 120, 4, 4, 'F');
  T('SI', MX + 8, 52, { size: 13, font: 'bold', color: MINT });
  T('NO', MX + half + 18, 52, { size: 13, font: 'bold', color: [240, 160, 140] });
  let ys = 64, yn = 64;
  USOS.si.forEach((u) => { T('+', MX + 8, ys, { size: 10, font: 'bold', color: MINT }); T(u, MX + 15, ys, { size: 8.5, color: CREAM, maxW: half - 22 }); ys += 13; });
  USOS.no.forEach((u) => { T('x', MX + half + 18, yn, { size: 10, font: 'bold', color: [240, 160, 140] }); T(u, MX + half + 25, yn, { size: 8.5, color: CREAM, maxW: half - 32 }); yn += 13; });
  footer(9);

  // ═══ 10 · VERSIÓN MINIMALISTA ═══
  doc.addPage(); bg(true); header('MASCOTA VERSION MINIMALISTA');
  T('El logo oficial de Peyu es vectorial: puede utilizarse para la produccion de', MX, 50, { size: 10, font: 'bold', color: CREAM });
  T('pines, stickers, grabado laser e impresion en distintos formatos.', MX, 56, { size: 10, font: 'bold', color: CREAM });
  T('Version monocroma: tinta (#2C1810) sobre fondos claros - crema (#F8F3ED) sobre fondos oscuros.', MX, 66, { size: 8.5, color: MINT });
  if (logo) {
    doc.setFillColor(...CREAM); doc.roundedRect(W / 2 - 70, 80, 140, 60, 8, 8, 'F');
    try { doc.addImage(logo, 'PNG', W / 2 - 60, 94, 120, 32); } catch { /* noop */ }
  }
  footer(10);

  // ═══ 11 · GRACIAS ═══
  doc.addPage(); bg(true);
  T('GRACIAS!!', W / 2, 84, { size: 32, font: 'bold', color: WHITE, align: 'center' });
  if (logo) {
    doc.setFillColor(...CREAM); doc.roundedRect(W / 2 - 52, 98, 104, 34, 5, 5, 'F');
    try { doc.addImage(logo, 'PNG', W / 2 - 45, 105, 90, 20); } catch { /* noop */ }
  }
  T('peyuchile.cl - Hasta que el plastico deje de ser basura', W / 2, 146, { size: 10, color: MINT, align: 'center' });
  footer(11);

  doc.save('Manual-Marca-Peyu-Mascota.pdf');
}