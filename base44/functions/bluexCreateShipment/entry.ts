// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Crear envío (generar OT + tracking)
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  STATUS: STUB / PENDIENTE DOCUMENTACIÓN OFICIAL
//
// Esta función está LISTA en credenciales y autenticación, pero los endpoints
// exactos (URL base + paths + estructura JSON) deben confirmarse contra el PDF
// oficial de la API REST que entrega el equipo de integraciones de Blue Express
// junto con las credenciales (soporteintegraciones@blue.cl).
//
// Cuando llegue el PDF, solo hay que:
//   1) Reemplazar BLUEX_API_BASE con la URL real (ej: https://services.bluex.cl/...)
//   2) Reemplazar el path de SHIPMENT_ENDPOINT
//   3) Ajustar el body del fetch al schema real (campos obligatorios)
//   4) Mapear la respuesta para extraer el tracking number real
//
// Mientras tanto, esta función:
//   • Valida que existan las credenciales
//   • Responde con un mensaje claro de "pendiente_docs" para que la UI lo muestre
//   • Loguea el payload que SÍ vamos a enviar cuando esté lista la URL
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// TODO: reemplazar por la URL real cuando llegue el PDF de Bluex
const BLUEX_API_BASE = ''; // ej: 'https://services.bluex.cl/api/v1'
const SHIPMENT_ENDPOINT = ''; // ej: '/admision/ot'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { pedido_id } = await req.json();
    if (!pedido_id) {
      return Response.json({ error: 'pedido_id es requerido' }, { status: 400 });
    }

    // Cargar pedido
    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) {
      return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Validar credenciales Bluex
    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');

    if (!clientAccount || !userCode || !apiKey || !token) {
      return Response.json({
        error: 'Credenciales BlueExpress incompletas. Revisa los secrets BLUEX_*.',
      }, { status: 500 });
    }

    // Payload "best guess" basado en el patrón estándar de couriers chilenos.
    // La estructura final puede cambiar levemente cuando recibamos el PDF oficial.
    const payload = {
      auth: {
        clientAccount,
        userCode,
        apiKey,
        token,
      },
      shipment: {
        // Origen (PEYU)
        origin: {
          name: 'PEYU Chile',
          rut: '77069974-2',
          address: 'Santiago, Chile', // TODO: dirección real de bodega
          contact: 'Carlos Moscoso',
          phone: '+56933766573',
          email: 'cmoscoso@peyuchile.cl',
        },
        // Destino (cliente)
        destination: {
          name: pedido.cliente_nombre,
          address: pedido.direccion_envio,
          city: pedido.ciudad,
          phone: pedido.cliente_telefono,
          email: pedido.cliente_email,
        },
        // Bulto
        package: {
          weight_kg: 1,        // TODO: calcular real desde productos
          declared_value: pedido.total,
          reference: pedido.numero_pedido || pedido.id,
          description: pedido.descripcion_items?.slice(0, 100) || 'Productos PEYU',
          pieces: 1,
        },
        service_type: 'NORMAL', // TODO: confirmar valores válidos en docs
      },
    };

    // Si todavía no tenemos URL, devolvemos modo "pendiente"
    if (!BLUEX_API_BASE || !SHIPMENT_ENDPOINT) {
      console.log('[BluexCreateShipment] Pendiente PDF API. Payload preparado:', JSON.stringify(payload, null, 2));
      return Response.json({
        ok: false,
        status: 'pendiente_docs',
        message: 'Integración lista pero falta la documentación oficial de endpoints de BlueExpress. Pide el PDF a soporteintegraciones@blue.cl indicando ClientAccount 77069974-2-8.',
        payload_preview: payload, // útil para debug en UI
      });
    }

    // 🚀 Cuando estén los endpoints, este bloque se activa solo
    const response = await fetch(`${BLUEX_API_BASE}${SHIPMENT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[BluexCreateShipment] Error API Bluex:', data);
      return Response.json({
        error: 'Error al crear envío en BlueExpress',
        detail: data,
      }, { status: response.status });
    }

    // TODO: ajustar al campo real de tracking que devuelva la API
    const trackingNumber = data?.trackingNumber || data?.ot || data?.shipment_id;
    const labelUrl = data?.labelUrl || data?.pdfUrl;

    // Actualizar el pedido
    await base44.asServiceRole.entities.PedidoWeb.update(pedido_id, {
      courier: 'BlueExpress',
      tracking: trackingNumber,
    });

    return Response.json({
      ok: true,
      tracking: trackingNumber,
      label_url: labelUrl,
      raw: data,
    });
  } catch (error) {
    console.error('[BluexCreateShipment] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});