/**
 * 🚀 ROADMAP DE LANZAMIENTO PEYU — Versión 27-may-2026 (post-contrato Impulsia)
 *
 * CONTEXTO NUEVO:
 *   • Contrato firmado con PEYU el 26-may-2026. Setup queda pendiente de pago
 *     hasta que el sistema esté estable y operativo.
 *   • Meta contractual: sostener $20M+ CLP/mes en ventas (B2B + B2C) desde
 *     septiembre 2026, medido mensualmente (no acumulado).
 *   • Baseline contractual: promedio ventas histórico ene–ago 2026 (data
 *     consolidada en Base44 + SII por Carlos).
 *   • Performance Fee se activa solo sobre ventas mensuales que superen el
 *     baseline. Por eso necesitamos el sistema midiendo correctamente desde
 *     el día 1.
 *
 * ESTRATEGIA EN 2 TIEMPOS:
 *   Tiempo 1 → 7 días (27-may → 02-jun) · "SETUP ESTABLE MÍNIMO VIABLE"
 *     Lo básico que DEBE funcionar sin caerse para que el cliente nos pague
 *     el setup. Vender, recibir pagos, despachar, atender.
 *
 *   Tiempo 2 → 13 semanas (03-jun → 31-ago) · "HARDENING + ESCALA A $20M"
 *     Hitos quincenales construyendo automatización, tráfico, conversión
 *     y reporting hasta llegar al gate de septiembre con sistema sostenible.
 *
 * Filosofía:
 *   • Estabilidad PRIMERO, escala DESPUÉS.
 *   • Cada hito tiene gate de salida medible (no opinable).
 *   • Cada quincena cierra con una demo concreta para PEYU.
 *
 * Editor único de verdad: este archivo.
 */

export const PHASE_META = {
  pending:   { label: 'Pendiente',     emoji: '⏳', color: 'slate' },
  active:    { label: 'En curso',      emoji: '🔥', color: 'amber' },
  done:      { label: 'Completada',    emoji: '✅', color: 'emerald' },
  blocked:   { label: 'Bloqueada',     emoji: '🛑', color: 'red' },
};

// Track en cuál bloque estamos: T1 = setup mínimo viable, T2 = hardening + escala
export const TRACK_META = {
  T1: { label: 'Setup mínimo viable',  emoji: '🛠️', subtitulo: '7 días para soltar el cobro del setup' },
  T2: { label: 'Hardening + escala',   emoji: '📈', subtitulo: '13 semanas hasta los $20M sostenidos' },
};

export const LAUNCH_ROADMAP = [
  // ════════════════════════════════════════════════════════════════════
  // 🛠️ T1 · SETUP MÍNIMO VIABLE (mié 27 may → mar 02 jun · 7 días)
  // ════════════════════════════════════════════════════════════════════
  // Lo que tiene que estar OK al final de estos 7 días para que el cliente
  // diga "esto funciona" y libere el pago del setup según contrato.
  // ════════════════════════════════════════════════════════════════════

  {
    id: 't1-h1',
    track: 'T1',
    nombre: 'Hito 1 · Cobranza y entrega funcionando end-to-end',
    semana: 'Mié 27 — Vie 29 mayo',
    duracion_dias: 3,
    objetivo: 'Un cliente cualquiera puede comprar, pagar, recibir email y obtener tracking sin intervención manual.',
    gate_salida: 'Pedido de prueba real completado end-to-end: MercadoPago aprobado → email confirmado → etiqueta Bluex generada → tracking visible en /seguimiento. Sin errores en consola.',
    status: 'active',
    items: [
      {
        title: 'Mié 27 · Sanity check completo del flujo de compra B2C',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor + humano',
        detail: '3 compras de prueba con MercadoPago real ($1.000 c/u): carrito → checkout → pago aprobado → email recibido → pedido visible en /admin/procesar-pedidos. Documentar cualquier fricción para fix inmediato.',
      },
      {
        title: 'Mié 27 · Activar clave productiva BlueExpress (BLOQUEANTE)',
        impact: 'critical',
        effort_hours: 0.3,
        owner: 'humano',
        detail: 'Apurar al ejecutivo BlueExpress para obtener credencial productiva. Sin esto no podemos generar etiquetas reales. Si BlueExpress no responde en 48h, plan B: usar Starken/Chilexpress en paralelo.',
      },
      {
        title: 'Jue 28 · Verificar dominio peyuchile.cl en Resend (emails)',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'Verificar SPF/DKIM/DMARC para que confirmaciones de compra, propuestas B2B y recordatorios lleguen siempre al inbox (no spam). Test: enviar 5 emails a Gmail, Outlook, Hotmail.',
      },
      {
        title: 'Jue 28 · Smoke test público completo (10 rutas críticas)',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Correr uxSmokeTest sobre /, /shop, /producto/:id, /cart, /b2b/contacto, /b2b/self-service, /seguimiento, /soporte, /faq, /canjear. Cualquier 500 o JS error → fix mismo día.',
      },
      {
        title: 'Vie 29 · Habilitar generación real de etiqueta Bluex',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Con credencial productiva activa: bluexCreateShipment debe devolver PDF descargable + tracking number real. Probar con 2 pedidos de prueba (Santiago + región).',
      },
      {
        title: 'Vie 29 · Auto-trigger envío de tracking al cliente cuando se genera etiqueta',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Al despachar, el cliente recibe email automático con link a /seguimiento?pedido=NNNN. Sin acción manual del admin.',
      },
    ],
  },

  {
    id: 't1-h2',
    track: 'T1',
    nombre: 'Hito 2 · Captura de demanda B2B y B2C estable',
    semana: 'Sáb 30 — Dom 31 mayo',
    duracion_dias: 2,
    objetivo: 'Todo formulario, chat y CTA público convierte sin errores y queda registrado en el CRM.',
    gate_salida: '5 leads de prueba (3 B2B desde /b2b/contacto + 2 chats web) entran al pipeline correctamente, con score IA aplicado y notificación al equipo.',
    status: 'pending',
    items: [
      {
        title: 'Sáb 30 · Probar formulario B2B desde mobile, tablet y desktop',
        impact: 'critical',
        effort_hours: 0.5,
        owner: 'humano + constructor',
        detail: 'Submit con y sin logo, con y sin brief. Confirmar: lead creado → score asignado → email a equipo → si score >70, propuesta auto-generada.',
      },
      {
        title: 'Sáb 30 · Conectar WhatsApp Business al agente Peyu',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'humano',
        detail: 'Escanear QR con +56 9 3376 6573 (cuenta Business PEYU). Agente cálido ya validado. Confirmar 3 mensajes de prueba responden en <30s.',
      },
      {
        title: 'Sáb 30 · Activar captura de carrito abandonado (CRON cada hora)',
        impact: 'medium',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Ya implementado. Solo activar el CRON y confirmar que un carrito abandonado a propósito recibe email 1h después.',
      },
      {
        title: 'Dom 31 · Verificar Chat Leads se persisten todos',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Tener 5 conversaciones de prueba en el chat público y confirmar que aparecen en /admin/chat-leads con datos progresivos capturados (nombre, email, intención).',
      },
      {
        title: 'Dom 31 · Test fin de semana: dejar el sistema sin tocarlo 24h',
        impact: 'high',
        effort_hours: 0,
        owner: 'humano',
        detail: 'No tocar el sistema sábado noche y domingo. Lunes revisar: ¿hubo errores? ¿se cayó algo? ¿llegaron pedidos reales? Mientras menos intervenciones, mejor.',
      },
    ],
  },

  {
    id: 't1-h3',
    track: 'T1',
    nombre: 'Hito 3 · Cockpit visible para fundadores',
    semana: 'Lun 01 — Mar 02 junio',
    duracion_dias: 2,
    objetivo: 'Diego y los fundadores entran a una sola URL y ven ventas, pedidos, leads y salud del sistema en tiempo real.',
    gate_salida: 'Demo de 15 min a Diego: cockpit móvil + escritorio mostrando ventas del día, pipeline B2B en vivo y alertas. Aprueba → se libera pago del setup.',
    status: 'pending',
    items: [
      {
        title: 'Lun 01 · Cockpit móvil con KPIs reales del día (no mocks)',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor',
        detail: '/admin/movil debe mostrar: ventas hoy, ayer, mes; nº pedidos activos; leads B2B nuevos; conversaciones chat; alertas si algo crítico falla.',
      },
      {
        title: 'Lun 01 · Reporte diario automático al fundador por email (07:00 AM)',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'dailyBriefingCRON ya existe. Solo confirmar que llega al inbox de Diego cada mañana con: ventas día anterior, pedidos pendientes, leads calientes, anomalías.',
      },
      {
        title: 'Lun 01 · Calcular y guardar baseline contractual (ene–ago 2026)',
        impact: 'critical',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Carlos exporta ventas mensuales B2B + B2C ene–ago 2026 desde Base44 + SII. Guardamos baseline en Configuracion como cifra fija $X CLP/mes (referencia contractual para Performance Fee).',
      },
      {
        title: 'Mar 02 · Demo formal a fundadores (60 min)',
        impact: 'critical',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Walkthrough en vivo: comprar como cliente → ver pedido entrar → procesar en kanban → generar etiqueta Bluex → recibir email tracking. Mostrar cockpit y reporte diario. Cliente firma "setup aprobado" → libera pago.',
      },
      {
        title: 'Mar 02 · Documento de cierre T1 con evidencia',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'PDF de 1 página: hitos completados, screenshots, métricas iniciales (lighthouse, TTFB, tasa de error). Adjunto al email de solicitud de pago del setup.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // 📈 T2 · HARDENING + ESCALA A $20M (mié 03 jun → mar 31 ago · 13 sem)
  // ════════════════════════════════════════════════════════════════════
  // Quincenas con hitos progresivos: cada 2 semanas un gate medible que
  // PEYU puede revisar. Construimos automatización + tráfico + conversión
  // hasta llegar al gate de septiembre.
  // ════════════════════════════════════════════════════════════════════

  {
    id: 't2-q1',
    track: 'T2',
    nombre: 'Q1 · Catálogo profesional y SEO técnico al 100%',
    semana: 'Mié 03 — Mar 16 junio',
    duracion_dias: 14,
    objetivo: 'Los 69 productos activos son indistinguibles de un retailer top: foto profesional, descripción SEO, precios B2B+B2C, peso/dimensiones para Bluex.',
    gate_salida: 'Lighthouse SEO ≥ 95 en productos top. Google Search Console indexa el 100% de URLs del sitemap. Jonny entrega último lote de fotos faltantes.',
    status: 'pending',
    items: [
      {
        title: 'Jonny · Entrega fotos + descripciones de los 69 productos activos',
        impact: 'critical',
        effort_hours: 8,
        owner: 'Jonny (cliente)',
        detail: 'Excel: SKU sugerido · nombre · descripción 3-4 líneas · peso (kg) · dimensiones (LxAxH cm) · imágenes nombradas con nombre del producto (ej. "macetero-cuadrado.jpg"). Entrega en 2 lotes (10 jun + 16 jun).',
      },
      {
        title: 'Calcular precios B2B (50–199, 200–499, 500+) para 30 productos faltantes',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor + humano',
        detail: 'Correr analizarCostosReales con insumos de Jonny. Generar PriceSuggestion en /admin/centro-costos. Humano aprueba por lote.',
      },
      {
        title: 'IA reescribe descripciones SEO de los 69 productos en tono PEYU',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Tomar material de Jonny + generar meta title 50-60 chars, meta description 150-165 chars, descripción larga 200-300 palabras con keywords reales de GSC.',
      },
      {
        title: 'Aplicar SEO bulk a TODO el catálogo + sitemap actualizado',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'generateSEOMetaBulk + generateSitemap. Submit a Google Search Console y Bing Webmaster.',
      },
      {
        title: 'Migrar últimas imágenes legacy a media.base44.com',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'driveMatchAllProducts + migrateProductImagesToBase44. Eliminar cualquier URL apuntando a base44.app/api/.',
      },
      {
        title: 'Activar Google Merchant Center con feed XML diario',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Conectar cuenta Merchant Center. syncToMerchantCenter ya implementado. Productos deben aparecer en Google Shopping con foto y precio en ≤ 72h.',
      },
    ],
  },

  {
    id: 't2-q2',
    track: 'T2',
    nombre: 'Q2 · Agentes IA produciendo conversiones',
    semana: 'Mié 17 — Mar 30 junio',
    duracion_dias: 14,
    objetivo: 'El chat web + WhatsApp + Instagram generan al menos 20 leads B2B y 50 conversaciones útiles en 2 semanas, sin intervención humana.',
    gate_salida: '≥ 3 ventas B2C cerradas vía chat. ≥ 5 cotizaciones B2B auto-generadas. Tasa de respuesta WhatsApp < 30s. Instagram con 14 posts publicados (uno/día).',
    status: 'pending',
    items: [
      {
        title: 'Conectar Instagram Business al agente content_creator',
        impact: 'high',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Credenciales Meta for Developers. Auto-publicar 1 post/día a la hora óptima según engagement histórico. 14 posts ya pre-generados en /admin/social-studio.',
      },
      {
        title: 'Agente B2B Triage WhatsApp con cotización automática',
        impact: 'critical',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Empresa escribe a WhatsApp → bot detecta intención B2B → pide datos (empresa, cantidad, producto, fecha) → genera propuesta con createCorporateProposal → envía PDF en <1h.',
      },
      {
        title: 'Activar nurturing IA de leads B2B tibios (score 30-59)',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'nurtureLeadB2B ya implementado. Programar CRON cada 72h: email educativo + caso de éxito + invitación a cotizar.',
      },
      {
        title: 'A/B test del prompt del agente Peyu (calidez vs eficiencia)',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: '50/50 de visitantes ven variante A (tono actual) vs B (más directa). Medir conversion rate a 14 días. La que gana se queda.',
      },
      {
        title: 'Monitor de salud de agentes IA con alerta si fallan',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: '/admin/monitoreo-ia ya existe. Agregar alerta proactiva: si un agente devuelve >3 errores en 1h, email al equipo.',
      },
    ],
  },

  {
    id: 't2-q3',
    track: 'T2',
    nombre: 'Q3 · Tráfico pagado y orgánico encendidos',
    semana: 'Mié 01 — Mar 14 julio',
    duracion_dias: 14,
    objetivo: 'Google Ads activo con presupuesto controlado, SEO con primeros rankings, ≥ 1.000 sesiones únicas semanales.',
    gate_salida: 'CAC B2C ≤ $25k. 5 keywords PEYU en página 1 de Google. ≥ 1.500 visitas orgánicas + 2.000 visitas pagadas en la quincena.',
    status: 'pending',
    items: [
      {
        title: 'Conectar cuenta Google Ads productiva + activar 3 campañas pre-armadas',
        impact: 'critical',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Las 3 campañas ya están en /admin/ads-command. Search (CAC esperado $21k), Shopping (CAC $14k), Demand Gen (awareness). Presupuesto inicial: $300k/sem en total.',
      },
      {
        title: 'Subir archivo IndexNow + verificar dominio en Search Console',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'humano',
        detail: '2 acciones bloqueantes: (1) Subir peyuchile.cl/peyu2026indexnow.txt con contenido "peyu2026indexnow" (5 min). (2) Verificar dominio en GSC vía DNS TXT (10 min). Después se dispara autoIndexNowBlast.',
      },
      {
        title: 'seoLaunchBlast: ping masivo de 86 URLs a Google + Bing + Yandex',
        impact: 'high',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'Una vez subido IndexNow y verificado dominio: ping automático. Esperar 7 días para ver primeros rankings en GSC.',
      },
      {
        title: 'Generar 10 blog posts SEO con generateBlogPost (publicar 1/día)',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Temas: regalos corporativos sostenibles, productos reciclados Chile, fibra de trigo vs plástico, etc. autoIndexOnPublish para indexación inmediata.',
      },
      {
        title: 'Análisis IA semanal de keywords ganadoras vs perdedoras',
        impact: 'medium',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'gscTopKeywords + oportunidadesSEOCRON. Reporte cada lunes con quick wins (página 2 → página 1).',
      },
      {
        title: 'Optimizar Core Web Vitals (LCP, CLS, INP) en productos top',
        impact: 'medium',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Lighthouse ≥ 90 en mobile para los 20 productos más visitados. Lazy load, preload de imágenes hero, reducir JS bundle.',
      },
    ],
  },

  {
    id: 't2-q4',
    track: 'T2',
    nombre: 'Q4 · Reporting automático y observabilidad total',
    semana: 'Mié 15 — Mar 28 julio',
    duracion_dias: 14,
    objetivo: 'PEYU recibe reportes ejecutivos automáticos y nosotros tenemos toda la observabilidad para detectar y resolver issues en <2h.',
    gate_salida: 'Reporte semanal ejecutivo entregado lunes 08:00 a Diego con KPIs vs baseline. Alertas en tiempo real configuradas. SLA de respuesta < 2h para issues críticos.',
    status: 'pending',
    items: [
      {
        title: 'Reporte semanal ejecutivo PDF (B2B + B2C unificado)',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Generar PDF con: ventas vs baseline contractual, top productos, conversion funnel, CAC por canal, leads B2B en pipeline, churn risk. Email lunes 08:00 a Diego.',
      },
      {
        title: 'Performance Fee Calculator en /admin/financiero',
        impact: 'critical',
        effort_hours: 1.5,
        owner: 'constructor',
        detail: 'Página que muestra mes a mes: ventas reales, baseline, delta, performance fee teórico (30% del exceso), tope mensual aplicado. Transparencia total para PEYU.',
      },
      {
        title: 'Centralizar alertas en /admin/alertas con severidad y owner',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Stock bajo, error de pago, lead caliente sin contactar +24h, propuesta venciendo, anomalía de tráfico. Cada alerta con dueño y SLA.',
      },
      {
        title: 'Sentry / error tracking productivo (logClientError ya existe)',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Agregar dashboard /admin/monitoreo-ia ya muestra errores client-side. Agregar agrupación por ruta + alerta si error rate > 1%.',
      },
      {
        title: 'Backup automático diario de todas las entidades a Drive',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'CRON diario 02:00: export JSON de Productos, Pedidos, Clientes, B2BLeads, Propuestas. Subir a Drive PEYU vía driveUploadFile. Retención 30 días.',
      },
    ],
  },

  {
    id: 't2-q5',
    track: 'T2',
    nombre: 'Q5 · Optimización de conversión y experiencia',
    semana: 'Mié 29 jul — Mar 11 ago',
    duracion_dias: 14,
    objetivo: 'Aumentar conversion rate B2C de visitante a pedido en +30% vs Q3. Reducir abandono carrito en -20%.',
    gate_salida: 'Conv rate B2C ≥ 1.5%. Cart abandonment recovery ≥ 18%. NPS B2B ≥ 50.',
    status: 'pending',
    items: [
      {
        title: 'A/B test landing principal (3 variantes con IA)',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Variantes: A (storytelling actual), B (foco precio + envío gratis), C (foco impacto ambiental). 33/33/33 split por 14 días. Ganador queda.',
      },
      {
        title: 'One-click buy para clientes recurrentes',
        impact: 'medium',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'OneClickBuyButton ya existe. Activar para clientes con perfil guardado (dirección + medio de pago). Reduce checkout de 5 pasos a 1 click.',
      },
      {
        title: 'Cross-sell post-compra B2C automático (cupón 48h)',
        impact: 'medium',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'crossSellPostCompra ya implementado. Activar CRON: 48h después de compra confirmada, email con 3 productos relacionados + cupón 10% expira en 48h.',
      },
      {
        title: 'Programa de referidos B2B con código único',
        impact: 'medium',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Cada cliente B2B activo recibe código personalizado. Si refiere una empresa que compra, comisión 8% automática (cupón canjeable en próxima compra).',
      },
      {
        title: 'NPS automático trimestral a clientes B2B activos',
        impact: 'medium',
        effort_hours: 0.3,
        owner: 'constructor',
        detail: 'npsTrimestralB2B ya implementado. Activar. Detractores (NPS < 7) entran a flujo de retención automática.',
      },
    ],
  },

  {
    id: 't2-q6',
    track: 'T2',
    nombre: 'Q6 · Validación pre-septiembre y proyección',
    semana: 'Mié 12 — Mar 25 agosto',
    duracion_dias: 14,
    objetivo: 'Confirmar que el sistema sostiene ritmo ≥ $20M/mes y proyectar septiembre con datos reales.',
    gate_salida: 'Run-rate de agosto ≥ $20M proyectado. Reporte forecast septiembre entregado a PEYU. Plan de contingencia si alguna métrica está fuera de banda.',
    status: 'pending',
    items: [
      {
        title: 'Análisis forecast IA: ¿llegamos a $20M en septiembre?',
        impact: 'critical',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Tomar data jun + jul + ago, proyectar sept con cockpitForesight. Si proyección < $20M, identificar palanca a empujar (más ads, más outbound B2B, push de gift cards corporativas).',
      },
      {
        title: 'Push outbound B2B: 50 empresas target identificadas con IA',
        impact: 'high',
        effort_hours: 2,
        owner: 'constructor + humano',
        detail: 'Pinecone + ICP analysis. Generar lista de 50 empresas que matchean perfil de clientes B2B existentes. Email personalizado con propuesta inicial.',
      },
      {
        title: 'Campaña gift cards corporativas para fin de año',
        impact: 'high',
        effort_hours: 1,
        owner: 'constructor',
        detail: 'Generar landing /b2b/gift-cards-fin-año + campaña Ads + email a base B2B inactiva. Septiembre es el mes para anclar pedidos de regalos corporativos para diciembre.',
      },
      {
        title: 'Stress test de infraestructura para Black Friday / CyberDay',
        impact: 'medium',
        effort_hours: 2,
        owner: 'constructor',
        detail: 'Simular 100 pedidos concurrentes. Verificar Base44 + MercadoPago + Bluex no se caen. Optimizar queries si hay timeouts.',
      },
      {
        title: 'Cierre de Q6 + reunión PEYU revisión pre-septiembre',
        impact: 'critical',
        effort_hours: 1,
        owner: 'humano + constructor',
        detail: 'Demo + Q&A con fundadores. Presentar resultados reales jun-ago vs baseline. Acordar metas y reporte de septiembre.',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // 🎯 GATE FINAL · SEPTIEMBRE 2026 (lun 01 — mar 30 sep)
  // ════════════════════════════════════════════════════════════════════

  {
    id: 't2-gate-sept',
    track: 'T2',
    nombre: 'GATE · Septiembre 2026 (mes de validación contractual)',
    semana: 'Lun 01 — Mar 30 septiembre',
    duracion_dias: 30,
    objetivo: 'Sostener ≥ $20M CLP en ventas (B2B + B2C consolidadas) durante septiembre. Esto activa el Performance Fee contractual.',
    gate_salida: 'Ventas septiembre ≥ $20M. Reporte mensual auditable entregado a PEYU primer día de octubre con desglose B2B/B2C, fuentes (Base44 + SII), CAC por canal y comparación vs baseline.',
    status: 'pending',
    items: [
      {
        title: 'Monitor diario de ventas vs meta (cockpit en vivo)',
        impact: 'critical',
        effort_hours: 0,
        owner: 'constructor (automático)',
        detail: 'Cockpit muestra cada día: ventas hoy, acumulado mes, gap vs meta diaria ($20M / 30 = $666k/día). Si gap > 20% en día 10, alerta + sugerencia de palanca.',
      },
      {
        title: 'Si gap detectado: push ads + push outbound B2B',
        impact: 'critical',
        effort_hours: 4,
        owner: 'humano + constructor',
        detail: 'Plan de contingencia: aumentar budget Ads, activar 2da ola outbound, descuento flash 48h en categorías estrella.',
      },
      {
        title: 'Reporte semanal a PEYU con avance vs meta',
        impact: 'high',
        effort_hours: 0.5,
        owner: 'constructor',
        detail: 'Cada lunes de septiembre: PDF con ventas semana, run-rate proyectado, palancas activadas, próximos pasos.',
      },
      {
        title: '1-oct · Cierre mensual + cálculo Performance Fee',
        impact: 'critical',
        effort_hours: 2,
        owner: 'humano + constructor',
        detail: 'Cierre auditable: ventas reales (Base44 + cruce SII), baseline, delta, fee según contrato. Entrega formal a PEYU.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Estado del proyecto HOY (27-may-2026, post-firma contrato)
// ─────────────────────────────────────────────────────────────────────
export const SNAPSHOT_HOY = {
  fecha: '2026-05-27',
  contexto: 'Contrato vigente como base. Avance pleno suspendido hasta septiembre 2026. Hasta entonces rige Acuerdo de Continuidad: $490.000 CLP/mes + setup diferido + performance fee sobre Fiestas Patrias.',
  hallazgos_criticos: [
    { tag: '🟩', titulo: 'Acuerdo de Continuidad firmado el 26-may', simple: 'Contrato base firme y vigente. Avance pleno suspendido hasta septiembre. Hasta entonces: operación mensual $490.000 CLP/mes activa desde la semana del 26-30 may.' },
    { tag: '🟩', titulo: 'Performance Fee con baseline claro = $20M brutos/mes', simple: 'Fórmula: (ventas reales − $20.000.000) × 10%. Aplica sobre B2B + B2C combinados (SII + web). Tope mensual: $8M (sobre exceso de $80M). Se activa con resultados de Fiestas Patrias 2026.' },
    { tag: '🟩', titulo: 'Setup de $13.080.024 CLP suspendido hasta septiembre', simple: 'Se autopaga con las cuotas mensuales de performance fee. Cuando la suma acumulada de fees iguale el setup, queda compensado e íntegramente saldado.' },
    { tag: '🟩', titulo: 'Estructura del sistema sólida y operativa', simple: 'Más de 130 funciones automáticas operando: pedidos, pagos MercadoPago, envíos Bluex (pendiente clave productiva), alertas, CRM B2B/B2C, reportes diarios.' },
    { tag: '🟩', titulo: 'Sistema antifraude protegiendo el negocio', simple: 'Bloqueó 2 pedidos falsos de $3.9M cada uno sin intervención humana. Motor de assessOrderRisk afinado y validado.' },
    { tag: '🟩', titulo: 'Catálogo migrado y SEO aplicado (70/70 productos)', simple: '566 URLs legacy reparadas, todas las imágenes activas en media.base44.com (CDN estable). Meta tags SEO aplicados a 70 productos activos.' },
    { tag: '🟩', titulo: '3 campañas Google Ads pre-armadas', simple: 'Search + Shopping + Demand Gen como borradores en /admin/ads-command. Listas para activar cuando los fundadores conecten cuenta Ads.' },
    { tag: '🟥', titulo: 'Clave productiva BlueExpress pendiente (BLOQUEANTE)', simple: 'Sin esto no podemos generar etiquetas reales. Plan B: Starken/Chilexpress en paralelo si Bluex no responde en 48h.' },
    { tag: '🟥', titulo: 'Anexo operativo de atribución pendiente (plazo: 30-jun-2026)', simple: 'Ambas partes deben acordar por escrito cómo se atribuyen las ventas B2B a la plataforma o agentes IA. Sin este anexo, el performance fee no puede calcularse correctamente en septiembre.' },
    { tag: '🟧', titulo: 'WhatsApp + Instagram pendientes de credenciales fundador', simple: 'Cuenta WhatsApp Business +56 9 3376 6573 (10 min escaneo QR) + credenciales Meta for Developers para Instagram auto-publicación. Necesarios al inicio del T1 (hito 2).' },
    { tag: '🟧', titulo: 'Jonny debe entregar fotos + descripciones + dimensiones', simple: 'Material original de los 69 productos activos: foto nombrada con nombre del producto, descripción 3-4 líneas, peso/dimensiones para Bluex. Sin esto Q1 del T2 se atrasa. Plazo: 16-jun.' },
    { tag: '🟧', titulo: '2 acciones SEO del fundador pendientes', simple: '(1) Subir archivo IndexNow al dominio (5 min). (2) Verificar peyuchile.cl en Search Console vía DNS (10 min). Bloquean el blast masivo de Q3.' },
    { tag: '🟨', titulo: 'Verificación de dominio en Resend para emails', simple: 'SPF/DKIM/DMARC en peyuchile.cl para que confirmaciones lleguen al inbox y no a spam. Hito 1 del T1 (jue 28-may).' },
    { tag: '🟨', titulo: 'Cockpit móvil con datos reales (no mocks)', simple: '/admin/movil ya existe pero falta cablear KPIs reales para la demo del 02-jun a Diego. Esa demo es la que libera el pago del setup.' },
  ],
  meta_contrato: {
    objetivo: 'Superar $20.000.000 CLP brutos/mes (B2B + B2C combinados) durante Fiestas Patrias 2026 (septiembre)',
    baseline: '$20.000.000 CLP brutos mensuales — fijado en contrato, no requiere cálculo histórico',
    performance_fee: '(ventas reales − $20M) × 10%. Tope mensual: $8M (sobre exceso de $80M)',
    operacion_mensual: '$490.000 CLP/mes activa desde semana 26-30 may 2026',
    setup_diferido: '$13.080.024 CLP IVA incluido · suspendido hasta sept · se autopaga vía performance fee acumulado',
    auditoria: 'Facturación SII + ventas web B2C + ventas B2B atribuibles. Anexo operativo de atribución a firmar antes del 30-jun-2026.',
    inversion_publicitaria_max: '$2.000.000 CLP/mes (todas las plataformas combinadas)',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Helpers para componentes React (Cockpit, LaunchRoadmap pages)
// ─────────────────────────────────────────────────────────────────────
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

export function getTrackStats(trackId) {
  const phases = LAUNCH_ROADMAP.filter(p => p.track === trackId);
  let total = 0;
  let done = 0;
  phases.forEach(p => {
    p.items.forEach(it => {
      total++;
      if (it.status === 'done') done++;
    });
  });
  return { total, done, phases: phases.length, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
}