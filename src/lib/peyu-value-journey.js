// ============================================================================
// peyu-value-journey.js
// ----------------------------------------------------------------------------
// Single source of truth para la página /propuesta-valor-peyu.
// Contiene:
//   1. Línea de tiempo del proyecto (lo construido mes a mes).
//   2. Catálogo de módulos PEYU vs alternativas del mercado chileno/LATAM.
//   3. Costos operativos reales (LLMs, infra).
//   4. Proyección ROI con campañas pagadas desde mes 3.
//
// Investigado may-2026, USD≈950 CLP. Precios públicos de cada vendor.
// Ajustar acá centraliza el cambio en toda la página.
// ============================================================================

export const CONTEXT = {
  cliente: 'PEYU Chile',
  pagado_hasta_ahora_clp: 750_000,
  cobro_inicial_mensual_clp: 250_000,
  meses_pagados: 3,
  meses_sin_pago: 2,
  meses_totales: 5,
  fecha_propuesta: 'Mayo 2026',
};

// ── 1. Línea de tiempo del proyecto ─────────────────────────────────────────
export const TIMELINE = [
  {
    mes: 'Mes 1',
    titulo: 'Fundación',
    descripcion: 'Levantamiento, arquitectura base, modelo de entidades, identidad visual Liquid Dual.',
    entregables: [
      'Sistema de diseño completo (Liquid Dual día/noche)',
      'Modelo de datos: 40+ entidades (Productos, Pedidos, Leads, Clientes, etc.)',
      'Identidad de marca refinada (Fraunces + Hanken Grotesk)',
      'Hosting + dominio + SSL configurado',
    ],
  },
  {
    mes: 'Mes 2',
    titulo: 'Tienda + B2B',
    descripcion: 'Storefront público B2C, flujo de carrito, panel B2B self-service, propuestas corporativas.',
    entregables: [
      'Tienda B2C completa (catálogo, ficha producto, carrito, checkout)',
      'Integración MercadoPago + WebPay con webhooks',
      'Panel B2B self-service con cotizador automático',
      'Generador de propuestas corporativas con PDF',
      'Integración WooCommerce (sync bidireccional)',
    ],
  },
  {
    mes: 'Mes 3',
    titulo: 'Inteligencia',
    descripcion: 'Agentes IA, automatizaciones, SEO técnico, integraciones Google completas.',
    entregables: [
      '6 agentes IA conversacionales (Peyu, Ads Commander, Asistente Compras, etc.)',
      'Cerebro vectorial Pinecone con búsqueda semántica',
      'Integración Google Search Console + Analytics 4 en vivo',
      'Sitemap automático + IndexNow blast (Bing/Yandex/Seznam)',
      'Optimizador SEO de meta tags con IA',
      'Pipeline B2B/B2C automático',
      'Centro logístico Bluex (etiquetas, tracking, secuencias)',
      'Cockpit ejecutivo móvil + monitoreo IA',
    ],
  },
  {
    mes: 'Meses 4-5',
    titulo: 'Lo que hicimos sin facturar',
    descripcion: 'Aunque ya no estaban pagando, seguimos construyendo. Estos 2 meses fueron una inversión nuestra para que vieran que el sistema funciona en serio.',
    entregables: [
      'Propagación SEO masiva a 100 productos con 9 keywords prioritarias',
      'Indexación completa: 107 URLs enviadas a Bing/Yandex/Seznam',
      'Sitemap registrado en Google Search Console',
      'Centro de costos reales + sugerencias de precio IA',
      'Auditoría visual completa del catálogo',
      'Generador de campañas Google Ads 2026 (PMax + Demand Gen)',
      'Forecaster IA pre-publicación de campañas',
      'Cockpit ejecutivo móvil refinado',
    ],
  },
  {
    mes: 'Hoy (Mes 6 en adelante)',
    titulo: 'Crecimiento',
    descripcion: 'Lo que viene: campañas pagadas, indexación masiva, escalamiento de ventas.',
    entregables: [
      'Google Ads + Performance Max gestionado por IA',
      'Indexación completa en Google/Bing (100+ URLs ya enviadas)',
      'Predicción de demanda con IA',
      'Recuperación de carritos abandonados automatizada',
      'NPS trimestral + reactivación de leads',
    ],
    es_futuro: true,
  },
];

// ── 2. Módulos PEYU vs Mercado ──────────────────────────────────────────────
// CLP estimado al tipo de cambio may-2026 (1 USD ≈ 950 CLP).
// Cuando hay rango, tomamos el plan equivalente al uso real de PEYU.
export const MODULOS_COMPARATIVA = [
  {
    categoria: 'E-commerce & Catálogo',
    icon: 'ShoppingBag',
    color: 'teal',
    items: [
      {
        modulo: 'Tienda online B2C + B2B unificada',
        que_hace: 'Catálogo, carrito, checkout, MercadoPago/WebPay, panel B2B',
        alternativa: 'Shopify Plus + plugin B2B',
        precio_mercado_clp: 2_375_000,
        precio_referencia: 'USD 2.500/mes (plan Plus)',
        fuente: 'shopify.com/plus/pricing',
      },
      {
        modulo: 'CPQ cotizador corporativo con descuentos por volumen',
        que_hace: 'Propuestas B2B con PDF, descuentos automáticos por cantidad',
        alternativa: 'PandaDoc + Quoter.com',
        precio_mercado_clp: 285_000,
        precio_referencia: 'USD 300/mes combinado',
        fuente: 'pandadoc.com/pricing',
      },
      {
        modulo: 'Bundles "Frequently Bought Together" con IA',
        que_hace: 'Análisis de pedidos para sugerir packs cross-sell',
        alternativa: 'Rebuy Engine (Shopify)',
        precio_mercado_clp: 95_000,
        precio_referencia: 'USD 99/mes',
        fuente: 'rebuyengine.com',
      },
    ],
  },
  {
    categoria: 'CRM & Pipeline',
    icon: 'Users',
    color: 'cyan',
    items: [
      {
        modulo: 'CRM con pipeline B2B + B2C + ficha cliente 360°',
        que_hace: 'Gestión leads, propuestas, conversiones, historial cliente',
        alternativa: 'HubSpot Sales Hub Professional',
        precio_mercado_clp: 855_000,
        precio_referencia: 'USD 90/usuario × 10 usuarios',
        fuente: 'hubspot.com/pricing/sales',
      },
      {
        modulo: 'Chat con captura progresiva de leads',
        que_hace: 'Widget Peyu IA en sitio, captura email/tel/empresa turn by turn',
        alternativa: 'Intercom Pro + Drift',
        precio_mercado_clp: 380_000,
        precio_referencia: 'USD 395/mes',
        fuente: 'intercom.com/pricing',
      },
      {
        modulo: 'Score de leads con IA + nurturing automático',
        que_hace: 'Calcula score, dispara secuencias, reactiva fríos',
        alternativa: 'HubSpot Marketing Hub Pro',
        precio_mercado_clp: 845_500,
        precio_referencia: 'USD 890/mes',
        fuente: 'hubspot.com/pricing/marketing',
      },
    ],
  },
  {
    categoria: 'Marketing & Contenido IA',
    icon: 'Sparkles',
    color: 'violet',
    items: [
      {
        modulo: 'Generador de campañas Google Ads con IA (PMax + Search)',
        que_hace: 'Crea campañas completas con headlines, audiencias, forecast',
        alternativa: 'Adcreative.ai + Optmyzr',
        precio_mercado_clp: 475_000,
        precio_referencia: 'USD 500/mes combinado',
        fuente: 'adcreative.ai/pricing',
      },
      {
        modulo: 'Social Studio: posts Instagram/LinkedIn/TikTok con IA',
        que_hace: 'Genera copy, imágenes promo, calendario semanal',
        alternativa: 'Buffer + Canva Pro + Jasper',
        precio_mercado_clp: 145_000,
        precio_referencia: 'USD 150/mes combinado',
        fuente: 'jasper.ai + canva.com',
      },
      {
        modulo: 'Blog SEO con generador IA de posts',
        que_hace: 'Crea posts optimizados, scheduled publishing',
        alternativa: 'Surfer SEO + Writesonic',
        precio_mercado_clp: 220_000,
        precio_referencia: 'USD 230/mes',
        fuente: 'surferseo.com/pricing',
      },
      {
        modulo: 'Email marketing transaccional + newsletter',
        que_hace: 'Carritos abandonados, recordatorios, suscriptores',
        alternativa: 'Klaviyo (10K contactos)',
        precio_mercado_clp: 166_000,
        precio_referencia: 'USD 175/mes',
        fuente: 'klaviyo.com/pricing',
      },
    ],
  },
  {
    categoria: 'SEO Técnico & Indexación',
    icon: 'Search',
    color: 'emerald',
    items: [
      {
        modulo: 'Google Search Console integrado + optimizador automático',
        que_hace: 'Sitemap auto, IndexNow blast, optimiza meta tags página 2→1',
        alternativa: 'Semrush Business + Screaming Frog',
        precio_mercado_clp: 470_000,
        precio_referencia: 'USD 500/mes combinado',
        fuente: 'semrush.com/pricing',
      },
      {
        modulo: 'Análisis SERP en vivo con IA (Gemini)',
        que_hace: 'Estudia competidores en Google.cl en tiempo real',
        alternativa: 'Ahrefs Standard',
        precio_mercado_clp: 190_000,
        precio_referencia: 'USD 199/mes',
        fuente: 'ahrefs.com/pricing',
      },
      {
        modulo: 'Explorador de keywords con generación IA',
        que_hace: 'Semillas → variantes IA → verifica en GSC',
        alternativa: 'KeywordTool.io + AnswerThePublic',
        precio_mercado_clp: 90_000,
        precio_referencia: 'USD 95/mes combinado',
        fuente: 'keywordtool.io',
      },
    ],
  },
  {
    categoria: 'Logística & Operaciones',
    icon: 'Truck',
    color: 'amber',
    items: [
      {
        modulo: 'Centro logístico Bluex integrado (etiquetas, tracking, polling)',
        que_hace: 'OT automática, secuencias de notificación, análisis IA de envíos',
        alternativa: 'Envia.cl + ShipStation',
        precio_mercado_clp: 185_000,
        precio_referencia: 'USD 195/mes',
        fuente: 'envia.cl + shipstation.com',
      },
      {
        modulo: 'Inventario + alertas de stock bajo con IA',
        que_hace: 'Predicción de demanda, alertas, conciliación Woo',
        alternativa: 'Cin7 Core (DEAR)',
        precio_mercado_clp: 330_000,
        precio_referencia: 'USD 349/mes',
        fuente: 'cin7.com/pricing',
      },
      {
        modulo: 'Centro de costos reales + sugerencias de precio IA',
        que_hace: 'Prorratea costos fantasma, calcula margen real, sugiere precios',
        alternativa: 'Profitwell + spreadsheets dedicados',
        precio_mercado_clp: 240_000,
        precio_referencia: 'Consultor externo equivalente',
        fuente: 'profitwell.com',
      },
    ],
  },
  {
    categoria: 'Inteligencia & Agentes',
    icon: 'Brain',
    color: 'fuchsia',
    items: [
      {
        modulo: '6 agentes IA conversacionales (Peyu, Ads, Compras, etc.)',
        que_hace: 'Chatbots especializados con acceso a tu data',
        alternativa: 'Custom GPTs OpenAI + Voiceflow',
        precio_mercado_clp: 280_000,
        precio_referencia: 'USD 295/mes',
        fuente: 'voiceflow.com/pricing',
      },
      {
        modulo: 'Cerebro vectorial Pinecone (memoria semántica)',
        que_hace: 'Búsqueda inteligente sobre productos, clientes, conversaciones',
        alternativa: 'Pinecone Standard + integración custom',
        precio_mercado_clp: 70_000,
        precio_referencia: 'USD 70/mes',
        fuente: 'pinecone.io/pricing',
      },
      {
        modulo: 'Monitoreo de IA con auditoría humana + re-entrenamiento',
        que_hace: 'Log de cada llamada LLM, costos, feedback, fine-tuning queue',
        alternativa: 'Langfuse Pro + Helicone',
        precio_mercado_clp: 190_000,
        precio_referencia: 'USD 200/mes',
        fuente: 'langfuse.com/pricing',
      },
      {
        modulo: 'Cockpit ejecutivo móvil con KPIs en vivo + briefing diario IA',
        que_hace: 'App-like en móvil, alertas, foresight, misiones del día',
        alternativa: 'Dashboards Looker Studio + consultor BI',
        precio_mercado_clp: 380_000,
        precio_referencia: 'Consultor BI 8h/mes',
        fuente: 'consultoría BI Chile promedio',
      },
    ],
  },
  {
    categoria: 'Infraestructura & Desarrollo',
    icon: 'Code',
    color: 'slate',
    items: [
      {
        modulo: 'Hosting cloud + CDN + backups + SSL',
        que_hace: 'Servidores, base de datos, almacenamiento, seguridad',
        alternativa: 'AWS / Vercel Pro + Supabase Pro',
        precio_mercado_clp: 145_000,
        precio_referencia: 'USD 150/mes',
        fuente: 'vercel.com + supabase.com',
      },
      {
        modulo: 'Desarrollo continuo + bugfixes + nuevas features',
        que_hace: 'Equipo de desarrollo dedicado para evolución del producto',
        alternativa: 'Agencia desarrollo Chile (40h/mes)',
        precio_mercado_clp: 1_200_000,
        precio_referencia: '$30K CLP/hora × 40h',
        fuente: 'codelan.cl + mgtech.cl tarifas mercado',
      },
    ],
  },
];

// Suma de todos los módulos si los compraran sueltos.
export const TOTAL_MERCADO_CLP = MODULOS_COMPARATIVA.reduce(
  (sum, cat) => sum + cat.items.reduce((s, i) => s + i.precio_mercado_clp, 0),
  0
);

// ── 3. Costos reales operativos de PEYU al mes ──────────────────────────────
// Lo que efectivamente cuesta MANTENER prendida la plataforma cada mes.
export const COSTOS_OPERATIVOS = [
  {
    item: 'LLMs (GPT-4o-mini, Claude Sonnet, Gemini)',
    detalle: 'Promedio 6 agentes IA + InvokeLLM en producción',
    costo_clp: 95_000,
  },
  {
    item: 'Pinecone (cerebro vectorial)',
    detalle: 'Plan Standard para búsqueda semántica',
    costo_clp: 70_000,
  },
  {
    item: 'Resend (emails transaccionales)',
    detalle: 'Carritos abandonados, propuestas, NPS',
    costo_clp: 25_000,
  },
  {
    item: 'Generación de imágenes IA (promo, mockups)',
    detalle: 'Promedio 200 imágenes/mes',
    costo_clp: 60_000,
  },
  {
    item: 'Hosting + base de datos Base44',
    detalle: 'Infra completa, storage, CDN, backups',
    costo_clp: 130_000,
  },
  {
    item: 'Bluex API + WooCommerce sync',
    detalle: 'Integraciones logísticas y catálogo',
    costo_clp: 15_000,
  },
  {
    item: 'Mantención + desarrollo continuo',
    detalle: 'Bugfixes, nuevas features, monitoreo, soporte',
    costo_clp: 380_000,
  },
];

export const TOTAL_OPERATIVO_CLP = COSTOS_OPERATIVOS.reduce((s, c) => s + c.costo_clp, 0);

// ── 4. Proyección ROI ───────────────────────────────────────────────────────
// Asumiendo Google Ads gestionado + indexación + automatizaciones desde mes 3.
// Conservador: AOV B2C ~$45K, conv 1.5%, AOV B2B ~$650K, conv leads 18%.
export const ROI_PROYECCION = [
  {
    mes: 'Mes 1-2',
    estado: 'Setup + indexación inicial',
    inversion_ads_clp: 0,
    ventas_proyectadas_clp: 0,
    ingresos_organicos_clp: 250_000,
    leads_b2b: 4,
    nota: 'Tráfico orgánico inicial, primeras propuestas B2B desde GSC.',
  },
  {
    mes: 'Mes 3',
    estado: 'Campañas Google Ads ON',
    inversion_ads_clp: 400_000,
    ventas_proyectadas_clp: 1_200_000,
    ingresos_organicos_clp: 480_000,
    leads_b2b: 12,
    nota: 'Primera ola con Performance Max + Search Defense.',
  },
  {
    mes: 'Mes 4',
    estado: 'Optimización IA + retargeting',
    inversion_ads_clp: 600_000,
    ventas_proyectadas_clp: 2_400_000,
    ingresos_organicos_clp: 750_000,
    leads_b2b: 18,
    nota: 'IA optimiza pujas, carritos abandonados recuperan 15%.',
  },
  {
    mes: 'Mes 5',
    estado: 'Escalamiento B2B + bundles',
    inversion_ads_clp: 800_000,
    ventas_proyectadas_clp: 3_800_000,
    ingresos_organicos_clp: 1_100_000,
    leads_b2b: 24,
    nota: '2-3 cuentas corporativas grandes cerradas. AOV B2B sube.',
  },
  {
    mes: 'Mes 6',
    estado: 'Maquinaria a régimen',
    inversion_ads_clp: 1_000_000,
    ventas_proyectadas_clp: 5_200_000,
    ingresos_organicos_clp: 1_500_000,
    leads_b2b: 32,
    nota: 'SEO orgánico ya rinde fuerte. ROAS Ads >4x sostenido.',
  },
];

// ── 5. Propuesta de continuidad ────────────────────────────────────────────
export const PLANES_PROPUESTOS = [
  {
    nombre: 'Plan Esencial',
    precio_clp: 450_000,
    descripcion: 'Plataforma operando, mantención mínima, sin features nuevas.',
    incluye: [
      'Hosting + infra + backups',
      'LLMs base (agentes activos)',
      'Bugfixes críticos',
      'Soporte por email (48h)',
    ],
    no_incluye: ['Nuevas features', 'Optimización campañas Ads', 'Reportes ejecutivos'],
    recomendado: false,
  },
  {
    nombre: 'Plan Crecimiento',
    precio_clp: 750_000,
    descripcion: 'Lo que necesitan para que la plataforma genere ROI real.',
    incluye: [
      'Todo lo del Esencial',
      'Optimización SEO continua + meta tags IA',
      'Gestión Google Ads con agente IA Commander',
      'Generación de contenido social semanal',
      'Reportes ejecutivos mensuales',
      'Soporte prioritario WhatsApp (24h)',
      '4h/mes de nuevas features',
    ],
    no_incluye: [],
    recomendado: true,
  },
  {
    nombre: 'Plan Escala',
    precio_clp: 1_200_000,
    descripcion: 'Para cuando la operación crece y necesita más músculo.',
    incluye: [
      'Todo lo del Crecimiento',
      '12h/mes de desarrollo dedicado',
      'Account manager dedicado',
      'Análisis competencia mensual',
      'Setup de nuevas integraciones (Instagram, Mercado Libre)',
      'Capacitación equipo PEYU 2h/mes',
    ],
    no_incluye: [],
    recomendado: false,
  },
];

// Formateador CLP único
export const fmtCLP = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);