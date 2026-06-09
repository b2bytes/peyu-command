/**
 * indexNowBlastNewPages — IndexNow ping a Google + Bing para nuevas URLs
 * Notifica inmediatamente sobre ProductoNuevo, CatalogoNuevo, TiendaNueva, etc.
 * Corre post-deploy o manualmente
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const baseUrl = 'https://peyuchile.cl';
    const key = Deno.env.get('INDEXNOW_KEY') || 'peyu-indexnow-2026';

    // URLs nuevas a indexar
    const urlsToIndex = [
      `${baseUrl}/`,
      `${baseUrl}/CatalogoNuevo`,
      `${baseUrl}/TiendaNueva`,
      `${baseUrl}/ProductoNuevo`,
      `${baseUrl}/CarritoNuevo`,
      `${baseUrl}/CheckoutNuevo`,
      `${baseUrl}/EmpresasNuevo`,
      `${baseUrl}/EmpresaProducto`,
      `${baseUrl}/CotizacionRapida`,
    ];

    // IndexNow body (Google + Bing)
    const indexNowPayload = {
      host: 'peyuchile.cl',
      key: key,
      keyLocation: `${baseUrl}/indexnow-key.txt`,
      urlList: urlsToIndex,
    };

    // Ping Google IndexNow
    const googleRes = await fetch('https://www.google.com/indexing-api/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indexNowPayload),
    });

    const googleOk = googleRes.ok;
    const googleMsg = await googleRes.text().catch(() => 'No message');

    // Ping Bing IndexNow
    const bingRes = await fetch('https://www.bing.com/indexing/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indexNowPayload),
    });

    const bingOk = bingRes.ok;
    const bingMsg = await bingRes.text().catch(() => 'No message');

    return Response.json({
      ok: googleOk && bingOk,
      google: { status: googleRes.status, ok: googleOk, message: googleMsg },
      bing: { status: bingRes.status, ok: bingOk, message: bingMsg },
      urlsSubmitted: urlsToIndex.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});