// ============================================================================
// googleHealthCheck — Diagnóstico centralizado de las conexiones Google
// ============================================================================
// Verifica que los 7 conectores Google estén operativos haciendo una llamada
// mínima (read-only) a cada API. Devuelve un resumen consolidado para el
// panel admin /admin/google.
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Ejecuta un health-check individual contra una API de Google.
 * Devuelve { ok, status, email, detail, latency_ms }.
 */
async function probe(name, url, accessToken) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const latency_ms = Date.now() - started;
    const ok = res.ok;
    let detail = null;
    let extra = {};

    if (ok) {
      const json = await res.json().catch(() => ({}));
      // Extraer info útil según servicio
      if (name === 'gmail') {
        extra = { email: json.emailAddress, messages_total: json.messagesTotal };
      } else if (name === 'calendar') {
        extra = { calendars_count: (json.items || []).length };
      } else if (name === 'drive') {
        extra = { user: json.user?.emailAddress, storage_used_gb: json.storageQuota ? (Number(json.storageQuota.usage) / 1e9).toFixed(2) : null };
      } else if (name === 'analytics') {
        extra = { accounts_count: (json.accounts || []).length };
      } else if (name === 'search_console') {
        extra = { sites_count: (json.siteEntry || []).length };
      }
    } else {
      detail = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
    }

    return { service: name, ok, status: res.status, latency_ms, detail, ...extra };
  } catch (err) {
    return { service: name, ok: false, status: 0, latency_ms: Date.now() - started, detail: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Solo admins pueden ejecutar el health-check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    // Obtener tokens de las 7 conexiones en paralelo
    const connectorNames = [
      'gmail',
      'googlecalendar',
      'googledrive',
      'googledocs',
      'googlesheets',
      'google_analytics',
      'google_search_console',
    ];

    const tokens = {};
    await Promise.all(
      connectorNames.map(async (conn) => {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection(conn);
          tokens[conn] = accessToken;
        } catch (e) {
          tokens[conn] = null;
        }
      })
    );

    // Probes en paralelo — un endpoint barato por servicio
    const probes = await Promise.all([
      tokens.gmail
        ? probe('gmail', 'https://gmail.googleapis.com/gmail/v1/users/me/profile', tokens.gmail)
        : Promise.resolve({ service: 'gmail', ok: false, detail: 'No token' }),
      tokens.googlecalendar
        ? probe('calendar', 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=5', tokens.googlecalendar)
        : Promise.resolve({ service: 'calendar', ok: false, detail: 'No token' }),
      tokens.googledrive
        ? probe('drive', 'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', tokens.googledrive)
        : Promise.resolve({ service: 'drive', ok: false, detail: 'No token' }),
      tokens.googledocs
        ? // Docs no tiene un "ping" claro — validamos token haciendo una request al discovery
          probe('docs', 'https://docs.googleapis.com/$discovery/rest?version=v1', tokens.googledocs)
        : Promise.resolve({ service: 'docs', ok: false, detail: 'No token' }),
      tokens.googlesheets
        ? probe('sheets', 'https://sheets.googleapis.com/$discovery/rest?version=v4', tokens.googlesheets)
        : Promise.resolve({ service: 'sheets', ok: false, detail: 'No token' }),
      tokens.google_analytics
        ? probe(
            'analytics',
            'https://analyticsadmin.googleapis.com/v1beta/accounts',
            tokens.google_analytics
          )
        : Promise.resolve({ service: 'analytics', ok: false, detail: 'No token' }),
      tokens.google_search_console
        ? probe(
            'search_console',
            'https://searchconsole.googleapis.com/webmasters/v3/sites',
            tokens.google_search_console
          )
        : Promise.resolve({ service: 'search_console', ok: false, detail: 'No token' }),
    ]);

    const okCount = probes.filter((p) => p.ok).length;
    const totalLatency = probes.reduce((a, p) => a + (p.latency_ms || 0), 0);

    return Response.json({
      ok: true,
      summary: {
        connected: okCount,
        total: probes.length,
        all_healthy: okCount === probes.length,
        avg_latency_ms: Math.round(totalLatency / probes.length),
      },
      probes,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});