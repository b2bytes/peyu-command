// ============================================================
// PEYU — Sistema inteligente de Momentos de Celebración Corporativa
// Fuente única de verdad para campañas estacionales 2026.
//
// Cada momento tiene:
// - fechas oficiales Chile (con ventana de pre-venta anticipada)
// - copys persuasivos (título, subtítulo, párrafos, CTA)
// - paleta de acento (para liquid-glass warm)
// - beneficios B2B específicos
// - deadline de producción (cuántos días antes hay que cerrar pedido)
//
// Este archivo NO toca funciones existentes: solo lo consume el
// banner <CelebrationBanner /> del home de forma opcional.
// ============================================================

/**
 * Fechas oficiales Chile 2026:
 *  • Día del Trabajador — 1 de mayo (feriado nacional)
 *  • Día de la Madre    — 2° domingo de mayo → 10 may 2026
 *  • Día del Padre      — 3° domingo de junio → 21 jun 2026
 */

export const CELEBRATION_MOMENTS = [
  // ────────────────────────────────────────────────────────
  // 1. DÍA DEL TRABAJADOR — 1 de mayo
  // ────────────────────────────────────────────────────────
  {
    id: 'trabajador',
    emoji: '🛠️',
    name: 'Día del Trabajador',
    eventDate: '2026-05-01',
    // Ventana en que se muestra el banner (pre-campaña + día)
    windowStart: '2026-04-01',
    windowEnd: '2026-05-02',
    // Días hábiles mínimos antes del evento para entregar
    leadTimeDays: 7,
    // Paleta "liquid-glass" cálida — azul trabajador + ámbar
    palette: {
      accent: '#F59E0B', // ámbar
      tint: 'rgba(30, 58, 138, 0.55)', // azul profundo
      glow: 'rgba(251, 191, 36, 0.30)',
      gradient: 'from-amber-500/20 via-orange-500/10 to-blue-900/20',
    },
    copy: {
      kicker: '🔔 Faltan pocos días — 1° de Mayo',
      title: 'Reconoce a tu equipo este Día del Trabajador',
      highlight: 'con un gesto que dura más que un aplauso',
      subtitle: 'Regalos sostenibles hechos en Chile para quienes sostienen tu empresa.',
      paragraph: 'Un regalo con sentido vale más que un bono. Entrega a tus colaboradores productos PEYU en plástico 100% reciclado, grabados con el logo de la empresa — un detalle útil que recuerda a tu equipo que su trabajo importa.',
      benefits: [
        { icon: '⚡', label: 'Producción exprés', text: 'Lo tenemos listo en 5 días hábiles desde aprobación.' },
        { icon: '🎁', label: 'Grabado láser gratis', text: 'Personalización con logo incluida desde 10 unidades.' },
        { icon: '🌱', label: 'Mensaje ESG real', text: 'Cada regalo evita +80g de plástico al vertedero.' },
        { icon: '🇨🇱', label: 'Hecho en Chile', text: 'Fábrica propia en Santiago, sin importación.' },
      ],
      ctaPrimary: { label: '🚀 Cotizar express', href: '/b2b/self-service' },
      ctaSecondary: { label: 'Ver ideas de regalo', href: '/empresas/dia-del-trabajador' },
      urgency: 'Pedido mínimo 10 u. Cierre de pedidos para entrega pre-feriado.',
    },
    // Productos estrella sugeridos (SKUs que ya existen en tu catálogo)
    featuredProducts: ['Soporte de celular PEYU', 'Kit Escritorio Pro', 'Posavasos Reciclados'],
    chatPrompt: 'Necesito regalos para el Día del Trabajador, ¿qué me recomiendas y cuál es el lead time?',
  },

  // ────────────────────────────────────────────────────────
  // 2. DÍA DE LA MADRE — 10 de mayo 2026 (2° domingo de mayo)
  // ────────────────────────────────────────────────────────
  {
    id: 'madre',
    emoji: '❤️',
    name: 'Día de la Madre',
    eventDate: '2026-05-10',
    windowStart: '2026-04-15',
    windowEnd: '2026-05-11',
    leadTimeDays: 7,
    palette: {
      accent: '#EC4899', // rosa
      tint: 'rgba(131, 24, 67, 0.50)', // rosa oscuro
      glow: 'rgba(244, 114, 182, 0.30)',
      gradient: 'from-pink-500/20 via-rose-400/10 to-fuchsia-900/20',
    },
    copy: {
      kicker: '💐 Domingo 10 de mayo',
      title: 'Celebra a las mamás de tu equipo',
      highlight: 'con un detalle que enternece sin contaminar',
      subtitle: 'Regalos corporativos sostenibles para el Día de la Madre. Empresas que cuidan, lo demuestran.',
      paragraph: 'Sorprende a las colaboradoras madres con un regalo pensado: útil, bello y fabricado con plástico 100% reciclado en Chile. Packaging rosa personalizable, tarjeta con tu mensaje y entrega coordinada por oficina.',
      benefits: [
        { icon: '💝', label: 'Packaging premium', text: 'Caja rosa con lazo natural y tarjeta personalizable.' },
        { icon: '✍️', label: 'Tarjeta con tu mensaje', text: 'Firma personalizada del CEO o Gerencia.' },
        { icon: '📦', label: 'Entrega por oficina', text: 'Coordinamos despacho a cada sede o casa del colaborador.' },
        { icon: '🌸', label: 'Diseño femenino', text: 'Productos en paleta rosada, coral y verde turquesa.' },
      ],
      ctaPrimary: { label: '💐 Armar regalo Mamá', href: '/b2b/self-service' },
      ctaSecondary: { label: 'Ver selección especial', href: '/catalogo-visual?categoria=madre' },
      urgency: 'Cerramos pedidos el 1 de mayo para entrega antes del domingo 10.',
    },
    featuredProducts: ['Macetero Reciclado', 'Posavasos Mármol Rosa', 'Soporte Celular Coral'],
    chatPrompt: 'Busco regalos corporativos para el Día de la Madre para mi equipo, ¿qué opciones tengo?',
  },

  // ────────────────────────────────────────────────────────
  // 3. DÍA DEL PADRE — 21 de junio 2026 (3° domingo de junio)
  // ────────────────────────────────────────────────────────
  {
    id: 'padre',
    emoji: '👔',
    name: 'Día del Padre',
    eventDate: '2026-06-21',
    windowStart: '2026-05-25',
    windowEnd: '2026-06-22',
    leadTimeDays: 10,
    palette: {
      accent: '#0EA5E9', // azul cielo
      tint: 'rgba(12, 74, 110, 0.55)', // azul marino
      glow: 'rgba(56, 189, 248, 0.30)',
      gradient: 'from-sky-500/20 via-blue-500/10 to-slate-900/20',
    },
    copy: {
      kicker: '🎯 Domingo 21 de junio',
      title: 'Un regalo para los papás que trabajan contigo',
      highlight: 'útil, masculino y con causa',
      subtitle: 'Detalles corporativos sostenibles para el Día del Padre. Porque los papás también merecen algo pensado.',
      paragraph: 'Entrega a los colaboradores papás un regalo que usen todos los días: soportes de escritorio, kits de oficina o accesorios de auto — todo en plástico 100% reciclado, grabado con el logo de tu empresa y en colores masculinos clásicos.',
      benefits: [
        { icon: '🏢', label: 'Útil en la oficina', text: 'Productos de escritorio que usan a diario.' },
        { icon: '🎨', label: 'Grabado premium', text: 'Logo empresa + iniciales del colaborador con láser UV.' },
        { icon: '🎁', label: 'Packaging masculino', text: 'Caja gris kraft minimalista con etiqueta PEYU.' },
        { icon: '📐', label: 'Líneas sobrias', text: 'Negro ónix, azul marino y gris plomo.' },
      ],
      ctaPrimary: { label: '👔 Cotizar regalo Papá', href: '/b2b/self-service' },
      ctaSecondary: { label: 'Ver productos masculinos', href: '/catalogo-visual?categoria=padre' },
      urgency: 'Pedidos hasta el 10 de junio para entrega pre-Día del Padre.',
    },
    featuredProducts: ['Kit Escritorio Pro', 'Soporte Notebook', 'Soporte Celular Negro'],
    chatPrompt: 'Quiero regalos corporativos para el Día del Padre, ¿qué me sugieres?',
  },
];

// ============================================================
// Detecta el momento de celebración ACTIVO más cercano
// (el que tiene la ventana activa hoy).
// Si hay varios solapados, devuelve el de eventDate más próxima.
// ============================================================
export function getActiveCelebration(now = new Date()) {
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const active = CELEBRATION_MOMENTS.filter(
    m => today >= m.windowStart && today <= m.windowEnd
  );

  if (active.length === 0) return null;

  // Más cercano al evento
  active.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  return active[0];
}

// Días restantes hasta el evento (para countdown/urgencia).
export function getDaysToEvent(moment, now = new Date()) {
  if (!moment) return null;
  const ms = new Date(moment.eventDate) - now;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// Días hábiles restantes antes del deadline de producción.
export function getDaysToDeadline(moment, now = new Date()) {
  if (!moment) return null;
  const daysToEvent = getDaysToEvent(moment, now);
  return Math.max(0, daysToEvent - moment.leadTimeDays);
}