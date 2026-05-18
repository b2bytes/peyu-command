// ============================================================================
// PEYU · cockpitMobileSnapshot
// ----------------------------------------------------------------------------
// Endpoint ultra-liviano para el cockpit móvil del fundador.
// Devuelve en UNA sola llamada los 3 bloques que importan en el celular:
//   1) Ventas de HOY (B2C + B2B, total CLP, pedidos, ticket promedio)
//   2) Leads NUEVOS últimas 24h (B2B form + ChatLeads activos)
//   3) Alertas críticas (stock bajo, errores frontend high/critical, pedidos
//      pendientes de pago próximos a expirar)
//
// Diseñado para ser ejecutado cada ~30s desde mobile sin pesar.
// Solo admin.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function todayBoundsCL() {
  // Santiago: UTC-4 (sin DST esta época). Calcular inicio/fin del día CL en UTC.
  const now = new Date();
  const utcMs = now.getTime();
  const clMs = utcMs - 4 * 3600 * 1000;
  const clDate = new Date(clMs);
  const y = clDate.getUTCFullYear();
  const m = String(clDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(clDate.getUTCDate()).padStart(2, '0');
  return {
    iso_date: `${y}-${m}-${d}`,
    start_utc: new Date(Date.UTC(y, clDate.getUTCMonth(), clDate.getUTCDate(), 4, 0, 0)).toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { iso_date: hoy, start_utc } = todayBoundsCL();
    const yesterday24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    // Traemos en paralelo todo lo necesario.
    const [pedidos, b2bLeads, chatLeads, productos, errors] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-fecha', 200),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 100),
      base44.asServiceRole.entities.ChatLead.list('-ultimo_mensaje_at', 100),
      base44.asServiceRole.entities.Producto.filter({ activo: true }),
      base44.asServiceRole.entities.ErrorLog.filter({ resolved: false }, '-created_date', 50).catch(() => []),
    ]);

    // ── 1) Ventas HOY (B2C + B2B vía PedidoWeb, excluye cancelados/reembolsados) ─
    const pedidosHoy = pedidos.filter(p =>
      p.fecha === hoy &&
      !['Cancelado', 'Reembolsado'].includes(p.estado)
    );
    const ventas_hoy_clp = pedidosHoy.reduce((s, p) => s + (p.total || 0), 0);
    const pedidos_hoy = pedidosHoy.length;
    const ticket_promedio = pedidos_hoy > 0 ? Math.round(ventas_hoy_clp / pedidos_hoy) : 0;

    const pedidos_pagados = pedidosHoy.filter(p => p.payment_status === 'paid').length;
    const pedidos_pendientes = pedidosHoy.filter(p => ['pending_mp', 'pending_transfer'].includes(p.payment_status)).length;

    // Desglose B2C/B2B
    const ventas_b2c = pedidosHoy
      .filter(p => p.tipo_cliente === 'B2C Individual')
      .reduce((s, p) => s + (p.total || 0), 0);
    const ventas_b2b = pedidosHoy
      .filter(p => ['B2B Corporativo', 'B2B Pyme'].includes(p.tipo_cliente))
      .reduce((s, p) => s + (p.total || 0), 0);

    // ── 2) Leads NUEVOS últimas 24h ────────────────────────────────────────
    const b2bNuevos = b2bLeads.filter(l => l.created_date >= yesterday24h);
    const chatNuevos = chatLeads.filter(c =>
      c.created_date >= yesterday24h &&
      ['Activo', 'Calificado'].includes(c.estado)
    );

    const leads_b2b_24h = b2bNuevos.length;
    const leads_chat_24h = chatNuevos.length;
    const leads_calientes = [
      ...b2bNuevos.filter(l => (l.lead_score || 0) >= 70),
      ...chatNuevos.filter(c => (c.score || 0) >= 70),
    ].length;

    // ── 3) Alertas críticas ────────────────────────────────────────────────
    const alertas = [];

    // a) Stock bajo: productos con stock_actual < 20 y activos
    const stockBajo = productos
      .filter(p => (p.stock_actual ?? 999) < 20)
      .sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0))
      .slice(0, 5);
    for (const p of stockBajo) {
      alertas.push({
        type: 'stock',
        severity: p.stock_actual === 0 ? 'critical' : p.stock_actual < 10 ? 'high' : 'medium',
        title: `Stock bajo · ${p.nombre}`,
        detail: `Quedan ${p.stock_actual || 0} u${p.stock_actual === 0 ? ' — AGOTADO' : ''}`,
        action_label: 'Ver inventario',
        action_url: '/admin/inventario',
        sku: p.sku,
      });
    }

    // b) Errores frontend high/critical sin resolver últimas 24h
    const erroresCriticos = errors.filter(e =>
      ['high', 'critical'].includes(e.severity) &&
      e.created_date >= yesterday24h
    ).slice(0, 5);
    for (const e of erroresCriticos) {
      alertas.push({
        type: 'error',
        severity: e.severity,
        title: `Error en ${e.source.replace('frontend_', '').replace('backend_', '') || 'sistema'}`,
        detail: (e.message || '').substring(0, 120),
        action_label: 'Ver logs',
        action_url: '/admin/monitoreo-ia',
      });
    }

    // c) Pedidos pendientes de pago próximos a expirar (<2h restantes)
    const ahora = Date.now();
    const pedidosPorExpirar = pedidos.filter(p => {
      if (p.payment_status !== 'pending_mp') return false;
      if (!p.expires_at) return false;
      const expMs = new Date(p.expires_at).getTime();
      const restanteH = (expMs - ahora) / 3600000;
      return restanteH > 0 && restanteH < 2;
    }).slice(0, 3);
    for (const p of pedidosPorExpirar) {
      const minRestantes = Math.round((new Date(p.expires_at).getTime() - ahora) / 60000);
      alertas.push({
        type: 'payment',
        severity: 'high',
        title: `Pago por expirar · ${p.cliente_nombre || p.numero_pedido}`,
        detail: `$${(p.total || 0).toLocaleString('es-CL')} · expira en ${minRestantes} min`,
        action_label: 'Ver pedido',
        action_url: '/admin/procesar-pedidos',
      });
    }

    return Response.json({
      ok: true,
      generated_at: new Date().toISOString(),
      fecha_cl: hoy,
      ventas: {
        total_clp: ventas_hoy_clp,
        b2c_clp: ventas_b2c,
        b2b_clp: ventas_b2b,
        pedidos: pedidos_hoy,
        pagados: pedidos_pagados,
        pendientes: pedidos_pendientes,
        ticket_promedio_clp: ticket_promedio,
      },
      leads: {
        b2b_24h: leads_b2b_24h,
        chat_24h: leads_chat_24h,
        total_24h: leads_b2b_24h + leads_chat_24h,
        calientes: leads_calientes,
      },
      alertas: {
        total: alertas.length,
        critical: alertas.filter(a => a.severity === 'critical').length,
        high: alertas.filter(a => a.severity === 'high').length,
        items: alertas,
      },
    });
  } catch (error) {
    console.error('cockpitMobileSnapshot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});