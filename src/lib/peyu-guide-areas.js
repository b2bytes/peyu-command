// Rutas guiadas del acompañante Peyu: en vez de 80 pantallas, 4 caminos claros.
// Cada área tiene 3 destinos máximo — el orden es el orden en que conviene entrar.
export const GUIDE_AREAS = [
  {
    id: 'conversion',
    label: 'Vender',
    emoji: '💬',
    desc: 'Conversaciones, pedidos y propuestas que pueden cerrarse hoy.',
    links: [
      { to: '/admin/whatsapp', label: 'WhatsApp de clientes' },
      { to: '/admin/pipeline-b2c', label: 'Pedidos B2C en curso' },
      { to: '/admin/propuestas', label: 'Propuestas de empresas' },
    ],
  },
  {
    id: 'produccion',
    label: 'Producir y despachar',
    emoji: '📦',
    desc: 'Lo que hay que fabricar, empaquetar y enviar.',
    links: [
      { to: '/admin/procesar-pedidos', label: 'Procesar pedidos' },
      { to: '/admin/despacho', label: 'Despacho rápido' },
      { to: '/admin/inventario', label: 'Stock e inventario' },
    ],
  },
  {
    id: 'administracion',
    label: 'Administrar',
    emoji: '📊',
    desc: 'Plata, clientes y catálogo.',
    links: [
      { to: '/admin/financiero', label: 'Finanzas del mes' },
      { to: '/admin/cliente-360', label: 'Clientes 360°' },
      { to: '/admin/catalogo', label: 'Catálogo y precios' },
    ],
  },
  {
    id: 'crecer',
    label: 'Crecer',
    emoji: '🚀',
    desc: 'Campañas, contenido y posicionamiento.',
    links: [
      { to: '/admin/social-studio', label: 'Social Studio' },
      { to: '/admin/marketing-hub', label: 'Marketing Hub' },
      { to: '/admin/seo-keywords', label: 'SEO y palabras clave' },
    ],
  },
];