// PEYU · fixBrokenProductImagesFromDrive
// Para cada producto activo con imagen rota, busca en el Drive una carpeta que
// matchee por keywords del nombre del producto, descarga 3-5 fotos y las asigna.
// Se procesa POR LOTES pequeños (default 3 productos) para evitar timeouts.
//
// Body: { batchSize?: 3, offset?: 0 }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';
const MAX_FILES_PER_PRODUCT = 4;

// Carpetas genéricas a IGNORAR (matchearían a todo lo de la categoría)
const SKIP_FOLDER_PATTERNS = [
  /contenido extra/i,
  /^carcasas/i, // carcasas tiene su propio matching especializado
];

const slugify = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const STOP = new Set([
  'de','la','el','los','las','un','una','para','con','sin','y','o','en','del','al',
  'peyu','plastico','reciclado','reciclada','ecologico','ecologica','100','%',
  'pack','set','base44','file','image','img','copy','final',
]);

const tokenize = (s) => slugify(s).split(' ').filter(t => t.length >= 3 && !STOP.has(t));

async function urlIsAlive(url) {
  if (!url) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return false;
    const ct = r.headers.get('content-type') || '';
    return ct.startsWith('image/');
  } catch { return false; }
}

async function listChildren(parentId, headers) {
  const out = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({
      q: `'${parentId}' in parents and trashed = false`,
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

async function walkTree(rootId, headers, maxDepth = 4) {
  const result = new Map();
  const queue = [{ id: rootId, path: '', depth: 0 }];
  while (queue.length) {
    const cur = queue.shift();
    const children = await listChildren(cur.id, headers);
    const filesHere = [];
    for (const c of children) {
      const childPath = cur.path ? `${cur.path}/${c.name}` : c.name;
      if (c.mimeType === 'application/vnd.google-apps.folder') {
        if (cur.depth + 1 <= maxDepth) {
          queue.push({ id: c.id, path: childPath, depth: cur.depth + 1 });
        }
      } else if (c.mimeType?.startsWith('image/') && Number(c.size || 0) > 5000) {
        filesHere.push({ id: c.id, name: c.name, mimeType: c.mimeType, size: Number(c.size || 0) });
      }
    }
    if (filesHere.length > 0 && cur.path) {
      const top = filesHere.sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, MAX_FILES_PER_PRODUCT);
      result.set(cur.path, { folderId: cur.id, files: top });
    }
  }
  return result;
}

// Mapa de palabras clave del producto → patrón de carpeta del Drive
const KEYWORD_TO_FOLDER = [
  { keys: ['cacho', 'cubilete', 'dado'], folderPatterns: [/cachos/i] },
  { keys: ['posavaso', 'posavasos'], folderPatterns: [/posavasos/i] },
  { keys: ['macetero', 'maceta'], folderPatterns: [/maceteros/i] },
  { keys: ['lampara', 'lámpara'], folderPatterns: [/lampar/i] },
  { keys: ['llavero'], folderPatterns: [/llaver/i] },
  { keys: ['soporte celular', 'porta celular', 'soporte cel'], folderPatterns: [/soporte celular/i, /soporte cel/i] },
  { keys: ['kit pro', 'pack escritorio pro', 'pack pro'], folderPatterns: [/kit pro/i, /soporte pro/i] },
  { keys: ['pack escritorio', 'kit escritorio', 'portanotebook', 'porta notebook'], folderPatterns: [/escritorio/i] },
  { keys: ['paleta'], folderPatterns: [/paleta/i] },
  { keys: ['cuadro'], folderPatterns: [/cuadro/i, /retrato/i] },
  { keys: ['pocillo', 'bowl'], folderPatterns: [/pocillo/i, /bowl/i] },
  { keys: ['jenga'], folderPatterns: [/jenga/i] },
];

function scoreFolderForProduct(folderPath, prod) {
  const folderPathLow = folderPath.toLowerCase();
  const prodText = `${prod.nombre || ''} ${prod.descripcion || ''}`.toLowerCase();

  let hits = 0;

  // 1. Match por keyword → carpeta (lo más confiable)
  for (const map of KEYWORD_TO_FOLDER) {
    if (map.keys.some(k => prodText.includes(k))) {
      if (map.folderPatterns.some(p => p.test(folderPath))) {
        hits += 5; // match fuerte
      }
    }
  }

  // 2. Match tokens
  const folderTokens = new Set(tokenize(folderPath.replace(/\//g, ' ')));
  const prodTokens = new Set(tokenize(prodText));
  for (const t of folderTokens) {
    if (prodTokens.has(t)) hits += 1;
  }

  // 3. Boost categoría (solo si carpeta no es genérica/raíz)
  const segments = folderPathLow.split('/');
  if (segments.length >= 2) {
    const cat = (prod.categoria || '').toLowerCase();
    if (segments[0] === 'hogar' && cat === 'hogar') hits += 2;
    if (segments[0] === 'corporativos' && cat === 'corporativo') hits += 2;
    if (segments[0].includes('escritorio') && cat === 'escritorio') hits += 2;
  }

  return hits;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.max(1, Math.min(Number(body.batchSize) || 3, 5));
    const offset = Number(body.offset) || 0;

    // 1. Detectar productos rotos
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 300);
    const rotos = [];
    for (let i = 0; i < productos.length; i += 10) {
      const chunk = productos.slice(i, i + 10);
      const checks = await Promise.all(chunk.map(async (p) => ({ p, ok: await urlIsAlive(p.imagen_url) })));
      for (const { p, ok } of checks) if (!ok) rotos.push(p);
    }

    if (rotos.length === 0) {
      return Response.json({ ok: true, message: 'No hay productos rotos', total_rotos: 0 });
    }

    // 2. Recorrer Drive
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    const tree = await walkTree(ROOT_FOLDER, headers);
    const folderList = [...tree.entries()];

    // 3. Procesar batch
    const batch = rotos.slice(offset, offset + batchSize);
    const results = [];

    for (const prod of batch) {
      // Buscar mejor carpeta (ignorando genéricas)
      let best = null, bestScore = 0;
      for (const [folderPath, fdata] of folderList) {
        if (SKIP_FOLDER_PATTERNS.some(p => p.test(folderPath))) continue;
        const score = scoreFolderForProduct(folderPath, prod);
        if (score > bestScore) {
          best = { folderPath, fdata };
          bestScore = score;
        }
      }

      if (!best || bestScore < 3) {
        results.push({ sku: prod.sku, nombre: prod.nombre, ok: false, reason: 'no_match', score: bestScore });
        continue;
      }

      // Subir archivos
      const uploadedUrls = [];
      for (const file of best.fdata.files) {
        try {
          const dlR = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
            { headers }
          );
          if (!dlR.ok) continue;
          const blob = await dlR.blob();
          if (blob.size < 5000) continue;
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const upFile = new File([blob], `${prod.sku || 'prod'}-drv-${safeName}`, {
            type: file.mimeType || 'image/jpeg',
          });
          const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: upFile });
          if (upload?.file_url) {
            // Normalizar URL legacy -> media.base44.com
            const fixed = upload.file_url.replace(
              /^https:\/\/base44\.app\/api\/apps\/[a-f0-9]+\/files\/mp\/public\/([a-f0-9]+)\/(.+)$/,
              'https://media.base44.com/images/public/$1/$2'
            );
            uploadedUrls.push(fixed);
          }
        } catch (err) {
          // continúa
        }
      }

      if (uploadedUrls.length === 0) {
        results.push({ sku: prod.sku, nombre: prod.nombre, ok: false, reason: 'upload_failed', folder: best.folderPath });
        continue;
      }

      // Actualizar producto
      const existing = Array.isArray(prod.galeria_urls) ? prod.galeria_urls.filter(u => u && !u.includes('base44.app/api/apps')) : [];
      await base44.asServiceRole.entities.Producto.update(prod.id, {
        imagen_url: uploadedUrls[0],
        galeria_urls: [...uploadedUrls, ...existing].slice(0, 10),
      });

      results.push({
        sku: prod.sku,
        nombre: prod.nombre,
        ok: true,
        folder: best.folderPath,
        score: bestScore,
        files_uploaded: uploadedUrls.length,
      });
    }

    return Response.json({
      ok: true,
      total_rotos: rotos.length,
      offset,
      batchSize,
      processed: batch.length,
      next_offset: offset + batch.length < rotos.length ? offset + batch.length : null,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});