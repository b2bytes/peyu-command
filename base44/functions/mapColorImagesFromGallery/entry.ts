import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// mapColorImagesFromGallery
// ----------------------------------------------------------------------------
// Bug 1 (color ↔ imagen): precomputa el mapa estructurado `imagenes_por_color`
// de cada producto cruzando sus `colores` con su `galeria_urls` usando matching
// scored por filename (misma heurística que lib/color-image-matcher del front).
//
// Resultado: { "Turquesa": "https://...turquesa.webp", "Negro": "https://...negro.webp" }
// guardado en producto.imagenes_por_color. El front lo lee como fuente de verdad
// (prioridad 1) y deja de mostrar la imagen genérica al cambiar de color.
//
// Solo escribe colores que SÍ matchearon (no inventa URLs). Los colores sin
// match quedan fuera del mapa → el front cae a la imagen principal (esperado),
// y Diego puede ver en la respuesta qué colores quedaron sin foto para subirla.
//
// Payload opcional:
//   { dryRun: true }        → no escribe, solo reporta qué haría
//   { sku: "51559" }        → procesa un solo producto
//   { soloFaltantes: true } → solo productos sin imagenes_por_color aún
// ============================================================================

const COLOR_ALIASES = {
  negro:     ['negro', 'black', 'noir'],
  blanco:    ['blanco', 'white', 'blanc'],
  gris:      ['gris', 'gray', 'grey'],
  azul:      ['azul', 'blue', 'celeste', 'azulino', 'navy'],
  celeste:   ['celeste', 'cielo', 'sky', 'lightblue', 'azul-claro'],
  turquesa:  ['turquesa', 'turquoise', 'aqua', 'tiffany', 'menta', 'mint'],
  verde:     ['verde', 'green', 'olive', 'olivo'],
  amarillo:  ['amarillo', 'yellow', 'amber', 'mostaza', 'mustard'],
  naranja:   ['naranja', 'naranjo', 'orange', 'mandarina'],
  rojo:      ['rojo', 'red', 'rouge', 'carmin', 'carmesi'],
  rosa:      ['rosa', 'rosado', 'pink', 'fucsia', 'fuchsia', 'magenta', 'palo-rosa'],
  rosado:    ['rosado', 'rosa', 'pink', 'salmon'],
  morado:    ['morado', 'purple', 'violeta', 'violet', 'lila', 'lavanda'],
  violeta:   ['violeta', 'violet', 'morado', 'purple', 'lila'],
  cafe:      ['cafe', 'brown', 'marron', 'chocolate'],
  beige:     ['beige', 'crema', 'cream', 'arena', 'sand', 'nude', 'tan'],
  natural:   ['natural', 'raw', 'crudo', 'transparente', 'sin-color'],
  marmolado: ['marmolado', 'marbled', 'marble', 'jaspe'],
  dorado:    ['dorado', 'gold', 'oro'],
  plateado:  ['plateado', 'plata', 'silver'],
};

function norm(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
}

function getUrlSearchable(url) {
  if (!url) return '';
  try {
    const path = url.split('?')[0].split('#')[0];
    const file = path.split('/').pop() || '';
    return norm(file.replace(/\.(jpe?g|png|webp|gif|avif)$/i, ''));
  } catch {
    return norm(url);
  }
}

function buildColorAliases(color) {
  if (!color) return [];
  const idNorm = norm(color);
  const explicit = COLOR_ALIASES[idNorm] || [];
  const all = new Set([idNorm, ...explicit.map(norm)].filter(Boolean));
  return [...all].filter(a => a.length >= 3);
}

function scoreUrlForAliases(url, aliases) {
  const searchable = getUrlSearchable(url);
  if (!searchable || aliases.length === 0) return 0;
  let best = 0;
  for (const alias of aliases) {
    if (!alias) continue;
    if (searchable === alias) { best = Math.max(best, 100); continue; }
    const wordRe = new RegExp(`(^|[-_])${alias}([-_]|$)`);
    if (wordRe.test(searchable)) { best = Math.max(best, 80); continue; }
    if (searchable.startsWith(alias + '-') || searchable.startsWith(alias + '_')) {
      best = Math.max(best, 70); continue;
    }
    if (searchable.includes(alias)) { best = Math.max(best, 35); }
  }
  return best;
}

function findColorImageMatch(galeria, colorLabel, minScore = 60) {
  if (!Array.isArray(galeria) || galeria.length === 0 || !colorLabel) return null;
  const aliases = buildColorAliases(colorLabel);
  if (aliases.length === 0) return null;
  let bestIdx = -1, bestScore = 0;
  galeria.forEach((url, idx) => {
    const score = scoreUrlForAliases(url, aliases);
    if (score > bestScore) { bestScore = score; bestIdx = idx; }
  });
  if (bestScore < minScore || bestIdx < 0) return null;
  return { url: galeria[bestIdx], score: bestScore };
}

// Devuelve la lista de colores del producto desde los campos estructurados.
function getColoresProducto(p) {
  const fromColores = Array.isArray(p.colores) ? p.colores : [];
  const fromV2 = Array.isArray(p.colores_v2) ? p.colores_v2 : [];
  const set = new Set([...fromColores, ...fromV2].filter(Boolean));
  return [...set];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { dryRun = false, sku = null, soloFaltantes = false } = body;

    // Cargamos productos (un solo SKU o todos los activos), paginando.
    let productos = [];
    if (sku) {
      productos = await base44.asServiceRole.entities.Producto.filter({ sku });
    } else {
      let skip = 0;
      const pageSize = 100;
      while (true) {
        const page = await base44.asServiceRole.entities.Producto.list('-updated_date', pageSize, skip);
        if (!page || page.length === 0) break;
        productos.push(...page);
        if (page.length < pageSize) break;
        skip += pageSize;
      }
    }

    const report = [];
    let updated = 0;

    for (const p of productos) {
      const colores = getColoresProducto(p);
      const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls.filter(Boolean) : [];

      if (colores.length === 0 || galeria.length === 0) continue;
      if (soloFaltantes && p.imagenes_por_color && Object.keys(p.imagenes_por_color).length > 0) continue;

      // Preservamos lo que Diego ya cargó manualmente: solo completamos huecos.
      const mapaExistente = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? p.imagenes_por_color : {};
      const nuevoMapa = { ...mapaExistente };
      const sinFoto = [];
      let cambios = 0;

      for (const colorLabel of colores) {
        if (nuevoMapa[colorLabel]) continue; // ya mapeado (manual o previo) → respetar
        const match = findColorImageMatch(galeria, colorLabel);
        if (match) {
          nuevoMapa[colorLabel] = match.url;
          cambios++;
        } else {
          sinFoto.push(colorLabel);
        }
      }

      const item = {
        sku: p.sku,
        nombre: p.nombre,
        colores,
        mapeados: Object.keys(nuevoMapa).length,
        nuevos: cambios,
        sin_foto: sinFoto,
      };
      report.push(item);

      if (cambios > 0 && !dryRun) {
        await base44.asServiceRole.entities.Producto.update(p.id, { imagenes_por_color: nuevoMapa });
        updated++;
      }
    }

    // Productos donde algún color quedó sin foto → Diego debe subirla
    const conHuecos = report.filter(r => r.sin_foto.length > 0);

    return Response.json({
      success: true,
      dry_run: dryRun,
      productos_analizados: report.filter(r => r.colores.length > 0).length,
      productos_actualizados: updated,
      productos_con_colores_sin_foto: conHuecos.length,
      detalle_huecos: conHuecos.slice(0, 50),
      muestra: report.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});