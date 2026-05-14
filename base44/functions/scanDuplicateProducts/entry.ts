/**
 * scanDuplicateProducts
 * ─────────────────────────────────────────────────────────────────
 * Escanea el catálogo buscando duplicados y similares usando:
 *   • Match EXACTO por SKU (normalizado)
 *   • Match EXACTO por nombre normalizado
 *   • Match FUZZY por similitud Jaro-Winkler en nombre (>= 0.88)
 *   • Match por SKU "raíz" (HOG-MACE3 vs HOG-MACE-3 vs 42415)
 *
 * Para cada grupo retorna:
 *   • Producto "primario" candidato (más completo, más reciente, más imágenes)
 *   • Productos "duplicados" con score de similitud
 *   • Preview de fusión: qué campos se mantienen de cuál
 *
 * Modos:
 *   • { mode: "scan", threshold: 0.88 }    → escanea, no toca nada
 *   • { mode: "preview_merge", primaryId, duplicateIds } → muestra qué quedaría
 *   • { mode: "apply_merge", primaryId, duplicateIds, fieldsToMerge: {...} }
 *       → fusiona metadatos al primario y desactiva los duplicados
 *
 * SOLO ADMIN. Nunca borra: solo desactiva (activo=false) los duplicados.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Utilidades de normalización ──────────────────────────────────
function normalizeName(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(peyu|chile|de|la|el|los|las|para|con|sin)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSku(sku) {
  if (!sku) return '';
  return String(sku).trim().toUpperCase().replace(/[\s\-_]/g, '');
}

// "Raíz" del SKU: HOG-MACE3 y HOG-MACE-3 → HOGMACE3. Útil para detectar SKUs
// que la importación de Woo regeneró con formato distinto.
function skuRoot(sku) {
  return normalizeSku(sku).replace(/[^A-Z0-9]/g, '');
}

// ── Jaro-Winkler para fuzzy match ────────────────────────────────
function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  if (!s1.length || !s2.length) return 0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  transpositions = transpositions / 2;

  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions) / matches) / 3;

  // Winkler bonus para prefijos comunes (hasta 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

// ── Score de "calidad" del producto (para elegir primario) ───────
function qualityScore(p) {
  let s = 0;
  if (p.imagen_url) s += 10;
  s += (p.galeria_urls?.length || 0) * 3;
  s += Math.min((p.descripcion?.length || 0) / 20, 15);
  if (p.precio_b2c && p.precio_b2c > 100) s += 5;
  if (p.precio_base_b2b) s += 4;
  if (p.precio_50_199) s += 3;
  if (p.precio_200_499) s += 2;
  if (p.precio_500_mas) s += 2;
  if (p.area_laser_mm) s += 2;
  if (p.peso_kg) s += 2;
  if (p.largo_cm && p.ancho_cm && p.alto_cm) s += 3;
  if (p.seo_meta_title) s += 3;
  if (p.seo_meta_description) s += 3;
  if (p.garantia_anios) s += 1;
  if (p.stock_actual > 0) s += 4;
  // Recencia (más reciente = mejor, normalizado a max 5 puntos)
  if (p.updated_date) {
    const days = (Date.now() - new Date(p.updated_date).getTime()) / 86400000;
    s += Math.max(0, 5 - days / 30);
  }
  return Math.round(s * 10) / 10;
}

// ── Detección de razón de match ──────────────────────────────────
function classifyMatch(p1, p2, similarity) {
  if (normalizeSku(p1.sku) === normalizeSku(p2.sku) && p1.sku) return { type: 'sku_exact', confidence: 'highest' };
  if (skuRoot(p1.sku) === skuRoot(p2.sku) && skuRoot(p1.sku).length > 3) return { type: 'sku_root', confidence: 'very_high' };
  if (normalizeName(p1.nombre) === normalizeName(p2.nombre) && p1.nombre) return { type: 'name_exact', confidence: 'very_high' };
  if (similarity >= 0.95) return { type: 'name_near_exact', confidence: 'high' };
  if (similarity >= 0.90) return { type: 'name_fuzzy', confidence: 'medium' };
  return { type: 'name_loose', confidence: 'low' };
}

// ── Preview de fusión: qué campos quedarían en el primario ───────
function buildMergePreview(primary, duplicates) {
  const fields = {};
  const candidates = [primary, ...duplicates];

  // Para cada campo "mergeable", elige el mejor valor disponible
  const mergeable = [
    { key: 'descripcion', selector: (vals) => vals.filter(v => v && v.length > 20).sort((a, b) => b.length - a.length)[0] },
    { key: 'imagen_url', selector: (vals) => vals.find(v => v) },
    { key: 'galeria_urls', selector: (vals) => {
        const all = vals.flatMap(v => Array.isArray(v) ? v : []);
        return [...new Set(all)];
      } },
    { key: 'imagen_promo_url', selector: (vals) => vals.find(v => v) },
    { key: 'area_laser_mm', selector: (vals) => vals.find(v => v) },
    { key: 'garantia_anios', selector: (vals) => vals.find(v => v) },
    { key: 'peso_kg', selector: (vals) => vals.find(v => v) },
    { key: 'largo_cm', selector: (vals) => vals.find(v => v) },
    { key: 'ancho_cm', selector: (vals) => vals.find(v => v) },
    { key: 'alto_cm', selector: (vals) => vals.find(v => v) },
    { key: 'precio_base_b2b', selector: (vals) => vals.find(v => v && v > 0) },
    { key: 'precio_50_199', selector: (vals) => vals.find(v => v && v > 0) },
    { key: 'precio_200_499', selector: (vals) => vals.find(v => v && v > 0) },
    { key: 'precio_500_mas', selector: (vals) => vals.find(v => v && v > 0) },
    { key: 'seo_meta_title', selector: (vals) => vals.find(v => v) },
    { key: 'seo_meta_description', selector: (vals) => vals.find(v => v) },
    { key: 'seo_focus_keyword', selector: (vals) => vals.find(v => v) },
  ];

  for (const { key, selector } of mergeable) {
    const primaryVal = primary[key];
    const allVals = candidates.map(c => c[key]);
    const bestVal = selector(allVals);
    const wouldChange = JSON.stringify(primaryVal) !== JSON.stringify(bestVal);
    fields[key] = {
      current: primaryVal,
      proposed: bestVal,
      source: wouldChange
        ? candidates.find(c => JSON.stringify(c[key]) === JSON.stringify(bestVal))?.id || null
        : primary.id,
      changed: wouldChange && bestVal !== undefined && bestVal !== null && bestVal !== '',
    };
  }

  // Stock: SUMAR el stock de los duplicados al primario (no perder inventario)
  const totalStock = candidates.reduce((s, c) => s + (Number(c.stock_actual) || 0), 0);
  fields.stock_actual = {
    current: primary.stock_actual || 0,
    proposed: totalStock,
    source: 'sum',
    changed: totalStock !== (primary.stock_actual || 0),
  };

  return fields;
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

    // ─── PREVIEW MERGE ──────────────────────────────────────────
    if (mode === 'preview_merge') {
      const { primaryId, duplicateIds } = body;
      if (!primaryId || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
        return Response.json({ error: 'primaryId y duplicateIds requeridos' }, { status: 400 });
      }
      const primary = await base44.asServiceRole.entities.Producto.get(primaryId);
      const duplicates = await Promise.all(
        duplicateIds.map(id => base44.asServiceRole.entities.Producto.get(id))
      );
      const preview = buildMergePreview(primary, duplicates.filter(Boolean));
      return Response.json({
        mode: 'preview_merge',
        primary: { id: primary.id, nombre: primary.nombre, sku: primary.sku },
        duplicates: duplicates.filter(Boolean).map(d => ({ id: d.id, nombre: d.nombre, sku: d.sku })),
        preview,
      });
    }

    // ─── APPLY MERGE ────────────────────────────────────────────
    if (mode === 'apply_merge') {
      const { primaryId, duplicateIds, fieldsToApply } = body;
      if (!primaryId || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
        return Response.json({ error: 'primaryId y duplicateIds requeridos' }, { status: 400 });
      }

      const primary = await base44.asServiceRole.entities.Producto.get(primaryId);
      const duplicates = await Promise.all(
        duplicateIds.map(id => base44.asServiceRole.entities.Producto.get(id))
      );
      const validDuplicates = duplicates.filter(Boolean);

      // Construir patch: fieldsToApply puede venir del cliente (usuario eligió qué campos),
      // o si no viene, calculamos el preview completo automáticamente.
      let patch = {};
      if (fieldsToApply && typeof fieldsToApply === 'object') {
        // El cliente envió valores explícitos por campo
        patch = { ...fieldsToApply };
      } else {
        const preview = buildMergePreview(primary, validDuplicates);
        for (const [key, info] of Object.entries(preview)) {
          if (info.changed && info.proposed !== undefined && info.proposed !== null && info.proposed !== '') {
            patch[key] = info.proposed;
          }
        }
      }

      // Aplicar patch al primario
      let primaryUpdated = false;
      if (Object.keys(patch).length > 0) {
        await base44.asServiceRole.entities.Producto.update(primaryId, patch);
        primaryUpdated = true;
      }

      // Desactivar duplicados (NUNCA borrar) — con notita en descripción interna
      const deactivated = [];
      const failed = [];
      for (const dup of validDuplicates) {
        try {
          const note = `[Desactivado por fusión ${new Date().toISOString().slice(0, 10)} → primario ${primary.sku || primary.id}]`;
          await base44.asServiceRole.entities.Producto.update(dup.id, {
            activo: false,
            descripcion: dup.descripcion ? `${dup.descripcion}\n\n${note}` : note,
          });
          deactivated.push({ id: dup.id, sku: dup.sku, nombre: dup.nombre });
        } catch (e) {
          failed.push({ id: dup.id, error: e.message });
        }
      }

      return Response.json({
        mode: 'apply_merge',
        primary_id: primaryId,
        primary_updated: primaryUpdated,
        fields_applied: Object.keys(patch),
        deactivated_count: deactivated.length,
        deactivated,
        failed,
      });
    }

    // ─── SCAN (default) ─────────────────────────────────────────
    const threshold = Number(body.threshold) || 0.88;
    const includeInactive = body.includeInactive !== false; // default true: incluye los ya desactivados para limpieza completa

    const productos = await base44.asServiceRole.entities.Producto.filter(
      includeInactive ? {} : { activo: true }
    );

    // Indexar productos en grupos por clave fuerte (SKU normalizado, nombre normalizado, SKU root)
    const visited = new Set();
    const groups = [];

    for (let i = 0; i < productos.length; i++) {
      if (visited.has(productos[i].id)) continue;
      const p1 = productos[i];
      const name1 = normalizeName(p1.nombre);
      const sku1 = normalizeSku(p1.sku);
      const root1 = skuRoot(p1.sku);

      const matches = [{ producto: p1, similarity: 1, matchInfo: { type: 'self', confidence: 'self' } }];

      for (let j = i + 1; j < productos.length; j++) {
        if (visited.has(productos[j].id)) continue;
        const p2 = productos[j];
        const name2 = normalizeName(p2.nombre);
        const sku2 = normalizeSku(p2.sku);
        const root2 = skuRoot(p2.sku);

        let similarity = 0;
        let isMatch = false;

        // SKU exacto
        if (sku1 && sku1 === sku2) {
          similarity = 1;
          isMatch = true;
        }
        // SKU root (HOG-MACE3 vs HOGMACE3 vs HOG_MACE_3)
        else if (root1 && root1 === root2 && root1.length > 3) {
          similarity = 0.99;
          isMatch = true;
        }
        // Nombre exacto normalizado
        else if (name1 && name1 === name2 && name1.length > 5) {
          similarity = 0.98;
          isMatch = true;
        }
        // Fuzzy nombre
        else if (name1.length > 5 && name2.length > 5) {
          similarity = jaroWinkler(name1, name2);
          if (similarity >= threshold) {
            // Validación extra: categoría debe coincidir (evita match cruzado entre rubros)
            if (p1.categoria === p2.categoria) {
              isMatch = true;
            }
          }
        }

        if (isMatch) {
          matches.push({ producto: p2, similarity, matchInfo: classifyMatch(p1, p2, similarity) });
          visited.add(p2.id);
        }
      }

      if (matches.length > 1) {
        // Elegir primario por quality score
        const scored = matches.map(m => ({ ...m, qualityScore: qualityScore(m.producto) }))
          .sort((a, b) => b.qualityScore - a.qualityScore);
        const primary = scored[0];
        const duplicates = scored.slice(1);

        groups.push({
          primary: {
            id: primary.producto.id,
            sku: primary.producto.sku,
            nombre: primary.producto.nombre,
            categoria: primary.producto.categoria,
            activo: primary.producto.activo !== false,
            imagen_url: primary.producto.imagen_url,
            precio_b2c: primary.producto.precio_b2c,
            stock_actual: primary.producto.stock_actual,
            descripcion_length: (primary.producto.descripcion || '').length,
            galeria_count: primary.producto.galeria_urls?.length || 0,
            quality_score: primary.qualityScore,
            updated_date: primary.producto.updated_date,
          },
          duplicates: duplicates.map(d => ({
            id: d.producto.id,
            sku: d.producto.sku,
            nombre: d.producto.nombre,
            categoria: d.producto.categoria,
            activo: d.producto.activo !== false,
            imagen_url: d.producto.imagen_url,
            precio_b2c: d.producto.precio_b2c,
            stock_actual: d.producto.stock_actual,
            descripcion_length: (d.producto.descripcion || '').length,
            galeria_count: d.producto.galeria_urls?.length || 0,
            quality_score: d.qualityScore,
            similarity: Math.round(d.similarity * 1000) / 1000,
            match_type: d.matchInfo.type,
            match_confidence: d.matchInfo.confidence,
            updated_date: d.producto.updated_date,
          })),
          best_match_confidence: duplicates[0]?.matchInfo.confidence || 'low',
          best_match_type: duplicates[0]?.matchInfo.type || 'none',
        });

        visited.add(p1.id);
      }
    }

    // Orden: confianza más alta primero
    const confidenceOrder = { highest: 5, very_high: 4, high: 3, medium: 2, low: 1 };
    groups.sort((a, b) =>
      (confidenceOrder[b.best_match_confidence] || 0) - (confidenceOrder[a.best_match_confidence] || 0)
    );

    return Response.json({
      mode: 'scan',
      total_productos: productos.length,
      threshold,
      include_inactive: includeInactive,
      total_groups: groups.length,
      total_duplicates: groups.reduce((s, g) => s + g.duplicates.length, 0),
      by_confidence: {
        highest: groups.filter(g => g.best_match_confidence === 'highest').length,
        very_high: groups.filter(g => g.best_match_confidence === 'very_high').length,
        high: groups.filter(g => g.best_match_confidence === 'high').length,
        medium: groups.filter(g => g.best_match_confidence === 'medium').length,
        low: groups.filter(g => g.best_match_confidence === 'low').length,
      },
      groups,
    });
  } catch (error) {
    console.error('[scanDuplicateProducts] Error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});