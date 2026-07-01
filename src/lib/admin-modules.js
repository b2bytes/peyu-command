// ════════════════════════════════════════════════════════════════════════
// REGISTRO CENTRAL DE MÓDULOS ADMIN — fuente única de verdad para el
// buscador rápido (Ctrl+K), el OpsCenter del Agente y cualquier listado
// de accesos. Cada módulo tiene keywords para búsqueda en español.
// ════════════════════════════════════════════════════════════════════════

export const ADMIN_MODULES = [
  // ── Operación diaria ──
  { ruta: '/admin', nombre: 'Dashboard', grupo: 'Operación', emoji: '📊', kw: 'inicio resumen dia ventas hoy' },
  { ruta: '/admin/procesar-pedidos', nombre: 'Procesar Pedidos', grupo: 'Operación', emoji: '📦', kw: 'pedidos pagos confirmar estados transferencia' },
  { ruta: '/admin/despacho', nombre: 'Despacho Rápido', grupo: 'Operación', emoji: '🏷️', kw: 'etiqueta bluex imprimir ot envio' },
  { ruta: '/admin/bluex', nombre: 'Centro Logístico', grupo: 'Operación', emoji: '🚚', kw: 'envios tracking courier seguimiento incidencias' },
  { ruta: '/admin/operaciones', nombre: 'Producción', grupo: 'Operación', emoji: '🔧', kw: 'laser grabado personalizacion ordenes trabajos' },
  { ruta: '/admin/soporte', nombre: 'Soporte', grupo: 'Operación', emoji: '💬', kw: 'consultas clientes mensajes gmail triage' },
  { ruta: '/admin/agente', nombre: 'Agent OS', grupo: 'Operación', emoji: '🤖', kw: 'chat ia asistente comandos operar' },

  // ── Ventas ──
  { ruta: '/admin/pipeline', nombre: 'Pipeline B2B', grupo: 'Ventas', emoji: '🎯', kw: 'leads empresas kanban prospectos' },
  { ruta: '/admin/pipeline-b2c', nombre: 'Pipeline B2C', grupo: 'Ventas', emoji: '🛒', kw: 'carritos abandonados embudo conversion' },
  { ruta: '/admin/cotizaciones', nombre: 'Cotizaciones', grupo: 'Ventas', emoji: '🧾', kw: 'cotizar pdf precios volumen' },
  { ruta: '/admin/propuestas', nombre: 'Propuestas', grupo: 'Ventas', emoji: '📄', kw: 'corporativas formales anticipo recordatorios' },
  { ruta: '/admin/cpq', nombre: 'Calculadora CPQ', grupo: 'Ventas', emoji: '🧮', kw: 'calcular precio tramos descuento' },
  { ruta: '/admin/clientes', nombre: 'Clientes', grupo: 'Ventas', emoji: '👥', kw: 'base compradores historial' },
  { ruta: '/admin/cliente-360', nombre: 'Cliente 360°', grupo: 'Ventas', emoji: '🔍', kw: 'ficha completa historial persona' },
  { ruta: '/admin/chat-leads', nombre: 'Chat Leads', grupo: 'Ventas', emoji: '💬', kw: 'conversaciones web capturados' },

  // ── Catálogo ──
  { ruta: '/admin/catalogo', nombre: 'Catálogo', grupo: 'Catálogo', emoji: '🛍️', kw: 'productos precios stock sku colores' },
  { ruta: '/admin/admin-products', nombre: 'Admin Products', grupo: 'Catálogo', emoji: '🧰', kw: 'imagenes ia duplicados merchant avanzado' },
  { ruta: '/admin/imagenes', nombre: 'Galería Maestra', grupo: 'Catálogo', emoji: '🖼️', kw: 'fotos imagenes por color' },
  { ruta: '/admin/inventario', nombre: 'Inventario', grupo: 'Catálogo', emoji: '📋', kw: 'stock quiebre alertas reponer' },
  { ruta: '/admin/disenos', nombre: 'Diseños PEYU', grupo: 'Catálogo', emoji: '🎨', kw: 'disenos grabado laser galeria personalizador rana subir diseño' },

  // ── Marketing ──
  { ruta: '/admin/marketing-hub', nombre: 'Marketing Hub', grupo: 'Marketing', emoji: '📣', kw: 'redes calendario contenido' },
  { ruta: '/admin/social-studio', nombre: 'Social Studio', grupo: 'Marketing', emoji: '📱', kw: 'instagram linkedin posts publicar' },
  { ruta: '/admin/ads-command', nombre: 'Ads Command', grupo: 'Marketing', emoji: '🎯', kw: 'google ads campañas publicidad' },
  { ruta: '/admin/seo-keywords', nombre: 'SEO Keywords', grupo: 'Marketing', emoji: '🔎', kw: 'posicionamiento google search palabras' },

  // ── Control ──
  { ruta: '/admin/financiero', nombre: 'Financiero', grupo: 'Control', emoji: '💰', kw: 'caja ingresos egresos dinero' },
  { ruta: '/admin/centro-costos', nombre: 'Centro de Costos', grupo: 'Control', emoji: '🧮', kw: 'costo real margen precio sugerido' },
  { ruta: '/admin/analitica', nombre: 'Analítica', grupo: 'Control', emoji: '📈', kw: 'metricas ga4 embudo trafico' },
  { ruta: '/admin/reportes', nombre: 'Reportes', grupo: 'Control', emoji: '📑', kw: 'semana resumen exportar' },
  { ruta: '/admin/tarifas-envio', nombre: 'Tarifas Envío', grupo: 'Control', emoji: '🗺️', kw: 'bluex comunas tarifario cobertura' },
  { ruta: '/admin/correos', nombre: 'Correos al cliente', grupo: 'Control', emoji: '📧', kw: 'emails correos plantillas diseño confirmacion comprobante tracking giftcard carrito' },

  // ── Ayuda ──
  { ruta: '/admin/guia-fundadores', nombre: 'Guía Fundadores', grupo: 'Ayuda', emoji: '📖', kw: 'como hacer pasos tutorial aprender' },
  { ruta: '/admin/induccion', nombre: 'Inducción', grupo: 'Ayuda', emoji: '🎓', kw: 'onboarding flujos completa sistema' },
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function searchModules(query) {
  const q = norm(query).trim();
  if (!q) return ADMIN_MODULES;
  return ADMIN_MODULES.filter((m) =>
    norm(m.nombre).includes(q) || norm(m.kw).includes(q) || norm(m.grupo).includes(q)
  );
}