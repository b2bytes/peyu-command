// ════════════════════════════════════════════════════════════════════════
// INDUCCIÓN PEYU — Contenido del onboarding del equipo admin.
// Orden lógico: 1) qué es el sistema → 2) mapa de módulos → 3) flujos
// operativos paso a paso (pedido, etiqueta, despacho, producción, B2B).
// La página /admin/induccion renderiza esto. Editar aquí, no en la página.
// ════════════════════════════════════════════════════════════════════════

export const VISION_GENERAL = {
  titulo: '¿Qué es el sistema PEYU?',
  resumen:
    'Una sola plataforma con 3 caras: la TIENDA PÚBLICA (peyuchile.cl, donde compran los clientes B2C y cotizan las empresas B2B), el PANEL ADMIN (donde tú operas: pedidos, etiquetas, producción, clientes) y los AGENTES IA que automatizan correos, seguimiento y análisis. Todo conectado: lo que pasa en la tienda aparece al instante en el admin.',
  pilares: [
    { emoji: '🛍️', titulo: 'Tienda B2C', texto: 'Catálogo, personalización con mockup en vivo, carrito, pago MercadoPago/transferencia y seguimiento.' },
    { emoji: '🏢', titulo: 'Funnel B2B', texto: 'Catálogo empresarial, cotización rápida con logo, propuestas formales con PDF y pipeline de leads.' },
    { emoji: '⚙️', titulo: 'Operación', texto: 'Pedidos, pagos, producción láser, etiquetas BlueExpress, tracking y post-venta automática.' },
    { emoji: '🤖', titulo: 'Agentes IA', texto: 'Agent OS ejecuta acciones por chat, los CRON envían correos solos y la IA audita imágenes, SEO y costos.' },
  ],
};

// ── 2. Mapa de módulos admin (agrupados en orden de importancia diaria) ──
export const MODULOS = [
  {
    grupo: 'Operación diaria (lo que abres cada mañana)',
    color: '#0F8B6C',
    items: [
      { ruta: '/admin', nombre: 'Dashboard', desc: 'Vista general del día: ventas, pedidos nuevos, alertas.' },
      { ruta: '/admin/procesar-pedidos', nombre: 'Procesar Pedidos', desc: 'TODOS los pedidos web: confirmar pagos, corregir direcciones, avanzar estados. Es la fuente de verdad del pedido.' },
      { ruta: '/admin/despacho', nombre: 'Despacho Rápido', desc: 'Generar etiquetas BlueExpress e imprimir PDF. Flujo express con asistente guiado.' },
      { ruta: '/admin/bluex', nombre: 'Centro Logístico', desc: 'Tracking de todos los envíos Bluex: estados, incidencias, KPIs de entrega.' },
      { ruta: '/admin/agente', nombre: 'Agent OS', desc: 'Chat IA que ejecuta la operación: marcar pagado, generar etiqueta, cambiar estados — con confirmación.' },
    ],
  },
  {
    grupo: 'Ventas B2B (empresas)',
    color: '#D96B4D',
    items: [
      { ruta: '/admin/pipeline', nombre: 'Pipeline B2B', desc: 'Kanban de leads de empresas: nuevo → contactado → propuesta → ganado.' },
      { ruta: '/admin/cotizaciones', nombre: 'Cotizaciones', desc: 'Cotizaciones generadas (admin y desde la web) con exportación a PDF.' },
      { ruta: '/admin/propuestas', nombre: 'Propuestas', desc: 'Propuestas corporativas formales: estado, recordatorios automáticos, PDF.' },
      { ruta: '/admin/cpq', nombre: 'Calculadora CPQ', desc: 'Cotizador interno rápido por tramos de volumen.' },
    ],
  },
  {
    grupo: 'Producción y catálogo',
    color: '#7C3AED',
    items: [
      { ruta: '/admin/operaciones', nombre: 'Operaciones', desc: 'Órdenes de producción y trabajos de personalización láser (logo, frase, diseño).' },
      { ruta: '/admin/catalogo', nombre: 'Catálogo', desc: 'Productos, precios B2C y tramos B2B, stock, colores.' },
      { ruta: '/admin/admin-products', nombre: 'Admin Products', desc: 'Gestión avanzada: imágenes, IA, duplicados, Merchant Center.' },
      { ruta: '/admin/inventario', nombre: 'Inventario', desc: 'Stock actual y alertas de quiebre.' },
    ],
  },
  {
    grupo: 'Clientes y post-venta',
    color: '#0E7490',
    items: [
      { ruta: '/admin/clientes', nombre: 'Clientes', desc: 'Base de clientes B2C y B2B con historial.' },
      { ruta: '/admin/cliente-360', nombre: 'Cliente 360°', desc: 'Ficha completa de un cliente: pedidos, propuestas, conversaciones.' },
      { ruta: '/admin/chat-leads', nombre: 'Chat Leads', desc: 'Leads capturados por el chat de la web, con su conversación completa.' },
      { ruta: '/admin/soporte', nombre: 'Soporte', desc: 'Consultas de clientes (web + Gmail) con triage IA.' },
    ],
  },
  {
    grupo: 'Configuración y análisis',
    color: '#B45309',
    items: [
      { ruta: '/admin/tarifas-envio', nombre: 'Tarifas Envío', desc: 'Tarifario oficial BlueExpress (346 comunas). Se actualiza importando el Excel.' },
      { ruta: '/admin/financiero', nombre: 'Financiero', desc: 'Ingresos, flujo de caja y centro de costos.' },
      { ruta: '/admin/analitica', nombre: 'Analítica', desc: 'Métricas de la tienda, GA4 y embudo de conversión.' },
      { ruta: '/resumen-operativo', nombre: 'Resumen Operativo', desc: 'Changelog de todos los avances del sistema, día a día.' },
    ],
  },
];

// ── 3. Flujos paso a paso ────────────────────────────────────────────────
export const FLUJOS = [
  {
    id: 'pedido-b2c',
    emoji: '🛒',
    titulo: 'Flujo maestro: de pedido a entrega (B2C)',
    intro: 'El ciclo de vida completo de un pedido web. Todo lo demás (etiqueta, producción) son sub-pasos de este flujo.',
    pasos: [
      { titulo: 'Entra el pedido', detalle: 'El cliente compra en la web. El pedido aparece en Procesar Pedidos como "Nuevo" con su estado de pago (MercadoPago se confirma solo vía webhook; transferencia queda pendiente).', ruta: '/admin/procesar-pedidos' },
      { titulo: 'Confirma el pago', detalle: 'MercadoPago: automático. Transferencia: verifica el abono en el banco y marca "Pagado" en el pedido (o pídeselo al Agent OS). El cliente recibe su comprobante por correo solo.', ruta: '/admin/procesar-pedidos' },
      { titulo: '¿Lleva personalización? → Producción', detalle: 'Si el pedido trae grabado láser (logo/frase), se genera un trabajo en Operaciones con el arte exacto, posición y mockup aprobado por el cliente. Se graba y se marca Completado.', ruta: '/admin/operaciones' },
      { titulo: 'Genera la etiqueta BlueExpress', detalle: 'En Despacho Rápido, el asistente revisa pago, dirección, comuna y cobertura — y emite la OT con su PDF. (Detalle en el flujo siguiente.)', ruta: '/admin/despacho' },
      { titulo: 'Imprime y despacha', detalle: 'Imprime la etiqueta PDF, pégala al paquete y entrégalo al courier. El pedido pasa a "Despachado" y el cliente recibe su tracking por correo automáticamente.', ruta: '/admin/despacho' },
      { titulo: 'Tracking y entrega', detalle: 'El Centro Logístico sincroniza el tracking Bluex solo (CRON cada 6h). Al entregarse, el cliente recibe el correo de "¿cómo llegó tu PEYU?" con solicitud de reseña.', ruta: '/admin/bluex' },
    ],
  },
  {
    id: 'etiqueta',
    emoji: '🏷️',
    titulo: 'Paso a paso: generar etiqueta BlueExpress',
    intro: 'El asistente guiado hace el checklist por ti y te deja corregir lo que falte AHÍ MISMO, sin salir del modal.',
    pasos: [
      { titulo: 'Abre Despacho Rápido y elige el pedido', detalle: 'Busca por N° de pedido, cliente o tracking. Solo aparecen pedidos pagados pendientes de despacho.', ruta: '/admin/despacho' },
      { titulo: 'Pulsa "Generar etiqueta" → se abre el asistente', detalle: 'El wizard revisa con burbujas: ① pago confirmado ② dirección y comuna completas ③ cobertura Bluex de la comuna (346 comunas del tarifario) ④ que no exista OT previa (evita doble cobro).' },
      { titulo: 'Corrige inline si algo falla', detalle: 'Falta dirección o comuna → formulario en el mismo modal con autocompletado de comunas verificadas. Pago pendiente → botón "Marcar pagado". Cada corrección re-corre el checklist solo.' },
      { titulo: 'Emite la OT', detalle: 'Con todo en verde, el botón final emite la Orden de Transporte real en Bluex (API producción) y guarda el envío con su tracking.' },
      { titulo: 'Imprime el PDF', detalle: 'La etiqueta PDF queda disponible al instante: imprímela y pégala al paquete. Si Bluex está caído, existe el modo manual (ingresar tracking a mano).' },
    ],
  },
  {
    id: 'produccion',
    emoji: '🔧',
    titulo: 'Paso a paso: producir un pedido personalizado',
    intro: 'Todo pedido con grabado láser pasa por aquí antes de despacharse.',
    pasos: [
      { titulo: 'Revisa el trabajo en Operaciones', detalle: 'Cada línea personalizada genera un PersonalizationJob: producto, color, cantidad, tipo de grabado (frase / diseño PEYU / logo del cliente) y el ARTE exacto a grabar.', ruta: '/admin/operaciones' },
      { titulo: 'Descarga el arte y el mockup', detalle: 'El logo del cliente y el mockup que él mismo aprobó están adjuntos al trabajo y al pedido. El mockup indica posición y escala del grabado — es la guía de producción.' },
      { titulo: 'Graba y controla calidad', detalle: 'Graba con láser según el área del producto. Compara contra el mockup aprobado: lo que el cliente vio es lo que debe recibir.' },
      { titulo: 'Marca Completado', detalle: 'Al terminar, marca el trabajo como Completado y el pedido como "Listo para Despacho". Desde ahí sigue el flujo de etiqueta.', ruta: '/admin/procesar-pedidos' },
    ],
  },
  {
    id: 'b2b',
    emoji: '🤝',
    titulo: 'Paso a paso: ciclo B2B (lead → propuesta → venta)',
    intro: 'Las empresas cotizan solas en la web; tú cierras desde el pipeline.',
    pasos: [
      { titulo: 'Entra el lead', detalle: 'Una empresa cotiza en la web (o escribe por chat/WhatsApp). El lead aparece en Pipeline B2B con score IA y el equipo recibe UN correo de alerta.', ruta: '/admin/pipeline' },
      { titulo: 'Revisa la cotización', detalle: 'La cotización llega con productos, cantidades, tramos de precio y el logo del cliente ya cargado. El cliente recibe su PDF al instante.', ruta: '/admin/cotizaciones' },
      { titulo: 'Crea la propuesta formal', detalle: 'Desde el lead genera la Propuesta Corporativa (PDF con mockups, términos, anticipo 50%). Se envía por correo y se trackea si la abren. Los recordatorios salen solos.', ruta: '/admin/propuestas' },
      { titulo: 'Aceptada → producción y despacho', detalle: 'Al aceptarse, se genera la orden de producción y el flujo sigue igual que B2C: producir → etiqueta → despachar.', ruta: '/admin/operaciones' },
    ],
  },
];

// ── 4. Tips finales ──────────────────────────────────────────────────────
export const TIPS = [
  'Ante cualquier duda operativa, pregúntale al Agent OS (/admin/agente): conoce los pedidos, leads y envíos reales, y puede ejecutar acciones con tu confirmación.',
  'Los correos al cliente (confirmación, tracking, reseña, recompra) salen SOLOS. No envíes correos manuales duplicados.',
  'El Resumen Operativo (/resumen-operativo) registra cada avance del sistema día a día — útil para saber qué cambió.',
  'Nunca generes 2 etiquetas para el mismo pedido: el asistente lo bloquea, pero el modo manual no — revisa antes.',
  'Las tarifas Bluex se actualizan importando el Excel en Tarifas Envío. Si una comuna no aparece, no hay cobertura.',
];