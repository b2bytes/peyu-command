import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
  if (/\b(cotizar|cotizacion|por volumen|pedido grande|para mi empresa|mayorista)\b/.test(t))
    return { intent: 'b2b_quote', perfil: 'b2b', category: matchCategory(t) };
  if (/\b(carro|carrito|comprar|agregar|añadir|lo quiero|checkout|pagar|finalizar compra)\b/.test(t))
    return { intent: 'checkout', perfil, category: null };

  // Categorías directas (quick-replies "Ver cachos", etc.)
  const cat = matchCategory(t);
  if (cat && /\b(ver|muestrame|mostrar|quiero ver|cachos|escritorio|paletas|hogar|macetero)\b/.test(t))
    return { intent: 'search_product', perfil, category: cat };

  // Recomendación de regalo
  if (/\b(regalo|regalar|recomienda|recomendacion|sugerencia|para mi (mama|papa|polola|pareja|amigo|jefe)|cumpleanos|navidad|aniversario|que me recomiendas)\b/.test(t))
    return { intent: 'recommend_gift', perfil, category: cat };

  // "¿cómo personalizo con mi logo?" y dudas → chat informativo
  if (/\b(como personalizo|personalizar|mi logo|grabado laser|envio|despacho|garantia|reciclado|sustentable|de que material)\b/.test(t))
    return { intent: 'chat', perfil, category: null };

  return null; // no obvio → LLM
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
  };
}

// Filtra productos relevantes por categoría o por texto libre (match simple en nombre/incluye).
function pickProducts(productos, { category, text }) {
  let pool = productos;
  if (category) pool = pool.filter((p) => p.categoria_v2 === category);
  if (pool.length === 0) pool = productos; // fallback: no dejar vacío
  return pool;
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
    const perfil = cls.perfil === 'b2b' ? 'b2b' : perfilHint;
    const intent = cls.intent || 'chat';
    const category = cls.category || null;

    let reply_text = '';
    const cards = [];

    switch (intent) {
      case 'recommend_gift':
      case 'search_product': {
        const picks = pickProducts(productos, { category, text }).slice(0, 6);
        if (picks.length === 0) {
          reply_text = 'Aún estoy preparando el catálogo 🐢. ¿Te cuento de nuestras categorías?';
        } else if (picks.length === 1) {
          reply_text = perfil === 'b2b'
            ? `Mira esta opción ideal para tu empresa — con grabado láser de tu logo y precios por volumen 🐢`
            : `Esto te puede encajar perfecto 🐢 plástico 100% reciclado y garantía de 10 años.`;
          cards.push({ type: 'product', data: projectProduct(picks[0]) });
        } else {
          reply_text = category
            ? `Estas son nuestras opciones de ${category} 🐢 todas en plástico reciclado chileno.`
            : `Te dejo algunas ideas de productos reciclados que vuelan 🐢`;
          cards.push({ type: 'product_grid', data: { productos: picks.map(projectProduct) } });
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
          ? 'Somos PEYU 🐢 hacemos merchandising sustentable en plástico 100% reciclado chileno: regalos corporativos con grabado láser de tu logo, garantía de 10 años. ¿Quieres ver productos reciclados para oficina o cotizar por volumen?'
          : 'Soy Peyu 🐢 diseñamos regalos en plástico 100% reciclado chileno — desde maceteros reciclados hasta organizadores de escritorio, con garantía de 10 años. ¿Buscas un regalo para alguien o algo para ti?';
        break;
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