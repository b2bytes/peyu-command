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
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 1 — CATÁLOGO TERMINADO (dom 17 — mié 20 may, 4 días)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-1',
    nombre: 'Fase 1 · Catálogo terminado',
    semana: 'Dom 17 — Mié 20 mayo',
    duracion_dias: 4,
    objetivo: 'Cada producto visible tiene foto, precio, descripción y datos de envío correctos.',
    gate_salida: 'Catálogo aprobado: foto bonita, precios B2C y mayorista, peso para Bluex y descripción real.',
    status: 'pending',
    items: [
      {
        title: 'Dom 17 · Fotos de los 20 productos más vendidos',
        impact: 'critical',
        effort_hours: 4,
        owner: 'humano',
        detail: 'Fondo blanco, formato cuadrado. La IA puede ayudarte a mejorar las que ya tengas.',
      },
      {
        title: 'Dom 17 · Calcular precios mayoristas automáticamente',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Productos sin precio B2B: se calcula automáticamente. Tú revisas la tabla antes de aplicar.',
      },
      {
        title: 'Lun 18 · Descripciones con tono PEYU para 50 productos',
        impact: 'high',
        effort_hours: 1.5,
        owner: 'constructor',
        detail: 'La IA escribe descripciones por lote, tú apruebas. Tomar ~30 min revisar.',
      },
      {
        title: 'Lun 18 · Completar peso y dimensiones para Bluex',
        impact: 'high',
        effort_hours: 2,
        owner: 'humano',
        detail: 'Sin esto, Bluex cobra mal el envío. Pesar una muestra de cada producto.',
      },
      {
        title: 'Mar 19 · Activar combos "Frecuentemente comprados juntos"',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'La IA detecta combinaciones reales del historial y propone 5-8 packs.',
      },
      {
        title: 'Mar 19 · SEO para Google (títulos y descripciones)',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Optimizar cómo aparecen los productos en buscadores. Por lote.',
      },
      {
        title: 'Mié 20 · Revisión final + enviar sitemap a Google',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Última pasada antes del jueves para activar tráfico.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 2 — AGENTES IA TRABAJANDO (jue 21 — mar 26 may, 6 días)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-2',
    nombre: 'Fase 2 · Agentes IA trabajando',
    semana: 'Jue 21 — Mar 26 mayo',
    duracion_dias: 6,
    objetivo: 'El chat web vende solo, WhatsApp responde 24/7 e Instagram publica automáticamente.',
    gate_salida: 'WhatsApp respondiendo en menos de 30s, Instagram publicando 5 posts y al menos 3 conversaciones del chat convertidas.',
    status: 'pending',
    items: [
      {
        title: 'Jue 21 · Conectar WhatsApp Business al asistente IA',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'El agente cálido ya está listo. Solo falta vincular tu WhatsApp Business escaneando un QR.',
      },
      {
        title: 'Vie 22 · Probar 10 conversaciones reales con el chat',
        impact: 'critical',
        effort_hours: 1.5,
        owner: 'humano',
        detail: 'Hacer pruebas como cliente: regalo de pareja, mamá, empresa de 50 unidades, "está caro", etc. Confirmar que cierra bien.',
      },
      {
        title: 'Lun 25 · Aprobar los 7 posts de Instagram de la semana',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'humano + constructor',
        detail: 'Ya están listos para revisión. Solo dar OK uno por uno y programar publicación.',
      },
      {
        title: 'Lun 25 · Conectar Instagram para que publique solo',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano',
        detail: 'Vincular cuenta de Instagram Business. Después la IA publica automáticamente cada día a la mejor hora.',
      },
      {
        title: 'Mar 26 · Asistente B2B en WhatsApp con cotización automática',
        impact: 'high',
        effort_hours: 1.5,
        owner: 'constructor',
        detail: 'Cuando una empresa escribe pidiendo cotización por WhatsApp, recibe propuesta en menos de 1 hora sin intervención.',
      },
      {
        title: 'Mar 26 · Tablero de control de los agentes',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Panel simple para ver cuántas conversaciones tuvieron los agentes y si algo falla.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 3 — ENCENDER EL TRÁFICO (mié 27 may — sáb 30 may, 4 días)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-3',
    nombre: 'Fase 3 · Encender el tráfico',
    semana: 'Mié 27 — Sáb 30 mayo',
    duracion_dias: 4,
    objetivo: 'Activar Google Ads, llegar a buscadores y empezar a medir cuánto cuesta cada nuevo cliente.',
    gate_salida: 'Google Ads activa y midiendo, productos apareciendo en buscadores y al menos 10 visitas orgánicas por día.',
    status: 'pending',
    items: [
      {
        title: 'Mié 27 · Crear 3 campañas de Google Ads con IA',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'constructor + humano',
        detail: 'Una para buscadores ("regalos sostenibles Chile"), otra Shopping y una Demand Gen. La IA predice resultados antes de gastar.',
      },
      {
        title: 'Jue 28 · Conectar Google Shopping (Merchant Center)',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Para que tus productos aparezcan con foto y precio en Google.',
      },
      {
        title: 'Jue 28 · Posicionar PEYU en 10 comunas top',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Generar contenido SEO geo-localizado: "regalos corporativos Las Condes", "Providencia", etc.',
      },
      {
        title: 'Vie 29 · Avisar a buscadores que el sitio es nuevo',
        impact: 'medium',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Acelerar la indexación de Google, Bing y Yandex con un blast masivo.',
      },
      {
        title: 'Sáb 30 · Revisión primera semana de tráfico',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'Ver qué campañas funcionan, cortar las que no y escalar las ganadoras.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 4 — MÁQUINA AUTOMÁTICA (lun 1 jun en adelante)
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-4',
    nombre: 'Fase 4 · Máquina automática',
    semana: 'Lun 1 jun en adelante',
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
export const SNAPSHOT_HOY = {
  fecha: '2026-05-15',
  hallazgos_criticos: [
    { tag: '🟥', titulo: 'El formulario B2B se está cayendo en celulares', simple: 'Los clientes corporativos no pueden enviar consultas desde su teléfono. Lo arreglamos mañana.' },
    { tag: '🟥', titulo: 'La tienda da error al filtrar por categoría en móvil', simple: 'A veces, al elegir "Escritorio" o "Hogar" desde el celular, no carga. Vamos a estabilizarlo.' },
    { tag: '🟧', titulo: 'Catálogo a medio terminar tras migrar de WooCommerce', simple: 'Muchos productos perdieron datos clave (precio mayorista, peso, descripción). Hay que completarlos.' },
    { tag: '🟧', titulo: 'Algunas fotos de productos están rotas o duplicadas', simple: 'La sincronización con WooCommerce desordenó la galería. Hay que limpiarla.' },
    { tag: '🟨', titulo: 'WhatsApp todavía no responde con el asistente IA', simple: 'El agente cálido ya está listo, falta conectarlo al WhatsApp Business.' },
    { tag: '🟨', titulo: 'Los emails de confirmación pueden no estar llegando', simple: 'Necesitamos verificar el dominio peyuchile.cl en el proveedor de email para que ningún cliente quede sin respuesta.' },
    { tag: '🟩', titulo: 'El sistema antifraude ya está bloqueando intentos sospechosos', simple: 'Esta semana frenó automáticamente 2 pedidos falsos de $3.9M cada uno. Funciona.' },
    { tag: '🟩', titulo: 'El chat de la web ya tiene tono cálido y consultivo', simple: 'El agente recomienda productos, detecta si es regalo personal o corporativo y guía al cierre.' },
    { tag: '🟩', titulo: '7 publicaciones de Instagram listas para la semana próxima', simple: 'La IA ya generó posts para lun-dom. Solo falta revisarlos y darle "publicar".' },
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