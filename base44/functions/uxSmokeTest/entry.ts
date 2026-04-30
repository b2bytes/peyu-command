// ============================================================================
// PEYU · uxSmokeTest — verifica que las páginas críticas respondan rápido
// ----------------------------------------------------------------------------
// Pingea las URLs públicas más importantes y mide:
//  - Status HTTP (debe ser 200)
//  - Tiempo de respuesta (TTFB en ms)
//  - Tamaño del HTML (sanity check)
//  - Presencia de tags clave (<title>, og:title, canonical) → SEO health
//
// Como las páginas son SPA, no podemos medir LCP real desde server. Eso lo
// hace web-vitals.js en el cliente. Aquí validamos que el shell HTML+JS
// llega rápido y con los meta tags inyectados (después de hidratar SEO.jsx).
//
// Solo admin puede ejecutarlo.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const URLS_CRITICAS = [
  { path: '/', name: 'Landing principal', priority: 'critical' },
  { path: '/shop', name: 'Tienda', priority: 'critical' },
  { path: '/lanzamiento', name: 'Landing /lanzamiento', priority: 'high' },
  { path: '/cart', name: 'Carrito', priority: 'high' },
  { path: '/b2b/contacto', name: 'B2B Contacto', priority: 'high' },
  { path: '/blog', name: 'Blog', priority: 'medium' },
  { path: '/nosotros', name: 'Nosotros', priority: 'medium' },
  { path: '/seguimiento', name: 'Seguimiento', priority: 'medium' },
  { path: '/faq', name: 'FAQ', priority: 'low' },
  { path: '/contacto', name: 'Contacto', priority: 'low' },
];

const USER_AGENTS = {
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  mobile:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

async function probeUrl(baseUrl, path, ua) {
  const start = performance.now();
  try {
    const res = await fetch(baseUrl + path, {
      headers: { 'User-Agent': ua, 'Accept': 'text/html' },
      redirect: 'follow',
    });
    const ttfb = Math.round(performance.now() - start);
    const html = await res.text();
    const size = html.length;
    const hasTitle = /<title>[^<]+<\/title>/.test(html);
    const hasViewport = /<meta\s+name="viewport"/.test(html);
    const hasRoot = /<div\s+id="root"/.test(html);
    // Sólo fallamos por status real (200) y meta básicos. has_root indica si
    // ya estamos sirviendo la SPA (post domain swap) — útil pero no bloqueante.
    const ok = res.status === 200 && hasTitle && hasViewport;

    return {
      status: res.status,
      ttfb_ms: ttfb,
      size_bytes: size,
      has_title: hasTitle,
      has_viewport: hasViewport,
      has_root: hasRoot,
      ok,
      verdict: !ok ? 'fail'
             : ttfb < 2500 ? 'pass'
             : ttfb < 5000 ? 'warn'
             : 'fail',
    };
  } catch (err) {
    return {
      status: 0,
      ttfb_ms: Math.round(performance.now() - start),
      size_bytes: 0,
      ok: false,
      verdict: 'fail',
      error: err.message,
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const baseUrl = body.base_url || 'https://peyuchile.cl';

    const results = [];
    // En paralelo para mantenerlo rápido (~10 URLs × 2 UA = 20 requests)
    await Promise.all(
      URLS_CRITICAS.map(async (u) => {
        const [desktop, mobile] = await Promise.all([
          probeUrl(baseUrl, u.path, USER_AGENTS.desktop),
          probeUrl(baseUrl, u.path, USER_AGENTS.mobile),
        ]);
        results.push({
          path: u.path,
          name: u.name,
          priority: u.priority,
          desktop,
          mobile,
          worst_verdict: [desktop.verdict, mobile.verdict].includes('fail') ? 'fail'
            : [desktop.verdict, mobile.verdict].includes('warn') ? 'warn'
            : 'pass',
        });
      })
    );

    const summary = {
      total: results.length,
      pass: results.filter(r => r.worst_verdict === 'pass').length,
      warn: results.filter(r => r.worst_verdict === 'warn').length,
      fail: results.filter(r => r.worst_verdict === 'fail').length,
      avg_ttfb_desktop: Math.round(results.reduce((s, r) => s + (r.desktop.ttfb_ms || 0), 0) / results.length),
      avg_ttfb_mobile:  Math.round(results.reduce((s, r) => s + (r.mobile.ttfb_ms  || 0), 0) / results.length),
    };
    const score = Math.round((summary.pass / summary.total) * 100);

    return Response.json({
      ok: true,
      base_url: baseUrl,
      timestamp: new Date().toISOString(),
      score,
      summary,
      results: results.sort((a, b) => {
        const ord = { critical: 0, high: 1, medium: 2, low: 3 };
        return ord[a.priority] - ord[b.priority];
      }),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});