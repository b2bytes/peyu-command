// ============================================================================
// indexNowPing — Envía URLs a IndexNow (Bing, Yandex, Seznam, DuckDuckGo)
// ----------------------------------------------------------------------------
// IndexNow es un protocolo abierto para notificar cambios de URLs a motores
// de búsqueda. No requiere OAuth — sólo una key pública alojada en el sitio.
// Payload: { host, key, urls: [] }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { host, key, urls } = await req.json();
    if (!host || !key || !Array.isArray(urls) || urls.length === 0) {
      return Response.json({ error: 'host, key and urls[] required' }, { status: 400 });
    }

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: urls,
      }),
    });

    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'indexnow_ping',
      site_url: `https://${host}/`,
      status: res.ok ? 'success' : 'error',
      http_code: res.status,
      pages_submitted: urls.length,
      response_summary: `IndexNow: ${urls.length} URLs → ${res.status} ${res.statusText}`,
    });

    return Response.json({
      success: res.ok,
      http_code: res.status,
      urls_sent: urls.length,
      message: res.ok ? `✓ ${urls.length} URLs enviadas a IndexNow (Bing/Yandex/Seznam)` : 'IndexNow rechazó el envío',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});