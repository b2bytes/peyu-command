import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// generarEtiquetaB2CBlueExpress
// Trigger: PedidoWeb.estado → "Listo para Despacho" (automation entity)
//          O bien llamada manual con { pedido_id, pedido }
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // ── Detectar origen: automation entity vs llamada manual ──────────────────
    let pedido_id, pedido;

    if (payload.event && payload.data) {
      // Llamado desde automation entity trigger
      pedido_id = payload.event.entity_id;
      pedido = payload.data;
    } else {
      // Llamado manual desde frontend/función
      pedido_id = payload.pedido_id;
      pedido = payload.pedido;
    }

    if (!pedido_id || !pedido) {
      return Response.json({ ok: false, error: 'Falta pedido_id o pedido en payload' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Verificar que esté pagado
    if (pedido.payment_status !== 'paid') {
      return Response.json({ ok: false, reason: 'Pedido aún no está pagado', current_status: pedido.payment_status });
    }

    // Verificar que no tenga ya tracking asignado (evitar duplicados)
    if (pedido.tracking && pedido.tracking.trim() !== '') {
      return Response.json({ ok: true, skip: true, reason: 'Ya tiene tracking', tracking: pedido.tracking });
    }

    // Verificar dirección de envío mínima
    if (!pedido.direccion_envio || !pedido.ciudad) {
      return Response.json({ ok: false, error: 'Pedido sin dirección de envío o ciudad' }, { status: 400 });
    }

    // Calcular peso total
    let pesoTotal = 0;
    const items = pedido.items_detalle || [];
    pesoTotal = items.reduce((sum, item) => sum + (0.3 * (item.cantidad || 1)), 0);
    if (pesoTotal === 0) pesoTotal = 0.5;

    const descItems = items.map(it => `${it.cantidad}x ${it.nombre}`).join(' + ') || pedido.descripcion_items || 'Artículos PEYU';

    console.log(`[generarEtiquetaB2C] Generando OT para pedido ${pedido.numero_pedido} · ${pedido.cliente_nombre} · ${pedido.ciudad}`);

    // Llamar a bluexCreateShipment
    const blueexRes = await sr.functions.invoke('bluexCreateShipment', {
      pedido_id,
      cliente_nombre: pedido.cliente_nombre,
      cliente_email: pedido.cliente_email,
      cliente_telefono: pedido.cliente_telefono || '',
      direccion_destino: pedido.direccion_envio,
      comuna_destino: pedido.ciudad,
      peso_kg: pesoTotal,
      valor_declarado: pedido.total || 0,
      print_format: 4,
      referencia: pedido.numero_pedido,
      comentarios: `Pedido PEYU ${pedido.numero_pedido} · ${descItems}`,
    });

    if (!blueexRes?.ok) {
      console.error('[generarEtiquetaB2C] BlueEx error:', blueexRes?.error);
      return Response.json({ ok: false, error: blueexRes?.error || 'Error generando etiqueta BlueExpress' }, { status: 500 });
    }

    const tracking = blueexRes.tracking;
    const labelContent = blueexRes.label_contenido;
    const labelUrl = labelContent ? `data:application/pdf;base64,${labelContent}` : (blueexRes.tracking_url || null);

    // Actualizar PedidoWeb con tracking
    const historial = Array.isArray(pedido.historial) ? [...pedido.historial] : [];
    historial.push({
      at: new Date().toISOString(),
      type: 'tracking_added',
      actor: 'system',
      channel: 'system',
      detail: `Etiqueta BlueExpress generada automáticamente · OT ${tracking}`,
      meta: { tracking, envio_id: blueexRes.envio_id },
    });

    await sr.entities.PedidoWeb.update(pedido_id, {
      courier: 'BlueExpress',
      tracking,
      historial,
    });

    console.log(`[generarEtiquetaB2C] OT generada: ${tracking} para pedido ${pedido.numero_pedido}`);

    // Email al cliente con tracking (best-effort)
    try {
      await sr.functions.invoke('enviarConfirmacionPedido', {
        pedido_id,
        tipo: 'shipping_ready',
        tracking_number: tracking,
      });
    } catch (emailErr) {
      console.warn('[generarEtiquetaB2C] Error enviando email tracking:', emailErr.message);
    }

    return Response.json({
      ok: true,
      pedido_id,
      numero_pedido: pedido.numero_pedido,
      tracking_number: tracking,
      label_url: labelUrl,
      envio_id: blueexRes.envio_id,
      message: 'Etiqueta generada y tracking actualizado en pedido',
    });

  } catch (error) {
    console.error('[generarEtiquetaB2CBlueExpress]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});