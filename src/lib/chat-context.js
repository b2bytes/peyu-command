// Construye un bloque [CONTEXTO] que se inyecta al agente junto al mensaje del usuario.
// Este bloque es INVISIBLE en la UI (el ChatMessageContent ya filtra texto; aquí lo
// agregamos al payload enviado al agente, no al mensaje mostrado).
//
// El agente lo parsea según las instrucciones en agents/asistente_compras.json.

import { base44 } from '@/api/base44Client';

// Cache en memoria del top de productos para no golpear la API en cada mensaje.
let _productCache = null;
let _productCacheAt = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

async function loadTopProducts() {
  const now = Date.now();
  if (_productCache && (now - _productCacheAt) < CACHE_TTL_MS) return _productCache;

  try {
    const list = await base44.entities.Producto.filter({ activo: true });
    _productCache = Array.isArray(list) ? list : [];
    _productCacheAt = now;
    return _productCache;
  } catch {
    return _productCache || [];
  }
}

// Selecciona un subset diverso de productos para inyectar en el contexto.
// Preferimos productos populares/destacados y cubrimos distintas categorías.
function pickTopSkus(all, { excludeSku = null, maxItems = 12 } = {}) {
  if (!all?.length) return [];

  // Agrupar por categoría y tomar hasta 3 por categoría para diversidad
  const byCat = new Map();
  for (const p of all) {
    if (!p.sku || !p.nombre) continue;
    if (excludeSku && p.sku === excludeSku) continue;
    const cat = p.categoria || 'Otros';
    if (!byCat.has(cat)) byCat.set(cat, []);
    if (byCat.get(cat).length < 3) byCat.get(cat).push(p);
  }

  // Aplanar intercalando categorías (round-robin) para diversidad
  const result = [];
  const arrays = [...byCat.values()];
  let idx = 0;
  while (result.length < maxItems && arrays.some(a => a.length > 0)) {
    const arr = arrays[idx % arrays.length];
    if (arr.length > 0) result.push(arr.shift());
    idx++;
    if (idx > 200) break; // safety
  }
  return result;
}

function formatSkuLine(p) {
  const precio = p.precio_b2c || p.precio_base_b2b || 0;
  // SKU|nombre|categoria|precio — nombre sin | ni comas para no romper el parsing
  const nombre = (p.nombre || '').replace(/[|,]/g, ' ').slice(0, 50);
  const cat = (p.categoria || '').replace(/[|,]/g, ' ');
  return `${p.sku}|${nombre}|${cat}|${precio}`;
}

export async function buildChatContext() {
  const ctx = {};

  // Ruta actual
  if (typeof window !== 'undefined') {
    ctx.page = window.location.pathname;
  }

  // Cargar productos disponibles (con cache)
  const allProducts = await loadTopProducts();

  // Producto visto (si estamos en /producto/:id)
  try {
    if (ctx.page && ctx.page.startsWith('/producto/')) {
      const id = ctx.page.split('/producto/')[1]?.split('?')[0]?.split('/')[0];
      if (id) {
        const p = allProducts.find(x => x.id === id);
        if (p) {
          ctx.viewing_sku = p.sku || null;
          ctx.viewing_name = p.nombre || null;
          ctx.viewing_category = p.categoria || null;
          ctx.viewing_price_b2c = p.precio_b2c || null;
        }
      }
    }
  } catch { /* no-op */ }

  // Carrito
  try {
    const raw = localStorage.getItem('carrito');
    const cart = raw ? JSON.parse(raw) : [];
    if (Array.isArray(cart)) {
      ctx.cart_items = cart.length;
      ctx.cart_total = cart.reduce((s, it) => s + ((it.precio || 0) * (it.cantidad || 1)), 0);
    }
  } catch { /* no-op */ }

  // Cantidad detectada previamente
  try {
    const q = localStorage.getItem('peyu_chat_last_qty');
    if (q) ctx.detected_qty = parseInt(q, 10);
  } catch { /* no-op */ }

  // Usuario si está autenticado
  try {
    const user = await base44.auth.me();
    if (user) {
      ctx.user_name = user.full_name || null;
      ctx.user_email = user.email || null;
    }
  } catch { /* not logged in, ignore */ }

  // 🎯 Top SKUs reales disponibles — la línea más importante:
  // garantiza que el agente SOLO use SKUs que existen y pueda mostrarlos con [[PRODUCTO:sku]]
  try {
    const picks = pickTopSkus(allProducts, { excludeSku: ctx.viewing_sku, maxItems: 12 });
    if (picks.length) {
      ctx.top_skus = picks.map(formatSkuLine).join(', ');
    }
    // Categorías con stock activo
    const cats = [...new Set(allProducts.map(p => p.categoria).filter(Boolean))];
    if (cats.length) {
      ctx.categorias_disponibles = cats.join(', ');
    }
  } catch { /* no-op */ }

  return ctx;
}

// Serializa el contexto en una línea compacta estilo key=value para el prompt.
export function serializeContext(ctx) {
  const parts = Object.entries(ctx)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      if (typeof v === 'string' && v.includes(' ')) return `${k}="${v.replace(/"/g, '')}"`;
      return `${k}=${v}`;
    });
  return parts.length ? `[CONTEXTO] ${parts.join(' ')}` : '';
}

// 🧠 Brain lookup: consulta Pinecone con el mensaje del usuario y devuelve
// un bloque compacto con productos/políticas/memoria más relevantes.
// Falla silenciosamente si el Brain no está disponible — degrada al modo legacy.
async function brainLookup(userMessage, userEmail) {
  try {
    const res = await base44.functions.invoke('askPeyuBrain', {
      query: userMessage,
      top_k: 4,
      format: 'context',
      namespaces: userEmail
        ? ['products', 'policies_faq', 'sustainability', 'conversations', 'customers']
        : ['products', 'policies_faq', 'sustainability'],
    });
    return res?.data?.context || '';
  } catch {
    return '';
  }
}

// Helper unificado: arma el contexto, lo enriquece con RAG del Brain y lo antepone al mensaje.
export async function withContext(userMessage) {
  const ctx = await buildChatContext();
  const ctxLine = serializeContext(ctx);

  // 🧠 Consulta al Brain en paralelo — mejora precisión de SKUs recomendados
  const brainBlock = await brainLookup(userMessage, ctx.user_email);

  const parts = [];
  if (ctxLine) parts.push(ctxLine);
  if (brainBlock) parts.push(`[BRAIN]\n${brainBlock}`);
  parts.push(userMessage);

  return parts.join('\n\n');
}