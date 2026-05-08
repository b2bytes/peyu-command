// PEYU · driveListFolderImages
// Lista todas las imágenes dentro de una carpeta de Google Drive (recursivo opcional).
// Devuelve id, name, mimeType, size, parents para hacer matching con productos.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Extrae el folderId de un link de Drive (.../folders/<ID>?...) o lo devuelve tal cual si ya es un ID.
const extractFolderId = (input) => {
  if (!input) return null;
  const m = String(input).match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : input.trim();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const folderId = extractFolderId(body.folderId || body.folderUrl || '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR');
    if (!folderId) {
      return Response.json({ error: 'folderId requerido' }, { status: 400 });
    }

    const recursive = body.recursive !== false; // default true
    const maxDepth = Number(body.maxDepth) || 4;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    const listChildren = async (parentId) => {
      const out = [];
      let pageToken = null;
      do {
        const params = new URLSearchParams({
          q: `'${parentId}' in parents and trashed = false`,
          fields: 'nextPageToken,files(id,name,mimeType,size,md5Checksum,parents)',
          pageSize: '200',
          supportsAllDrives: 'true',
          includeItemsFromAllDrives: 'true',
        });
        if (pageToken) params.set('pageToken', pageToken);
        const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers });
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(`Drive ${r.status}: ${txt.slice(0, 200)}`);
        }
        const data = await r.json();
        out.push(...(data.files || []));
        pageToken = data.nextPageToken || null;
      } while (pageToken);
      return out;
    };

    const allFiles = [];
    const folders = [];
    const queue = [{ id: folderId, path: '', depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const children = await listChildren(current.id);
      for (const f of children) {
        const fullPath = current.path ? `${current.path}/${f.name}` : f.name;
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          folders.push({ id: f.id, name: f.name, path: fullPath, depth: current.depth + 1 });
          if (recursive && current.depth + 1 < maxDepth) {
            queue.push({ id: f.id, path: fullPath, depth: current.depth + 1 });
          }
        } else if (f.mimeType?.startsWith('image/')) {
          allFiles.push({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            md5: f.md5Checksum,
            path: fullPath,
            parentFolder: current.path || '(root)',
          });
        }
      }
    }

    // Agrupa por carpeta padre para entender la estructura
    const byFolder = {};
    for (const f of allFiles) {
      const k = f.parentFolder;
      if (!byFolder[k]) byFolder[k] = { count: 0, samples: [] };
      byFolder[k].count += 1;
      if (byFolder[k].samples.length < 4) byFolder[k].samples.push(f.name);
    }

    if (body.summary) {
      return Response.json({
        ok: true,
        folderId,
        totalImages: allFiles.length,
        totalFolders: folders.length,
        byFolder,
      });
    }

    return Response.json({
      ok: true,
      folderId,
      totalImages: allFiles.length,
      totalFolders: folders.length,
      byFolder,
      folders: folders.slice(0, 50),
      sample: allFiles.slice(0, 15),
      files: allFiles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});