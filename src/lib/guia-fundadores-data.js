// ════════════════════════════════════════════════════════════════════════
// GUÍA FUNDADORES — Contenido educativo paso a paso para los founders:
// 1) administrar productos · 2) generar etiquetas · 3) gestionar ventas.
// La página /admin/guia-fundadores renderiza esto con FlujoInteractivo.
// Editar el contenido aquí, no en la página.
// ════════════════════════════════════════════════════════════════════════

export const GUIAS = [
  {
    id: 'gf-productos',
    emoji: '📦',
    titulo: 'Administrar productos del catálogo',
    intro: 'Cómo crear, editar y mantener sano el catálogo: precios, stock, colores e imágenes.',
    pasos: [
      { titulo: 'Abre el Catálogo', detalle: 'En Catálogo ves todos los productos con su SKU, categoría, precio B2C, tramos B2B y stock. Es la fuente de verdad de lo que se vende en la tienda.', ruta: '/admin/catalogo' },
      { titulo: 'Edita precios y stock', detalle: 'Desde la ficha del producto ajusta precio B2C, los 8 tramos B2B (sin IVA) y el stock actual. Los cambios se reflejan al instante en la tienda pública y en las cotizaciones B2B.', ruta: '/admin/catalogo' },
      { titulo: 'Gestiona colores e imágenes por color', detalle: 'Los productos con variantes (ej. carcasas) usan "colores" + "imágenes por color": al elegir un color en la ficha pública se muestra su foto. Revisa que cada color tenga imagen asignada.', ruta: '/admin/imagenes' },
      { titulo: 'Cuida las imágenes con Admin Products', detalle: 'Admin Products es la gestión avanzada: subir/generar imágenes con IA, detectar duplicados, auditar calidad visual y sincronizar con Google Merchant Center.', ruta: '/admin/admin-products' },
      { titulo: 'Activa o desactiva productos', detalle: 'El switch "Activo" controla si el producto aparece en la tienda. Nunca borres un producto con historial de ventas: desactívalo. Así conservas la trazabilidad de pedidos antiguos.', ruta: '/admin/catalogo' },
      { titulo: 'Vigila el stock', detalle: 'Inventario alerta los quiebres (<10u) y un robot envía aviso por correo cuando algo se agota. Ajusta el stock tras cada producción o llegada de material.', ruta: '/admin/inventario' },
    ],
  },
  {
    id: 'gf-etiquetas',
    emoji: '🏷️',
    titulo: 'Generar etiquetas de envío (BlueExpress)',
    intro: 'Del pedido pagado a la etiqueta impresa en 5 pasos, con el asistente haciendo el checklist por ti.',
    pasos: [
      { titulo: 'Verifica que el pedido esté pagado', detalle: 'Solo se emiten etiquetas de pedidos pagados. MercadoPago se confirma solo; transferencias debes marcarlas "Pagado" en Procesar Pedidos tras verificar el abono.', ruta: '/admin/procesar-pedidos' },
      { titulo: 'Abre Despacho Rápido y elige el pedido', detalle: 'Busca por N° de pedido, cliente o tracking. Solo aparecen pedidos pagados pendientes de despacho — si no aparece, revisa su estado de pago.', ruta: '/admin/despacho' },
      { titulo: 'Deja que el asistente revise todo', detalle: 'Al pulsar "Generar etiqueta" el wizard chequea: ① pago confirmado ② dirección y comuna completas ③ cobertura Bluex (346 comunas del tarifario) ④ que no exista una OT previa (evita doble cobro).' },
      { titulo: 'Corrige lo que falte sin salir del modal', detalle: 'Si falta la dirección o comuna, el formulario inline con autocompletado te deja corregirla ahí mismo. Cada corrección re-corre el checklist automáticamente.' },
      { titulo: 'Emite la OT e imprime el PDF', detalle: 'Con todo en verde, el botón final crea la Orden de Transporte real en Bluex y la etiqueta PDF queda lista para imprimir. El cliente recibe su tracking por correo solo, y el Centro Logístico sincroniza el estado cada 6 horas.', ruta: '/admin/bluex' },
    ],
  },
  {
    id: 'gf-ventas',
    emoji: '💰',
    titulo: 'Gestionar ventas (B2C y B2B)',
    intro: 'Cómo controlar el dinero que entra: pedidos web, pipeline de empresas y cierre de la semana.',
    pasos: [
      { titulo: 'Empieza el día en el Dashboard', detalle: 'Ventas del día, pedidos nuevos, leads calientes y alertas en una sola vista. Es tu punto de partida cada mañana.', ruta: '/admin' },
      { titulo: 'Procesa los pedidos B2C', detalle: 'En Procesar Pedidos confirmas pagos, corriges direcciones y avanzas estados (Nuevo → Confirmado → En Producción → Despachado → Entregado). Los correos al cliente salen solos en cada etapa.', ruta: '/admin/procesar-pedidos' },
      { titulo: 'Atiende el pipeline B2B', detalle: 'Las empresas cotizan solas en la web y aparecen como leads con score IA. Mueve cada lead por el kanban: Nuevo → Contactado → Propuesta enviada → Aceptado.', ruta: '/admin/pipeline' },
      { titulo: 'Cierra con propuestas formales', detalle: 'Desde el lead genera la Propuesta Corporativa (PDF con mockups, anticipo 50%). Se envía por correo, se trackea si la abren y los recordatorios salen automáticos.', ruta: '/admin/propuestas' },
      { titulo: 'Usa el Agent OS para operar por chat', detalle: 'Pídele en lenguaje natural: "marca el pedido #1042 como pagado", "genera la etiqueta", "muéstrame los leads calientes". Ejecuta con tu confirmación.', ruta: '/admin/agente' },
      { titulo: 'Controla caja y cierra la semana', detalle: 'Financiero muestra ingresos vs egresos y el costo real por producto. Analítica y Reportes resumen conversión y ventas por canal para decidir la semana siguiente.', ruta: '/admin/financiero' },
    ],
  },
];

export const TIPS_FUNDADORES = [
  'Nunca borres productos con ventas históricas — desactívalos para conservar la trazabilidad.',
  'Jamás generes 2 etiquetas para el mismo pedido: el asistente lo bloquea, pero el modo manual no.',
  'Los correos de confirmación, tracking y reseña salen SOLOS — no dupliques correos manuales.',
  'Ante cualquier duda, el Agent OS (/admin/agente) conoce los datos reales y ejecuta acciones con tu confirmación.',
  'La inducción completa del sistema (todos los flujos) está en /admin/induccion.',
];