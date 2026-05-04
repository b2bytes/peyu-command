import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// onNewPedidoWeb — Trigger al crear un PedidoWeb
// ============================================================================
// 1. Email confirmación HTML al cliente (mismo lenguaje visual)
// 2. Email interno al equipo
// 3. Descuenta stock
// 4. Crea PersonalizationJob si requiere láser
// 5. Upsert perfil Cliente (CLV, ticket, segmento)
// ----------------------------------------------------------------------------

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

function buildClientHtml(pedido) {
  const envioTexto = pedido.costo_envio === 0 ? 'GRATIS' : fmtCLP(pedido.costo_envio || 0);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
  <tr><td align="center">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">

      <!-- HERO -->
      <tr><td style="background:linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%);padding:44px 40px 36px;color:#fff;text-align:center;">
        <div style="font-size:56px;margin-bottom:12px;">🎉</div>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase;">Pedido confirmado</p>
        <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#fff;letter-spacing:-0.5px;">¡Gracias por tu compra!</h1>
        <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:600;letter-spacing:1px;">PEDIDO ${pedido.numero_pedido}</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${pedido.cliente_nombre || 'cliente'},</p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
          Recibimos tu pedido exitosamente. Estamos preparándolo con mucho cuidado en nuestro taller en Santiago.
        </p>

        <!-- TOTAL CARD -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F0FAF7 0%,#E0F2EB 100%);border:1px solid #C8E6DA;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#0F8B6C;text-transform:uppercase;">Total pagado</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#0F172A;letter-spacing:-1px;line-height:1;font-variant-numeric:tabular-nums;">${fmtCLP(pedido.total)}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#64748B;">CLP · Envío: ${envioTexto}</p>
          </td></tr>
        </table>

        <!-- DETAIL -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Detalle</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 12px;font-size:14px;color:#0F172A;line-height:1.5;">${pedido.descripcion_items || 'Ver detalle en tienda'}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E0D6;padding-top:12px;margin-top:8px;font-size:13px;">
              <tr><td style="padding:5px 0;color:#64748B;">Fecha</td><td style="padding:5px 0;text-align:right;color:#0F172A;font-weight:600;">${pedido.fecha || new Date().toLocaleDateString('es-CL')}</td></tr>
              ${pedido.ciudad ? `<tr><td style="padding:5px 0;color:#64748B;">Ciudad</td><td style="padding:5px 0;text-align:right;color:#0F172A;font-weight:600;">${pedido.ciudad}</td></tr>` : ''}
              ${pedido.medio_pago ? `<tr><td style="padding:5px 0;color:#64748B;">Medio de pago</td><td style="padding:5px 0;text-align:right;color:#0F172A;font-weight:600;">${pedido.medio_pago}</td></tr>` : ''}
            </table>
          </td></tr>
        </table>

        ${pedido.requiere_personalizacion ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3E8FF;border:1px solid #C4B5FD;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;font-size:14px;color:#5B21B6;line-height:1.5;">
            <strong>✨ Tu pedido incluye personalización láser UV.</strong><br>
            <span style="font-size:13px;color:#7C3AED;">Te contactaremos para coordinar los detalles del grabado.</span>
          </td></tr>
        </table>` : ''}

        <!-- TIMELINE -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Qué sigue</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="padding:8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">1</div></td>
                <td style="padding-left:12px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">Producción</strong> · 2–4 días hábiles</td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">2</div></td>
                <td style="padding-left:12px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">Despacho</strong> · vía Starken/Chilexpress/BlueExpress</td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">3</div></td>
                <td style="padding-left:12px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">Entrega</strong> · 2–5 días hábiles según destino</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- TRACKING CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido)}" style="display:inline-block;background:#0F8B6C;color:#fff;padding:16px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(15,139,108,0.25);">Ver seguimiento del pedido →</a>
          </td></tr>
        </table>

        <!-- HELP -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;margin-bottom:8px;">
          <tr><td style="padding:14px 18px;font-size:13px;color:#78350F;line-height:1.55;">
            <strong>¿Tienes preguntas?</strong> Escríbenos por WhatsApp al
            <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none;font-weight:700;">+56 9 3504 0242</a> o responde este email.
          </td></tr>
        </table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0F172A;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#fff;font-weight:700;">PEYU Chile · Plástico que renace 🐢</p>
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Productos 100% reciclados · Hechos en Santiago</p>
        <p style="margin:0;font-size:11px;">
          <a href="https://peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">peyuchile.cl</a>
          <span style="color:#475569;margin:0 6px;">·</span>
          <a href="mailto:ventas@peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">ventas@peyuchile.cl</a>
        </p>
      </td></tr>
    </table>

  </td></tr>
</table>

</body></html>`;
}

function buildInternalHtml(pedido) {
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#F4F1EB;padding:24px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:2px solid #0F8B6C;padding:28px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;color:#0F8B6C;text-transform:uppercase;">Nuevo pedido web</p>
  <h2 style="color:#0F172A;margin:0 0 16px;font-size:22px;">🛒 ${pedido.numero_pedido}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;background:#FAFAF8;border-radius:12px;margin-bottom:14px;">
    <tr><td style="padding:8px 14px;color:#64748B;">Cliente:</td><td style="padding:8px 14px;text-align:right;"><strong>${pedido.cliente_nombre}</strong></td></tr>
    <tr><td style="padding:8px 14px;color:#64748B;">Email:</td><td style="padding:8px 14px;text-align:right;color:#0F8B6C;">${pedido.cliente_email || '—'}</td></tr>
    <tr><td style="padding:8px 14px;color:#64748B;">Teléfono:</td><td style="padding:8px 14px;text-align:right;">${pedido.cliente_telefono || '—'}</td></tr>
    <tr><td style="padding:8px 14px;color:#64748B;">Ciudad:</td><td style="padding:8px 14px;text-align:right;">${pedido.ciudad || '—'}</td></tr>
    <tr><td style="padding:8px 14px;color:#64748B;">Total:</td><td style="padding:8px 14px;text-align:right;"><strong style="color:#0F8B6C;font-size:16px;">${fmtCLP(pedido.total)}</strong></td></tr>
    <tr><td style="padding:8px 14px;color:#64748B;">Pago:</td><td style="padding:8px 14px;text-align:right;">${pedido.medio_pago || 'WebPay'}</td></tr>
  </table>
  <p style="margin:14px 0 6px;font-size:12px;font-weight:700;color:#94A3B8;letter-spacing:0.5px;text-transform:uppercase;">Productos</p>
  <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;background:#F4F1EB;padding:12px 14px;border-radius:8px;">${pedido.descripcion_items || '—'}</p>
  ${pedido.requiere_personalizacion ? `
  <div style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-top:14px;font-size:13px;color:#78350F;">
    ⚠️ <strong>Requiere personalización láser</strong>
  </div>` : ''}
  <p style="margin-top:18px;text-align:center;">
    <a href="https://peyuchile.cl/admin/procesar-pedidos" style="display:inline-block;background:#0F172A;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px;">Procesar pedido →</a>
  </p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data: pedido, event } = body;

    if (!pedido || event?.type !== 'create') {
      return Response.json({ ok: true, skip: true });
    }

    const tareas = [];

    // ── 1. EMAIL CLIENTE (HTML) ──────────────────────────────────
    if (pedido.cliente_email) {
      tareas.push(
        base44.asServiceRole.integrations.Core.SendEmail({
          to: pedido.cliente_email,
          from_name: 'PEYU Chile',
          subject: `🎉 Pedido confirmado · ${pedido.numero_pedido}`,
          body: buildClientHtml(pedido),
        })
      );
    }

    // ── 2. EMAIL INTERNO ────────────────────────────────────────
    tareas.push(
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'ventas@peyuchile.cl',
        from_name: 'Sistema PEYU',
        subject: `🛒 Nuevo pedido · ${pedido.numero_pedido} · ${fmtCLP(pedido.total)}`,
        body: buildInternalHtml(pedido),
      })
    );

    // ── 3. STOCK ─────────────────────────────────────────────────
    if (pedido.sku && pedido.cantidad) {
      try {
        const productos = await base44.asServiceRole.entities.Producto.filter({ sku: pedido.sku });
        if (productos.length > 0) {
          const prod = productos[0];
          const nuevoStock = Math.max(0, (prod.stock_actual || 0) - pedido.cantidad);
          await base44.asServiceRole.entities.Producto.update(prod.id, { stock_actual: nuevoStock });
        }
      } catch (e) { console.warn('Stock update failed:', e.message); }
    }

    // ── 4. PERSONALIZATION JOB ──────────────────────────────────
    if (pedido.requiere_personalizacion && pedido.texto_personalizacion) {
      try {
        await base44.asServiceRole.entities.PersonalizationJob.create({
          source_type: 'Pedido B2C',
          source_id: pedido.id,
          product_name: pedido.sku || 'Producto web',
          quantity: pedido.cantidad || 1,
          laser_required: true,
          laser_text: pedido.texto_personalizacion,
          status: 'Pendiente',
          customer_name: pedido.cliente_nombre,
          customer_email: pedido.cliente_email,
        });
      } catch (e) { console.warn('PersonalizationJob creation failed:', e.message); }
    }

    // ── 5. UPSERT CLIENTE ────────────────────────────────────────
    if (pedido.cliente_email) {
      try {
        const existing = await base44.asServiceRole.entities.Cliente.filter({ email: pedido.cliente_email });
        const hoy = new Date().toISOString().slice(0, 10);

        if (existing.length > 0) {
          const c = existing[0];
          const numPedidos = (c.num_pedidos || 0) + 1;
          const total = (c.total_compras_clp || 0) + (pedido.total || 0);
          const ticket = Math.round(total / numPedidos);

          let estado = c.estado;
          if (numPedidos >= 3 || total >= 500000) estado = 'VIP';
          else if (!estado || estado === 'En Riesgo') estado = 'Activo';

          await base44.asServiceRole.entities.Cliente.update(c.id, {
            num_pedidos: numPedidos,
            total_compras_clp: total,
            ticket_promedio: ticket,
            fecha_ultima_compra: hoy,
            estado,
            sku_favorito: pedido.sku || c.sku_favorito,
            canal_preferido: 'Web',
          });
        } else {
          await base44.asServiceRole.entities.Cliente.create({
            empresa: pedido.cliente_nombre || 'Sin nombre',
            contacto: pedido.cliente_nombre,
            email: pedido.cliente_email,
            telefono: pedido.cliente_telefono,
            tipo: pedido.tipo_cliente?.includes('B2B') ? 'B2B Pyme' : 'B2C Recurrente',
            estado: 'Activo',
            fecha_primera_compra: hoy,
            fecha_ultima_compra: hoy,
            total_compras_clp: pedido.total || 0,
            num_pedidos: 1,
            ticket_promedio: pedido.total || 0,
            sku_favorito: pedido.sku,
            canal_preferido: 'Web',
            pagos_al_dia: true,
          });
        }
      } catch (e) { console.warn('Cliente upsert failed:', e.message); }
    }

    await Promise.allSettled(tareas);
    return Response.json({ ok: true, pedido: pedido.numero_pedido });
  } catch (error) {
    console.error('onNewPedidoWeb error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});