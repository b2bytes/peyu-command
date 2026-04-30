import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SYNC PROFESIONAL · Importa el catálogo COMPLETO de peyuchile.cl
 * usando la WooCommerce REST API v3 oficial.
 *
 * - Pagina hasta agotar productos (per_page=100, hasta 5 páginas → 500 max)
 * - Solo trae productos publicados (status=publish)
 * - Upsert por SKU `WOO-{wc_id}` (idempotente — re-ejecutable sin duplicar)
 * - Mapea precios reales (incluye precio en oferta), imagen oficial, stock,
 *   descripción HTML → texto plano, categoría inferida desde tags Woo.
 *
 * Body opcional: { dryRun: true }  → simula sin escribir
 *                { fullSync: true } → desactiva productos no presentes en Woo
 *
 * Solo admin o cron interno puede ejecutar.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch { /* sin body, ok */ }
    const dryRun = body.dryRun === true;
    const fullSync = body.fullSync === true;

    const baseUrl = (Deno.env.get('WOOCOMMERCE_URL') || '').replace(/\/$/, '');
    const ck = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const cs = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    if (!baseUrl || !ck || !cs) {
      return Response.json({ error: 'WooCommerce credentials missing in secrets' }, { status: 500 });
    }

    // ── 1) Paginar Woo REST ──────────────────────────────────────────
    const allWooProducts = [];
    const perPage = 100;
    for (let page = 1; page <= 5; page++) {
      // Usar Basic Auth (más robusto que query params, evita firewalls que filtran credenciales en URL)
      const basicAuth = btoa(`${ck}:${cs}`);
      const url = `${baseUrl}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
          'User-Agent': 'PEYU-Sync/1.0',
        },
      });
      const text = await r.text();
      if (!r.ok) {
        return Response.json({
          error: 'Woo API error',
          page,
          http: r.status,
          url: url.replace(baseUrl, '[BASE]'),
          content_type: r.headers.get('content-type'),
          details: text.slice(0, 500),
        }, { status: 502 });
      }
      let arr;
      try {
        arr = JSON.parse(text);
      } catch {
        return Response.json({
          error: 'Woo respondió HTML en lugar de JSON',
          page,
          http: r.status,
          content_type: r.headers.get('content-type'),
          preview: text.slice(0, 500),
        }, { status: 502 });
      }
      if (!Array.isArray(arr) || arr.length === 0) break;
      allWooProducts.push(...arr);
      if (arr.length < perPage) break;
    }

    if (allWooProducts.length === 0) {
      return Response.json({ ok: true, message: 'Sin productos en Woo', total: 0 });
    }

    // ── 2) Helpers de mapeo ──────────────────────────────────────────
    const stripHtml = (html) => (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8211;/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 800);

    const inferCategoria = (wp) => {
      const cats = (wp.categories || []).map(c => (c.name || '').toLowerCase());
      const name = (wp.name || '').toLowerCase();
      if (cats.some(c => c.includes('carcasa')) || name.includes('carcasa') || name.includes('airpods')) return 'Carcasas B2C';
      if (cats.some(c => c.includes('escritorio')) || name.includes('escritorio') || name.includes('lapicero') || name.includes('porta')) return 'Escritorio';
      if (cats.some(c => c.includes('hogar')) || name.includes('posavaso') || name.includes('llavero') || name.includes('imán')) return 'Hogar';
      if (cats.some(c => c.includes('entretenimiento')) || name.includes('cacho') || name.includes('dado')) return 'Entretenimiento';
      if (cats.some(c => c.includes('corporativo')) || name.includes('kit') || name.includes('pack')) return 'Corporativo';
      return 'Corporativo';
    };

    const inferMaterial = (wp) => {
      const txt = ((wp.description || '') + ' ' + (wp.short_description || '')).toLowerCase();
      if (txt.includes('fibra de trigo') || txt.includes('compostab') || txt.includes('biodegradab')) {
        return 'Fibra de Trigo (Compostable)';
      }
      return 'Plástico 100% Reciclado';
    };

    const inferCanal = (cat) => {
      if (cat === 'Carcasas B2C') return 'B2C Exclusivo';
      return 'B2B + B2C';
    };

    const pickPrecio = (wp) => {
      // Woo expone: regular_price, sale_price, price (= efectivo).
      const sale = parseFloat(wp.sale_price || '0');
      const regular = parseFloat(wp.regular_price || '0');
      const price = parseFloat(wp.price || '0');
      // Preferimos el precio de venta efectivo (price), fallback a regular
      return Math.round(price || regular || sale || 0);
    };

    const pickImagen = (wp) => {
      const imgs = wp.images || [];
      const first = imgs[0];
      if (!first?.src) return '';
      // Limpiar query params de WP (?fit, ?ssl) para que sean consistentes
      return first.src;
    };

    // ── 3) Cargar productos existentes para upsert ───────────────────
    const existentes = await base44.asServiceRole.entities.Producto.list('-updated_date', 500);
    const bySku = new Map(existentes.filter(p => p.sku).map(p => [p.sku, p]));

    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    let saltados = 0; // sin cambios reales
    const detalleErrores = [];
    const skusVistos = new Set();

    // Throttle helper para evitar rate limits del SDK (≈100 req/s seguro)
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const wp of allWooProducts) {
      try {
        const sku = wp.sku?.trim() || `WOO-${wp.id}`;
        skusVistos.add(sku);

        const categoria = inferCategoria(wp);
        const precio = pickPrecio(wp);
        if (precio <= 0) continue; // saltar productos sin precio

        const data = {
          sku,
          nombre: wp.name?.trim() || `Producto ${wp.id}`,
          descripcion: stripHtml(wp.description || wp.short_description),
          categoria,
          material: inferMaterial(wp),
          canal: inferCanal(categoria),
          precio_b2c: precio,
          imagen_url: pickImagen(wp),
          stock_actual: wp.stock_status === 'instock' ? (wp.stock_quantity ?? 99) : 0,
          activo: wp.status === 'publish',
          moq_personalizacion: 10,
          personalizacion_gratis_desde: 10,
          inyecciones_requeridas: 1,
        };

        const existente = bySku.get(sku);
        if (dryRun) continue;

        if (existente) {
          // Skip si no cambió nada relevante (evita writes innecesarios + rate limit)
          const sinCambios = (
            existente.nombre === data.nombre &&
            existente.precio_b2c === data.precio_b2c &&
            existente.stock_actual === data.stock_actual &&
            existente.activo === data.activo &&
            (existente.imagen_url || '') === (data.imagen_url || existente.imagen_url || '') &&
            (existente.descripcion || '') === (data.descripcion || '')
          );
          if (sinCambios) {
            saltados++;
          } else {
            await base44.asServiceRole.entities.Producto.update(existente.id, {
              nombre: data.nombre,
              descripcion: data.descripcion,
              precio_b2c: data.precio_b2c,
              imagen_url: data.imagen_url || existente.imagen_url,
              stock_actual: data.stock_actual,
              activo: data.activo,
            });
            actualizados++;
            await sleep(80); // throttle ≈12 ops/s
          }
        } else {
          await base44.asServiceRole.entities.Producto.create(data);
          creados++;
          await sleep(80);
        }
      } catch (err) {
        errores++;
        detalleErrores.push({ wc_id: wp.id, name: wp.name, error: err.message });
      }
    }

    // ── 4) fullSync → desactivar TODO producto que no esté en peyuchile.cl ─
    // Excepción: Gift Cards (SKU GC-PEYU*) y productos manuales explícitamente
    // marcados con `canal === 'B2B Exclusivo'` (que no están en la web pública).
    let desactivados = 0;
    const desactivadosDetalle = [];
    if (fullSync && !dryRun) {
      for (const p of existentes) {
        const skuUpper = String(p.sku || '').toUpperCase();
        // Preservar Gift Cards y productos B2B exclusivos
        if (skuUpper.startsWith('GC-PEYU')) continue;
        if (p.canal === 'B2B Exclusivo') continue;
        // Si el SKU del producto no aparece en la respuesta de Woo → no está en la web
        if (!skusVistos.has(p.sku) && p.activo !== false) {
          await base44.asServiceRole.entities.Producto.update(p.id, { activo: false });
          desactivados++;
          desactivadosDetalle.push({ sku: p.sku, nombre: p.nombre });
          await sleep(80);
        }
      }
    }

    return Response.json({
      ok: true,
      dryRun,
      fullSync,
      total_woo: allWooProducts.length,
      creados,
      actualizados,
      saltados,
      desactivados,
      desactivados_detalle: desactivadosDetalle.slice(0, 20),
      errores,
      detalle_errores: detalleErrores.slice(0, 5),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 300) }, { status: 500 });
  }
});