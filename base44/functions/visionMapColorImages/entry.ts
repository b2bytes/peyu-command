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
    const { sku = null, limit = 10, dryRun = false } = body;

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
      const galeria = (p.galeria_urls || []).filter((u) => typeof u === 'string' && u.startsWith('http'));
      if (galeria.length < 2) return false;
      const colores = getColores(p);
      const mapa = p.imagenes_por_color || {};
      if (colores.length >= 2) return colores.some((c) => !mapa[c]); // COMPLETAR
      return Object.keys(mapa).length === 0; // DETECTAR desde cero
    }).slice(0, Math.min(limit, 25));

    const report = [];
    let updated = 0;

    for (const p of candidatos) {
      const colores = getColores(p);
      const modoDeteccion = colores.length < 2;
      const mapaExistente = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? p.imagenes_por_color : {};
      const objetivo = modoDeteccion
        ? PALETA
        : colores.filter((c) => !mapaExistente[c] && !/mix/i.test(c));
      if (objetivo.length === 0) continue;

      const galeria = (p.galeria_urls || []).filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, MAX_IMGS);

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

      const nuevoMapa = { ...mapaExistente };
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

      if (cambios > 0 && !dryRun) {
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
      candidatos: candidatos.length,
      productos_actualizados: updated,
      detalle: report,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});