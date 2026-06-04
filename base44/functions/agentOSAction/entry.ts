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

      default:
        return Response.json({ error: `Acción no soportada: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('agentOSAction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});