// PEYU · drivePreviewMapping
// Match determinístico carpeta→producto. Devuelve preview SIN tocar la BD.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const extractFolderId = (input) => {
  if (!input) return null;
  const m = String(input).match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : input.trim();
};

const normalizar = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const carpetasGenericas = ['contenido extra', 'corporativos', 'hogar', 'escritorio', 'juegos', 'b2c', 'b2b'];

const aliases = {
  'circ': ['circular', 'circulo', 'redondo', 'redondos'],
  'hex': ['hexagonal', 'hexagonales', 'hexagono'],
  'macetero': ['macetero', 'maceta', 'maceteros', 'platito'],
  'cacho': ['cacho', 'cachos', 'todo terreno', 'dado'],
  'lampara': ['lampara', 'chillka', 'iluminacion'],
  'libro': ['libro', 'libreta', 'cuaderno', 'agenda'],
  'posavaso': ['posavaso', 'posavasos'],
};

const expandKeywords = (carpetaNorm) => {
  const tokens = carpetaNorm.split(' ');
  const expanded = new Set(tokens);
  for (const t of tokens) {
    for (const [base, alts] of Object.entries(aliases)) {
      if (t.includes(base) || base.includes(t)) {
        alts.forEach(a => expanded.add(a));
      }
    }
  }
  return [...expanded];
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const folderId = extractFolderId(body.folderId || '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR');

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    const listChildren = async (parentId) => {
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
    };

    // BFS recursivo: agrupa imágenes por su carpeta padre directa
    const folderImages = {};
    const queue = [{ id: folderId, path: '', depth: 0 }];
    const maxDepth = 4;

    while (queue.length > 0) {
      const current = queue.shift();
      const children = await listChildren(current.id);
      const imagesHere = [];
      for (const f of children) {
        const fullPath = current.path ? `${current.path}/${f.name}` : f.name;
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          if (current.depth + 1 < maxDepth) {
            queue.push({ id: f.id, path: fullPath, depth: current.depth + 1 });
          }
        } else if (f.mimeType?.startsWith('image/')) {
          imagesHere.push({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size });
        }
      }
      if (imagesHere.length > 0) {
        const k = current.path || '(root)';
        folderImages[k] = imagesHere;
      }
    }

    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 500);
    const productosResumen = productos.map(p => ({
      id: p.id, sku: p.sku, nombre: p.nombre, categoria: p.categoria, activo: p.activo !== false,
    }));

    const mapeos = [];
    for (const [carpeta, imagenes] of Object.entries(folderImages)) {
      const carpetaHoja = carpeta.split('/').pop();
      const carpetaNorm = normalizar(carpetaHoja);

      if (carpetasGenericas.some(g => carpetaNorm === g)) {
        mapeos.push({ carpeta, skip: true, productos: [], razon_skip: 'Carpeta genérica' });
        continue;
      }

      const keywords = expandKeywords(carpetaNorm);

      const scored = productosResumen
        .filter(p => p.activo)
        .map(p => {
          const nombreNorm = normalizar(p.nombre);
          let score = 0;
          const matched = [];
          for (const kw of keywords) {
            if (kw.length < 3) continue;
            if (nombreNorm.includes(kw)) {
              score += kw.length;
              matched.push(kw);
            }
          }
          if (nombreNorm.includes(carpetaNorm)) score += 5;
          return { producto: p, score, matched };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) {
        mapeos.push({ carpeta, skip: true, productos: [], razon_skip: 'Sin match en catálogo' });
        continue;
      }

      const topScore = scored[0].score;
      const winners = scored.filter(s => s.score >= topScore * 0.7).slice(0, 3);

      mapeos.push({
        carpeta,
        skip: false,
        productos: winners.map(w => ({
          producto_id: w.producto.id,
          sku: w.producto.sku,
          nombre: w.producto.nombre,
          confianza: Math.min(1, w.score / 15),
          razon: `Match en: ${w.matched.join(', ')}`,
        })),
      });
    }

    const preview = mapeos.map(m => ({
      ...m,
      cantidad_imagenes: folderImages[m.carpeta]?.length || 0,
      imagenes_sample: (folderImages[m.carpeta] || []).slice(0, 3).map(i => i.name),
    }));

    const stats = {
      total_carpetas: preview.length,
      carpetas_skip: preview.filter(p => p.skip).length,
      carpetas_match: preview.filter(p => !p.skip).length,
      total_imagenes_a_migrar: preview.filter(p => !p.skip).reduce((acc, p) => acc + p.cantidad_imagenes, 0),
      total_productos_match: preview.filter(p => !p.skip).reduce((acc, p) => acc + p.productos.length, 0),
    };

    return Response.json({
      ok: true,
      stats,
      preview,
      raw_mapping: mapeos.map(m => ({
        carpeta: m.carpeta,
        skip: m.skip || false,
        producto_ids: (m.productos || []).map(p => p.producto_id),
        files: folderImages[m.carpeta] || [],
      })),
    });
  } catch (error) {
    console.error('drivePreviewMapping error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});