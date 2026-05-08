// cockpitForesight — predicciones / lookahead para el Cockpit.
// Analiza data histórica para anticipar problemas:
//   - Cash projection en 14 días (basado en pedidos confirmados + propuestas en vuelo)
//   - Demanda proyectada (basada en GA4 ActivityLog últimas 4 semanas)
//   - Riesgo churn (clientes B2B sin pedido +90 días)
//   - Propuestas próximas a vencer
//   - Margen alerts (productos con margen < 30%)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const daysAgo = (d) => (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [movimientos, proposals, clientes, costos, pedidos, productos] = await Promise.all([
      base44.entities.MovimientoCaja.list('-fecha', 500),
      base44.entities.CorporateProposal.list('-created_date', 100),
      base44.entities.Cliente.list('-created_date', 200),
      base44.entities.ProductoCostoReal.list('-created_date', 200),
      base44.entities.PedidoWeb.list('-created_date', 200),
      base44.entities.Producto.filter({ activo: true }, null, 500),
    ]);

    const insights = [];

    // 1) Cash projection 14 días
    const last30Mov = movimientos.filter(m => daysAgo(m.fecha) <= 30);
    const ingresos30 = last30Mov.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0);
    const egresos30 = last30Mov.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + (m.monto || 0), 0);
    const burnRate = (egresos30 - ingresos30) / 30;
    const propuestasVuelo = proposals.filter(p => ['Borrador', 'Enviada'].includes(p.status));
    const valorEnVuelo = propuestasVuelo.reduce((s, p) => s + (p.total || 0), 0);
    const cashIn14 = -burnRate * 14;

    if (burnRate > 0) {
      insights.push({
        id: 'cash_projection',
        type: 'cash',
        severity: burnRate * 14 > valorEnVuelo * 0.3 ? 'critical' : 'medium',
        icon: 'TrendingDown',
        title: 'Proyección de caja',
        message: `Quema neta promedio: $${(burnRate / 1000).toFixed(0)}K/día. En 14 días el saldo cae $${(cashIn14 / 1000).toFixed(0)}K si no cierras propuestas.`,
        action: `${propuestasVuelo.length} propuestas en vuelo por $${(valorEnVuelo / 1000000).toFixed(1)}M`,
        link: '/admin/propuestas',
      });
    }

    // 2) Propuestas próximas a vencer (validez)
    const vencenPronto = proposals.filter(p => {
      if (p.status !== 'Enviada' || !p.fecha_vencimiento) return false;
      const dias = (new Date(p.fecha_vencimiento) - Date.now()) / (1000 * 60 * 60 * 24);
      return dias > 0 && dias <= 7;
    });
    if (vencenPronto.length > 0) {
      insights.push({
        id: 'expiring_proposals',
        type: 'opportunity',
        severity: 'high',
        icon: 'Clock',
        title: 'Propuestas que vencen en 7 días',
        message: `${vencenPronto.length} propuestas por $${(vencenPronto.reduce((s, p) => s + (p.total || 0), 0) / 1000000).toFixed(1)}M están por vencer.`,
        action: 'Recordar al cliente',
        link: '/admin/propuestas',
      });
    }

    // 3) Churn risk B2B
    const clientesB2B = clientes.filter(c => c.tipo?.startsWith('B2B'));
    const enRiesgo = clientesB2B.filter(c => {
      if (!c.fecha_ultima_compra) return false;
      return daysAgo(c.fecha_ultima_compra) >= 90 && c.estado === 'Activo';
    });
    if (enRiesgo.length > 0) {
      insights.push({
        id: 'churn_risk',
        type: 'churn',
        severity: enRiesgo.length >= 5 ? 'high' : 'medium',
        icon: 'UserX',
        title: 'Riesgo de churn B2B',
        message: `${enRiesgo.length} clientes B2B sin pedido hace +90 días. LTV combinado en riesgo: $${(enRiesgo.reduce((s, c) => s + (c.total_compras_clp || 0), 0) / 1000000).toFixed(1)}M.`,
        action: 'Plan de re-engagement',
        link: '/admin/clientes',
      });
    }

    // 4) Margen bajo
    const mesActual = new Date().toISOString().slice(0, 7);
    const margenBajos = costos.filter(c => c.mes === mesActual && c.alerta_margen_bajo);
    if (margenBajos.length > 0) {
      insights.push({
        id: 'low_margin',
        type: 'margin',
        severity: 'high',
        icon: 'AlertTriangle',
        title: 'Productos con margen bajo',
        message: `${margenBajos.length} SKUs con margen bajo umbral. Finanzas AI puede sugerir ajustes.`,
        action: 'Revisar costos',
        link: '/admin/centro-costos',
      });
    }

    // 5) Demanda proyectada (basado en pedidos últimos 28 días vs 28 anteriores)
    const last28 = pedidos.filter(p => daysAgo(p.created_date) <= 28).length;
    const prev28 = pedidos.filter(p => daysAgo(p.created_date) > 28 && daysAgo(p.created_date) <= 56).length;
    if (prev28 > 0) {
      const growth = ((last28 - prev28) / prev28) * 100;
      if (Math.abs(growth) >= 15) {
        insights.push({
          id: 'demand_trend',
          type: 'demand',
          severity: growth > 0 ? 'low' : 'medium',
          icon: growth > 0 ? 'TrendingUp' : 'TrendingDown',
          title: growth > 0 ? 'Demanda en alza' : 'Demanda cayendo',
          message: `Pedidos últimos 28 días: ${last28} vs ${prev28} anteriores (${growth > 0 ? '+' : ''}${growth.toFixed(0)}%).`,
          action: growth > 0 ? 'Reabastecer top SKUs' : 'Reactivar marketing',
          link: growth > 0 ? '/admin/inventario' : '/admin/marketing-hub',
        });
      }
    }

    // 6) Top SKU sin stock para demanda
    const productosVendidos = pedidos.reduce((m, p) => {
      if (p.sku) m[p.sku] = (m[p.sku] || 0) + (p.cantidad || 1);
      return m;
    }, {});
    const topSkus = Object.entries(productosVendidos).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
    const topSinStock = productos.filter(p => topSkus.includes(p.sku) && (p.stock_actual || 0) < 10);
    if (topSinStock.length > 0) {
      insights.push({
        id: 'top_sku_low_stock',
        type: 'stockout',
        severity: 'critical',
        icon: 'PackageX',
        title: 'Top SKUs por agotarse',
        message: `${topSinStock.length} de tus 5 SKUs más vendidos tienen stock < 10u: ${topSinStock.map(p => p.sku).join(', ')}.`,
        action: 'Producir urgente',
        link: '/admin/operaciones',
      });
    }

    return Response.json({
      insights,
      kpis: {
        burn_rate_daily: Math.round(burnRate),
        cash_in_14d_delta: Math.round(cashIn14),
        propuestas_en_vuelo: propuestasVuelo.length,
        valor_en_vuelo: valorEnVuelo,
        clientes_riesgo: enRiesgo.length,
        demanda_growth_pct: prev28 > 0 ? Math.round(((last28 - prev28) / prev28) * 100) : 0,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});