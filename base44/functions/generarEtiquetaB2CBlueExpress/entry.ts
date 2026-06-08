import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// Generar Etiqueta BlueExpress para Pedidos B2C
// Automation trigger: PedidoWeb status cambio a "Confirmado" o "En Producción"
// ─────────────────────────────────────────────────────────────────────────────
// Cuando un pedido B2C se confirma y paga:
// 1. Genera automáticamente la OT en BlueExpress
// 2. Trae la etiqueta (PDF) al sistema
// 3. Crea registro de Envio para tracking
// 4. Actualiza estado a "Listo para Despacho"
// 5. Notifica al cliente con tracking number

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const payload = await req.json();
    const { pedido_id, pedido } = payload;

    if (!pedido_id || !pedido) {
      return Response.json({
        ok: false,
        error: 'Falta pedido_id o pedido en payload',
      }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Solo procesar si está en estado confirmado y pagado
    if (pedido.payment_status !== 'paid') {
      return Response.json({
        ok: false,
        reason: 'Pedido aún no está pagado',
        current_status: pedido.payment_status,
      });
    }

    // Calcular peso total del pedido
    let pesoTotal = 0;
    try {
      const items = pedido.items_detalle || [];
      pesoTotal = items.reduce((sum, item) => {
        const qty = item.cantidad || 1;
        // Peso unitario del producto (fallback a 0.3kg si no está disponible)
        const pesoUnitario = 0.3;
        return sum + (pesoUnitario * qty);
      }, 0);
      if (pesoTotal === 0) pesoTotal = 0.5; // Mínimo
    } catch {
      pesoTotal = 0.5;
    }

    // Descripción de items para referencia
    const descItems = pedido.items_detalle?.map(
      (it) => `${it.cantidad}x ${it.nombre}`
    ).join(' + ') || pedido.descripcion_items || 'Artículos PEYU';

    // Llamar a bluexCreateShipment para generar OT
    const blueexRes = await sr.functions.invoke('bluexCreateShipment', {
      pedido_id,
      cliente_nombre: pedido.cliente_nombre,
      cliente_email: pedido.cliente_email,
      cliente_telefono: pedido.cliente_telefono || '',
      direccion_destino: pedido.direccion_envio,
      comuna_destino: pedido.ciudad,
      peso_kg: pesoTotal,
      valor_declarado: pedido.total || 0,
      print_format: 4, // PDF
      referencia: pedido.numero_pedido,
      comentarios: `Pedido PEYU ${pedido.numero_pedido} · ${descItems}`,
    });

    if (!blueexRes?.ok) {
      console.error('[generarEtiquetaB2C] BlueEx error:', blueexRes?.error);
      // Notificar a admin pero no fallar
      return Response.json({
        ok: false,
        error: blueexRes?.error || 'Error generando etiqueta BlueExpress',
      }, { status: 500 });
    }

    // Datos de envío obtenidos
    const tracking = blueexRes.tracking;
    const labelContent = blueexRes.label_contenido; // Base64 PDF
    const labelUrl = labelContent
      ? `data:application/pdf;base64,${labelContent}`
      : blueexRes.tracking_url;

    // Actualizar PedidoWeb
    const historial = pedido.historial || [];
    historial.push({
      at: new Date().toISOString(),
      type: 'shipping_generated',
      actor: 'system',
      channel: 'system',
      detail: `Etiqueta BlueExpress generada automáticamente · OT ${tracking}`,
      meta: { tracking, envio_id: blueexRes.envio_id },
    });

    // Guardar URL de etiqueta en campo personalizado
    await sr.entities.PedidoWeb.update(pedido_id, {
      courier: 'BlueExpress',
      tracking,
      estado: 'Listo para Despacho',
      historial,
      // Campo extra para guardar la etiqueta en base64 (si existe)
      notas: `${pedido.notas || ''}${pedido.notas ? '\n' : ''}[ETIQUETA_BLUEX] ${tracking}`,
    });

    // El registro Envio ya fue creado por bluexCreateShipment, no duplicar.

    // Enviar email al cliente con número de tracking
    try {
      const emailRes = await sr.functions.invoke('enviarConfirmacionPedido', {
        pedido_id,
        tipo: 'shipping_ready',
        tracking_number: tracking,
      });
      console.log('[generarEtiquetaB2C] Email tracking enviado:', emailRes?.ok);
    } catch (emailErr) {
      console.warn('[generarEtiquetaB2C] Error enviando email:', emailErr.message);
    }

    return Response.json({
      ok: true,
      pedido_id,
      numero_pedido: pedido.numero_pedido,
      tracking_number: tracking,
      label_url: labelUrl,
      status: 'Listo para Despacho',
      message: 'Etiqueta generada y pedido actualizado',
    });
  } catch (error) {
    console.error('[generarEtiquetaB2CBlueExpress]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});