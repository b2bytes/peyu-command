/**
 * prorratearCostosFantasma
 * ----------------------------------------------------------------------------
 * Toma todos los CostoFantasma de un mes y los distribuye sobre los productos
 * según su `asignacion_tipo`:
 *
 *  - Producto específico   → 100% al SKU
 *  - Categoría producto    → prorrateo por unidades vendidas en la categoría
 *  - Indirecto general     → prorrateo por unidades vendidas TOTAL
 *  - B2B / B2C exclusivo   → prorrateo solo en productos del canal
 *  - Marketing             → prorrateo por ingresos generados (proxy: ventas)
 *  - Operación general     → reparto igualitario entre productos activos
 *
 * Genera/actualiza ProductoCostoReal del mes con:
 *   - costo_directo_total_clp (estimado del producto)
 *   - costo_fantasma_prorrateado_clp (suma fantasmas asignados)
 *   - costo_fijo_prorrateado_clp (sueldos+arriendo+luz prorrateados)
 *   - costo_real_total_clp (TOTAL real)
 *   - margen_real_pct
 *
 * Solo admin puede invocar.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COSTOS_FIJOS_DEFAULT_CLP = 7_100_000; // sueldos+arriendo+luz+marketing+plataformas+contab+otros

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo admin' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mes = body.mes || new Date().toISOString().slice(0, 7); // YYYY-MM

    const sr = base44.asServiceRole;

    // 1. Obtener fantasmas del mes
    const fantasmas = await sr.entities.CostoFantasma.filter({ mes_imputacion: mes });
    const totalFantasmas = fantasmas.reduce((s, f) => s + (f.monto_clp || 0), 0);

    // 2. Productos activos
    const productos = await sr.entities.Producto.filter({ activo: true });

    // 3. Pedidos del mes (para conocer unidades vendidas por SKU/categoría)
    const inicioMes = `${mes}-01`;
    const proxMes = (() => {
      const [y, m] = mes.split('-').map(Number);
      const next = new Date(y, m, 1);
      return next.toISOString().slice(0, 10);
    })();

    const pedidos = await sr.entities.PedidoWeb.filter({});
    const pedidosMes = pedidos.filter(p => {
      const f = p.fecha || p.created_date;
      return f && f >= inicioMes && f < proxMes;
    });

    // Unidades vendidas por SKU
    const ventasPorSku = {};
    const ventasPorCategoria = {};
    let totalUnidadesVendidas = 0;
    pedidosMes.forEach(p => {
      const sku = p.sku;
      const qty = p.cantidad || 1;
      const prod = productos.find(x => x.sku === sku);
      const cat = prod?.categoria || p.descripcion_items;
      if (sku) ventasPorSku[sku] = (ventasPorSku[sku] || 0) + qty;
      if (cat) ventasPorCategoria[cat] = (ventasPorCategoria[cat] || 0) + qty;
      totalUnidadesVendidas += qty;
    });

    // 4. Para cada producto, calcular su porción de fantasmas + fijos
    const resultados = [];
    const fantasmaBreakdownPorSku = {};

    productos.forEach(p => {
      let fantasmaAsignado = 0;
      const breakdown = [];

      fantasmas.forEach(f => {
        const monto = f.monto_clp || 0;
        let parte = 0;
        let metodo = '';

        switch (f.asignacion_tipo) {
          case 'Producto específico':
            if (f.producto_sku === p.sku) { parte = monto; metodo = 'directo al SKU'; }
            break;
          case 'Categoría producto':
            if (f.categoria_producto === p.categoria) {
              const unCat = ventasPorCategoria[p.categoria] || 1;
              const unProd = ventasPorSku[p.sku] || 0;
              parte = unCat > 0 ? (monto * unProd / unCat) : 0;
              metodo = 'por unidades en categoría';
            }
            break;
          case 'Indirecto general (todos)':
          case 'Marketing':
          case 'Operación general':
            if (totalUnidadesVendidas > 0) {
              const unProd = ventasPorSku[p.sku] || 0;
              parte = monto * unProd / totalUnidadesVendidas;
              metodo = `prorrateo por unidades vendidas (${unProd}/${totalUnidadesVendidas})`;
            } else {
              // fallback igualitario si no hay ventas
              parte = monto / Math.max(1, productos.length);
              metodo = 'reparto igualitario (sin ventas)';
            }
            break;
          case 'B2B exclusivo':
            if (p.canal === 'B2B Exclusivo' || p.canal === 'B2B + B2C') {
              const productosB2B = productos.filter(x => x.canal === 'B2B Exclusivo' || x.canal === 'B2B + B2C');
              parte = monto / Math.max(1, productosB2B.length);
              metodo = 'igualitario B2B';
            }
            break;
          case 'B2C exclusivo':
            if (p.canal === 'B2C Exclusivo' || p.canal === 'B2B + B2C') {
              const productosB2C = productos.filter(x => x.canal === 'B2C Exclusivo' || x.canal === 'B2B + B2C');
              parte = monto / Math.max(1, productosB2C.length);
              metodo = 'igualitario B2C';
            }
            break;
        }

        if (parte > 0) {
          fantasmaAsignado += parte;
          breakdown.push({ categoria: f.categoria, monto_clp: Math.round(parte), metodo });
        }
      });

      fantasmaBreakdownPorSku[p.sku] = breakdown;

      // Fijos prorrateados por unidades vendidas (proxy)
      const unProd = ventasPorSku[p.sku] || 0;
      const fijoProrrateado = totalUnidadesVendidas > 0
        ? (COSTOS_FIJOS_DEFAULT_CLP * unProd / totalUnidadesVendidas)
        : (COSTOS_FIJOS_DEFAULT_CLP / Math.max(1, productos.length));

      // Costo directo estimado: 43% del precio_b2c por defecto (ajustable)
      const costoDirecto = Math.round((p.precio_b2c || 5000) * 0.43);
      const fantasmaUnit = unProd > 0 ? Math.round(fantasmaAsignado / unProd) : 0;
      const fijoUnit = unProd > 0 ? Math.round(fijoProrrateado / unProd) : 0;

      const costoRealTotal = costoDirecto + fantasmaUnit + fijoUnit;
      const margenClp = (p.precio_b2c || 0) - costoRealTotal;
      const margenPct = p.precio_b2c > 0 ? (margenClp / p.precio_b2c * 100) : 0;

      resultados.push({
        producto_sku: p.sku,
        producto_nombre: p.nombre,
        producto_id: p.id,
        mes,
        unidades_vendidas: unProd,
        unidades_producidas: unProd, // por simplicidad
        costo_material_clp: Math.round(costoDirecto * 0.65),
        costo_mano_obra_clp: Math.round(costoDirecto * 0.20),
        costo_packaging_clp: Math.round(costoDirecto * 0.10),
        costo_energia_clp: Math.round(costoDirecto * 0.05),
        costo_scrap_clp: 0,
        costo_directo_total_clp: costoDirecto,
        costo_fantasma_prorrateado_clp: fantasmaUnit,
        costo_fijo_prorrateado_clp: fijoUnit,
        costo_marketing_prorrateado_clp: 0,
        costo_envio_promedio_clp: 0,
        costo_real_total_clp: costoRealTotal,
        precio_venta_actual_clp: p.precio_b2c || 0,
        precio_venta_b2b_actual_clp: p.precio_base_b2b || 0,
        margen_real_clp: Math.round(margenClp),
        margen_real_pct: Math.round(margenPct * 10) / 10,
        fantasmas_breakdown: breakdown,
        alerta_margen_bajo: margenPct < 35,
        calculado_en: new Date().toISOString(),
        calculado_por: user.email,
      });
    });

    // 5. Upsert: borrar costos previos del mes, crear nuevos
    const previos = await sr.entities.ProductoCostoReal.filter({ mes });
    for (const old of previos) {
      await sr.entities.ProductoCostoReal.delete(old.id);
    }
    if (resultados.length > 0) {
      await sr.entities.ProductoCostoReal.bulkCreate(resultados);
    }

    // 6. Marcar fantasmas como prorrateados
    for (const f of fantasmas) {
      if (f.estado !== 'prorrateado') {
        await sr.entities.CostoFantasma.update(f.id, { estado: 'prorrateado' });
      }
    }

    return Response.json({
      ok: true,
      mes,
      productos_calculados: resultados.length,
      fantasmas_prorrateados: fantasmas.length,
      total_fantasmas_clp: totalFantasmas,
      total_unidades_vendidas: totalUnidadesVendidas,
      productos_alerta_margen_bajo: resultados.filter(r => r.alerta_margen_bajo).length,
    });
  } catch (error) {
    console.error('[prorratearCostosFantasma] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});