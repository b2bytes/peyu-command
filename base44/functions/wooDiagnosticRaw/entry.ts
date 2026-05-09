// Diagnóstico crudo de WooCommerce — SOLO para capturar evidencia técnica
// que SiteGround pidió (timestamp, status code, headers, body snippet, IP egress).
// IGNORA WOO_INTEGRATION_PAUSED a propósito porque es para diagnosticar.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const url = Deno.env.get('WOOCOMMERCE_URL');
    const key = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const secret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    if (!url || !key || !secret) {
      return Response.json({ ok: false, error: 'Faltan credenciales WooCommerce.' });
    }

    const cleanUrl = url.replace(/\/$/, '').replace(/\/wp-json.*$/, '').replace(/\/wc-api.*$/, '');
    const auth = 'Basic ' + btoa(`${key}:${secret}`);

    // Capturar IP de egress (info útil para SiteGround)
    let egressIp = null;
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
      if (ipRes.ok) egressIp = (await ipRes.json()).ip;
    } catch { /* ignore */ }

    // Probar 3 endpoints distintos para diagnosticar dónde falla
    const tests = [
      { name: 'root_wp_json', path: '/wp-json/', auth: false },
      { name: 'wc_namespace', path: '/wp-json/wc/v3', auth: true },
      { name: 'products', path: '/wp-json/wc/v3/products?per_page=1', auth: true },
    ];

    const results = [];
    for (const t of tests) {
      const startedAt = new Date().toISOString();
      const t0 = performance.now();
      try {
        const headers = {
          'Accept': 'application/json',
          'User-Agent': 'Base44-Diagnostic/1.0 (peyu.cl)',
        };
        if (t.auth) headers.Authorization = auth;

        const res = await fetch(`${cleanUrl}${t.path}`, {
          headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
        const elapsed = Math.round(performance.now() - t0);
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        const snippet = text.slice(0, 400);

        results.push({
          test: t.name,
          url: `${cleanUrl}${t.path}`,
          method: 'GET',
          used_auth: t.auth,
          started_at_utc: startedAt,
          elapsed_ms: elapsed,
          status: res.status,
          status_text: res.statusText,
          content_type: contentType,
          server: res.headers.get('server') || null,
          x_powered_by: res.headers.get('x-powered-by') || null,
          cf_ray: res.headers.get('cf-ray') || null,
          cache_control: res.headers.get('cache-control') || null,
          x_litespeed_cache: res.headers.get('x-litespeed-cache') || null,
          body_snippet: snippet,
          looks_like_html: contentType.includes('html') || snippet.trim().startsWith('<'),
        });
      } catch (err) {
        results.push({
          test: t.name,
          url: `${cleanUrl}${t.path}`,
          started_at_utc: startedAt,
          elapsed_ms: Math.round(performance.now() - t0),
          error: err.message,
          error_name: err.name,
        });
      }
    }

    return Response.json({
      ok: true,
      diagnostic_for: 'SiteGround support',
      base44_egress_ip: egressIp,
      base44_egress_note: 'Base44 usa Deno Deploy (Google Cloud Run). IP es dinámica dentro de rangos de Google Cloud. No usar whitelist por IP.',
      site_url: cleanUrl,
      timestamp_utc: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});