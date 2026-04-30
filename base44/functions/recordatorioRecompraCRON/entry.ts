import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON mensual: detecta clientes B2B sin compra en >180 días
 * y les envía un email de re-engagement con descuento.
 *
 * Diseñado para correr 1 vez al mes el día 1 a las 09:00.
 * Solo procesa clientes activos con email válido y al menos 1 compra histórica.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar admin (CRON o ejecución manual de admin)
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user; // CRONs no tienen user
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientes = await base44.asServiceRole.entities.Cliente.list(null, 500);
    const ahora = new Date();
    const haceXdias = (fecha) => {
      if (!fecha) return Infinity;
      const d = new Date(fecha);
      return Math.floor((ahora - d) / (1000 * 60 * 60 * 24));
    };

    const inactivos = clientes.filter(c =>
      c.email &&
      c.estado === 'Activo' &&
      c.num_pedidos > 0 &&
      haceXdias(c.fecha_ultima_compra) > 180 &&
      haceXdias(c.fecha_ultima_compra) < 720 // <2 años, evita listas muertas
    );

    let enviados = 0;
    let errores = 0;

    for (const cliente of inactivos) {
      try {
        const dias = haceXdias(cliente.fecha_ultima_compra);
        const meses = Math.floor(dias / 30);
        const skuFav = cliente.sku_favorito ? `tu producto favorito (${cliente.sku_favorito})` : 'nuestros productos sustentables';

        const body = `<!DOCTYPE html><html lang="es"><body style="font-family:Inter,Arial,sans-serif;background:#F7F7F5;margin:0;padding:20px">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#006D5B);padding:28px 32px">
    <p style="color:#A7D9C9;font-size:11px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">¡Te extrañamos, ${cliente.contacto || cliente.empresa}! 🌱</h1>
  </div>
  <div style="padding:28px">
    <p style="color:#4B4F54;font-size:14px;line-height:1.6;margin:0 0 16px">
      Hace ${meses} meses que no compras con nosotros. Mientras tanto, nuestra fábrica en Chile sigue convirtiendo plástico reciclado en regalos corporativos hermosos — y tenemos novedades que te encantarán.
    </p>
    <div style="background:#f0faf7;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center">
      <p style="color:#006D5B;font-weight:700;font-size:13px;margin:0 0 8px;letter-spacing:1px">REGALO DE BIENVENIDA</p>
      <p style="color:#0F8B6C;font-size:36px;font-weight:900;margin:0;font-family:Inter,sans-serif">15% OFF</p>
      <p style="color:#4B4F54;font-size:13px;margin:8px 0 0">en tu próximo pedido B2B · usa el código <strong>VUELTA15</strong></p>
    </div>
    <p style="color:#4B4F54;font-size:14px;line-height:1.6;margin:0 0 20px">
      Vuelve a explorar ${skuFav}. Ahora con personalización láser UV gratis desde 10 unidades.
    </p>
    <div style="text-align:center">
      <a href="https://peyuchile.cl/b2b/catalogo"
         style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
        Ver catálogo B2B →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
      Peyu Chile SPA · Plástico 100% reciclado · ventas@peyuchile.cl<br>
      Si ya no quieres recibir estos correos, responde con "Baja"
    </p>
  </div>
</div></body></html>`;

        await base44.integrations.Core.SendEmail({
          to: cliente.email,
          subject: `${cliente.contacto || cliente.empresa}, te extrañamos · 15% OFF para volver`,
          body,
          from_name: 'Peyu Chile',
        });

        // Marcar fecha de re-contacto
        await base44.asServiceRole.entities.Cliente.update(cliente.id, {
          proximo_recontacto: new Date(ahora.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

        enviados++;
      } catch (e) {
        console.error(`Error enviando a ${cliente.email}:`, e.message);
        errores++;
      }
    }

    return Response.json({
      ok: true,
      total_clientes_revisados: clientes.length,
      inactivos_detectados: inactivos.length,
      enviados,
      errores,
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});