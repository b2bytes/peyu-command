// ============================================================================
// agentOSAction · Ejecutor de acciones del Peyu Agent OS (solo admin/founders)
// ----------------------------------------------------------------------------
// El río de conversación muestra tarjetas con botones; al confirmar, el front
// llama acá con { action, payload }. Centraliza TODAS las mutaciones reales para
// que el founder administre la plataforma desde el chat de forma segura.
//
// Acciones soportadas:
//   - updatePedidoEstado      { id, estado }
//   - marcarConsultaRespondida{ id }
//   - responderConsulta       { id, email, asunto, cuerpo }   (Gmail)
//   - updateLeadEstado        { id, status }
//   - enviarPropuesta         { proposalId }                  (reusa funciones)
//   - ajustarStock            { id, stock_actual }
//   - reenviarPropuesta       { proposalId }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function encodeHeader(str) {
  if (!str) return '';
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}
function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sendViaGmail(accessToken, { to, subject, html }) {
  const boundary = `peyu_os_${Date.now()}`;
  const plain = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const message = [
    `From: ${encodeHeader('PEYU Chile')} <ti@peyuchile.cl>`,
    `To: ${to}`,
    'Reply-To: ventas@peyuchile.cl',
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    plain,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(message) }),
  });
  if (!res.ok) throw new Error(`Gmail API ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: solo founders/admin' }, { status: 403 });

    const { action, payload = {} } = await req.json();
    const svc = base44.asServiceRole.entities;

    switch (action) {
      case 'updatePedidoEstado': {
        if (!payload.id || !payload.estado) throw new Error('Falta id o estado');
        await svc.PedidoWeb.update(payload.id, { estado: payload.estado });
        return Response.json({ ok: true, message: `Pedido actualizado a ${payload.estado}` });
      }

      case 'marcarConsultaRespondida': {
        if (!payload.id) throw new Error('Falta id de consulta');
        await svc.Consulta.update(payload.id, { estado: 'Respondida' });
        return Response.json({ ok: true, message: 'Consulta marcada como respondida' });
      }

      case 'responderConsulta': {
        if (!payload.id || !payload.email || !payload.cuerpo) throw new Error('Faltan datos para responder');
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#22302c;white-space:pre-wrap">${payload.cuerpo}</div>`;
        await sendViaGmail(accessToken, { to: payload.email, subject: payload.asunto || 'Respuesta de PEYU Chile', html });
        await svc.Consulta.update(payload.id, { estado: 'Respondida' });
        return Response.json({ ok: true, message: `Respuesta enviada a ${payload.email}` });
      }

      case 'updateLeadEstado': {
        if (!payload.id || !payload.status) throw new Error('Falta id o status');
        await svc.B2BLead.update(payload.id, { status: payload.status });
        return Response.json({ ok: true, message: `Lead actualizado a ${payload.status}` });
      }

      case 'eliminarLead': {
        if (!payload.id) throw new Error('Falta id de lead');
        await svc.B2BLead.delete(payload.id);
        return Response.json({ ok: true, message: 'Lead eliminado' });
      }

      case 'updatePropuestaEstado': {
        if (!payload.id || !payload.status) throw new Error('Falta id o status');
        await svc.CorporateProposal.update(payload.id, { status: payload.status });
        return Response.json({ ok: true, message: `Propuesta actualizada a ${payload.status}` });
      }

      case 'enviarPropuesta':
      case 'reenviarPropuesta': {
        if (!payload.proposalId) throw new Error('Falta proposalId');
        await base44.functions.invoke('generateProposalPDF', { proposalId: payload.proposalId }).catch(() => null);
        const res = await base44.functions.invoke('sendProposalEmail', { proposalId: payload.proposalId });
        return Response.json({ ok: true, message: 'Propuesta enviada', detail: res?.data });
      }

      case 'ajustarStock': {
        if (!payload.id || typeof payload.stock_actual !== 'number') throw new Error('Falta id o stock_actual');
        await svc.Producto.update(payload.id, { stock_actual: payload.stock_actual });
        return Response.json({ ok: true, message: `Stock ajustado a ${payload.stock_actual}u` });
      }

      case 'marcarPedidoPagado': {
        if (!payload.id) throw new Error('Falta id de pedido');
        const [pedido] = await svc.PedidoWeb.filter({ id: payload.id });
        if (!pedido) throw new Error('Pedido no encontrado');
        const ESTADOS_POST = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
        const historial = Array.isArray(pedido.historial) ? [...pedido.historial] : [];
        historial.push({
          at: new Date().toISOString(),
          type: 'paid',
          actor: user.email,
          channel: 'manual',
          detail: 'Pago confirmado manualmente desde Agent OS',
        });
        await svc.PedidoWeb.update(payload.id, {
          payment_status: 'paid',
          estado: ESTADOS_POST.includes(pedido.estado) ? pedido.estado : 'Confirmado',
          historial,
        });
        return Response.json({ ok: true, message: `Pedido ${pedido.numero_pedido || payload.id.slice(-6)} marcado como pagado ✓` });
      }

      case 'generarEtiqueta': {
        if (!payload.id) throw new Error('Falta id de pedido');
        const [pedido] = await svc.PedidoWeb.filter({ id: payload.id });
        if (!pedido) throw new Error('Pedido no encontrado');
        // Pago confirmado: payment_status 'paid' O estado post-pago (transferencias
        // confirmadas / WebPay quedan con estado Confirmado+ sin payment_status paid).
        const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
        const pagadoOk = pedido.payment_status === 'paid' || ESTADOS_PAGADOS.includes(pedido.estado);
        if (!pagadoOk) throw new Error('El pedido no está pagado. Márcalo como pagado primero.');
        if (pedido.tracking) {
          return Response.json({ ok: true, message: `Ya tiene tracking: ${pedido.tracking}`, tracking: pedido.tracking });
        }
        const d = await base44.asServiceRole.functions.invoke('generarEtiquetaB2CBlueExpress', { pedido_id: payload.id, pedido });
        if (!d?.ok) throw new Error(d?.error || d?.reason || 'Error generando etiqueta BlueExpress');
        return Response.json({
          ok: true,
          message: `Etiqueta generada · OT ${d.tracking_number || ''}`,
          tracking: d.tracking_number,
          label_url: d.label_url || null,
        });
      }

      case 'cancelarPedido': {
        if (!payload.id) throw new Error('Falta id de pedido');
        const [pedido] = await svc.PedidoWeb.filter({ id: payload.id });
        if (!pedido) throw new Error('Pedido no encontrado');
        const historial = Array.isArray(pedido.historial) ? [...pedido.historial] : [];
        historial.push({
          at: new Date().toISOString(),
          type: 'cancelled',
          actor: user.email,
          channel: 'manual',
          detail: payload.motivo || 'Cancelado desde Agent OS',
        });
        await svc.PedidoWeb.update(payload.id, { estado: 'Cancelado', historial });
        return Response.json({ ok: true, message: `Pedido ${pedido.numero_pedido || payload.id.slice(-6)} cancelado` });
      }

      case 'updateProducto': {
        if (!payload.id) throw new Error('Falta id de producto');
        const campos = {};
        if (typeof payload.precio_b2c === 'number') campos.precio_b2c = payload.precio_b2c;
        if (typeof payload.stock_actual === 'number') campos.stock_actual = payload.stock_actual;
        if (typeof payload.activo === 'boolean') campos.activo = payload.activo;
        if (!Object.keys(campos).length) throw new Error('Nada que actualizar (acepta: precio_b2c, stock_actual, activo)');
        await svc.Producto.update(payload.id, campos);
        return Response.json({ ok: true, message: `Producto actualizado: ${Object.keys(campos).join(', ')}` });
      }

      case 'enviarEmail': {
        if (!payload.to || !payload.cuerpo) throw new Error('Falta destinatario (to) o cuerpo');
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#22302c;white-space:pre-wrap">${payload.cuerpo}</div>`;
        await sendViaGmail(accessToken, { to: payload.to, subject: payload.asunto || 'PEYU Chile', html });
        return Response.json({ ok: true, message: `Email enviado a ${payload.to}` });
      }

      case 'sincronizarTracking': {
        const r = await base44.asServiceRole.functions.invoke('bluexSyncAllShipments', {});
        return Response.json({ ok: true, message: 'Tracking BlueExpress sincronizado', detail: r || null });
      }

      default:
        return Response.json({ error: `Acción no soportada: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('agentOSAction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});