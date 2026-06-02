import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// generateCarcasaColorsCRON
// ----------------------------------------------------------------------------
// Procesa EN BACKGROUND, de a 1 carcasa por corrida, las carcasas activas que
// aún no tienen los 5 colores en imagenes_por_color. Corre cada ~3 min vía
// automation hasta vaciar la cola (cada carcasa = 5 generaciones IA ≈ 50s).
// Lógica inline (sin invocar otra función) para evitar problemas de auth
// service-to-service.
// ============================================================================

const COLORES_OFICIALES = [
  { label: 'Turquesa', desc: 'teal green-blue, soft turquoise' },
  { label: 'Amarillo', desc: 'warm mustard yellow' },
  { label: 'Rosado',   desc: 'soft pastel pink' },
  { label: 'Negro',    desc: 'matte black' },
  { label: 'Azul',     desc: 'medium royal blue' },
];

function extraerModelo(nombre = '') {
  return String(nombre).replace(/^carcasa\s+(para\s+)?/i, '').replace(/\s*\|.*$/, '').trim() || 'phone';
}
const isRaster = (url) => !!url && /^https?:\/\//.test(url) && /\.(png|jpe?g|webp)(\?|$)/i.test(url);
function mejorFoto(p) {
  if (isRaster(p.imagen_url)) return p.imagen_url;
  if (Array.isArray(p.galeria_urls)) {
    const r = p.galeria_urls.find(isRaster);
    if (r) return r;
  }
  return null;
}
function buildPrompt(modelo, colorName, colorDesc) {
  return `Product photo of an eco-friendly biodegradable phone case for ${modelo}, exact same case model, same shape, same camera cutout, same angle, same lighting, same matte recycled-plastic texture and PEYU embossed logo as the reference image. Change ONLY the color of the case to ${colorName} (${colorDesc}). Keep the white studio background, same composition and framing. Photorealistic e-commerce product shot, identical to reference but ${colorName} colored.`;
}
async function genColor(base44, refUrl, prompt) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: [refUrl] });
      if (r?.url) return r.url;
    } catch (e) {
      console.warn(`GenerateImage falló (intento ${i + 1}):`, e?.message);
    }
    if (i === 0) await new Promise(res => setTimeout(res, 800));
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const carcasas = await base44.asServiceRole.entities.Producto.filter(
      { categoria: 'Carcasas B2C' }, '-created_date', 500
    );
    const pendientes = carcasas.filter(p => {
      if (!mejorFoto(p)) return false;
      const mapa = p.imagenes_por_color || {};
      return COLORES_OFICIALES.some(c => !mapa[c.label]);
    });

    if (pendientes.length === 0) {
      return Response.json({ success: true, procesados: 0, pendientes_restantes: 0, mensaje: 'Cola vacía' });
    }

    const p = pendientes[0];
    const refUrl = mejorFoto(p);
    const modelo = extraerModelo(p.nombre);
    const mapa = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? { ...p.imagenes_por_color } : {};
    const generados = [];

    for (const c of COLORES_OFICIALES) {
      if (mapa[c.label]) continue;
      const url = await genColor(base44, refUrl, buildPrompt(modelo, c.label, c.desc));
      if (url) { mapa[c.label] = url; generados.push(c.label); }
    }

    if (generados.length > 0) {
      await base44.asServiceRole.entities.Producto.update(p.id, { imagenes_por_color: mapa });
    }

    return Response.json({
      success: true,
      procesados: generados.length > 0 ? 1 : 0,
      sku: p.sku,
      nombre: p.nombre,
      generados,
      pendientes_restantes: pendientes.length - 1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});