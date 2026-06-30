// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Consultar tracking en tiempo real (API CORPORATIVA PRODUCCIÓN)
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint: GET /cmkin/bff/tracking-pull-corp/v1/{trackingNumber}
// Auth: Bearer BLUEX_TOKEN + x-api-key BLUEX_API_KEY (igual que la emisión OS).
// Actualiza Envio.eventos + estado derivado + atraso vs promesa.
// Es la función que consume el CRON bluexTrackingPollerCRON cada 6h.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeBluexBase(raw) {
  let h = String(raw || '').trim().replace(/\/+$/, '');
  if (!h) return '';
  if (!h.includes('.') && !h.startsWith('http')) return '';
  if (!/^https?:\/\//i.test(h)) h = `https://${h}`;
  return h;
}

// Mapping eventType corporativo → estados internos.
// Códigos REALES verificados de la API corporativa Bluex (no los abreviados
// genéricos): GE/FI = guía emitida, PU = retirado, DL/DE = entregado, etc.
const ESTADO_MAP = {
  // Emisión / digitación de guía
  FI: 'Etiqueta Generada',   // GUIA EN DIGITACION
  GE: 'Etiqueta Generada',   // GUIA ENVIADA
  PR: 'Etiqueta Generada',   // PRINTED
  // Retiro por courier
  PU: 'Retirado por Courier',// PICKED UP / RETIRADO
  RC: 'Retirado por Courier',// RECOLECTADO
  // En tránsito
  IN: 'En Tránsito',         // IN TRANSIT
  AR: 'En Tránsito',         // ARRIBO
  SA: 'En Tránsito',         // SALIDA
  HB: 'En Tránsito',         // HUB
  // En reparto
  ON: 'En Reparto',          // OUT FOR DELIVERY
  RP: 'En Reparto',          // EN REPARTO
  // Entregado
  DL: 'Entregado',           // DELIVERED
  DE: 'Entregado',           // DELIVERED (alias)
  EN: 'Entregado',           // ENTREGADO
  // No entregado / intento fallido
  NE: 'No Entregado',        // NOT DELIVERED
  AU: 'No Entregado',        // AUSENTE
  // Devuelto
  DV: 'Devuelto',            // DEVUELTO
  // Excepción real
  EX: 'Excepción',           // EXCEPTION
  ADA: 'Excepción',          // DIRECCION EQUIVOCADA
};

// Clasifica por la DESCRIPCIÓN del evento cuando el código no está mapeado.
// Misma heurística que bluexTrackingPush (que sí clasificaba bien por texto),
// para que ningún evento real quede como "Excepción" o texto crudo por error.
function estadoPorDescripcion(desc) {
  const d = String(desc || '').toUpperCase();
  if (!d) return null;
  if (d.includes('ENTREGAD') && !d.includes('NO ENTREGAD')) return 'Entregado';
  if (d.includes('NO ENTREGAD') || d.includes('INTENTO') || d.includes('AUSENTE') || d.includes('CERRADO')) return 'No Entregado';
  if (d.includes('REPARTO')) return 'En Reparto';
  if (d.includes('DEVOL') || d.includes('RETORNO')) return 'Devuelto';
  if (d.includes('RETIR') || d.includes('PICKUP') || d.includes('RECOLECT')) return 'Retirado por Courier';
  if (d.includes('GUIA') || d.includes('DIGITAC') || d.includes('IMPRES') || d.includes('EMITID')) return 'Etiqueta Generada';
  if (d.includes('TRANSITO') || d.includes('RUTA') || d.includes('ARRIBO') || d.includes('SALIDA') || d.includes('HUB')) return 'En Tránsito';
  if (d.includes('RECHAZ') || d.includes('SINIESTR') || d.includes('EXTRAV') || d.includes('EQUIVOCAD')) return 'Excepción';
  return null; // evento informativo: no cambia el estado
}

// Resuelve el estado interno de un evento.
// CRÍTICO: en la API corporativa Bluex el `eventCode` (GE, FI, PU, DL…) es el
// evento ESPECÍFICO real; el `eventType` (EX, PU…) es solo una CATEGORÍA que
// agrupa casi todo bajo "Pinchazo de excepción/evento". Por eso el eventCode
// y la descripción mandan; el eventType es el último recurso.
function resolverEstado(eventType, code, desc) {
  return ESTADO_MAP[String(code || '').toUpperCase()]
      || estadoPorDescripcion(desc)
      || ESTADO_MAP[String(eventType || '').toUpperCase()]
      || null;
}

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

    // API corporativa PROD: Bearer OAuth (sso.blue.cl) + x-api-key (verificada).
    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const clientId = Deno.env.get('BLUEX_CLIENT_ID');
    const clientSecret = Deno.env.get('BLUEX_CLIENT_SECRET');

    if (!apiKey || !clientId || !clientSecret) {
      return Response.json({
        ok: true,
        envio_id: envio.id,
        tracking: ot,
        estado: envio.estado,
        modo: 'manual',
        hint: 'Credenciales Bluex no configuradas (BLUEX_API_KEY / BLUEX_CLIENT_ID / BLUEX_CLIENT_SECRET).',
        tracking_url: `https://www.bluex.cl/seguimiento?n=${ot}`,
      });
    }

    let response;
    try {
      // 1) Token OAuth client_credentials (expira en 1h, se pide por consulta)
      const tk = await fetch('https://sso.blue.cl/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}` },
        body: 'grant_type=client_credentials',
      });
      const bearer = (await tk.json().catch(() => ({}))).access_token;
      if (!bearer) throw new Error(`Token Bluex falló (${tk.status})`);

      // 2) Tracking-pull corporativo
      response = await fetch(`https://cmkin.api.blue.cl/cmkin/bff/tracking-pull-corp/v1/${encodeURIComponent(ot)}`, {
        headers: { 'Authorization': `Bearer ${bearer}`, 'x-api-key': apiKey },
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

    // 404 = OT recién emitida, aún sin eventos en el sistema corporativo → no es error.
    if (response.status === 404) {
      await sr.entities.Envio.update(envio.id, { ultimo_poll_at: new Date().toISOString() });
      return Response.json({
        ok: true,
        envio_id: envio.id,
        tracking: ot,
        estado: envio.estado,
        modo: 'sin_eventos',
        hint: 'La OT aún no registra eventos en Bluex (normal en las primeras horas).',
      });
    }

    if (!response.ok) {
      return Response.json({
        error: 'Error consultando tracking Bluex',
        status: response.status,
        detail: data?.detail || data?.title || data,
      }, { status: response.status });
    }

    // ── Parsear respuesta (plana o envuelta en {status,data}) ──
    const root = data?.data && typeof data.data === 'object' ? data.data : data;
    const pkg = root?.packages?.[0] || root || {};
    const rawEvents = pkg.trackings || pkg.events || pkg.tracking || [];

    const eventos = rawEvents.map((t) => {
      const desc = t.eventCodeDesc || t.eventTypeDesc || t.description || t.descripcion || '';
      const estado = resolverEstado(t.eventType, t.eventCode || t.code, desc);
      return {
        at: t.eventDate || t.date || t.fecha || t.timestamp || new Date().toISOString(),
        code: String(t.eventCode || t.eventType || t.code || ''),
        // Si el evento es informativo (sin estado mapeado), conserva el último
        // estado conocido en vez de inventar "Excepción"/"En Tránsito".
        estado: estado || 'En Tránsito',
        descripcion: desc,
        ubicacion: t.location || t.ubicacion || t.branch || '',
        es_excepcion: estado === 'Excepción' || estado === 'No Entregado'
          || /no entregad|rechazad|siniestr|extrav|equivocad/i.test(desc),
      };
    }).sort((a, b) => new Date(b.at) - new Date(a.at));

    // El estado del envío = el del evento MÁS RECIENTE que tenga un estado real
    // mapeado (no un evento informativo). Así una entrega real (DL) manda aunque
    // después llegue un evento informativo sin estado.
    const eventoConEstado = eventos.find((e) =>
      resolverEstado(null, e.code, e.descripcion) !== null
    );
    const ultimoEvento = eventos[0];
    const nuevoEstado = eventoConEstado?.estado || envio.estado;
    const tieneExcepcion = eventos.some((e) => e.es_excepcion);
    const intentos = eventos.filter((e) => /reparto|intento|no entregado/i.test(e.descripcion)).length;

    // Días en tránsito desde la emisión
    const emision = root.emissionDate || envio.fecha_emision;
    const diasTransito = emision
      ? Math.max(0, Math.floor((Date.now() - new Date(emision).getTime()) / 86400000))
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
      updates.fecha_entrega_real = eventoConEstado?.at || ultimoEvento.at;
    }

    await sr.entities.Envio.update(envio.id, updates);

    // ── ENTREGA → dispara la secuencia post-venta (marca el PedidoWeb como
    // "Entregado" + email de reseña). Idempotente: solo cuando recién cambió a
    // Entregado. Así el pipeline avanza solo, llame quien llame esta función
    // (poller, botón manual del admin o webhook). No bloqueante.
    if (nuevoEstado === 'Entregado' && envio.estado !== 'Entregado' && envio.pedido_id) {
      try {
        await base44.functions.invoke('entregaSecuenciaPostVenta', {
          internal: true,
          pedido_id: envio.pedido_id,
        });
      } catch (e) {
        console.error('[bluexTrackShipment] secuencia post-venta falló:', e.message);
      }
    }

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