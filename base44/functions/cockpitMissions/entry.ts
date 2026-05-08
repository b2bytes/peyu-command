// cockpitMissions — agrega TODO lo que requiere decisión humana en el Cockpit.
// Filosofía co-pilot híbrido: el agente propone, el founder aprueba/rechaza.
//
// Combina:
//   - PriceSuggestion pendientes (margen / costos)
//   - B2BLead score >= 70 sin propuesta enviada
//   - CorporateProposal Enviadas hace +5 días sin respuesta
//   - PedidoWeb estado=Nuevo (sin confirmar)
//   - Envío con excepción
//   - Producto con stock < umbral
//   - Consulta sin responder hace +24h
//   - ResenaPedido con rating <= 2 sin respuesta del equipo
//
// Devuelve cada misión con: id, type, priority (critical/high/medium), title,
// subtitle, action_label, action_target (ruta admin), entity_id, meta.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STOCK_THRESHOLD = 10;
const PROPOSAL_STALE_DAYS = 5;
const CONSULTA_STALE_HOURS = 24;
const HOT_LEAD_SCORE = 70;

const hoursAgo = (date) => {
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / 36e5;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [
      priceSuggestions,
      b2bLeads,
      proposals,
      pedidos,
      envios,
      productos,
      consultas,
      resenas,
    ] = await Promise.all([
      base44.entities.PriceSuggestion.filter({ estado: 'pendiente' }, '-created_date', 50),
      base44.entities.B2BLead.list('-created_date', 100),
      base44.entities.CorporateProposal.list('-created_date', 100),
      base44.entities.PedidoWeb.list('-created_date', 100),
      base44.entities.Envio.list('-created_date', 100),
      base44.entities.Producto.filter({ activo: true }, null, 500),
      base44.entities.Consulta.list('-created_date', 100),
      base44.entities.ResenaPedido.list('-created_date', 50),
    ]);

    const missions = [];

    // 1) Precios sugeridos (agente finanzas)
    priceSuggestions.forEach(p => {
      missions.push({
        id: `price-${p.id}`,
        type: 'price_suggestion',
        priority: p.urgencia === 'Alta' ? 'critical' : p.urgencia === 'Media' ? 'high' : 'medium',
        agent: 'finanzas_ai',
        title: `Ajuste de precio sugerido · ${p.producto_nombre}`,
        subtitle: `${p.precio_actual_clp?.toLocaleString('es-CL')} → ${p.precio_sugerido_clp?.toLocaleString('es-CL')} CLP (${p.delta_pct > 0 ? '+' : ''}${p.delta_pct?.toFixed(1)}%) · margen ${p.margen_actual_pct?.toFixed(0)}% → ${p.margen_sugerido_pct?.toFixed(0)}%`,
        action_label: 'Revisar',
        action_target: '/admin/centro-costos',
        entity_id: p.id,
        created_date: p.created_date,
        meta: { delta_pct: p.delta_pct, razonamiento: p.razonamiento },
      });
    });

    // 2) Leads B2B calientes sin propuesta enviada
    const proposalsByLead = new Set(
      proposals.filter(p => ['Enviada', 'Aceptada'].includes(p.status)).map(p => p.b2b_lead_id).filter(Boolean)
    );
    b2bLeads
      .filter(l => (l.lead_score || 0) >= HOT_LEAD_SCORE && !['Aceptado', 'Perdido'].includes(l.status) && !proposalsByLead.has(l.id))
      .slice(0, 10)
      .forEach(l => {
        missions.push({
          id: `lead-${l.id}`,
          type: 'hot_lead',
          priority: l.lead_score >= 85 ? 'critical' : 'high',
          agent: 'b2b_triage',
          title: `Lead caliente sin propuesta · ${l.company_name}`,
          subtitle: `Score ${l.lead_score}pts · ${l.product_interest || 'producto sin definir'} · ${l.qty_estimate || '?'}u · ${l.contact_name}`,
          action_label: 'Crear propuesta',
          action_target: '/admin/pipeline',
          entity_id: l.id,
          created_date: l.created_date,
          meta: { score: l.lead_score, qty: l.qty_estimate },
        });
      });

    // 3) Propuestas enviadas hace +5 días sin respuesta
    proposals
      .filter(p => p.status === 'Enviada' && p.fecha_envio && hoursAgo(p.fecha_envio) / 24 >= PROPOSAL_STALE_DAYS)
      .slice(0, 10)
      .forEach(p => {
        const dias = Math.floor(hoursAgo(p.fecha_envio) / 24);
        missions.push({
          id: `prop-${p.id}`,
          type: 'stale_proposal',
          priority: dias >= 10 ? 'high' : 'medium',
          agent: 'b2b_triage',
          title: `Propuesta sin respuesta · ${p.empresa}`,
          subtitle: `${dias} días sin respuesta · $${p.total?.toLocaleString('es-CL')} CLP · ${p.contacto}`,
          action_label: 'Reenviar',
          action_target: '/admin/propuestas',
          entity_id: p.id,
          created_date: p.fecha_envio,
          meta: { dias, total: p.total },
        });
      });

    // 4) Pedidos web nuevos sin confirmar
    pedidos
      .filter(p => p.estado === 'Nuevo')
      .slice(0, 10)
      .forEach(p => {
        const horas = hoursAgo(p.created_date);
        missions.push({
          id: `pedido-${p.id}`,
          type: 'new_order',
          priority: horas > 24 ? 'high' : 'medium',
          agent: 'operaciones',
          title: `Pedido por confirmar · ${p.numero_pedido || p.id.slice(0,6)}`,
          subtitle: `${p.cliente_nombre} · $${p.total?.toLocaleString('es-CL')} CLP · ${p.canal} · ${horas.toFixed(0)}h`,
          action_label: 'Procesar',
          action_target: '/admin/procesar-pedidos',
          entity_id: p.id,
          created_date: p.created_date,
          meta: { canal: p.canal, total: p.total },
        });
      });

    // 5) Envíos con excepción
    envios
      .filter(e => e.tiene_excepcion || e.estado === 'No Entregado' || e.estado === 'Excepción')
      .slice(0, 8)
      .forEach(e => {
        missions.push({
          id: `envio-${e.id}`,
          type: 'shipment_exception',
          priority: 'high',
          agent: 'logistica',
          title: `Envío con incidencia · ${e.numero_pedido || e.tracking_number}`,
          subtitle: `${e.cliente_nombre || ''} · ${e.ultimo_evento_descripcion || e.estado} · ${e.comuna_destino || ''}`,
          action_label: 'Resolver',
          action_target: '/admin/bluex',
          entity_id: e.id,
          created_date: e.ultimo_evento_at || e.created_date,
          meta: { estado: e.estado },
        });
      });

    // 6) Stock crítico
    productos
      .filter(p => typeof p.stock_actual === 'number' && p.stock_actual < STOCK_THRESHOLD)
      .slice(0, 10)
      .forEach(p => {
        missions.push({
          id: `stock-${p.id}`,
          type: 'low_stock',
          priority: p.stock_actual <= 3 ? 'critical' : p.stock_actual <= 6 ? 'high' : 'medium',
          agent: 'inventario',
          title: `Stock crítico · ${p.nombre}`,
          subtitle: `${p.stock_actual}u disponibles · SKU ${p.sku} · ${p.categoria}`,
          action_label: 'Reabastecer',
          action_target: '/admin/inventario',
          entity_id: p.id,
          created_date: p.updated_date || p.created_date,
          meta: { stock: p.stock_actual, sku: p.sku },
        });
      });

    // 7) Consultas sin responder +24h
    consultas
      .filter(c => c.estado === 'Sin responder' && hoursAgo(c.created_date) >= CONSULTA_STALE_HOURS)
      .slice(0, 10)
      .forEach(c => {
        missions.push({
          id: `consulta-${c.id}`,
          type: 'stale_inquiry',
          priority: c.calidad === 'Caliente' ? 'critical' : 'high',
          agent: 'asistente_comercial',
          title: `Consulta sin responder · ${c.nombre}`,
          subtitle: `${Math.floor(hoursAgo(c.created_date))}h · ${c.canal} · ${c.tipo}`,
          action_label: 'Responder',
          action_target: '/admin/soporte',
          entity_id: c.id,
          created_date: c.created_date,
          meta: { canal: c.canal, calidad: c.calidad },
        });
      });

    // 8) Reseñas negativas sin respuesta
    resenas
      .filter(r => (r.rating_producto || 0) <= 2 && !r.respuesta_equipo)
      .slice(0, 5)
      .forEach(r => {
        missions.push({
          id: `resena-${r.id}`,
          type: 'negative_review',
          priority: 'high',
          agent: 'soporte',
          title: `Reseña negativa · ${r.cliente_nombre}`,
          subtitle: `${r.rating_producto}★ producto · ${r.rating_servicio}★ servicio · "${(r.comentario || '').slice(0, 60)}..."`,
          action_label: 'Responder',
          action_target: '/admin/soporte',
          entity_id: r.id,
          created_date: r.created_date,
          meta: { rating: r.rating_producto },
        });
      });

    // Orden por prioridad + recencia
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };
    missions.sort((a, b) => {
      const r = (rank[a.priority] || 99) - (rank[b.priority] || 99);
      if (r !== 0) return r;
      return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    });

    return Response.json({
      total: missions.length,
      by_priority: {
        critical: missions.filter(m => m.priority === 'critical').length,
        high: missions.filter(m => m.priority === 'high').length,
        medium: missions.filter(m => m.priority === 'medium').length,
      },
      missions,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});