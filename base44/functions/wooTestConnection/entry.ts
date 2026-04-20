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

    // Fetch helper con diagnóstico claro + reintentos para 202/5xx (cache/cold-start)
    async function wcGet(path, maxRetries = 4) {
      let lastRes = null;
      let lastErr = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Cache-buster + no-cache headers para saltarse LiteSpeed/WP Rocket/Cloudflare
        const sep = path.includes('?') ? '&' : '?';
        const cacheBuster = `${sep}_wc_nocache=${Date.now()}${attempt}`;
        const fullUrl = `${base}/${path}${cacheBuster}`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);

        try {
          const res = await fetch(fullUrl, {
            headers: {
              Authorization: auth,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache',
              'User-Agent': 'Base44-Integration/1.0',
            },
            redirect: 'follow',
            signal: controller.signal,
          });
          clearTimeout(timer);
          lastRes = res;

          const contentType = res.headers.get('content-type') || '';

          // HTTP 202 = cache miss en proceso → esperar y reintentar
          // HTTP 5xx / 429 = error transitorio → reintentar
          if (res.status === 202 || res.status >= 500 || res.status === 429) {
            if (attempt < maxRetries) {
              const delay = 1200 * attempt;
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            const text = await res.text().catch(() => '');
            const snippet = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
            return {
              ok: false,
              error: `WooCommerce devolvió HTTP ${res.status} (${res.status === 202 ? 'cache en proceso — un plugin como LiteSpeed, WP Rocket o Cloudflare está interceptando' : 'error del servidor'}) tras ${maxRetries} intentos. ${snippet ? `Respuesta: "${snippet}"` : 'Respuesta vacía.'} Solución: añade una regla para excluir /wp-json/wc/v3/* del cache, o desactiva temporalmente el plugin de cache.`
            };
          }

          // Si devuelve HTML con status OK → problema de firewall/login/URL
          if (!contentType.includes('application/json')) {
            const text = await res.text();
            const snippet = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
            return {
              ok: false,
              error: `WooCommerce devolvió ${contentType || 'sin content-type'} en vez de JSON en /${path} (HTTP ${res.status}). Causas: (1) URL incorrecta, (2) plugin de seguridad (Wordfence, iThemes) bloqueando, (3) API REST deshabilitada, (4) plugin de cache devolviendo HTML. Respuesta: "${snippet}"`
            };
          }

          const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
          if (!res.ok) { /* manejado abajo */ } else {
            try {
              const data = await res.json();
              return { ok: true, data, total, attempts: attempt };
            } catch (e) {
              return { ok: false, error: `Respuesta JSON inválida de /${path}: ${e.message}` };
            }
          }

          // Fall-through para status no-ok no-retryable (401/404/etc)
          break;
        } catch (netErr) {
          clearTimeout(timer);
          lastErr = netErr;
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1200 * attempt));
            continue;
          }
          return { ok: false, error: `Error de red tras ${maxRetries} intentos en ${base}/${path}: ${netErr.message}` };
        }
      }

      // Si salimos sin respuesta válida, procesa el último status
      const res = lastRes;
      if (!res) {
        return { ok: false, error: `Sin respuesta de WC tras ${maxRetries} intentos: ${lastErr?.message || 'desconocido'}` };
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

      return { ok: false, error: `WC /${path} → estado inesperado HTTP ${res.status}` };
    }

    // 1) Test principal: products (el más confiable)
    const productsRes = await wcGet('products?per_page=1&status=publish');
    if (!productsRes.ok) {
      return Response.json({ ok: false, error: productsRes.error, diagnostic: { base_url: base } }, { status: 200 });
    }

    // 2) Customers
    const customersRes = await wcGet('customers?per_page=1');

    // 3) Orders (TODO el histórico, sin filtro de fecha)
    const ordersRes = await wcGet(`orders?per_page=1`);

    return Response.json({
      ok: true,
      counts: {
        products: productsRes.total || 0,
        customers_registered: customersRes.ok ? (customersRes.total || 0) : 0,
        orders_total: ordersRes.ok ? (ordersRes.total || 0) : 0,
      },
      note: 'Clientes "guest" (que compraron sin registrarse) se extraen desde los pedidos al importar — suelen ser la mayoría.',
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