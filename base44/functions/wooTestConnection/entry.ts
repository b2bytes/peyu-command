// Prueba la conexión con WooCommerce y devuelve conteos reales de productos,
// clientes y pedidos. Solo admin. No escribe nada.
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
      return Response.json({
        ok: false,
        error: 'Faltan credenciales. Configura WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY y WOOCOMMERCE_CONSUMER_SECRET en Secrets.'
      }, { status: 400 });
    }

    const auth = 'Basic ' + btoa(`${key}:${secret}`);
    const base = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;

    // HEAD requests: piden 1 item por página y leen el header X-WP-Total que trae el conteo total.
    async function countOf(path) {
      const res = await fetch(`${base}/${path}?per_page=1`, { headers: { Authorization: auth } });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${path} → HTTP ${res.status}: ${body.slice(0, 150)}`);
      }
      return parseInt(res.headers.get('X-WP-Total') || '0', 10);
    }

    // Pedidos: solo últimos 12 meses
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    const sinceIso = since.toISOString();

    const [products, customers, ordersRes] = await Promise.all([
      countOf('products?status=publish'),
      countOf('customers'),
      fetch(`${base}/orders?per_page=1&after=${encodeURIComponent(sinceIso)}`, { headers: { Authorization: auth } })
    ]);

    if (!ordersRes.ok) {
      const body = await ordersRes.text();
      return Response.json({ ok: false, error: `orders → HTTP ${ordersRes.status}: ${body.slice(0, 200)}` }, { status: 500 });
    }
    const ordersCount = parseInt(ordersRes.headers.get('X-WP-Total') || '0', 10);

    // Info extra del sitio
    const siteRes = await fetch(`${base}/system_status`, { headers: { Authorization: auth } });
    let siteInfo = null;
    if (siteRes.ok) {
      const data = await siteRes.json();
      siteInfo = {
        wc_version: data?.environment?.version,
        wp_version: data?.environment?.wp_version,
        site_url: data?.environment?.site_url,
        currency: data?.settings?.currency,
      };
    }

    return Response.json({
      ok: true,
      counts: { products, customers, orders_last_12m: ordersCount },
      site: siteInfo,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});