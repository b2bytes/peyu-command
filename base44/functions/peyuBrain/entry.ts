import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════
// peyuBrain — cerebro conversacional de /v2 "Peyu Commerce OS".
// Un solo backend: clasifica intención (barato por keywords, LLM solo si
// no es obvio), consulta SOLO productos mostrar_en_v2===true (19 madre),
// y devuelve { reply_text, cards, perfil }. NUNCA inventa productos ni precios.
// ════════════════════════════════════════════════════════════════════

const CATEGORIES = ['Cachos', 'Escritorio', 'Paletas', 'Hogar'];

// ─── Clasificación BARATA por keywords / quick-replies ───
// Devuelve { intent, perfil, category } o null si no es obvio (→ LLM).
function cheapClassify(textRaw) {
  const t = (textRaw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!t.trim()) return null;

  // Perfil B2B explícito
  const b2bHint = /\b(empresa|corporativo|corporativos|volumen|por mayor|mayorista|logo|grabado|colaboradores|equipo|regalo institucional|cotizar|cotizacion|merchandising|pyme|factura)\b/.test(t);
  const perfil = b2bHint ? 'b2b' : null;

  // Intenciones obvias
  if (/\b(seguimiento|seguir|rastrear|donde esta mi pedido|track|tracking|estado de mi pedido|n.? ?de pedido)\b/.test(t))
    return { intent: 'track_order', perfil, category: null };
  if (/\b(gift ?card|tarjeta de regalo|giftcard|regalar saldo)\b/.test(t))
    return { intent: 'gift_card', perfil, category: null };
  if (/\b(comparar|compara|comparacion|cual es mejor|diferencia entre|vs\.?)\b/.test(t))
    return { intent: 'compare', perfil, category: matchCategory(t) };
  if (/\b(cotizar|cotizacion|por volumen|pedido grande|para mi empresa|mayorista)\b/.test(t))
    return { intent: 'b2b_quote', perfil: 'b2b', category: matchCategory(t) };
  if (/\b(carro|carrito|comprar|agregar|añadir|lo quiero|checkout|pagar|finalizar compra)\b/.test(t))
    return { intent: 'checkout', perfil, category: null };

  // Categorías directas (quick-replies "Ver cachos", etc.)
  const cat = matchCategory(t);
  if (cat && /\b(ver|muestrame|mostrar|quiero ver|cachos|escritorio|paletas|hogar|macetero)\b/.test(t))
    return { intent: 'search_product', perfil, category: cat };

  // Recomendación de regalo (incluye señales de presupuesto: "bajo $25.000", "barato")
  if (/\b(regalo|regalar|recomienda|recomendacion|sugerencia|para mi (mama|papa|polola|pareja|amigo|jefe)|cumpleanos|navidad|aniversario|que me recomiendas|barato|economico|bajo \$?\d|menos de \$?\d|hasta \$?\d)\b/.test(t))
    return { intent: 'recommend_gift', perfil, category: cat };

  // "¿cómo personalizo con mi logo?" y dudas → chat informativo
  if (/\b(como personalizo|personalizar|mi logo|grabado laser|envio|despacho|garantia|reciclado|sustentable|de que material)\b/.test(t))
    return { intent: 'chat', perfil, category: null };

  // Si menciona una categoría o trae palabras de búsqueda concretas → search dinámico (evita ir al LLM)
  if (cat) return { intent: 'search_product', perfil, category: cat };

  return null; // no obvio → LLM
}

// ─── Detección de cantidad + señal de empresa para el FORK de embudo B2B ───
// Umbral 10 = MOQ real de personalización. Devuelve { cantidad, empresaSignal }.
const MOQ_B2B = 10;

function detectQtyAndCompany(textRaw) {
  const t = (textRaw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Cantidad: "40 productos", "50 cachos", "200 unidades", "necesito 40"
  let cantidad = null;
  const qm = t.match(/(\d{1,6})\s*(unidades|u\b|piezas|cachos|paletas|posavasos|productos|maceteros|organizadores|kits?|cosas|articulos)/);
  if (qm) { const n = parseInt(qm[1], 10); if (!isNaN(n) && n > 0) cantidad = n; }
  if (cantidad == null) {
    const qm2 = t.match(/(?:necesito|quiero|cotizar|son|serian|seran|para|comprar|llevar)\s*(\d{1,6})\b/);
    if (qm2) { const n = parseInt(qm2[1], 10); if (!isNaN(n) && n > 0) cantidad = n; }
  }
  // Señal explícita de empresa (más amplia que el b2bHint general).
  const empresaSignal = /\b(para mi empresa|mi empresa|de mi empresa|con logo|con mi logo|cotizacion|cotizar|mayorista|corporativo|corporativos|regalo para mi equipo|para mi equipo|colaboradores|factura|institucional|merchandising|pyme)\b/.test(t);
  return { cantidad, empresaSignal };
}

function matchCategory(t) {
  if (/\bcacho/.test(t)) return 'Cachos';
  if (/\b(escritorio|oficina|organizador|porta)\b/.test(t)) return 'Escritorio';
  if (/\bpaleta/.test(t)) return 'Paletas';
  if (/\b(hogar|casa|cocina|macetero|maceta)\b/.test(t)) return 'Hogar';
  return null;
}

// ─── Clasificación con LLM (solo si cheapClassify devolvió null) ───
async function llmClassify(base44, text) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Eres el clasificador del asistente de PEYU (regalos sustentables en plástico reciclado, B2C y B2B).
Clasifica el mensaje del usuario. Mensaje: "${text}"

Intenciones posibles: recommend_gift, search_product, product_info, add_to_cart, checkout, b2b_quote, track_order, gift_card, chat.
Perfil: "b2c" (persona, regalo individual) o "b2b" (empresa, volumen, logo, corporativo). Si no hay señal clara, "b2c".
Categoría (opcional): Cachos, Escritorio, Paletas, Hogar, o null.`,
    response_json_schema: {
      type: 'object',
      properties: {
        intent: { type: 'string' },
        perfil: { type: 'string', enum: ['b2c', 'b2b'] },
        category: { type: ['string', 'null'] },
      },
      required: ['intent', 'perfil'],
    },
  });
  return {
    intent: res.intent || 'chat',
    perfil: res.perfil || 'b2c',
    category: CATEGORIES.includes(res.category) ? res.category : null,
  };
}

// ─── Proyección segura de un producto para el frontend (sin campos internos) ───
function projectProduct(p) {
  return {
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    categoria_v2: p.categoria_v2 || null,
    imagen_url: p.imagen_url || null,
    incluye_v2: p.incluye_v2 || p.incluye || p.descripcion || '',
    personalizacion_v2: p.personalizacion_v2 || 'Grabado láser de tu logo gratis desde 10 unidades.',
    precio_b2c: p.precio_b2c ?? null,
    precio_b2b_tramos: p.precio_b2b_tramos || null,
    dimensiones: p.dimensiones || null,
    // Ficha de detalle /v2 (catálogo B2B oficial)
    incluye_items_v2: Array.isArray(p.incluye_items_v2) ? p.incluye_items_v2 : [],
    colores_v2: Array.isArray(p.colores_v2) ? p.colores_v2 : [],
    peso_pack_gr: p.peso_pack_gr ?? null,
    dim_detalle_v2: p.dim_detalle_v2 || null,
    tapitas_aprox: p.tapitas_aprox ?? null,
    galeria_urls: Array.isArray(p.galeria_urls) ? p.galeria_urls.slice(0, 8) : [],
  };
}

// Stopwords ES que no aportan al matching de productos.
const STOP = new Set(['para','con','los','las','una','uno','del','que','por','como','mas','muy','este','esta','algo','quiero','busco','necesito','tienen','tienes','ver','muestrame','mostrar','regalo','empresa','mi','de','la','el','un','y','o','en','a']);

// Extrae presupuesto máximo del texto: "bajo $25.000", "menos de 25000", "hasta 25 mil".
function extractBudget(t) {
  const m = t.match(/(?:bajo|menos de|hasta|maximo|max|menor a|por debajo de)\s*\$?\s*([\d.]+)\s*(mil|k)?/);
  if (!m) return null;
  let n = parseInt(m[1].replace(/\./g, ''), 10);
  if (isNaN(n)) return null;
  if (m[2]) n *= 1000;           // "25 mil" / "25k"
  else if (n < 1000) n *= 1000;  // "25" → 25.000
  return n;
}

// Tokeniza el texto del usuario en palabras útiles (>2 chars, sin stopwords).
function tokenize(textRaw) {
  const t = (textRaw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return t.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
}

// Selección DINÁMICA: filtra por categoría + presupuesto y rankea por relevancia
// textual real contra nombre/incluye/categoría de cada producto del catálogo.
function pickProducts(productos, { category, text }) {
  const t = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tokens = tokenize(text);
  const budget = extractBudget(t);

  let pool = productos;
  if (category) {
    const byCat = pool.filter((p) => p.categoria_v2 === category);
    if (byCat.length) pool = byCat;
  }
  if (budget) {
    const byBudget = pool.filter((p) => (p.precio_b2c ?? Infinity) <= budget);
    if (byBudget.length) pool = byBudget;
  }

  // Scoring textual: cada token que aparece en nombre/incluye/categoría suma.
  if (tokens.length) {
    const scored = pool.map((p) => {
      const hay = `${p.nombre || ''} ${p.incluye_v2 || p.incluye || ''} ${p.categoria_v2 || ''}`
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let score = 0;
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 2;
        else if (hay.includes(tok.slice(0, 4))) score += 1; // match parcial (singular/plural)
      }
      return { p, score };
    });
    const hits = scored.filter((s) => s.score > 0);
    if (hits.length) {
      return hits.sort((a, b) => b.score - a.score).map((s) => s.p);
    }
  }

  // Sin matches textuales: ordena por precio asc (regalos económicos primero) como fallback útil.
  if (pool.length === 0) pool = productos;
  return [...pool].sort((a, b) => (a.precio_b2c ?? Infinity) - (b.precio_b2c ?? Infinity));
}

// ════════════════════════════════════════════════════════════════════
// EXTRACCIÓN DE DATOS B2B DESDE TEXTO LIBRE (aditivo, solo perfil B2B).
// Captura email/empresa/cantidad/nombre/producto cuando el cliente los
// escribe directo en el chat (no solo vía formulario de la card).
// ════════════════════════════════════════════════════════════════════

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.es',
  'live.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com',
  'aol.com', 'gmx.com', 'zoho.com', 'msn.com', 'hotmail.es', 'outlook.es',
]);

// Regex-based: barato, sin LLM. Devuelve {email, cantidad, nombre, empresa}.
function extractB2BRegex(textRaw) {
  const text = textRaw || '';
  const out = { email: null, cantidad: null, nombre: null, empresa: null };

  // Email estándar
  const em = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (em) out.email = em[0].toLowerCase();

  // Cantidad asociada a unidades / productos
  const tNorm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const qm = tNorm.match(/(\d{2,6})\s*(unidades|u\b|piezas|cachos|paletas|posavasos|productos|maceteros|organizadores|kits?)/);
  if (qm) {
    const n = parseInt(qm[1], 10);
    if (!isNaN(n) && n > 0) out.cantidad = n;
  }
  if (out.cantidad == null) {
    const qm2 = tNorm.match(/(?:necesito|quiero|cotizar|son|serian|seran|para)\s*(\d{2,6})\b/);
    if (qm2) { const n = parseInt(qm2[1], 10); if (!isNaN(n) && n > 0) out.cantidad = n; }
  }

  // Nombre de contacto: "soy Carolina", "me llamo Juan", "habla Pedro"
  const nm = text.match(/\b(?:soy|me llamo|habla|aqui|aquí)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
  if (nm) out.nombre = nm[1].trim();

  // Empresa: "de Entel", "de la empresa X", "para mi empresa X"
  const cm = text.match(/\b(?:de|para)\s+(?:la\s+empresa\s+|mi\s+empresa\s+|empresa\s+)?([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&.\- ]{1,40}?)(?:\.|,|;|\s+(?:necesito|quiero|cotizar|mi|y|para)|$)/);
  if (cm) {
    const cand = cm[1].trim();
    // Evitar capturar el propio nombre como empresa
    if (cand && cand.toLowerCase() !== (out.nombre || '').toLowerCase() && cand.length > 1) {
      out.empresa = cand;
    }
  }

  // Empresa por dominio corporativo del email (si no se detectó otra)
  if (!out.empresa && out.email) {
    const dom = out.email.split('@')[1];
    if (dom && !FREE_EMAIL_DOMAINS.has(dom)) {
      const base = dom.split('.')[0];
      if (base) out.empresa = base.charAt(0).toUpperCase() + base.slice(1);
    }
  }

  return out;
}

// LLM fallback: solo si el regex no encontró email NI (empresa+cantidad).
async function extractB2BLLM(base44, text) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Extrae datos de contacto B2B del siguiente mensaje de un cliente que quiere cotizar productos para su empresa. Devuelve null donde no haya dato explícito. NO inventes.
Mensaje: "${text}"`,
      response_json_schema: {
        type: 'object',
        properties: {
          nombre: { type: ['string', 'null'] },
          empresa: { type: ['string', 'null'] },
          email: { type: ['string', 'null'] },
          cantidad: { type: ['number', 'null'] },
          producto_interes: { type: ['string', 'null'] },
        },
      },
    });
    return {
      nombre: res.nombre || null,
      empresa: res.empresa || null,
      email: res.email ? String(res.email).toLowerCase() : null,
      cantidad: typeof res.cantidad === 'number' ? res.cantidad : null,
      producto_interes: res.producto_interes || null,
    };
  } catch {
    return { nombre: null, empresa: null, email: null, cantidad: null, producto_interes: null };
  }
}

function isCorporateEmail(email) {
  if (!email || !email.includes('@')) return false;
  return !FREE_EMAIL_DOMAINS.has(email.split('@')[1]);
}

function computeB2BScore({ empresa, cantidad, email }) {
  let s = 50;
  if (empresa) s += 20;
  if (cantidad && cantidad >= 10) s += 20;
  if (isCorporateEmail(email)) s += 10;
  return Math.min(s, 100);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const text = (body.message || '').toString().slice(0, 500);
    const perfilHint = body.perfil === 'b2b' ? 'b2b' : 'b2c'; // toggle del frontend
    // Identificadores de hilo persistente (vienen del front /v2 vía localStorage).
    const conversationId = (body.conversation_id || '').toString().slice(0, 120) || null;
    const sessionId = (body.session_id || '').toString().slice(0, 120) || null;

    // ─── MODO HISTORIAL (aditivo): el front /v2 pide retomar la conversación previa ───
    // Devuelve los turnos previos (user + respuesta real de Peyu) + el perfil del ChatLead.
    if (body.action === 'history' && conversationId) {
      const logs = await base44.asServiceRole.entities.AILog.filter(
        { conversation_id: conversationId }, 'created_date', 100
      );
      const turns = (logs || []).map((l) => ({
        user_message: l.user_message || '',
        reply_text: l.ai_response || '',
      }));
      let perfilPrev = null;
      try {
        const cl = await base44.asServiceRole.entities.ChatLead.filter(
          { conversation_id: conversationId }, '-created_date', 1
        );
        if (cl && cl[0]) perfilPrev = cl[0].tipo === 'B2B' ? 'b2b' : (cl[0].tipo === 'B2C' ? 'b2c' : null);
      } catch { /* noop */ }
      return Response.json({ turns, perfil: perfilPrev });
    }

    // 1) Catálogo madre canónico (SOLO mostrar_en_v2 === true). Service role:
    // chat público sin auth, pero solo lectura de productos visibles en v2.
    const productos = await base44.asServiceRole.entities.Producto.filter(
      { mostrar_en_v2: true }, '-created_date', 100
    );

    // 2) Clasificación barata → LLM solo si hace falta
    let cls = cheapClassify(text);
    if (!cls) {
      try { cls = await llmClassify(base44, text); }
      catch { cls = { intent: 'chat', perfil: null, category: matchCategory(text) }; }
    }
    // El perfil del toggle manda salvo que el texto sea explícitamente B2B
    let perfil = cls.perfil === 'b2b' ? 'b2b' : perfilHint;
    let intent = cls.intent || 'chat';
    const category = cls.category || null;

    // ════════════════════════════════════════════════════════════════
    // FORK DE EMBUDO B2B/B2C (CASO A / B / C).
    // Se evalúa ANTES del switch. perfilHint refleja el toggle/elección
    // previa del cliente (incluye memoria persistida vía body.perfil).
    // ════════════════════════════════════════════════════════════════
    const { cantidad: qtyDetectada, empresaSignal } = detectQtyAndCompany(text);
    const cantidadAlta = qtyDetectada != null && qtyDetectada >= MOQ_B2B;
    // CASO C: si el cliente YA eligió modo Empresa (toggle/memoria persistida en
    // body.perfil), respetamos su decisión y no re-preguntamos.
    // OJO: el fork mira SOLO perfilHint (decisión real del cliente), nunca la
    // inferencia del LLM/keywords — así "necesito 40 productos" (sin señal de
    // empresa explícita) SIEMPRE pregunta (CASO B), aunque el LLM lo crea B2B.
    const clienteYaDecidioB2B = perfilHint === 'b2b';

    if (!clienteYaDecidioB2B && cantidadAlta && empresaSignal) {
      // CASO A — intención B2B CLARA (cantidad + señal empresa): cambia solo a
      // Empresa + cotización, sin preguntar.
      perfil = 'b2b';
      intent = 'b2b_quote_auto';
    } else if (!clienteYaDecidioB2B && cantidadAlta && !empresaSignal) {
      // CASO B — AMBIGUO: cantidad alta sin señal de empresa → micro-fork.
      // Forzamos perfil b2c (aún no decide) para no extraer datos de empresa.
      perfil = 'b2c';
      intent = 'b2b_fork';
    }

    let reply_text = '';
    const cards = [];

    switch (intent) {
      case 'recommend_gift':
      case 'search_product': {
        const picks = pickProducts(productos, { category, text }).slice(0, 9);
        if (picks.length === 0) {
          reply_text = 'Aún estoy preparando el catálogo 🐢. ¿Te cuento de nuestras categorías?';
        } else if (picks.length === 1) {
          reply_text = perfil === 'b2b'
            ? `Mira esta opción ideal para tu empresa — con grabado láser de tu logo y precios por volumen 🐢`
            : `Esto te puede encajar perfecto 🐢 plástico 100% reciclado chileno y garantía de 10 años.`;
          cards.push({ type: 'product', data: projectProduct(picks[0]) });
        } else {
          reply_text = category
            ? `Estas son nuestras opciones de ${category} 🐢 todas en plástico 100% reciclado chileno.`
            : `Te dejo algunas ideas de productos reciclados que vuelan 🐢`;
          cards.push({ type: 'product_grid', data: { productos: picks.map(projectProduct) } });
        }
        break;
      }
      case 'compare': {
        const picks = pickProducts(productos, { category, text }).slice(0, 3);
        if (picks.length >= 2) {
          reply_text = 'Te dejo una comparación lado a lado 🐢 elige el que más te tinque.';
          cards.push({ type: 'compare', data: { productos: picks.map(projectProduct) } });
        } else {
          reply_text = '¿Qué productos quieres comparar? Dime un par de nombres o categorías 🐢';
        }
        break;
      }
      case 'product_info': {
        const picks = pickProducts(productos, { category, text }).slice(0, 1);
        if (picks[0]) {
          reply_text = `Aquí tienes el detalle 🐢`;
          cards.push({ type: 'product', data: projectProduct(picks[0]) });
        } else {
          reply_text = '¿De qué producto quieres saber más? 🐢';
        }
        break;
      }
      case 'b2b_fork': {
        // CASO B — pregunta cálida con dos botones tappables. NO cambia toggle.
        reply_text = `¡Genial! Para ${qtyDetectada} unidades quiero recomendarte bien 🐢 ¿Esto es para ti o para tu empresa?`;
        cards.push({ type: 'b2b_fork', data: { cantidad: qtyDetectada, category } });
        break;
      }
      case 'b2b_quote_auto': {
        // CASO A — intención B2B clara: ya cambiamos a Empresa, mostramos precios por tramo.
        const picks = pickProducts(productos, { category, text }).slice(0, 1);
        reply_text = `Perfecto, para ${qtyDetectada} unidades te muestro precios por volumen 🐢 son por unidad y excluyen IVA. El grabado de tu logo va gratis desde 10 unidades.`;
        cards.push({
          type: 'b2b_quote',
          data: { producto: picks[0] ? projectProduct(picks[0]) : null },
        });
        break;
      }
      case 'b2b_quote': {
        const picks = pickProducts(productos, { category, text }).slice(0, 1);
        reply_text = 'Perfecto, armemos tu cotización por volumen 🐢 Los precios son por unidad y excluyen IVA. Déjame tus datos y el grabado de tu logo va gratis desde 10 unidades.';
        cards.push({
          type: 'b2b_quote',
          data: { producto: picks[0] ? projectProduct(picks[0]) : null },
        });
        break;
      }
      case 'add_to_cart':
      case 'checkout': {
        reply_text = perfil === 'b2b'
          ? 'Para pedidos de empresa armo una cotización formal por volumen 🐢 ¿la generamos?'
          : 'Genial 🐢 cuando quieras revisas tu carro y finalizamos la compra.';
        cards.push({ type: 'checkout', data: { perfil } });
        break;
      }
      case 'track_order': {
        reply_text = 'Te ayudo a seguir tu pedido 🐢 ingresa tu número de orden o email.';
        cards.push({ type: 'order_status', data: {} });
        break;
      }
      case 'gift_card': {
        reply_text = 'Nuestras Gift Cards son el regalo sustentable perfecto cuando no sabes qué elegir 🐢';
        cards.push({ type: 'gift_card', data: {} });
        break;
      }
      default: {
        // chat informativo — espejamos keywords SEO sin inventar productos
        reply_text = perfil === 'b2b'
          ? 'Somos PEYU 🐢 hacemos merchandising sustentable en plástico 100% reciclado chileno (y fibra de trigo compostable en nuestras carcasas de teléfono): regalos corporativos con grabado láser de tu logo, garantía de 10 años. ¿Quieres ver productos reciclados para oficina o cotizar por volumen?'
          : 'Soy Peyu 🐢 diseñamos regalos sustentables: plástico 100% reciclado chileno en maceteros, cachos y organizadores, y fibra de trigo compostable en nuestras carcasas de teléfono. Con garantía de 10 años. ¿Buscas un regalo para alguien o algo para ti?';
        break;
      }
    }

    // ─── PERSISTENCIA ADITIVA (riesgo cero) ───
    // Guarda la respuesta REAL de Peyu en AILog y refresca el ChatLead del hilo.
    // Solo si el front mandó un conversation_id estable. Nunca rompe la respuesta.
    if (conversationId) {
      try {
        await base44.asServiceRole.entities.AILog.create({
          agent_name: 'peyuBrain',
          task_type: 'brain_search',
          model: 'gemini_3_flash',
          user_message: text,
          ai_response: (reply_text || '').slice(0, 4000), // texto REAL, no placeholder
          system_context: `perfil=${perfil}; intent=${intent}`,
          conversation_id: conversationId,
          session_id: sessionId,
          status: 'success',
          tags: ['v2', perfil, intent],
        });
      } catch { /* persistencia best-effort, no afecta la respuesta */ }

      let chatLeadRow = null;
      try {
        const preview = (text || '').slice(0, 120);
        const tipo = perfil === 'b2b' ? 'B2B' : 'B2C';
        const existing = await base44.asServiceRole.entities.ChatLead.filter(
          { conversation_id: conversationId }, '-created_date', 1
        );
        if (existing && existing.length > 0) {
          const cl = existing[0];
          chatLeadRow = cl;
          await base44.asServiceRole.entities.ChatLead.update(cl.id, {
            tipo,
            mensajes_count: (cl.mensajes_count || 0) + 1,
            ultimo_mensaje_preview: preview,
            ultimo_mensaje_at: new Date().toISOString(),
          });
        } else {
          chatLeadRow = await base44.asServiceRole.entities.ChatLead.create({
            conversation_id: conversationId,
            session_id: sessionId,
            tipo,
            estado: 'Activo',
            mensajes_count: 1,
            ultimo_mensaje_preview: preview,
            ultimo_mensaje_at: new Date().toISOString(),
            page_origen: '/v2',
          });
        }
      } catch { /* best-effort */ }

      // ─── EXTRACCIÓN B2B DESDE TEXTO LIBRE (solo perfil B2B, aditivo) ───
      // B2C nunca pasa por aquí: a un cliente personal jamás se le extraen
      // ni piden datos de empresa.
      if (perfil === 'b2b') {
        try {
          let ex = extractB2BRegex(text);
          // LLM solo si el regex no halló email NI (empresa+cantidad).
          const regexSuficiente = ex.email || (ex.empresa && ex.cantidad);
          if (!regexSuficiente) {
            const ll = await extractB2BLLM(base44, text);
            ex = {
              email: ex.email || ll.email,
              cantidad: ex.cantidad ?? ll.cantidad,
              nombre: ex.nombre || ll.nombre,
              empresa: ex.empresa || ll.empresa,
              producto_interes: ll.producto_interes || null,
            };
          }
          const productoInteres = ex.producto_interes || category || null;

          // Hay datos accionables si tenemos email O (empresa + cantidad).
          const hasActionable = !!ex.email || (!!ex.empresa && !!ex.cantidad);

          if (hasActionable && chatLeadRow) {
            // a. Enriquecer ChatLead: solo rellena vacíos, no pisa con null.
            const clUpdate = {};
            if (ex.email && !chatLeadRow.email) clUpdate.email = ex.email;
            if (ex.empresa && !chatLeadRow.empresa) clUpdate.empresa = ex.empresa;
            if (ex.nombre && !chatLeadRow.nombre) clUpdate.nombre = ex.nombre;
            if (ex.cantidad && !chatLeadRow.cantidad_estimada) clUpdate.cantidad_estimada = ex.cantidad;
            if (productoInteres && !chatLeadRow.producto_interes_nombre) clUpdate.producto_interes_nombre = productoInteres;

            // b. Upsert idempotente de B2BLead (por conversación o email existente).
            let leadId = chatLeadRow.convertido_a_b2b_lead_id || null;
            let existingLead = null;
            if (leadId) {
              try { existingLead = await base44.asServiceRole.entities.B2BLead.get(leadId); } catch { existingLead = null; }
            }
            if (!existingLead && ex.email) {
              const byEmail = await base44.asServiceRole.entities.B2BLead.filter({ email: ex.email }, '-created_date', 1);
              if (byEmail && byEmail[0]) { existingLead = byEmail[0]; leadId = byEmail[0].id; }
            }

            const score = computeB2BScore({ empresa: ex.empresa || existingLead?.company_name, cantidad: ex.cantidad ?? existingLead?.qty_estimate, email: ex.email || existingLead?.email });
            const histEntry = { at: new Date().toISOString(), type: existingLead ? 'note' : 'created', actor: 'peyuBrain', channel: 'web', detail: `Captura texto libre /v2: "${(text || '').slice(0, 180)}"` };

            if (existingLead) {
              const lu = { lead_score: score };
              if (ex.email && !existingLead.email) lu.email = ex.email;
              if (ex.empresa && !existingLead.company_name) lu.company_name = ex.empresa;
              if (ex.nombre && !existingLead.contact_name) lu.contact_name = ex.nombre;
              if (ex.cantidad && !existingLead.qty_estimate) lu.qty_estimate = ex.cantidad;
              if (productoInteres && !existingLead.product_interest) lu.product_interest = productoInteres;
              lu.historial = [...(existingLead.historial || []), histEntry];
              await base44.asServiceRole.entities.B2BLead.update(existingLead.id, lu);
            } else {
              const created = await base44.asServiceRole.entities.B2BLead.create({
                source: 'Formulario Web',
                contact_name: ex.nombre || 'Sin nombre',
                company_name: ex.empresa || 'Sin empresa',
                email: ex.email || null,
                qty_estimate: ex.cantidad || null,
                product_interest: productoInteres || null,
                status: 'Nuevo',
                lead_score: score,
                notes: `Capturado desde texto libre /v2 (chat_v2_texto): "${(text || '').slice(0, 400)}"`,
                historial: [histEntry],
              });
              leadId = created.id;
            }

            // c. Vincular ChatLead ↔ B2BLead.
            if (leadId) { clUpdate.convertido_a_b2b_lead_id = leadId; clUpdate.tipo = 'B2B'; clUpdate.estado = 'Calificado'; }
            if (Object.keys(clUpdate).length > 0) {
              await base44.asServiceRole.entities.ChatLead.update(chatLeadRow.id, clUpdate);
            }

            // 3. Confirmación cálida sin re-pedir datos ya entregados.
            const nombreSaludo = ex.nombre || chatLeadRow.nombre;
            const empresaTxt = ex.empresa || chatLeadRow.empresa;
            const cantTxt = ex.cantidad || chatLeadRow.cantidad_estimada;
            const emailTxt = ex.email || chatLeadRow.email;
            let conf = `¡Perfecto${nombreSaludo ? `, ${nombreSaludo}` : ''}! Ya anoté tu cotización`;
            if (cantTxt && productoInteres) conf += ` por ${cantTxt} ${productoInteres.toLowerCase()}`;
            else if (cantTxt) conf += ` por ${cantTxt} unidades`;
            if (empresaTxt) conf += ` para ${empresaTxt}`;
            conf += ' 🐢';
            if (emailTxt) conf += ` Te contactamos a ${emailTxt} en menos de 24h con precios por volumen (el grabado de tu logo va gratis desde 10 unidades).`;
            else conf += ' Para enviarte la cotización formal, ¿me dejas tu email?';
            reply_text = conf;
          }
        } catch { /* extracción best-effort, nunca rompe la respuesta */ }
      }
    }

    return Response.json({ reply_text, cards, perfil, intent });
  } catch (error) {
    return Response.json({
      reply_text: 'Uy, tuve un problema 🐢. Intenta de nuevo en un momento o escríbenos por WhatsApp.',
      cards: [],
      perfil: 'b2c',
      error: error.message,
    }, { status: 200 });
  }
});