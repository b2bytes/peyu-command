// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Crear envío (emitir Orden de Transporte / OT)
// ─────────────────────────────────────────────────────────────────────────────
// Integración LIVE con la API REST oficial de Blue Express.
//
// Auth (headers):
//   - apiKey, token, clientAccount, userCode  (los 4 secrets BLUEX_*)
//
// Endpoint principal: POST /api/v1/admision/ot
// Devuelve: { orderTransportNumber, label (base64 o URL), ... }
//
// Para portal de etiquetas: https://ecommerce.blue.cl/  (cmoscoso@peyuchile.cl)
// Para anulaciones / retiros: https://portal2.bluex.cl/  (USRPEYUCHILE)
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const BLUEX_API_BASE = 'https://services.bluex.cl/api/v1';
const SHIPMENT_ENDPOINT = '/admision/ot';

// Datos del remitente (PEYU Chile)
const ORIGIN = {
  name: 'PEYU Chile',
  rut: '77069974-2',
  contact: 'Carlos Moscoso',
  phone: '+56933766573',
  email: 'cmoscoso@peyuchile.cl',
  address: 'Santiago',
  city: 'Santiago',
  region: 'RM',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { pedido_id, servicio = 'EXPRESS', peso_kg, declared_value } = await req.json();
    if (!pedido_id) {
      return Response.json({ error: 'pedido_id es requerido' }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    const pedido = await sr.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    // Credenciales
    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');

    if (!clientAccount || !userCode || !apiKey || !token) {
      return Response.json({
        error: 'Credenciales BlueExpress incompletas. Revisa los secrets BLUEX_*.',
      }, { status: 500 });
    }

    // Payload OT
    const payload = {
      clientAccount,
      userCode,
      serviceType: servicio, // EXPRESS | PRIORITY
      origin: ORIGIN,
      destination: {
        name: pedido.cliente_nombre || 'Cliente',
        rut: pedido.cliente_rut || '',
        address: pedido.direccion_envio || '',
        city: pedido.ciudad || '',
        region: pedido.region || '',
        phone: pedido.cliente_telefono || '',
        email: pedido.cliente_email || '',
      },
      package: {
        weight: peso_kg || 1,
        declaredValue: declared_value || pedido.total || 0,
        reference: pedido.numero_pedido || pedido.id,
        description: (pedido.descripcion_items || 'Productos PEYU').slice(0, 100),
        pieces: 1,
      },
    };

    const response = await fetch(`${BLUEX_API_BASE}${SHIPMENT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apiKey': apiKey,
        'token': token,
        'clientAccount': clientAccount,
        'userCode': userCode,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[BluexCreateShipment] Error API:', response.status, data);
      return Response.json({
        error: 'Error al crear envío en BlueExpress',
        status: response.status,
        detail: data,
        hint: 'Si el error persiste, verifica las credenciales o contacta soporteintegraciones@blue.cl',
      }, { status: response.status });
    }

    const trackingNumber = data?.orderTransportNumber || data?.trackingNumber || data?.ot;
    const labelUrl = data?.labelUrl || data?.pdfUrl || `https://ecommerce.blue.cl/etiquetas/${trackingNumber}`;

    // Actualizar pedido con tracking + historial
    const historial = pedido.historial || [];
    historial.push({
      at: new Date().toISOString(),
      type: 'shipped',
      actor: user.email,
      channel: 'system',
      detail: `Envío Bluex creado · OT ${trackingNumber}`,
      meta: { tracking: trackingNumber, servicio, peso_kg },
    });

    await sr.entities.PedidoWeb.update(pedido_id, {
      courier: 'BlueExpress',
      tracking: trackingNumber,
      estado: pedido.estado === 'Listo para Despacho' ? 'Despachado' : pedido.estado,
      historial,
    });

    return Response.json({
      ok: true,
      tracking: trackingNumber,
      label_url: labelUrl,
      portal_url: 'https://ecommerce.blue.cl/',
      raw: data,
    });
  } catch (error) {
    console.error('[BluexCreateShipment] Exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});