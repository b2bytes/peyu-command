import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// aplicarPreciosB2BOficial
// ─────────────────────────────────────────────────────────────────────────────
// Toma el catálogo B2B oficial (entidad CatalogoB2BOficial, transcrito del PDF)
// y aplica sus precios EXACTOS sobre los productos en vivo (entidad Producto).
//
// Mapea cada producto oficial a su producto en vivo por SKU manual (mapa abajo).
// Por defecto solo devuelve un PLAN (dry_run). Con { apply: true } ejecuta.
//
// Campos que escribe en Producto:
//   precio_base_b2b           = unitario oficial
//   precio_50_199             = tramo 50-99
//   precio_200_499            = tramo 250-499
//   precio_500_mas            = tramo 500-999
//   precio_unitario_oficial_clp, precio_10_49_clp, precio_50_99_clp,
//   precio_100_249_clp, precio_250_499_clp, precio_500_999_clp,
//   precio_1000_1999_clp, precio_2000_mas_clp  = tramos exactos del PDF
//   catalogo_oficial_verificado = true
// ============================================================================

// Mapa slug oficial → SKU del producto en vivo (basado en el catálogo actual).
// null = aún no identificado por SKU; se intenta resolver por palabras clave (matchPorNombre).
const MAPA = {
  'cachos-pack-4': '98259',
  'cachos-pack-4-todo-terreno': '24127',
  'cachos-pack-5': '13132',
  'cachos-pack-5-todo-terreno': '78165',
  'cachos-pack-6': '41261',
  'cachos-pack-6-todo-terreno': '51559',
  'cachos-cofre-6': '86655',
  'escritorio-soporte-celular': '83552',
  'escritorio-llavero-soporte': '92451',
  'escritorio-notebook-clasico': null,
  'escritorio-notebook-pro': null,
  'escritorio-kit-clasico': '74893',
  'escritorio-kit-pro': null,
  'paletas-de-playa': null,
  'hogar-posavasos-hexagonales': '31686',
  'hogar-posavasos-circulares': null,
  'hogar-macetero-pequeno': null,
  'hogar-macetero-con-plato': '31679',
  'hogar-lampara-chillka': '66897',
};

// Resolución por palabras clave para los slugs sin SKU fijo.
// Cada regla: tokens que DEBEN estar + tokens que NO deben estar (para evitar falsos positivos).
const REGLAS_NOMBRE = {
  'escritorio-notebook-clasico': { req: ['notebook'], inc: ['clasico', 'clásico'], excl: ['pro', 'kit', 'pack'] },
  'escritorio-notebook-pro': { req: ['notebook'], inc: ['pro'], excl: ['clasico', 'clásico', 'kit', 'pack'] },
  'escritorio-kit-pro': { req: ['pro'], inc: ['kit', 'escritorio', 'pack'], excl: ['notebook', 'carcasa', 'huawei', 'iphone', 'samsung'] },
  'paletas-de-playa': { req: ['paleta'], inc: ['playa'], excl: [] },
  'hogar-posavasos-circulares': { req: ['posavaso'], inc: ['circular'], excl: ['hexagonal'] },
  'hogar-macetero-pequeno': { req: ['macetero'], inc: ['pequeñ', 'pequen', 'chico'], excl: ['plato', 'platito', '3 macetero'] },
};

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function matchPorNombre(slug, productos) {
  const regla = REGLAS_NOMBRE[slug];
  if (!regla) return null;
  for (const p of productos) {
    const n = norm(p.nombre);
    const reqOk = (regla.req || []).every((t) => n.includes(norm(t)));
    const incOk = !regla.inc?.length || regla.inc.some((t) => n.includes(norm(t)));
    const exclOk = !(regla.excl || []).some((t) => n.includes(norm(t)));
    if (reqOk && incOk && exclOk) return p;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apply = body.apply === true;

    const [oficiales, productos] = await Promise.all([
      base44.asServiceRole.entities.CatalogoB2BOficial.list('orden', 100),
      base44.asServiceRole.entities.Producto.list('-updated_date', 300),
    ]);

    const porSku = {};
    for (const p of productos) {
      if (p.sku) porSku[String(p.sku)] = p;
    }

    const plan = [];
    const sinMatch = [];

    for (const of of oficiales) {
      const sku = MAPA[of.slug];
      let prod = sku ? porSku[sku] : null;
      let via = sku ? 'sku' : null;

      // Fallback: si no hay SKU fijo o el SKU no existe, intentar por nombre.
      if (!prod) {
        prod = matchPorNombre(of.slug, productos);
        if (prod) via = 'nombre';
      }

      if (!prod) {
        sinMatch.push({ slug: of.slug, nombre: of.nombre, sku: sku || null, motivo: 'sin producto en vivo (falta crear)' });
        continue;
      }

      const cambios = {
        precio_base_b2b: of.precio_unitario_clp,
        precio_50_199: of.precio_50_99_clp,
        precio_200_499: of.precio_250_499_clp,
        precio_500_mas: of.precio_500_999_clp,
        precio_unitario_oficial_clp: of.precio_unitario_clp,
        precio_10_49_clp: of.precio_10_49_clp,
        precio_50_99_clp: of.precio_50_99_clp,
        precio_100_249_clp: of.precio_100_249_clp,
        precio_250_499_clp: of.precio_250_499_clp,
        precio_500_999_clp: of.precio_500_999_clp,
        precio_1000_1999_clp: of.precio_1000_1999_clp,
        precio_2000_mas_clp: of.precio_2000_mas_clp,
        catalogo_oficial_verificado: true,
      };

      plan.push({
        slug: of.slug,
        oficial: of.nombre,
        sku: prod.sku,
        via,
        producto_en_vivo: prod.nombre,
        producto_id: prod.id,
        b2b_antes: prod.precio_base_b2b ?? null,
        b2b_despues: cambios.precio_base_b2b,
        cambios,
      });

      if (apply) {
        await base44.asServiceRole.entities.Producto.update(prod.id, cambios);
      }
    }

    return Response.json({
      modo: apply ? 'aplicado' : 'dry_run',
      total_oficiales: oficiales.length,
      con_match: plan.length,
      sin_match: sinMatch.length,
      actualizados: apply ? plan.length : 0,
      plan,
      sin_match_detalle: sinMatch,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});