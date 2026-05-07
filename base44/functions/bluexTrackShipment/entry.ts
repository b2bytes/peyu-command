// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Consultar tracking en tiempo real
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint: POST /api/v1/admision/tracking
// Devuelve eventos del envío. Actualiza Envio.eventos + estado derivado.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const BLUEX_API_BASE = Deno.env.get('BLUEX_API_BASE_URL') || '';
const TRACKING_ENDPOINT = '/admision/tracking';

// Mapping de códigos Bluex → estados internos
const ESTADO_MAP = {
  '01': 'Etiqueta Generada',
  '02': 'Retirado por Courier',
  '03': 'En Tránsito',
  '04': 'En Reparto',
  '05': 'Entregado',
  '06': 'No Entregado',
  '07': 'Devuelto',
  '99': 'Excepción',
};

const EXCEPCION_KEYWORDS = ['no encontrado', 'rechazado', 'siniestro', 'extravío', 'dañado', 'devuelto', 'no entregado'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { envio_id, tracking_number } = await req.json();
    if (!envio_id && !tracking_number) {
      return Response.json({ error: 'envio_id o tracking_number requeridos' }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    let envio = null;
    if (envio_id) {
      envio = await sr.entities.Envio.get(envio_id);
    } else {
      const list = await sr.entities.Envio.filter({ tracking_number });
      envio = list[0];
    }
    if (!envio) return Response.json({ error: 'Envío no encontrado' }, { status: 404 });

    const ot = envio.tracking_number || tracking_number;
    if (!ot) return Response.json({ error: 'Sin tracking number' }, { status: 400 });

    // Si la API no está configurada → devolver el estado actual sin error.
    // El operador puede actualizar manualmente desde el drawer.
    if (!BLUEX_API_BASE) {
      return Response.json({
        ok: true,
        envio_id: envio.id,
        tracking: ot,
        estado: envio.estado,
        modo: 'manual',
        hint: 'API Bluex no configurada (BLUEX_API_BASE_URL). Actualiza el estado manualmente desde el drawer.',
        tracking_url: `https://www.bluex.cl/seguimiento?n=${ot}`,
      });
    }

    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');
    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');

    let response;
    try {
      response = await fetch(`${BLUEX_API_BASE}${TRACKING_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': apiKey,
          'token': token,
          'clientAccount': clientAccount,
          'userCode': userCode,
        },
        body: JSON.stringify({ orderTransportNumber: ot, clientAccount, userCode }),
      });
    } catch (netErr) {
      // DNS / red caída → no rompemos, devolvemos estado actual
      return Response.json({
        ok: true,
        envio_id: envio.id,
        tracking: ot,
        estado: envio.estado,
        modo: 'manual_fallback',
        warning: `API Bluex no responde: ${netErr.message}. Tracking público: https://www.bluex.cl/seguimiento?n=${ot}`,
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json({
        error: 'Error consultando tracking Bluex',
        status: response.status,
        detail: data,
      }, { status: response.status });
    }

    // Parsear eventos del response
    const rawEvents = data?.events || data?.tracking || data?.history || [];
    const eventos = rawEvents.map(e => {
      const desc = e.description || e.descripcion || e.statusDescription || '';
      const code = String(e.code || e.statusCode || '').padStart(2, '0');
      return {
        at: e.date || e.fecha || e.timestamp || new Date().toISOString(),
        code,
        estado: ESTADO_MAP[code] || e.status || 'En Tránsito',
        descripcion: desc,
        ubicacion: e.location || e.ubicacion || e.branch || '',
        es_excepcion: EXCEPCION_KEYWORDS.some(k => desc.toLowerCase().includes(k)),
      };
    }).sort((a, b) => new Date(b.at) - new Date(a.at));

    // Estado derivado del último evento
    const ultimoEvento = eventos[0];
    const nuevoEstado = ultimoEvento?.estado || envio.estado;
    const tieneExcepcion = eventos.some(e => e.es_excepcion);
    const intentos = eventos.filter(e => /reparto|intento/i.test(e.descripcion)).length;

    // Días en tránsito
    const eventoEmision = eventos.find(e => e.code === '01' || e.code === '02') || eventos[eventos.length - 1];
    const diasTransito = eventoEmision
      ? Math.floor((Date.now() - new Date(eventoEmision.at).getTime()) / 86400000)
      : 0;

    // Atrasado vs promesa
    const atrasado = envio.fecha_promesa
      ? new Date() > new Date(envio.fecha_promesa) && nuevoEstado !== 'Entregado'
      : false;

    const updates = {
      eventos,
      estado: nuevoEstado,
      ultimo_evento_at: ultimoEvento?.at,
      ultimo_evento_descripcion: ultimoEvento?.descripcion,
      ultimo_poll_at: new Date().toISOString(),
      tiene_excepcion: tieneExcepcion,
      intentos_entrega: intentos,
      dias_en_transito: diasTransito,
      atrasado,
      raw_response_tracking: data,
    };

    if (nuevoEstado === 'Entregado' && !envio.fecha_entrega_real) {
      updates.fecha_entrega_real = ultimoEvento.at;
    }

    await sr.entities.Envio.update(envio.id, updates);

    return Response.json({
      ok: true,
      envio_id: envio.id,
      tracking: ot,
      estado: nuevoEstado,
      eventos_count: eventos.length,
      tiene_excepcion: tieneExcepcion,
      atrasado,
    });
  } catch (error) {
    console.error('[bluexTrackShipment]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});