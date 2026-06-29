// ============================================================================
// gaFetchRealtime — Métricas GA4 en tiempo real + últimos 7 días.
// ----------------------------------------------------------------------------
// Robusto: si no se entrega property_id, lo auto-descubre vía GA4 Admin API
// (la primera propiedad de la cuenta conectada). Así el agente y el panel
// pueden llamarlo SIN parámetros y funcionar siempre.
//
// Salida normalizada (para el panel y el timeline del agente):
//   { activeUsers, screenPageViews, topPages:[{page,views}],
//     byChannel:[{channel,sessions,users,conversions,revenue}],
//     property_id, ...compat antiguo (realtime, last_7d_by_channel) }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Descubre la primera GA4 property accesible con el token conectado.
async function discoverPropertyId(accessToken) {
  const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  for (const acc of (data.accountSummaries || [])) {
    const prop = (acc.propertySummaries || [])[0];
    if (prop?.property) return String(prop.property).replace('properties/', '');
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
    if (!accessToken) {
      return Response.json({ error: 'Google Analytics no está conectado. Conéctalo en Integraciones para ver métricas en vivo.' }, { status: 400 });
    }

    // property_id: del body, o env, o auto-descubierto.
    let property_id = body.property_id || Deno.env.get('GA4_PROPERTY_ID') || null;
    if (!property_id) {
      property_id = await discoverPropertyId(accessToken);
    }
    if (!property_id) {
      return Response.json({ error: 'No pude detectar una propiedad GA4. Verifica que la cuenta conectada tenga acceso a una propiedad de Analytics.' }, { status: 400 });
    }
    property_id = String(property_id).replace('properties/', '');

    // ── Realtime: usuarios activos + páginas activas (últimos 30 min) ──────────
    const rtRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runRealtimeReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        limit: 10,
      }),
    });

    if (!rtRes.ok) {
      const errText = await rtRes.text();
      return Response.json({ error: `GA4 realtime: ${errText}`, property_id }, { status: rtRes.status });
    }
    const rtData = await rtRes.json();
    const rtRows = rtData.rows || [];
    const activeUsers = rtRows.reduce((s, r) => s + Number(r.metricValues?.[0]?.value || 0), 0);
    const screenPageViews = rtRows.reduce((s, r) => s + Number(r.metricValues?.[1]?.value || 0), 0);
    const topPages = rtRows
      .map(r => ({ page: r.dimensionValues?.[0]?.value || '(no definido)', views: Number(r.metricValues?.[1]?.value || 0) }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    // ── Últimos 7d por canal ───────────────────────────────────────────────────
    const histRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }, { name: 'totalRevenue' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    });
    const histData = histRes.ok ? await histRes.json() : { rows: [] };
    const byChannel = (histData.rows || []).map(r => ({
      channel: r.dimensionValues?.[0]?.value || '(otro)',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      users: Number(r.metricValues?.[1]?.value || 0),
      conversions: Number(r.metricValues?.[2]?.value || 0),
      revenue: Number(r.metricValues?.[3]?.value || 0),
    }));

    return Response.json({
      // Forma normalizada (panel + agente)
      property_id,
      activeUsers,
      screenPageViews,
      topPages,
      byChannel,
      // Compat con la forma antigua
      realtime: { total_active_users: activeUsers, top_pages: topPages },
      last_7d_by_channel: byChannel,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});