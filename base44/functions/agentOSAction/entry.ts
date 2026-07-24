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

    // ═══ HARNESS · Auditoría central ════════════════════════════════════
    // Cada acción del Agent OS queda registrada (quién, qué, cuándo, resultado)
    // en ActivityLog. Fire-and-forget: si la auditoría falla, JAMÁS afecta la
    // respuesta al founder — estabilidad primero.
    const auditar = (ok, detalle = '') => {
      svc.ActivityLog.create({
        event_type: 'other',
        category: 'Sistema',
        user_email: user.email,
        user_name: user.full_name || '',
        description: `[AgentOS] ${action} · ${ok ? 'OK' : 'ERROR'}${detalle ? ` · ${String(detalle).slice(0, 300)}` : ''}`,
        entity_type: 'AgentOSAction',
        entity_id: payload.id || payload.proposalId || payload.pedido_id || '',
        meta: { action, payload_keys: Object.keys(payload), ok },
      }).catch(() => null);
    };

    // ═══ HARNESS · Guard de acciones destructivas ═══════════════════════
    // Las acciones irreversibles exigen confirmación explícita del founder
    // (payload.confirmado=true, que el front envía tras su diálogo de confirmación).
    const DESTRUCTIVAS = ['eliminarLead', 'cancelarPedido', 'anularGiftCard'];
    const esCuponEliminar = action === 'toggleCupon' && payload.accion === 'eliminar';
    if ((DESTRUCTIVAS.includes(action) || esCuponEliminar) && payload.confirmado !== true) {
      auditar(false, 'bloqueada: falta confirmación explícita');
      return Response.json({
        ok: false,
        requires_confirmation: true,
        error: 'Esta acción es irreversible y requiere confirmación explícita.',
      }, { status: 428 });
    }

    const ejecutar = async () => {
    switch (action) {
      case 'updatePedidoEstado': {
        if (!payload.id || !payload.estado) throw new Error('Falta id o estado');
        // ═══ GUARD DE PAGO · Centralizado ══════════════════════════════════
        // Enruta por updateShippingStatus que tiene el guard de pago completo
        // (MP sin webhook = bloqueado; transferencias/webpay = auto-paid al
        // confirmar). Antes se actualizaba directo y bypasseaba el guard.
        const res = await base44.asServiceRole.functions.invoke('updateShippingStatus', {
          pedido_id: payload.id,
          nuevo_estado: payload.estado,
          force_confirm_payment: !!payload.force,
        });
        const d = res?.data ?? res;
        if (d?.blocked) {
          return Response.json({
            ok: false,
            error: d.error,
            blocked: true,
            can_force: d.can_force || false,
            payment_status: d.payment_status,
          }, { status: 403 });
        }
        if (!d?.ok) throw new Error(d?.error || 'Error al actualizar estado');
        return Response.json({
          ok: true,
          message: `Pedido actualizado a ${payload.estado}${d.bluex?.tracking ? ` · etiqueta ${d.bluex.tracking}` : ''}${d.email_enviado ? ' · email enviado' : ''}`,
          bluex: d.bluex || null,
        });
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

      case 'updateCotizacionEstado': {
        // Actualiza el estado de una Cotizacion (generada desde el chat público
        // o WhatsApp). Cotizacion usa `estado` en vez de `status`.
        if (!payload.id || !payload.status) throw new Error('Falta id o status');
        await svc.Cotizacion.update(payload.id, { estado: payload.status });
        return Response.json({ ok: true, message: `Cotización actualizada a ${payload.status}` });
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
        // ═══ GUARD DE PAGO · Estricto ═══════════════════════════════════════
        // Requiere payment_status='paid' estrictamente. generateCleanBaseImage
        // y bluexCreateShipment también lo validan, pero bloqueamos acá primero
        // para dar un error claro antes de intentar la emisión.
        if (pedido.payment_status !== 'paid') {
          throw new Error(`El pedido no está pagado (payment_status: ${pedido.payment_status || 'vacío'}). Márcalo como pagado primero.`);
        }
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

      case 'generarEtiquetasMasivo': {
        // Generación POR VOLUMEN de etiquetas BlueExpress desde el chat.
        // Si vienen payload.ids → usa esos pedidos; si no, detecta automáticamente
        // los "Listo para Despacho" pagados sin tracking. Genera cada OT reusando
        // generarEtiquetaB2CBlueExpress y devuelve resultados listos para imprimir.
        const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
        let pedidos = [];
        if (Array.isArray(payload.ids) && payload.ids.length) {
          const todos = await Promise.all(payload.ids.map((id) => svc.PedidoWeb.filter({ id }).then((r) => r[0]).catch(() => null)));
          pedidos = todos.filter(Boolean);
        } else {
          const listos = await svc.PedidoWeb.filter({ estado: 'Listo para Despacho' }, '-fecha', 100);
          pedidos = listos.filter((p) => !p.tracking);
        }

        // Filtrar a los elegibles: estrictamente pagados (payment_status='paid')
        // y sin tracking ya emitido. Endurecido: antes aceptaba cualquier estado
        // post-pago, lo que permitía emitir etiquetas de pedidos no pagados que
        // llegaron a "Listo para Despacho" por caminos no autorizados.
        const elegibles = pedidos.filter((p) => p.payment_status === 'paid' && !p.tracking);

        if (!elegibles.length) {
          return Response.json({ ok: true, message: 'No hay pedidos pagados sin etiqueta para generar.', generadas: 0, resultados: [] });
        }

        const resultados = [];
        let okCount = 0;
        for (const pedido of elegibles) {
          try {
            const res = await base44.asServiceRole.functions.invoke('generarEtiquetaB2CBlueExpress', { pedido_id: pedido.id, pedido });
            const d = res?.data ?? res;
            if (d?.ok) {
              okCount++;
              resultados.push({
                pedido_id: pedido.id,
                numero_pedido: pedido.numero_pedido,
                cliente_nombre: pedido.cliente_nombre,
                ok: true,
                tracking: d.tracking_number || null,
                label_url: d.label_url || null,
              });
            } else {
              resultados.push({
                pedido_id: pedido.id,
                numero_pedido: pedido.numero_pedido,
                cliente_nombre: pedido.cliente_nombre,
                ok: false,
                error: d?.error || d?.reason || 'Error generando etiqueta',
              });
            }
          } catch (e) {
            resultados.push({
              pedido_id: pedido.id,
              numero_pedido: pedido.numero_pedido,
              cliente_nombre: pedido.cliente_nombre,
              ok: false,
              error: e.message,
            });
          }
        }

        return Response.json({
          ok: true,
          message: `${okCount} de ${elegibles.length} etiquetas generadas`,
          generadas: okCount,
          total: elegibles.length,
          resultados,
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

      case 'crearDiseno': {
        // Crea un diseño PEYU para el personalizador (grabado láser) desde el
        // chat. El founder adjunta la imagen y el agente propone esta acción.
        if (!payload.nombre || !payload.imagen_url?.startsWith('http')) throw new Error('Falta nombre o imagen_url válida');
        const nuevo = await svc.DisenoPeyu.create({
          nombre: payload.nombre,
          imagen_url: payload.imagen_url,
          categoria: payload.categoria || 'Otro',
          activo: true,
          es_ejemplo: false,
          orden: typeof payload.orden === 'number' ? payload.orden : 0,
        });
        // Regenerar versión grabado láser en segundo plano.
        base44.asServiceRole.functions.invoke('engraveDisenosPeyu', {}).catch(() => null);
        return Response.json({ ok: true, message: `Diseño "${payload.nombre}" creado y visible en el personalizador. La versión grabado se genera en segundos.`, id: nuevo.id });
      }

      case 'updateDiseno': {
        // Edita un diseño PEYU existente: cambiar imagen (adjunta), nombre,
        // categoría, activar/desactivar u orden. Si cambia la imagen, se limpia
        // y regenera la versión grabado.
        if (!payload.id) throw new Error('Falta id del diseño');
        const campos = {};
        if (typeof payload.nombre === 'string' && payload.nombre.trim()) campos.nombre = payload.nombre.trim();
        if (typeof payload.categoria === 'string' && payload.categoria.trim()) campos.categoria = payload.categoria.trim();
        if (typeof payload.activo === 'boolean') campos.activo = payload.activo;
        if (typeof payload.orden === 'number') campos.orden = payload.orden;
        if (typeof payload.imagen_url === 'string' && payload.imagen_url.startsWith('http')) {
          campos.imagen_url = payload.imagen_url;
          campos.imagen_grabado_url = ''; // se regenera con la imagen nueva
        }
        if (!Object.keys(campos).length) throw new Error('Nada que actualizar (acepta: nombre, categoria, activo, orden, imagen_url)');
        await svc.DisenoPeyu.update(payload.id, campos);
        if (campos.imagen_url) base44.asServiceRole.functions.invoke('engraveDisenosPeyu', {}).catch(() => null);
        return Response.json({ ok: true, message: `Diseño actualizado: ${Object.keys(campos).filter((k) => k !== 'imagen_grabado_url').join(', ')}${campos.imagen_url ? ' (grabado regenerándose)' : ''}` });
      }

      case 'toggleCupon': {
        // Crear, activar/desactivar o eliminar un cupón de descuento.
        // accion: 'crear' | 'toggle' | 'eliminar'
        const { accion, id, activo, data } = payload;
        if (accion === 'crear') {
          if (!data?.codigo?.trim()) throw new Error('Falta código del cupón');
          if (!data?.valor && data?.tipo !== 'envio_gratis') throw new Error('Falta valor del descuento');
          const existente = await svc.Cupon.filter({ codigo: data.codigo.trim().toUpperCase() });
          if (existente?.length) throw new Error(`Ya existe un cupón con código ${data.codigo}`);
          const nuevo = await svc.Cupon.create({
            codigo: data.codigo.trim().toUpperCase(),
            tipo: data.tipo || 'porcentaje',
            valor: Number(data.valor) || 0,
            minimo_compra_clp: Number(data.minimo) || 0,
            max_descuento_clp: data.max_descuento ? Number(data.max_descuento) : undefined,
            usos_max: Number(data.usos_max) || 0,
            fecha_expiracion: data.fecha_expiracion || undefined,
            descripcion: data.descripcion || undefined,
            activo: true,
            usos_actuales: 0,
          });
          return Response.json({ ok: true, message: `Cupón "${nuevo.codigo}" creado y activo en checkout 🏷️` });
        }
        if (accion === 'toggle') {
          if (!id) throw new Error('Falta id del cupón');
          await svc.Cupon.update(id, { activo: !!activo });
          return Response.json({ ok: true, message: `Cupón ${activo ? 'activado ✓' : 'pausado ⏸️'}` });
        }
        if (accion === 'eliminar') {
          if (!id) throw new Error('Falta id del cupón');
          await svc.Cupon.delete(id);
          return Response.json({ ok: true, message: 'Cupón eliminado 🗑️' });
        }
        throw new Error('Acción de cupón no válida');
      }

      case 'crearGiftCard': {
        // Crea una gift card manual desde el chat del agente y envía email.
        if (!payload.destinatario_email?.trim()) throw new Error('Falta email del destinatario');
        if (!payload.monto_clp || payload.monto_clp < 1000) throw new Error('Monto mínimo $1.000 CLP');
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
        let code2 = '';
        for (let i = 0; i < 4; i++) code2 += chars[Math.floor(Math.random() * chars.length)];
        const codigo = `PEYU-${code}-${code2}`;
        const fechaExp = new Date();
        fechaExp.setFullYear(fechaExp.getFullYear() + 1);
        const gc = await svc.GiftCard.create({
          codigo,
          monto_clp: Number(payload.monto_clp),
          saldo_clp: Number(payload.monto_clp),
          estado: 'Activa',
          comprador_nombre: payload.comprador_nombre || undefined,
          comprador_email: payload.comprador_email || undefined,
          destinatario_nombre: payload.destinatario_nombre || undefined,
          destinatario_email: payload.destinatario_email.trim().toLowerCase(),
          mensaje: payload.mensaje || undefined,
          fecha_emision: new Date().toISOString().slice(0, 10),
          fecha_expiracion: fechaExp.toISOString().slice(0, 10),
          email_enviado: false,
        });
        // Enviar email al destinatario en segundo plano.
        base44.asServiceRole.functions.invoke('enviarGiftCard', { giftcard_id: gc.id }).catch(() => null);
        return Response.json({ ok: true, message: `Gift Card ${codigo} creada por $${Number(payload.monto_clp).toLocaleString('es-CL')} → ${payload.destinatario_email}. Email enviado 🎁` });
      }

      case 'anularGiftCard': {
        if (!payload.id) throw new Error('Falta id de la gift card');
        const [gc] = await svc.GiftCard.filter({ id: payload.id });
        if (!gc) throw new Error('Gift Card no encontrada');
        if (gc.estado === 'Anulada') throw new Error('Ya está anulada');
        await svc.GiftCard.update(payload.id, { estado: 'Anulada', saldo_clp: 0 });
        return Response.json({ ok: true, message: `Gift Card ${gc.codigo} anulada. Saldo: $0.` });
      }

      case 'sincronizarTracking': {
        const r = await base44.asServiceRole.functions.invoke('bluexSyncAllShipments', {});
        return Response.json({ ok: true, message: 'Tracking BlueExpress sincronizado', detail: r || null });
      }

      // ── Nuevas capacidades del Agent OS (2026) ─────────────────────────
      case 'crearPedidoManual': {
        // Crea un pedido manual (B2B o B2C) desde el chat. Items con sku+cant.
        if (!payload.cliente_nombre) throw new Error('Falta nombre del cliente');
        if (!payload.items || !Array.isArray(payload.items) || !payload.items.length) throw new Error('Falta items del pedido');
        const num_pedido = `PED-${Date.now().toString().slice(-6)}`;
        const items_detalle = [];
        let subtotal = 0;
        for (const it of payload.items) {
          const prod = await svc.Producto.filter({ sku: it.sku }).catch(() => []);
          const p = prod?.[0];
          if (!p) continue;
          const cant = Math.max(1, parseInt(it.cantidad) || 1);
          const precio = it.precio_unitario || p.precio_b2c || 0;
          subtotal += precio * cant;
          items_detalle.push({ sku: p.sku, nombre: p.nombre, cantidad: cant, precio_unitario: precio });
        }
        if (!items_detalle.length) throw new Error('No se encontraron productos válidos');
        const iva = Math.round(subtotal * 0.19);
        const total = subtotal + iva;
        const hoy = new Date().toISOString().slice(0, 10);
        const pedido = await svc.PedidoWeb.create({
          numero_pedido: num_pedido,
          fecha: hoy,
          canal: payload.canal || 'WhatsApp',
          cliente_nombre: payload.cliente_nombre,
          cliente_email: payload.cliente_email || '',
          cliente_telefono: payload.cliente_telefono || '',
          tipo_cliente: payload.tipo_cliente || 'B2B Corporativo',
          items_detalle,
          cantidad: items_detalle.reduce((s, i) => s + i.cantidad, 0),
          subtotal,
          total,
          medio_pago: payload.medio_pago || 'Transferencia',
          estado: payload.estado || 'Nuevo',
          payment_status: 'pending_transfer',
          direccion_envio: payload.direccion_envio || '',
          ciudad: payload.ciudad || '',
          notas: payload.notas || `Pedido creado manualmente desde Agent OS por ${user.email}`,
          historial: [{ at: new Date().toISOString(), type: 'created', actor: user.email, channel: 'system', detail: 'Pedido creado desde Agent OS' }],
        });
        return Response.json({ ok: true, message: `Pedido ${num_pedido} creado para ${payload.cliente_nombre} · $${total.toLocaleString('es-CL')} (${items_detalle.length} items)`, pedido_id: pedido.id });
      }

      case 'duplicarProducto': {
        // Duplica un producto existente (para crear variantes rápido).
        if (!payload.id) throw new Error('Falta id del producto a duplicar');
        const [orig] = await svc.Producto.filter({ id: payload.id });
        if (!orig) throw new Error('Producto no encontrado');
        const copia = await svc.Producto.create({
          sku: payload.nuevo_sku || `${orig.sku}-COPY`,
          nombre: payload.nuevo_nombre || `${orig.nombre} (copia)`,
          categoria: orig.categoria,
          material: orig.material,
          canal: orig.canal,
          descripcion: orig.descripcion || '',
          precio_b2c: orig.precio_b2c || undefined,
          precio_b2b_tramos: orig.precio_b2b_tramos || undefined,
          stock_actual: 0,
          activo: false,
          colores: orig.colores || [],
          incluye: orig.incluye || '',
          dimensiones: orig.dimensiones || '',
          garantia_anios: orig.garantia_anios || undefined,
          lead_time_sin_personal: orig.lead_time_sin_personal || undefined,
          lead_time_con_personal: orig.lead_time_con_personal || undefined,
        });
        return Response.json({ ok: true, message: `Producto duplicado: "${copia.nombre}" (SKU ${copia.sku}). Quedó inactivo — actívalo cuando esté listo.`, producto_id: copia.id });
      }

      case 'actualizarPrecioProducto': {
        // Actualiza precio B2C o tramos B2B de un producto.
        if (!payload.id) throw new Error('Falta id del producto');
        const campos = {};
        if (typeof payload.precio_b2c === 'number' && payload.precio_b2c > 0) campos.precio_b2c = payload.precio_b2c;
        if (payload.precio_b2b_tramos && typeof payload.precio_b2b_tramos === 'object') campos.precio_b2b_tramos = payload.precio_b2b_tramos;
        if (!Object.keys(campos).length) throw new Error('Especifica precio_b2c o precio_b2b_tramos');
        await svc.Producto.update(payload.id, campos);
        const changed = Object.keys(campos).join(', ');
        return Response.json({ ok: true, message: `Precio actualizado: ${changed}` });
      }

      // ── Memoria a largo plazo del agente ──────────────────────────────
      // Guarda un aprendizaje/decisión en MetaAgentMemory + Pinecone para
      // que el agente lo recupere en futuras conversaciones.
      case 'saveKnowledge': {
        if (!payload.text || !payload.text.trim()) throw new Error('Falta el texto a guardar');
        const r = await base44.asServiceRole.functions.invoke('saveKnowledge', {
          text: payload.text.trim().slice(0, 6000),
          source: 'agente_os',
          kind: payload.kind || 'aprendizaje',
        });
        return Response.json({ ok: true, message: `Guardado en memoria permanente: "${payload.text.trim().slice(0, 80)}${payload.text.length > 80 ? '…' : ''}" 🧠` });
      }

      default:
        return Response.json({ error: `Acción no soportada: ${action}` }, { status: 400 });
    }
    };

    // HARNESS · Estabilidad: ejecutar y auditar siempre; el error se propaga
    // al catch general que responde con el mensaje claro de siempre.
    try {
      const resp = await ejecutar();
      auditar(resp.status < 400);
      return resp;
    } catch (error) {
      auditar(false, error.message);
      throw error;
    }
  } catch (error) {
    console.error('agentOSAction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});