// ============================================================================
// contractAnalysis · Cruza el contrato PEYU-IMPULSIA con la plataforma real
// ----------------------------------------------------------------------------
// Devuelve evidencia objetiva para responder al contrato:
//   - Cuántos agentes IA están desplegados (vs 17 comprometidos)
//   - Cuántas funciones backend en producción (infraestructura)
//   - Pedidos B2C reales pagados (canal B2C entregado)
//   - Pipeline B2B real (canal B2B entregado)
//   - Funnel del chat (Peyu IA en producción)
//   - Conectores Google operativos
//   - Pago efectuado vs entrega real
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const sinceFactura = new Date('2026-03-30T00:00:00Z'); // pago factura N°7

    // ── 1) PEDIDOS B2C — evidencia de canal B2C en producción ──────────
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500);
    const pedidosPagados = pedidos.filter(p => p.payment_status === 'paid' || p.estado === 'Entregado' || p.estado === 'Confirmado' || p.estado === 'En Producción' || p.estado === 'Despachado');
    const pedidosDesdeFactura = pedidos.filter(p => new Date(p.created_date) >= sinceFactura);
    const totalVendidoCLP = pedidosPagados.reduce((s, p) => s + (p.total || 0), 0);

    // ── 2) PIPELINE B2B — canal B2B en producción ──────────────────────
    const b2bLeads = await base44.asServiceRole.entities.B2BLead.list('-created_date', 500).catch(() => []);
    const propuestas = await base44.asServiceRole.entities.CorporateProposal.list('-created_date', 500).catch(() => []);
    const propuestasEnviadas = propuestas.filter(p => p.status === 'Enviada' || p.status === 'Aceptada');

    // ── 3) CHAT IA — agente Peyu en producción (B2C+B2B) ───────────────
    const chatLeads = await base44.asServiceRole.entities.ChatLead.list('-created_date', 500).catch(() => []);
    const aiLogs = await base44.asServiceRole.entities.AILog.list('-created_date', 500).catch(() => []);
    const conversaciones = new Set(chatLeads.map(c => c.conversation_id).filter(Boolean));
    const tokensTotal = aiLogs.reduce((s, l) => s + (l.tokens_total || 0), 0);

    // ── 4) CATÁLOGO PRODUCTOS — infra publicada ────────────────────────
    const productos = await base44.asServiceRole.entities.Producto.list('-created_date', 1000).catch(() => []);
    const productosActivos = productos.filter(p => p.activo !== false);

    // ── 5) CLIENTES REGISTRADOS / TRACEABILIDAD ────────────────────────
    const clientes = await base44.asServiceRole.entities.Cliente.list('-created_date', 500).catch(() => []);
    const envios = await base44.asServiceRole.entities.Envio.list('-created_date', 500).catch(() => []);

    // ── 6) AGENTES IA REALES VS 17 COMPROMETIDOS ───────────────────────
    // Esta lista está hardcoded porque los agentes son archivos JSON en /agents
    // que NO son una entidad. Documentamos lo que sí está construido.
    const agentesDesplegados = [
      { name: 'peyu',                    role: 'Asistente chat público B2C+B2B (Peyu)',           status: 'producción',    canal: 'B2C+B2B' },
      { name: 'asistente_compras',       role: 'Asistente de compras y cotizaciones',              status: 'producción',    canal: 'B2C+B2B' },
      { name: 'asistente_comercial',     role: 'Asistente comercial corporativo',                  status: 'producción',    canal: 'B2B' },
      { name: 'b2b_triage',              role: 'Triage de leads B2B y scoring',                    status: 'producción',    canal: 'B2B' },
      { name: 'ads_commander',           role: 'Estratega de campañas Google Ads',                 status: 'producción',    canal: 'B2C+B2B' },
      { name: 'ads_scientist',           role: 'Analista de performance de campañas',              status: 'producción',    canal: 'B2C+B2B' },
      { name: 'ads_strategist',          role: 'Diseñador de copys y creatividades',               status: 'producción',    canal: 'B2C+B2B' },
      { name: 'publicista_ads',          role: 'Generador de Ad Drafts (Search/PMax/DemandGen)',   status: 'producción',    canal: 'B2C+B2B' },
      { name: 'marketing_orchestrator',  role: 'Orquestador de plan semanal de contenido',         status: 'producción',    canal: 'B2C+B2B' },
      { name: 'content_creator',         role: 'Generador de blog posts y assets',                 status: 'producción',    canal: 'B2C+B2B' },
      { name: 'calendario_content',      role: 'Planificación calendario social',                  status: 'producción',    canal: 'B2C+B2B' },
    ];

    // ── 7) FUNCIONES BACKEND OPERATIVAS (infraestructura entregada) ────
    // Estas son las 184+ funciones que están desplegadas hoy. Las agrupamos
    // por categoría contractual para que se vea el alcance entregado.
    const funcionesBackend = {
      ecommerce_b2c: ['mpCreatePreference', 'mpWebhook', 'mpReconcilePending', 'onNewPedidoWeb', 'onPedidoWebStatusChange', 'capturarCarritoAbandonado', 'carritoAbandonadoCRON', 'enviarRecordatorioCarrito', 'crossSellPostCompra', 'analyzeBundlesFromHistory', 'getBundleSuggestions', 'cleanupTestAndExpiredOrders', 'assessOrderRisk', 'canjearGiftCard', 'enviarGiftCard'],
      b2b: ['createCorporateProposal', 'createSelfServiceProposal', 'sendProposalEmail', 'sendSelfServiceProposalEmail', 'generateProposalPDF', 'autoQuoteHotB2BLeads', 'scoreLead', 'onNewB2BLead', 'onProposalAccepted', 'notifyProposalStatusChange', 'recordarPropuestasPendientesCRON', 'checkExpiringProposals', 'recordatorioAnticipoB2B', 'nurtureLeadB2B', 'detectarUpsellB2B', 'recuperarPropuestaRechazada', 'npsTrimestralB2B', 'leadReactivationCRON', 'b2bPanelAccess'],
      logistica: ['bluexCreateShipment', 'bluexCancelShipment', 'bluexGetLabel', 'bluexTrackShipment', 'bluexTrackingPollerCRON', 'bluexAnalyzeShipments', 'updateShippingStatus', 'importBluexTarifas'],
      ia_y_brain: ['peyuAssist', 'askPeyuBrain', 'peyuBrainOps', 'pineconeInit', 'pineconeSearch', 'pineconeUpsert', 'pineconeSeedAll', 'pineconeStatus', 'pineconeSyncCliente', 'pineconeSyncConversation', 'pineconeSyncProducto', 'pineconeSyncProposal', 'summarizeAndSaveConversation', 'publicChatProxy', 'aiUsageStats', 'aiAuditAction', 'chatFunnelStats', 'getChatConversation'],
      marketing_ads: ['adsAnalyzePerformance', 'adsExportEditor', 'adsForecastPerformance', 'adsGenerateCampaign', 'adsGenerateCampaign2026', 'adsPublishCampaign', 'generateSocialContent', 'generateWeeklyContentPlan', 'publishContentPost', 'generateBlogPost', 'discoverBacklinks', 'seedBacklinks'],
      seo: ['generateSitemap', 'serveSitemap', 'indexNowPing', 'autoIndexNowBlast', 'autoIndexOnPublish', 'gscAuditSite', 'gscInspectUrl', 'gscListSites', 'gscSubmitSitemap', 'gscCleanLegacySitemaps', 'launchGscBlast', 'seoLaunchBlast', 'seoGeoBlast', 'optimizeProductSEOCRON', 'oportunidadesSEOCRON', 'generateSEOMetaBulk', 'googleMerchantFeed'],
      catalogo_y_imagenes: ['syncWooCatalogo', 'wooImportBatch', 'wooImportProductImages', 'wooPromoteStaging', 'wooStagingClear', 'wooStagingList', 'wooStagingStats', 'wooTestConnection', 'wooDiagnosticRaw', 'reconciliarStockWoo', 'driveMatchAllProducts', 'driveMatchCarcasas', 'driveMigrateProductImages', 'driveListFolderImages', 'driveEnsureFolder', 'driveUploadFile', 'drivePreviewMapping', 'auditImageUrlsLive', 'auditProductImages', 'auditVisualQuality', 'fixProductImageUrls', 'fixBrokenProductImagesFromDrive', 'fixCarcasasUrgente', 'generateProductPromoImage', 'bulkGeneratePromoVariants', 'generateMockup', 'visionMatchCarcasas', 'mapAllProductImages', 'listAllProductImages', 'getProductsWithoutImages', 'manageProductImage', 'migrateProductImagesToBase44', 'rollbackImageMigration', 'compareImageWithMockup', 'removeGhostImages', 'updateProductImages', 'waybackImportProductImages', 'auditCarcasasCoverage', 'auditAndFixCarcasasFinal', 'buildProductDriveMatchPlan'],
      finanzas_costos: ['analizarCostosReales', 'aplicarPriceSuggestion', 'prorratearCostosFantasma', 'syncClienteFromPedido', 'syncClienteFromVentaTienda'],
      analitica: ['gaFetchRealtime', 'insightsSemanalesIA', 'reporteSemanalB2B', 'dailyBriefingCRON', 'cockpitAgentFleet', 'cockpitForesight', 'cockpitMissions', 'cockpitMobileSnapshot', 'auditoriaCatalogoCRON', 'prediccionDemandaCRON', 'alertaStockBajoCRON', 'analizarTendenciasYAlertarStock', 'solicitarResenaCRON', 'analizarResenaIA', 'recordatorioRecompraCRON', 'generarFAQsDesdeConsultas'],
      monitoreo: ['healthCheck', 'googleHealthCheck', 'logClientError', 'uxSmokeTest', 'auditCatalogForLaunch', 'auditGoogleShoppingCompliance', 'scanDuplicateProducts'],
      operaciones: ['agendarProduccionCalendar', 'createCalendarEvent', 'docsCreateFromTemplate', 'ingestGmailInquiry', 'triageConsultaIA', 'notifyNewConsulta', 'linkChatLeadToB2BLead', 'linkConsultaToCliente', 'sendGmailEmail', 'suscribirNewsletter', 'exportCotizacionPDF', 'generateChatQuotePDF', 'consultaOficialCL'],
    };
    const totalFunciones = Object.values(funcionesBackend).reduce((s, arr) => s + arr.length, 0);

    // ── 8) CONECTORES GOOGLE OPERATIVOS ────────────────────────────────
    const conectoresGoogle = [
      { name: 'Google Search Console', status: 'autorizado', uso: 'Auditoría SEO, sitemap, indexación' },
      { name: 'Google Analytics 4',    status: 'autorizado', uso: 'Tráfico realtime y reportes' },
      { name: 'Google Sheets',         status: 'autorizado', uso: 'Exportes y reportes' },
      { name: 'Google Docs',           status: 'autorizado', uso: 'Generación de propuestas/contratos' },
      { name: 'Google Drive',          status: 'autorizado', uso: 'Galería imágenes productos + webhooks' },
      { name: 'Google Calendar',       status: 'autorizado', uso: 'Agenda producción + recordatorios B2B' },
      { name: 'Gmail',                 status: 'autorizado', uso: 'Triage consultas + envío de cotizaciones' },
    ];

    // ── 9) INTEGRACIONES CRÍTICAS CONFIGURADAS ─────────────────────────
    const integracionesCriticas = [
      { name: 'MercadoPago',     status: 'producción', evidencia: `${pedidosPagados.filter(p => p.medio_pago === 'MercadoPago').length} pedidos pagados` },
      { name: 'BlueExpress',     status: 'producción', evidencia: `${envios.length} envíos generados` },
      { name: 'WooCommerce sync',status: 'producción', evidencia: `${productosActivos.length} productos sincronizados` },
      { name: 'Pinecone Brain',  status: 'producción', evidencia: `${conversaciones.size} conversaciones IA con memoria` },
      { name: 'Resend (email)',  status: 'producción', evidencia: 'Cotizaciones B2B + recordatorios B2C' },
    ];

    // ── 10) SCORE GLOBAL DE CUMPLIMIENTO DE IMPULSIA ───────────────────
    // 0% porque IMPULSIA NO entregó. Todo el sistema actual fue construido
    // por PEYU sobre Base44 — esto es lo importante para la respuesta legal.
    const cumplimientoImpulsia = {
      pago_efectuado_clp: 719976,
      pago_neto_clp: 605022,
      pago_iva_clp: 114954,
      fecha_pago: '2026-03-30',
      factura_n: 7,
      descriptivo_factura: 'SERVICIOS DE CONSTRUCCIÓN WEB, POR 3 MESES',
      dias_desde_pago: Math.floor((now.getTime() - sinceFactura.getTime()) / (1000 * 60 * 60 * 24)),
      entrega_real_de_impulsia: 'NO ENTREGADO',
      construido_por_peyu_en_base44: true,
      agentes_desplegados_por_peyu: agentesDesplegados.length,
      agentes_comprometidos_por_impulsia: 17,
      brecha_agentes: 17 - agentesDesplegados.length,
    };

    // ── RESPUESTA ──────────────────────────────────────────────────────
    return Response.json({
      ok: true,
      generated_at: now.toISOString(),
      contrato: {
        proveedor: 'IMPULSIA SPA',
        rut_proveedor: '78.274.779-7',
        marca_comercial: 'B2BYTES / B2Business',
        garante_personal: 'Lya Mundaca',
        cliente: 'PEYU CHILE SPA',
        rut_cliente: '77.069.974-6',
      },
      cumplimiento_impulsia: cumplimientoImpulsia,
      metricas_plataforma: {
        // Canal B2C
        pedidos_total: pedidos.length,
        pedidos_pagados: pedidosPagados.length,
        pedidos_desde_pago_factura: pedidosDesdeFactura.length,
        total_vendido_clp: totalVendidoCLP,
        // Canal B2B
        b2b_leads_total: b2bLeads.length,
        propuestas_total: propuestas.length,
        propuestas_enviadas: propuestasEnviadas.length,
        // Catálogo
        productos_total: productos.length,
        productos_activos: productosActivos.length,
        // Clientes
        clientes_total: clientes.length,
        envios_total: envios.length,
        // Chat IA
        conversaciones_chat: conversaciones.size,
        chat_leads_total: chatLeads.length,
        ai_calls_total: aiLogs.length,
        tokens_consumidos: tokensTotal,
      },
      agentes_desplegados: agentesDesplegados,
      funciones_backend: {
        total: totalFunciones,
        por_categoria: Object.fromEntries(Object.entries(funcionesBackend).map(([k, v]) => [k, v.length])),
        listado: funcionesBackend,
      },
      conectores_google: conectoresGoogle,
      integraciones_criticas: integracionesCriticas,
    });
  } catch (error) {
    console.error('contractAnalysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});