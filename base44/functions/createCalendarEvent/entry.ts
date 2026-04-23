// ============================================================================
// createCalendarEvent — Crea eventos en Google Calendar (con Meet opcional)
// ============================================================================
// Agenda reuniones con leads B2B y opcionalmente añade un link de Google Meet.
// Envía invitaciones automáticas a los asistentes.
//
// Uso típico:
//   base44.functions.invoke('createCalendarEvent', {
//     summary: 'Reunión mockup PEYU — Acme SPA',
//     description: 'Revisión del mockup de 100 cachos corporativos',
//     start_iso: '2026-04-25T15:00:00-04:00',   // zona horaria Chile
//     end_iso:   '2026-04-25T15:30:00-04:00',
//     attendees: ['cliente@acme.cl', 'ventas@peyuchile.cl'],
//     with_meet: true,
//     location: 'Google Meet',
//   })
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      summary,
      description = '',
      start_iso,
      end_iso,
      attendees = [],
      with_meet = true,
      location = '',
      timezone = 'America/Santiago',
    } = await req.json();

    if (!summary || !start_iso || !end_iso) {
      return Response.json(
        { error: 'Missing required fields: summary, start_iso, end_iso' },
        { status: 400 }
      );
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Payload del evento
    const eventBody = {
      summary,
      description,
      location,
      start: { dateTime: start_iso, timeZone: timezone },
      end: { dateTime: end_iso, timeZone: timezone },
      attendees: attendees.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    // Añadir Google Meet si se pide
    if (with_meet) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `peyu-meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    // sendUpdates=all => envía invitaciones por email a los asistentes
    // conferenceDataVersion=1 => requerido para crear Meet
    const url =
      'https://www.googleapis.com/calendar/v3/calendars/primary/events' +
      '?sendUpdates=all&conferenceDataVersion=1';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        { error: `Calendar API error: ${res.status}`, detail: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const event = await res.json();
    const meetLink =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
      null;

    return Response.json({
      ok: true,
      event_id: event.id,
      html_link: event.htmlLink,
      meet_link: meetLink,
      start: event.start,
      end: event.end,
      attendees: event.attendees || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});