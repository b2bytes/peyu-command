import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Emisión OS — API CORPORATIVA PRODUCCIÓN (verificada 2026-06-10)
// ─────────────────────────────────────────────────────────────────────────────
// Token: POST https://sso.blue.cl/oauth2/token (client_credentials, Basic auth)
// Emisión: POST https://cmkin.api.blue.cl/cmkin/customer/corp/emission/v1/emission
//          headers: Authorization Bearer + x-api-key
// Distritos: códigos REALES resueltos vía GET bx-geo/state/all (BX-Geolocation)
// Devuelve tracking number + etiqueta (PDF base64) y crea el registro Envio.
// ─────────────────────────────────────────────────────────────────────────────

const BX_BASE = 'https://bx-tracking.bluex.cl';
const BLUEX_EMISSION_API = 'https://cmkin.api.blue.cl/cmkin/customer/corp/emission/v1/emission';

// Obtiene Bearer token OAuth PROD (client_credentials, expira en 1h)
async function getBearerToken() {
  const cid = Deno.env.get('BLUEX_CLIENT_ID') || '';
  const csec = Deno.env.get('BLUEX_CLIENT_SECRET') || '';
  const r = await fetch('https://sso.blue.cl/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${btoa(`${cid}:${csec}`)}` },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`Token Bluex falló (${r.status})`);
  const j = await r.json();
  if (!j.access_token) throw new Error('Bluex no entregó access_token');
  return j.access_token;
}

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

// Resuelve el código de distrito Bluex REAL para una comuna.
// Fuente 1: tarifario oficial (TarifaBluex.raw_columnas['Codigo Comuna'])
// Fuente 2: BluexGeoData (1,670 localidades oficiales BlueExpress)
async function resolverDistrito(sr, comuna) {
  const objetivo = norm(comuna);
  // 1) Tarifario oficial en la base (rápido y confiable)
  try {
    const tarifas = await sr.entities.TarifaBluex.filter({ comuna_normalizada: objetivo }, undefined, 1);
    const t = tarifas?.[0];
    const code = t?.raw_columnas?.['Codigo Comuna'];
    if (code) return { code, name: t.comuna, region: t.region, fuente: 'tarifario' };
  } catch { /* sigue */ }

  // 2) BluexGeoData: cobertura completa (1,670 localidades oficiales BlueExpress)
  try {
    const geo = await sr.entities.BluexGeoData.filter({ comuna_normalizada: objetivo }, undefined, 1);
    const g = geo?.[0];
    if (g?.cod_localidad) return { code: g.cod_localidad, name: g.nom_comuna, region: g.nom_region, fuente: 'bluex_geo_data' };
  } catch { /* sigue */ }
  try {
    const geoLoc = await sr.entities.BluexGeoData.filter({ localidad_normalizada: objetivo }, undefined, 1);
    const gl = geoLoc?.[0];
    if (gl?.cod_localidad) return { code: gl.cod_localidad, name: gl.nom_comuna, region: gl.nom_region, fuente: 'bluex_geo_data_loc' };
  } catch { /* sigue */ }

  return null;
}

// agencyId null = retiro en domicilio/galpón (la API rechazaba '41' con AGENCY_NOT_VALID)
const ORIGEN_CORPORATIVO = {
  districtId: 'PUD',
  districtName: 'Pudahuel',
  address: 'Galpón PEYU, Santiago',
  agencyId: null,
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
      dry_run = false, // true → solo resuelve distrito y arma payload, NO emite
    } = await req.json();

    const id = proposal_id || pedido_id;
    if (!id) return Response.json({ error: 'Falta proposal_id o pedido_id' }, { status: 400 });

    // ═══ GUARD DE PAGO (pedidos B2C) ═══════════════════════════════════════
    // No emitir etiqueta Bluex si el pedido no está pagado. Cierra la brecha
    // del botón "Registrar OT manualmente" que bypassea updateShippingStatus.
    // Solo aplica a pedidos (no a propuestas B2B que manejan anticipo aparte).
    if (pedido_id) {
      const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
      if (pedido && pedido.payment_status !== 'paid') {
        return Response.json({
          error: 'No se puede emitir etiqueta: el pago del pedido no está confirmado.',
          blocked: true,
          payment_status: pedido.payment_status || 'vacío',
          medio_pago: pedido.medio_pago || '',
        }, { status: 403 });
      }
    }

    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userName = Deno.env.get('BLUEX_USER_CODE');
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const clientId = Deno.env.get('BLUEX_CLIENT_ID');
    if (!clientAccount || !userName || !apiKey || !clientId) {
      return Response.json({
        error: 'Credenciales BlueExpress no configuradas',
        hint: 'Configura BLUEX_CLIENT_ACCOUNT, BLUEX_USER_CODE, BLUEX_API_KEY, BLUEX_CLIENT_ID, BLUEX_CLIENT_SECRET en secrets',
      }, { status: 503 });
    }

    // ── Resolver distrito destino REAL (tarifario oficial → BX-Geo) ──────────
    const sr = base44.asServiceRole;
    const distrito = await resolverDistrito(sr, comuna_destino);
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

    // Modo dry-run: verificar resolución de distrito y payload sin emitir OT real
    if (dry_run) {
      return Response.json({ ok: true, dry_run: true, distrito_resuelto: distrito, tipo_destino: tipoDestino, payload_preview: payload });
    }

    // Llamar a API de Emisión CORPORATIVA PRODUCCIÓN (Bearer + x-api-key)
    const bearer = await getBearerToken();
    const response = await fetch(BLUEX_EMISSION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer}`,
        'x-api-key': apiKey,
      },
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
    // labels puede venir como objeto {contenido} o como ARRAY [{contenido}]
    const labelsField = body.labels || data.labels;
    const labelContenido = Array.isArray(labelsField)
      ? (labelsField[0]?.contenido || null)
      : (labelsField?.contenido || body.label || null);

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