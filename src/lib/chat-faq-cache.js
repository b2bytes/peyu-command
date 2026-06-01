// ============================================================================
// chat-faq-cache.js — Caché de respuestas instantáneas para preguntas frecuentes
// ----------------------------------------------------------------------------
// La mayoría de las consultas que llegan a Peyu son las mismas preguntas
// repetidas (envíos, garantía, tiempos, pagos, ubicación). En vez de pagar un
// round-trip completo al agente IA (4-12s + costo de modelo) para cada una,
// las respondemos al INSTANTE desde este caché local.
//
// Cómo funciona:
//   - matchFAQ(texto) normaliza el mensaje del usuario y busca una FAQ cuyo
//     conjunto de keywords aparezca en el mensaje.
//   - Si hay match, el frontend muestra la respuesta de inmediato (sin agente).
//   - Si NO hay match, el flujo normal con el agente sigue intacto.
//
// Reglas de diseño:
//   - SOLO cacheamos preguntas informativas puras (políticas/datos fijos).
//   - NUNCA cacheamos intención de compra, recomendaciones de producto,
//     cotizaciones B2B ni nada que dependa del catálogo o del contexto. Eso
//     siempre va al agente para no romper la venta.
// ============================================================================

// Normaliza: minúsculas, sin tildes, sin signos, espacios colapsados.
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cada FAQ: necesita que TODAS las keywords de algún grupo `any` estén
// presentes. Estructura: { groups: [[kw, kw], [kw]], answer }.
// groups = OR de grupos; dentro de un grupo = AND de keywords.
const FAQS = [
  {
    id: 'envios',
    groups: [['envio'], ['envios'], ['despacho'], ['llega', 'pedido'], ['cuanto', 'demora'], ['tiempo', 'entrega']],
    answer:
      'Hacemos envíos a todo Chile 🇨🇱 vía Bluex, Starken y Chilexpress.\n\n📦 Llega en **5-7 días hábiles** (sin personalización).\n✨ **Envío gratis** sobre $40.000.\n\n¿Quieres que te ayude a encontrar el regalo perfecto? 🎁',
  },
  {
    id: 'garantia',
    groups: [['garantia'], ['se rompe'], ['dura', 'cuanto']],
    answer:
      'Todos nuestros productos tienen **garantía de 10 años** 🛡️\n\nSon hechos en plástico 100% reciclado chileno, súper resistentes. Si algo falla, lo reponemos.\n\n¿Te muestro algo? 🐢',
  },
  {
    id: 'pagos',
    groups: [['pago'], ['pagar'], ['webpay'], ['transferencia'], ['mercado pago'], ['medios', 'pago']],
    answer:
      'Aceptamos **WebPay, Mercado Pago y transferencia** 💳\n\nCon transferencia tienes **-5% de descuento** online. Pago 100% seguro.\n\n¿En qué te ayudo? 🌱',
  },
  {
    id: 'ubicacion',
    groups: [['donde', 'estan'], ['tienda', 'fisica'], ['direccion'], ['local'], ['sucursal']],
    answer:
      'Tenemos **2 tiendas en Santiago** 📍\n\n🏬 Providencia · Francisco Bilbao 3775\n🏬 Macul · Pedro de Valdivia 6603\n\nTambién puedes retirar tu pedido ahí mismo. ¿Te ayudo con algo más? 🐢',
  },
  {
    id: 'personalizacion',
    groups: [['grabado', 'laser'], ['personaliz', 'logo'], ['poner', 'logo'], ['grabar']],
    answer:
      'Sí 🔥 Personalizamos con **grabado láser UV**, ideal para regalos con tu logo o un mensaje especial.\n\nEs **gratis desde 10 unidades**. Para pedidos corporativos te armo una cotización al toque 💼\n\n¿Cuántas unidades necesitas?',
  },
  {
    id: 'sostenibilidad',
    groups: [['reciclado'], ['sostenible'], ['sustentable'], ['medio ambiente'], ['ecologico'], ['plastico', 'oceano']],
    answer:
      'Todo lo que hacemos es **plástico 100% reciclado** rescatado del océano 🌊\n\nLlevamos **500.000+ kg reciclados** y cada pieza tiene impacto real. Hecho en Chile con cariño 🐢💚\n\n¿Quieres ver algo del catálogo?',
  },
  {
    id: 'contacto',
    groups: [['whatsapp'], ['telefono'], ['hablar', 'humano'], ['contacto']],
    answer:
      'Puedes escribirnos por **WhatsApp al +56 9 3376 6573** 💬 o seguir conversando conmigo acá 🐢\n\n¿En qué te ayudo?',
  },
];

// Mensajes que parecen FAQ pero esconden intención de compra / cotización:
// si aparecen, NO usamos caché y mandamos al agente (que sí vende/cotiza).
const SALES_INTENT = /\b(compr|cotiz|necesito|quiero|me gustaria|recomien|regalo para|busco|cuanto cuesta|precio de|disponible|stock)\b/;

/**
 * Busca una respuesta instantánea para el mensaje del usuario.
 * @returns {string|null} respuesta cacheada o null si debe ir al agente.
 */
export function matchFAQ(userText) {
  const norm = normalize(userText);
  if (!norm || norm.length < 3) return null;

  // Si hay clara intención de compra/cotización → al agente (no cacheamos).
  if (SALES_INTENT.test(norm)) return null;

  // Mensajes muy largos suelen traer contexto rico → mejor el agente.
  if (norm.split(' ').length > 18) return null;

  for (const faq of FAQS) {
    const hit = faq.groups.some((group) => group.every((kw) => norm.includes(kw)));
    if (hit) return faq.answer;
  }
  return null;
}