// PEYU · auditCarcasasCoverage
// Audita TODAS las carcasas del catálogo y reporta:
//   1. Cuáles ya tienen imagen real (drv- en su URL)
//   2. Cuáles siguen con imagen genérica (woo / wp / unsplash / sin imagen)
//   3. Para cada carcasa SIN imagen real, busca en la carpeta Drive "Carcasas"
//      archivos cuyo nombre contenga referencias al modelo (búsqueda fuzzy
//      por tokens, no estricta como driveMatchCarcasas).
//
// Retorna un reporte estructurado para mostrar en UI: qué falta y qué archivos
// del Drive podrían cubrirlo aunque el matching automático no haya cerrado.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';
const CARCASAS_SUBFOLDER_NAME = 'Carcasas';

const slugify = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// Detecta si la imagen del producto es "real" (subida desde Drive) o genérica
// El convenio en el sistema: las URLs con "-drv-" provienen de Drive (auto-asignadas).
const isRealDriveImage = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('-drv-');
};

// Tokens de modelo del nombre del producto.
// Ej: "Carcasa para Huawei P40 Lite" → ["huawei", "p40", "lite", "p40lite"]
const productTokens = (nombre) => {
  const norm = slugify(nombre)
    .replace(/\bcarcasa\b|\bpara\b|\bcase\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const words = norm.split(' ').filter(Boolean);
  const tokens = new Set(words);
  // Combinaciones letra+número adyacentes y con sufijo
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (/^[a-z]+$/.test(a) && /^\d+$/.test(b)) tokens.add(a + b);
    if (/^[a-z]\d+$/.test(a)) tokens.add(a);
  }
  // Pegar el sufijo al modelo: "p40 lite" → "p40lite"
  const suffixes = ['lite', 'pro', 'promax', 'ultra', 'plus', 'mini', 'fe', 'max'];
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (/^[a-z]?\d+$/.test(a) && suffixes.includes(b)) {
      tokens.add(a + b);
    }
    // "pro max" pegado
    if (b === 'max' && words[i + 2] === undefined && a === 'pro') {
      tokens.add('promax');
    }
  }
  // Tokens de iphone/ip
  if (norm.includes('iphone')) tokens.add('iphone');
  return [...tokens].filter(t => t.length >= 2);
};

// Tokens del nombre del archivo del Drive
const fileTokens = (filename) => {
  const norm = slugify(filename)
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/\bwhatsapp\b|\bimage\b|\bimg\b|\bphoto\b|\bat\b|\bpm\b|\bam\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const words = norm.split(' ').filter(Boolean);
  const tokens = new Set(words);
  // Compactar palabras pegadas con números: "ip11promax", "P40lite" ya vienen pegados.
  // También extraer fragmentos: ip11promax → ip11, ip, 11, promax (greedy)
  for (const w of words) {
    const m = w.match(/^([a-z]{1,4})(\d{1,3})(.*)$/);
    if (m) {
      tokens.add(m[1] + m[2]);
      tokens.add(m[1]);
      tokens.add(m[2]);
      if (m[3]) tokens.add(m[1] + m[2] + m[3]);
    }
  }
  return [...tokens].filter(t => t.length >= 2);
};

// Score de coincidencia entre tokens del producto y archivo
const scoreMatch = (prodTokens, fTokens) => {
  let score = 0;
  const fSet = new Set(fTokens);
  for (const pt of prodTokens) {
    if (fSet.has(pt)) {
      // Match más fuerte si el token contiene un número (p40, ip11, s22)
      score += /\d/.test(pt) ? 5 : 1;
    }
  }
  return score;
};

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
      fields: 'nextPageToken,files(id,name,mimeType)',
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 1. Listar archivos del Drive
    const carcasasFolder = await findSubfolder(ROOT_FOLDER, CARCASAS_SUBFOLDER_NAME, headers);
    if (!carcasasFolder) {
      return Response.json({ error: 'No se encontró la subcarpeta "Carcasas"' }, { status: 404 });
    }
    const driveFiles = await listImagesIn(carcasasFolder.id, headers);

    // 2. Cargar productos categoría "Carcasas B2C"
    const productos = await base44.asServiceRole.entities.Producto.filter(
      { categoria: 'Carcasas B2C' }, '-updated_date', 200
    );

    // 3. Indexar archivos del Drive
    const driveIndex = driveFiles.map(f => ({
      id: f.id,
      name: f.name,
      tokens: fileTokens(f.name),
    }));

    const conImagen = [];
    const sinImagen = [];

    for (const p of productos) {
      const tieneReal = isRealDriveImage(p.imagen_url);
      const tokens = productTokens(p.nombre || '');
      const sinTokensValidos = !tokens.some(t => /\d/.test(t));

      const item = {
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        activo: p.activo !== false,
        imagen_url: p.imagen_url || null,
        imagen_es_real: tieneReal,
        tokens_modelo: tokens,
      };

      if (tieneReal) {
        conImagen.push(item);
      } else {
        // Candidatos: SOLO si el archivo del Drive comparte un token con número (modelo)
        // exacto con el producto. Esto evita el ruido de matchear por "11" o "16" sueltos.
        const tokensConNumero = tokens.filter(t => /[a-z]\d/.test(t)); // p40, ip11, s22, etc.
        const candidatos = tokensConNumero.length === 0
          ? []
          : driveIndex
              .filter(f => f.tokens.some(ft => tokensConNumero.includes(ft)))
              .map(f => ({
                name: f.name,
                shared: f.tokens.filter(ft => tokensConNumero.includes(ft)),
              }))
              .slice(0, 5);

        sinImagen.push({ ...item, candidatos });
      }
    }

    // 4. Archivos del Drive que no fueron asignados a ningún producto con imagen real
    const usadosUrls = new Set(
      productos
        .filter(p => isRealDriveImage(p.imagen_url))
        .map(p => p.imagen_url)
    );
    const archivosNoUsados = driveIndex.filter(f => {
      // No tenemos forma de saber 100% si fue subido (cambia el filename), pero podemos
      // aproximar: ningún producto tiene una imagen cuyo URL contenga el filename
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const used = [...usadosUrls].some(u => u.includes(safeName));
      return !used;
    }).map(f => ({ id: f.id, name: f.name, drive_view_url: `https://drive.google.com/file/d/${f.id}/view` }));

    const url = new URL(req.url);
    const onlyMissing = url.searchParams.get('only') === 'missing';

    // Resumen compacto: solo nombre/sku/activo + nombres de archivos candidatos
    const sinImagenCompact = sinImagen.map(s => ({
      nombre: s.nombre,
      sku: s.sku,
      activo: s.activo,
      candidatos: (s.candidatos || []).map(c => c.name),
    })).sort((a, b) => {
      const ac = a.candidatos?.length || 0;
      const bc = b.candidatos?.length || 0;
      if (ac !== bc) return bc - ac;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    return Response.json({
      ok: true,
      total_productos: productos.length,
      total_con_imagen_real: conImagen.length,
      total_sin_imagen_real: sinImagen.length,
      total_drive_files: driveFiles.length,
      total_drive_no_usados: archivosNoUsados.length,
      sin_imagen: sinImagenCompact,
      drive_no_usados: archivosNoUsados.map(f => f.name),
      ...(onlyMissing ? {} : {
        con_imagen: conImagen.map(c => c.nombre).sort(),
      }),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});