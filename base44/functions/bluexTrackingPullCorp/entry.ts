import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress Tracking Pull Corp API Integration
// Consulta tracking en tiempo real desde API corporativa de BlueExpress
// ─────────────────────────────────────────────────────────────────────────────

const BLUEX_API_BASE = Deno.env.get('BLUEX_API_BASE_URL') || 'https://cmkin.api.blue.cl';
const BLUEX_API_KEY = Deno.env.get('BLUEX_API_KEY');
const BLUEX_TOKEN = Deno.env.get('BLUEX_TOKEN');

// Mapear eventos de BlueExpress a estados locales
const mapEventTypeToStatus = (eventType, eventCode) => {
  const mapping = {
    'PR': 'Etiqueta Generada',      // PRINTED
    'IN': 'En Tránsito',            // IN TRANSIT
    'ON': 'En Reparto',             // OUT FOR DELIVERY
    'DE': 'Entregado',              // DELIVERED
    'NE': 'No Entregado',           // NOT DELIVERED
    'EX': 'Excepción',              // EXCEPTION
  };
  return mapping[eventType] || 'En Tránsito';
};

// Obtener token OAuth si es necesario
async function getBluexToken() {
  if (BLUEX_TOKEN) return BLUEX_TOKEN;
  
  const tokenUrl = 'https://sso.blue.cl/oauth2/token';
  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: Deno.env.get('BLUEX_USER_CODE') || '',
        client_secret: Deno.env.get('BLUEX_CLIENT_ACCOUNT') || '',
      }).toString(),
    });
    if (!res.ok) throw new Error('Token fetch failed');
    const data = await res.json();
    return data.access_token;
  } catch (e) {
    console.error('[bluexTrackingPullCorp] Token error:', e.message);
    throw new Error('Failed to obtain BlueExpress token');
  }
}

// Consultar tracking por número
async function queryByTrackingNumber(trackingNumber) {
  const token = await getBluexToken();
  const url = `${BLUEX_API_BASE}/cmkin/bff/tracking-pull-corp/v1/${trackingNumber}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': BLUEX_API_KEY || '',
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`BlueExpress API error: ${res.status} - ${error.detail}`);
  }

  return res.json();
}

// Consultar tracking por referencias
async function queryByReferences(accounts, references) {
  const token = await getBluexToken();
  const params = new URLSearchParams({
    accounts,
    references,
  });
  const url = `${BLUEX_API_BASE}/cmkin/bff/tracking-pull-corp/v1/search?${params}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': BLUEX_API_KEY || '',
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`BlueExpress API error: ${res.status} - ${error.detail}`);
  }

  return res.json();
}

// Procesar respuesta y actualizar BD local
async function processAndUpdate(base44, trackingData, envio_id) {
  if (!trackingData.packages || trackingData.packages.length === 0) {
    return { ok: false, error: 'No packages in response' };
  }

  const pkg = trackingData.packages[0];
  const latestTracking = pkg.trackings?.length > 0 
    ? pkg.trackings[pkg.trackings.length - 1]
    : null;

  const newState = latestTracking
    ? mapEventTypeToStatus(latestTracking.eventType, latestTracking.eventCode)
    : 'En Tránsito';

  const eventos = (pkg.trackings || []).map(t => ({
    at: t.eventDate,
    code: t.eventCode,
    estado: t.eventTypeDesc,
    descripcion: t.eventCodeDesc,
    ubicacion: t.location,
    es_excepcion: ['EX', 'NE'].includes(t.eventType),
  }));

  // Detectar si hay excepción
  const tieneExcepcion = eventos.some(e => e.es_excepcion);

  // Detectar atraso (más de 5 días sin entregar)
  const fechaEmision = new Date(trackingData.emissionDate);
  const ahora = new Date();
  const diasTranscurridos = Math.floor((ahora - fechaEmision) / (1000 * 60 * 60 * 24));
  const atrasado = diasTranscurridos > 5 && newState !== 'Entregado' && newState !== 'No Entregado';

  // Actualizar BD local
  const sr = base44.asServiceRole;
  const update = {
    estado: newState,
    ultimo_evento_at: latestTracking?.eventDate || new Date().toISOString(),
    ultimo_evento_descripcion: latestTracking?.eventCodeDesc || 'Sin novedad',
    eventos,
    tiene_excepcion: tieneExcepcion,
    atrasado,
    ultimo_poll_at: new Date().toISOString(),
    raw_response_tracking: trackingData,
  };

  if (newState === 'Entregado' && latestTracking?.eventDate) {
    update.fecha_entrega_real = latestTracking.eventDate;
  }

  if (envio_id) {
    await sr.entities.Envio.update(envio_id, update);
  }

  return {
    ok: true,
    estado: newState,
    tiene_excepcion: tieneExcepcion,
    atrasado,
    eventos_count: eventos.length,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { tracking_number, references, accounts, envio_id } = payload;

    if (!tracking_number && !references) {
      return Response.json({
        ok: false,
        error: 'Debe proporcionar tracking_number o references',
      }, { status: 400 });
    }

    // Consultar API corporativa
    let trackingData;
    if (tracking_number) {
      trackingData = await queryByTrackingNumber(tracking_number);
    } else {
      const result = await queryByReferences(accounts || '', references || '');
      trackingData = result.data?.[0];
      if (!trackingData) {
        return Response.json({
          ok: false,
          error: 'No se encontró tracking para las referencias proporcionadas',
        }, { status: 404 });
      }
    }

    // Procesar y actualizar BD
    const update = await processAndUpdate(base44, trackingData, envio_id);

    return Response.json({
      ok: true,
      tracking_number: trackingData.orderId,
      state: trackingData.state,
      stateDesc: trackingData.stateDesc,
      update,
      packages_count: trackingData.packages?.length || 0,
      events_count: trackingData.packages?.[0]?.trackings?.length || 0,
    });
  } catch (error) {
    console.error('[bluexTrackingPullCorp]', error);
    return Response.json({
      ok: false,
      error: error.message || 'Error consultando BlueExpress Tracking Pull Corp API',
    }, { status: 500 });
  }
});