import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Emisión OS — API PRODUCCIÓN (verificada 2026-06-10)
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint: POST https://bx-tracking.bluex.cl/bx-emission/v1
// Auth: headers apikey + BX-TOKEN + BX-USERCODE + BX-CLIENT_ACCOUNT
//       (credenciales del grupo de integraciones Bluex, secrets BLUEX_*)
// Distritos: códigos REALES resueltos vía GET /bx-geo/state/all (BX-Geolocation)
// Devuelve tracking number + etiqueta (PDF base64) y crea el registro Envio.
// ─────────────────────────────────────────────────────────────────────────────

const BX_BASE = 'https://bx-tracking.bluex.cl';
const BLUEX_EMISSION_API = `${BX_BASE}/bx-emission/v1`;

function bxHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': Deno.env.get('BLUEX_API_KEY') || '',
    'BX-TOKEN': Deno.env.get('BLUEX_TOKEN') || '',
    'BX-USERCODE': Deno.env.get('BLUEX_USER_CODE') || '',
    'BX-CLIENT_ACCOUNT': Deno.env.get('BLUEX_CLIENT_ACCOUNT') || '',
  };
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Resuelve el código de distrito Bluex REAL para una comuna usando BX-Geo.
// Estructura: data[].states[].ciudades[].districts[{name, code}]
async function resolverDistrito(comuna) {
  try {
    const res = await fetch(`${BX_BASE}/bx-geo/state/all`, { headers: bxHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    const objetivo = norm(comuna);
    const paises = json?.data || [];
    // 1ra pasada: match exacto por distrito (comuna/localidad)
    for (const pais of paises) {
      for (const state of pais.states || []) {
        for (const ciudad of state.ciudades || []) {
          for (const d of ciudad.districts || []) {
            if (norm(d.name) === objetivo) {
              return { code: d.code, name: d.name, region: state.name, ciudad: ciudad.name };
            }
          }
        }
      }
    }
    // 2da pasada: match por ciudad → primer distrito de la ciudad
    for (const pais of paises) {
      for (const state of pais.states || []) {
        for (const ciudad of state.ciudades || []) {
          if (norm(ciudad.name) === objetivo) {
            const d = (ciudad.districts || [])[0];
            if (d) return { code: d.code, name: d.name, region: state.name, ciudad: ciudad.name };
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

const ORIGEN_CORPORATIVO = {
  districtId: 'PUD',
  districtName: 'Pudahuel',
  address: 'Galpón PEYU, Santiago',
  agencyId: '41',
  geolocation: [-33.319054, -70.72056],
};

function clasificarTipoDestino(comuna) {
  const c = norm(comuna);
  const extremos = ['arica', 'iquique', 'punta arenas', 'coyhaique', 'puerto williams', 'castro', 'puerto natales'];
  if (extremos.some((x) => c.includes(x))) return 'Extremo';
  if (c.includes('rural') || c.includes('localidad')) return 'Rural';
  return 'Urbano';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      proposal_id, pedido_id, // Pueden ser propuestas O pedidos
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      direccion_destino,
      comuna_destino,
      peso_kg = 1,
      valor_declarado = 0,
      servicio = 'EX', // EX: Express, PY: Priority, PR: Premium, MD: Sameday
      print_format = 4, // 4: PDF, 2: ZPL, 1: EPL
      dimensiones, // { largo_cm, ancho_cm, alto_cm }
      referencia,
      comentarios,
    } = await req.json();

    const id = proposal_id || pedido_id;
    if (!id) return Response.json({ error: 'Falta proposal_id o pedido_id' }, { status: 400 });

    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userName = Deno.env.get('BLUEX_USER_CODE');
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');
    if (!clientAccount || !userName || !apiKey || !token) {
      return Response.json({
        error: 'Credenciales BlueExpress no configuradas',
        hint: 'Configura BLUEX_CLIENT_ACCOUNT, BLUEX_USER_CODE, BLUEX_API_KEY, BLUEX_TOKEN en secrets',
      }, { status: 503 });
    }

    // ── Resolver distrito destino REAL contra BX-Geo (producción) ────────────
    const distrito = await resolverDistrito(comuna_destino);
    const tipoDestino = clasificarTipoDestino(comuna_destino);
    const districtCode = distrito?.code || 'PUD'; // fallback conservador

    // Construir request de Emisión OS (mismo esquema validado por la API)
    const payload = {
      printFormatCode: print_format,
      clientPromiseDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      trackingNumber: null, // BlueExpress genera automáticamente
      clientAccount,
      clientIdentifier: referencia || `PEYU-${Date.now()}`,
      quantityPackages: 1,
      references: [referencia || `PEYU-${id}`],
      serviceType: servicio,
      productType: 'P',
      productCategory: 'PAQU',
      currency: 'CLP',
      shipmentCost: valor_declarado,
      extendedClaim: false,
      companyId: 2000,
      userName,
      pickup: {
        location: ORIGEN_CORPORATIVO,
        contact: {
          fullname: 'PEYU Chile',
          email: 'logistica@peyuchile.cl',
          phone: '+56933766573',
        },
      },
      dropoff: {
        location: {
          districtId: districtCode,
          districtName: distrito?.name || comuna_destino || 'Santiago',
          address: direccion_destino || 'Dirección pendiente',
          agencyId: null,
          geolocation: null,
        },
        contact: {
          fullname: cliente_nombre || 'Cliente',
          email: cliente_email || 'cliente@ejemplo.com',
          phone: cliente_telefono || '0',
        },
      },
      packages: [
        {
          shipmentCost: valor_declarado,
          references: [referencia || `PEYU-${id}`],
          weightUnit: 'KG',
          lengthUnit: 'CM',
          weight: parseFloat(peso_kg) || 1,
          length: dimensiones?.largo_cm || 20,
          width: dimensiones?.ancho_cm || 15,
          height: dimensiones?.alto_cm || 10,
          quantity: 1,
        },
      ],
      comments: comentarios || null,
      parameters: null,
    };

    // Llamar a API de Emisión PRODUCCIÓN
    const response = await fetch(BLUEX_EMISSION_API, {
      method: 'POST',
      headers: bxHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.status === false) {
      console.error('[BlueExpress Emission] Error:', response.status, JSON.stringify(data).slice(0, 500));
      return Response.json({
        error: `BlueExpress API error (${response.status})`,
        detail: data?.data || data?.detail || data?.title || 'Error en la emisión OS',
        trace: data,
      }, { status: response.ok ? 502 : response.status });
    }

    // Respuesta puede venir plana o envuelta en { status, data }
    const body = data?.data && typeof data.data === 'object' ? data.data : data;
    const trackingNumber = body.trackingNumber || data.trackingNumber;
    if (!trackingNumber) {
      return Response.json({ error: 'BlueExpress no retornó tracking number', trace: data }, { status: 502 });
    }
    const labelContenido = body.labels?.contenido || body.label || data.labels?.contenido || null;

    const sr = base44.asServiceRole;

    // Crear registro Envio para rastreo
    const envio = await sr.entities.Envio.create({
      pedido_id: pedido_id || null,
      numero_pedido: referencia || `PEYU-${id}`,
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      courier: 'BlueExpress',
      tracking_number: trackingNumber,
      servicio: servicio === 'PY' ? 'PRIORITY' : 'EXPRESS',
      estado: 'Etiqueta Generada',
      comuna_destino: distrito?.name || comuna_destino,
      region_destino: distrito?.region || '',
      direccion_destino,
      tipo_destino: tipoDestino,
      peso_kg: parseFloat(peso_kg),
      piezas: 1,
      valor_declarado_clp: valor_declarado,
      lead_time_estimado_dias: tipoDestino === 'Extremo' ? 7 : tipoDestino === 'Rural' ? 5 : 3,
      fecha_emision: new Date().toISOString(),
      fecha_promesa: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      label_base64: labelContenido,
      label_url: labelContenido
        ? `data:${print_format === 4 ? 'application/pdf' : 'text/plain'};base64,${labelContenido}`
        : null,
      label_format: ({ 4: 'PDF', 3: 'PDF', 2: 'ZPL', 1: 'EPL' })[print_format] || 'PDF',
      tracking_url: `https://www.bluex.cl/seguimiento?n=${trackingNumber}`,
      raw_response_emision: data,
      eventos: [{
        at: new Date().toISOString(),
        code: '01',
        estado: 'Etiqueta Generada',
        descripcion: 'OT emitida vía API BlueExpress Producción (bx-emission)',
        ubicacion: 'Santiago - PEYU',
        es_excepcion: false,
      }],
      ultimo_evento_at: new Date().toISOString(),
      ultimo_evento_descripcion: 'OT emitida vía API',
    });

    return Response.json({
      ok: true,
      envio_id: envio.id,
      tracking: trackingNumber,
      label_contenido: labelContenido,
      label_format: ({ 4: 'PDF', 3: 'PDF', 2: 'ZPL', 1: 'EPL' })[print_format] || 'PDF',
      tracking_url: `https://www.bluex.cl/seguimiento?n=${trackingNumber}`,
      distrito_resuelto: distrito,
      api_response: data,
    });
  } catch (error) {
    console.error('[BlueExpress Emission]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});