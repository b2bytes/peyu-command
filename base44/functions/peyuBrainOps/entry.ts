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
const mapCliente = (c) => ({
  id: c.id, empresa: c.empresa, contacto: c.contacto, email: c.email,
  telefono: c.telefono, rut: c.rut, tipo: c.tipo, segmento: c.segmento,
  estado: c.estado, total_compras_clp: c.total_compras_clp, num_pedidos: c.num_pedidos,
  ticket_promedio: c.ticket_promedio, nps_score: c.nps_score, sku_favorito: c.sku_favorito,
  canal_preferido: c.canal_preferido, pagos_al_dia: c.pagos_al_dia,
  fecha_ultima_compra: c.fecha_ultima_compra, proximo_recontacto: c.proximo_recontacto,
  notas: c.notas, created_date: c.created_date,
});
// Fechas en HORA CHILE (no UTC del servidor). Antes "hoy" se calculaba en UTC
// (4h adelantado): las ventas de la tarde/noche chilena caían en "mañana" y el
// agente reportaba $0 o datos desfasados. chileDate() normaliza todo a
// America/Santiago en formato YYYY-MM-DD comparable.
const TZ = 'America/Santiago';
const chileDate = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validar autenticación SIN tocar la entidad User (que requiere permisos de admin para leer).
    // isAuthenticated() solo verifica el token de sesión y NO falla con 401/403.
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query = '' } = await req.json();
    const q = query.toLowerCase().trim();
    const today = chileDate(new Date());
    const hace7d = chileDate(new Date(Date.now() - 7 * 86400000));

    // ── Cargar data viva en paralelo ────────────────────────────────────────
    const [pedidos, leads, consultas, ailogs, envios, propuestas, productos, clientes] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 200),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 100),
      base44.asServiceRole.entities.Consulta.list('-created_date', 300),
      base44.asServiceRole.entities.AILog.list('-created_date', 200),
      base44.asServiceRole.entities.Envio.list('-created_date', 100),
      base44.asServiceRole.entities.CorporateProposal.list('-created_date', 100),
      base44.asServiceRole.entities.Producto.filter({ activo: true }, null, 500),
      base44.asServiceRole.entities.Cliente.list('-created_date', 150).catch(() => []),
    ]);

    // ── Filtros temporales (en hora Chile) ─────────────────────────────────
    const isToday = (d) => d && chileDate(d) === today;
    const isLast7d = (d) => d && chileDate(d) >= hace7d;

    // Venta REAL: pagada (payment_status) o ya avanzada en el flujo operativo.
    // Antes ingresos_hoy sumaba pedidos sin pagar, cancelados y expirados —
    // por eso el agente no cuadraba con las ventas reales.
    const esVentaReal = (p) =>
      p.payment_status === 'paid' ||
      (!['Cancelado', 'Reembolsado', 'Nuevo'].includes(p.estado) &&
        !['expired', 'failed', 'refunded'].includes(p.payment_status || ''));

    // ── Métricas estructuradas (siempre se devuelven) ──────────────────────
    const pedidosHoy = pedidos.filter(p => p.fecha === today || isToday(p.created_date));
    const pedidosPagadosHoy = pedidosHoy.filter(esVentaReal);
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

    // Clientes: nuevos (recién registrados) vs top compradores históricos.
    const clientesNuevos = clientes || []; // ya vienen ordenados por -created_date
    const clientesNuevos7d = clientesNuevos.filter(c => isLast7d(c.created_date));
    const clientesTop = [...clientesNuevos].sort((a, b) => (b.total_compras_clp || 0) - (a.total_compras_clp || 0));

    // Enriquecimiento REAL: muchos Cliente tienen KPIs vacíos (num_pedidos=0,
    // sin ticket). Cruzamos con PedidoWeb por email para mostrar data viva.
    const pedidosPorEmail = {};
    for (const p of pedidos) {
      const em = (p.cliente_email || '').toLowerCase().trim();
      if (!em) continue;
      (pedidosPorEmail[em] = pedidosPorEmail[em] || []).push(p);
    }
    const mapClienteRich = (c) => {
      const ps = pedidosPorEmail[(c.email || '').toLowerCase().trim()] || [];
      const validos = ps.filter(p => !['Cancelado', 'Reembolsado'].includes(p.estado));
      const totalReal = validos.reduce((s, p) => s + (p.total || 0), 0);
      const ult = ps[0];
      const numPedidos = Math.max(c.num_pedidos || 0, validos.length);
      const totalCompras = Math.max(c.total_compras_clp || 0, totalReal);
      return {
        ...mapCliente(c),
        num_pedidos: numPedidos,
        total_compras_clp: totalCompras,
        ticket_promedio: c.ticket_promedio || (numPedidos ? Math.round(totalCompras / numPedidos) : null),
        fecha_ultima_compra: c.fecha_ultima_compra || (ult ? (ult.fecha || (ult.created_date || '').slice(0, 10)) : null),
        ultimo_pedido: ult ? {
          id: ult.id, numero: ult.numero_pedido, estado: ult.estado,
          total: ult.total, items: (ult.descripcion_items || '').slice(0, 80),
        } : null,
      };
    };

    // Ingresos = solo ventas reales (pagadas/operativas), en hora Chile.
    const ingresosHoy = pedidosHoy.filter(esVentaReal).reduce((s, p) => s + (p.total || 0), 0);
    const ingresos7d = pedidos
      .filter(p => isLast7d(p.fecha || p.created_date) && esVentaReal(p))
      .reduce((s, p) => s + (p.total || 0), 0);

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
      clientes_total: clientesNuevos.length,
      clientes_nuevos_7d: clientesNuevos7d.length,
    };

    // ── Listas REALES (no solo números) para que el agente muestre tarjetas ──
    // Esto arregla el bug "dice que tiene 2 consultas pendientes pero no las dice":
    // ahora devolvemos los registros concretos para hidratar las tarjetas.
    const lists = {
      // Historial COMPLETO de consultas sin responder (no truncamos a 8).
      // El founder pidió ver todo el historial pendiente de forma persistente.
      consultas_pendientes: consultasSinResponder.slice(0, 50).map(c => ({
        id: c.id, nombre: c.nombre, email: c.email, telefono: c.telefono,
        canal: c.canal, mensaje: c.mensaje || c.consulta || c.descripcion || '',
        calidad: c.calidad, created_date: c.created_date,
      })),
      // Pipeline COMPLETO de pedidos en curso (hasta 40) con todos los campos que
      // necesitan el PipelineCard y el agente para no inventar: estado de pago,
      // tracking, fecha. Antes truncaba a 8 → el agente "no veía" pedidos reales.
      pedidos_pendientes: pedidos
        .filter(p => !['Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado))
        .slice(0, 40)
        .map(p => ({
          id: p.id, numero_pedido: p.numero_pedido, cliente_nombre: p.cliente_nombre,
          cliente_email: p.cliente_email, total: p.total, estado: p.estado,
          medio_pago: p.medio_pago, tracking: p.tracking, ciudad: p.ciudad,
          payment_status: p.payment_status || '', fecha: p.fecha || (p.created_date || '').slice(0, 10),
        })),
      leads_top: leadsActivos.slice(0, 8).map(l => ({
        id: l.id, company_name: l.company_name, contact_name: l.contact_name,
        email: l.email, phone: l.phone, lead_score: l.lead_score, status: l.status,
        product_interest: l.product_interest, qty_estimate: l.qty_estimate,
      })),
      propuestas_pendientes_list: propuestas.filter(p => p.status === 'Enviada').slice(0, 8).map(p => ({
        id: p.id, numero: p.numero, empresa: p.empresa, contacto: p.contacto,
        email: p.email, total: p.total, status: p.status,
      })),
      stock_bajo_list: stockBajo.slice(0, 10).map(p => ({
        id: p.id, sku: p.sku, nombre: p.nombre, stock_actual: p.stock_actual,
      })),
      // Envíos BlueExpress: activos primero (excepciones arriba), para la
      // tarjeta de logística embebida en el agente — sin salir de la vista.
      envios_list: envios
        .filter(e => !['Entregado', 'Anulado', 'Devuelto'].includes(e.estado))
        .sort((a, b) => (b.tiene_excepcion ? 1 : 0) - (a.tiene_excepcion ? 1 : 0))
        .slice(0, 10)
        .map(e => ({
          id: e.id, pedido_id: e.pedido_id, tracking_number: e.tracking_number, numero_pedido: e.numero_pedido,
          cliente_nombre: e.cliente_nombre, estado: e.estado, comuna_destino: e.comuna_destino,
          courier: e.courier, tiene_excepcion: e.tiene_excepcion,
          tiene_etiqueta: !!(e.label_url || e.label_base64),
          ultimo_evento_descripcion: e.ultimo_evento_descripcion,
          fecha_entrega_estimada: e.fecha_entrega_estimada,
          tracking_url: e.tracking_url, label_url: e.label_url, atrasado: e.atrasado,
        })),
      // vCard inteligente: TODA la info del cliente para la página agente.
      // clientes_top = mejores compradores históricos · clientes_nuevos = últimos registrados.
      clientes_top: clientesTop.slice(0, 12).map(mapClienteRich),
      clientes_nuevos: clientesNuevos.slice(0, 12).map(mapClienteRich),
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
    } else if (matches(['cliente', 'comprador'])) {
      const quiereNuevos = matches(['nuevo', 'nueva', 'recien', 'recién', 'últim', 'ultim']);
      const listaC = quiereNuevos ? clientesNuevos : clientesTop;
      answer = `## 👥 Clientes\n\n` +
        `- **Total registrados**: ${clientesNuevos.length}\n` +
        `- **Nuevos últimos 7 días**: ${clientesNuevos7d.length}\n\n` +
        (listaC.length > 0
          ? `**${quiereNuevos ? 'Últimos registrados' : 'Top compradores'}:**\n${listaC.slice(0, 5).map(c => `- **${c.contacto || c.empresa || 'Sin nombre'}**${c.empresa && c.contacto ? ` · ${c.empresa}` : ''} · ${fmt(c.total_compras_clp)}${quiereNuevos && c.created_date ? ` · ${new Date(c.created_date).toLocaleDateString('es-CL')}` : ''}`).join('\n')}`
          : '_Sin clientes registrados._');
      sources.push('Cliente');
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

    return Response.json({ ok: true, answer, metrics, lists, sources, query });
  } catch (error) {
    console.error('peyuBrainOps error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});