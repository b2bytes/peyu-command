// PEYU · driveMigrateProductImages
// Recibe un mapping (carpeta → producto_ids → files) y migra las imágenes:
//   1. Descarga imagen desde Google Drive con accessToken
//   2. La sube al CDN de Base44 vía integrations.Core.UploadFile
//   3. Asigna la primera como imagen_url principal y las demás van a galeria_urls
//
// Se procesa en LOTES para no agotar el timeout. El frontend lo invoca en bucle
// pasando el cursor (índice de inicio dentro del array de tareas).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { mapping = [], cursor = 0, batchSize = 8, replacePrincipal = true } = body;

    if (!Array.isArray(mapping) || mapping.length === 0) {
      return Response.json({ error: 'mapping requerido' }, { status: 400 });
    }

    // Aplana las tareas: cada tarea es { producto_id, files: [...] }
    // Si una carpeta tiene varios productos, todos reciben las mismas imágenes.
    const tareas = [];
    for (const m of mapping) {
      if (m.skip) continue;
      const files = m.files || [];
      const ids = m.producto_ids || [];
      if (files.length === 0 || ids.length === 0) continue;
      for (const pid of ids) {
        tareas.push({ producto_id: pid, carpeta: m.carpeta, files });
      }
    }

    const total = tareas.length;
    const lote = tareas.slice(cursor, cursor + batchSize);

    if (lote.length === 0) {
      return Response.json({ ok: true, done: true, total, processed: cursor });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const resultados = [];

    for (const tarea of lote) {
      try {
        // Descarga las imágenes y sube cada una a Base44
        const nuevasUrls = [];
        for (const f of tarea.files) {
          try {
            const r = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!r.ok) {
              resultados.push({ producto_id: tarea.producto_id, file: f.name, ok: false, error: `Drive ${r.status}` });
              continue;
            }
            const blob = await r.blob();
            const file = new File([blob], f.name, { type: blob.type || f.mimeType || 'image/jpeg' });
            const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
            if (upload?.file_url) {
              nuevasUrls.push(upload.file_url);
            }
          } catch (err) {
            resultados.push({ producto_id: tarea.producto_id, file: f.name, ok: false, error: err.message });
          }
        }

        if (nuevasUrls.length === 0) {
          resultados.push({ producto_id: tarea.producto_id, ok: false, error: 'Sin URLs migradas' });
          continue;
        }

        // Actualiza el producto
        const producto = await base44.asServiceRole.entities.Producto.get(tarea.producto_id);
        if (!producto) {
          resultados.push({ producto_id: tarea.producto_id, ok: false, error: 'Producto no encontrado' });
          continue;
        }

        const galeriaActual = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
        // Dedup: nuevas + galería actual, sin duplicados
        const galeriaFinal = [...new Set([...nuevasUrls, ...galeriaActual])];

        const patch = { galeria_urls: galeriaFinal };
        if (replacePrincipal || !producto.imagen_url) {
          patch.imagen_url = nuevasUrls[0];
        }

        await base44.asServiceRole.entities.Producto.update(tarea.producto_id, patch);

        resultados.push({
          producto_id: tarea.producto_id,
          carpeta: tarea.carpeta,
          ok: true,
          imagenes_migradas: nuevasUrls.length,
          principal_actualizada: !!patch.imagen_url,
        });
      } catch (err) {
        resultados.push({ producto_id: tarea.producto_id, ok: false, error: err.message });
      }
    }

    const nextCursor = cursor + lote.length;

    return Response.json({
      ok: true,
      done: nextCursor >= total,
      total,
      processed: nextCursor,
      remaining: Math.max(0, total - nextCursor),
      lote_size: lote.length,
      resultados,
    });
  } catch (error) {
    console.error('driveMigrateProductImages error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});