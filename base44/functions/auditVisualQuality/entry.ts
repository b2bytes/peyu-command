// ============================================================================
// auditVisualQuality — Auditoría visual de imágenes de productos.
//
// Escanea TODOS los productos activos del catálogo y detecta:
//   • Imágenes ROTAS (URL no responde o devuelve error)
//   • Imágenes de BAJA RESOLUCIÓN (< 600x600 o < 80KB)
//   • Imágenes DESACTUALIZADAS (anteriores a un umbral configurable, ej. > 12 meses)
//   • Imágenes SIN imagen (producto activo sin foto principal)
//
// Devuelve un listado priorizado por severidad (alta/media/baja) para que
// el operador pueda actuar rápido.
//
// Body:
//   { stale_months?: number = 12 }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MIN_BYTES = 80 * 1024;        // 80KB
const MIN_DIMENSION = 600;          // 600px lado más corto

// Lee dimensiones de una imagen probando los primeros bytes (JPEG / PNG / WebP).
// Implementación liviana sin librerías para no inflar el bundle Deno.
function readImageDimensions(buf) {
  const view = new DataView(buf);
  try {
    // PNG: 8 byte signature + IHDR
    if (view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
      const width = view.getUint32(16);
      const height = view.getUint32(20);
      return { width, height, format: 'PNG' };
    }
    // JPEG: 0xFFD8 ... SOFx markers
    if (view.getUint16(0) === 0xffd8) {
      let i = 2;
      while (i < buf.byteLength) {
        if (view.getUint8(i) !== 0xff) break;
        const marker = view.getUint8(i + 1);
        const len = view.getUint16(i + 2);
        // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
        if ((marker >= 0xc0 && marker <= 0xc3) ||
            (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) ||
            (marker >= 0xcd && marker <= 0xcf)) {
          const height = view.getUint16(i + 5);
          const width = view.getUint16(i + 7);
          return { width, height, format: 'JPEG' };
        }
        i += 2 + len;
      }
    }
    // WebP: "RIFF" .... "WEBP"
    if (view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) {
      // VP8X: dimensiones a partir del offset 24 (little endian 24 bits)
      const chunk = view.getUint32(12);
      if (chunk === 0x56503858) { // "VP8X"
        const w = (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16)) + 1;
        const h = (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16)) + 1;
        return { width: w, height: h, format: 'WebP' };
      }
      if (chunk === 0x56503820) { // "VP8 " (lossy)
        const w = view.getUint16(26, true) & 0x3fff;
        const h = view.getUint16(28, true) & 0x3fff;
        return { width: w, height: h, format: 'WebP' };
      }
    }
  } catch {}
  return { width: 0, height: 0, format: 'unknown' };
}

async function inspectImageUrl(url) {
  if (!url) return { ok: false, reason: 'no_url' };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);

    if (!r.ok) return { ok: false, status: r.status, reason: 'http_error' };

    const bytes = new Uint8Array(await r.arrayBuffer());
    const size = bytes.byteLength;
    const dims = readImageDimensions(bytes.buffer);

    return {
      ok: true,
      size_bytes: size,
      width: dims.width,
      height: dims.height,
      format: dims.format,
      content_type: r.headers.get('content-type') || '',
    };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'fetch_error' };
  }
}

function evaluate(producto, inspection, staleThresholdMs) {
  const issues = [];
  let severidad = 'ok';

  if (!producto.imagen_url) {
    return {
      severidad: 'alta',
      issues: ['sin_imagen'],
      tags: ['Sin imagen principal'],
    };
  }

  if (!inspection.ok) {
    issues.push('rota');
    severidad = 'alta';
    return {
      severidad,
      issues,
      tags: [`Imagen rota (${inspection.reason || 'error'})`],
    };
  }

  const tags = [];

  if (inspection.size_bytes && inspection.size_bytes < MIN_BYTES) {
    issues.push('baja_calidad');
    tags.push(`Peso bajo (${Math.round(inspection.size_bytes / 1024)}KB)`);
    severidad = 'media';
  }

  if (inspection.width && inspection.height) {
    const minSide = Math.min(inspection.width, inspection.height);
    if (minSide < MIN_DIMENSION) {
      issues.push('baja_resolucion');
      tags.push(`Resolución baja (${inspection.width}×${inspection.height})`);
      severidad = severidad === 'alta' ? 'alta' : 'media';
    }
  } else {
    // No se pudieron leer dimensiones (formato raro o respuesta corrupta)
    issues.push('dimensiones_desconocidas');
    tags.push('No se pudieron leer dimensiones');
    severidad = severidad === 'alta' ? 'alta' : 'media';
  }

  // Desactualizada: si el producto fue actualizado hace mucho tiempo y la imagen
  // no ha cambiado, probablemente está desactualizada.
  const updatedAt = producto.updated_date ? new Date(producto.updated_date).getTime() : 0;
  if (updatedAt && (Date.now() - updatedAt) > staleThresholdMs) {
    issues.push('desactualizada');
    const meses = Math.round((Date.now() - updatedAt) / (1000 * 60 * 60 * 24 * 30));
    tags.push(`Sin cambios hace ${meses} meses`);
    if (severidad === 'ok') severidad = 'baja';
  }

  return { severidad, issues, tags };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const staleMonths = Math.max(Number(body.stale_months) || 12, 1);
    const staleThresholdMs = staleMonths * 30 * 24 * 60 * 60 * 1000;

    const productos = await base44.asServiceRole.entities.Producto.filter(
      { activo: true }, '-updated_date', 500
    );

    const results = [];
    // Paralelizar inspecciones en grupos de 8 para no saturar
    const BATCH = 8;
    for (let i = 0; i < productos.length; i += BATCH) {
      const slice = productos.slice(i, i + BATCH);
      const inspections = await Promise.all(
        slice.map(p => inspectImageUrl(p.imagen_url))
      );
      slice.forEach((p, idx) => {
        const inspection = inspections[idx];
        const evalRes = evaluate(p, inspection, staleThresholdMs);
        if (evalRes.severidad === 'ok') return;
        results.push({
          producto_id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria: p.categoria,
          imagen_url: p.imagen_url,
          updated_date: p.updated_date,
          inspection,
          severidad: evalRes.severidad,
          issues: evalRes.issues,
          tags: evalRes.tags,
        });
      });
    }

    // Ordenar por severidad (alta → media → baja)
    const order = { alta: 0, media: 1, baja: 2 };
    results.sort((a, b) => order[a.severidad] - order[b.severidad]);

    const stats = {
      total_productos: productos.length,
      con_problemas: results.length,
      alta: results.filter(r => r.severidad === 'alta').length,
      media: results.filter(r => r.severidad === 'media').length,
      baja: results.filter(r => r.severidad === 'baja').length,
      sin_imagen: results.filter(r => r.issues.includes('sin_imagen')).length,
      rotas: results.filter(r => r.issues.includes('rota')).length,
      baja_resolucion: results.filter(r => r.issues.includes('baja_resolucion')).length,
      desactualizadas: results.filter(r => r.issues.includes('desactualizada')).length,
    };

    return Response.json({ ok: true, stats, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});