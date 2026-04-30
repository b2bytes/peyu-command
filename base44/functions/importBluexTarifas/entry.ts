// ─────────────────────────────────────────────────────────────────────────────
// Bluex · Importar tarifario desde Excel
// ─────────────────────────────────────────────────────────────────────────────
// Parsea archivos XLSX de tarifas personalizadas Bluex (EXPRESS / PRIORITY)
// y los carga en la entidad TarifaBluex. Maneja el caso "stylesheet missing"
// que viene en los Excel originales saltándose la lectura de estilos.
//
// Uso: base44.functions.invoke('importBluexTarifas', {
//   file_url: '...xlsx',
//   servicio: 'EXPRESS' | 'PRIORITY',
//   replace: true   // limpia tarifas previas del mismo servicio
// })
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';
import * as XLSX from 'npm:xlsx@0.18.5';

// Quita tildes y normaliza para matching robusto de comunas.
function normalizeComuna(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Detecta una celda numérica aunque venga como string ("$ 4.500", "4.500", "4500")
function toNumber(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

// Detecta header buscando la fila que tenga "comuna" Y al menos un tramo de peso (kg).
// Esto evita falsos positivos en filas de instrucciones que mencionan "comuna".
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const row = rows[i] || [];
    const cells = row.map(c => String(c || '').toLowerCase().trim());
    const hasComuna = cells.some(c => c === 'comuna' || c === 'destino' || c === 'región' || c === 'region');
    const hasKg = cells.some(c => /\bkg\b|\bkilo/.test(c) || /^\d+\s*[-–]\s*\d+/.test(c));
    if (hasComuna && hasKg) return i;
  }
  // Fallback: solo "comuna" exacta (sin instrucciones largas)
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const row = rows[i] || [];
    const cells = row.map(c => String(c || '').toLowerCase().trim());
    if (cells.includes('comuna') || cells.includes('destino')) return i;
  }
  return -1;
}

// Detecta el tramo de peso de un header de columna.
// Tramos reales del Excel Bluex e-commerce: 0-0.5 / 0.5-1.5 / 1.5-3 / 3-6 / 6-10 / 10-16 / 16-60 kg
// Mapeo a campos de la entidad (los nombres son históricos, lo que importa es el rango):
//   tarifa_base       → 0 a 0.5 kg     (tarifa mínima)
//   tarifa_2kg        → 0.5 a 1.5 kg
//   tarifa_3kg        → 1.5 a 3 kg
//   tarifa_5kg        → 3 a 6 kg
//   tarifa_10kg       → 6 a 10 kg
//   tarifa_15kg       → 10 a 16 kg
//   tarifa_25kg       → 16 a 60 kg
function detectKgTramo(header) {
  const h = String(header || '').toLowerCase().replace(/\s+/g, '');
  if (/0[-–]0[.,]?5kg/.test(h) || h === '0-0.5kg' || /^hasta0[.,]5/.test(h)) return 'tarifa_base';
  if (/0[.,]?5[-–]1[.,]?5kg/.test(h)) return 'tarifa_2kg';
  if (/1[.,]?5[-–]3kg/.test(h)) return 'tarifa_3kg';
  if (/3[-–]6kg/.test(h)) return 'tarifa_5kg';
  if (/6[-–]10kg/.test(h)) return 'tarifa_10kg';
  if (/10[-–]16kg/.test(h)) return 'tarifa_15kg';
  if (/16[-–]60kg/.test(h)) return 'tarifa_25kg';
  // Patrones genéricos como fallback (otras versiones del tarifario)
  if (/(adicional|kgad|porkg|kgextra)/.test(h)) return 'tarifa_kg_adicional';
  return null;
}

// Detecta si un header pertenece a Region / Comuna / Zona / Tipo / Lead time.
// Importante: tomar EXACTAMENTE "Comuna" (no "Comuna activa", "Codigo Comuna", etc.)
function detectMetaCol(header) {
  const h = normalizeComuna(header);
  if (h === 'region') return 'region';
  if (h === 'comuna' || h === 'destino') return 'comuna';
  if (h === 'zona') return 'zona';
  if (h === 'promesa blue' || h.includes('promesa') || h.includes('plazo') || (h.includes('dias') && !h.includes('adicional'))) return 'lead_time_dias';
  if (h === 'tipo' || h === 'clasificacion') return 'tipo_destino';
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { file_url, servicio, replace = true } = await req.json();
    if (!file_url || !servicio) {
      return Response.json({ error: 'file_url y servicio son requeridos' }, { status: 400 });
    }
    if (!['EXPRESS', 'PRIORITY'].includes(servicio)) {
      return Response.json({ error: 'servicio debe ser EXPRESS o PRIORITY' }, { status: 400 });
    }

    // 1. Descargar el archivo
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json({ error: `No se pudo descargar el archivo (${fileRes.status})` }, { status: 500 });
    }
    const buffer = await fileRes.arrayBuffer();

    // 2. Parsear XLSX (saltándonos estilos para evitar el error de stylesheet)
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellStyles: false,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
    });

    // Intenta encontrar la hoja con tarifas (la primera que tenga datos típicos)
    let sheetName = workbook.SheetNames[0];
    let bestSheet = null;
    let bestRows = [];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
      if (rows.length > 5 && findHeaderRow(rows) >= 0) {
        bestSheet = sheet;
        bestRows = rows;
        sheetName = name;
        break;
      }
    }
    if (!bestSheet) {
      bestSheet = workbook.Sheets[sheetName];
      bestRows = XLSX.utils.sheet_to_json(bestSheet, { header: 1, raw: false, defval: '' });
    }

    const headerIdx = findHeaderRow(bestRows);
    if (headerIdx < 0) {
      return Response.json({ error: 'No se detectó fila de headers en el Excel', preview: bestRows.slice(0, 10) }, { status: 422 });
    }

    const headers = bestRows[headerIdx].map(h => String(h || '').trim());
    const dataRows = bestRows.slice(headerIdx + 1);

    // Mapear columnas
    const metaMap = {};
    const kgMap = {};
    headers.forEach((h, idx) => {
      const meta = detectMetaCol(h);
      if (meta) metaMap[meta] = idx;
      const kg = detectKgTramo(h);
      if (kg) kgMap[kg] = idx;
    });

    if (metaMap.comuna == null) {
      return Response.json({
        error: 'No se detectó columna "Comuna" en el Excel',
        headers,
        sheet_name: sheetName,
      }, { status: 422 });
    }

    // 3. Construir registros
    const today = new Date().toISOString().slice(0, 10);
    const registros = [];
    for (const row of dataRows) {
      const comuna = String(row[metaMap.comuna] || '').trim();
      if (!comuna || comuna.length < 2) continue;

      const tarifaBase = toNumber(row[kgMap.tarifa_base]);
      if (!tarifaBase) continue; // sin tarifa base no sirve

      const rawColumnas = {};
      headers.forEach((h, idx) => {
        if (h && row[idx] != null && row[idx] !== '') {
          rawColumnas[h] = row[idx];
        }
      });

      registros.push({
        servicio,
        region: metaMap.region != null ? String(row[metaMap.region] || '').trim() : '',
        comuna,
        comuna_normalizada: normalizeComuna(comuna),
        zona: metaMap.zona != null ? String(row[metaMap.zona] || '').trim() : '',
        tipo_destino: metaMap.tipo_destino != null
          ? (String(row[metaMap.tipo_destino] || '').trim() || 'Urbano')
          : 'Urbano',
        lead_time_dias: metaMap.lead_time_dias != null ? toNumber(row[metaMap.lead_time_dias]) : null,
        tarifa_base: tarifaBase,
        tarifa_2kg: toNumber(row[kgMap.tarifa_2kg]),
        tarifa_3kg: toNumber(row[kgMap.tarifa_3kg]),
        tarifa_5kg: toNumber(row[kgMap.tarifa_5kg]),
        tarifa_10kg: toNumber(row[kgMap.tarifa_10kg]),
        tarifa_15kg: toNumber(row[kgMap.tarifa_15kg]),
        tarifa_25kg: toNumber(row[kgMap.tarifa_25kg]),
        tarifa_kg_adicional: toNumber(row[kgMap.tarifa_kg_adicional]),
        raw_columnas: rawColumnas,
        fecha_actualizacion: today,
        vigente: true,
      });
    }

    if (registros.length === 0) {
      return Response.json({
        error: 'No se pudo extraer ninguna tarifa válida',
        headers,
        kg_columns: kgMap,
        meta_columns: metaMap,
      }, { status: 422 });
    }

    // 4. Reemplazar tarifas previas si se pidió
    if (replace) {
      const previas = await base44.asServiceRole.entities.TarifaBluex.filter({ servicio });
      for (const p of previas) {
        await base44.asServiceRole.entities.TarifaBluex.delete(p.id);
      }
    }

    // 5. Insertar en bloques
    const CHUNK = 50;
    let creadas = 0;
    for (let i = 0; i < registros.length; i += CHUNK) {
      const slice = registros.slice(i, i + CHUNK);
      await base44.asServiceRole.entities.TarifaBluex.bulkCreate(slice);
      creadas += slice.length;
    }

    return Response.json({
      ok: true,
      servicio,
      sheet_name: sheetName,
      headers_detectados: headers,
      columnas_kg_detectadas: Object.keys(kgMap),
      columnas_meta_detectadas: Object.keys(metaMap),
      registros_creados: creadas,
      preview: registros.slice(0, 3),
    });
  } catch (error) {
    console.error('[importBluexTarifas]', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});