import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 16:00 — Cross-sell post-compra inteligente.
 * Detecta pedidos B2C confirmados hace 2-4 días y sugiere producto
 * complementario basado en categoría usando IA.
 *
 * Solo dispara una vez por pedido (marca con [CROSSSELL_SENT]).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ahora = new Date();
    const hace2dias = new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000);
    const hace4dias = new Date(ahora.getTime() - 4 * 24 * 60 * 60 * 1000);

    const [pedidos, productos] = await Promise.all([
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 100),
      base44.asServiceRole.entities.Producto.filter({ activo: true }),
    ]);

    const elegibles = pedidos.filter(p => {
      if (!p.cliente_email || p.tipo_cliente === 'B2B Corporativo') return false;
      if (!['Confirmado', 'En Producción', 'Despachado'].includes(p.estado)) return false;
      if (p.notas?.includes('[CROSSSELL_SENT]')) return false;
      const fecha = new Date(p.created_date);
      return fecha >= hace4dias && fecha <= hace2dias;
    });

    let enviados = 0;

    for (const pedido of elegibles) {
      try {
        // Producto comprado
        const skuComprado = pedido.sku;
        const productoComprado = productos.find(p => p.sku === skuComprado);
        if (!productoComprado) continue;

        // Sugerir producto: misma categoría, distinto SKU, B2C disponible
        const candidatos = productos.filter(p =>
          p.sku !== skuComprado &&
          p.categoria === productoComprado.categoria &&
          p.canal !== 'B2B Exclusivo' &&
          p.precio_b2c
        );
        if (candidatos.length === 0) continue;

        // Tomar el más cercano en precio (ofrece valor similar)
        const sugerencia = candidatos.sort((a, b) =>
          Math.abs((a.precio_b2c || 0) - (productoComprado.precio_b2c || 0)) -
          Math.abs((b.precio_b2c || 0) - (productoComprado.precio_b2c || 0))
        )[0];

        const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
        const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#D96B4D,#0F8B6C);padding:24px 28px">
    <p style="color:#fed7aa;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE · Para ti</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">${pedido.cliente_nombre || ''}, te dejamos algo más 🎁</h1>
  </div>
  <div style="padding:24px 28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">Vimos que te llevaste <strong>${productoComprado.nombre}</strong>. Como complemento perfecto, este producto es uno de los favoritos de quienes ya lo tienen:</p>
    <div style="background:#fafafa;border-radius:12px;padding:18px;margin:16px 0">
      ${sugerencia.imagen_url ? `<img src="${sugerencia.imagen_url}" alt="${sugerencia.nombre}" style="width:100%;max-width:360px;height:auto;border-radius:10px;display:block;margin:0 auto 12px">` : ''}
      <h3 style="margin:0 0 6px;color:#0F172A;font-size:16px">${sugerencia.nombre}</h3>
      <p style="margin:0 0 12px;color:#6b7280;font-size:12px">${sugerencia.material} · Garantía ${sugerencia.garantia_anios || 1} año</p>
      <p style="margin:0;color:#0F8B6C;font-size:22px;font-weight:900">${fmt(sugerencia.precio_b2c)}</p>
    </div>
    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:16px 0;text-align:center">
      <p style="margin:0;color:#006D5B;font-size:11px;font-weight:700;letter-spacing:1px">CUPÓN EXCLUSIVO 48H</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0F8B6C;font-family:monospace">PEYU2X</p>
      <p style="margin:6px 0 0;font-size:11px;color:#4B4F54">12% OFF · Solo este producto · 48 horas</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="https://peyuchile.cl/producto/${sugerencia.id}"
         style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px">
        Ver producto →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0">
    <p style="margin:0;color:#6b7280;font-size:11px;text-align:center">Peyu Chile SPA · Plástico 100% reciclado · ventas@peyuchile.cl</p>
  </div>
</div></body></html>`;

        await base44.integrations.Core.SendEmail({
          from_name: 'Peyu Chile',
          to: pedido.cliente_email,
          subject: `${pedido.cliente_nombre || 'Hola'}, complemento perfecto para tu ${productoComprado.nombre} · 12% OFF`,
          body: html,
        });

        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
          notas: `${pedido.notas || ''}\n[CROSSSELL_SENT] ${sugerencia.sku} · ${ahora.toISOString().split('T')[0]}`.trim(),
        });

        enviados++;
      } catch (e) {
        console.error(`Error cross-sell pedido ${pedido.id}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      total_pedidos_revisados: pedidos.length,
      elegibles: elegibles.length,
      enviados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});