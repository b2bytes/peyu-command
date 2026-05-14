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

  // 🧠 SKUs ya mostrados en esta sesión — el agente DEBE rotar a otros
  // distintos cuando el usuario pide más opciones u otra ocasión.
  try {
    const shown = localStorage.getItem('peyu_chat_shown_skus');
    if (shown) {
      const arr = JSON.parse(shown);
      if (Array.isArray(arr) && arr.length > 0) {
        ctx.already_shown_skus = arr.slice(-15).join(',');
      }
    }
  } catch { /* no-op */ }

  // 🎯 Intent detectado (B2C/B2B) — una vez que el cliente lo confirma,
  // persistimos para no volver a preguntar en cada turno.
  try {
    const intent = localStorage.getItem('peyu_chat_intent');
    if (intent === 'B2C' || intent === 'B2B') {
      ctx.chat_intent = intent;
    }
  } catch { /* no-op */ }

  // Usuario si está autenticado. CRITICAL: usamos isAuthenticated() ANTES de
  // me() porque me() en visitante anónimo lanza un 401 que termina reportándose
  // a logClientError y ensucia los runtime logs. isAuthenticated() es síncrono
  // contra el token local, así que es seguro y rápido.
  try {
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      const user = await base44.auth.me();
      if (user) {
        ctx.user_name = user.full_name || null;
        ctx.user_email = user.email || null;
      }
    }
  } catch { /* anónimo, ignore */ }

  // 🎯 Top SKUs reales disponibles — la línea más importante:
  // garantiza que el agente SOLO use SKUs que existen y pueda mostrarlos con [[PRODUCTO:sku]]
  // 6 SKUs es suficiente para tener variedad sin sobrecargar el system prompt
  // (antes 12 generaba respuestas largas porque el agente se distraía leyéndolos).
  try {
    const picks = pickTopSkus(allProducts, { excludeSku: ctx.viewing_sku, maxItems: 6 });
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
// 🛡️ Hard timeout 4s: si Pinecone está lento, NO bloqueamos el chat (peor UX
// que no tener Brain es esperar 30s para que aparezca el agente).
async function brainLookup(userMessage, userEmail) {
  try {
    const brainPromise = base44.functions.invoke('askPeyuBrain', {
      query: userMessage,
      top_k: 4,
      format: 'context',
      namespaces: userEmail
        ? ['products', 'policies_faq', 'sustainability', 'conversations', 'customers']
        : ['products', 'policies_faq', 'sustainability'],
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('brain_timeout')), 4000)
    );
    const res = await Promise.race([brainPromise, timeoutPromise]);
    return res?.data?.context || '';
  } catch {
    return '';
  }
}

// Saludos / mensajes triviales que NO necesitan consulta a Brain.
// Si el usuario solo dice "hola" / "gracias", inyectar Brain genera contexto
// pesado que dispara respuestas largas del agente — exactamente lo opuesto a
// lo que queremos. En esos casos el agente responde con el system prompt limpio
// y devuelve la respuesta corta esperada (1-2 líneas).
const SHORT_GREETINGS = /^(hola|holi|holaa+|buenas|hey|hi|hello|qué tal|que tal|gracias|ok|sí|si|no|listo|dale|chao|adiós|adios|👋|🐢|🌱|❤️|👍|😊|😄|🙏)[\s.!?¡¿]*$/i;

function isTrivialMessage(msg) {
  if (!msg) return true;
  const trimmed = msg.trim();
  if (trimmed.length < 4) return true; // "hola", "ok", emojis sueltos
  if (SHORT_GREETINGS.test(trimmed)) return true;
  return false;
}

// Detecta intent (B2C/B2B) del mensaje del usuario y lo persiste para que
// el agente no vuelva a preguntar. Solo escribe la primera vez que se detecta.
const B2B_KEYWORDS = /\b(empresa|empleados?|equipo|colaboradores?|corporativo|oficina|rrhh|cliente[s]?|proveedor(es)?|evento|fin de a[ñn]o|logo|marca|branded|masivo|para mi (empresa|pega|trabajo)|para el equipo|para la oficina|cotizaci[oó]n)\b/i;
const B2C_KEYWORDS = /\b(para m[ií]|uno solo|individual|mi (mam[áa]|pap[áa]|pareja|polola|pololo|amig[oa]|herman[oa]|hij[oa]|jefe|sobrin[oa])|cumplea[ñn]os|aniversario|regalo personal)\b/i;
const QTY_REGEX = /\b(\d{1,5})\s*(u\.?|unidades?|pcs|piezas|regalos|personas|empleados?|colaboradores?)?\b/i;

function detectAndPersistIntent(msg) {
  try {
    const current = localStorage.getItem('peyu_chat_intent');
    if (current === 'B2C' || current === 'B2B') return;
    if (!msg) return;
    // Por cantidad explícita
    const m = msg.match(QTY_REGEX);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 10 && n <= 10000) {
        localStorage.setItem('peyu_chat_intent', 'B2B');
        return;
      }
      if (n >= 1 && n <= 9) {
        localStorage.setItem('peyu_chat_intent', 'B2C');
        return;
      }
    }
    if (B2B_KEYWORDS.test(msg)) {
      localStorage.setItem('peyu_chat_intent', 'B2B');
      return;
    }
    if (B2C_KEYWORDS.test(msg)) {
      localStorage.setItem('peyu_chat_intent', 'B2C');
      return;
    }
  } catch { /* no-op */ }
}

// Helper unificado: arma el contexto, lo enriquece con RAG del Brain y lo antepone al mensaje.
export async function withContext(userMessage) {
  // Detectamos intent ANTES de armar el contexto para que quede disponible.
  detectAndPersistIntent(userMessage);

  const ctx = await buildChatContext();
  const ctxLine = serializeContext(ctx);

  // 🧠 Brain lookup — solo cuando hay intención real (no en saludos).
  // En "hola" devolvíamos un párrafo enorme porque Brain inyectaba políticas,
  // sostenibilidad, etc. Ahora en saludos confiamos solo en el system prompt
  // del agente, que ya tiene la regla "1-2 líneas + 1 producto".
  const brainBlock = isTrivialMessage(userMessage)
    ? ''
    : await brainLookup(userMessage, ctx.user_email);

  const parts = [];
  if (ctxLine) parts.push(ctxLine);
  if (brainBlock) parts.push(`[BRAIN]\n${brainBlock}`);
  parts.push(userMessage);

  return parts.join('\n\n');
}