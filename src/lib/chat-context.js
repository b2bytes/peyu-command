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

  // 🏢 Datos B2B capturados durante la conversación.
  // Cuando hay empresa + contacto/email + qty >= 10 + producto, el agente
  // puede emitir [[QUOTE_PDF]] para generar cotización descargable.
  try {
    const raw = localStorage.getItem('peyu_chat_b2b_contact');
    const contact = raw ? JSON.parse(raw) : {};
    if (contact.empresa) ctx.b2b_empresa = contact.empresa;
    if (contact.contacto) ctx.b2b_contacto = contact.contacto;
    if (contact.email) ctx.b2b_email = contact.email;
    if (contact.telefono) ctx.b2b_telefono = contact.telefono;
    if (contact.fecha_requerida) ctx.b2b_fecha = contact.fecha_requerida;
    // Flag: ¿tenemos todo lo mínimo para cotizar PDF?
    const hasProduct = !!localStorage.getItem('peyu_chat_last_product');
    const hasQty = parseInt(localStorage.getItem('peyu_chat_last_qty') || '0', 10) >= 10;
    const hasContact = !!(contact.email || contact.telefono);
    const hasEmpresa = !!contact.empresa;
    if (hasProduct && hasQty && hasEmpresa && hasContact) {
      ctx.b2b_quote_ready = 'true';
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
    // 🚫 IMPORTANTE: NO incluimos namespace 'conversations' aquí. Si lo
    // inyectáramos, el agente recordaría chats pasados del usuario y los
    // continuaría como si fueran la sesión actual ("retomemos lo de Navidad…"),
    // rompiendo la sensación de chat nuevo. La memoria de chat se queda
    // archivada en el historial, accesible desde el botón. 'customers' sí
    // entra cuando el usuario está logueado para personalizar (nombre,
    // empresa, historial de compras) sin contaminar con conversaciones.
    const brainPromise = base44.functions.invoke('askPeyuBrain', {
      query: userMessage,
      top_k: 4,
      format: 'context',
      namespaces: userEmail
        ? ['products', 'policies_faq', 'sustainability', 'customers']
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

// 📞 Extractores B2B: detectan email, teléfono CL, RUT y empresa en mensajes
// del usuario. Lo persistimos en peyu_chat_b2b_contact para que el agente pueda
// emitir [[QUOTE_PDF]] cuando estén los datos mínimos.
const EMAIL_REGEX = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;
const PHONE_REGEX = /(\+?56\s?9[\s-]?\d{4}[\s-]?\d{4}|\b9\s?\d{4}\s?\d{4}\b|\b\d{9}\b)/;
const EMPRESA_HINT = /\b(soy de|trabajo en|nuestra empresa|empresa[: ]|de la empresa|en )\s*([A-ZÁÉÍÓÚÑ][\w\s&.,'-]{2,40})/;
const DATE_HINT = /\b(\d{1,2})\s?(?:de\s)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i;

function extractAndPersistB2BContact(msg) {
  if (!msg) return;
  try {
    const raw = localStorage.getItem('peyu_chat_b2b_contact') || '{}';
    const contact = JSON.parse(raw);
    let changed = false;

    const emailMatch = msg.match(EMAIL_REGEX);
    if (emailMatch && !contact.email) { contact.email = emailMatch[1]; changed = true; }

    const phoneMatch = msg.match(PHONE_REGEX);
    if (phoneMatch && !contact.telefono) { contact.telefono = phoneMatch[1].replace(/\s+/g, ' ').trim(); changed = true; }

    const empMatch = msg.match(EMPRESA_HINT);
    if (empMatch && !contact.empresa) {
      contact.empresa = empMatch[2].split(/[,.\n]/)[0].trim().slice(0, 50);
      changed = true;
    }

    const dateMatch = msg.match(DATE_HINT);
    if (dateMatch && !contact.fecha_requerida) {
      contact.fecha_requerida = `${dateMatch[1]} de ${dateMatch[2]}`;
      changed = true;
    }

    // Si el mensaje es "soy Juan" o "me llamo Pedro" → contacto
    const nameMatch = msg.match(/\b(?:soy|me llamo|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
    if (nameMatch && !contact.contacto) { contact.contacto = nameMatch[1]; changed = true; }

    if (changed) localStorage.setItem('peyu_chat_b2b_contact', JSON.stringify(contact));
  } catch { /* no-op */ }
}

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
  // Extraemos datos B2B del mensaje (email, teléfono, empresa, fecha) para
  // poder emitir [[QUOTE_PDF]] cuando estén los datos mínimos.
  extractAndPersistB2BContact(userMessage);

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