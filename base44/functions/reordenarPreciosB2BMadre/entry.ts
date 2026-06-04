import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// reordenarPreciosB2BMadre — FIX 2 del mandato B2B.
// 1) Recarga precio_b2b_tramos (NETOS, sin IVA) de los productos MADRE desde la
//    tabla oficial, matcheando por nombre normalizado.
// 2) Desactiva (activo=false) los duplicados "(corporativo)" cuyos IDs vienen en
//    el mandato — tienen precios B2C inflados metidos como tramo B2B.
// Admin-only. Idempotente: se puede correr varias veces sin daño.
// ─────────────────────────────────────────────────────────────────────────────

// Tabla oficial NETA: [unitario, t10_49, t50_99, t100_249, t250_499, t500_999, t1000_1999, t2000_mas]
const TABLA = {
  'pack 4 cachos':            [16378, 11760, 10992, 10067, 9240, 8393, 7973, 7554],
  'pack 4+4 todo terreno':    [18476, 12593, 11761, 10911, 10074, 9225, 8814, 8393],
  'pack 5 cachos':            [18476, 12593, 11761, 10911, 10074, 9225, 8814, 8393],
  'pack 5+5 todo terreno':    [21840, 13434, 12592, 11751, 10912, 10072, 9660, 9239],
  'pack 6 cachos':            [21840, 13434, 12592, 11751, 10912, 10072, 9660, 9239],
  'pack 6+6 todo terreno':    [24361, 15121, 14273, 13434, 12592, 11753, 11298, 10912],
  'cofre 6 cachos':           [32521, 18483, 17642, 16795, 15955, 15107, 14658, 14273],
  'soporte celular':          [5874, 2921, 2466, 2319, 2097, 1843, 1676, 1491],
  'llavero soporte':          [3353, 1674, 839, 803, 751, 700, 666, 513],
  'soporte notebook clasico': [8395, 5878, 5031, 4198, 3776, 3356, 2897, 2519],
  'soporte notebook pro':     [8395, 5878, 5031, 4198, 3776, 3356, 2897, 2519],
  'pack escritorio clasico':  [16798, 12134, 11759, 10079, 9071, 8399, 7126, 6714],
  'pack escritorio pro':      [16798, 12134, 11759, 10079, 9071, 8399, 7126, 6714],
  'paletas de playa':         [12597, 10748, 10126, 9790, 9538, 9311, 9118, 8990],
  'posavasos hexagonales':    [6714, 3776, 3466, 3439, 3352, 2849, 2714, 2504],
  'posavasos circulares':     [6714, 3776, 3466, 3439, 3352, 2849, 2714, 2504],
  'macetero pequeno':         [2933, 2090, 1838, 1760, 1670, 1590, 1508, 1422],
  'macetero con plato':       [5034, 2850, 2689, 2588, 2504, 2311, 2227, 2143],
  'lampara chillka':          [19739, 16796, 15924, 15104, 14283, 13832, 13444, 12586],
};

const KEYS = ['unitario', 't10_49', 't50_99', 't100_249', 't250_499', 't500_999', 't1000_1999', 't2000_mas'];

function toTramos(arr) {
  const o = {};
  KEYS.forEach((k, i) => { o[k] = arr[i]; });
  return o;
}

const norm = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[|.,()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Matchea el nombre del producto contra una clave de la tabla oficial.
function matchTabla(nombre) {
  const n = norm(nombre);
  // Reglas específicas primero (más largas / con "+" o "todo terreno")
  if (/6\s*\+\s*6|6x6.*todo terreno|pack de 6.*posacacho/.test(n) || (/todo terreno/.test(n) && /6/.test(n) && /posacacho/.test(n))) return 'pack 6+6 todo terreno';
  if (/5\s*\+\s*5|pack de 5.*posacacho/.test(n) || (/todo terreno/.test(n) && /5/.test(n) && /posacacho/.test(n))) return 'pack 5+5 todo terreno';
  if (/4\s*\+\s*4|pack de 4.*posacacho/.test(n) || (/todo terreno/.test(n) && /4/.test(n) && /posacacho/.test(n))) return 'pack 4+4 todo terreno';
  if (/cofre/.test(n) && /cacho/.test(n)) return 'cofre 6 cachos';
  if (/pack de 6 cacho|6 cachos/.test(n) && !/posacacho|cofre/.test(n)) return 'pack 6 cachos';
  if (/pack de 5 cacho|5 cachos/.test(n) && !/posacacho/.test(n)) return 'pack 5 cachos';
  if (/pack de 4 cacho|4 cachos/.test(n) && !/posacacho/.test(n)) return 'pack 4 cachos';
  if (/llavero/.test(n) && /soporte/.test(n) && /celular/.test(n)) return 'llavero soporte';
  if (/soporte/.test(n) && /celular/.test(n)) return 'soporte celular';
  if (/soporte/.test(n) && /notebook/.test(n) && /pro/.test(n)) return 'soporte notebook pro';
  if (/soporte/.test(n) && /notebook/.test(n)) return 'soporte notebook clasico';
  if (/pack escritorio.*pro|escritorio pro/.test(n)) return 'pack escritorio pro';
  if (/pack escritorio|escritorio.*clasic|kit.*escritorio/.test(n)) return 'pack escritorio clasico';
  if (/paleta/.test(n) && /playa/.test(n)) return 'paletas de playa';
  if (/posavaso/.test(n) && /hexagonal/.test(n)) return 'posavasos hexagonales';
  if (/posavaso/.test(n) && /circular/.test(n)) return 'posavasos circulares';
  if (/macetero/.test(n) && /plato|platito/.test(n)) return 'macetero con plato';
  if (/macetero/.test(n)) return 'macetero pequeno';
  if (/lampara|chillka/.test(n)) return 'lampara chillka';
  return null;
}

// IDs de duplicados "(corporativo)" a desactivar (del mandato).
const IDS_DESACTIVAR = [
  '69e682da5a61421eb70b38c2','69e682d1b443e361d2c5d2b3','69e682ce409cc4a009e8ac92','69e682cd7df1b84ad5ee88d1',
  '69e682cbd42494961d9151f2','69e682ca34292a547ec984a1','69e682cad9405933ef2a71ad','69e682c8cb8de4ad648a0447',
  '69e682c42f06ecc90ecc976b','69e682c158f821e61ef68c96','69e682bf96d11feeb3f12fb6','69e682be732c9f7a925204fa',
  '69e682bceb47069e9b96ca24','69e682bb0657bbdbe2b6282c','69e682b8d473fd3006e62fbc','69e682b781203b231529222e',
  '69e682b62c80603fcf658557','69e682b4202d929fd9dd3725','69e682b38e849a4a309e1ad0','69e682b2c048382acc444a21',
  '69dc7b3b34cf40ddc3671598','69dc7b3b34cf40ddc367159a','69dc7b3b34cf40ddc367159b','69dc7b3b34cf40ddc367159c',
  '69dc7b3b34cf40ddc367159d','69dc7b3b34cf40ddc3671590','69dc7b3b34cf40ddc3671591','69dc7b3b34cf40ddc3671592',
  '69dc7b3b34cf40ddc3671593','69dc7b3b34cf40ddc3671594','69dc7b3b34cf40ddc3671595','69dc7b3b34cf40ddc3671596',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { dryRun = false } = await req.json().catch(() => ({}));

    // 1) Desactivar duplicados corporativos
    const desactivados = [];
    for (const id of IDS_DESACTIVAR) {
      if (!dryRun) {
        await base44.asServiceRole.entities.Producto.update(id, { activo: false }).catch(() => {});
      }
      desactivados.push(id);
    }

    // 2) Recargar tramos en productos madre activos que matcheen la tabla
    const activos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 300);
    const actualizados = [];
    const sinMatch = [];
    const setDesactivar = new Set(IDS_DESACTIVAR);
    for (const p of activos) {
      if (setDesactivar.has(p.id)) continue; // se desactiva, no tocar sus tramos
      const key = matchTabla(p.nombre);
      if (!key) { sinMatch.push({ id: p.id, nombre: p.nombre }); continue; }
      const tramos = toTramos(TABLA[key]);
      if (!dryRun) {
        await base44.asServiceRole.entities.Producto.update(p.id, {
          precio_b2b_tramos: tramos,
          precio_b2b_preliminar: false,
        }).catch(() => {});
      }
      actualizados.push({ id: p.id, sku: p.sku, nombre: p.nombre, key, unitario_neto: tramos.unitario });
    }

    return Response.json({
      success: true,
      dryRun,
      desactivados_count: desactivados.length,
      actualizados_count: actualizados.length,
      actualizados,
      sin_match: sinMatch,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});