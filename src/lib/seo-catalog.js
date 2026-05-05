// ============================================================
// PEYU — Catálogo central de SEO (rev. may-2026)
// Fuente única de verdad para títulos, descripciones, keywords
// y metadatos de TODAS las páginas públicas y landings B2B.
//
// Investigación competitiva (may-2026, SERP Chile en vivo):
//   • qactus.cl       — "plástico reciclado", "impresión 3D"
//   • boxi.cl         — "5 opciones personalizar", "bambú/RPET"
//   • tiendarevivir.cl— "economía circular", "impacto real"
//   • regalatumarca.cl— "desde 2012", "talleres propios"
//   • imprentados.cl  — "7 ideas eco", "bolsas/cuadernos/botellas"
//   • merchi.cl       — "RPET + bambú certificados", "sin setup"
//   • gfgroup.cl      — "serigrafía/DTF/láser/cuño/bordado"
//   • beepromo.cl     — "marcaje integral", "5 técnicas"
//   • instantpromo.cl — "in-house", "EPP + ropa corporativa"
//   • cambiastudio    — "100% chile, plástico reciclado"
//
// Diferenciadores duros PEYU vs estos: 10 años garantía, fibra
// trigo compostable, MOQ 10u, factura empresa, propuesta 24h.
//
// Reglas SEO aplicadas:
// • Title 50-60 car. con keyword primaria al inicio + marca al final.
// • Description 140-158 car. con diferenciadores duros y CTA implícito.
// • Keywords long-tail chilenas reales (intención comercial alta).
// • Localización: "Chile", "Santiago", "Providencia", "Macul".
// ============================================================

// Re-exporta narrativa central (fuente única de verdad para descripciones).
export {
  PEYU_TAGLINE,
  PEYU_PITCH_ONE_LINER,
  PEYU_PITCH_B2B,
  PEYU_PITCH_B2C,
  PEYU_PITCH_ESG,
  PEYU_PITCH_LONG,
  PEYU_VALUE_PROPS,
  getPeyuDescription,
} from './peyu-narrative';

import { PEYU_PITCH_ONE_LINER, PEYU_PITCH_B2B, PEYU_PITCH_B2C, PEYU_PITCH_ESG } from './peyu-narrative';

export const SITE_URL = 'https://peyuchile.cl';
export const SITE_NAME = 'PEYU Chile';
export const DEFAULT_OG_IMAGE = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg';

// Helper para construir URLs canónicas consistentes.
export const absUrl = (path = '/') => {
  const clean = String(path).startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean === '/' ? '' : clean}`;
};

// ============================================================
// KEYWORDS PRIORITARIAS (mercado chileno · abr-2026)
// Validadas contra SERPs de Google.cl. Ordenadas por intención
// comercial (más alta arriba). Cada cluster se mapea a uno o
// varios buyer personas y a una landing específica.
// ============================================================
export const KEYWORD_CLUSTERS = {
  // ── Core B2B — intención comercial ALTA (gerentes/decisores)
  // (sept-2026: keywords confirmadas en SERP Chile de Qactus/Boxi/Merchi)
  coreB2B: [
    'regalos corporativos Chile',
    'regalos corporativos personalizados con logo',
    'regalos corporativos sustentables',
    'regalos corporativos sostenibles Chile',
    'regalos corporativos ecológicos',
    'regalos corporativos ecológicos plástico reciclado', // tiendarevivir.cl, peyu
    'merchandising corporativo personalizado',
    'merchandising sustentable empresa',
    'merchandising empresarial Chile',                    // merchi.cl
    'gifting corporativo Chile',
    'gifting empresarial sustentable',
    'productos promocionales empresa Chile',
    'productos promocionales personalizados',             // gopromocionales
    'artículos promocionales personalizados',
    'regalos empresariales premium',
    'regalos publicitarios empresa',                      // regalatumarca.cl
    'proveedor regalos corporativos Santiago',
    'proveedor merchandising Chile',
    'fabricante regalos corporativos Chile',
    'mejor empresa regalos corporativos Chile',           // qactus.cl long-tail
    'top regalos corporativos ecológicos Chile',
    'regalos corporativos hechos en Chile',
    'EPP corporativo personalizado',                      // instantpromo.cl
    'ropa corporativa personalizada Chile',
  ],

  // ── RRHH / People — onboarding y reconocimiento
  rrhh: [
    'welcome kit colaboradores',
    'welcome pack empresa',
    'kit bienvenida nuevos empleados',
    'kit onboarding colaboradores',
    'kit de bienvenida personalizado',
    'regalos para nuevos colaboradores',
    'regalos reconocimiento equipo trabajo',
    'gifting que retiene talento',
    'aniversario laboral regalo',
    'detalles para colaboradores',
    'kit corporativo personalizado RRHH',
  ],

  // ── Estacional — picos de búsqueda recurrentes
  estacional: [
    'regalos día del trabajador empresa',
    'regalos 1 de mayo corporativos',
    'regalos día del trabajo personalizados',
    'regalos navidad empresa Chile',
    'regalos fin de año colaboradores',
    'aguinaldo empresa personalizado',
    'regalos fiestas patrias empresa',
    'regalo 18 de septiembre corporativo',
    'regalos día de la mujer empresa',
    'regalos día del padre corporativo',
    'regalos día de la madre empresa',
  ],

  // ── ESG / Sostenibilidad — decisor sustainability/CEO
  // (sept-2026: combatimos directo a Qactus, Tiendarevivir, Cambia Studio)
  esg: [
    'merchandising sustentable Chile',
    'regalos ecológicos plástico reciclado',
    'productos plástico 100% reciclado',
    'productos plástico reciclado Chile',                 // qactus.cl
    'merchandising RPET Chile',
    'regalos RPET certificado',                           // merchi.cl
    'regalos economía circular',
    'economía circular regalos empresa',                  // tiendarevivir.cl
    'merchandising huella de carbono',
    'gifting carbono neutral Chile',
    'regalos ESG empresa',
    'sustentabilidad corporativa Chile',
    'productos post-consumo reciclado',
    'empresa B Corp Chile regalos',
    'merchandising con propósito',
    'regalos de bambú personalizados',                    // boxi.cl, obsequiarte.cl
    'regalos de corcho corporativos',                     // boxi.cl
    'productos algodón orgánico empresa',                 // boxi.cl, peyu
    'fibra de trigo compostable productos',               // diferencial PEYU
    'productos compostables empresa Chile',
    'regalos sustentables impacto ambiental',             // tiendarevivir.cl
    'regalos ecológicos con tu logo',                     // boxi.cl
    'cuadernos reciclados personalizados',                // imprentados.cl
    'botellas reutilizables corporativas',                // imprentados.cl
    'bolsas ecológicas personalizadas',                   // imprentados.cl
    'lápices ecológicos empresa',                         // obsequiarte.cl
    'mug bambú personalizado',                            // obsequiarte.cl
  ],

  // ── Eventos / Marketing — activaciones, ferias
  eventos: [
    'merchandising eventos corporativos',
    'regalos activaciones de marca',
    'swag conferencia Chile',
    'gift box evento corporativo',
    'regalos ferias y congresos',
    'kit evento corporativo personalizado',
    'merchandising lanzamiento producto',
    'goodie bag empresa',
  ],

  // ── PYMEs — volúmenes bajos, MOQ accesible
  pymes: [
    'regalos personalizados pyme',
    'regalos empresa desde 10 unidades',
    'merchandising sin pedido mínimo alto',
    'regalos corporativos emprendedores',
    'productos personalizados MOQ bajo',
    'regalos empresa pequeña Chile',
    'merchandising para startups Chile',
  ],

  // ── Gobierno / Licitaciones — compras públicas
  gobierno: [
    'regalos corporativos gobierno',
    'merchandising licitación pública',
    'proveedor regalos institucionales',
    'compras públicas sustentables Chile',
    'merchandising mercado público',
    'regalos institucionales personalizados',
    'proveedor estado Chile sostenible',
  ],

  // ── Técnicas — producto y manufactura
  // (sept-2026: cubrimos las 5 técnicas que ofrece la competencia)
  tecnica: [
    'grabado láser personalizado Chile',
    'grabado láser CO2 fibra',                            // mischapitas.cl
    'grabado láser UV en plástico',
    'serigrafía corporativa Chile',                       // gfgroup.cl
    'sublimación productos personalizados',               // beepromo.cl
    'tampografía empresa Chile',                          // beepromo.cl
    'DTF transfer empresa',                               // gfgroup.cl
    'cuño seco personalización',                          // gfgroup.cl
    'bordado corporativo Chile',                          // gfgroup.cl
    'plástico 100% reciclado Chile',
    'fibra de trigo compostable',
    'inyección plástico reciclado',
    'inyección plástico reciclado Chile',
    'impresión 3D plástico reciclado',                    // qactus.cl
    'logo grabado láser productos',
    'personalización láser logo empresa',
    'personalización con logo empresa',
    'mockup personalización online',
    'marcaje productos corporativos',                     // beepromo.cl
    'técnicas personalización merchandising',
  ],

  // ── B2C / Tienda — intención de compra individual
  b2c: [
    'productos sostenibles Chile',
    'regalos ecológicos personalizados',
    'productos diseño chileno',
    'regalos sustentables Santiago',
    'productos plástico reciclado tienda',
    'regalos originales Chile',
    'tienda online productos sustentables',
    'kit escritorio sostenible',
    'cachos plástico reciclado Chile',                    // peyu (long-tail dominante)
    'cachos peyu',                                        // brand
    'pack cachos sustentables',
    'juegos de mesa reciclados Chile',
    'juegos sustentables niños Chile',
    'set escritorio plástico reciclado',
    'lapiceros reciclados Chile',
    'organizador escritorio sustentable',
    'porta lápices ecológico personalizado',
    'carcasas celular plástico reciclado',
    'regalos originales hechos en Chile',
    'comprar productos eco online Chile',
  ],

  // ── Categorías de producto (long-tail informacional → comercial)
  categorias: [
    'mejores regalos corporativos sustentables 2026',
    'top 10 regalos corporativos ecológicos Chile',
    'ideas regalos navidad empresa sustentables',
    'qué regalar a colaboradores sustentable',
    'regalos día de la mujer empresa ecológicos',
    'aguinaldo sustentable empresa',
    'kit bienvenida sustentable startup',
    'regalo cumpleaños colaborador eco',
    'regalo ascenso empresa personalizado',
    'detalle día del padre corporativo Chile',
    'detalle día de la madre empresa Chile',
  ],

  // ── Local / Tiendas físicas
  local: [
    'tienda regalos Providencia',
    'tienda sostenible Santiago',
    'regalos corporativos Macul',
    'tienda productos reciclados Santiago',
    'PEYU tienda física',
  ],
};

// Keywords planas para index.html (mezcla todas las clusters).
export const ALL_KEYWORDS_FLAT = Object.values(KEYWORD_CLUSTERS).flat();

// ============================================================
// PÁGINAS PÚBLICAS — meta-tags optimizadas (rev. abr-2026)
// ============================================================
export const PUBLIC_PAGES = {
  home: {
    path: '/',
    title: 'Regalos Corporativos Sustentables Chile · Plástico 100% Reciclado | PEYU',
    description: PEYU_PITCH_ONE_LINER,
    keywords: [
      'regalos corporativos Chile',
      'regalos corporativos sustentables',
      'regalos personalizados con logo',
      'merchandising sustentable Chile',
      'plástico 100% reciclado',
    ],
    priority: 1.0,
    changefreq: 'weekly',
  },

  shop: {
    path: '/shop',
    title: 'Tienda PEYU · Productos Sostenibles con Despacho a Todo Chile',
    description: 'Compra online productos sostenibles de plástico 100% reciclado: escritorio, hogar, regalos. Personalización láser, garantía 10 años, envío 24-72h.',
    keywords: [
      'tienda productos sostenibles Chile',
      'comprar productos plástico reciclado',
      'regalos ecológicos online Chile',
      'tienda sustentable Santiago',
      'productos diseño chileno',
    ],
    priority: 0.9,
    changefreq: 'daily',
  },

  catalogoVisual: {
    path: '/catalogo-visual',
    title: 'Catálogo Completo PEYU · Regalos y Productos Plástico Reciclado',
    description: 'Catálogo visual de regalos corporativos, escritorio, hogar y entretenimiento. Plástico 100% reciclado, fibra de trigo compostable. Hecho en Chile.',
    keywords: [
      'catálogo regalos corporativos Chile',
      'catálogo merchandising sustentable',
      'productos plástico reciclado catálogo',
      'PEYU catálogo completo',
    ],
    priority: 0.9,
    changefreq: 'weekly',
  },

  b2bContacto: {
    path: '/b2b/contacto',
    title: 'Cotización Regalos Corporativos · Respuesta en 24h | PEYU Chile',
    description: 'Cotiza regalos corporativos personalizados con logo. Pricing por volumen, factura empresa, despacho nacional. Propuesta detallada en menos de 24h.',
    keywords: [
      'cotización regalos corporativos Chile',
      'presupuesto merchandising empresa',
      'cotizar regalos personalizados con logo',
      'proveedor regalos corporativos Santiago',
      'pedir cotización merchandising',
    ],
    priority: 0.95,
    changefreq: 'monthly',
  },

  b2bSelfService: {
    path: '/b2b/self-service',
    title: 'Cotizador Online B2B · Propuesta Automática en 2 Min | PEYU',
    description: 'Arma tu cotización corporativa sin esperar: sube tu logo, elige productos y descarga propuesta PDF al instante. Pricing transparente, sin fees ocultos.',
    keywords: [
      'cotizador online regalos corporativos',
      'quote builder B2B Chile',
      'cotización automática merchandising',
      'configurador regalos empresa',
    ],
    priority: 0.95,
    changefreq: 'monthly',
  },

  personalizar: {
    path: '/personalizar',
    title: 'Grabado Láser UV en Plástico Reciclado · Mockup Gratis | PEYU',
    description: 'Personaliza productos con grabado láser UV de alta precisión. Sube tu logo y previsualiza el mockup al instante. Gratis desde 10 unidades.',
    keywords: [
      'grabado láser personalizado Chile',
      'grabado láser UV plástico',
      'logo grabado láser productos',
      'personalización con logo empresa',
      'mockup personalización online',
    ],
    priority: 0.85,
    changefreq: 'monthly',
  },

  nosotros: {
    path: '/nosotros',
    title: 'Fabricante Chileno de Plástico Reciclado · Nuestra Historia | PEYU',
    description: 'PEYU transforma plástico post-consumo chileno en productos con 10 años de garantía. Producción local con energía renovable y certificación ESG.',
    keywords: [
      'fabricante plástico reciclado Chile',
      'empresa plástico post-consumo',
      'economía circular Chile',
      'productor sostenible chileno',
      'empresa B Corp Chile plásticos',
    ],
    priority: 0.7,
    changefreq: 'monthly',
  },

  blog: {
    path: '/blog',
    title: 'Blog PEYU · Sostenibilidad, ESG, RRHH y Regalos Corporativos',
    description: 'Tendencias 2026 en regalos corporativos sustentables, casos de éxito, tips de RRHH y guías ESG. Aprende a hacer gifting con propósito en Chile.',
    keywords: [
      'blog regalos corporativos Chile',
      'blog sostenibilidad empresa',
      'tendencias merchandising 2026',
      'tips RRHH gifting',
      'blog ESG Chile',
    ],
    priority: 0.7,
    changefreq: 'weekly',
  },

  seguimiento: {
    path: '/seguimiento',
    title: 'Seguimiento de Pedido · Tracking en Tiempo Real | PEYU Chile',
    description: 'Consulta el estado y tracking de tu pedido PEYU en tiempo real. Transportistas BlueExpress, Chilexpress y Starken integrados.',
    keywords: ['seguimiento pedido PEYU', 'tracking pedido Chile'],
    priority: 0.4,
    changefreq: 'never',
  },

  contacto: {
    path: '/contacto',
    title: 'Contacto · Tiendas en Providencia y Macul | PEYU Chile',
    description: 'Visítanos en F. Bilbao 3775 (Providencia) o P. de Valdivia 6603 (Macul). WhatsApp +56 9 3504 0242. Lunes a sábado 10-19h.',
    keywords: [
      'PEYU contacto Chile',
      'tienda regalos Providencia',
      'tienda sostenible Macul',
      'PEYU WhatsApp Santiago',
    ],
    priority: 0.8,
    changefreq: 'monthly',
  },

  faq: {
    path: '/faq',
    title: 'Preguntas Frecuentes · Personalización, Pedidos y Envíos | PEYU',
    description: 'Resuelve tus dudas: personalización láser, pedidos B2B, plazos de producción, envíos a regiones, devoluciones y facturación empresa.',
    keywords: [
      'preguntas frecuentes regalos corporativos',
      'FAQ merchandising Chile',
      'plazos producción personalización',
    ],
    priority: 0.6,
    changefreq: 'monthly',
  },
};

// ============================================================
// LANDINGS B2B (8) — meta-tags optimizadas para SEO + GEO
// ============================================================
export const B2B_LANDINGS = {
  corporativos: {
    path: '/empresas/regalos-corporativos-sustentables',
    title: 'Regalos Corporativos Sustentables · Plástico Reciclado | PEYU',
    description: 'Regalos corporativos con impacto ESG real. Plástico 100% reciclado chileno, personalización láser, factura empresa y propuesta en 24h.',
    keywords: KEYWORD_CLUSTERS.coreB2B,
    cluster: 'coreB2B',
    priority: 0.95,
    changefreq: 'monthly',
    buyerPersona: 'Gerente RRHH / Marketing',
    status: 'pending',
  },

  welcomeKit: {
    path: '/empresas/welcome-kit-colaboradores',
    title: 'Welcome Kit Personalizado · Onboarding Memorable | PEYU Chile',
    description: 'Welcome packs sostenibles para nuevos colaboradores: tu logo grabado en productos hechos en Chile. Desde 10 unidades, entrega en 10 días hábiles.',
    keywords: KEYWORD_CLUSTERS.rrhh,
    cluster: 'rrhh',
    priority: 0.9,
    changefreq: 'monthly',
    buyerPersona: 'RRHH / People',
    status: 'pending',
  },

  diaTrabajador: {
    path: '/empresas/dia-del-trabajador',
    title: 'Regalos Día del Trabajador · 1° de Mayo para Empresas | PEYU',
    description: 'Reconoce a tu equipo este 1° de mayo con regalos sostenibles personalizados. Hechos en Chile, producción rápida, entrega antes del feriado.',
    keywords: [
      'regalos día del trabajador empresa',
      'regalos 1 de mayo corporativos',
      'regalos día del trabajo personalizados',
      'reconocimiento colaboradores 1 de mayo',
      'regalos día del trabajador con logo',
    ],
    cluster: 'estacional',
    priority: 0.95,
    changefreq: 'yearly',
    buyerPersona: 'RRHH / Gerencia',
    status: 'pending',
    seasonal: { start: '03-01', end: '05-02' },
  },

  finAno: {
    path: '/empresas/fin-de-ano',
    title: 'Regalos de Navidad y Fin de Año Corporativos | PEYU Chile',
    description: 'Planifica los regalos de Navidad de tu empresa con anticipación. Productos sostenibles, personalización láser y entrega garantizada antes de diciembre.',
    keywords: [
      'regalos navidad empresa Chile',
      'regalos fin de año colaboradores',
      'aguinaldo empresa personalizado',
      'regalos corporativos navidad sustentable',
      'regalos navideños empresa con logo',
    ],
    cluster: 'estacional',
    priority: 0.9,
    changefreq: 'yearly',
    buyerPersona: 'Marketing / RRHH',
    status: 'pending',
  },

  esg: {
    path: '/empresas/esg-sustentabilidad',
    title: 'Merchandising ESG · Regalos con Impacto Ambiental | PEYU',
    description: 'Alinea tu gifting corporativo con tu reporte ESG. Trazabilidad de material reciclado, huella de carbono evitada y certificación en factura.',
    keywords: KEYWORD_CLUSTERS.esg,
    cluster: 'esg',
    priority: 0.85,
    changefreq: 'monthly',
    buyerPersona: 'Sostenibilidad / CEO',
    status: 'pending',
  },

  eventos: {
    path: '/empresas/eventos-activaciones',
    title: 'Merchandising para Eventos y Activaciones de Marca | PEYU',
    description: 'Swag memorable para ferias, congresos, lanzamientos y activaciones. Producción rápida en 2 semanas, entrega coordinada en punto de evento.',
    keywords: KEYWORD_CLUSTERS.eventos,
    cluster: 'eventos',
    priority: 0.8,
    changefreq: 'monthly',
    buyerPersona: 'Marketing / Eventos',
    status: 'pending',
  },

  pymes: {
    path: '/empresas/pymes-emprendedores',
    title: 'Regalos Corporativos para PYMEs · Desde 10 Unidades | PEYU',
    description: 'Merchandising para PYMEs y emprendedores chilenos: pedido mínimo 10 unidades, sin fees ocultos, personalización gratis y factura electrónica.',
    keywords: KEYWORD_CLUSTERS.pymes,
    cluster: 'pymes',
    priority: 0.8,
    changefreq: 'monthly',
    buyerPersona: 'PYME / Dueño',
    status: 'pending',
  },

  gobierno: {
    path: '/empresas/gobierno-licitaciones',
    title: 'Regalos Institucionales y Licitaciones · Mercado Público | PEYU',
    description: 'Proveedor de regalos corporativos para instituciones públicas y licitaciones. Certificado de material reciclado, facturación con OC y plazos cumplidos.',
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