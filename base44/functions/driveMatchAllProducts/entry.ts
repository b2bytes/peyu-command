// PEYU · driveMatchAllProducts
// Matchea TODAS las subcarpetas del Drive raíz contra el catálogo de productos
// (categoría != Carcasas B2C, eso ya lo cubre visionMatchCarcasas).
//
// Estrategia: las carpetas del Drive están bien organizadas por tipo de producto
// (ej: "Hogar/Posavasos CIRC", "Hogar/Maceteros", "Corporativos/Cachos").
// Para cada subcarpeta calculamos qué producto del catálogo le corresponde por
// matching de keywords contra (nombre + descripción + categoría).
//
// Body: { mode: "preview" | "apply", folderId?, replacePrincipal?: bool, selection?: [{folder_path, producto_id}] }
//
// preview → devuelve mapping carpeta→producto sugerido + score; nada se modifica.
// apply   → para cada carpeta confirmada, sube TODAS sus imágenes y las asigna
//           al producto (galeria_urls + imagen_url si replacePrincipal).
//
// Sin Vision: los nombres de carpeta ya describen el producto. Mucho más confiable
// y barato que clasificar imagen por imagen.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';
const SKIP_FOLDERS = ['Carcasas', 'Contenido extra', 'Corporativos/Contenido extra'];

// ───────── Normalización ─────────
const slugify = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const STOP = new Set([
  'de','la','el','los','las','un','una','para','con','sin','y','o','en','del','al',
  'peyu','plastico','reciclado','reciclada','ecologico','ecologica','100','%',
  'pack','set','con','base44','file','image','img','jpg','jpeg','png','webp',
  'whatsapp','at','am','pm','copy','final','editado',
]);

const tokenize = (s) => slugify(s).split(' ').filter(t => t.length >= 3 && !STOP.has(t));

// ───────── Drive helpers ─────────
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

// Recorre el árbol y devuelve { path → { folderId, files: [{id,name,mimeType}] } }
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
      // Quedarnos con los archivos más grandes (mejor calidad) — limitamos a 10 por carpeta
      // para evitar timeouts en apply.
      const top = filesHere
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 10);
      result.set(cur.path, { folderId: cur.id, files: top });
    }
  }
  return result;
}

// ───────── Matching carpeta → producto ─────────
// Score = cantidad de tokens distintos del nombre de carpeta que aparecen en
// (nombre + descripcion + categoria) del producto. Usamos también la categoría
// del path Drive como hint fuerte.
function scoreProducto(folderPath, prod) {
  const folderTokens = new Set(tokenize(folderPath.replace(/\//g, ' ')));
  const prodText = `${prod.nombre || ''} ${prod.descripcion || ''} ${prod.categoria || ''}`;
  const prodTokens = new Set(tokenize(prodText));

  let hits = 0;
  for (const t of folderTokens) {
    if (prodTokens.has(t)) hits += 1;
  }

  // Boost por categoría: si la carpeta empieza con "Hogar" y el producto es Hogar, +2.
  const folderRoot = folderPath.split('/')[0].toLowerCase();
  const cat = (prod.categoria || '').toLowerCase();
  if (folderRoot === 'hogar' && cat === 'hogar') hits += 2;
  if (folderRoot === 'corporativos' && cat === 'corporativo') hits += 2;
  if (folderRoot.includes('escritorio') && cat === 'escritorio') hits += 2;
  if (folderRoot.includes('entreten') && cat === 'entretenimiento') hits += 2;

  return { score: hits, folderTokens: [...folderTokens], matchedTokens: [...folderTokens].filter(t => prodTokens.has(t)) };
}

function bestProductoForFolder(folderPath, productos) {
  let best = null, bestScore = 0, bestDetail = null;
  for (const prod of productos) {
    const { score, matchedTokens } = scoreProducto(folderPath, prod);
    if (score > bestScore) {
      best = prod;
      bestScore = score;
      bestDetail = { matchedTokens };
    }
  }
  // Necesitamos al menos 2 keywords compartidas para considerar un match válido
  if (bestScore < 2) return null;
  return { producto: best, score: bestScore, ...bestDetail };
}

// ───────── Handler ─────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = ['apply', 'applySelection'].includes(body.mode) ? body.mode : 'preview';
    const folderId = body.folderId || ROOT_FOLDER;
    const replacePrincipal = body.replacePrincipal === true; // default false (no pisar imagen actual)
    const selection = Array.isArray(body.selection) ? body.selection : [];
    const maxAssignments = Math.max(1, Math.min(Number(body.maxAssignments) || 5, 14));
    const skipExisting = body.skipExisting !== false; // default true: saltar productos que ya tienen galería

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 1. Recorrer Drive
    const tree = await walkTree(folderId, headers);

    // 2. Cargar productos NO-carcasas (esa categoría la maneja visionMatchCarcasas)
    const productos = await base44.asServiceRole.entities.Producto.filter({}, '-updated_date', 500);
    const productosTarget = productos.filter(p => p.categoria !== 'Carcasas B2C');

    // 3. Para cada carpeta, encontrar mejor producto
    const folderPlan = [];
    for (const [folderPath, folderData] of tree.entries()) {
      if (SKIP_FOLDERS.includes(folderPath)) continue;
      const match = bestProductoForFolder(folderPath, productosTarget);
      folderPlan.push({
        folder_path: folderPath,
        folder_id: folderData.folderId,
        files_count: folderData.files.length,
        files: folderData.files.slice(0, 5).map(f => f.name),
        suggestion: match ? {
          producto_id: match.producto.id,
          producto_sku: match.producto.sku,
          producto_nombre: match.producto.nombre,
          categoria: match.producto.categoria,
          score: match.score,
          matched_tokens: match.matchedTokens,
        } : null,
      });
    }
    folderPlan.sort((a, b) => {
      if (!!a.suggestion !== !!b.suggestion) return a.suggestion ? -1 : 1;
      return (b.suggestion?.score || 0) - (a.suggestion?.score || 0);
    });

    if (mode === 'preview') {
      // Catálogo plano para dropdowns en UI
      const catalogo = productosTarget.map(p => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria,
        imagen_url: p.imagen_url || null,
      })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

      return Response.json({
        ok: true,
        mode: 'preview',
        total_folders_scanned: tree.size,
        total_folders_with_match: folderPlan.filter(f => f.suggestion).length,
        total_folders_without_match: folderPlan.filter(f => !f.suggestion).length,
        folders: folderPlan,
        catalogo,
      });
    }

    // ── Apply ─────────────────────────────────────────────────────
    let assignments = [];
    if (mode === 'applySelection') {
      // Selection: [{ folder_path, producto_id }]
      for (const sel of selection) {
        const fdata = tree.get(sel.folder_path);
        const prod = productosTarget.find(p => p.id === sel.producto_id);
        if (!fdata || !prod) continue;
        assignments.push({ folder_path: sel.folder_path, files: fdata.files, producto: prod });
      }
    } else {
      // Apply automático: solo carpetas con score >= 3
      for (const plan of folderPlan) {
        if (!plan.suggestion || plan.suggestion.score < 3) continue;
        const fdata = tree.get(plan.folder_path);
        const prod = productosTarget.find(p => p.id === plan.suggestion.producto_id);
        if (!fdata || !prod) continue;
        // Saltar productos que ya tienen galería con archivos del Drive (-drv-)
        if (skipExisting && Array.isArray(prod.galeria_urls) && prod.galeria_urls.some(u => /-drv-/i.test(u))) {
          continue;
        }
        assignments.push({ folder_path: plan.folder_path, files: fdata.files, producto: prod });
        if (assignments.length >= maxAssignments) break;
      }
    }

    const results = [];
    const updatesPorProducto = {};

    for (const assg of assignments) {
      const uploadedUrls = [];
      for (const file of assg.files) {
        try {
          const dlR = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
            { headers }
          );
          if (!dlR.ok) {
            results.push({ folder: assg.folder_path, file: file.name, ok: false, error: `Drive ${dlR.status}` });
            continue;
          }
          const blob = await dlR.blob();
          if (blob.size < 5000) continue;

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const upFile = new File([blob], `${assg.producto.sku || 'prod'}-drv-${safeName}`, {
            type: file.mimeType || 'image/jpeg',
          });
          const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: upFile });
          if (upload?.file_url) {
            uploadedUrls.push(upload.file_url);
            results.push({ folder: assg.folder_path, file: file.name, ok: true, uploaded_url: upload.file_url });
          }
        } catch (err) {
          results.push({ folder: assg.folder_path, file: file.name, ok: false, error: err.message });
        }
      }

      if (uploadedUrls.length > 0) {
        const k = assg.producto.id;
        if (!updatesPorProducto[k]) {
          updatesPorProducto[k] = { producto: assg.producto, urls: [] };
        }
        updatesPorProducto[k].urls.push(...uploadedUrls);
      }
    }

    // Aplicar a productos
    let productosActualizados = 0;
    for (const { producto, urls } of Object.values(updatesPorProducto)) {
      if (urls.length === 0) continue;
      const existing = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
      const patch = {
        galeria_urls: [...new Set([...urls, ...existing])],
        activo: true,
      };
      if (replacePrincipal || !producto.imagen_url) {
        patch.imagen_url = urls[0];
      }
      await base44.asServiceRole.entities.Producto.update(producto.id, patch);
      productosActualizados += 1;
    }

    return Response.json({
      ok: true,
      mode,
      total_assignments: assignments.length,
      total_files_uploaded: results.filter(r => r.ok).length,
      total_files_failed: results.filter(r => !r.ok).length,
      productos_actualizados: productosActualizados,
      replace_principal: replacePrincipal,
      results: results.slice(0, 200),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});