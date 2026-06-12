import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// visionMapColorImages
// ----------------------------------------------------------------------------
// Construye producto.imagenes_por_color usando VISIÓN IA cuando el matching por
// nombre de archivo no alcanza (ej. cachos: IMG_8105.jpg no dice "rojo").
// La IA mira las fotos de la galería y asigna a cada color disponible la foto
// que muestra el producto mayoritariamente en ese color.
//
// El front (getProductImageForColor) ya lee imagenes_por_color como fuente de
// verdad → al elegir un color, la imagen principal cambia sola (como carcasas).
//
// Payload:
//   { sku: "51559" }     → procesa un solo producto
//   { limit: 10 }        → máx productos por corrida (default 10)
//   { dryRun: true }     → no escribe, solo reporta
// Solo procesa productos con colores definidos, galería ≥2 fotos y colores
// SIN entrada en imagenes_por_color (completa huecos, no pisa lo existente).
// ============================================================================

const MAX_IMGS = 8;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // rebuild=true: reconstruye el mapa DESDE CERO para los colores oficiales
    // actuales (limpia claves obsoletas tipo Turquesa/Amarillo) usando SOLO
    // fotos reales de la galería (excluye imágenes generadas por IA si hay
    // suficientes fotos reales).
    // force=true (solo con rebuild): re-verifica TAMBIÉN los productos cuyo mapa
    // parece "alineado" — detecta asignaciones erróneas (ej. Verde → foto roja).
    // offset: permite recorrer el catálogo en tandas pequeñas (evita timeouts).
    const { sku = null, limit = 10, offset = 0, dryRun = false, rebuild = false, force = false } = body;

    // Carga productos
    let productos = [];
    if (sku) {
      productos = await base44.asServiceRole.entities.Producto.filter({ sku: String(sku) });
    } else {
      let skip = 0;
      while (true) {
        const page = await base44.asServiceRole.entities.Producto.list('-updated_date', 100, skip);
        if (!page || page.length === 0) break;
        productos.push(...page);
        if (page.length < 100) break;
        skip += 100;
      }
    }

    const getColores = (p) => {
      const set = new Set([
        ...(Array.isArray(p.colores) ? p.colores : []),
        ...(Array.isArray(p.colores_v2) ? p.colores_v2 : []),
      ].filter(Boolean));
      return [...set];
    };

    // Paleta oficial PEYU para el modo DETECCIÓN (productos sin `colores`).
    const PALETA = ['Azul', 'Verde', 'Rojo', 'Negro', 'Turquesa', 'Amarillo', 'Rosado', 'Blanco', 'Gris', 'Café', 'Naranja', 'Violeta', 'Beige'];

    // Pool de imágenes candidatas: imagen principal + galería. Prioriza FOTOS
    // REALES — si hay ≥2 fotos no generadas por IA, las generadas se excluyen.
    const poolDe = (p) => {
      const urls = [p.imagen_url, ...(p.galeria_urls || [])]
        .filter((u) => typeof u === 'string' && u.startsWith('http'));
      const dedup = [...new Set(urls)];
      const reales = dedup.filter((u) => !/generated_image/i.test(u));
      return (reales.length >= 2 ? reales : dedup).slice(0, MAX_IMGS);
    };

    // Candidatos: activos, con galería ≥2. Dos modos:
    //  · COMPLETAR: tiene colores definidos pero faltan fotos en el mapa.
    //  · DETECTAR: NO tiene colores definidos → la IA detecta en qué colores
    //    aparece el producto en su galería y puebla `colores` + mapa.
    // Carcasas (sistema propio) y fibra de trigo (color natural único) se excluyen.
    const candidatos = productos.filter((p) => {
      if (p.activo === false) return false;
      if (p.categoria === 'Carcasas B2C') return false;
      if (p.material === 'Fibra de Trigo (Compostable)') return false;
      if (/gift\s*card/i.test(p.categoria || '') || /gift\s*card/i.test(p.nombre || '')) return false;
      if (poolDe(p).length < 2) return false;
      const colores = getColores(p);
      const mapa = p.imagenes_por_color || {};
      if (rebuild) {
        // REBUILD idempotente: salta productos cuyo mapa YA está alineado
        // (todas las claves son colores oficiales y con foto real asignada).
        if (colores.length < 2) return false;
        if (force) return true; // re-verificación total con visión IA
        const keys = Object.keys(mapa);
        // Alineado = el mapa solo contiene colores oficiales con fotos reales
        // (los colores sin foto real quedan al tinte instantáneo como fallback).
        const aligned = keys.length > 0
          && keys.every((k) => colores.includes(k))
          && keys.every((k) => !/generated_image/i.test(mapa[k] || ''));
        return !aligned;
      }
      if (colores.length >= 2) return colores.some((c) => !mapa[c]); // COMPLETAR
      return Object.keys(mapa).length === 0; // DETECTAR desde cero
    })
      // Orden estable por SKU para que offset/limit recorra el catálogo sin
      // repetir productos entre tandas (el sort por updated_date cambia al escribir).
      .sort((a, b) => String(a.sku).localeCompare(String(b.sku)));

    const totalCandidatos = candidatos.length;
    const tanda = candidatos.slice(offset, offset + Math.min(limit, 25));

    const report = [];
    let updated = 0;

    for (const p of tanda) {
      const colores = getColores(p);
      const modoDeteccion = colores.length < 2;
      const mapaExistente = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? p.imagenes_por_color : {};
      const objetivo = modoDeteccion
        ? PALETA
        : colores.filter((c) => !/mix/i.test(c) && (rebuild || !mapaExistente[c]));
      if (objetivo.length === 0) continue;

      const galeria = poolDe(p);

      const prompt = modoDeteccion
        ? `Eres un clasificador visual de fotos de e-commerce. Te adjunto ${galeria.length} fotos (en orden: foto 1, foto 2, ... foto ${galeria.length}) del producto "${p.nombre}".
DETECTA en qué COLORES distintos aparece el producto (el producto en sí, NO el fondo ni accesorios), usando SOLO esta paleta: ${PALETA.join(', ')}.
Para cada color detectado, indica el número de la foto (1 a ${galeria.length}) donde el producto se ve MAYORITARIA y CLARAMENTE en ese color.
Sé estricto: solo colores inequívocos del producto. Si el producto aparece siempre del mismo color, devuelve solo ese color.`
        : `Eres un clasificador visual de fotos de e-commerce. Te adjunto ${galeria.length} fotos (en orden: foto 1, foto 2, ... foto ${galeria.length}) del producto "${p.nombre}".
Los colores disponibles del producto son: ${objetivo.join(', ')}.
Para CADA color, indica el número de la foto (1 a ${galeria.length}) donde el producto aparece MAYORITARIA y CLARAMENTE en ese color (el producto en sí, no el fondo ni accesorios). Si ninguna foto muestra el producto en ese color de forma clara, usa 0.
Sé estricto: solo asigna una foto si el color del producto es inequívoco.`;

      let asignaciones = [];
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          file_urls: galeria,
          response_json_schema: {
            type: 'object',
            properties: {
              asignaciones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    color: { type: 'string' },
                    foto: { type: 'number' },
                  },
                },
              },
            },
          },
        });
        asignaciones = result?.asignaciones || [];
      } catch (e) {
        report.push({ sku: p.sku, nombre: p.nombre, error: e.message });
        continue;
      }

      // REBUILD: parte de cero — limpia claves obsoletas (colores que ya no
      // están en la norma oficial del producto).
      const nuevoMapa = rebuild ? {} : { ...mapaExistente };
      let cambios = 0;
      const sinFoto = [];
      for (const a of asignaciones) {
        const idx = Math.round(Number(a.foto)) - 1;
        const colorKey = objetivo.find((c) => c.toLowerCase() === String(a.color || '').toLowerCase());
        if (idx >= 0 && idx < galeria.length && colorKey) {
          nuevoMapa[colorKey] = galeria[idx];
          cambios++;
        } else if (colorKey) {
          sinFoto.push(colorKey);
        }
      }

      report.push({ sku: p.sku, nombre: p.nombre, modo: modoDeteccion ? 'deteccion' : 'completar', nuevos: cambios, sin_foto: sinFoto, mapa: nuevoMapa });

      if ((cambios > 0 || rebuild) && !dryRun) {
        const patch = { imagenes_por_color: nuevoMapa };
        // Modo detección: además poblamos `colores` con lo detectado (reales).
        if (modoDeteccion) patch.colores = Object.keys(nuevoMapa);
        await base44.asServiceRole.entities.Producto.update(p.id, patch);
        updated++;
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      candidatos: totalCandidatos,
      offset,
      procesados: tanda.length,
      productos_actualizados: updated,
      detalle: report,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});