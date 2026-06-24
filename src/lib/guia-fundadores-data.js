// ════════════════════════════════════════════════════════════════════════
// GUÍA FUNDADORES — Guía paso a paso para entender y operar el sistema PEYU.
// Centrada en el AGENT OS (la página del agente): qué es, cómo pedirle cosas,
// comandos exactos que entiende, + cómo sacar/imprimir etiquetas y operar el
// resto del sistema. La página /admin/guia-fundadores renderiza esto con
// FlujoInteractivo. Editar el contenido aquí, no en la página.
// ════════════════════════════════════════════════════════════════════════

export const GUIAS = [
  {
    id: 'gf-superagent-meta',
    emoji: '⚡',
    titulo: 'Dar facultades al Superagente de Base44 (WhatsApp)',
    intro: 'El Superagente de WhatsApp (Joaconilot) responde "tool is not available" cuando le pides campañas de Meta o acciones del negocio. Eso pasa porque NO tiene registradas las funciones de la app como herramientas. Aquí está la lista exacta para agregárselas en su panel de Base44 y dejarlo con poder total sobre peyuchile.cl.',
    pasos: [
      { titulo: 'Por qué falla ("tool is not available")', detalle: 'El Superagente de WhatsApp es el agente NATIVO de la plataforma Base44 — distinto del panel "Centro de Control · Meta Ads" dentro de la app. Sus herramientas se configuran en el panel del Superagente en Base44 (no en el código de la web). Mientras una función no esté en su lista de herramientas permitidas, dirá "tool is not available", aunque a veces parezca funcionar.' },
      { titulo: 'Dónde configurarlo', detalle: 'Entra al panel de Base44 → Superagente (Joaconilot) → su configuración de herramientas / funciones. Ahí agregas cada función backend de la app que quieras que pueda invocar. Pégale los nombres EXACTOS de las listas de abajo. Una vez guardadas, dejarán de fallar de forma permanente.' },
      { titulo: 'META ADS — leer y diagnosticar', detalle: 'metaAdsManage (listar/pausar/activar campañas, presupuesto, diagnóstico) · metaAdsPerformance (rendimiento real: spend, CTR, ROAS, CPA) · metaAccountIntelligence (informe ejecutivo de la cuenta) · metaAdsDeepDive (análisis por adset/ad) · metaAdsReadAds (leer el contenido de un anuncio) · metaAdsLibraryImages (traer las fotos de la cuenta) · metaSetupAudit (auditar pixel/página/IG) · metaConversionTracking (Purchase y Lead).' },
      { titulo: 'META ADS — crear y editar', detalle: 'metaAdsCreateCampaign (campaña de 1 anuncio) · metaAdsCreateMultiAd (varios anuncios) · metaAdsCreateCarousel (carrusel) · metaAdsCreateWhatsAppAd (Click-to-WhatsApp) · metaAdsUpdateAdCreative (editar texto/CTA/link de un anuncio existente) · metaAdsCreateAdset · metaAdsCreateAd · metaAdsEditAdset · metaAdsBulkRule (reglas masivas) · metaAudiences (públicos) · metaConversionsAPI (eventos server-side).' },
      { titulo: 'META ADS — apoyo del agente', detalle: 'metaAgentMemory (memoria persistente del agente) · metaAgentCatalogLinks (catálogo con URLs reales para CTA) · metaAgentMarketIntel (inteligencia de mercado en vivo) · agentGenerateMedia (generar creativo imagen/video).' },
      { titulo: 'NEGOCIO — leer (siempre funciona)', detalle: 'peyuBrainOps (métricas y listas en vivo: ventas, pedidos, leads, stock) · agentOSBuscar (buscar cualquier registro por nombre/email/RUT/N°) · catalogManager (consultar catálogo). El Superagente SÍ puede leer entidades y llamar estas funciones. La LECTURA nunca falla.' },
      { titulo: 'NEGOCIO — escribir SOLO vía agentOSAction', detalle: 'El Superagente NO puede escribir directo en las entidades de Peyu (su update/create no acepta el app_id cruzado). Toda escritura (cambiar estados, marcar pagos, ajustar stock, enviar correos, generar etiquetas) DEBE pasar por UNA sola función: agentOSAction. Agrégala como herramienta y pásale la firma exacta de la tarjeta siguiente.' },
      { titulo: 'Firma exacta de agentOSAction', detalle: 'Se invoca con { action, payload }. Acciones válidas y su payload:\n• updatePedidoEstado {id, estado}\n• marcarPedidoPagado {id}\n• generarEtiqueta {id}\n• generarEtiquetasMasivo {ids?: []}\n• cancelarPedido {id, motivo}\n• marcarConsultaRespondida {id}\n• responderConsulta {id, email, asunto, cuerpo}\n• updateLeadEstado {id, status}\n• eliminarLead {id}\n• autoCotizarLead {id}\n• updatePropuestaEstado {id, status}\n• enviarPropuesta / reenviarPropuesta {proposalId}\n• ajustarStock {id, stock_actual}\n• updateProducto {id, precio_b2c?, stock_actual?, activo?, imagen_url?}\n• enviarEmail {to, asunto, cuerpo}\n• generarImagenProducto / generarVideoProducto {sku, efecto?, formato?, duracion?}\n• sincronizarTracking {}\nDevuelve siempre { ok, message }. Requiere usuario admin. Los ids se obtienen primero con agentOSBuscar o peyuBrainOps.' },
      { titulo: 'Regla para el Superagente', detalle: 'Instrúyele en su prompt: "Para LEER usa peyuBrainOps / agentOSBuscar. Para ESCRIBIR cualquier cambio en Peyu, usa SIEMPRE agentOSAction con { action, payload } según su firma — nunca intentes update_entities ni create_entity_records sobre las entidades de Peyu, te las rechazará. Obtén el id real con agentOSBuscar antes de actuar."' },
      { titulo: 'Comprueba que quedó', detalle: 'Tras guardar las herramientas en el panel, prueba en WhatsApp: "¿qué campañas de Meta tenemos activas?" (debe usar metaAdsManage) y "marca el pedido WEB-1042 como pagado" (debe usar agentOSAction con action=marcarPedidoPagado). Ya no debe aparecer "tool is not available". Si una falla, revisa que el nombre esté idéntico a esta guía.' },
    ],
  },
  {
    id: 'gf-agente-intro',
    emoji: '🤖',
    titulo: 'Entender el Agent OS (la página del agente)',
    intro: 'Qué es, para qué sirve y cómo se usa el cerebro operativo de PEYU. Empieza por aquí.',
    pasos: [
      { titulo: 'Qué es el Agent OS', detalle: 'Es tu asistente que opera el negocio por chat. Conoce los datos REALES (pedidos, leads, stock, clientes) y puede ejecutar acciones reales con tu confirmación. En vez de buscar entre menús, le hablas en español como a un colaborador.', ruta: '/admin/agente' },
      { titulo: 'Cómo se ve la pantalla', detalle: 'Al centro está el chat. A la izquierda, la barra del agente con accesos rápidos y métricas en vivo (ventas del día, pedidos nuevos, leads). Abajo, la barra de comando donde escribes. En el celular, todo se abre desde el menú inferior.', ruta: '/admin/agente' },
      { titulo: 'Escribe tu primera orden', detalle: 'Abre /admin/agente y escribe algo simple como "muéstrame las ventas de hoy" o "¿qué pedidos nuevos hay?". El agente responde con tarjetas visuales: pedidos, leads o métricas, no solo texto.', ruta: '/admin/agente' },
      { titulo: 'Confirma antes de ejecutar', detalle: 'Cuando le pides una ACCIÓN (marcar pagado, generar etiqueta, cambiar estado), el agente te muestra una tarjeta de propuesta y NO actúa hasta que pulsas "Confirmar". Así nunca cambia nada por error.', ruta: '/admin/agente' },
      { titulo: 'Adjunta archivos e imágenes', detalle: 'Puedes subir el comprobante de una transferencia o el logo de un cliente directamente en el chat. El agente lo lee y lo usa en la acción (ej. confirmar un pago, preparar una propuesta).', ruta: '/admin/agente' },
      { titulo: 'Tus conversaciones se guardan', detalle: 'Cada hilo queda registrado con tu correo: puedes retomar una conversación anterior desde la lista de hilos. Útil para no repetir contexto y para que el otro founder vea qué se hizo.', ruta: '/admin/agente' },
    ],
  },
  {
    id: 'gf-agente-comandos',
    emoji: '💬',
    titulo: 'Qué órdenes puedes darle al agente',
    intro: 'Los comandos reales que el Agent OS entiende y ejecuta. Cópialos tal cual o adáptalos.',
    pasos: [
      { titulo: 'Consultar el negocio', detalle: 'Pregúntale sin miedo: "ventas de hoy", "pedidos nuevos sin procesar", "leads B2B calientes", "qué productos tienen poco stock", "resumen de la semana". Responde con datos reales al instante.', ruta: '/admin/agente' },
      { titulo: 'Procesar un pedido B2C', detalle: 'Ejemplos: "marca el pedido WEB-1042 como pagado", "cambia el pedido #1042 a En Producción", "¿qué falta para despachar el pedido de Javiera?". El agente actualiza el estado y dispara los correos al cliente.', ruta: '/admin/agente' },
      { titulo: 'Generar una etiqueta por chat', detalle: 'Escribe "genera la etiqueta del pedido WEB-1042". El agente revisa pago, dirección y cobertura Bluex, y si todo está OK crea la Orden de Transporte y te entrega el PDF para imprimir.', ruta: '/admin/agente' },
      { titulo: 'Gestionar leads y empresas', detalle: 'Ejemplos: "muéstrame los leads nuevos", "mueve el lead de Falabella a Contactado", "genera una propuesta para este lead". El agente abre la tarjeta del lead y ejecuta el cambio.', ruta: '/admin/agente' },
      { titulo: 'Revisar clientes y stock', detalle: '"ficha del cliente juan@correo.cl", "cuánto ha comprado esta empresa", "baja 20 unidades de stock del SKU X". El agente busca el registro real y te muestra la tarjeta editable.', ruta: '/admin/agente' },
      { titulo: 'Regla de oro', detalle: 'Háblale claro y con el dato que identifica (N° de pedido, email, nombre de empresa). Si algo no le queda claro, te lo pregunta antes de actuar. Nunca asume ni ejecuta a ciegas.', ruta: '/admin/agente' },
    ],
  },
  {
    id: 'gf-etiquetas',
    emoji: '🏷️',
    titulo: 'Sacar e imprimir etiquetas de envío (BlueExpress)',
    intro: 'Del pedido pagado a la etiqueta impresa. Puedes hacerlo por el agente o en Despacho Rápido.',
    pasos: [
      { titulo: 'Confirma que el pedido esté pagado', detalle: 'Solo se emiten etiquetas de pedidos pagados. MercadoPago se confirma solo; las transferencias debes marcarlas "Pagado" (en Procesar Pedidos o pidiéndoselo al agente) tras verificar el abono.', ruta: '/admin/procesar-pedidos' },
      { titulo: 'Opción A — pídelo al agente', detalle: 'En /admin/agente escribe "genera la etiqueta del pedido WEB-1042". Es la vía más rápida: el agente hace el checklist y te devuelve el PDF listo para imprimir.', ruta: '/admin/agente' },
      { titulo: 'Opción B — Despacho Rápido', detalle: 'Abre Despacho Rápido y busca por N° de pedido, cliente o tracking. Solo aparecen pedidos pagados pendientes de despacho. Pulsa "Generar etiqueta" sobre el pedido.', ruta: '/admin/despacho' },
      { titulo: 'Deja que el asistente revise todo', detalle: 'El wizard chequea: ① pago confirmado ② dirección y comuna completas ③ cobertura Bluex (346 comunas del tarifario) ④ que NO exista una OT previa (evita doble cobro). Lo que falte aparece en rojo.', ruta: '/admin/despacho' },
      { titulo: 'Corrige sin salir del modal', detalle: 'Si falta dirección o comuna, el formulario inline con autocompletado te deja arreglarla ahí mismo. Cada corrección re-corre el checklist solo, hasta que todo queda en verde.', ruta: '/admin/despacho' },
      { titulo: 'Emite la OT e imprime el PDF', detalle: 'Con todo en verde, el botón final crea la Orden de Transporte real en Bluex y abre la etiqueta PDF: imprímela y pégala en el paquete. El cliente recibe su tracking por correo automáticamente.', ruta: '/admin/despacho' },
      { titulo: 'Sigue el envío después', detalle: 'El Centro Logístico sincroniza el estado de cada envío con Bluex cada pocas horas y avisa si hay atrasos o incidencias. Ahí ves el timeline de cada paquete sin entrar a la web de Bluex.', ruta: '/admin/bluex' },
    ],
  },
  {
    id: 'gf-sistema',
    emoji: '🧭',
    titulo: 'Entender el resto del sistema paso a paso',
    intro: 'Los módulos clave y cuándo usar cada uno. El agente puede llevarte a casi todos por chat.',
    pasos: [
      { titulo: 'Empieza el día en el Dashboard', detalle: 'Ventas del día, pedidos nuevos, leads calientes y alertas en una sola vista. Es tu punto de partida cada mañana. Si quieres el resumen hablado, pídeselo al agente: "resumen de hoy".', ruta: '/admin' },
      { titulo: 'Catálogo — qué se vende', detalle: 'Aquí viven los productos: SKU, precio B2C, los 8 tramos B2B (sin IVA), stock y colores. Es la fuente de verdad de la tienda. Nunca borres un producto con ventas: desactívalo con el switch "Activo".', ruta: '/admin/catalogo' },
      { titulo: 'Procesar Pedidos — el dinero B2C', detalle: 'Confirmas pagos, corriges direcciones y avanzas estados (Nuevo → Confirmado → En Producción → Despachado → Entregado). Los correos al cliente salen solos en cada etapa.', ruta: '/admin/procesar-pedidos' },
      { titulo: 'Pipeline B2B — las empresas', detalle: 'Las empresas cotizan solas en la web y entran como leads con score IA. Mueve cada uno por el kanban: Nuevo → Contactado → Propuesta enviada → Aceptado. El agente también lo hace por chat.', ruta: '/admin/pipeline' },
      { titulo: 'Propuestas — cerrar empresas', detalle: 'Desde un lead generas la Propuesta Corporativa (PDF con mockups y anticipo 50%). Se envía por correo, se trackea si la abren y los recordatorios salen automáticos.', ruta: '/admin/propuestas' },
      { titulo: 'Inventario y Financiero — el control', detalle: 'Inventario alerta los quiebres de stock; Financiero muestra ingresos vs egresos y el costo real por producto. Revísalos al cerrar la semana para decidir qué producir y cuánto pautar.', ruta: '/admin/inventario' },
    ],
  },
];

export const TIPS_FUNDADORES = [
  'El Agent OS (/admin/agente) es tu atajo a casi todo: pregúntale o pídele acciones en español, siempre confirma antes de ejecutar.',
  'Para que el agente actúe sin errores, dale el dato que identifica: N° de pedido (WEB-1042), email del cliente o nombre de la empresa.',
  'Jamás generes 2 etiquetas para el mismo pedido: el asistente lo bloquea, pero el modo manual no.',
  'Nunca borres productos con ventas históricas — desactívalos para conservar la trazabilidad.',
  'Los correos de confirmación, tracking y reseña salen SOLOS — no dupliques correos manuales.',
  'La inducción completa del sistema (todos los flujos) está en /admin/induccion.',
];