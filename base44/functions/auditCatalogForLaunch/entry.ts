/**
 * auditCatalogForLaunch
 * ─────────────────────────────────────────────────────────────────
 * Escanea TODOS los productos activos y devuelve un reporte de
 * problemas críticos para resolver antes del lanzamiento:
 *
 *  1. Duplicados OBVIOS:
 *     - Mismo nombre normalizado (lowercase, sin tildes, sin signos)
 *     - O mismo SKU
 *  2. Imágenes rotas / faltantes:
 *     - Sin imagen_url
 *     - URL no responde 200 (HEAD check)
 *  3. Precios faltantes o $0:
 *     - precio_b2c == null, 0 o < 100
 *  4. Descripciones vacías o malas:
 *     - Sin descripción
 *     - < 20 caracteres
 *     - Solo HTML/símbolos (sin texto real)
 *
 * Modo:
 *   - { mode: "scan" }   → solo reporta, no toca nada (default)
 *   - { mode: "apply", deactivateIds: [...] } → desactiva IDs específicos
 *
 * Solo admin puede invocar.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasRealText(str) {
  if (!str) return false;
  const clean = String(str)
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/[^\wáéíóúñÁÉÍÓÚÑ]/g, '')
    .trim();
  return clean.length >= 15;
}

async function checkImage(url) {
  if (!url) return { ok: false, reason: 'missing' };
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return { ok: false, reason: `wrong_type_${type.split(';')[0]}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'fetch_error' };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'scan';

    // ─── APPLY mode: desactivar IDs específicos ──────────────────
    if (mode === 'apply') {
      const ids = Array.isArray(body.deactivateIds) ? body.deactivateIds : [];
      if (ids.length === 0) {
        return Response.json({ error: 'deactivateIds required' }, { status: 400 });
      }
      const results = [];
      for (const id of ids) {
        try {
          await base44.asServiceRole.entities.Producto.update(id, { activo: false });
          results.push({ id, ok: true });
        } catch (e) {
          results.push({ id, ok: false, error: e.message });
        }
      }
      return Response.json({
        mode: 'apply',
        deactivated: results.filter(r => r.ok).length,
        failed: results.filter(r => !r.ok).length,
        results,
      });
    }

    // ─── SCAN mode ─────────────────────────────────────────────────
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true });

    // 1. Duplicados por nombre normalizado
    const byName = {};
    const bySku = {};
    for (const p of productos) {
      const nameKey = normalize(p.nombre);
      if (nameKey) {
        if (!byName[nameKey]) byName[nameKey] = [];
        byName[nameKey].push(p);
      }
      const skuKey = (p.sku || '').trim().toUpperCase();
      if (skuKey) {
        if (!bySku[skuKey]) bySku[skuKey] = [];
        bySku[skuKey].push(p);
      }
    }

    const duplicateGroups = [];

    // Duplicados por nombre exacto normalizado
    Object.entries(byName).forEach(([key, items]) => {
      if (items.length > 1) {
        // Score: el que tiene más datos completos gana (más imágenes, descripción más larga, precios B2B)
        const scored = items.map(p => ({
          ...p,
          _score:
            (p.galeria_urls?.length || 0) * 2 +
            (p.descripcion?.length || 0) / 50 +
            (p.precio_base_b2b ? 5 : 0) +
            (p.precio_50_199 ? 3 : 0) +
            (p.imagen_url ? 5 : 0) +
            (p.area_laser_mm ? 2 : 0),
        })).sort((a, b) => b._score - a._score);
        duplicateGroups.push({
          type: 'name',
          key,
          keep: scored[0],
          remove: scored.slice(1),
        });
      }
    });

    // Duplicados por SKU
    Object.entries(bySku).forEach(([key, items]) => {
      if (items.length > 1) {
        // No agregar si ya está cubierto por duplicado de nombre
        const alreadyCovered = duplicateGroups.some(g =>
          items.every(i => g.keep.id === i.id || g.remove.some(r => r.id === i.id))
        );
        if (alreadyCovered) return;
        const scored = items.map(p => ({
          ...p,
          _score:
            (p.galeria_urls?.length || 0) * 2 +
            (p.descripcion?.length || 0) / 50 +
            (p.precio_base_b2b ? 5 : 0) +
            (p.imagen_url ? 5 : 0),
        })).sort((a, b) => b._score - a._score);
        duplicateGroups.push({
          type: 'sku',
          key,
          keep: scored[0],
          remove: scored.slice(1),
        });
      }
    });

    // 2. Precios faltantes / $0
    const precioIssues = productos
      .filter(p => !p.precio_b2c || p.precio_b2c < 100)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        categoria: p.categoria,
        precio_b2c: p.precio_b2c,
        imagen_url: p.imagen_url,
      }));

    // 3. Descripciones vacías / malas
    const descIssues = productos
      .filter(p => !hasRealText(p.descripcion))
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        categoria: p.categoria,
        descripcion: p.descripcion || '',
        descripcion_length: (p.descripcion || '').length,
        imagen_url: p.imagen_url,
      }));

    // 4. Imágenes rotas / faltantes (chequeo HEAD limitado para no explotar el timeout)
    const imageChecks = [];
    const productosConImagen = productos.filter(p => p.imagen_url);
    const productosSinImagen = productos.filter(p => !p.imagen_url);

    productosSinImagen.forEach(p => {
      imageChecks.push({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        categoria: p.categoria,
        imagen_url: null,
        reason: 'missing',
      });
    });

    // Chequear hasta 200 URLs en paralelo (batches de 20)
    const toCheck = productosConImagen.slice(0, 200);
    const BATCH = 20;
    for (let i = 0; i < toCheck.length; i += BATCH) {
      const batch = toCheck.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(p => checkImage(p.imagen_url).then(r => ({ p, r }))));
      results.forEach(({ p, r }) => {
        if (!r.ok) {
          imageChecks.push({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            categoria: p.categoria,
            imagen_url: p.imagen_url,
            reason: r.reason,
          });
        }
      });
    }

    return Response.json({
      mode: 'scan',
      total_productos: productos.length,
      summary: {
        duplicate_groups: duplicateGroups.length,
        duplicate_removable: duplicateGroups.reduce((s, g) => s + g.remove.length, 0),
        precio_issues: precioIssues.length,
        descripcion_issues: descIssues.length,
        image_issues: imageChecks.length,
        images_checked: toCheck.length,
      },
      duplicates: duplicateGroups.map(g => ({
        type: g.type,
        key: g.key,
        keep: {
          id: g.keep.id,
          nombre: g.keep.nombre,
          sku: g.keep.sku,
          precio_b2c: g.keep.precio_b2c,
          imagen_url: g.keep.imagen_url,
          score: g.keep._score,
        },
        remove: g.remove.map(r => ({
          id: r.id,
          nombre: r.nombre,
          sku: r.sku,
          precio_b2c: r.precio_b2c,
          imagen_url: r.imagen_url,
          score: r._score,
        })),
      })),
      precio_issues: precioIssues,
      descripcion_issues: descIssues,
      image_issues: imageChecks,
    });
  } catch (error) {
    console.error('[auditCatalogForLaunch] Error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});