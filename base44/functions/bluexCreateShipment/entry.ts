import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Emisión OS (Orden de Servicio) - API Corporativa
// Endpoint: POST /cmkin/customer/corp/emission/v1/emission
// ─────────────────────────────────────────────────────────────────────────────
// Integración con BlueExpress API de Emisión OS para generar OT automáticamente.
// Soporta:
//  - Generación automática de números de tracking
//  - Múltiples formatos de etiqueta (PDF, ZPL, XML, EPL)
//  - Emisión sin etiqueta
//  - Dimensiones y peso detallados por paquete
//  - Geolocalización
//  - Comentarios y parámetros personalizados

const BLUEX_EMISSION_API = 'https://cmkin.api.qa.blue.cl/cmkin/customer/corp/emission/v1/emission';
const BLUEX_EMISSION_PROD = 'https://cmkin.api.blue.cl/cmkin/customer/corp/emission/v1/emission';

// Mapeo de tipo destino → código distrito BlueExpress
const TIPOS_DESTINO_DISTRITO = {
  'Extremo': 'ZLY', // Zona Lejana (default fallback)
  'Rural': 'ZLY',
  'Urbano': 'PUD', // Pudahuel (default Santiago)
};

const ORIGEN_CORPORATIVO = {
  districtId: 'PUD',
  districtName: 'Pudahuel',
  address: 'Galpón PEYU, Santiago',
  agencyId: '41',
  geolocation: [-33.319054, -70.72056],
};

function clasificarTipoDestino(comuna) {
  const c = (comuna || '').toLowerCase();
  const extremos = ['arica', 'iquique', 'punta arenas', 'coyhaique', 'puerto williams', 'castro', 'puerto natales'];
  const rurales = ['rural', 'localidad'];
  if (extremos.some(x => c.includes(x))) return 'Extremo';
  if (rurales.some(x => c.includes(x))) return 'Rural';
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
      servicio = 'PY', // PY: Priority, EX: Express, PR: Premium, MD: Sameday
      print_format = 2, // 4: PDF, 3: XML, 2: ZPL, 1: EPL
      dimensiones, // { largo_cm, ancho_cm, alto_cm }
      referencia,
      comentarios,
    } = await req.json();

    const id = proposal_id || pedido_id;
    if (!id) return Response.json({ error: 'Falta proposal_id o pedido_id' }, { status: 400 });

    // Obtener credenciales Bluex desde secrets
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

    const tipoDestino = clasificarTipoDestino(comuna_destino);
    const distritoCode = TIPOS_DESTINO_DISTRITO[tipoDestino] || 'PUD';

    // Construir request de Emisión OS corporativa
    const payload = {
      printFormatCode: print_format,
      clientPromiseDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      trackingNumber: null, // BlueExpress genera automáticamente
      clientAccount,
      clientIdentifier: referencia || `PEYU-${Date.now()}`,
      quantityPackages: 1,
      references: [referencia || `PEYU-${id}`],
      serviceType: servicio,
      productType: 'P', // P: Paquete
      productCategory: 'PAQU', // PAQU: Paquete
      currency: 'CLP',
      shipmentCost: valor_declarado,
      extendedClaim: false,
      companyId: 2000, // Valor fijo requerido
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
          districtId: distritoCode,
          districtName: comuna_destino || 'Santiago',
          address: direccion_destino || 'Dirección pendiente',
          agencyId: '41',
          geolocation: [-33.3, -70.7], // Aproximado
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

    // Llamar a API de Emisión OS
    const response = await fetch(BLUEX_EMISSION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[BlueExpress Emission] Error:', response.status, data);
      return Response.json({
        error: `BlueExpress API error (${response.status})`,
        detail: data.detail || data.title || 'Error en la emisión OS',
        trace: data,
      }, { status: response.status });
    }

    const trackingNumber = data.trackingNumber;
    if (!trackingNumber) {
      return Response.json({
        error: 'BlueExpress no retornó tracking number',
        trace: data,
      }, { status: 500 });
    }

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
      servicio,
      estado: 'Etiqueta Generada',
      comuna_destino,
      direccion_destino,
      tipo_destino: tipoDestino,
      peso_kg: parseFloat(peso_kg),
      piezas: 1,
      valor_declarado_clp: valor_declarado,
      lead_time_estimado_dias: tipoDestino === 'Extremo' ? 7 : tipoDestino === 'Rural' ? 5 : 3,
      fecha_emision: new Date().toISOString(),
      fecha_promesa: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      label_url: data.labels?.contenido ? `data:image/base64,${data.labels.contenido}` : null,
      label_format: ['PDF', 'XML', 'ZPL', 'EPL'][print_format - 1] || 'PDF',
      tracking_url: `https://www.bluex.cl/seguimiento?n=${trackingNumber}`,
      raw_response_emision: data,
      eventos: [{
        at: new Date().toISOString(),
        code: '01',
        estado: 'Etiqueta Generada',
        descripcion: 'OT emitida vía API BlueExpress Corporativa',
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
      label_contenido: data.labels?.contenido || null,
      label_format: ['PDF', 'XML', 'ZPL', 'EPL'][print_format - 1] || 'PDF',
      tracking_url: `https://www.bluex.cl/seguimiento?n=${trackingNumber}`,
      api_response: data,
    });
  } catch (error) {
    console.error('[BlueExpress Emission]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});