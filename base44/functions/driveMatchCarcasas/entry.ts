// PEYU · driveMatchCarcasas
// Toma la carpeta "Carcasas" del Drive y matchea cada archivo a su modelo
// de celular correspondiente en el catálogo.
//
// Estrategia: tokenize el nombre del archivo (ip11promax, p40lite, s22ultra)
// y matchea contra el nombre del producto buscando coincidencias de modelo.
//
// Body:
//   { mode: "preview" | "apply", folderId?: string, replacePrincipal?: bool }
//
// preview → solo devuelve el matching sin tocar nada.
// apply   → descarga las imágenes Drive, sube al CDN y actualiza productos.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';
const CARCASAS_SUBFOLDER_NAME = 'Carcasas';

// ─── Normalización ──────────────────────────────────────────────
const slugify = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// Extrae los "tokens-modelo" de un texto. Ej:
//   "Carcasa para Huawei P40 Pro" → ["huawei", "p40", "pro"]
//   "ip11promax blu" → ["ip11promax", "blu"] luego desglosamos ip11promax
const extractModelKey = (text) => {
  const norm = slugify(text);
  // Reemplazos de marcas/aliases para unificar nomenclatura
  const aliases = norm
    .replace(/\biphone\b/g, 'ip')
    .replace(/\bip(\d)/g, 'ip$1')
    .replace(/\bsamsung galaxy\b/g, 'galaxy')
    .replace(/\bgalaxy\b/g, 'samsung')
    .replace(/\bhuawei\b/g, 'huawei')
    .replace(/\bxiaomi redmi\b/g, 'redmi')
    .replace(/\bxiaomi mi\b/g, 'mi')
    .replace(/\bpro max\b/g, 'promax')
    .replace(/\bplus\b/g, 'plus')
    .replace(/\bultra\b/g, 'ultra')
    .replace(/\blite\b/g, 'lite')
    .replace(/\bmini\b/g, 'mini');
  return aliases;
};

// Extrae las "señales de modelo" de un string: combinaciones letra+número.
// Retorna { sigs: Set<string>, hasSuffix: { lite, pro, promax, ultra, plus, mini } }
// Las "sigs" SIEMPRE incluyen el sufijo si está presente: p40lite NUNCA matchea solo "p40".
const modelSignatures = (text) => {
  let norm = extractModelKey(text);
  // Eliminar fechas, palabras genéricas y ruido que confunde al matcher
  norm = norm
    .replace(/\b20\d{2}\b/g, ' ')           // años 2020-2099
    .replace(/\b\d{1,2}[-_/.]\d{1,2}[-_/.]\d{2,4}\b/g, ' ') // fechas
    .replace(/\bwhatsapp\b|\bimage\b|\bimg\b|\bphoto\b/g, ' ')
    .replace(/\bat\s+\d/g, ' ')
    .replace(/\bpm\b|\bam\b/g, ' ')
    .replace(/\bcarcasa\b|\bpara\b|\bcase\b|\bbiodegradable\b|\bcompostable\b/g, ' ')
    .replace(/\bturquesa\b|\bnegro\b|\bblanco\b|\bmarron\b|\bamarillo\b|\bazul\b|\brosa\b|\bverde\b|\bnaranjo\b|\bgris\b|\brojo\b/g, ' ')
    .replace(/\bnuevo\b|\bnueva\b/g, ' ')
    .replace(/\b4g\b|\b5g\b/g, ' ');

  const sigs = new Set();
  const hasSuffix = { lite: false, pro: false, promax: false, ultra: false, plus: false, mini: false, fe: false };

  // Detectar sufijos: tanto separados (\bpro\b) como pegados al número (p40pro).
  // Usamos lookbehind con dígito para detectar "pro" después de número.
  const compact = norm.replace(/\s+/g, '');
  if (/lite/.test(compact)) hasSuffix.lite = true;
  if (/promax/.test(compact)) hasSuffix.promax = true;
  else if (/\bpro\b/.test(norm) || /\d+pro(?!max)/.test(compact)) hasSuffix.pro = true;
  if (/ultra/.test(compact)) hasSuffix.ultra = true;
  if (/plus/.test(compact)) hasSuffix.plus = true;
  if (/\bmini\b/.test(norm) || /\d+mini/.test(compact)) hasSuffix.mini = true;
  if (/\bfe\b/.test(norm) || /\d+fe\b/.test(compact)) hasSuffix.fe = true;

  const activeSuffix =
    hasSuffix.promax ? 'promax' :
    hasSuffix.pro ? 'pro' :
    hasSuffix.ultra ? 'ultra' :
    hasSuffix.plus ? 'plus' :
    hasSuffix.lite ? 'lite' :
    hasSuffix.mini ? 'mini' :
    hasSuffix.fe ? 'fe' : '';

  // Generar bases (prefix + num) con dos estrategias:
  // (A) Tokens pegados: "ip11promax", "p40lite"
  // (B) Tokens separados: "ip 11" "p 40" "huawei p40" → tomar SOLO el bloque
  //     letra+numero (excluyendo prefijos como "huawei", "samsung" que no aparecen
  //     en archivos abreviados). Las "marcas" se descartan, nos quedamos con
  //     el modelo (p40, s22, ip11) que SÍ aparece en ambos lados.
  const bases = new Set();

  // Eliminar marcas largas que no aparecen abreviadas en archivos del Drive.
  // Ej: "huawei p40" debe generar sig "p40", no "huaweip40".
  const cleaned = norm
    .replace(/\bhuawei\b|\bsamsung\b|\bxiaomi\b|\bredmi\b|\bxia\b|\bgalaxy\b|\bnote\b|\bedge\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const cleanedCompact = cleaned.replace(/\s+/g, '');

  // (A) Pegados: "ip11promax" → ip11, "p40lite" → p40, "s22ultra" → s22
  // Greedy: prefijo de 1-4 letras INMEDIATAMENTE seguido de número.
  const reA = /([a-z]{1,4})(\d{1,3})/g;
  let m;
  while ((m = reA.exec(cleanedCompact)) !== null) {
    const prefix = m[1];
    const num = m[2];
    if (['mm', 'cm', 'kg', 'gb', 'tb'].includes(prefix)) continue;
    if (Number(num) < 5) continue;  // descartar números muy chicos
    bases.add(prefix + num);
    // Versión sin prefijo (solo número) — para matchear "ip 11" con "11"
    if (Number(num) >= 10) bases.add(num);
  }

  // (B) Separados con espacios: "p 40", "ip 11", "s 22"
  const reB = /\b([a-z]{1,3})\s+(\d{1,3})\b/g;
  while ((m = reB.exec(cleaned)) !== null) {
    if (Number(m[2]) < 5) continue;
    bases.add(m[1] + m[2]);
    if (Number(m[2]) >= 10) bases.add(m[2]);
  }

  // Para cada base, agregar la versión con/sin sufijo activo
  for (const base of bases) {
    if (activeSuffix) {
      sigs.add(base + activeSuffix);
    } else {
      sigs.add(base);
    }
  }

  return { sigs: [...sigs], hasSuffix };
};

// Color extraído del nombre del archivo (yel, blu, neg, mar, tur)
const COLOR_MAP = {
  yel: 'amarillo', blu: 'azul', neg: 'negro', bla: 'blanco',
  ros: 'rosa', tur: 'turquesa', mar: 'marron', ver: 'verde',
  nar: 'naranjo', mor: 'morado', gri: 'gris', roj: 'rojo',
};
const extractColor = (filename) => {
  const norm = slugify(filename);
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (new RegExp(`\\b${k}\\w*`).test(norm)) return v;
  }
  return null;
};

// ─── Drive helpers ──────────────────────────────────────────────
async function findSubfolder(parentId, name, headers) {
  const params = new URLSearchParams({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${name.replace(/'/g, "\\'")}'`,
    fields: 'files(id,name)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers });
  if (!r.ok) throw new Error(`Drive ${r.status}`);
  const data = await r.json();
  return data.files?.[0] || null;
}

async function listImagesIn(folderId, headers) {
  const out = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken,files(id,name,mimeType,size)',
      pageSize: '200',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers });
    if (!r.ok) throw new Error(`Drive ${r.status}`);
    const data = await r.json();
    out.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return out;
}

// ─── Handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // mode: "preview" (matching automático) | "apply" (todos los matches automáticos)
    //     | "applySelection" (solo los matches confirmados/editados por el humano)
    const mode = ['apply', 'applySelection'].includes(body.mode) ? body.mode : 'preview';
    const replacePrincipal = body.replacePrincipal !== false; // default true para fix
    const folderId = body.folderId || ROOT_FOLDER;
    // selection: [{ file_id, file_name, mime_type, producto_id, producto_sku }]
    const selection = Array.isArray(body.selection) ? body.selection : [];

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 1. Encontrar la subcarpeta "Carcasas"
    const carcasasFolder = await findSubfolder(folderId, CARCASAS_SUBFOLDER_NAME, headers);
    if (!carcasasFolder) {
      return Response.json({ error: 'No se encontró la subcarpeta "Carcasas" en el Drive' }, { status: 404 });
    }

    // 2. Listar imágenes de Carcasas
    const driveFiles = await listImagesIn(carcasasFolder.id, headers);

    // 3. Cargar productos categoría "Carcasas B2C"
    const productos = await base44.asServiceRole.entities.Producto.filter(
      { categoria: 'Carcasas B2C' },
      '-updated_date',
      200
    );

    // 4. Pre-calcular signatures de cada producto
    const productosSig = productos.map(p => {
      const { sigs, hasSuffix } = modelSignatures(p.nombre || '');
      return { ...p, sigs, hasSuffix };
    });

    // 5. Matchear cada archivo con el producto que tenga signature EXACTA
    // Regla: el archivo y el producto deben coincidir en sigs, Y los sufijos
    // (lite/pro/promax) deben coincidir exactamente. Si el archivo dice "lite"
    // pero el producto no, NO matchea. Si el producto dice "pro" pero el archivo no, NO matchea.
    const matches = [];
    const unmatched = [];

    const sufijoActivo = (hs) =>
      hs.promax ? 'promax' :
      hs.pro ? 'pro' :
      hs.ultra ? 'ultra' :
      hs.plus ? 'plus' :
      hs.lite ? 'lite' :
      hs.mini ? 'mini' :
      hs.fe ? 'fe' : '';

    for (const file of driveFiles) {
      const { sigs: fileSigs, hasSuffix: fileSuffix } = modelSignatures(file.name);
      if (fileSigs.length === 0) {
        unmatched.push({ file: file.name, reason: 'sin tokens de modelo' });
        continue;
      }
      const fileSfx = sufijoActivo(fileSuffix);

      // Buscar producto cuyo sufijo coincida y comparta sigs
      let best = null;
      let bestLen = 0;
      for (const prod of productosSig) {
        const prodSfx = sufijoActivo(prod.hasSuffix);
        // Sufijos deben coincidir (ambos vacíos, o ambos = mismo sufijo)
        if (prodSfx !== fileSfx) continue;
        for (const sig of fileSigs) {
          if (prod.sigs.includes(sig) && sig.length > bestLen) {
            best = prod;
            bestLen = sig.length;
          }
        }
      }

      if (best) {
        matches.push({
          file: { id: file.id, name: file.name, mimeType: file.mimeType },
          producto: { id: best.id, sku: best.sku, nombre: best.nombre },
          color: extractColor(file.name),
          match_strength: bestLen,
        });
      } else {
        unmatched.push({ file: file.name, reason: 'sin match en catálogo', file_sigs: fileSigs, file_suffix: fileSfx });
      }
    }

    // ── Preview mode: devolver el plan sin ejecutar ──
    if (mode === 'preview') {
      // Agrupar por producto para resumen
      const byProducto = {};
      for (const m of matches) {
        const k = m.producto.id;
        if (!byProducto[k]) byProducto[k] = { producto: m.producto, files: [] };
        byProducto[k].files.push({ name: m.file.name, color: m.color, strength: m.match_strength });
      }
      const productosConMatch = Object.values(byProducto).sort((a, b) =>
        a.producto.nombre.localeCompare(b.producto.nombre)
      );
      // Catálogo plano de productos para el dropdown del UI de revisión
      const catalogo = productos.map(p => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        imagen_url: p.imagen_url || null,
      })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

      // Lista plana de archivos con su sugerencia (para tabla de revisión).
      // Incluye thumbnail directo de Drive (vía thumbnailLink no, pero usamos webContentLink no, mejor =
      // un endpoint proxy del Drive: usamos la URL de Drive con alt=media requiere auth. Por eso entregamos
      // el id y el front lo pide vía /uc?id=... público — pero no es público. Mejor: dejamos el id y nada más,
      // el modal muestra solo el nombre. Si el usuario quiere ver, lo abre en Drive.)
      const matchByFileId = new Map(matches.map(m => [m.file.id, m]));
      const filesPlanos = driveFiles.map(f => {
        const sug = matchByFileId.get(f.id);
        return {
          file_id: f.id,
          file_name: f.name,
          mime_type: f.mimeType,
          drive_view_url: `https://drive.google.com/file/d/${f.id}/view`,
          thumb_url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w200`,
          color: sug?.color || null,
          suggestion: sug ? {
            producto_id: sug.producto.id,
            producto_sku: sug.producto.sku,
            producto_nombre: sug.producto.nombre,
            strength: sug.match_strength,
          } : null,
        };
      }).sort((a, b) => {
        // Primero los que tienen sugerencia
        if (!!a.suggestion !== !!b.suggestion) return a.suggestion ? -1 : 1;
        return (a.file_name || '').localeCompare(b.file_name || '');
      });

      return Response.json({
        ok: true,
        mode: 'preview',
        carcasas_folder_id: carcasasFolder.id,
        total_drive_files: driveFiles.length,
        total_productos_carcasas: productos.length,
        total_matches: matches.length,
        productos_con_match: productosConMatch.length,
        productos_sin_match: productos.length - productosConMatch.length,
        productos: productosConMatch,
        unmatched_files: unmatched,
        all_matches: matches,
        files: filesPlanos,
        catalogo,
      });
    }

    // ── Apply: construir la lista efectiva de asignaciones a ejecutar ──
    // En modo "apply" usamos los matches automáticos.
    // En modo "applySelection" usamos las asignaciones humanas (selection).
    let assignments = [];
    if (mode === 'applySelection') {
      const fileById = new Map(driveFiles.map(f => [f.id, f]));
      const prodById = new Map(productos.map(p => [p.id, p]));
      for (const sel of selection) {
        const f = fileById.get(sel.file_id);
        const p = prodById.get(sel.producto_id);
        if (!f || !p) continue;
        assignments.push({
          file: { id: f.id, name: f.name, mimeType: f.mimeType },
          producto: { id: p.id, sku: p.sku, nombre: p.nombre },
        });
      }
    } else {
      assignments = matches.map(m => ({ file: m.file, producto: m.producto }));
    }

    const results = [];
    const updatesPorProducto = {};

    for (const m of assignments) {
      try {
        const dlR = await fetch(
          `https://www.googleapis.com/drive/v3/files/${m.file.id}?alt=media&supportsAllDrives=true`,
          { headers }
        );
        if (!dlR.ok) {
          results.push({ ...m, ok: false, error: `Drive download ${dlR.status}` });
          continue;
        }
        const blob = await dlR.blob();
        if (blob.size < 5000) {
          results.push({ ...m, ok: false, error: 'archivo muy pequeño' });
          continue;
        }

        const safeName = m.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const file = new File([blob], `${m.producto.sku}-drv-${safeName}`, {
          type: m.file.mimeType || 'image/jpeg',
        });
        const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        if (!upload?.file_url) {
          results.push({ ...m, ok: false, error: 'upload falló' });
          continue;
        }

        if (!updatesPorProducto[m.producto.id]) {
          updatesPorProducto[m.producto.id] = { producto: m.producto, urls: [] };
        }
        updatesPorProducto[m.producto.id].urls.push(upload.file_url);
        results.push({ ...m, ok: true, uploaded_url: upload.file_url });
      } catch (err) {
        results.push({ ...m, ok: false, error: err.message });
      }
    }

    // Actualizar cada producto: nueva imagen principal + galería limpia
    for (const { producto, urls } of Object.values(updatesPorProducto)) {
      if (urls.length === 0) continue;
      const prodActual = productos.find(p => p.id === producto.id);
      const patch = {};
      if (replacePrincipal || !prodActual?.imagen_url) {
        patch.imagen_url = urls[0];
      }
      // Galería: append de urls nuevas a la galería existente, sin duplicados
      const existing = Array.isArray(prodActual?.galeria_urls) ? prodActual.galeria_urls : [];
      patch.galeria_urls = [...new Set([...urls, ...existing])];
      await base44.asServiceRole.entities.Producto.update(producto.id, patch);
    }

    return Response.json({
      ok: true,
      mode,
      total_drive_files: driveFiles.length,
      total_assignments: assignments.length,
      total_subidas_ok: results.filter(r => r.ok).length,
      productos_actualizados: Object.keys(updatesPorProducto).length,
      replace_principal: replacePrincipal,
      results,
      unmatched_files: unmatched,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});