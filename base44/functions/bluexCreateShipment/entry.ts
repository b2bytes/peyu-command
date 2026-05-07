// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Crear envío (emitir Orden de Transporte / OT)
// ─────────────────────────────────────────────────────────────────────────────
// Integración con BlueExpress en DOS MODOS:
//
//   1) Modo API LIVE (si BLUEX_API_BASE_URL secret está configurado):
//      → Llama a la API REST oficial Bluex y emite la OT automáticamente.
//      → Endpoint depende del onboarding partner de cada cliente.
//
//   2) Modo MANUAL (default si no hay endpoint configurado):
//      → El operador genera la OT manualmente en https://b2b.bluex.cl
//        (portal Bluex), copia el número de tracking y lo pega aquí.
//      → Crea la entidad Envio igual → habilita tracking, secuencias IA,
//        emails al cliente y todo el flujo logístico interno.
//
// CRÍTICO: este patrón dual es la realidad de la integración Bluex en Chile,
// donde la API solo se entrega a clientes con cuenta B2B activa y firma manual.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// La URL oficial cambia según el plan partner. Configurable por secret.
// Si no está seteado → modo manual.
const BLUEX_API_BASE = Deno.env.get('BLUEX_API_BASE_URL') || '';
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

    // Validar autenticación SIN tocar la entidad User (que requiere permisos admin para leer).
    // isAuthenticated() solo verifica el token de sesión.
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      pedido_id,
      servicio = 'EXPRESS',
      peso_kg,
      declared_value,
      // Modo manual: el operador pegó el tracking_number directo desde el portal Bluex
      manual_tracking_number,
      manual_label_url,
    } = await req.json();
    if (!pedido_id) return Response.json({ error: 'pedido_id es requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const pedido = await sr.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');

    const pesoFinal = peso_kg || 1;
    const valorFinal = declared_value || pedido.total || 0;

    let trackingNumber = manual_tracking_number || null;
    let labelUrl = manual_label_url || null;
    let labelB64 = null;
    let modoUsado = 'manual';
    let rawResponse = null;

    // ── MODO API: solo si BLUEX_API_BASE_URL está configurado y NO se pasó manual ──
    if (BLUEX_API_BASE && !manual_tracking_number && clientAccount && userCode && apiKey && token) {
      try {
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
          console.error('[BluexCreateShipment] API rechazó request:', response.status, data);
          return Response.json({
            error: 'Error al crear envío en BlueExpress API',
            status: response.status,
            detail: data,
            hint: 'Si esto persiste, usa el modo manual: genera la OT en https://b2b.bluex.cl y pega el tracking aquí.',
          }, { status: response.status });
        }

        trackingNumber = data?.orderTransportNumber || data?.trackingNumber || data?.ot;
        labelUrl = data?.labelUrl || data?.pdfUrl || `https://ecommerce.blue.cl/etiquetas/${trackingNumber}`;
        labelB64 = data?.label || data?.pdfBase64 || null;
        rawResponse = data;
        modoUsado = 'api';
      } catch (apiErr) {
        console.warn('[BluexCreateShipment] API no disponible, requiere modo manual:', apiErr.message);
        return Response.json({
          error: 'API BlueExpress no disponible',
          detail: apiErr.message,
          hint: 'La API B2B Bluex requiere onboarding partner. Genera la OT manualmente en https://b2b.bluex.cl y reenvía con manual_tracking_number.',
          fallback_mode: 'manual',
          portal_url: 'https://b2b.bluex.cl',
        }, { status: 503 });
      }
    }

    // ── MODO MANUAL: requiere manual_tracking_number ──
    if (!trackingNumber) {
      return Response.json({
        error: 'Falta tracking number',
        hint: 'Genera la OT en https://b2b.bluex.cl y reenvía con manual_tracking_number en el payload.',
        portal_url: 'https://b2b.bluex.cl',
        modo: 'manual_required',
      }, { status: 400 });
    }

    // Asegurar URLs por defecto si vinieron vacías
    if (!labelUrl) {
      labelUrl = `https://b2b.bluex.cl/etiquetas/${trackingNumber}`;
    }

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
      raw_response_emision: rawResponse || { modo: modoUsado, manual: true },
      eventos: [{
        at: new Date().toISOString(),
        code: '01',
        estado: 'Etiqueta Generada',
        descripcion: modoUsado === 'manual'
          ? 'OT registrada manualmente desde portal Bluex'
          : 'Orden de transporte emitida vía API',
        ubicacion: 'Santiago - PEYU',
        es_excepcion: false,
      }],
      ultimo_evento_at: new Date().toISOString(),
      ultimo_evento_descripcion: modoUsado === 'manual'
        ? 'OT registrada manualmente'
        : 'Orden de transporte emitida',
    });

    // Actualizar pedido
    const historial = pedido.historial || [];
    historial.push({
      at: new Date().toISOString(),
      type: 'shipped',
      actor: 'system',
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
      portal_url: 'https://b2b.bluex.cl/',
      tipo_destino: tipoDestino,
      fecha_promesa: fechaPromesa,
      modo: modoUsado,
    });
  } catch (error) {
    console.error('[BluexCreateShipment] Exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});