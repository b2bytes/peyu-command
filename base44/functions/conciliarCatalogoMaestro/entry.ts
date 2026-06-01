import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Normaliza texto para matching difuso: sin acentos, minúsculas, sin signos.
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Tokens clave por slug del maestro → ayudan a encontrar el Producto real.
// Cada entrada: lista de tokens que DEBEN estar (incluyentes) y excluyentes.
const MATCH_RULES = {
  'cachos-pack-4': { inc: ['pack', '4', 'cacho'], exc: ['posacacho', 'todo terreno', '4 4', 'cofre'] },
  'cachos-pack-4-todo-terreno': { inc: ['4', 'cacho'], anyInc: ['todo terreno', 'posacacho', '4 4'] },
  'cachos-pack-5': { inc: ['pack', '5', 'cacho'], exc: ['posacacho', 'todo terreno', '5 5', 'cofre'] },
  'cachos-pack-5-todo-terreno': { inc: ['5', 'cacho'], anyInc: ['todo terreno', 'posacacho', '5 5'] },
  'cachos-pack-6': { inc: ['pack', '6', 'cacho'], exc: ['posacacho', 'todo terreno', '6 6', 'cofre'] },
  'cachos-pack-6-todo-terreno': { inc: ['6', 'cacho'], anyInc: ['todo terreno', 'posacacho', '6 6'] },
  'cachos-cofre-6': { inc: ['cofre', 'cacho'] },
  'escritorio-soporte-celular': { inc: ['soporte', 'celular'], exc: ['llavero', 'notebook', 'kit', 'pack escritorio'] },
  'escritorio-llavero-soporte': { inc: ['llavero'], anyInc: ['celular', 'soporte'] },
  'escritorio-notebook-clasico': { inc: ['notebook'], anyInc: ['clasico'], exc: ['pro', 'kit', 'pack'] },
  'escritorio-notebook-pro': { inc: ['notebook', 'pro'], exc: ['kit', 'pack escritorio'] },
  'escritorio-kit-clasico': { anyInc: ['kit', 'pack escritorio'], inc: ['clasico'], exc: ['pro'] },
  'escritorio-kit-pro': { anyInc: ['kit', 'pack escritorio'], inc: ['pro'] },
  'paletas-de-playa': { inc: ['paleta'] },
  'hogar-posavasos-hexagonales': { inc: ['posavaso'], anyInc: ['hexagonal', 'hexagono'] },
  'hogar-posavasos-circulares': { inc: ['posavaso'], anyInc: ['circular', 'redondo'] },
  'hogar-macetero-pequeno': { inc: ['macetero'], anyInc: ['pequeno'], exc: ['plato', 'platito', '3', 'pack'] },
  'hogar-macetero-con-plato': { inc: ['macetero'], anyInc: ['plato', 'platito'] },
  'hogar-lampara-chillka': { inc: ['lampara'] },
};

function scoreMatch(rule, nombreNorm) {
  if (!rule) return 0;
  const { inc = [], anyInc = [], exc = [] } = rule;
  // Excluyentes: si aparece uno, descarta.
  if (exc.some((t) => nombreNorm.includes(norm(t)))) return 0;
  // Incluyentes obligatorios: todos deben estar.
  if (!inc.every((t) => nombreNorm.includes(norm(t)))) return 0;
  let score = inc.length;
  // anyInc: al menos uno suma confianza; si hay anyInc y no matchea ninguno, score parcial.
  if (anyInc.length) {
    const hits = anyInc.filter((t) => nombreNorm.includes(norm(t))).length;
    if (hits === 0) return Math.max(1, score - 1); // match débil
    score += hits + 1;
  }
  return score;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const maestro = await base44.asServiceRole.entities.CatalogoMaestro.list('categoria', 100);
    const productos = await base44.asServiceRole.entities.Producto.list('-created_date', 500);

    const items = (maestro || []).map((m) => {
      const rule = MATCH_RULES[m.slug];
      // Candidatos: todos los productos rankeados por score.
      const candidatos = (productos || [])
        .map((p) => ({ p, score: scoreMatch(rule, norm(p.nombre)) }))
        .filter((c) => c.score > 0)
        .sort((a, b) => {
          // Mejor score; a igualdad, preferir activo + con galería.
          if (b.score !== a.score) return b.score - a.score;
          const aw = (a.p.activo ? 2 : 0) + ((a.p.galeria_urls?.length || 0) > 0 ? 1 : 0);
          const bw = (b.p.activo ? 2 : 0) + ((b.p.galeria_urls?.length || 0) > 0 ? 1 : 0);
          return bw - aw;
        });

      const best = candidatos[0]?.p || null;
      const dups = candidatos.slice(1).map((c) => ({
        id: c.p.id, sku: c.p.sku, nombre: c.p.nombre, activo: c.p.activo,
        imagen_url: c.p.imagen_url || '', gal: c.p.galeria_urls?.length || 0,
      }));

      return {
        slug: m.slug,
        nombre_oficial: m.nombre_oficial,
        categoria: m.categoria,
        incluye: m.incluye,
        colores: m.colores || [],
        precio_unitario_clp: m.precio_unitario_clp,
        precio_50_99_clp: m.precio_50_99_clp,
        maestro_id: m.id,
        match: best ? {
          id: best.id, sku: best.sku, nombre: best.nombre, activo: best.activo,
          imagen_url: best.imagen_url || '', gal: best.galeria_urls?.length || 0,
          precio_b2c: best.precio_b2c, precio_base_b2b: best.precio_base_b2b,
        } : null,
        candidatos_extra: dups, // posibles duplicados o variantes
      };
    });

    const sinMatch = items.filter((i) => !i.match).length;
    const conDuplicados = items.filter((i) => i.candidatos_extra.length > 0).length;

    return Response.json({
      total_maestro: items.length,
      total_productos: productos?.length || 0,
      sin_match: sinMatch,
      con_duplicados: conDuplicados,
      items,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});