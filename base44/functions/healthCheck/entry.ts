// ============================================================================
// PEYU · healthCheck — endpoint público para uptime monitoring
// ----------------------------------------------------------------------------
// Diseñado para UptimeRobot / Better Uptime / Statuspage. Verifica que la
// app esté levantada y la BD responde. Sin auth (público a propósito).
// Responde 200 si todo OK, 503 si la BD no responde.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const startTs = Date.now();

Deno.serve(async (req) => {
  const start = performance.now();
  try {
    const base44 = createClientFromRequest(req);
    // Ping ligero a la BD (cuenta productos activos — operación mínima).
    const probe = await base44.asServiceRole.entities.Producto.list('-updated_date', 1);
    const dbLatency = Math.round(performance.now() - start);

    return Response.json({
      status: 'ok',
      service: 'peyu-app',
      version: '1.0.0',
      site: 'https://peyuchile.cl',
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startTs,
      db: {
        ok: Array.isArray(probe),
        latency_ms: dbLatency,
      },
    }, {
      headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return Response.json({
      status: 'degraded',
      service: 'peyu-app',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  }
});