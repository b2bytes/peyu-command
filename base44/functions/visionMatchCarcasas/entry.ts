// PEYU · visionMatchCarcasas
// Para las carcasas SIN foto (activo: false, imagen_url: null), intenta encontrar
// match en la carpeta Drive "Carcasas" usando IA de visión cuando el nombre del
// archivo no es suficiente.
//
// Pipeline:
//   1. Lista archivos de Drive "Carcasas".
//   2. Excluye los que ya están usados (su nombre quedó en alguna imagen_url
//      del catálogo, lo detectamos por los archivos -drv-<filename>).
//   3. Para cada archivo no usado, sube al CDN (URL pública) y le pide a la IA
//      que identifique el modelo del celular en la foto.
//   4. Match cada imagen identificada al producto correspondiente sin foto.
//   5. Aplica: sube imagen al producto + lo reactiva.
//
// Body:
//   { mode: "preview" | "apply", limit?: number }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';
const CARCASAS_SUBFOLDER = 'Carcasas';

// ─── Drive helpers ──────────────────────────────────────────────
async function findSubfolder(parentId, name, headers) {
  const params = new URLSearchParams({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${name.replace(/'/g, "\\'")}'`,
    fields: 'files(id,name)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers });
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
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers });
    const data = await r.json();
    out.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return out;
}

// ─── Normalización para match ─────────────────────────────────────
const normalize = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Detecta el sufijo de variante del modelo. Devuelve string normalizado o ''.
// IMPORTANTE: orden importa (chequeamos "promax" antes que "pro").
const detectarSufijo = (texto) => {
  const t = normalize(texto);
  if (/pro\s*max/.test(t)) return 'promax';
  if (/\bultra\b/.test(t)) return 'ultra';
  if (/\bplus\b/.test(t)) return 'plus';
  if (/\bmini\b/.test(t)) return 'mini';
  if (/\blite\b/.test(t)) return 'lite';
  if (/\bpro\b/.test(t)) return 'pro';
  if (/\bmax\b/.test(t)) return 'max';
  if (/\bfe\b/.test(t)) return 'fe';
  if (/\b\w*10e\b/.test(t)) return 'e'; // S10e
  return '';
};

// Match estricto: la IA dice "iPhone 13", buscamos producto cuyo nombre normalizado
// CONTENGA "iphone 13" pero NO tenga sufijo (mini/pro/promax) que la IA no mencionó.
const matchProductoPorTexto = (textoModelo, productos) => {
  const tokensTexto = normalize(textoModelo).split(' ').filter(t => t.length >= 2);
  if (tokensTexto.length === 0) return null;

  const sufijoIA = detectarSufijo(textoModelo);

  let best = null;
  let bestScore = 0;

  for (const p of productos) {
    const nombreNorm = normalize(p.nombre);
    const sufijoProducto = detectarSufijo(p.nombre);

    // Sufijos DEBEN coincidir exactamente. Si IA no dice sufijo, producto tampoco.
    if (sufijoIA !== sufijoProducto) continue;

    // Tokens significativos (sin sufijos ni genéricos)
    const tokensProducto = nombreNorm.split(' ').filter(t =>
      t.length >= 2 &&
      !['carcasa', 'para', 'el', 'la', 'biodegradable', 'compostable',
        'pro', 'max', 'mini', 'plus', 'ultra', 'lite', 'fe', 'promax'].includes(t)
    );

    // CRÍTICO: si la IA mencionó un número (ej. "iPhone 12"), ese número EXACTO
    // debe estar en el producto. Si el producto no tiene número (X/XS, SE), no matchea.
    const numerosIA = tokensTexto.filter(t => /^\d+$/.test(t));
    const numerosProducto = tokensProducto.filter(t => /^\d+$/.test(t) || /^\w*\d+\w*$/.test(t));

    if (numerosIA.length > 0) {
      // IA mencionó números (12, 13, etc.) → producto DEBE tener al menos uno coincidente
      const algunNumeroCoincide = numerosIA.some(n =>
        numerosProducto.some(np => np === n || np.includes(n))
      );
      if (!algunNumeroCoincide) continue;
    }

    let score = 0;
    let allTokensFound = true;
    for (const tp of tokensProducto) {
      if (tokensTexto.some(tt => tt === tp)) {
        score += tp.length;
      } else if (/\d/.test(tp)) {
        allTokensFound = false;
      }
    }

    if (!allTokensFound) continue;

    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }

  return bestScore >= 4 ? best : null;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'preview';
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 100);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 1. Subcarpeta Carcasas + listado
    const carcasasFolder = await findSubfolder(ROOT_FOLDER, CARCASAS_SUBFOLDER, headers);
    if (!carcasasFolder) {
      return Response.json({ error: 'No se encontró subcarpeta Carcasas' }, { status: 404 });
    }
    const driveFiles = await listImagesIn(carcasasFolder.id, headers);

    // 2. Cargar productos sin foto (activo:false y sin imagen_url)
    const todosCarcasas = await base44.asServiceRole.entities.Producto.filter(
      { categoria: 'Carcasas B2C' }, '-updated_date', 300
    );
    const sinFoto = todosCarcasas.filter(p => !p.imagen_url);

    // 3. Detectar archivos ya usados: para cada producto con foto, extraer el
    // nombre original del archivo Drive (los subimos como "<sku>-drv-<filename>")
    const usadosNombres = new Set();
    for (const p of todosCarcasas) {
      const urls = [p.imagen_url, ...(p.galeria_urls || [])].filter(Boolean);
      for (const url of urls) {
        const m = url.match(/-drv-(.+?)(?:\?|$)/i);
        if (m && m[1]) usadosNombres.add(m[1].toLowerCase());
      }
    }

    // Archivos candidatos (no usados aún)
    const noUsados = driveFiles.filter(f => {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      return !usadosNombres.has(safeName);
    });

    // 4. Para cada archivo no usado, subir al CDN para obtener URL pública,
    // analizarla con IA y matchear contra producto sin foto.
    const matches = [];
    const unmatched = [];
    let analizados = 0;

    for (const file of noUsados.slice(0, limit)) {
      analizados++;
      try {
        // Descarga del Drive
        const dlR = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
          { headers }
        );
        if (!dlR.ok) {
          unmatched.push({ file: file.name, reason: `Drive download ${dlR.status}` });
          continue;
        }
        const blob = await dlR.blob();
        if (blob.size < 5000 || blob.size > 15000000) {
          unmatched.push({ file: file.name, reason: `tamaño raro (${blob.size}b)` });
          continue;
        }

        // Subir al CDN para tener URL pública (necesario para Vision)
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const tmpFile = new File([blob], `vision-tmp-${safeName}`, {
          type: file.mimeType || 'image/jpeg',
        });
        const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: tmpFile });
        if (!upload?.file_url) {
          unmatched.push({ file: file.name, reason: 'upload falló' });
          continue;
        }

        // Pedir a la IA que identifique el modelo del celular
        const visionResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Eres un experto en celulares. Analiza esta foto de una carcasa de celular y dime EXACTAMENTE qué modelo de celular es (la silueta, los recortes de cámara, los botones, los tamaños te dan pistas).

Modelos posibles del catálogo (debes elegir uno de estos o "desconocido"):
- iPhone 11, iPhone 11 Pro, iPhone 11 Pro Max
- iPhone 12, iPhone 12 Mini, iPhone 12 Pro, iPhone 12 Pro Max
- iPhone 13, iPhone 13 Mini, iPhone 13 Pro, iPhone 13 Pro Max
- iPhone 14, iPhone 14 Plus, iPhone 14 Pro, iPhone 14 Pro Max
- iPhone 15, iPhone 15 Plus, iPhone 15 Pro, iPhone 15 Pro Max
- iPhone 16, iPhone 16 Plus, iPhone 16 Pro, iPhone 16 Pro Max
- Samsung S10, Samsung S10e, Samsung S10 Plus, Samsung S20, Samsung S20 Ultra
- Samsung S21, Samsung S21 Plus, Samsung S21 Ultra, Samsung S22, Samsung S22 Plus, Samsung S22 Ultra
- Samsung S23, Samsung S23 Plus, Samsung S23 Ultra, Samsung S24, Samsung S24 Plus, Samsung S24 Ultra
- Samsung A50, Samsung A20s, Samsung A30s, Samsung A52, Samsung A53
- Huawei P30, Huawei P30 Lite, Huawei P30 Pro, Huawei P40, Huawei P40 Lite, Huawei P40 Pro
- Xiaomi Redmi Note 8, Xiaomi Redmi Note 9, Xiaomi Mi 9, Xiaomi Mi 10
- Motorola G7, Motorola G8

Responde SOLO con el nombre exacto del modelo en formato "Marca Modelo" (ej: "Samsung S22", "iPhone 13 Pro Max"). Si no estás seguro al menos 80%, responde exactamente "desconocido".`,
          file_urls: [upload.file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              modelo: { type: 'string' },
              confianza: { type: 'string', enum: ['alta', 'media', 'baja', 'nula'] },
              razon: { type: 'string' },
            },
            required: ['modelo', 'confianza'],
          },
        });

        const modelo = visionResp?.modelo || 'desconocido';
        const confianza = visionResp?.confianza || 'nula';

        if (modelo === 'desconocido' || confianza === 'baja' || confianza === 'nula') {
          unmatched.push({
            file: file.name,
            file_id: file.id,
            uploaded_url: upload.file_url,
            reason: `IA: ${modelo} (${confianza})`,
            razon_ia: visionResp?.razon,
          });
          continue;
        }

        // Match con producto sin foto
        const producto = matchProductoPorTexto(modelo, sinFoto);
        if (!producto) {
          unmatched.push({
            file: file.name,
            file_id: file.id,
            uploaded_url: upload.file_url,
            reason: `IA dijo "${modelo}" pero no hay producto sin foto que matchee`,
            modelo_ia: modelo,
            confianza,
          });
          continue;
        }

        matches.push({
          file: { id: file.id, name: file.name, mime_type: file.mimeType },
          uploaded_url: upload.file_url,
          producto: { id: producto.id, sku: producto.sku, nombre: producto.nombre },
          modelo_ia: modelo,
          confianza,
          razon_ia: visionResp?.razon,
        });
      } catch (err) {
        unmatched.push({ file: file.name, reason: err.message });
      }
    }

    // 5. Si mode=apply, asignar imagen al producto + reactivar
    let aplicados = 0;
    if (mode === 'apply') {
      // Agrupar matches por producto (un producto puede recibir varias imágenes)
      const porProducto = new Map();
      for (const m of matches) {
        const k = m.producto.id;
        if (!porProducto.has(k)) porProducto.set(k, { producto: m.producto, urls: [] });
        porProducto.get(k).urls.push(m.uploaded_url);
      }

      for (const { producto, urls } of porProducto.values()) {
        // Re-subir cada imagen con prefijo SKU+drv para que el sistema la
        // reconozca como "foto real" (patrón -drv-)
        const finalUrls = [];
        for (const tmpUrl of urls) {
          // Bajamos del CDN tmp y volvemos a subir con el prefijo correcto
          const r = await fetch(tmpUrl);
          if (!r.ok) continue;
          const blob = await r.blob();
          const matchInfo = matches.find(m => m.uploaded_url === tmpUrl);
          const safeName = matchInfo.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const finalFile = new File([blob], `${producto.sku}-drv-${safeName}`, {
            type: matchInfo.file.mime_type || 'image/jpeg',
          });
          const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: finalFile });
          if (up?.file_url) finalUrls.push(up.file_url);
        }

        if (finalUrls.length === 0) continue;

        await base44.asServiceRole.entities.Producto.update(producto.id, {
          imagen_url: finalUrls[0],
          galeria_urls: finalUrls,
          activo: true,
        });
        aplicados++;
      }
    }

    return Response.json({
      ok: true,
      mode,
      total_drive_files: driveFiles.length,
      archivos_no_usados: noUsados.length,
      analizados,
      matches_count: matches.length,
      productos_actualizados: aplicados,
      unmatched_count: unmatched.length,
      matches,
      unmatched,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});