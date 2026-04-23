// ============================================================================
// gaFetchRealtime — Métricas GA4 en tiempo real
// ----------------------------------------------------------------------------
// Payload: { property_id: "123456789" }  (GA4 property numérico, sin "properties/")
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { property_id } = await req.json();
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // Realtime: usuarios activos últimos 30min
    const rtRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runRealtimeReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: [{ name: 'country' }, { name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      }),
    });

    if (!rtRes.ok) {
      const errText = await rtRes.text();
      return Response.json({ error: errText }, { status: rtRes.status });
    }
    const rtData = await rtRes.json();

    // Últimos 7d: sesiones, conversiones, canales
    const histRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }, { name: 'totalRevenue' },
        ],
      }),
    });
    const histData = histRes.ok ? await histRes.json() : { rows: [] };

    return Response.json({
      realtime: {
        total_active_users: (rtData.rows || []).reduce((s, r) => s + Number(r.metricValues[0].value || 0), 0),
        by_country: (rtData.rows || []).map(r => ({
          country: r.dimensionValues[0].value,
          device: r.dimensionValues[1].value,
          active_users: Number(r.metricValues[0].value),
          views: Number(r.metricValues[1].value),
        })),
      },
      last_7d_by_channel: (histData.rows || []).map(r => ({
        channel: r.dimensionValues[0].value,
        sessions: Number(r.metricValues[0].value),
        users: Number(r.metricValues[1].value),
        conversions: Number(r.metricValues[2].value),
        revenue: Number(r.metricValues[3].value),
      })),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});