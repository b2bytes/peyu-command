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