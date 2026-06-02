import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// diagnosticoCarcasasColores
// ----------------------------------------------------------------------------
// Cuenta con precisión, sobre la categoría "Carcasas B2C":
//   - total
//   - cuántas tienen los 5 colores oficiales completos en imagenes_por_color
//   - cuántas faltan (parcial o vacío)
//   - cuántas no tienen foto de referencia raster (no se pueden generar)
//   - desglose activas/inactivas
// Solo lectura. Admin o secreto interno.
// ============================================================================

const OFICIALES = ['Turquesa', 'Amarillo', 'Rosado', 'Negro', 'Azul'];
const isRaster = (url) => !!url && /^https?:\/\//.test(url) && /\.(png|jpe?g|webp)(\?|$)/i.test(url);
function mejorFoto(p) {
  if (isRaster(p.imagen_url)) return p.imagen_url;
  if (Array.isArray(p.galeria_urls)) { const r = p.galeria_urls.find(isRaster); if (r) return r; }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await base44.auth.me().catch(() => null);
    const esInterno = body.internalSecret && body.internalSecret === Deno.env.get('MADRE_V2_SECRET');
    if (user?.role !== 'admin' && !esInterno) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const carcasas = await base44.asServiceRole.entities.Producto.filter({ categoria: 'Carcasas B2C' }, '-updated_date', 500);

    let completas = 0, faltantes = 0, sinFoto = 0, activas = 0, inactivas = 0;
    const faltantesList = [];
    for (const p of carcasas) {
      if (p.activo) activas++; else inactivas++;
      const mapa = p.imagenes_por_color || {};
      const tieneTodos = OFICIALES.every(c => mapa[c]);
      const foto = mejorFoto(p);
      if (tieneTodos) { completas++; continue; }
      if (!foto) { sinFoto++; }
      faltantes++;
      faltantesList.push({ sku: p.sku, nombre: p.nombre, activo: !!p.activo, tieneFoto: !!foto, colores_actuales: Object.keys(mapa) });
    }

    return Response.json({
      total: carcasas.length,
      completas,
      faltantes,
      sin_foto_referencia: sinFoto,
      generables: faltantes - sinFoto,
      activas,
      inactivas,
      faltantesList,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});