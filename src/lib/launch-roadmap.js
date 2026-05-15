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
  // FASE 0 — TRIAGE CRÍTICO (sáb 16 may · dom 17 may)
  // GOAL: arreglar los 5 sangrados graves que rompen la experiencia.
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-0',
    nombre: 'Fase 0 · Triage crítico',
    semana: 'Sáb 16 · Dom 17 mayo',
    duracion_dias: 2,
    objetivo: 'Detener los sangrados: nada puede romperse el lunes cuando empecemos a empujar tráfico.',
    gate_salida: 'Cero errores 403/Network en producción · 100% pedidos llegan a /gracias · Form B2B funciona desde celular.',
    status: 'pending',
    items: [
      {
        title: 'Arreglar RLS de B2BLead — formulario público falla con "Permission denied"',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Detectado en logs el 13-may. Usuarios anónimos NO pueden crear leads desde /b2b/contacto. Hay que relajar RLS de B2BLead para permitir create anónimo (como ChatLead).',
      },
      {
        title: 'Reproducir y resolver "Network Error" en /shop?categoria=X (mobile)',
        impact: 'critical',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Múltiples errores en mobile-360 desde 13-may. Probable race condition en filtro de categoría + URL params. Agregar retry + fallback al loading.',
      },
      {
        title: 'Auditar 100% catálogo: detectar productos con imagen_url rota o vacía',
        impact: 'critical',
        effort_hours: 3,
        owner: 'humano + constructor',
        detail: 'Correr auditImageUrlsLive sobre todos los SKUs activos. Generar lista de "productos a fotografiar manualmente" vs "productos rescatables desde Drive". Output: Excel descargable.',
      },
      {
        title: 'Desactivar productos con imagen 100% rota del catálogo público',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano',
        detail: 'Mejor tener 30 productos perfectos en /shop que 80 con imágenes rotas. Marcar activo=false hasta arreglar.',
      },
      {
        title: 'Confirmar pago MercadoPago end-to-end con 1 pedido real $1.000',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'humano',
        detail: 'Pedido + pago + webhook + email confirmación + landing /gracias. Si algo falla acá, paramos todo.',
      },
      {
        title: 'Configurar dominio en Resend para emails transaccionales',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Resend está en sandbox → emails de confirmación se pierden. Migrar a dominio peyuchile.cl verificado (SPF + DKIM).',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 1 — CATÁLOGO COMPLETO Y ESTABLE (lun 18 — vie 22 may)
  // GOAL: cada producto tiene imagen + precio + descripción + lead time.
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-1',
    nombre: 'Fase 1 · Catálogo completo y confiable',
    semana: 'Lun 18 — Vie 22 mayo',
    duracion_dias: 5,
    objetivo: 'Catálogo curado. Cada SKU activo tiene imagen real, precio B2C/B2B, lead time, descripción de 2 párrafos y peso para Bluex.',
    gate_salida: '100% productos activos pasan auditoriaCatalogoCRON con score ≥ 85. Bluex cotiza envío sin error en 5 comunas distintas.',
    status: 'pending',
    items: [
      {
        title: 'Lunes 18 · Fotografía manual de los 20 productos top-vendidos',
        impact: 'critical',
        effort_hours: 6,
        owner: 'humano',
        detail: 'Fotos cuadradas 1200×1200 mínimo, fondo blanco + 1 contextual. Subir vía /admin/admin-products. Constructor te asistirá con AI upscaling si hace falta.',
      },
      {
        title: 'Lunes 18 · Bulk fix precio_base_b2b para B2B (corre cálculo automático)',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Hoy muchos productos tienen precio_base_b2b=0 o null. Backend que calcula precio_b2c × 0.7 si están vacíos. Genera tabla preview antes de aplicar.',
      },
      {
        title: 'Martes 19 · Generar descripciones de marca (storytelling) con IA',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Para los 50 productos sin descripción decente, generar copy con tono PEYU usando generateProductDescription. Humano aprueba lote por lote.',
      },
      {
        title: 'Martes 19 · Completar dimensiones + peso para Bluex (Excel)',
        impact: 'high',
        effort_hours: 3,
        owner: 'humano',
        detail: 'Sin peso_kg correcto, Bluex cobra mal. Pesar muestra de cada SKU, llenar Excel y constructor hace bulk import.',
      },
      {
        title: 'Miércoles 20 · Bundles "Frequently Bought Together" — analyzeBundlesFromHistory',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Ya existe la función. Correrla sobre historial de pedidos, generar 5-8 bundles top, revisar uno a uno y activar.',
      },
      {
        title: 'Jueves 21 · SEO bulk: meta_title + meta_description para 50 productos',
        impact: 'medium',
        effort_hours: 1.5,
        owner: 'constructor',
        detail: 'Correr generateSEOMetaBulk. Revisión humana de lote por categoría.',
      },
      {
        title: 'Viernes 22 · Auditoria final + sitemap submit a GSC',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'auditCatalogForLaunch + gscSubmitSitemap + autoIndexNowBlast. Cero errores antes del fin de semana.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 2 — AGENTES DE IA EN PRODUCCIÓN (lun 25 — vie 29 may)
  // GOAL: chat de la web cierra ventas. WhatsApp responde 24/7. Social posteando.
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-2',
    nombre: 'Fase 2 · Agentes IA en producción',
    semana: 'Lun 25 — Vie 29 mayo',
    duracion_dias: 5,
    objetivo: 'Chat web cierra ≥ 1 venta B2C autónoma. WhatsApp responde leads B2B. Instagram publica 5 posts/semana sin intervención.',
    gate_salida: '≥ 3 ChatLeads convertidos · WhatsApp responde en < 30s · 5 posts publicados con engagement > 2%.',
    status: 'pending',
    items: [
      {
        title: 'Lunes 25 · Conectar WhatsApp Business al agente asistente_compras',
        impact: 'critical',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Agente ya tiene whatsapp_greeting configurado. Falta autorizar el canal WhatsApp en Base44 (escaneo QR business). Una vez conectado, link público en la web.',
      },
      {
        title: 'Lunes 25 · QA del agente cálido (10 conversaciones reales B2C + B2B)',
        impact: 'critical',
        effort_hours: 2,
        owner: 'humano',
        detail: 'Probar 10 flujos: pareja, mamá, empresa 50u, 200u, "está caro", "no sé qué le gusta", etc. Validar que NO inventa nombres, NO repite SKUs, cierra con CART o QUOTE_PDF.',
      },
      {
        title: 'Martes 26 · Activar publishContentPost de Social Studio (los 7 posts pendientes)',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'Hoy hay 7 ContentPost en estado "En revisión" para la próxima semana. Revisarlos, aprobar, programar publicación automática.',
      },
      {
        title: 'Miércoles 27 · Conectar Instagram Business a Social Studio',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano',
        detail: 'Hoy los posts se generan pero no se publican solos. Conectar IG Business vía OAuth para auto-publish con publishContentPost.',
      },
      {
        title: 'Jueves 28 · Agente B2B Triage WhatsApp (auto-respuesta cotización < 24h)',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Roadmap marca este agente como "building". Terminarlo: recibe mensaje WhatsApp B2B, detecta intent, genera mockup + cotización, alerta a equipo si requiere humano.',
      },
      {
        title: 'Viernes 29 · Métricas: dashboard MonitoreoIA real-time',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Verificar /admin/monitoreo-ia: cost_usd, latency, error rate de los 3 agentes activos. Alerta si error > 5%.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 3 — TRÁFICO PAGADO + SEO BLITZ (lun 1 — vie 5 jun)
  // GOAL: encender el motor de adquisición controlado, con CAC objetivo claro.
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-3',
    nombre: 'Fase 3 · Tráfico pagado + SEO blitz',
    semana: 'Lun 1 — Vie 5 junio',
    duracion_dias: 5,
    objetivo: 'Encender Google Ads B2C (Search + PMax) con $30k/día. Encender SEO blitz a IndexNow. Medir CAC real.',
    gate_salida: 'Google Ads activa con CAC < $15K · Top 3 productos indexados en Google · ≥ 10 sesiones orgánicas/día.',
    status: 'pending',
    items: [
      {
        title: 'Lunes 1 · Generar 3 campañas Google Ads con adsGenerateCampaign2026',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor + humano',
        detail: 'Search B2C "regalos sostenibles Chile", PMax con feed Merchant, Demand Gen lookalike. Forecast con adsForecastPerformance, revisar verdict.',
      },
      {
        title: 'Martes 2 · Configurar Google Merchant Center + feed',
        impact: 'high',
        effort_hours: 2,
        owner: 'humano + constructor',
        detail: 'Función googleMerchantFeed ya existe. Subir feed.xml, verificar productos aprobados, conectar con campaña Shopping.',
      },
      {
        title: 'Miércoles 3 · SEO Geo Blast (Santiago + 10 comunas top)',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'seoGeoBlast: blog posts geo-targetizados ("regalos corporativos Las Condes", "Providencia"...). Auto-índex con autoIndexNowBlast.',
      },
      {
        title: 'Jueves 4 · IndexNow blast masivo de 100 URLs (productos + blog)',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'autoIndexNowBlast con todas las URLs activas. Ping a Bing + Yandex + Google.',
      },
      {
        title: 'Viernes 5 · Análisis primera semana: GA4 realtime + Ads performance',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Revisar /admin/ga-realtime y adsAnalyzePerformance. Identificar campañas ganadoras vs perdedoras. Cortar mal performance, escalar ganadoras.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FASE 4 — ESCALA & OPTIMIZACIÓN (lun 8 jun en adelante)
  // GOAL: pasar de "funciona" a "escala". B2B sales rep IA. Multicanal.
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'fase-4',
    nombre: 'Fase 4 · Escala y optimización continua',
    semana: 'Lun 8 jun en adelante',
    duracion_dias: 10,
    objetivo: 'Convertir el sistema en una máquina autónoma: ventas, marketing, customer success funcionan sin intervención diaria.',
    gate_salida: '≥ $5M/mes en ventas B2C web · ≥ 8 propuestas B2B/mes · NPS ≥ 50.',
    status: 'pending',
    items: [
      {
        title: 'Agente Email Sales Rep (lee Gmail, califica, responde, cotiza)',
        impact: 'high',
        effort_hours: 4,
        owner: 'constructor',
        detail: 'ingestGmailInquiry ya existe pero no contesta. Extender: lee inbox cada 15min, triagea con triageConsultaIA, genera propuesta auto si score > 70.',
      },
      {
        title: 'A/B testing automático en landing (3 variantes hero)',
        impact: 'medium',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Variantes de copy hero + CTA. Tracking con activity-tracker. Auto-elegir ganador después de 1000 sesiones.',
      },
      {
        title: 'Programa de afiliados / referidos B2B',
        impact: 'medium',
        effort_hours: 3,
        owner: 'constructor',
        detail: 'Códigos únicos por embajador, tracking de conversiones, comisión 8% automática.',
      },
      {
        title: 'TikTok + LinkedIn — Content Studio multi-canal',
        impact: 'medium',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Extender generateSocialContent + publishContentPost para soportar TikTok (video corto) y LinkedIn (B2B copy más serio).',
      },
      {
        title: 'Dashboard ejecutivo del fundador (móvil-first)',
        impact: 'low',
        effort_hours: 2,
        owner: 'constructor',
        detail: '1 pantalla móvil que muestra: ventas hoy, leads hoy, conversaciones IA, alertas críticas. Notif push si algo se rompe.',
      },
    ],
  },
];

// Estado del proyecto AHORA (snapshot 15-may-2026)
export const SNAPSHOT_HOY = {
  fecha: '2026-05-15',
  hallazgos_criticos: [
    { tag: '🟥', titulo: 'B2BLead RLS bloquea creaciones públicas', evidencia: 'ErrorLog 13-may: "Permission denied for create operation on B2BLead entity"' },
    { tag: '🟥', titulo: 'Network Error intermitente en /shop?categoria=X (mobile)', evidencia: '4 ErrorLog en 14-may en mobile-360' },
    { tag: '🟧', titulo: 'Catálogo desordenado: muchos SKU sin precio B2B, peso, dimensiones, lead_time', evidencia: 'Sample de 50 productos: ~60% campos críticos vacíos' },
    { tag: '🟧', titulo: 'Imágenes WooCommerce caídas o duplicadas tras sync', evidencia: 'URLs base44.app/api/apps/.../files que ya no resuelven' },
    { tag: '🟨', titulo: 'WhatsApp NO conectado a asistente_compras', evidencia: 'Agente tiene whatsapp_greeting pero no hay canal autorizado' },
    { tag: '🟨', titulo: 'Resend en sandbox → emails se pierden a destinatarios reales', evidencia: 'Documentado en sesión anterior' },
    { tag: '🟩', titulo: 'Motor anti-fraude funcionando: bloqueó 2 pedidos de $3.9M c/u', evidencia: 'PedidoWeb cancelados 11-may, risk_flags=test_interno' },
    { tag: '🟩', titulo: 'Chat IA con tono cálido funcionando (recientemente afinado)', evidencia: 'AILog confirma flujo B2C/B2B detectado, sin nombres inventados desde último prompt' },
    { tag: '🟩', titulo: '7 posts sociales generados con IA listos para revisar/publicar', evidencia: 'ContentPost del 17-23 may en estado "En revisión"' },
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