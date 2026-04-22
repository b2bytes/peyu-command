// ============================================================
// PEYU — Catálogo central de SEO
// Fuente única de verdad para títulos, descripciones, keywords
// y metadatos de TODAS las páginas públicas y landings B2B.
//
// Beneficios:
// 1. Evita duplicar strings SEO en cada página.
// 2. Permite auditorías: "muéstrame todas las landings con keyword X".
// 3. Alimenta sitemap.xml y el agente seo_sentinel (F5).
// 4. Garantiza consistencia de marca en SERPs.
// ============================================================

export const SITE_URL = 'https://peyuchile.cl';
export const SITE_NAME = 'PEYU Chile';
export const DEFAULT_OG_IMAGE = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg';

// Helper para construir URLs canónicas consistentes.
export const absUrl = (path = '/') => {
  const clean = String(path).startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean === '/' ? '' : clean}`;
};

// ============================================================
// KEYWORDS PRIORITARIAS (investigación competitiva abr-2026)
// Se agrupan por intención de búsqueda.
// ============================================================
export const KEYWORD_CLUSTERS = {
  // Core B2B — intención comercial alta
  coreB2B: [
    'regalos corporativos Chile',
    'regalos corporativos sustentables',
    'regalos corporativos plástico reciclado',
    'regalos corporativos personalizados empresas',
    'merchandising corporativo sostenible',
    'gifting empresarial Chile',
  ],
  // RRHH / People — buyer persona específico
  rrhh: [
    'welcome kit colaboradores',
    'regalos bienvenida nuevos empleados',
    'kit onboarding empresa',
    'regalos reconocimiento equipo',
    'detalles empleados fin de año',
  ],
  // Estacional — picos de búsqueda
  estacional: [
    'regalos día del trabajador empresa',
    'regalos 1 de mayo corporativos',
    'regalos navidad empresa Chile',
    'regalos fin de año colaboradores',
    'aguinaldo empresa personalizado',
  ],
  // ESG / Sostenibilidad — decisor CEO/Compliance
  esg: [
    'regalos ESG empresa',
    'merchandising huella carbono',
    'regalos economía circular',
    'sustentabilidad corporativa Chile',
    'gifting carbono neutral',
  ],
  // Eventos / Marketing
  eventos: [
    'merchandising eventos corporativos',
    'regalos activaciones marca',
    'swag conferencia Chile',
    'gift box evento corporativo',
  ],
  // PYMEs — volúmenes bajos
  pymes: [
    'regalos pyme personalizado',
    'regalos empresa desde 10 unidades',
    'merchandising emprendedores',
    'productos personalizados MOQ bajo',
  ],
  // Gobierno / Licitaciones
  gobierno: [
    'regalos corporativos gobierno',
    'merchandising licitación',
    'proveedor regalos institucionales',
    'compras públicas sustentables',
  ],
  // Técnicas — producto
  tecnica: [
    'grabado láser UV personalizado',
    'plástico 100% reciclado Chile',
    'fibra de trigo compostable',
    'inyección plástico reciclado',
  ],
};

// Keywords planas para index.html (mezcla todas las clusters).
export const ALL_KEYWORDS_FLAT = Object.values(KEYWORD_CLUSTERS).flat();

// ============================================================
// PÁGINAS PÚBLICAS ACTUALES (registry)
// Cada entrada se consume desde <SEO /> en su página respectiva.
// ============================================================
export const PUBLIC_PAGES = {
  home: {
    path: '/',
    title: 'PEYU Chile — Regalos Corporativos 100% Sostenibles con Plástico Reciclado',
    description: 'Regalos corporativos fabricados en Chile con plástico 100% reciclado. Personalización láser UV gratis desde 10 unidades. Garantía 10 años.',
    keywords: KEYWORD_CLUSTERS.coreB2B,
    priority: 1.0,
    changefreq: 'weekly',
  },
  shop: {
    path: '/shop',
    title: 'Tienda PEYU — Productos Sostenibles con Envío a Todo Chile',
    description: 'Explora nuestra tienda de productos sostenibles: soportes, kits de escritorio, carcasas, maceteros. Plástico 100% reciclado. Compra online con envío a todo Chile.',
    keywords: ['tienda sostenible Chile', 'productos plástico reciclado', 'comprar regalos ecológicos'],
    priority: 0.9,
    changefreq: 'daily',
  },
  catalogoVisual: {
    path: '/catalogo-visual',
    title: 'Catálogo Visual PEYU — Todos los Productos Sostenibles',
    description: 'Explora el catálogo completo de PEYU: regalos corporativos, productos de escritorio, entretenimiento y hogar. Todo fabricado con plástico 100% reciclado en Chile.',
    keywords: ['catálogo productos sostenibles', 'regalos corporativos catálogo'],
    priority: 0.9,
    changefreq: 'weekly',
  },
  b2bContacto: {
    path: '/b2b/contacto',
    title: 'Cotización B2B Corporativa — Respuesta en 24h | PEYU Chile',
    description: 'Solicita cotización para regalos corporativos personalizados. Pricing por volumen, personalización láser, factura empresa. Respuesta garantizada en 24h.',
    keywords: ['cotización regalos corporativos', 'presupuesto empresa merchandising'],
    priority: 0.95,
    changefreq: 'monthly',
  },
  b2bSelfService: {
    path: '/b2b/self-service',
    title: 'Cotiza Online en 2 minutos — Propuesta B2B Automática | PEYU',
    description: 'Arma tu cotización corporativa sin esperar. Sube tu logo, elige productos, descarga propuesta PDF al instante. Pricing transparente por volumen.',
    keywords: ['cotización online regalos corporativos', 'quote builder B2B Chile'],
    priority: 0.95,
    changefreq: 'monthly',
  },
  personalizar: {
    path: '/personalizar',
    title: 'Personaliza tu Regalo con Grabado Láser UV | PEYU Chile',
    description: 'Sube tu logo y previsualiza tu producto personalizado con grabado láser UV. Gratis desde 10 unidades. Mockup al instante con IA.',
    keywords: KEYWORD_CLUSTERS.tecnica,
    priority: 0.85,
    changefreq: 'monthly',
  },
  nosotros: {
    path: '/nosotros',
    title: 'Nosotros — Fabricantes Chilenos de Plástico Reciclado | PEYU',
    description: 'PEYU nace para combatir la crisis del plástico. Fabricamos en Chile con plástico 100% reciclado y energía renovable. Conoce nuestra historia y certificaciones ESG.',
    keywords: ['fabricante plástico reciclado Chile', 'empresa B Corp Chile', 'economía circular'],
    priority: 0.7,
    changefreq: 'monthly',
  },
  blog: {
    path: '/blog',
    title: 'Blog PEYU — Sostenibilidad, ESG y Regalos Corporativos',
    description: 'Aprende sobre gifting corporativo sustentable, tendencias ESG, casos de éxito y tips para RRHH. Blog de PEYU Chile.',
    keywords: ['blog sostenibilidad empresa', 'tendencias ESG Chile'],
    priority: 0.7,
    changefreq: 'weekly',
  },
  seguimiento: {
    path: '/seguimiento',
    title: 'Seguimiento de Pedido | PEYU Chile',
    description: 'Consulta el estado de tu pedido PEYU en tiempo real.',
    keywords: [],
    priority: 0.4,
    changefreq: 'never',
  },
  contacto: {
    path: '/contacto',
    title: 'Contacto — Tiendas en Providencia y Macul | PEYU Chile',
    description: 'Visítanos en F. Bilbao 3775 (Providencia) o P. de Valdivia 6603 (Macul). WhatsApp +56 9 3504 0242. Atención lunes a sábado.',
    keywords: ['PEYU tienda Santiago', 'tienda regalos sostenibles Providencia'],
    priority: 0.8,
    changefreq: 'monthly',
  },
  faq: {
    path: '/faq',
    title: 'Preguntas Frecuentes | PEYU Chile',
    description: 'Resuelve tus dudas sobre personalización, pedidos B2B, plazos, envíos y devoluciones.',
    keywords: [],
    priority: 0.6,
    changefreq: 'monthly',
  },
};

// ============================================================
// LANDINGS B2B (8) — pendientes de crear en F2-F4
// Se precargan aquí para alimentar sitemap.xml desde ya.
// ============================================================
export const B2B_LANDINGS = {
  corporativos: {
    path: '/empresas/regalos-corporativos-sustentables',
    title: 'Regalos Corporativos Sustentables para Empresas | PEYU Chile',
    description: 'Regalos corporativos con impacto ESG para empresas chilenas. Plástico 100% reciclado, personalización láser, facturación y despacho nacional. Cotización en 24h.',
    keywords: KEYWORD_CLUSTERS.coreB2B,
    cluster: 'coreB2B',
    priority: 0.95,
    changefreq: 'monthly',
    buyerPersona: 'Gerente RRHH / Marketing',
    status: 'pending', // pending | active
  },
  welcomeKit: {
    path: '/empresas/welcome-kit-colaboradores',
    title: 'Welcome Kit Personalizado para Onboarding | PEYU Chile',
    description: 'Welcome kits corporativos para recibir a nuevos colaboradores con identidad de marca. Desde 10 unidades, personalización láser UV, entrega en 10 días hábiles.',
    keywords: KEYWORD_CLUSTERS.rrhh,
    cluster: 'rrhh',
    priority: 0.9,
    changefreq: 'monthly',
    buyerPersona: 'RRHH / People',
    status: 'pending',
  },
  diaTrabajador: {
    path: '/empresas/dia-del-trabajador',
    title: 'Regalos Día del Trabajador para Empresas — 1° de Mayo | PEYU',
    description: 'Reconoce a tu equipo el 1° de mayo con regalos sostenibles hechos en Chile. Pedido mínimo 10 unidades, entrega antes del feriado garantizada.',
    keywords: ['regalos día del trabajador empresa', 'regalos 1 de mayo corporativos', 'reconocimiento colaboradores'],
    cluster: 'estacional',
    priority: 0.95,
    changefreq: 'yearly',
    buyerPersona: 'RRHH / Gerencia',
    status: 'pending',
    seasonal: { start: '03-01', end: '05-02' }, // MM-DD: visible ene-may
  },
  finAno: {
    path: '/empresas/fin-de-ano',
    title: 'Regalos de Fin de Año y Navidad Corporativa | PEYU Chile',
    description: 'Regalos corporativos de fin de año con impacto positivo. Planifica con anticipación, recibe propuesta en 24h y asegura entrega antes de diciembre.',
    keywords: ['regalos navidad empresa Chile', 'aguinaldo empresa personalizado', 'regalos fin de año colaboradores'],
    cluster: 'estacional',
    priority: 0.9,
    changefreq: 'yearly',
    buyerPersona: 'Marketing / RRHH',
    status: 'pending',
  },
  esg: {
    path: '/empresas/esg-sustentabilidad',
    title: 'Regalos ESG: Merchandising con Impacto Ambiental | PEYU',
    description: 'Alinea tu gifting corporativo con tus objetivos ESG. Reporte de huella de carbono evitada por cada pedido, certificación material 100% reciclado.',
    keywords: KEYWORD_CLUSTERS.esg,
    cluster: 'esg',
    priority: 0.85,
    changefreq: 'monthly',
    buyerPersona: 'Sostenibilidad / CEO',
    status: 'pending',
  },
  eventos: {
    path: '/empresas/eventos-activaciones',
    title: 'Merchandising para Eventos Corporativos y Activaciones | PEYU',
    description: 'Merchandising memorable para ferias, congresos, lanzamientos y activaciones de marca. Producción en 2 semanas, entrega en punto de evento.',
    keywords: KEYWORD_CLUSTERS.eventos,
    cluster: 'eventos',
    priority: 0.8,
    changefreq: 'monthly',
    buyerPersona: 'Marketing / Eventos',
    status: 'pending',
  },
  pymes: {
    path: '/empresas/pymes-emprendedores',
    title: 'Regalos Personalizados para PYMEs — Desde 10 Unidades | PEYU',
    description: 'Regalos corporativos para PYMEs y emprendedores: pedido mínimo 10 unidades, sin fees ocultos, personalización gratis. Factura electrónica.',
    keywords: KEYWORD_CLUSTERS.pymes,
    cluster: 'pymes',
    priority: 0.8,
    changefreq: 'monthly',
    buyerPersona: 'PYME / Dueño',
    status: 'pending',
  },
  gobierno: {
    path: '/empresas/gobierno-licitaciones',
    title: 'Proveedor de Regalos Institucionales y Licitaciones | PEYU Chile',
    description: 'PEYU es proveedor de regalos corporativos para instituciones públicas y licitaciones. Productos con certificado de material reciclado, facturación con OC.',
    keywords: KEYWORD_CLUSTERS.gobierno,
    cluster: 'gobierno',
    priority: 0.75,
    changefreq: 'monthly',
    buyerPersona: 'Compras Públicas',
    status: 'pending',
  },
};

// Helper: obtiene una página (pública o B2B) por path.
export function getSeoByPath(path) {
  const all = { ...PUBLIC_PAGES, ...B2B_LANDINGS };
  return Object.values(all).find(p => p.path === path) || null;
}

// Lista todas las URLs para sitemap.
export function listAllUrls({ includePending = true } = {}) {
  const pub = Object.values(PUBLIC_PAGES);
  const b2b = Object.values(B2B_LANDINGS).filter(
    p => includePending || p.status === 'active'
  );
  return [...pub, ...b2b];
}