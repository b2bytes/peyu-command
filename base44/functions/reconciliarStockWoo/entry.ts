// ============================================================================
// reconciliarStockWoo — Reconciliación de inventario PEYU ↔ WooCommerce
// ----------------------------------------------------------------------------
// Calcula stock real por SKU y lo sincroniza con WooCommerce para evitar
// sobreventas (overselling). Solo admin.
//
// FÓRMULA stock real disponible:
//   stock_real = Producto.stock_actual
//              − Σ unidades de PedidoWeb del SKU en estado no-despachado
//                (Nuevo, Confirmado, En Producción, Listo para Despacho)
//
// FLUJO:
//   1. Lee productos activos con SKU.
//   2. Lee pedidos web no despachados → calcula reservas por SKU.
//   3. Para cada producto: consulta Woo /products?sku=, compara, y si difiere
//      hace PUT /products/{id} con stock_quantity = stock_real.
//   4. Registra todo en AILog con detalle de ajustes.
//
// PAYLOAD opcional:
//   { dry_run: true }  // simula sin escribir en Woo
//   { skus: ["SKU1","SKU2"] }  // limita a SKUs específicos
//
// SECRETS requeridos: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY,
//                     WOOCOMMERCE_CONSUMER_SECRET
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const WOO_URL = Deno.env.get('WOOCOMMERCE_URL');
const WOO_KEY = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
const WOO_SECRET = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
const WOO_PAUSED = Deno.env.get('WOO_INTEGRATION_PAUSED') === 'true';

const ESTADOS_RESERVA = ['Nuevo', 'Confirmado', 'En Producción', 'Listo para Despacho'];

// Auth básica para Woo REST API
const wooAuthHeader = () =>
  'Basic ' + btoa(`${WOO_KEY}:${WOO_SECRET}`);

// Busca producto en Woo por SKU. Devuelve {id, stock_quantity, manage_stock} o null.
async function getWooProductBySku(sku) {
  const url = `${WOO_URL.replace(/\/$/, '')}/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': wooAuthHeader(), 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Woo GET ${sku} → ${res.status}`);
  const arr = await res.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const p = arr[0];
  return {
    id: p.id,
    stock_quantity: typeof p.stock_quantity === 'number' ? p.stock_quantity : null,
    manage_stock: !!p.manage_stock,
    stock_status: p.stock_status,
  };
}

// Actualiza stock en Woo
async function updateWooStock(productId, newStock) {
  const url = `${WOO_URL.replace(/\/$/, '')}/wp-json/wc/v3/products/${productId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': wooAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      manage_stock: true,
      stock_quantity: Math.max(0, newStock),
      stock_status: newStock > 0 ? 'instock' : 'outofstock',
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Woo PUT ${productId} → ${res.status}: ${errText.slice(0, 200)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    if (!WOO_URL || !WOO_KEY || !WOO_SECRET) {
      return Response.json({
        error: 'Faltan secrets WooCommerce (WOOCOMMERCE_URL/KEY/SECRET)',
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const skuFilter = Array.isArray(body.skus) && body.skus.length > 0 ? body.skus : null;

    if (WOO_PAUSED && !dryRun) {
      return Response.json({
        error: 'Integración Woo pausada (WOO_INTEGRATION_PAUSED=true). Usa dry_run:true.',
      }, { status: 423 });
    }

    // 1) Productos activos con SKU
    let productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, null, 1000);
    productos = productos.filter(p => p.sku);
    if (skuFilter) productos = productos.filter(p => skuFilter.includes(p.sku));

    // 2) Pedidos web no despachados → reservas por SKU
    //    Ojo: PedidoWeb tiene `sku` (principal) y `cantidad` total. Es una
    //    aproximación; multi-SKU por pedido se considera todo al SKU principal.
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500);
    const pedidosReservados = pedidos.filter(p => ESTADOS_RESERVA.includes(p.estado));
    const reservasPorSku = {};
    for (const p of pedidosReservados) {
      if (!p.sku) continue;
      reservasPorSku[p.sku] = (reservasPorSku[p.sku] || 0) + (p.cantidad || 0);
    }

    // 3) Reconciliar cada producto
    const resultados = [];
    let ajustados = 0;
    let errores = 0;

    for (const prod of productos) {
      const stockActual = typeof prod.stock_actual === 'number' ? prod.stock_actual : 0;
      const reservado = reservasPorSku[prod.sku] || 0;
      const stockReal = Math.max(0, stockActual - reservado);

      try {
        const wooProd = await getWooProductBySku(prod.sku);
        if (!wooProd) {
          resultados.push({
            sku: prod.sku,
            nombre: prod.nombre,
            status: 'not_in_woo',
            stock_real: stockReal,
            reservado,
          });
          continue;
        }

        const wooStock = wooProd.stock_quantity ?? 0;
        const diff = stockReal - wooStock;

        if (diff === 0) {
          resultados.push({
            sku: prod.sku,
            nombre: prod.nombre,
            status: 'in_sync',
            stock_real: stockReal,
            woo_stock: wooStock,
            reservado,
          });
          continue;
        }

        // Hay desviación → ajustar (o simular)
        if (dryRun) {
          resultados.push({
            sku: prod.sku,
            nombre: prod.nombre,
            status: 'would_update',
            stock_real: stockReal,
            woo_stock: wooStock,
            diff,
            reservado,
          });
        } else {
          await updateWooStock(wooProd.id, stockReal);
          ajustados++;
          resultados.push({
            sku: prod.sku,
            nombre: prod.nombre,
            status: 'updated',
            stock_real: stockReal,
            woo_stock_anterior: wooStock,
            diff,
            reservado,
          });
        }
      } catch (err) {
        errores++;
        resultados.push({
          sku: prod.sku,
          nombre: prod.nombre,
          status: 'error',
          error: err.message,
          stock_real: stockReal,
          reservado,
        });
      }
    }

    const summary = {
      total_productos: productos.length,
      en_sync: resultados.filter(r => r.status === 'in_sync').length,
      ajustados,
      simulados: resultados.filter(r => r.status === 'would_update').length,
      no_en_woo: resultados.filter(r => r.status === 'not_in_woo').length,
      errores,
      dry_run: dryRun,
    };

    // 4) Auditoría en AILog (best-effort)
    try {
      await base44.asServiceRole.entities.AILog.create({
        agent_name: 'reconciliarStockWoo',
        model: 'n/a',
        task_type: 'other',
        user_message: `Reconciliación stock Woo · dry_run=${dryRun} · skus=${skuFilter?.length ?? 'all'}`,
        ai_response: JSON.stringify(summary),
        user_email: user.email,
        latency_ms: Date.now() - t0,
        status: errores > 0 ? 'error' : 'success',
        tags: ['woo', 'inventario', 'reconciliacion', dryRun ? 'dry_run' : 'live'],
      });
    } catch { /* best-effort */ }

    return Response.json({
      ok: true,
      summary,
      resultados,
      latency_ms: Date.now() - t0,
    });
  } catch (error) {
    console.error('[reconciliarStockWoo]', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});