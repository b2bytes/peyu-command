// Prueba la conexión con WooCommerce y devuelve conteos reales.
// Solo admin. No escribe nada. Diagnóstico detallado de errores.
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
      }, { status: 200 });
    }

    // Sanitizar URL
    const cleanUrl = url.replace(/\/$/, '').replace(/\/wp-json.*$/, '').replace(/\/wc-api.*$/, '');
    const auth = 'Basic ' + btoa(`${key}:${secret}`);
    const base = `${cleanUrl}/wp-json/wc/v3`;

    // Fetch helper con diagnóstico claro
    async function wcGet(path) {
      let res;
      try {
        res = await fetch(`${base}/${path}`, {
          headers: { Authorization: auth, 'Accept': 'application/json' },
          redirect: 'follow',
        });
      } catch (netErr) {
        return { ok: false, error: `Error de red accediendo a ${base}/${path}: ${netErr.message}. Verifica que la URL sea correcta y accesible.` };
      }

      const contentType = res.headers.get('content-type') || '';
      const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);

      // Si devuelve HTML es que hay un problema de WP (firewall, login requerido, URL mala)
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        const snippet = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
        return {
          ok: false,
          error: `WooCommerce devolvió HTML en vez de JSON en /${path} (HTTP ${res.status}). Esto suele pasar cuando: (1) la URL no es correcta, (2) un plugin de seguridad (Wordfence, iThemes) está bloqueando el acceso, (3) la API REST está deshabilitada. Respuesta: "${snippet}"`
        };
      }

      if (!res.ok) {
        let body;
        try { body = await res.json(); } catch { body = { message: await res.text() }; }
        const msg = body?.message || body?.code || `HTTP ${res.status}`;
        if (res.status === 401) {
          return { ok: false, error: `Credenciales rechazadas (401). Verifica que Consumer Key (ck_...) y Consumer Secret (cs_...) sean correctos y tengan al menos permisos de lectura. Mensaje: ${msg}` };
        }
        if (res.status === 404) {
          return { ok: false, error: `Endpoint no encontrado (404) en ${base}/${path}. Verifica que WooCommerce REST API esté habilitada y los permalinks en WP sean "Nombre de entrada" (no "Predeterminado").` };
        }
        return { ok: false, error: `WC /${path} → HTTP ${res.status}: ${msg}` };
      }

      try {
        const data = await res.json();
        return { ok: true, data, total };
      } catch (e) {
        return { ok: false, error: `Respuesta JSON inválida de /${path}: ${e.message}` };
      }
    }

    // 1) Test principal: products (el más confiable)
    const productsRes = await wcGet('products?per_page=1&status=publish');
    if (!productsRes.ok) {
      return Response.json({ ok: false, error: productsRes.error, diagnostic: { base_url: base } }, { status: 200 });
    }

    // 2) Customers
    const customersRes = await wcGet('customers?per_page=1');

    // 3) Orders (últimos 12 meses)
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    const ordersRes = await wcGet(`orders?per_page=1&after=${encodeURIComponent(since.toISOString())}`);

    return Response.json({
      ok: true,
      counts: {
        products: productsRes.total || 0,
        customers: customersRes.ok ? (customersRes.total || 0) : 0,
        orders_last_12m: ordersRes.ok ? (ordersRes.total || 0) : 0,
      },
      warnings: [
        !customersRes.ok ? `Clientes: ${customersRes.error}` : null,
        !ordersRes.ok ? `Pedidos: ${ordersRes.error}` : null,
      ].filter(Boolean),
      site: {
        site_url: cleanUrl,
        api_base: base,
      },
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: `Error inesperado: ${error.message}` }, { status: 500 });
  }
});