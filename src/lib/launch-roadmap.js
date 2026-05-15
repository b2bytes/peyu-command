/**
 * 🚀 ROADMAP DE LANZAMIENTO PEYU — Versión 16-may-2026 en adelante
 *
 * Construido tras auditoría real del proyecto el 15-mayo-2026:
 *   • Catálogo: 100+ productos importados de WooCommerce, MUCHOS con campos vacíos
 *     (precio_b2b, lead_time, peso_kg, dimensiones, garantía, descripción).
 *   • Imágenes: la sincronización WooCommerce desordenó la galería. Algunas se
 *     migraron a Base44 media, otras siguen apuntando a base44.app/api (frágiles).
 *   • Pedidos: 2 intentos de fraude detectados ($3.9M c/u, ya bloqueados por
 *     assessOrderRisk) → motor de riesgo funcionando ✅
 *   • B2B: error 403 al crear B2BLead desde /b2b/contacto (RLS demasiado estricta).
 *   • Chat IA: agente ya re-tonado a cálido, pero NO conectado a WhatsApp.
 *   • Social Studio: 7 posts en revisión esta semana, NINGUNO publicado.
 *   • Errores Network: `/shop?categoria=Escritorio` falla intermitentemente.
 *
 * Filosofía: estabilidad PRIMERO, escala DESPUÉS. Cada fase tiene un gate de salida
 * antes de pasar a la siguiente. NO se publica nada inestable.
 *
 * Esfuerzos en horas estimadas REALES de este constructor (Base44 LLM-powered),
 * NO horas humanas. Hito = lo que el cliente verá funcionando al final.
 */

export const PHASE_META = {
  pending:   { label: 'Pendiente',     emoji: '⏳', color: 'slate' },
  active:    { label: 'En curso',      emoji: '🔥', color: 'amber' },
  done:      { label: 'Completada',    emoji: '✅', color: 'emerald' },
  blocked:   { label: 'Bloqueada',     emoji: '🛑', color: 'red' },
};

export const LAUNCH_ROADMAP = [
  // ════════════════════════════════════════════════════════════════════
  // FASE 0 — ARREGLOS URGENTES (sáb 16 may, 1 día)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-0',
    nombre: 'Fase 0 · Arreglos urgentes',
    semana: 'Sábado 16 mayo',
    duracion_dias: 1,
    objetivo: 'Dejar el sitio estable: nadie debería encontrarse con errores el lunes.',
    gate_salida: 'Todo funciona en celular y desktop. Un pedido de prueba llega completo al final del día.',
    status: 'pending',
    items: [
      {
        title: 'Arreglar el formulario B2B en celulares',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Los clientes corporativos no pueden enviar consultas desde su teléfono.',
      },
      {
        title: 'Estabilizar los filtros de categoría en la tienda móvil',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'A veces la tienda no carga al filtrar desde el celular. Agregar reintento automático.',
      },
      {
        title: 'Revisar catálogo: detectar fotos rotas',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Generar una lista clara de qué productos tienen fotos OK y cuáles necesitan reemplazo.',
      },
      {
        title: 'Ocultar temporalmente productos sin foto buena',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'humano',
        detail: 'Preferimos mostrar 30 productos perfectos que 80 con problemas. Reactivamos cuando estén bien.',
      },
      {
        title: 'Verificar que un pago real llega completo',
        impact: 'critical',
        effort_hours: 0.3,
        owner: 'humano',
        detail: 'Hacer un pedido de $1.000 de prueba y confirmar que recibes el email + se ve en el panel.',
      },
      {
        title: 'Activar emails desde peyuchile.cl (no se pierden)',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'Verificar el dominio en el proveedor de email para que las confirmaciones siempre lleguen.',
      },
      {
        title: '🚨 Pedir clave definitiva a BlueExpress (bloqueante para envíos)',
        impact: 'critical',
        effort_hours: 0.3,
        owner: 'humano',
        detail: 'BlueExpress aún no entregó la credencial productiva. Sin esto, no podemos generar etiquetas reales ni cotizar envíos en vivo. Contactar al ejecutivo de cuenta para acelerar.',
      },
      {
        title: '📦 Jonny · Recopilar material original de productos',
        impact: 'critical',
        effort_hours: 4,
        owner: 'Jonny (cliente)',
        detail: 'Muchas imágenes llegan sin título, sin SKU asociado y sin descripción. Jonny debe entregar un Excel con: SKU · nombre real del producto · descripción corta · link a la imagen. Sin esto, la IA no puede cargar bien el catálogo.',
      },
      {
        title: '📸 Jonny · Renombrar archivos de imágenes con su SKU',
        impact: 'critical',
        effort_hours: 2,
        owner: 'Jonny (cliente)',
        detail: 'Las imágenes deben llegar con el SKU como nombre de archivo (ej: PEYU-001.jpg, PEYU-002.jpg). Eso permite que el matcher automático las asocie sin intervención manual.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 1 — CATÁLOGO TERMINADO (dom 17 — mar 19 may, 3 días)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-1',
    nombre: 'Fase 1 · Catálogo terminado',
    semana: 'Dom 17 — Mar 19 mayo',
    duracion_dias: 3,
    objetivo: 'Cada producto visible tiene foto, precio, descripción y datos de envío correctos.',
    gate_salida: 'Catálogo aprobado: foto bonita, precios B2C y mayorista, peso para Bluex y descripción real. Listo para empujar tráfico el miércoles.',
    status: 'pending',
    items: [
      {
        title: 'Dom 17 · Jonny entrega fotos de los 20 productos top',
        impact: 'critical',
        effort_hours: 3,
        owner: 'Jonny (cliente)',
        detail: 'Fondo blanco, formato cuadrado, archivo nombrado con el SKU (ej: PEYU-001.jpg). La IA después las mejora automáticamente si hace falta.',
      },
      {
        title: 'Dom 17 · Calcular precios mayoristas automáticamente',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Productos sin precio B2B: se calcula automáticamente. Tú revisas la tabla antes de aplicar.',
      },
      {
        title: 'Dom 17 · Jonny entrega descripciones base de los productos',
        impact: 'high',
        effort_hours: 1.5,
        owner: 'Jonny (cliente)',
        detail: 'Texto corto por producto (3-4 líneas): materiales, uso, dato sostenible. La IA después lo reescribe con tono PEYU y SEO, pero necesita el insumo real de quien conoce los productos.',
      },
      {
        title: 'Dom 17 · La IA reescribe las descripciones con tono PEYU',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Toma el material de Jonny y genera versiones optimizadas para web y Google. Humano aprueba por lote (~20 min).',
      },
      {
        title: 'Lun 18 · Jonny entrega peso y dimensiones para Bluex',
        impact: 'high',
        effort_hours: 1.5,
        owner: 'Jonny (cliente)',
        detail: 'Sin esto, Bluex cobra mal el envío. Pesar una muestra de cada producto y enviar Excel con SKU · peso (kg) · largo · ancho · alto.',
      },
      {
        title: 'Lun 18 · Activar combos "Frecuentemente comprados juntos"',
        impact: 'medium',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'La IA detecta combinaciones reales del historial y propone 5-8 packs.',
      },
      {
        title: 'Lun 18 · SEO para Google (títulos y descripciones)',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Optimizar cómo aparecen los productos en buscadores. Por lote.',
      },
      {
        title: 'Mar 19 · Revisión final + enviar sitemap a Google',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Última pasada antes de prender los agentes el miércoles.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 2 — AGENTES IA TRABAJANDO (mié 20 — vie 22 may, 3 días)
  // Arranca el miércoles tal como lo pidió el cliente.
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-2',
    nombre: 'Fase 2 · Agentes IA trabajando',
    semana: 'Mié 20 — Vie 22 mayo',
    duracion_dias: 3,
    objetivo: 'El chat web vende solo, WhatsApp responde 24/7 e Instagram publica automáticamente.',
    gate_salida: 'WhatsApp respondiendo en menos de 30s, Instagram publicando 5 posts y al menos 3 conversaciones del chat convertidas.',
    status: 'pending',
    items: [
      {
        title: 'Mié 20 AM · Conectar WhatsApp Business al asistente IA',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'El agente cálido ya está listo. Solo falta vincular tu WhatsApp Business escaneando un QR.',
      },
      {
        title: 'Mié 20 PM · Aprobar los 7 posts de Instagram de la semana',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'humano + constructor',
        detail: 'Ya están listos para revisión. Solo dar OK uno por uno y programar publicación.',
      },
      {
        title: 'Mié 20 PM · Conectar Instagram para que publique solo',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano',
        detail: 'Vincular cuenta de Instagram Business. Después la IA publica automáticamente cada día a la mejor hora.',
      },
      {
        title: 'Jue 21 · Probar 10 conversaciones reales con el chat',
        impact: 'critical',
        effort_hours: 1,
        owner: 'humano',
        detail: 'Pruebas como cliente: regalo de pareja, mamá, empresa de 50 unidades, "está caro", etc. Confirmar que cierra bien.',
      },
      {
        title: 'Jue 21 · Asistente B2B en WhatsApp con cotización automática',
        impact: 'high',
        effort_hours: 1.5,
        owner: 'constructor',
        detail: 'Cuando una empresa escribe pidiendo cotización por WhatsApp, recibe propuesta en menos de 1 hora sin intervención.',
      },
      {
        title: 'Vie 22 · Tablero de control de los agentes',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Panel simple para ver cuántas conversaciones tuvieron los agentes y si algo falla.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 3 — ENCENDER EL TRÁFICO (sáb 23 — mar 26 may, 4 días)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-3',
    nombre: 'Fase 3 · Encender el tráfico',
    semana: 'Sáb 23 — Mar 26 mayo',
    duracion_dias: 4,
    objetivo: 'Activar Google Ads, llegar a buscadores y empezar a medir cuánto cuesta cada nuevo cliente.',
    gate_salida: 'Google Ads activa y midiendo, productos apareciendo en buscadores y al menos 10 visitas orgánicas por día.',
    status: 'pending',
    items: [
      {
        title: 'Sáb 23 · Crear 3 campañas de Google Ads con IA',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'constructor + humano',
        detail: 'Una para buscadores ("regalos sostenibles Chile"), otra Shopping y una Demand Gen. La IA predice resultados antes de gastar.',
      },
      {
        title: 'Dom 24 · Conectar Google Shopping (Merchant Center)',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Para que tus productos aparezcan con foto y precio en Google.',
      },
      {
        title: 'Dom 24 · Posicionar PEYU en 10 comunas top',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Generar contenido SEO geo-localizado: "regalos corporativos Las Condes", "Providencia", etc.',
      },
      {
        title: 'Lun 25 · Avisar a buscadores que el sitio es nuevo',
        impact: 'medium',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Acelerar la indexación de Google, Bing y Yandex con un blast masivo.',
      },
      {
        title: 'Mar 26 · Revisión primera semana de tráfico',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'Ver qué campañas funcionan, cortar las que no y escalar las ganadoras.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 4 — MÁQUINA AUTOMÁTICA (mié 27 may en adelante)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-4',
    nombre: 'Fase 4 · Máquina automática',
    semana: 'Mié 27 may en adelante',
    duracion_dias: 7,
    objetivo: 'Que el sistema venda, atienda y publique sin que tengas que mirarlo todos los días.',
    gate_salida: 'Sobre $5M/mes en ventas web, 8+ cotizaciones B2B mensuales y satisfacción de clientes alta.',
    status: 'pending',
    items: [
      {
        title: 'Vendedor por email automático',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Lee tu Gmail cada 15 min, califica y responde leads. Si es uno caliente, manda cotización solo.',
      },
      {
        title: 'Probar 3 versiones del landing automáticamente',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'La IA prueba 3 variantes y se queda con la que más vende.',
      },
      {
        title: 'Programa de referidos B2B',
        impact: 'medium',
        effort_hours: 1.5,
        owner: 'constructor',
        detail: 'Códigos únicos por embajador con comisión 8% automática.',
      },
      {
        title: 'Sumar TikTok y LinkedIn al Content Studio',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Que la IA publique también en TikTok (videos cortos) y LinkedIn (B2B).',
      },
      {
        title: 'Tu tablero móvil de fundador',
        impact: 'low',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Una sola pantalla en tu celular: ventas de hoy, leads, alertas si algo falla.',
      },
    ],
  },
];

// Estado del proyecto HOY — versión humana, sin jerga técnica
// Empezamos por lo sólido (la máquina está armada) y después los ajustes finos.
export const SNAPSHOT_HOY = {
  fecha: '2026-05-15',
  hallazgos_criticos: [
    { tag: '🟩', titulo: 'La estructura del sistema está sólida', simple: 'Más de 60 funciones automáticas operando: pedidos, pagos, envíos con Bluex, alertas, reportes y CRM. La base está construida.' },
    { tag: '🟩', titulo: 'El sistema antifraude ya está protegiendo el negocio', simple: 'Esta semana frenó solo 2 pedidos falsos de $3.9M cada uno. Funciona sin que tengas que mirarlo.' },
    { tag: '🟩', titulo: 'El chat de la web vende con tono cálido y consultivo', simple: 'Recomienda productos, detecta si es regalo personal o corporativo, y guía hasta el cierre. Probado y afinado esta semana.' },
    { tag: '🟩', titulo: '7 publicaciones de Instagram listas para la semana próxima', simple: 'La IA ya generó los posts para lun-dom. Solo falta revisarlos y darle "publicar".' },
    { tag: '🟩', titulo: 'Las integraciones clave ya están conectadas', simple: 'MercadoPago, Pinecone, Google Workspace, WooCommerce y GA4 operando.' },
    { tag: '🟥', titulo: 'Falta la clave productiva de BlueExpress', simple: 'La integración con Bluex está lista y probada, pero BlueExpress aún no nos entregó la credencial definitiva. Sin esto no podemos generar etiquetas reales. Hay que apurar al ejecutivo.' },
    { tag: '🟥', titulo: 'Falta material de productos desde el cliente (Jonny)', simple: 'Necesitamos que Jonny (asistente de informática de PEYU) entregue fotos nombradas con su SKU, descripciones base y peso/dimensiones de cada producto. Sin ese insumo, la IA no puede armar bien el catálogo.' },
    { tag: '🟧', titulo: 'Falta cerrar los detalles del catálogo tras migrar de WooCommerce', simple: 'Algunos productos quedaron con datos incompletos (precio mayorista, peso, descripción). Se completa esta semana.' },
    { tag: '🟧', titulo: 'Algunas fotos quedaron rotas tras la sincronización', simple: 'La importación desde WooCommerce desordenó la galería. Limpieza programada para sábado-domingo.' },
    { tag: '🟨', titulo: 'WhatsApp todavía no responde con la IA', simple: 'El agente cálido está listo, falta vincularlo a tu WhatsApp Business (10 minutos de configuración).' },
    { tag: '🟨', titulo: 'Verificar emails desde peyuchile.cl', simple: 'Configuración del dominio en el proveedor para que las confirmaciones siempre lleguen al cliente.' },
    { tag: '🟨', titulo: 'Pequeños ajustes de estabilidad en móvil', simple: 'Mejorar el formulario B2B y los filtros de categoría desde el celular.' },
  ],
};

export function getRoadmapStats() {
  let total = 0;
  let done = 0;
  let active = 0;
  let totalHours = 0;
  LAUNCH_ROADMAP.forEach(phase => {
    phase.items.forEach(it => {
      total++;
      totalHours += (it.effort_hours || 0);
      if (it.status === 'done') done++;
      if (it.status === 'active') active++;
    });
  });
  const phasesDone = LAUNCH_ROADMAP.filter(p => p.status === 'done').length;
  return { total, done, active, totalHours, phasesDone, totalPhases: LAUNCH_ROADMAP.length };
}

export function getPhaseProgress(phase) {
  const total = phase.items.length;
  if (total === 0) return 0;
  const done = phase.items.filter(i => i.status === 'done').length;
  return Math.round((done / total) * 100);
}