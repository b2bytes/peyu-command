// cockpitAgentFleet — estado y KPIs en vivo de la flota de agentes IA.
// Cada agente es tratado como "empleado sintético" con métricas hoy.
//
// Devuelve un array de agents con: name, role, emoji, status, kpis, last_action.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isToday = (d) => d && new Date(d) >= startOfDay;

    const [ailogs, b2bLeads, proposals, pedidos, priceSugs, productos, consultas] = await Promise.all([
      base44.entities.AILog.list('-created_date', 500),
      base44.entities.B2BLead.list('-created_date', 100),
      base44.entities.CorporateProposal.list('-created_date', 100),
      base44.entities.PedidoWeb.list('-created_date', 100),
      base44.entities.PriceSuggestion.list('-created_date', 50),
      base44.entities.Producto.filter({ activo: true }, null, 500),
      base44.entities.Consulta.list('-created_date', 100),
    ]);

    const todayLogs = ailogs.filter(a => isToday(a.created_date));
    const groupBy = (arr, key) => arr.reduce((m, x) => ({ ...m, [x[key]]: (m[x[key]] || 0) + 1 }), {});
    const sumBy = (arr, key) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0);

    const logsByAgent = todayLogs.reduce((m, l) => {
      const k = l.agent_name || 'unknown';
      if (!m[k]) m[k] = { count: 0, tokens: 0, cost: 0, errors: 0, last: null };
      m[k].count++;
      m[k].tokens += l.tokens_total || 0;
      m[k].cost += l.cost_usd || 0;
      if (l.status === 'error') m[k].errors++;
      if (!m[k].last || new Date(l.created_date) > new Date(m[k].last)) m[k].last = l.created_date;
      return m;
    }, {});

    const todayLeads = b2bLeads.filter(l => isToday(l.created_date));
    const todayProposals = proposals.filter(p => isToday(p.created_date));
    const todayPedidos = pedidos.filter(p => isToday(p.created_date));
    const lowStock = productos.filter(p => typeof p.stock_actual === 'number' && p.stock_actual < 10).length;
    const consultasHoy = consultas.filter(c => isToday(c.created_date));

    const conversaciones = new Set(
      todayLogs.filter(l => l.task_type === 'chat' && (l.conversation_id || l.session_id)).map(l => l.conversation_id || l.session_id)
    ).size;

    const fleet = [
      {
        id: 'peyu',
        name: 'Peyu',
        role: 'Asistente público (chat web)',
        emoji: '🤖',
        color: 'from-violet-500 to-indigo-600',
        status: (logsByAgent.peyu?.errors || 0) > 0 ? 'warning' : conversaciones > 0 ? 'active' : 'idle',
        kpis: [
          { label: 'Conversaciones hoy', value: conversaciones },
          { label: 'Mensajes', value: logsByAgent.peyu?.count || 0 },
          { label: 'Tokens', value: ((logsByAgent.peyu?.tokens || 0) / 1000).toFixed(1) + 'K' },
          { label: 'Costo', value: '$' + (logsByAgent.peyu?.cost || 0).toFixed(3) },
        ],
        last_action: logsByAgent.peyu?.last,
        link: '/admin/monitoreo-ia',
      },
      {
        id: 'b2b_triage',
        name: 'B2B Triage',
        role: 'Score y nurture de leads B2B',
        emoji: '🎯',
        color: 'from-cyan-500 to-blue-600',
        status: todayLeads.length > 0 ? 'active' : 'idle',
        kpis: [
          { label: 'Leads scoreados hoy', value: todayLeads.length },
          { label: 'Calientes (≥70)', value: todayLeads.filter(l => (l.lead_score || 0) >= 70).length },
          { label: 'Propuestas creadas', value: todayProposals.length },
          { label: 'Aceptadas (mes)', value: proposals.filter(p => p.status === 'Aceptada').length },
        ],
        last_action: todayLeads[0]?.created_date,
        link: '/admin/pipeline',
      },
      {
        id: 'finanzas_ai',
        name: 'Finanzas AI',
        role: 'Costos reales + sugerencias de precio',
        emoji: '💰',
        color: 'from-emerald-500 to-teal-600',
        status: priceSugs.filter(p => p.estado === 'pendiente').length > 0 ? 'awaiting_approval' : 'idle',
        kpis: [
          { label: 'Sugerencias pendientes', value: priceSugs.filter(p => p.estado === 'pendiente').length },
          { label: 'Aprobadas', value: priceSugs.filter(p => p.estado === 'aprobada' || p.estado === 'aplicada').length },
          { label: 'Rechazadas', value: priceSugs.filter(p => p.estado === 'rechazada').length },
        ],
        last_action: priceSugs[0]?.created_date,
        link: '/admin/centro-costos',
      },
      {
        id: 'logistica',
        name: 'Logística IA',
        role: 'Bluex tracking + secuencias notificación',
        emoji: '📦',
        color: 'from-blue-500 to-cyan-600',
        status: 'active',
        kpis: [
          { label: 'Pedidos hoy', value: todayPedidos.length },
          { label: 'Despachados', value: todayPedidos.filter(p => p.estado === 'Despachado').length },
          { label: 'Entregados hoy', value: pedidos.filter(p => p.estado === 'Entregado' && isToday(p.updated_date)).length },
        ],
        link: '/admin/bluex',
      },
      {
        id: 'inventario',
        name: 'Inventario',
        role: 'Alertas stock + predicción demanda',
        emoji: '🏭',
        color: 'from-amber-500 to-orange-600',
        status: lowStock > 0 ? 'warning' : 'idle',
        kpis: [
          { label: 'SKUs con stock bajo', value: lowStock },
          { label: 'Catálogo activo', value: productos.length },
        ],
        link: '/admin/inventario',
      },
      {
        id: 'asistente_comercial',
        name: 'Asistente Comercial',
        role: 'Triaje y respuesta a consultas',
        emoji: '💬',
        color: 'from-pink-500 to-rose-600',
        status: consultas.filter(c => c.estado === 'Sin responder').length > 5 ? 'warning' : 'active',
        kpis: [
          { label: 'Consultas hoy', value: consultasHoy.length },
          { label: 'Sin responder', value: consultas.filter(c => c.estado === 'Sin responder').length },
          { label: 'Respondidas', value: consultas.filter(c => c.estado === 'Respondido').length },
        ],
        link: '/admin/soporte',
      },
      {
        id: 'content_creator',
        name: 'Content Creator',
        role: 'Blog + redes sociales',
        emoji: '✍️',
        color: 'from-fuchsia-500 to-purple-600',
        status: (logsByAgent.generateBlogPost?.count || 0) + (logsByAgent.generateSocialContent?.count || 0) > 0 ? 'active' : 'idle',
        kpis: [
          { label: 'Posts generados hoy', value: (logsByAgent.generateBlogPost?.count || 0) + (logsByAgent.generateSocialContent?.count || 0) },
        ],
        link: '/admin/marketing-hub',
      },
      {
        id: 'ads_commander',
        name: 'Ads Commander',
        role: 'Estrategia + análisis campañas',
        emoji: '📡',
        color: 'from-orange-500 to-red-600',
        status: (logsByAgent.adsGenerateCampaign?.count || 0) > 0 ? 'active' : 'idle',
        kpis: [
          { label: 'Campañas generadas hoy', value: logsByAgent.adsGenerateCampaign?.count || 0 },
          { label: 'Análisis hoy', value: logsByAgent.adsAnalyzePerformance?.count || 0 },
        ],
        link: '/admin/ads-command',
      },
    ];

    return Response.json({
      fleet,
      summary: {
        total_agents: fleet.length,
        active: fleet.filter(a => a.status === 'active').length,
        warnings: fleet.filter(a => a.status === 'warning').length,
        awaiting_approval: fleet.filter(a => a.status === 'awaiting_approval').length,
        total_tokens_today: sumBy(todayLogs, 'tokens_total'),
        total_cost_today: sumBy(todayLogs, 'cost_usd'),
        total_calls_today: todayLogs.length,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});