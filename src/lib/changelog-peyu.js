// ════════════════════════════════════════════════════════════════════════
// CHANGELOG PEYU — Fuente de verdad del Resumen Operativo.
// Cada avance (bug, mejora, feature) se registra aquí como una entrada.
// La página /resumen-operativo lo renderiza automáticamente agrupado por
// fecha, con KPIs calculados. Para actualizar el resumen: agregar entradas
// al inicio de CHANGELOG (más reciente primero). NO editar la página.
//
// tipo: 'bug' | 'mejora' | 'feature'
// area: módulo/página afectada (texto libre corto)
// ════════════════════════════════════════════════════════════════════════

export const CHANGELOG = [
  // ── 10 junio 2026 · Ficha de producto = cockpit de 1 pantalla ──────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto',
    titulo: 'ProductoNuevo al formato cockpit + envío Bluex y medios de pago en vivo',
    detalle: 'La ficha de producto en escritorio ahora es un cockpit de 1 pantalla (mismo formato /personalizar): header sticky con pasos del funnel y CTA "Agregar" siempre visible, panel izquierdo con info del producto + resumen vivo de la configuración (color, grabado, cantidad, total IVA incluido) + medios de pago, mockup/galería GIGANTE al centro y el configurador a la derecha con scroll propio. Suma un cotizador de envío BlueExpress EN VIVO (tarifario oficial por comuna, peso real × cantidad, comuna persistida para todo el funnel) y badges de medios de compra (Webpay/MercadoPago, transferencia −5%). Borrador persistente y lógica de carrito intactos. Móvil mantiene su flujo vertical con barra inferior.',
  },

  // ── 10 junio 2026 · Cotización B2B = cockpit de 1 pantalla ─────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Cotización Rápida B2B',
    titulo: 'Rediseño completo al formato cockpit de /personalizar — versión B2B',
    detalle: 'La cotización B2B ahora usa el mismo formato del personalizador: header wizard propio con pasos clickeables y CTA siempre visible, panel izquierdo con stepper + resumen vivo (productos, neto, ahorro, logo, empresa) + sellos de confianza, mockup GIGANTE del logo al centro con uploader, y los controles del paso a la derecha con scroll propio. En móvil: barra de progreso arriba y CTA sticky con total c/IVA abajo. Desglose de totales unificado en un componente (Subtotal → descuento volumen → Neto sin IVA → IVA 19% → Total c/IVA) visible en cada paso. Toda la lógica se mantiene intacta: carro único, viaje persistente y envío a quickB2BQuoteV2.',
  },

  // ── 10 junio 2026 · Personalizar: reglas por producto + precio en vivo ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Grabado según producto + detalle de precio en vivo con IVA',
    detalle: 'Solo las carcasas ofrecen los 4 tipos de personalización; el resto de productos (maceteros, escritorio, etc.) ahora muestra solo frase y logo propio — si un viaje guardado traía "Diseño PEYU" en un producto no permitido, se resetea limpio. Además el paso Diseño suma un detalle de precio EN VIVO que calca las reglas reales del carrito: descuento por cantidad (2u→10%, 3+u→15%), grabado gratis ≥10u, desglose Neto + IVA 19% (IVA incluido) y teaser "agrega 1 más y ahorra". Se corrigió la nota engañosa "+IVA" del paso Confirmar: el precio B2C siempre fue IVA incluido, igual que carrito y checkout.',
  },

  // ── 10 junio 2026 · Auditoría completa del funnel público ──────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Funnel completo · Tienda pública',
    titulo: 'Recorrido a prueba de humanos: botones, navegación y continuidad',
    detalle: 'Auditoría de punta a punta del relato de compra: (1) los CTAs "Ver tienda" y "Para empresas" del hero recargaban la página completa — ahora navegan instantáneo sin perder estado; (2) el contador del carrito en la barra superior ahora se actualiza EN VIVO al agregar productos desde cualquier página; (3) el menú móvil tenía botones anidados inválidos que rompían los taps — corregido; (4) nuevo banner de continuidad en Inicio y Tienda: si el cliente dejó una personalización o cotización a medias, se le ofrece retomarla en 1 clic donde quedó.',
  },

  // ── 10 junio 2026 · Carro único: cotización y compra unificadas ─────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Carro único · Compra + Cotización',
    titulo: 'Un solo carro para comprar y cotizar — sin pasos redundantes',
    detalle: 'La cotización B2B ahora lee y sincroniza el MISMO carrito de compra (carrito_v2): al cruzar desde /personalizar el item configurado (color, diseño, cantidad) se agrega al carro y la cotización lo hidrata desde ahí, saltando el paso redundante de elegir productos (entra directo a Datos). Cambios de cantidad, productos agregados o eliminados en la cotización se reflejan en el carro y viceversa. El carrito de compra suma un puente "Cotiza este mismo carrito" para empresas. La selección final llega intacta a ambos destinos.',
  },

  // ── 10 junio 2026 · Comprar o cotizar: un solo viaje, nada se pierde ────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar + Cotización B2B',
    titulo: 'Puente unificado: cantidad real, logo y avance persisten entre comprar y cotizar',
    detalle: 'Al cruzar de /personalizar a Cotización Rápida ya no se pisa la cantidad (antes forzaba 50u aunque el cliente tenía 17): viaja la cantidad real junto con su logo o diseño elegido, que llega pre-cargado al mockup B2B. Además la cotización ahora tiene viaje persistente igual que el personalizador: productos, cantidades, datos de empresa, paso y logo se guardan automáticamente, sobreviven recargas y se limpian solo al enviar la solicitud.',
  },

  // ── 10 junio 2026 · Personalizar: color persiste hasta el final ─────────
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Personalizar',
    titulo: 'El color elegido de la carcasa ya no se pierde en el mockup',
    detalle: 'Al agregar un diseño, el preview cambiaba a la imagen "base limpia" genérica y pisaba el color que el cliente había escogido. Ahora en productos con colores reales (carcasas) la imagen del color elegido es siempre la fuente de verdad del mockup, y ese color viaja intacto hasta el carrito, el pedido y la orden de producción. Además el logo subido se guarda al instante (sobrevive recargas) con indicador "Subiendo tu logo…".',
  },

  // ── 10 junio 2026 · Personalizar: mockup unificado ──────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Mockup unificado: el preview en vivo ES el mockup, sin paso extra de IA',
    detalle: 'Se eliminó el botón "Generar mockup fotorrealista con IA" que abría un segundo flujo de mockup distinto al preview en vivo. Ahora el mockup en vivo (donde el cliente ajusta tamaño y posición) es la única vista: en Confirmar se muestra el mismo preview con botón "Editar diseño" para volver, y el CTA pasa directo a confirmar. Menos pasos, sin duplicación.',
  },

  // ── 10 junio 2026 · Personalizar: textos visibles en todos los pasos ────
  {
    fecha: '2026-06-10',
    tipo: 'fix',
    area: 'Personalizar',
    titulo: 'Contraste total: mockup en vivo, galería y cantidad legibles (desktop + móvil)',
    detalle: 'El preview láser, la galería de diseños PEYU y el selector de cantidad usaban estilos para fondo oscuro (texto blanco) y quedaban invisibles sobre el fondo crema. Ahora tienen tema claro de alto contraste (texto café oscuro, acentos terracota) en /personalizar, manteniendo el tema oscuro donde corresponde (chat /v2). Además la página fuerza modo día mientras está abierta para que el modo noche del visitante no borre los textos.',
  },

  // ── 10 junio 2026 · Personalizar: contraste + viaje persistente ─────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Alto contraste en cada paso + viaje del cliente persistente',
    detalle: 'Selectores de color y de tipo de grabado rediseñados con cards blancas sólidas, texto café oscuro y selección terracota (antes se veían lavados sobre el fondo crema). El botón Continuar deshabilitado ahora se distingue claramente. Y el viaje completo del cliente (paso, producto, color, diseño, texto, cantidad, mockup) se guarda automáticamente en cada decisión: sobrevive recargas y se limpia al agregar al carrito, con indicador "Tu avance se guarda automáticamente".',
  },

  // ── 10 junio 2026 · Personalizar: comprar o cotizar ─────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Flujo completo: comprar al instante o cotizar B2B',
    detalle: 'Puente directo a Cotización Rápida B2B desde /personalizar: aparece al subir la cantidad a 10+ en el paso Diseño, en Confirmar y en la pantalla de éxito, pre-cargando producto y cantidad. La pantalla de éxito ahora también ofrece "Revisar carrito". Además, si falla la subida del logo el botón ya no queda pegado en "Agregando...".',
  },

  // ── 10 junio 2026 · Personalizar = cockpit de 1 pantalla ───────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Escritorio en una sola pantalla, sin scroll',
    detalle: '/personalizar ahora es un cockpit de 3 columnas en desktop: stepper + resumen a la izquierda, preview GIGANTE en vivo al centro (toda la altura, con barra de producto/precio) y los controles del paso a la derecha con scroll propio y CTA siempre visible. La galería de diseños y las opciones ya no empujan el botón fuera de pantalla. Mobile mantiene su flujo vertical.',
  },

  // ── 10 junio 2026 · Agente Central con gestión total ───────────────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agente Central',
    titulo: 'Gestión total del sistema desde /admin/agente-central',
    detalle: 'El Agente Central ahora puede CREAR pedidos manuales, leads B2B, clientes y órdenes de producción, ELIMINAR registros, marcar pagos, generar etiquetas Bluex, cancelar pedidos, reconciliar MercadoPago y sincronizar envíos — todo conversando y con confirmación por botón. El contexto incluye los IDs reales de pedidos, leads y cotizaciones para que las acciones nunca fallen.',
  },

  // ── 10 junio 2026 · Agent OS con capacidades totales ───────────────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agent OS',
    titulo: 'El agente ahora EJECUTA la operación desde el chat',
    detalle: 'El chat entiende intenciones y propone acciones reales con botón de confirmación: avanzar/cancelar pedidos, marcar pagos, generar etiquetas Bluex, responder consultas por Gmail, mover leads y propuestas, ajustar stock/precios, enviar emails libres y sincronizar tracking. Toda mutación requiere confirmación del founder y pasa por el backend con validación admin.',
  },

  // ── 10 junio 2026 · Correcciones reunión Joaquín ───────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Catálogo',
    titulo: 'Categorías reorganizadas (reunión Joaquín)',
    detalle: '"Cachos" pasó a llamarse "Entretención y Juegos". Carcasas ahora navegan por Marca (iPhone, Samsung, Huawei, AirPods) → Modelo. La categoría Corporativo ya no queda vacía: muestra todos los productos aptos para empresas (canal B2B).',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto',
    titulo: 'Mockup central en escritorio + carcasas con fuente única de imagen',
    detalle: 'En desktop el preview de grabado EN VIVO toma el lugar de la galería (columna izquierda sticky) — se interactúa casi sin scroll. En carcasas se ocultó la galería de ángulos extra: la imagen por color del selector es la única fuente de verdad, y los swatches crecieron de tamaño.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto · Móvil',
    titulo: 'Orden móvil: foto → color → personalización',
    detalle: 'La descripción del producto pasó a una pestaña colapsable al final de la ficha, dejando el flujo foto → color → personalización en la misma pantalla con menos scroll.',
  },

  // ── 10 junio 2026 · BlueExpress API PROD desbloqueada ─────────────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'BlueExpress',
    titulo: 'API corporativa de producción conectada y verificada',
    detalle: 'Con las credenciales PROD nuevas (OAuth client_credentials vía sso.blue.cl) la integración quedó autenticada de punta a punta: emisión de OT (cmkin emission), tracking en tiempo real (tracking-pull-corp) y etiqueta PDF. El tracking ya valida OTs reales contra Bluex.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'BlueExpress',
    titulo: 'Códigos de comuna oficiales en la emisión',
    detalle: 'La etiqueta ya no se emite con comuna genérica: el código de distrito Bluex real (ej. PRO = Providencia) se resuelve desde el tarifario oficial de 346 comunas cargado en la base, con fallback a la API BX-Geo. Además: modo dry-run para verificar payload sin emitir OT real.',
  },

  // ── 10 junio 2026 · Agent OS = página maestra de operaciones ──────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agent OS',
    titulo: 'Centro de Operaciones maestro',
    detalle: 'Nueva pestaña "Operaciones" en /admin/agente: gestión completa de pedidos sin salir de la página — marcar pedido no pagado como pagado en 1 clic, generar etiqueta BlueExpress, cambiar estado, abrir etiqueta/tracking, buscador y filtros (por pagar / por despachar / despachados). Incluye accesos a todos los módulos del admin.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Agent OS · IA',
    titulo: 'Modelo IA de última generación',
    detalle: 'El chat del Agent OS ahora responde con Claude Opus 4.8 (el modelo más nuevo y capaz disponible) para razonamiento de negocio de mayor calidad.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Backend',
    titulo: 'Acciones nuevas del agente',
    detalle: 'agentOSAction soporta marcarPedidoPagado (confirma pago + historial) y generarEtiqueta (emite OT Bluex reutilizando el flujo B2C con validación de pago).',
  },

  // ── 9 junio 2026 · Estabilidad tienda B2C ──────────────────────────────
  {
    fecha: '2026-06-09',
    tipo: 'bug',
    area: 'Toda la tienda',
    titulo: 'Scroll con rueda del mouse bloqueado',
    detalle: 'Una regla CSS global (overscroll-behavior: contain) se tragaba la rueda del mouse en toda la página: solo se podía scrollear arrastrando la barra. Eliminada — el scroll funciona desde cualquier punto.',
  },
  {
    fecha: '2026-06-09',
    tipo: 'bug',
    area: 'Checkout móvil',
    titulo: 'Botón de pagar invisible en celular',
    detalle: 'El banner "Instalar PEYU" (PWA) y el aviso de cookies se montaban encima de la barra de compra/pago en mobile. El banner PWA ya no aparece en el flujo de compra y el aviso de cookies quedó sobre la barra, sin taparla.',
  },
  {
    fecha: '2026-06-09',
    tipo: 'bug',
    area: 'ProductoNuevo',
    titulo: '"Producto no encontrado" intermitente',
    detalle: 'El cargador apagaba el loading antes de terminar los reintentos y no reintentaba cuando la consulta por ID venía vacía de forma transitoria. Ahora: 3 intentos resilientes + doble verificación contra la lista completa antes de declarar "no encontrado".',
  },
  {
    fecha: '2026-06-09',
    tipo: 'mejora',
    area: 'TiendaNueva · Cards',
    titulo: 'Robustez de enlaces y skeleton de carga',
    detalle: 'ProductCardV2: prop style duplicado eliminado (enlaces ?id= verificados en TiendaNueva y CatálogoNuevo). TiendaNueva mantiene el skeleton visible mientras reintenta cargar, en vez de mostrar grilla vacía.',
  },

  // ── Sesiones anteriores · Despacho y logística ─────────────────────────
  {
    fecha: '2026-06-05',
    tipo: 'bug',
    area: 'Etiqueta BlueExpress',
    titulo: 'Check de pago con transferencias',
    detalle: 'La generación de etiqueta ahora reconoce transferencias confirmadas como pago válido.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'bug',
    area: 'Checkout',
    titulo: 'Retiro en tienda pedía dirección',
    detalle: 'El checkout ya no exige dirección de envío cuando el cliente elige retiro en tienda.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'bug',
    area: 'Tarifas Bluex',
    titulo: 'Tarifas Atacama sin datos',
    detalle: 'Tramos de peso sin tarifa aplican +15% acumulado sobre el tramo anterior.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'mejora',
    area: 'Envíos',
    titulo: 'Lead time estimado por región',
    detalle: 'RM: 1 día · Sur: 2-3 días · Extremos: 4-5 días. ShippingSelector muestra días hábiles reales por comuna.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'feature',
    area: 'Admin',
    titulo: 'Despacho Rápido',
    detalle: 'Flujo express: selecciona pedido → genera etiqueta Bluex → imprime PDF. Búsqueda por pedido, tracking o cliente.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'feature',
    area: 'Admin',
    titulo: 'Centro Logístico Bluex',
    detalle: 'Dashboard con lista de envíos, KPIs, filtros, sync de tracking (CRON cada 6h), secuencias IA por ciudad y análisis OTIF/excepciones.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'mejora',
    area: 'IA',
    titulo: 'Modelos de mayor capacidad en flujos B2B',
    detalle: 'Triage de leads B2B y generación de propuestas corporativas usan modelos de alta capacidad para mejor calidad.',
  },
];

// Pendientes / próximas mejoras — se van tachando (hecho: true) o eliminando.
export const PENDIENTES = [
  { texto: 'Cargar Excel tarifas Bluex de hoy (todas las comunas de Chile)', tag: 'TODO' },
  { texto: 'Calendarizar actualización de tarifas / definir alcance con Joaquín', tag: 'TODO' },
  { texto: 'Revisar paso a paso flujo generar etiqueta (terminando)', tag: 'TODO' },
  { texto: 'Auditar tarifas Atacama vs factura Bluex', tag: 'TODO' },
  { texto: 'Refrescar imágenes productos (limpiar logos viejos)', tag: 'TODO' },
  { texto: 'Finalizar color-mapping B2B', tag: 'TODO' },
  { texto: 'PedidoDetailDrawer: considerar split en subcomponentes', tag: 'NOTA' },
];

// Estado de sistemas clave mostrado en el panel derecho.
export const ESTADO_SISTEMA = [
  { nombre: 'BlueExpress API PROD (OAuth)', estado: 'Operativo' },
  { nombre: 'Tarifas (346 comunas)', estado: 'Cargadas' },
  { nombre: 'Checkout v2', estado: 'Completo' },
  { nombre: 'Tienda B2C v2', estado: 'Estable' },
  { nombre: 'MercadoPago + webhook', estado: 'Activo' },
  { nombre: 'Emails transaccionales', estado: 'Routed' },
];

/** Agrupa el changelog por fecha (más reciente primero). */
export function changelogPorFecha() {
  const grupos = {};
  for (const e of CHANGELOG) {
    (grupos[e.fecha] = grupos[e.fecha] || []).push(e);
  }
  return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]));
}

/** KPIs calculados automáticamente desde el changelog. */
export function changelogKPIs() {
  return {
    total: CHANGELOG.length,
    bugs: CHANGELOG.filter((e) => e.tipo === 'bug').length,
    mejoras: CHANGELOG.filter((e) => e.tipo === 'mejora').length,
    features: CHANGELOG.filter((e) => e.tipo === 'feature').length,
    pendientes: PENDIENTES.length,
  };
}

export function fmtFecha(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}