// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Tracking Poller CRON + Secuencias inteligentes por destino
// ─────────────────────────────────────────────────────────────────────────────
// Cada 6h:
//   1. Consulta tracking de envíos activos en Bluex
//   2. Detecta cambios de estado y dispara emails al cliente según ciudad/tipo
//   3. Aplica secuencias diferenciadas:
//       • Urbano (Santiago, Vña, etc): secuencia estándar
//       • Extremo Norte (Arica, Iquique): aviso lead time + recordatorios
//       • Extremo Sur (Punta Arenas, Coyhaique): aviso clima + lead time
//       • Rural / Extendido: contacto preventivo
//       • Alto valor (>$80k): email + opción WhatsApp manual
//   4. Detecta excepciones e incidencias para alerta interna
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const ESTADOS_ACTIVOS = [
  'Etiqueta Generada', 'En Bodega', 'Retirado por Courier',
  'En Tránsito', 'En Reparto', 'No Entregado', 'Excepción',
];

const COMUNAS_EXTREMO_NORTE = ['arica', 'iquique', 'alto hospicio', 'pozo almonte', 'calama', 'antofagasta', 'tocopilla', 'mejillones'];
const COMUNAS_EXTREMO_SUR = ['punta arenas', 'puerto natales', 'coyhaique', 'puerto aysen', 'castro', 'ancud', 'puerto montt', 'osorno'];

function clasificarSecuencia(envio) {
  const c = (envio.comuna_destino || '').toLowerCase();
  const valor = envio.valor_declarado_clp || 0;
  if (COMUNAS_EXTREMO_NORTE.some(x => c.includes(x))) return 'extremo_norte';
  if (COMUNAS_EXTREMO_SUR.some(x => c.includes(x))) return 'extremo_sur';
  if (envio.tipo_destino === 'Rural' || envio.tipo_destino === 'Extendido') return 'rural';
  if (valor >= 80000) return 'alto_valor';
  return 'estandar_urbano';
}

// Plantillas por evento + secuencia
function buildEmail(tipo, envio, secuencia) {
  const trackingUrl = envio.tracking_url || `https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`;
  const nombre = envio.cliente_nombre?.split(' ')[0] || 'Hola';

  const templates = {
    etiqueta_generada: {
      subject: `📦 Tu pedido ${envio.numero_pedido} ya tiene OT — sale mañana`,
      body: `Hola ${nombre},\n\n¡Genial! Ya emitimos la orden de transporte para tu pedido ${envio.numero_pedido}.\n\n🚚 Courier: BlueExpress\n📍 Tracking: ${envio.tracking_number}\n🔗 ${trackingUrl}\n\nMañana lo retira el courier. Te avisaremos cada movimiento.\n\n— Equipo Peyu 🐢`,
    },
    retirado_courier: {
      subject: `🚚 Tu pedido ${envio.numero_pedido} fue retirado por el courier`,
      body: `Hola ${nombre},\n\nTu pedido va en camino. BlueExpress acaba de retirarlo de nuestra bodega.\n\n📍 Sigue el viaje en vivo: ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    en_transito: {
      subject: `📡 Tu pedido ${envio.numero_pedido} está en tránsito`,
      body: `Hola ${nombre},\n\nTu pedido está viajando por la red de BlueExpress.\n\nÚltima actualización: ${envio.ultimo_evento_descripcion || 'En tránsito'}\n\n📍 ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    en_reparto_hoy: {
      subject: `🛵 ¡Tu pedido ${envio.numero_pedido} sale hoy a reparto!`,
      body: `Hola ${nombre},\n\n¡Hoy es el día! Tu pedido entró en ruta de reparto.\n\n💡 Tip: asegúrate de tener alguien en la dirección durante el día. Si no hay quien reciba, el courier dejará un aviso de visita.\n\n📍 Tracking: ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    entregado: {
      subject: `🎉 Tu pedido ${envio.numero_pedido} fue entregado — ¡gracias!`,
      body: `Hola ${nombre},\n\n¡Llegó! Tu pedido ${envio.numero_pedido} fue entregado correctamente.\n\nEsperamos que te encante. Si tienes 30 segundos, ¿nos cuentas qué te pareció? Solo responde este email con tu opinión.\n\n♻️ Gracias por elegir plástico reciclado chileno.\n\n— Equipo Peyu 🐢`,
    },
    intento_fallido: {
      subject: `⚠️ No pudimos entregar tu pedido ${envio.numero_pedido}`,
      body: `Hola ${nombre},\n\nEl courier intentó entregar tu pedido pero no encontró a nadie en la dirección.\n\n📍 Reagenda directamente con BlueExpress: ${trackingUrl}\n\nO llámanos al WhatsApp +56 9 3504 0242 y te ayudamos a coordinar.\n\n— Equipo Peyu 🐢`,
    },
    excepcion: {
      subject: `🔔 Hay una novedad con tu pedido ${envio.numero_pedido}`,
      body: `Hola ${nombre},\n\nDetectamos una incidencia en el tránsito de tu pedido. Ya estamos sobre el caso.\n\n📍 Detalle: ${envio.ultimo_evento_descripcion}\n\nTe contactaremos en las próximas horas. Si quieres adelantarte: WhatsApp +56 9 3504 0242.\n\n— Equipo Peyu 🐢`,
    },
    extremo_aviso_largo: {
      subject: `📍 Tu pedido viaja a ${envio.comuna_destino} — tiempos especiales`,
      body: `Hola ${nombre},\n\nTu pedido ${envio.numero_pedido} viaja a una zona extrema (${envio.comuna_destino}). Por logística aérea/terrestre, el tiempo de entrega es de 3 a 7 días hábiles.\n\nTe avisaremos cada movimiento clave para que estés al tanto.\n\n📍 ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    },
    remoto_lead_time: {
      subject: `📦 Tu pedido viaja a zona ${envio.tipo_destino?.toLowerCase() || 'rural'}`,
      body: `Hola ${nombre},\n\nTu dirección está clasificada como ${envio.tipo_destino || 'extendida'} en la red BlueExpress, lo que puede agregar 1-2 días al lead time normal.\n\nTodo va en orden. Te avisamos cada actualización.\n\n— Equipo Peyu 🐢`,
    },
    atraso_proactivo: {
      subject: `🕐 Sabemos que tu pedido ${envio.numero_pedido} está demorado`,
      body: `Hola ${nombre},\n\nQueremos ser transparentes: tu pedido lleva más días de lo normal en tránsito y sabemos que es frustrante.\n\nYa estamos en contacto con BlueExpress para ubicarlo. Te actualizaremos en las próximas 24h.\n\nSi quieres conversarlo directo: WhatsApp +56 9 3504 0242.\n\n— Equipo Peyu 🐢`,
    },
  };

  return templates[tipo];
}

// ¿Qué notificaciones enviar según el cambio de estado + secuencia?
function decidirNotificaciones(envio, estadoAnterior, secuencia) {
  const yaEnviadas = new Set((envio.notificaciones_enviadas || []).map(n => n.tipo));
  const eventos = [];

  // Cambio de estado → notif principal
  const map = {
    'Etiqueta Generada': 'etiqueta_generada',
    'Retirado por Courier': 'retirado_courier',
    'En Tránsito': 'en_transito',
    'En Reparto': 'en_reparto_hoy',
    'Entregado': 'entregado',
    'No Entregado': 'intento_fallido',
    'Excepción': 'excepcion',
  };
  const tipoPrincipal = map[envio.estado];
  if (tipoPrincipal && envio.estado !== estadoAnterior && !yaEnviadas.has(tipoPrincipal)) {
    eventos.push(tipoPrincipal);
  }

  // Notificaciones contextuales según secuencia (solo al emitir)
  if (estadoAnterior !== envio.estado && envio.estado === 'Etiqueta Generada') {
    if ((secuencia === 'extremo_norte' || secuencia === 'extremo_sur') && !yaEnviadas.has('extremo_aviso_largo')) {
      eventos.push('extremo_aviso_largo');
    } else if (secuencia === 'rural' && !yaEnviadas.has('remoto_lead_time')) {
      eventos.push('remoto_lead_time');
    }
  }

  // Atraso proactivo (>5 días en tránsito sin entregar)
  if (envio.atrasado && envio.dias_en_transito > 5 && !yaEnviadas.has('atraso_proactivo') && envio.estado !== 'Entregado') {
    eventos.push('atraso_proactivo');
  }

  return eventos;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const envios = await sr.entities.Envio.filter({});
    const activos = envios.filter(e => ESTADOS_ACTIVOS.includes(e.estado));

    let polled = 0;
    let notifsSent = 0;
    let exceptions = 0;
    const errores = [];

    for (const envio of activos) {
      if (!envio.tracking_number) continue;

      const estadoAnterior = envio.estado;

      try {
        // Llamar a bluexTrackShipment para refrescar datos
        const resTrack = await base44.functions.invoke('bluexTrackShipment', {
          envio_id: envio.id,
        });
        polled++;

        if (resTrack.data?.tiene_excepcion) exceptions++;

        // Releer envío actualizado
        const updated = await sr.entities.Envio.get(envio.id);
        const secuencia = clasificarSecuencia(updated);

        if (updated.secuencia_activa !== secuencia) {
          await sr.entities.Envio.update(envio.id, { secuencia_activa: secuencia });
        }

        // Decidir notificaciones a disparar
        const tipos = decidirNotificaciones(updated, estadoAnterior, secuencia);
        const enviadas = updated.notificaciones_enviadas || [];

        for (const tipo of tipos) {
          const tpl = buildEmail(tipo, updated, secuencia);
          if (!tpl || !updated.cliente_email) continue;

          await base44.integrations.Core.SendEmail({
            to: updated.cliente_email,
            from_name: 'PEYU Chile',
            subject: tpl.subject,
            body: tpl.body,
          });
          enviadas.push({
            at: new Date().toISOString(),
            tipo, canal: 'email', subject: tpl.subject,
          });
          notifsSent++;
        }

        if (tipos.length > 0) {
          await sr.entities.Envio.update(envio.id, { notificaciones_enviadas: enviadas });
        }

        // Sincronizar PedidoWeb si entregado
        if (updated.estado === 'Entregado' && updated.pedido_id) {
          const pedido = await sr.entities.PedidoWeb.get(updated.pedido_id).catch(() => null);
          if (pedido && pedido.estado !== 'Entregado') {
            await sr.entities.PedidoWeb.update(updated.pedido_id, { estado: 'Entregado' });
          }
        }
      } catch (err) {
        errores.push({ envio_id: envio.id, error: err.message });
      }
    }

    return Response.json({
      ok: true,
      activos: activos.length,
      polled,
      notifs_sent: notifsSent,
      exceptions,
      errores: errores.length,
    });
  } catch (error) {
    console.error('[bluexTrackingPollerCRON]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});