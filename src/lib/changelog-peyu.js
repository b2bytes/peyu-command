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