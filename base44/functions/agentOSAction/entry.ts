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

      case 'autoCotizarLead': {
        // Genera una propuesta corporativa para un lead concreto desde el chat:
        // elige el mejor producto del catálogo según su interés y cantidad,
        // crea la CorporateProposal y avanza el lead a "Propuesta enviada".
        if (!payload.id) throw new Error('Falta id de lead');
        const [lead] = await svc.B2BLead.filter({ id: payload.id });
        if (!lead) throw new Error('Lead no encontrado');
        const qty = parseInt(lead.qty_estimate) || 50;

        // Elegir mejor producto del catálogo B2B por palabras clave del interés.
        const catalogo = await svc.Producto.filter({ activo: true, canal: 'B2B + B2C' }).catch(() => []);
        if (!catalogo.length) throw new Error('No hay productos B2B activos en el catálogo');
        const interes = (lead.product_interest || '').toLowerCase();
        const tieneTarifaB2B = (p) => {
          const t = p.precio_b2b_tramos;
          return t && typeof t === 'object' && Object.values(t).some((v) => Number(v) > 0);
        };
        const scored = catalogo.map((p) => {
          const name = (p.nombre || '').toLowerCase();
          let score = 0;
          for (const w of interes.split(/\s+/).filter((x) => x.length > 2)) if (name.includes(w)) score += 10;
          if (tieneTarifaB2B(p)) score += 8; // priorizar cotizables
          if ((p.stock_actual || 0) >= qty) score += 3;
          return { p, score };
        }).sort((a, b) => b.score - a.score);
        // Preferir el mejor con tarifa B2B oficial; si ninguno la tiene, el top.
        const producto = scored.find((s) => tieneTarifaB2B(s.p))?.p || scored[0]?.p || catalogo[0];

        const items = [{
          nombre: producto.nombre,
          sku: producto.sku,
          qty,
          // createCorporateProposal exige tabla B2B oficial (precio_b2b_tramos).
          precio_b2b_tramos: producto.precio_b2b_tramos || null,
          precio_b2c: producto.precio_b2c || null,
          personalizacion: !!lead.personalization_needs,
        }];

        const propRes = await base44.functions.invoke('createCorporateProposal', {
          leadId: lead.id,
          items,
          notes: lead.notes || '',
        });
        const d = propRes?.data ?? propRes;
        const proposalId = d?.proposal_id;
        if (!proposalId) {
          // Producto sin tarifa B2B oficial → mensaje claro en vez de fallar mudo.
          if (d?.error === 'precio_a_consultar') {
            throw new Error(`"${producto.nombre}" no tiene tarifa B2B oficial cargada. Cárgala en el catálogo B2B antes de cotizar.`);
          }
          throw new Error(d?.error || 'No se pudo crear la propuesta');
        }

        await svc.B2BLead.update(lead.id, { status: 'Propuesta enviada' });
        return Response.json({
          ok: true,
          message: `Propuesta creada para ${lead.company_name || lead.contact_name} (${qty}u · ${producto.nombre}). Revísala en Ventas & Propuestas para enviarla.`,
          proposalId,
        });
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
        const res = await base44.asServiceRole.functions.invoke('generarEtiquetaB2CBlueExpress', { pedido_id: payload.id, pedido });
        // invoke puede devolver la data directa o envuelta en { data } (axios-like)
        const d = res?.data ?? res;
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
        if (typeof payload.imagen_url === 'string' && payload.imagen_url.startsWith('http')) campos.imagen_url = payload.imagen_url;
        if (!Object.keys(campos).length) throw new Error('Nada que actualizar (acepta: precio_b2c, stock_actual, activo, imagen_url)');
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

      case 'generarImagenProducto':
      case 'generarVideoProducto': {
        const r = await base44.functions.invoke('agentGenerateMedia', {
          tipo: action === 'generarVideoProducto' ? 'video' : 'imagen',
          sku: payload.sku,
          producto: payload.producto,
          efecto: payload.efecto,
          formato: payload.formato,
          duracion: payload.duracion,
          red_social: payload.red_social,
        });
        if (!r?.data?.ok) throw new Error(r?.data?.error || 'Error generando el contenido');
        return Response.json({ ok: true, message: r.data.message, url: r.data.url });
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