// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Tracking Push Webhook (Customer side / POD)
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint que Bluex llama EN TIEMPO REAL cuando una OT cambia de estado
// (retirado, en tránsito, en reparto, entregado, intento fallido, excepción).
// Reemplaza la espera del poller de 6h: el cliente recibe el email al instante.
//
// Body Bluex: { trackingNumber, eventCode, eventCodeDesc, eventDate,
//               photosEvidenceBlue: [urls POD] }
//
// Auth: header Authorization debe traer el BLUEX_TOKEN (crudo o "Bearer <token>").
// Esa es la credencial que PEYU le entrega a Bluex al registrar el endpoint.
// URL a registrar con Bluex: dashboard → code → functions → bluexTrackingPush.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mapea evento Bluex → estado interno del Envio.
// Prioriza el código conocido; si no, clasifica por palabras de la descripción.
function mapEstado(code, desc) {
  const c = String(code || '').toUpperCase();
  const d = String(desc || '').toUpperCase();
  if (c === 'DL' || d.includes('ENTREGADO') && !d.includes('NO ENTREGADO')) return 'Entregado';
  if (d.includes('NO ENTREGADO') || d.includes('INTENTO') || d.includes('AUSENTE') || d.includes('CERRADO')) return 'No Entregado';
  if (d.includes('REPARTO')) return 'En Reparto';
  if (d.includes('DEVOL') || d.includes('RETORNO')) return 'Devuelto';
  if (d.includes('RETIR') || d.includes('PICKUP') || d.includes('RECOLECT')) return 'Retirado por Courier';
  if (d.includes('TRANSITO') || d.includes('RUTA') || d.includes('ARRIBO') || d.includes('SALIDA') || d.includes('HUB')) return 'En Tránsito';
  if (d.includes('RECHAZ') || d.includes('SINIESTR') || d.includes('EXTRAV') || d.includes('EQUIVOCADA')) return 'Excepción';
  return null; // evento informativo: se registra sin cambiar estado
}

const ES_EXCEPCION = (desc) => /RECHAZ|SINIESTR|EXTRAV|EQUIVOCADA|NO ENTREGADO|DEVOL/i.test(String(desc || ''));

// Email al cliente según el nuevo estado (mismas plantillas que el poller CRON)
function buildEmail(estado, envio, fotos = []) {
  const trackingUrl = envio.tracking_url || `https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`;
  const nombre = envio.cliente_nombre?.split(' ')[0] || 'Hola';
  const fotosTxt = fotos.length ? `\n📸 Evidencia de entrega:\n${fotos.map(f => `• ${f}`).join('\n')}\n` : '';

  const templates = {
    'Retirado por Courier': {
      tipo: 'retirado_courier',
      subject: `🚚 Tu pedido ${envio.numero_pedido} fue retirado por el courier`,
      body: `Hola ${nombre},\n\nTu pedido va en camino. BlueExpress acaba de retirarlo de nuestra bodega.\n\n📍 Sigue el viaje en vivo: ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    'En Tránsito': {
      tipo: 'en_transito',
      subject: `📡 Tu pedido ${envio.numero_pedido} está en tránsito`,
      body: `Hola ${nombre},\n\nTu pedido está viajando por la red de BlueExpress.\n\nÚltima actualización: ${envio.ultimo_evento_descripcion || 'En tránsito'}\n\n📍 ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    'En Reparto': {
      tipo: 'en_reparto_hoy',
      subject: `🛵 ¡Tu pedido ${envio.numero_pedido} sale hoy a reparto!`,
      body: `Hola ${nombre},\n\n¡Hoy es el día! Tu pedido entró en ruta de reparto.\n\n💡 Tip: asegúrate de tener alguien en la dirección durante el día. Si no hay quien reciba, el courier dejará un aviso de visita.\n\n📍 Tracking: ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    'Entregado': {
      tipo: 'entregado',
      subject: `🎉 Tu pedido ${envio.numero_pedido} fue entregado — ¡gracias!`,
      body: `Hola ${nombre},\n\n¡Llegó! Tu pedido ${envio.numero_pedido} fue entregado correctamente.\n${fotosTxt}\nEsperamos que te encante. Si tienes 30 segundos, ¿nos cuentas qué te pareció? Solo responde este email con tu opinión.\n\n♻️ Gracias por elegir plástico reciclado chileno.\n\n— Equipo Peyu 🐢`,
    },
    'No Entregado': {
      tipo: 'intento_fallido',
      subject: `⚠️ No pudimos entregar tu pedido ${envio.numero_pedido}`,
      body: `Hola ${nombre},\n\nEl courier intentó entregar tu pedido pero no encontró a nadie en la dirección.\n\n📍 Reagenda directamente con BlueExpress: ${trackingUrl}\n\nO llámanos al WhatsApp +56 9 3504 0242 y te ayudamos a coordinar.\n\n— Equipo Peyu 🐢`,
    },
    'Excepción': {
      tipo: 'excepcion',
      subject: `🔔 Hay una novedad con tu pedido ${envio.numero_pedido}`,
      body: `Hola ${nombre},\n\nDetectamos una incidencia en el tránsito de tu pedido. Ya estamos sobre el caso.\n\n📍 Detalle: ${envio.ultimo_evento_descripcion}\n\nTe contactaremos en las próximas horas. Si quieres adelantarte: WhatsApp +56 9 3504 0242.\n\n— Equipo Peyu 🐢`,
    },
  };
  return templates[estado] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // ── Auth: credencial compartida con Bluex (BLUEX_TOKEN) o admin autenticado (test)
    const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const token = Deno.env.get('BLUEX_TOKEN') || '';
    let authorized = !!token && auth === token;
    if (!authorized) {
      const user = await base44.auth.me().catch(() => null);
      authorized = user?.role === 'admin';
    }
    if (!authorized) return Response.json({ title: 'Unauthorized', status: 401 }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { trackingNumber, eventCode, eventCodeDesc, eventDate, photosEvidenceBlue = [] } = body;
    if (!trackingNumber || !eventCode) {
      return Response.json({ title: 'Bad Request', status: 400, detail: '[trackingNumber must not be null]', instance: '/tracking-push/' }, { status: 400 });
    }

    // ── Buscar el envío por OT
    const envios = await sr.entities.Envio.filter({ tracking_number: String(trackingNumber) }, undefined, 1);
    const envio = envios?.[0];
    if (!envio) {
      // 200 igual: Bluex puede notificar OTs de otros canales; no reintentar
      console.warn(`[bluexTrackingPush] OT ${trackingNumber} sin Envio asociado`);
      return Response.json({ status: 'OK', note: 'tracking sin envío asociado' });
    }

    // ── Idempotencia: mismo code + misma fecha ya registrado → no duplicar
    const eventos = envio.eventos || [];
    const at = eventDate || new Date().toISOString();
    if (eventos.some(e => e.code === eventCode && e.at === at)) {
      return Response.json({ status: 'OK', note: 'evento duplicado ignorado' });
    }

    const esExcepcion = ES_EXCEPCION(eventCodeDesc);
    const nuevoEstado = mapEstado(eventCode, eventCodeDesc);
    const estadoAnterior = envio.estado;

    const nuevoEvento = {
      at, code: eventCode,
      estado: nuevoEstado || estadoAnterior,
      descripcion: eventCodeDesc || '',
      ubicacion: '',
      es_excepcion: esExcepcion,
      ...(photosEvidenceBlue.length ? { fotos: photosEvidenceBlue } : {}),
    };

    const update = {
      eventos: [...eventos, nuevoEvento],
      ultimo_evento_at: at,
      ultimo_evento_descripcion: eventCodeDesc || '',
      ultimo_poll_at: new Date().toISOString(),
      ...(esExcepcion ? { tiene_excepcion: true } : {}),
      ...(nuevoEstado ? { estado: nuevoEstado } : {}),
      ...(nuevoEstado === 'Entregado' ? { fecha_entrega_real: at } : {}),
      ...(nuevoEstado === 'No Entregado' ? { intentos_entrega: (envio.intentos_entrega || 0) + 1 } : {}),
    };
    await sr.entities.Envio.update(envio.id, update);

    // ── Notificación inmediata al cliente (idempotente por tipo)
    let notified = false;
    if (nuevoEstado && nuevoEstado !== estadoAnterior && envio.cliente_email) {
      const tpl = buildEmail(nuevoEstado, { ...envio, ...update }, photosEvidenceBlue);
      const yaEnviadas = new Set((envio.notificaciones_enviadas || []).map(n => n.tipo));
      if (tpl && !yaEnviadas.has(tpl.tipo)) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: envio.cliente_email,
          from_name: 'PEYU Chile',
          subject: tpl.subject,
          body: tpl.body,
        });
        await sr.entities.Envio.update(envio.id, {
          notificaciones_enviadas: [
            ...(envio.notificaciones_enviadas || []),
            { at: new Date().toISOString(), tipo: tpl.tipo, canal: 'email', subject: tpl.subject },
          ],
        });
        notified = true;
      }
    }

    // ── Sincronizar PedidoWeb cuando se entrega
    if (nuevoEstado === 'Entregado' && envio.pedido_id) {
      const pedido = await sr.entities.PedidoWeb.get(envio.pedido_id).catch(() => null);
      if (pedido && pedido.estado !== 'Entregado') {
        await sr.entities.PedidoWeb.update(envio.pedido_id, { estado: 'Entregado' });
      }
    }

    return Response.json({ status: 'OK', estado: nuevoEstado || estadoAnterior, notified });
  } catch (error) {
    console.error('[bluexTrackingPush]', error);
    return Response.json({ title: 'Internal Server Error', status: 500, detail: error.message, instance: '/tracking-push/' }, { status: 500 });
  }
});