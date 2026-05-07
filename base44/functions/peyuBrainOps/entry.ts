// ============================================================================
// peyuBrainOps · Operational Brain
// ----------------------------------------------------------------------------
// Responde preguntas operacionales con data REAL en vivo (no RAG vectorial).
// Cruza entidades (PedidoWeb, B2BLead, Consulta, AILog, Envio, etc.) y devuelve
// una respuesta narrativa + métricas estructuradas.
//
// Uso desde frontend (BrainConsole / Peyu en Centro de Comando):
//   base44.functions.invoke('peyuBrainOps', { query: '¿cuántos leads llegaron hoy?' })
//
// Devuelve: { ok, answer (markdown), metrics, sources }
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const fmt = (n) => '$' + (n || 0).toLocaleString('es-CL');
const todayISO = () => new Date().toISOString().slice(0, 10);
const startOfDay = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };
const daysAgoISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d.toISOString(); };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validar autenticación SIN tocar la entidad User (que requiere permisos de admin para leer).
    // isAuthenticated() solo verifica el token de sesión y NO falla con 401/403.
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query = '' } = await req.json();
    const q = query.toLowerCase().trim();
    const today = todayISO();
    const since24h = startOfDay();
    const since7d = daysAgoISO(7);

    // ── Cargar data viva en paralelo ────────────────────────────────────────
    const [pedidos, leads, consultas, ailogs, envios, propuestas, productos] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 200),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 100),
      base44.asServiceRole.entities.Consulta.list('-created_date', 100),
      base44.asServiceRole.entities.AILog.list('-created_date', 200),
      base44.asServiceRole.entities.Envio.list('-created_date', 100),
      base44.asServiceRole.entities.CorporateProposal.list('-created_date', 100),
      base44.asServiceRole.entities.Producto.filter({ activo: true }, null, 500),
    ]);

    // ── Filtros temporales ──────────────────────────────────────────────────
    const isToday = (d) => d && (new Date(d) >= new Date(since24h));
    const isLast7d = (d) => d && (new Date(d) >= new Date(since7d));

    // ── Métricas estructuradas (siempre se devuelven) ──────────────────────
    const pedidosHoy = pedidos.filter(p => p.fecha === today || isToday(p.created_date));
    const pedidosPagadosHoy = pedidosHoy.filter(p => !['Nuevo', 'Cancelado'].includes(p.estado));
    const pedidosEntregados = pedidos.filter(p => p.estado === 'Entregado');
    const pedidosEntregadosHoy = pedidosEntregados.filter(p => isToday(p.updated_date));
    const pedidosEnProduccion = pedidos.filter(p => p.estado === 'En Producción').length;
    const pedidosListos = pedidos.filter(p => p.estado === 'Listo para Despacho').length;
    const pedidosDespachados = pedidos.filter(p => p.estado === 'Despachado').length;

    const leadsHoy = leads.filter(l => isToday(l.created_date));
    const leadsCalientes = leads.filter(l => (l.lead_score || 0) >= 70 && !['Aceptado', 'Perdido'].includes(l.status));
    const leadsActivos = leads.filter(l => !['Aceptado', 'Perdido'].includes(l.status));

    const consultasHoy = consultas.filter(c => isToday(c.created_date));
    const consultasSinResponder = consultas.filter(c => c.estado === 'Sin responder');

    const chatsHoy = ailogs.filter(a => isToday(a.created_date) && a.task_type === 'chat');
    const conversacionesUnicas = new Set(chatsHoy.map(c => c.conversation_id).filter(Boolean)).size;

    const enviosEnTransito = envios.filter(e => ['En Tránsito', 'En Reparto'].includes(e.estado)).length;
    const enviosConExcepcion = envios.filter(e => e.tiene_excepcion).length;
    const enviosEntregadosHoy = envios.filter(e => e.estado === 'Entregado' && isToday(e.fecha_entrega_real));

    const propuestasPendientes = propuestas.filter(p => p.status === 'Enviada').length;
    const propuestasAceptadasHoy = propuestas.filter(p => p.status === 'Aceptada' && isToday(p.updated_date)).length;

    const stockBajo = productos.filter(p => typeof p.stock_actual === 'number' && p.stock_actual < 10);

    const ingresosHoy = pedidosHoy.reduce((s, p) => s + (p.total || 0), 0);
    const ingresos7d = pedidos.filter(p => isLast7d(p.created_date)).reduce((s, p) => s + (p.total || 0), 0);

    const metrics = {
      pedidos_hoy: pedidosHoy.length,
      pedidos_pagados_hoy: pedidosPagadosHoy.length,
      pedidos_entregados_total: pedidosEntregados.length,
      pedidos_entregados_hoy: pedidosEntregadosHoy.length,
      pedidos_en_produccion: pedidosEnProduccion,
      pedidos_listos: pedidosListos,
      pedidos_despachados: pedidosDespachados,
      ingresos_hoy: ingresosHoy,
      ingresos_7d: ingresos7d,
      leads_hoy: leadsHoy.length,
      leads_calientes: leadsCalientes.length,
      leads_activos: leadsActivos.length,
      consultas_hoy: consultasHoy.length,
      consultas_sin_responder: consultasSinResponder.length,
      chats_peyu_hoy: chatsHoy.length,
      conversaciones_hoy: conversacionesUnicas,
      envios_en_transito: enviosEnTransito,
      envios_con_excepcion: enviosConExcepcion,
      envios_entregados_hoy: enviosEntregadosHoy.length,
      propuestas_pendientes: propuestasPendientes,
      propuestas_aceptadas_hoy: propuestasAceptadasHoy,
      stock_bajo: stockBajo.length,
    };

    // ── Pattern matching para construir respuesta narrativa ────────────────
    const matches = (kw) => kw.some(k => q.includes(k));

    let answer = '';
    const sources = [];

    if (matches(['lead', 'b2b', 'prospecto'])) {
      answer = `## 🎯 Leads B2B\n\n` +
        `- **Hoy**: ${leadsHoy.length} leads nuevos\n` +
        `- **Calientes (score ≥70)**: ${leadsCalientes.length}\n` +
        `- **Activos totales**: ${leadsActivos.length}\n\n` +
        (leadsHoy.length > 0
          ? `**Últimos hoy:**\n${leadsHoy.slice(0, 3).map(l => `- **${l.company_name || 'sin nombre'}** · ${l.contact_name || 'N/A'} · score ${l.lead_score || 0}`).join('\n')}`
          : '_Sin leads hoy._');
      sources.push('B2BLead');
    } else if (matches(['consulta', 'chat público', 'whatsapp', 'mensaje'])) {
      answer = `## 💬 Consultas\n\n` +
        `- **Hoy**: ${consultasHoy.length} consultas\n` +
        `- **Sin responder**: ${consultasSinResponder.length}\n\n` +
        (consultasHoy.length > 0
          ? `**Recientes:**\n${consultasHoy.slice(0, 3).map(c => `- **${c.nombre}** · ${c.canal} · ${c.calidad || 'sin clasificar'}`).join('\n')}`
          : '_Sin consultas hoy._');
      sources.push('Consulta');
    } else if (matches(['conversaci', 'agente', 'peyu chat', 'asistente'])) {
      answer = `## 🤖 Conversaciones con Peyu (chat público)\n\n` +
        `- **Mensajes hoy**: ${chatsHoy.length}\n` +
        `- **Conversaciones únicas hoy**: ${conversacionesUnicas}\n\n` +
        `Las conversaciones se ven en **Centro de Comando → Conversaciones en vivo** o directo en /admin/monitoreo-ia`;
      sources.push('AILog');
    } else if (matches(['entreg', 'envío', 'envio', 'despach', 'tracking'])) {
      answer = `## 📦 Envíos & Entregas\n\n` +
        `- **Entregados hoy**: ${enviosEntregadosHoy.length}\n` +
        `- **En tránsito**: ${enviosEnTransito}\n` +
        `- **Con excepción**: ${enviosConExcepcion}\n` +
        `- **Pedidos listos para despacho**: ${pedidosListos}\n` +
        `- **Pedidos despachados (total)**: ${pedidosDespachados}\n` +
        `- **Pedidos entregados (total)**: ${pedidosEntregados.length}`;
      sources.push('Envio', 'PedidoWeb');
    } else if (matches(['pedido', 'venta', 'orden b2c', 'compra'])) {
      answer = `## 🛒 Pedidos B2C\n\n` +
        `- **Hoy**: ${pedidosHoy.length} pedidos · ${fmt(ingresosHoy)}\n` +
        `- **Pagados hoy**: ${pedidosPagadosHoy.length}\n` +
        `- **En producción**: ${pedidosEnProduccion}\n` +
        `- **Listos para despachar**: ${pedidosListos}\n` +
        `- **Últimos 7 días**: ${fmt(ingresos7d)}\n\n` +
        (pedidosHoy.length > 0
          ? `**Hoy:**\n${pedidosHoy.slice(0, 3).map(p => `- ${p.numero_pedido || p.id?.slice(-6)} · ${p.cliente_nombre} · ${fmt(p.total)} · ${p.estado}`).join('\n')}`
          : '_Sin pedidos hoy._');
      sources.push('PedidoWeb');
    } else if (matches(['propuesta', 'cotizaci'])) {
      answer = `## 📄 Propuestas Corporativas\n\n` +
        `- **Pendientes (enviadas sin respuesta)**: ${propuestasPendientes}\n` +
        `- **Aceptadas hoy**: ${propuestasAceptadasHoy}`;
      sources.push('CorporateProposal');
    } else if (matches(['stock', 'inventario', 'sin stock'])) {
      answer = `## 📦 Stock\n\n` +
        `- **SKUs con stock <10u**: ${stockBajo.length}\n\n` +
        (stockBajo.length > 0
          ? `**Más críticos:**\n${stockBajo.slice(0, 5).map(p => `- **${p.sku}** · ${p.nombre} · ${p.stock_actual}u`).join('\n')}`
          : '_Stock OK en todos los productos._');
      sources.push('Producto');
    } else if (matches(['resumen', 'estado', 'cómo va', 'como va', 'kpi', 'hoy', 'general'])) {
      // Resumen general
      answer = `## ☀️ Resumen del día · ${new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n` +
        `**🛒 Ventas B2C**\n` +
        `- ${pedidosHoy.length} pedidos hoy · ${fmt(ingresosHoy)}\n` +
        `- ${pedidosEntregadosHoy.length} entregados hoy · ${pedidosEnProduccion} en producción\n\n` +
        `**🎯 Pipeline B2B**\n` +
        `- ${leadsHoy.length} leads nuevos hoy (${leadsCalientes.length} calientes)\n` +
        `- ${propuestasPendientes} propuestas pendientes de respuesta\n\n` +
        `**💬 Conversaciones**\n` +
        `- ${consultasHoy.length} consultas nuevas\n` +
        `- ${conversacionesUnicas} conversaciones con Peyu\n\n` +
        `**📦 Logística**\n` +
        `- ${enviosEnTransito} envíos en tránsito · ${enviosConExcepcion} con problema\n\n` +
        (stockBajo.length > 0 ? `⚠️ **Atención**: ${stockBajo.length} SKUs con stock bajo\n` : '') +
        (consultasSinResponder.length > 0 ? `⚠️ **${consultasSinResponder.length} consultas sin responder**` : '');
      sources.push('multiple');
    } else {
      // Fallback: dar resumen
      answer = `No identifiqué exactamente qué métrica buscas, pero acá está el resumen del día:\n\n` +
        `- **${pedidosHoy.length}** pedidos hoy · ${fmt(ingresosHoy)}\n` +
        `- **${leadsHoy.length}** leads B2B hoy\n` +
        `- **${consultasHoy.length}** consultas hoy\n` +
        `- **${conversacionesUnicas}** conversaciones con Peyu\n` +
        `- **${enviosEntregadosHoy.length}** envíos entregados hoy\n` +
        `- **${enviosEnTransito}** en tránsito\n\n` +
        `_Pregunta más específico: "leads hoy", "pedidos en producción", "envíos con problema", "conversaciones", "stock"._`;
      sources.push('multiple');
    }

    return Response.json({ ok: true, answer, metrics, sources, query });
  } catch (error) {
    console.error('peyuBrainOps error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});