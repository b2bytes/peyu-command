// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Crear envío (emitir Orden de Transporte / OT)
// ─────────────────────────────────────────────────────────────────────────────
// Integración LIVE con la API REST oficial de Blue Express.
// Crea una entidad Envio que se convierte en la fuente de verdad logística.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const BLUEX_API_BASE = 'https://services.bluex.cl/api/v1';
const SHIPMENT_ENDPOINT = '/admision/ot';

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

// Clasificación tipo destino
const COMUNAS_EXTREMO = ['arica', 'iquique', 'punta arenas', 'coyhaique', 'puerto williams', 'castro', 'puerto natales'];
const COMUNAS_RURAL_PATTERN = ['rural', 'localidad'];

function clasificarTipoDestino(comuna) {
  const c = (comuna || '').toLowerCase();
  if (COMUNAS_EXTREMO.some(x => c.includes(x))) return 'Extremo';
  if (COMUNAS_RURAL_PATTERN.some(x => c.includes(x))) return 'Rural';
  return 'Urbano';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { pedido_id, servicio = 'EXPRESS', peso_kg, declared_value } = await req.json();
    if (!pedido_id) return Response.json({ error: 'pedido_id es requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const pedido = await sr.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');

    if (!clientAccount || !userCode || !apiKey || !token) {
      return Response.json({ error: 'Credenciales BlueExpress incompletas' }, { status: 500 });
    }

    const pesoFinal = peso_kg || 1;
    const valorFinal = declared_value || pedido.total || 0;

    const payload = {
      clientAccount, userCode,
      serviceType: servicio,
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
        weight: pesoFinal,
        declaredValue: valorFinal,
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
        'apiKey': apiKey, 'token': token,
        'clientAccount': clientAccount, 'userCode': userCode,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[BluexCreateShipment] Error API:', response.status, data);
      return Response.json({
        error: 'Error al crear envío en BlueExpress',
        status: response.status, detail: data,
      }, { status: response.status });
    }

    const trackingNumber = data?.orderTransportNumber || data?.trackingNumber || data?.ot;
    const labelUrl = data?.labelUrl || data?.pdfUrl || `https://ecommerce.blue.cl/etiquetas/${trackingNumber}`;
    const labelB64 = data?.label || data?.pdfBase64 || null;

    // Calcular fecha promesa según tipo
    const tipoDestino = clasificarTipoDestino(pedido.ciudad);
    const leadTimeDias = tipoDestino === 'Extremo' ? 7 : tipoDestino === 'Rural' ? 5 : 3;
    const fechaPromesa = new Date(Date.now() + leadTimeDias * 86400000).toISOString().slice(0, 10);

    // Crear entidad Envio (fuente de verdad)
    const envio = await sr.entities.Envio.create({
      pedido_id,
      numero_pedido: pedido.numero_pedido,
      cliente_nombre: pedido.cliente_nombre,
      cliente_email: pedido.cliente_email,
      cliente_telefono: pedido.cliente_telefono,
      courier: 'BlueExpress',
      tracking_number: trackingNumber,
      servicio,
      estado: 'Etiqueta Generada',
      comuna_destino: pedido.ciudad,
      region_destino: pedido.region || '',
      direccion_destino: pedido.direccion_envio,
      tipo_destino: tipoDestino,
      peso_kg: pesoFinal,
      piezas: 1,
      valor_declarado_clp: valorFinal,
      costo_envio_cobrado_clp: pedido.costo_envio || 0,
      lead_time_estimado_dias: leadTimeDias,
      fecha_emision: new Date().toISOString(),
      fecha_promesa: fechaPromesa,
      label_url: labelUrl,
      label_base64: labelB64,
      label_format: 'PDF',
      tracking_url: `https://www.bluex.cl/seguimiento?n=${trackingNumber}`,
      raw_response_emision: data,
      eventos: [{
        at: new Date().toISOString(),
        code: '01',
        estado: 'Etiqueta Generada',
        descripcion: 'Orden de transporte emitida',
        ubicacion: 'Santiago - PEYU',
        es_excepcion: false,
      }],
      ultimo_evento_at: new Date().toISOString(),
      ultimo_evento_descripcion: 'Orden de transporte emitida',
    });

    // Actualizar pedido
    const historial = pedido.historial || [];
    historial.push({
      at: new Date().toISOString(),
      type: 'shipped',
      actor: user.email,
      channel: 'system',
      detail: `Envío Bluex creado · OT ${trackingNumber}`,
      meta: { tracking: trackingNumber, servicio, peso_kg: pesoFinal, envio_id: envio.id },
    });

    await sr.entities.PedidoWeb.update(pedido_id, {
      courier: 'BlueExpress',
      tracking: trackingNumber,
      estado: pedido.estado === 'Listo para Despacho' ? 'Despachado' : pedido.estado,
      historial,
    });

    return Response.json({
      ok: true,
      envio_id: envio.id,
      tracking: trackingNumber,
      label_url: labelUrl,
      label_base64: labelB64,
      portal_url: 'https://ecommerce.blue.cl/',
      tipo_destino: tipoDestino,
      fecha_promesa: fechaPromesa,
    });
  } catch (error) {
    console.error('[BluexCreateShipment] Exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});