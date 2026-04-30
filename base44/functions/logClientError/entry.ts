// ============================================================================
// PEYU · logClientError — recibe reportes de errores del frontend
// ----------------------------------------------------------------------------
// Endpoint público (CORS abierto). El frontend lo invoca cuando:
// - ErrorBoundary captura un crash de React
// - window.onerror dispara
// - unhandledrejection (promise sin .catch)
// Guarda en entidad ErrorLog para análisis posterior.
// Rate-limit implícito: el frontend solo reporta errores únicos por sesión.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const body = await req.json();
    const {
      source = 'frontend_boundary',
      severity = 'medium',
      message = 'Unknown error',
      stack = '',
      url = '',
      user_agent = '',
      viewport = '',
      user_email = '',
      session_id = '',
      extra = {},
    } = body || {};

    const base44 = createClientFromRequest(req);

    await base44.asServiceRole.entities.ErrorLog.create({
      source,
      severity,
      message: String(message).slice(0, 500),
      stack: String(stack).slice(0, 4000),
      url: String(url).slice(0, 500),
      user_agent: String(user_agent).slice(0, 300),
      viewport: String(viewport).slice(0, 50),
      user_email: String(user_email).slice(0, 200),
      session_id: String(session_id).slice(0, 100),
      extra,
      resolved: false,
    });

    return Response.json({ ok: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
});