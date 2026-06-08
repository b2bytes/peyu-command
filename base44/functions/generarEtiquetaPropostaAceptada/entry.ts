import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// Generar Etiqueta Automática · Propuesta Aceptada
// Automation trigger: CorporateProposal status cambio a "Aceptada"
// ─────────────────────────────────────────────────────────────────────────────
// Cuando una propuesta se marca como "Aceptada":
// 1. Genera automáticamente la OT/etiqueta en BlueExpress
// 2. Trae la etiqueta a la propuesta
// 3. Crea registro de Envio para tracking
// 4. Notifica al cliente

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { proposal_id, proposal } = payload;

    if (!proposal_id || !proposal) {
      return Response.json({
        error: 'Falta proposal_id o proposal en payload',
      }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Verificar que la propuesta está aceptada
    if (proposal.status !== 'Aceptada') {
      return Response.json({
        ok: false,
        reason: 'Propuesta no está en estado Aceptada',
        current_status: proposal.status,
      });
    }

    // Parsear items para obtener peso y descripción
    let items = [];
    let pesoTotal = 0;
    try {
      items = JSON.parse(proposal.items_json || '[]');
      pesoTotal = items.reduce((sum, item) => sum + (item.peso_kg || 0.5), 0) || 0.5;
    } catch {
      pesoTotal = 0.5; // Default
    }

    // Llamar a bluexCreateShipment para generar la OT
    const blueexRes = await base44.asServiceRole.functions.invoke('bluexCreateShipment', {
      proposal_id,
      cliente_nombre: proposal.contacto,
      cliente_email: proposal.email,
      cliente_telefono: proposal.numero || '',
      direccion_destino: proposal.direccion_entrega,
      comuna_destino: proposal.comuna_entrega,
      peso_kg: pesoTotal,
      valor_declarado: proposal.total || 0,
      print_format: 4, // PDF para propuestas corporativas
      referencia: proposal.numero,
      comentarios: `Propuesta PEYU #${proposal.numero}`,
    });

    if (!blueexRes?.ok) {
      console.error('[generarEtiqueta] BlueEx error:', blueexRes?.error);
      return Response.json({
        ok: false,
        error: blueexRes?.error || 'Error generando etiqueta BlueExpress',
      }, { status: 500 });
    }

    // Actualizar propuesta con datos de envío
    const tracking = blueexRes.tracking;
    const labelUrl = blueexRes.label_contenido
      ? `data:application/pdf;base64,${blueexRes.label_contenido}`
      : blueexRes.tracking_url;

    const historial = proposal.historial || [];
    historial.push({
      at: new Date().toISOString(),
      type: 'shipping_generated',
      actor: user.email,
      channel: 'system',
      detail: `Etiqueta BlueExpress generada automáticamente · OT ${tracking}`,
      meta: { tracking, envio_id: blueexRes.envio_id },
    });

    await sr.entities.CorporateProposal.update(proposal_id, {
      status: 'Listo para Despacho', // Nuevo estado
      logo_url: blueexRes.label_contenido ? labelUrl : proposal.logo_url, // Guardar etiqueta
      historial,
    });

    // Enviar email al cliente con etiqueta adjunta
    try {
      const emailRes = await base44.asServiceRole.functions.invoke('sendProposalEmail', {
        proposal_id,
        tipo: 'shipment_generated',
        tracking_number: tracking,
        label_url: labelUrl,
      });
      console.log('[generarEtiqueta] Email enviado:', emailRes?.ok);
    } catch (emailErr) {
      console.warn('[generarEtiqueta] Error enviando email:', emailErr.message);
      // No fallar por email
    }

    return Response.json({
      ok: true,
      proposal_id,
      tracking_number: tracking,
      label_url: labelUrl,
      status: 'Listo para Despacho',
      envio_id: blueexRes.envio_id,
      message: 'Etiqueta generada y propuesta actualizada',
    });
  } catch (error) {
    console.error('[generarEtiquetaPropostaAceptada]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});