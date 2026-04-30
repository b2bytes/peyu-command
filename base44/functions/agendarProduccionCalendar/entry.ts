import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger automático: cuando una OrdenProduccion cambia a "En Producción",
 * agenda en Google Calendar el inicio + entrega estimada para que el
 * equipo de operaciones tenga visibilidad real en su agenda.
 *
 * Disparador: entity automation on update de OrdenProduccion con
 * condición data.estado == "En Producción".
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const ordenId = body?.event?.entity_id || body?.data?.id || body?.ordenId;
    if (!ordenId) return Response.json({ error: 'ordenId requerido' }, { status: 400 });

    const ordenes = await base44.asServiceRole.entities.OrdenProduccion.filter({ id: ordenId });
    const orden = ordenes?.[0];
    if (!orden) return Response.json({ error: 'Orden no encontrada' }, { status: 404 });

    // Calcular fechas en zona Chile
    const now = new Date();
    const fechaInicioISO = now.toISOString();

    // Lead time por defecto 10 días si no viene definido
    const leadDays = orden.lead_time_dias || 10;
    const fechaEntrega = new Date(now);
    fechaEntrega.setDate(fechaEntrega.getDate() + leadDays);

    // Evento de inicio (1 hora bloqueada)
    const start = new Date(now.getTime() + 30 * 60_000); // empieza en 30min
    const end = new Date(start.getTime() + 60 * 60_000);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const evento = {
      summary: `🏭 Inicio Producción · ${orden.empresa}`,
      description: `Orden de producción Peyu Chile.\n\nEmpresa: ${orden.empresa}\nProducto: ${orden.sku}\nCantidad: ${orden.cantidad} u.\nPersonalización: ${orden.personalizacion ? 'Sí' : 'No'}\nPrioridad: ${orden.prioridad || 'Normal'}\nEntrega estimada: ${fechaEntrega.toLocaleDateString('es-CL')}\n\n${orden.notas_produccion || ''}`,
      start: { dateTime: start.toISOString(), timeZone: 'America/Santiago' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Santiago' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      colorId: '10', // verde
    };

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evento),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Calendar API error: ${res.status}`, detail: errText.slice(0, 300) }, { status: 502 });
    }

    const event = await res.json();

    // Persistir el ID del evento en la orden
    await base44.asServiceRole.entities.OrdenProduccion.update(ordenId, {
      notas_produccion: `${orden.notas_produccion || ''}\n📅 Calendar: ${event.htmlLink}`.trim(),
      fecha_inicio: fechaInicioISO,
      fecha_entrega_estimada: fechaEntrega.toISOString().split('T')[0],
    });

    return Response.json({
      ok: true,
      event_id: event.id,
      html_link: event.htmlLink,
      start: start.toISOString(),
      lead_days: leadDays,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});