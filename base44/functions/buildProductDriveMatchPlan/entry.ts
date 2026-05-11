// PEYU · buildProductDriveMatchPlan
// Genera un plan 1:1 producto→carpeta Drive con archivos exactos a usar.
// Excluye Carcasas B2C (ya resueltas).
// Retorna un mapping limpio que el frontend puede mostrar y aplicar.
//
// Body: { mode: "plan" | "apply", assignments?: [{producto_id, folder_path, files: [{id,name}]}], replacePrincipal?: bool }
//
// plan  → devuelve por producto activo (no carcasa) una sugerencia de carpeta + lista de hasta 8 archivos
// apply → toma assignments del usuario y sube + asigna esas imágenes al producto

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';

// Carpetas que NUNCA queremos asignar a productos (genéricas, materiales sueltos)
const EXCLUDED_FOLDERS = new Set([
  'Contenido extra',
  'Carcasas',
  'Carcasas/Grabados',
  'Corporativos/Contenido extra',
]);

// Mapeo de keywords del nombre del producto → carpeta Drive específica.
// Esto es manual y curado: cada producto sabe a qué carpeta apuntar.
// ORDEN IMPORTA (de más específico a más genérico).
const MANUAL_MAP = [
  // ── Posavasos ──────────────────────────────────────────────
  { match: /posavaso.*hex|hexagonal/i,                         folder: 'Hogar/Posavasos HEX' },
  { match: /posavaso.*circ|posavaso.*redondo|circular/i,       folder: 'Hogar/Posavasos CIRC' },
  { match: /posavaso.*cuadr|posavaso.*cuad/i,                  folder: 'Hogar/Posavasos CIRC' }, // fallback (no hay carpeta cuadrados)
  { match: /posavaso/i,                                        folder: 'Hogar/Posavasos HEX' },

  // ── Maceteros ──────────────────────────────────────────────
  { match: /macetero/i,                                        folder: 'Hogar/Maceteros' },

  // ── Cachos ─────────────────────────────────────────────────
  { match: /cacho.*pack.*4|pack.*4.*cacho/i,                   folder: 'Corporativos/Cachos' },
  { match: /cacho.*pack.*5|pack.*5.*cacho/i,                   folder: 'Corporativos/Cachos' },
  { match: /cacho.*pack.*6|pack.*6.*cacho|seis|todo terreno/i, folder: 'Corporativos/Cachos' },
  { match: /cacho/i,                                           folder: 'Corporativos/Cachos' },

  // ── Escritorio / Packs / Soportes ──────────────────────────
  { match: /kit.*pro|pack.*pro|escritorio.*pro/i,              folder: 'Corporativos/Escritorio' },
  { match: /pack.*escritorio|kit.*escritorio|home office/i,    folder: 'Corporativos/Escritorio' },
  { match: /soporte.*notebook|porta.*notebook|portanotebook/i, folder: 'Corporativos/Escritorio' },
  { match: /soporte.*celular|porta.*celular/i,                 folder: 'Corporativos/Escritorio' },
  { match: /llavero/i,                                         folder: 'Corporativos/Escritorio' },

  // ── Hogar corporativo (catch-all) ──────────────────────────
  { match: /lampara|chillka/i,                                 folder: 'Corporativos/Hogar' },
  { match: /paleta/i,                                          folder: 'Corporativos/Hogar' },
  { match: /jenga/i,                                           folder: 'Corporativos/Hogar' },
  { match: /cuadro|diseño|paisaje/i,                           folder: 'Corporativos/Hogar' },
  { match: /pocillo|bowl/i,                                    folder: 'Corporativos/Hogar' },
];

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
        filesHere.push({ id: c.id, name: c.name, size: Number(c.size || 0), mimeType: c.mimeType });
      }
    }
    if (filesHere.length > 0 && cur.path && !EXCLUDED_FOLDERS.has(cur.path)) {
      // Ordenar por tamaño descendente (mejor calidad primero)
      filesHere.sort((a, b) => b.size - a.size);
      result.set(cur.path, { folderId: cur.id, files: filesHere });
    }
  }
  return result;
}

function suggestFolder(producto) {
  const text = `${producto.nombre || ''} ${producto.descripcion || ''}`;
  for (const rule of MANUAL_MAP) {
    if (rule.match.test(text)) return rule.folder;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'plan';
    const replacePrincipal = body.replacePrincipal === true;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // ── PLAN ─────────────────────────────────────────────────────
    if (mode === 'plan') {
      const tree = await walkTree(ROOT_FOLDER, headers);
      const productos = await base44.asServiceRole.entities.Producto.filter(
        { activo: true },
        '-updated_date',
        300
      );
      const target = productos.filter(p => p.categoria !== 'Carcasas B2C');

      const plan = target.map(p => {
        const suggested = suggestFolder(p);
        const fdata = suggested ? tree.get(suggested) : null;
        return {
          producto_id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria: p.categoria,
          imagen_actual: p.imagen_url || null,
          galeria_count: Array.isArray(p.galeria_urls) ? p.galeria_urls.length : 0,
          carpeta_sugerida: suggested,
          archivos_disponibles: fdata
            ? fdata.files.slice(0, 8).map(f => ({ id: f.id, name: f.name, size: f.size, mimeType: f.mimeType }))
            : [],
          carpeta_id: fdata?.folderId || null,
          status: suggested ? (fdata ? 'ok' : 'folder_empty') : 'no_match',
        };
      });

      // Carpetas Drive (catálogo plano para que el UI permita override manual)
      const folderCatalog = [...tree.entries()].map(([path, data]) => ({
        path,
        folder_id: data.folderId,
        count: data.files.length,
        samples: data.files.slice(0, 5).map(f => ({ id: f.id, name: f.name })),
      })).sort((a, b) => a.path.localeCompare(b.path));

      return Response.json({
        ok: true,
        mode: 'plan',
        total_productos: target.length,
        con_carpeta: plan.filter(p => p.status === 'ok').length,
        sin_match: plan.filter(p => p.status === 'no_match').length,
        plan,
        folderCatalog,
      });
    }

    // ── APPLY ────────────────────────────────────────────────────
    const assignments = Array.isArray(body.assignments) ? body.assignments : [];
    if (assignments.length === 0) {
      return Response.json({ error: 'Sin assignments' }, { status: 400 });
    }

    const results = [];
    for (const assg of assignments) {
      const prod = await base44.asServiceRole.entities.Producto.filter({ id: assg.producto_id }, '', 1);
      if (!prod[0]) {
        results.push({ producto_id: assg.producto_id, ok: false, error: 'no_producto' });
        continue;
      }
      const producto = prod[0];
      const files = Array.isArray(assg.files) ? assg.files.slice(0, 8) : [];
      const uploadedUrls = [];

      for (const file of files) {
        try {
          const dlR = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
            { headers }
          );
          if (!dlR.ok) continue;
          const blob = await dlR.blob();
          if (blob.size < 5000) continue;
          const safe = (file.name || 'img').replace(/[^a-zA-Z0-9._-]/g, '_');
          const upFile = new File([blob], `${producto.sku || 'prod'}-drv-${safe}`, {
            type: file.mimeType || 'image/jpeg',
          });
          const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: upFile });
          if (upload?.file_url) uploadedUrls.push(upload.file_url);
        } catch (_e) { /* ignore single file error */ }
      }

      if (uploadedUrls.length === 0) {
        results.push({ producto_id: assg.producto_id, sku: producto.sku, ok: false, error: 'no_uploads' });
        continue;
      }

      const patch = {
        galeria_urls: uploadedUrls, // reemplazo total: queda la galería curada
        activo: true,
      };
      if (replacePrincipal || !producto.imagen_url) {
        patch.imagen_url = uploadedUrls[0];
      }
      await base44.asServiceRole.entities.Producto.update(producto.id, patch);
      results.push({
        producto_id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        ok: true,
        uploaded: uploadedUrls.length,
        new_principal: patch.imagen_url || producto.imagen_url,
      });
    }

    return Response.json({
      ok: true,
      mode: 'apply',
      total: assignments.length,
      success: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});