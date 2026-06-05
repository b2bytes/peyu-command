// ============================================================================
// Product Matcher · selección LOCAL de productos relevantes al mensaje
// ----------------------------------------------------------------------------
// Antes el chat enviaba al agente un set de SKUs por round-robin de categorías
// (sin mirar lo que pedía el cliente) y dependía 100% del Brain (Pinecone) para
// relevancia. Cuando el Brain hacía timeout (4s, frecuente), el agente mostraba
// "cualquier producto". Este matcher rankea el catálogo según el mensaje del
// usuario usando señales simples (ocasión, destinatario, categoría, keywords),
// así el agente SIEMPRE recibe productos pertinentes aunque el Brain falle.
// ============================================================================

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Mapa de intención → categorías del catálogo + keywords que la disparan.
// Las categorías existentes: Escritorio, Hogar, Entretenimiento, Corporativo, Carcasas B2C.
const OCCASION_RULES = [
  { kw: ['oficina', 'escritorio', 'trabajo', 'jefe', 'colega', 'secretaria', 'profesional', 'pega'], cats: ['Escritorio', 'Corporativo'], boost: ['organizador', 'porta', 'lapiz', 'escritorio'] },
  { kw: ['casa', 'hogar', 'cocina', 'living', 'comedor', 'mama', 'mamá', 'papa', 'papá', 'abuela', 'abuelo', 'madre', 'padre'], cats: ['Hogar'], boost: ['macetero', 'panera', 'porta', 'bandeja', 'organizador'] },
  { kw: ['juego', 'jugar', 'entrete', 'divertido', 'niño', 'niña', 'nino', 'hijo', 'hija', 'sobrino', 'sobrina', 'gamer'], cats: ['Entretenimiento'], boost: ['cacho', 'juego', 'dado', 'cubo'] },
  { kw: ['empresa', 'corporativo', 'equipo', 'colaboradores', 'empleados', 'evento', 'logo', 'branded', 'merchandising', 'welcome kit'], cats: ['Corporativo', 'Escritorio'], boost: ['kit', 'set', 'pack'] },
  { kw: ['celular', 'telefono', 'teléfono', 'carcasa', 'funda', 'iphone', 'samsung'], cats: ['Carcasas B2C'], boost: ['carcasa', 'funda'] },
  { kw: ['llavero', 'llaveros', 'soporte celular', 'accesorio', 'accesorios'], cats: ['Escritorio', 'Corporativo'], boost: ['llavero', 'soporte'] },
];

// Quita la 's' final para emparentar singular/plural ("llaveros"→"llavero",
// "carcasas"→"carcasa"). Acota a tokens ≥4 para no romper palabras cortas.
const stem = (t) => (t.length >= 4 && t.endsWith('s') ? t.slice(0, -1) : t);

// 🎯 Palabras "modificadoras" que cambian la naturaleza del producto. Si el
// producto las trae en el nombre pero el usuario NO las pidió, penalizamos el
// match para no confundir "Soporte de Celular" con "Llavero Soporte de Celular".
const MODIFIER_WORDS = ['llavero', 'llaveros', 'pack', 'set', 'promocion', 'promoción', 'kit', 'mini', 'combo', 'unitario'];

// ¿El token del mensaje matchea el texto del producto, tolerando plural/singular?
// "llaveros" matchea "llavero" y viceversa, comparando por raíz sin 's'.
const tokenInText = (token, text) => {
  if (text.includes(token)) return true;
  const ts = stem(token);
  return ts.length >= 4 && text.includes(ts);
};

// Destinatarios → sesgo de categoría suave.
const RECIPIENT_HINTS = [
  { kw: ['mama', 'mamá', 'madre', 'abuela', 'pareja', 'polola', 'esposa', 'novia'], cats: ['Hogar'] },
  { kw: ['papa', 'papá', 'padre', 'abuelo', 'pololo', 'esposo', 'novio'], cats: ['Escritorio', 'Hogar'] },
  { kw: ['amigo', 'amiga', 'hermano', 'hermana'], cats: ['Entretenimiento', 'Hogar'] },
];

// Ocasiones de calendario → keyword libre (no cambia categoría, solo da contexto).
const CALENDAR_KW = ['navidad', 'patrias', 'aniversario', 'cumpleaños', 'cumpleanos', 'año nuevo', 'ano nuevo', 'profesor', 'logros', 'bienestar'];

/**
 * Rankea productos por relevancia al mensaje del usuario.
 * @param {Array} products - catálogo activo (objetos Producto)
 * @param {string} message - mensaje del usuario (limpio, sin [CONTEXTO])
 * @param {object} opts - { excludeSkus:Set, viewingCategory, maxItems }
 * @returns {Array} subset rankeado de productos
 */
export function matchProducts(products, message, opts = {}) {
  const { excludeSkus = new Set(), viewingCategory = null, maxItems = 6 } = opts;
  if (!Array.isArray(products) || products.length === 0) return [];

  const m = norm(message);
  const tokens = m.split(/\s+/).filter((t) => t.length >= 3);

  // Categorías candidatas según ocasión/destinatario detectados en el mensaje.
  const catScore = new Map(); // categoria → peso
  const boostWords = new Set();
  const addCat = (cats, w) => cats.forEach((c) => catScore.set(c, (catScore.get(c) || 0) + w));

  for (const rule of OCCASION_RULES) {
    if (rule.kw.some((k) => m.includes(norm(k)))) {
      addCat(rule.cats, 3);
      rule.boost.forEach((b) => boostWords.add(norm(b)));
    }
  }
  for (const rule of RECIPIENT_HINTS) {
    if (rule.kw.some((k) => m.includes(norm(k)))) addCat(rule.cats, 1.5);
  }
  // Si estamos viendo un producto, su categoría suma relevancia (cross-sell).
  if (viewingCategory) addCat([viewingCategory], 2);

  const hasCalendar = CALENDAR_KW.some((k) => m.includes(norm(k)));

  // Scoring por producto
  const scored = products
    .filter((p) => p.sku && p.nombre && !excludeSkus.has(p.sku))
    .map((p) => {
      let score = 0;
      const nombre = norm(p.nombre);
      const desc = norm(p.descripcion);
      const cat = p.categoria || 'Otros';

      // 1) Categoría candidata
      score += catScore.get(cat) || 0;

      // 2) Match directo de tokens del mensaje en nombre/descripción.
      // Tolerante a plural/singular: "llaveros" matchea "Llavero…", etc.
      // Bonus extra si el NOMBRE EMPIEZA por la query (match más fuerte).
      const nombreEmpiezaPorQuery = m.length >= 4 && nombre.startsWith(m.slice(0, Math.min(m.length, nombre.length)));
      if (nombreEmpiezaPorQuery) score += 4;
      for (const t of tokens) {
        if (tokenInText(t, nombre)) score += 2.5;
        else if (tokenInText(t, desc)) score += 1;
      }

      // 2b) Penalización por palabras modificadoras NO pedidas. Si el producto
      // se llama "Llavero Soporte de Celular" pero el cliente pidió "soporte de
      // celular" (sin "llavero"), restamos para que gane el producto exacto.
      for (const mod of MODIFIER_WORDS) {
        if (nombre.includes(mod) && !m.includes(mod)) score -= 2.5;
      }

      // 3) Boost words de la regla de ocasión
      for (const b of boostWords) {
        if (nombre.includes(b)) score += 1.5;
      }

      // 4) Señal de popularidad suave: stock alto y precio definido = producto vivo
      if (p.precio_b2c || p.precio_base_b2b) score += 0.3;
      if ((p.stock_actual || 0) > 0) score += 0.2;

      return { p, score, cat };
    });

  // Si NADIE matcheó (mensaje genérico tipo "hola"), devolvemos un mix diverso
  // por categoría para no mostrar siempre lo mismo.
  const anyMatch = scored.some((s) => s.score > 0.6);
  if (!anyMatch && !hasCalendar) {
    return diverseMix(scored.map((s) => s.p), maxItems);
  }

  scored.sort((a, b) => b.score - a.score);

  // Diversidad: evita devolver 6 productos de la misma categoría.
  const result = [];
  const catCount = new Map();
  for (const { p, cat } of scored) {
    const c = catCount.get(cat) || 0;
    if (c >= 3) continue; // máx 3 por categoría
    result.push(p);
    catCount.set(cat, c + 1);
    if (result.length >= maxItems) break;
  }
  // Rellenar si quedó corto
  if (result.length < maxItems) {
    for (const { p } of scored) {
      if (!result.includes(p)) result.push(p);
      if (result.length >= maxItems) break;
    }
  }
  return result;
}

// Mix diverso por categoría (round-robin) — fallback para mensajes sin señal.
function diverseMix(all, maxItems) {
  const byCat = new Map();
  for (const p of all) {
    const cat = p.categoria || 'Otros';
    if (!byCat.has(cat)) byCat.set(cat, []);
    if (byCat.get(cat).length < 3) byCat.get(cat).push(p);
  }
  const out = [];
  const arrays = [...byCat.values()];
  let idx = 0;
  while (out.length < maxItems && arrays.some((a) => a.length > 0)) {
    const arr = arrays[idx % arrays.length];
    if (arr.length > 0) out.push(arr.shift());
    idx++;
    if (idx > 200) break;
  }
  return out;
}