import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// generateCarcasaColors  (FRENTE B)
// ----------------------------------------------------------------------------
// Genera con IA las versiones de color que FALTAN de una carcasa, partiendo de
// la mejor foto real del producto como referencia (existing_image_urls), y arma
// el campo `imagenes_por_color` { Turquesa, Amarillo, Rosado, Negro, Azul }.
//
// La ficha (ProductoDetalle) ya lee imagenes_por_color como fuente de verdad:
// al elegir color cambia la imagen principal → desbloquea el mockup láser sobre
// el color elegido.
//
// Payload:
//   { sku: "11274" }                  → procesa esa carcasa (modo prueba)
//   { productId: "..." }              → por id
//   { lote: true, limite: 20 }        → todas las carcasas que falten colores
//   { sobrescribir: false }           → si true, regenera colores ya existentes
//   { colores: ["Turquesa", ...] }    → subconjunto (default: los 5 oficiales)
//
// Devuelve, por producto, el mapa generado + qué colores se crearon/saltaron.
// ============================================================================

// Los 5 colores oficiales PEYU con su descripción para el prompt.
const COLORES_OFICIALES = [
  { label: 'Turquesa', desc: 'teal green-blue, soft turquoise' },
  { label: 'Amarillo', desc: 'warm mustard yellow' },
  { label: 'Rosado',   desc: 'soft pastel pink' },
  { label: 'Negro',    desc: 'matte black' },
  { label: 'Azul',     desc: 'medium royal blue' },
];

// Extrae el modelo del nombre ("Carcasa para Huawei P40 pro" → "Huawei P40 pro").
function extraerModelo(nombre = '') {
  return String(nombre)
    .replace(/^carcasa\s+(para\s+)?/i, '')
    .replace(/\s*\|.*$/, '')
    .trim() || 'phone';
}

// Imagen raster válida como referencia para GenerateImage.
const isRaster = (url) => !!url && /^https?:\/\//.test(url) && /\.(png|jpe?g|webp)(\?|$)/i.test(url);

// Elige la MEJOR foto del producto: imagen_url principal si es raster, sino la
// primera de galeria_urls que sea raster.
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

// Genera una imagen con reintento. Devuelve url o null.
async function genColor(base44, refUrl, prompt) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: [refUrl] });
      if (r?.url) return r.url;
    } catch (e) {
      console.warn(`GenerateImage color falló (intento ${i + 1}):`, e?.message);
    }
    if (i === 0) await new Promise(res => setTimeout(res, 800));
  }
  return null;
}

async function procesarProducto(base44, p, coloresObjetivo, sobrescribir) {
  const refUrl = mejorFoto(p);
  if (!refUrl) {
    return { sku: p.sku, nombre: p.nombre, ok: false, motivo: 'sin foto de referencia raster' };
  }
  const modelo = extraerModelo(p.nombre);
  const mapaExistente = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? { ...p.imagenes_por_color } : {};

  const generados = [];
  const saltados = [];

  for (const c of coloresObjetivo) {
    if (!sobrescribir && mapaExistente[c.label]) { saltados.push(c.label); continue; }
    const url = await genColor(base44, refUrl, buildPrompt(modelo, c.label, c.desc));
    if (url) {
      mapaExistente[c.label] = url;
      generados.push(c.label);
    }
  }

  if (generados.length > 0) {
    await base44.asServiceRole.entities.Producto.update(p.id, { imagenes_por_color: mapaExistente });
  }

  return {
    sku: p.sku,
    nombre: p.nombre,
    ok: generados.length > 0,
    referencia_usada: refUrl,
    generados,
    saltados,
    imagenes_por_color: mapaExistente,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { sku = null, productId = null, lote = false, limite = 20, sobrescribir = false, colores = null, internalSecret = null } = body;

    // Autorización: admin autenticado, O invocación interna (CRON) con secreto.
    const user = await base44.auth.me().catch(() => null);
    const esInterno = internalSecret && internalSecret === Deno.env.get('MADRE_V2_SECRET');
    if (user?.role !== 'admin' && !esInterno) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const coloresObjetivo = Array.isArray(colores) && colores.length
      ? COLORES_OFICIALES.filter(c => colores.includes(c.label))
      : COLORES_OFICIALES;

    // ── Modo single (prueba o por producto) ──
    if (sku || productId) {
      let prod;
      if (productId) prod = await base44.asServiceRole.entities.Producto.get(productId);
      else {
        const arr = await base44.asServiceRole.entities.Producto.filter({ sku });
        prod = arr?.[0];
      }
      if (!prod) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
      const res = await procesarProducto(base44, prod, coloresObjetivo, sobrescribir);
      return Response.json({ success: true, modo: 'single', resultado: res });
    }

    // ── Modo lote: carcasas activas que falten colores ──
    // ⚠️ Cada carcasa = 5 generaciones IA secuenciales (~25s c/u ≈ 125s). Para no
    // pasar el timeout de Deno, el lote procesa DE A 1 (limite default 1) y
    // devuelve `pendientes_restantes` para que el caller itere invocación a
    // invocación de forma segura.
    if (lote) {
      const carcasas = await base44.asServiceRole.entities.Producto.filter({ categoria: 'Carcasas B2C', activo: true }, '-updated_date', 200);
      const pendientesTodas = carcasas.filter(p => {
        if (!mejorFoto(p)) return false;
        const mapa = p.imagenes_por_color || {};
        const faltan = coloresObjetivo.some(c => !mapa[c.label]);
        return sobrescribir || faltan;
      });
      const pendientes = pendientesTodas.slice(0, limite || 1);

      const resultados = [];
      for (const p of pendientes) {
        resultados.push(await procesarProducto(base44, p, coloresObjetivo, sobrescribir));
      }
      return Response.json({
        success: true,
        modo: 'lote',
        candidatos: pendientes.length,
        procesados: resultados.filter(r => r.ok).length,
        pendientes_restantes: Math.max(0, pendientesTodas.length - pendientes.length),
        resultados,
      });
    }

    return Response.json({ error: 'Especifica sku, productId o lote:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});