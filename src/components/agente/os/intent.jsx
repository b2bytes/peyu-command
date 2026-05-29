// ============================================================================
// PEYU OS · Detección de intención
// A partir del texto del usuario decide qué bloque(s) hidratar dentro del chat.
// Devuelve un array de "tipos de bloque" que la página sabe renderizar.
// ============================================================================
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const RULES = [
  { type: 'kpis', kws: ['kpi', 'resumen', 'como vamos', 'como va el negocio', 'panorama', 'dashboard', 'metricas', 'numeros', 'general'] },
  { type: 'urgent', kws: ['urgente', 'vence', 'por vencer', 'vencimiento', 'pronto', 'expira', 'caduca'] },
  { type: 'quotes', kws: ['cotizacion', 'cotizaciones', 'propuesta', 'propuestas', 'quote'] },
  { type: 'production', kws: ['produccion', 'fabrica', 'taller', 'carga', 'pedidos por dia', 'agenda produccion'] },
  { type: 'product', kws: ['producto', 'articulo', 'catalogo', 'stock', 'precio de', 'item'] },
];

// Devuelve { blocks: string[], productQuery: string|null }
export function detectIntent(text, productos = []) {
  const t = norm(text);
  const blocks = [];

  for (const r of RULES) {
    if (r.kws.some((k) => t.includes(norm(k)))) blocks.push(r.type);
  }

  // Detectar nombre de producto mencionado en el catálogo real
  let productMatch = null;
  for (const p of productos) {
    const n = norm(p.nombre);
    if (n && n.length > 3 && t.includes(n)) { productMatch = p; break; }
    if (p.sku && t.includes(norm(p.sku))) { productMatch = p; break; }
  }
  if (productMatch && !blocks.includes('product')) blocks.push('product');

  // "como va <empresa>" → mostrar cotizaciones (filtrables) — tratamos como quotes
  if (/(como va|estado de|que paso con)/.test(t) && !blocks.length) {
    blocks.push('quotes');
  }

  return { blocks: [...new Set(blocks)], product: productMatch };
}