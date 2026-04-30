/**
 * Roadmap oficial PEYU — Mapa de las soluciones digitales del ecosistema B2B.
 * Cada item tiene un status:
 *   - done       → Desplegado y operativo
 *   - optimizing → Desplegado, en optimización / mejora continua
 *   - building   → En desarrollo activo
 *   - testing    → En pruebas / beta
 *   - planned    → Planificado, no iniciado
 *
 * Editar este archivo es la fuente única de verdad del roadmap.
 */

export const STATUS_META = {
  done:       { label: 'Desplegado',     color: 'emerald', emoji: '✅' },
  optimizing: { label: 'Optimizando',    color: 'teal',    emoji: '🔧' },
  testing:    { label: 'En pruebas',     color: 'sky',     emoji: '🧪' },
  building:   { label: 'En desarrollo',  color: 'amber',   emoji: '🚧' },
  planned:    { label: 'Planificado',    color: 'slate',   emoji: '📋' },
};

export const ROADMAP = [
  {
    id: 'b2b-sales',
    title: 'Ventas B2B & CRM',
    desc: 'Gestión completa del pipeline corporativo, leads, propuestas y clientes.',
    items: [
      { name: 'Captura de Leads B2B (formulario + brief + logo)',         status: 'done',       page: '/b2b/contacto' },
      { name: 'Pipeline B2B Leads (admin)',                               status: 'done',       page: '/admin/propuestas' },
      { name: 'Embudo de Conversión',                                     status: 'done',       page: '/admin/embudo' },
      { name: 'Cliente 360 (perfil unificado, historial, NPS)',           status: 'done',       page: '/admin/cliente-360' },
      { name: 'Catálogo Corporativo público con simulador volumen',       status: 'done',       page: '/b2b/catalogo' },
      { name: 'Self-service B2B (cotización inmediata)',                  status: 'done',       page: '/b2b/self-service' },
      { name: 'Panel Mi Cuenta B2B (acceso por email)',                   status: 'done',       page: '/b2b/mi-cuenta' },
      { name: 'CPQ Calculator (cotizador interno)',                       status: 'done',       page: '/admin/cpq' },
      { name: 'Generación automática de propuesta con IA',                status: 'done',       fn: 'createCorporateProposal' },
      { name: 'Pipeline auto-orquestado (score → mockup → propuesta)',    status: 'done',       fn: 'onNewB2BLead' },
      { name: 'Lead scoring con IA (0-100)',                              status: 'done',       fn: 'scoreLead' },
      { name: 'Generación PDF de propuesta',                              status: 'done',       fn: 'generateProposalPDF' },
      { name: 'Email automático de propuesta',                            status: 'done',       fn: 'sendProposalEmail' },
      { name: 'Notificación cambios de estado de propuesta',              status: 'done',       fn: 'notifyProposalStatusChange' },
      { name: 'Trigger onProposalAccepted → orden producción',            status: 'done',       fn: 'onProposalAccepted' },
      { name: 'Recordatorio propuestas próximas a expirar',               status: 'done',       fn: 'checkExpiringProposals' },
      { name: 'Reporte semanal automático B2B',                           status: 'done',       fn: 'reporteSemanalB2B' },
      { name: 'CRON re-engagement clientes inactivos (>180d)',            status: 'done',       fn: 'recordatorioRecompraCRON' },
      { name: 'Análisis IA de reseñas + alerta clientes en riesgo',       status: 'done',       fn: 'analizarResenaIA' },
      { name: 'Auto-sync Cliente 360 desde PedidoWeb',                    status: 'done',       fn: 'syncClienteFromPedido' },
      { name: 'Detección semanal de upsell B2B con tareas auto',          status: 'done',       fn: 'detectarUpsellB2B' },
      { name: 'Nurturing automático leads B2B tibios (score 30-59)',      status: 'done',       fn: 'nurtureLeadB2B' },
      { name: 'Auto-sync propuestas aceptadas a Pinecone (memoria IA)',   status: 'done',       fn: 'pineconeSyncProposal' },
      { name: 'Alerta diaria de stock bajo + sugerencia de reorden',      status: 'done',       fn: 'alertaStockBajoCRON' },
      { name: 'Triage IA de consultas entrantes + alerta lead caliente',  status: 'done',       fn: 'triageConsultaIA' },
      { name: 'Solicitud automática de reseña 7d post-entrega',           status: 'done',       fn: 'solicitarResenaCRON' },
      { name: 'Cross-sell post-compra B2C con cupón 48h',                 status: 'done',       fn: 'crossSellPostCompra' },
      { name: 'Auditoría diaria salud catálogo (score 0-100)',            status: 'done',       fn: 'auditoriaCatalogoCRON' },
      { name: 'Insights ejecutivos semanales con IA (lunes 07:00)',       status: 'done',       fn: 'insightsSemanalesIA' },
      { name: 'Recordatorio anticipo B2B + alerta morosidad >7d',         status: 'done',       fn: 'recordatorioAnticipoB2B' },
      { name: 'Recuperación IA de propuestas rechazadas (contraoferta)',  status: 'done',       fn: 'recuperarPropuestaRechazada' },
      { name: 'Predicción semanal de demanda + plan producción IA',       status: 'done',       fn: 'prediccionDemandaCRON' },
      { name: 'NPS trimestral automático a clientes B2B activos',         status: 'done',       fn: 'npsTrimestralB2B' },
    ],
  },
  {
    id: 'b2c-shop',
    title: 'Tienda B2C & E-commerce',
    desc: 'Experiencia de compra B2C completa, desde landing hasta checkout y seguimiento.',
    items: [
      { name: 'Landing page con asistente IA conversacional',             status: 'done',       page: '/' },
      { name: 'Catálogo Shop con filtros',                                status: 'done',       page: '/shop' },
      { name: 'Detalle de producto (con personalización + IA mockup)',    status: 'done',       page: '/producto/:id' },
      { name: 'Carrito persistente (localStorage)',                       status: 'done',       page: '/cart' },
      { name: 'Catálogo Visual alternativo',                              status: 'done',       page: '/catalogo-visual' },
      { name: 'Página Nosotros con storytelling',                         status: 'done',       page: '/nosotros' },
      { name: 'Soporte público + FAQ',                                    status: 'done',       page: '/soporte' },
      { name: 'Seguimiento de pedidos público',                           status: 'done',       page: '/seguimiento' },
      { name: 'Trigger onNewPedidoWeb (notificación + email)',            status: 'done',       fn: 'onNewPedidoWeb' },
      { name: 'Trigger cambios de estado de pedido',                      status: 'done',       fn: 'onPedidoWebStatusChange' },
      { name: 'Actualización de estado de envío',                         status: 'done',       fn: 'updateShippingStatus' },
      { name: 'Carrito abandonado (captura + recordatorio email)',        status: 'done',       fn: 'capturarCarritoAbandonado' },
      { name: 'CRON carritos abandonados',                                status: 'done',       fn: 'carritoAbandonadoCRON' },
      { name: 'Checkout con pasarela de pago (Stripe / Flow / WebPay)',   status: 'planned' },
    ],
  },
  {
    id: 'gift-cards',
    title: 'Gift Cards (B2C + B2B)',
    desc: 'Sistema completo de tarjetas de regalo: emisión, canje y aplicación en checkout.',
    items: [
      { name: 'Página de compra de Gift Cards (B2C + B2B)',               status: 'done',       page: '/regalar-giftcard' },
      { name: 'Página de canje de Gift Card',                             status: 'done',       page: '/canjear' },
      { name: 'Aplicación de saldo en checkout',                          status: 'done' },
      { name: 'Emisión + email a destinatario',                           status: 'done',       fn: 'enviarGiftCard' },
      { name: 'Validación + canje de saldo',                              status: 'done',       fn: 'canjearGiftCard' },
      { name: 'Diseño visual de tarjeta (4 tiers según monto)',           status: 'done' },
    ],
  },
  {
    id: 'personalizacion',
    title: 'Personalización & Mockups',
    desc: 'Generación de mockups con IA, gestión de jobs de grabado láser y producción.',
    items: [
      { name: 'Flujo de personalización B2C en tienda',                   status: 'done',       page: '/personalizar' },
      { name: 'Generación de mockup con IA',                              status: 'done',       fn: 'generateMockup' },
      { name: 'Tracking de PersonalizationJob en admin',                  status: 'done' },
      { name: 'Mockup automático al subir logo en lead B2B',              status: 'done',       fn: 'onNewB2BLead' },
    ],
  },
  {
    id: 'producto-admin',
    title: 'Administración de Catálogo',
    desc: 'Gestión completa del catálogo de productos con asistencia IA.',
    items: [
      { name: 'CRUD de productos (Catálogo SKUs)',                        status: 'done',       page: '/admin/catalogo' },
      { name: 'Mejora de productos con IA (descripciones + imágenes)',    status: 'done',       page: '/admin/admin-products' },
      { name: 'Mapeo masivo de imágenes',                                 status: 'done',       fn: 'mapAllProductImages' },
      { name: 'Update de imágenes individuales',                          status: 'done',       fn: 'updateProductImages' },
      { name: 'Detección de productos sin imagen',                        status: 'done',       fn: 'getProductsWithoutImages' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & Crecimiento',
    desc: 'Hub de marketing con generación de contenido, campañas Ads e indexación SEO.',
    items: [
      { name: 'Dashboard Marketing',                                      status: 'done',       page: '/admin/marketing' },
      { name: 'Marketing Hub IA (calendario + posts + canales)',          status: 'done',       page: '/admin/marketing-hub' },
      { name: 'Generación de contenido con IA',                           status: 'done',       fn: 'generateSocialContent' },
      { name: 'Generación de blog posts con IA',                          status: 'done',       fn: 'generateBlogPost' },
      { name: 'Auto-indexación al publicar blog',                         status: 'done',       fn: 'autoIndexOnPublish' },
      { name: 'Blog público con SEO',                                     status: 'done',       page: '/blog' },
      { name: 'Backlinks tracker',                                        status: 'done',       page: '/admin/backlinks' },
      { name: 'Analítica',                                                status: 'done',       page: '/admin/analitica' },
    ],
  },
  {
    id: 'ads',
    title: 'Ads Command Center',
    desc: 'Sistema militar de generación, análisis y exportación de campañas Google Ads con IA.',
    items: [
      { name: 'Ads Command Center',                                       status: 'done',       page: '/admin/ads-command' },
      { name: 'Generación de campañas con IA (commander + scientist)',    status: 'done',       fn: 'adsGenerateCampaign' },
      { name: 'Análisis de performance con IA',                           status: 'done',       fn: 'adsAnalyzePerformance' },
      { name: 'Exportación CSV para Google Ads Editor',                   status: 'done',       fn: 'adsExportEditor' },
      { name: 'GA4 Realtime dashboard',                                   status: 'done',       page: '/admin/ga-realtime' },
      { name: 'Integración GA4 (fetch realtime)',                         status: 'done',       fn: 'gaFetchRealtime' },
    ],
  },
  {
    id: 'seo',
    title: 'SEO War Room & Indexación',
    desc: 'Pre-launch blitz: indexación, sitemap, auditoría GSC y blast IndexNow.',
    items: [
      { name: 'War Room Indexación',                                      status: 'done',       page: '/admin/indexacion' },
      { name: 'Launch Map',                                               status: 'done',       page: '/admin/launch-map' },
      { name: 'Auditoría Search Console',                                 status: 'done',       fn: 'gscAuditSite' },
      { name: 'Inspección de URL (GSC)',                                  status: 'done',       fn: 'gscInspectUrl' },
      { name: 'Submit sitemap a GSC',                                     status: 'done',       fn: 'gscSubmitSitemap' },
      { name: 'IndexNow ping',                                            status: 'done',       fn: 'indexNowPing' },
      { name: 'IndexNow blast masivo',                                    status: 'done',       fn: 'autoIndexNowBlast' },
      { name: 'Generación de sitemap XML',                                status: 'done',       fn: 'generateSitemap' },
      { name: 'Servicio dinámico de sitemap',                             status: 'done',       fn: 'serveSitemap' },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones & Cadena de Suministro',
    desc: 'Producción, inventario, proveedores 360 y trazabilidad.',
    items: [
      { name: 'Dashboard Operaciones',                                    status: 'done',       page: '/admin/operaciones' },
      { name: 'Procesamiento de pedidos (kanban)',                        status: 'done',       page: '/admin/procesar-pedidos' },
      { name: 'Auto-agenda Calendar al iniciar producción',               status: 'done',       fn: 'agendarProduccionCalendar' },
      { name: 'Inventario',                                               status: 'done',       page: '/admin/inventario' },
      { name: 'Trazabilidad',                                             status: 'done',       page: '/admin/trazabilidad' },
      { name: 'Proveedores 360 (scorecard, riesgo, ESG)',                 status: 'optimizing', page: '/admin/proveedores' },
      { name: 'Compras',                                                  status: 'done',       page: '/admin/compras' },
      { name: 'ESG / Sostenibilidad',                                     status: 'done',       page: '/admin/esg' },
    ],
  },
  {
    id: 'finanzas',
    title: 'Finanzas & Estrategia',
    desc: 'Flujo de caja, financiero, cotizaciones y OKRs.',
    items: [
      { name: 'Dashboard Financiero',                                     status: 'done',       page: '/admin/financiero' },
      { name: 'Flujo de Caja',                                            status: 'done',       page: '/admin/flujo-caja' },
      { name: 'Cotizaciones',                                             status: 'done',       page: '/admin/cotizaciones' },
      { name: 'OKRs & Metas',                                             status: 'done',       page: '/admin/okrs' },
      { name: 'Plan de Acción',                                           status: 'done',       page: '/admin/plan' },
      { name: 'Calendario / Agenda Comercial',                            status: 'done',       page: '/admin/calendario' },
      { name: 'Reportes & Análisis',                                      status: 'done',       page: '/admin/reportes' },
      { name: 'Centro de Alertas',                                        status: 'done',       page: '/admin/alertas' },
      { name: 'Equipo / RRHH',                                            status: 'done',       page: '/admin/equipo' },
    ],
  },
  {
    id: 'integraciones',
    title: 'Integraciones Externas',
    desc: 'Google Workspace, WooCommerce, Pinecone Brain.',
    items: [
      { name: 'Google Workspace (panel)',                                 status: 'done',       page: '/admin/google' },
      { name: 'Google Calendar (eventos)',                                status: 'done',       fn: 'createCalendarEvent' },
      { name: 'Google Drive (carpetas + archivos)',                       status: 'done',       fn: 'driveEnsureFolder' },
      { name: 'Google Docs (templates → docs)',                           status: 'done',       fn: 'docsCreateFromTemplate' },
      { name: 'Gmail (envío + ingestión inquiries)',                      status: 'done',       fn: 'sendGmailEmail' },
      { name: 'Health check Google',                                      status: 'done',       fn: 'googleHealthCheck' },
      { name: 'WooCommerce Import (staging)',                             status: 'testing',    page: '/admin/woocommerce' },
      { name: 'Promoción de items desde staging',                         status: 'testing',    fn: 'wooPromoteStaging' },
      { name: 'Pinecone Brain (RAG)',                                     status: 'optimizing', page: '/admin/brain' },
      { name: 'Sync productos / clientes a Pinecone',                     status: 'done',       fn: 'pineconeSyncProducto' },
      { name: 'Búsqueda semántica',                                       status: 'done',       fn: 'pineconeSearch' },
    ],
  },
  {
    id: 'ia-agents',
    title: 'IA Agents & Asistentes',
    desc: 'Agentes IA conversacionales y autónomos especializados por dominio.',
    items: [
      { name: 'Asistente público en landing (chat IA)',                   status: 'done',       fn: 'publicChatProxy' },
      { name: 'PEYU Brain (Q&A con base de conocimiento)',                status: 'done',       fn: 'askPeyuBrain' },
      { name: 'Asistente comercial (peyuAssist)',                         status: 'done',       fn: 'peyuAssist' },
      { name: 'Resumen automático de conversaciones',                     status: 'done',       fn: 'summarizeAndSaveConversation' },
      { name: 'Asistente IA admin',                                       status: 'done',       page: '/admin/ia' },
      { name: 'Agente Marketing Orchestrator',                            status: 'done' },
      { name: 'Agentes Ads (commander + scientist + strategist)',         status: 'done' },
      { name: 'Agente Content Creator + Calendario',                      status: 'done' },
      { name: 'Agente B2B Triage WhatsApp',                               status: 'building' },
    ],
  },
  {
    id: 'plataforma',
    title: 'Plataforma & Salud',
    desc: 'Health checks, smoke tests, seguridad, configuración y observabilidad.',
    items: [
      { name: 'Health check global',                                      status: 'done',       fn: 'healthCheck' },
      { name: 'Smoke test pre-launch',                                    status: 'done',       fn: 'launchSmokeTest' },
      { name: 'Daily Briefing automático al equipo (CRON 08:00)',         status: 'done',       fn: 'dailyBriefingCRON' },
      { name: 'UX smoke test',                                            status: 'done',       fn: 'uxSmokeTest' },
      { name: 'Logging de errores cliente',                               status: 'done',       fn: 'logClientError' },
      { name: 'Estado & Roadmap (esta página)',                           status: 'done',       page: '/admin/estado-actual' },
      { name: 'Configuración',                                            status: 'done',       page: '/admin/configuracion' },
      { name: 'Importación de clientes',                                  status: 'done',       page: '/admin/importar-clientes' },
      { name: 'Tiendas físicas',                                          status: 'done',       page: '/admin/tiendas' },
      { name: 'PWA + Cookie banner + Error boundary',                     status: 'done' },
    ],
  },
];

export function getRoadmapStats() {
  let total = 0;
  const counts = { done: 0, optimizing: 0, testing: 0, building: 0, planned: 0 };
  ROADMAP.forEach(mod => {
    mod.items.forEach(it => {
      total++;
      counts[it.status] = (counts[it.status] || 0) + 1;
    });
  });
  return { total, ...counts };
}

export function getModuleProgress(mod) {
  const total = mod.items.length;
  const done = mod.items.filter(i => i.status === 'done' || i.status === 'optimizing').length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}