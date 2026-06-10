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

    // Candidatos: activos, con colores, con galería, con huecos en el mapa
    const candidatos = productos.filter((p) => {
      if (p.activo === false) return false;
      const colores = getColores(p);
      if (colores.length < 2) return false;
      const galeria = (p.galeria_urls || []).filter((u) => typeof u === 'string' && u.startsWith('http'));
      if (galeria.length < 2) return false;
      const mapa = p.imagenes_por_color || {};
      return colores.some((c) => !mapa[c]);
    }).slice(0, Math.min(limit, 25));

    const report = [];
    let updated = 0;

    for (const p of candidatos) {
      const colores = getColores(p);
      const mapaExistente = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? p.imagenes_por_color : {};
      const faltantes = colores.filter((c) => !mapaExistente[c] && !/mix/i.test(c));
      if (faltantes.length === 0) continue;

      const galeria = (p.galeria_urls || []).filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, MAX_IMGS);

      let asignaciones = [];
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Eres un clasificador visual de fotos de e-commerce. Te adjunto ${galeria.length} fotos (en orden: foto 1, foto 2, ... foto ${galeria.length}) del producto "${p.nombre}".
Los colores disponibles del producto son: ${faltantes.join(', ')}.
Para CADA color, indica el número de la foto (1 a ${galeria.length}) donde el producto aparece MAYORITARIA y CLARAMENTE en ese color (el producto en sí, no el fondo ni accesorios). Si ninguna foto muestra el producto en ese color de forma clara, usa 0.
Sé estricto: solo asigna una foto si el color del producto es inequívoco.`,
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
        const colorKey = faltantes.find((c) => c.toLowerCase() === String(a.color || '').toLowerCase()) || a.color;
        if (idx >= 0 && idx < galeria.length && colorKey && faltantes.includes(colorKey)) {
          nuevoMapa[colorKey] = galeria[idx];
          cambios++;
        } else if (colorKey) {
          sinFoto.push(colorKey);
        }
      }

      report.push({ sku: p.sku, nombre: p.nombre, nuevos: cambios, sin_foto: sinFoto, mapa: nuevoMapa });

      if (cambios > 0 && !dryRun) {
        await base44.asServiceRole.entities.Producto.update(p.id, { imagenes_por_color: nuevoMapa });
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