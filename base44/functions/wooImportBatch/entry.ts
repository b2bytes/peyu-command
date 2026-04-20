// Importa un BATCH (página) de un recurso de WooCommerce al staging.
// Lo llamamos en loop desde el frontend con {resource, page} para mostrar progreso.
// No toca ni Producto, ni Cliente, ni PedidoWeb — solo WooStagingItem.
//
// Mejoras de robustez:
//  - Timeout de 25s por request a WC (AbortController)
//  - Retry con backoff ante 5xx/timeout (3 intentos)
//  - bulkCreate en chunks pequeños con fallback individual
//  - Dedupe contra staging existente (no duplica si re-importas)
//  - Errores siempre devuelven 200 con {error} para que el frontend no se rompa
//
// Recursos soportados:
//  - product        → productos publicados
//  - customer       → usuarios REGISTRADOS en WordPress
//  - customer_guest → clientes únicos desde pedidos (incluye guests)
//  - order          → pedidos (TODO el histórico, sin filtro de fecha)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PER_PAGE = 50;
const BULK_CHUNK = 25;
const WC_TIMEOUT_MS = 25000;
const MAX_RETRIES = 3;

function mapCategoria(categories = []) {
  const slugs = categories.map(c => (c.slug || '').toLowerCase());
  const names = categories.map(c => (c.name || '').toLowerCase()).join(' ');
  if (slugs.some(s => s.includes('carcasa'))) return 'Carcasas B2C';
  if (slugs.some(s => s.includes('corporativ')) || names.includes('corporativ')) return 'Corporativo';
  if (slugs.some(s => s.includes('escritorio')) || names.includes('escritorio')) return 'Escritorio';
  if (slugs.some(s => s.includes('entretenimiento')) || slugs.some(s => ['cachos','paletas','jenga'].includes(s))) return 'Entretenimiento';
  return 'Hogar';
}

function mapProduct(p) {
  const categoria = mapCategoria(p.categories || []);
  const precio = parseFloat(p.price || p.regular_price || '0') || 0;
  return {
    sku: p.sku || `WOO-${p.id}`,
    nombre: p.name,
    categoria,
    material: 'Plástico 100% Reciclado',
    canal: categoria === 'Carcasas B2C' ? 'B2C Exclusivo' : 'B2B + B2C',
    precio_b2c: precio,
    stock_actual: p.stock_quantity ?? 0,
    activo: p.status === 'publish',
    descripcion: (p.short_description || p.description || '').replace(/<[^>]+>/g, '').slice(0, 2000),
    imagen_url: p.images?.[0]?.src || '',
  };
}

function mapCustomer(c) {
  const empresa = c.billing?.company?.trim() || `${c.first_name} ${c.last_name}`.trim() || c.email;
  return {
    empresa,
    contacto: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
    email: (c.email || '').toLowerCase().trim(),
    telefono: c.billing?.phone || '',
    tipo: c.billing?.company ? 'B2B Pyme' : 'B2C Recurrente',
    estado: 'Activo',
    fecha_primera_compra: c.date_created ? c.date_created.slice(0, 10) : undefined,
    total_compras_clp: parseFloat(c.total_spent || '0') || 0,
    num_pedidos: c.orders_count || 0,
    notas: 'Importado desde WooCommerce (usuario registrado)',
  };
}

function mapGuestFromOrder(o) {
  const b = o.billing || {};
  const empresa = (b.company || '').trim() || `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email || 'Sin nombre';
  return {
    empresa,
    contacto: `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email,
    email: (b.email || '').toLowerCase().trim(),
    telefono: b.phone || '',
    tipo: b.company ? 'B2B Pyme' : 'B2C Recurrente',
    estado: 'Activo',
    fecha_primera_compra: o.date_created ? o.date_created.slice(0, 10) : undefined,
    fecha_ultima_compra: o.date_created ? o.date_created.slice(0, 10) : undefined,
    notas: 'Importado desde WooCommerce (guest — compró sin registrarse)',
  };
}

function mapOrder(o) {
  const statusMap = {
    'pending': 'Nuevo',
    'processing': 'Confirmado',
    'on-hold': 'Nuevo',
    'completed': 'Entregado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'failed': 'Cancelado',
  };
  return {
    numero_pedido: o.number || String(o.id),
    fecha: o.date_created ? o.date_created.slice(0, 10) : undefined,
    canal: 'Web Propia',
    cliente_nombre: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Cliente',
    cliente_email: (o.billing?.email || '').toLowerCase().trim(),
    cliente_telefono: o.billing?.phone || '',
    tipo_cliente: o.billing?.company ? 'B2B Pyme' : 'B2C Individual',
    descripcion_items: (o.line_items || []).map(li => `${li.quantity}× ${li.name}`).join(' · ').slice(0, 500),
    sku: o.line_items?.[0]?.sku || '',
    cantidad: (o.line_items || []).reduce((s, li) => s + (li.quantity || 0), 0),
    subtotal: parseFloat(o.total || '0') - parseFloat(o.shipping_total || '0'),
    costo_envio: parseFloat(o.shipping_total || '0') || 0,
    total: parseFloat(o.total || '0') || 0,
    estado: statusMap[o.status] || 'Nuevo',
    ciudad: o.billing?.city || '',
    direccion_envio: [o.shipping?.address_1, o.shipping?.city].filter(Boolean).join(', '),
  };
}

// Fetch a WC con timeout + reintentos con backoff exponencial
async function fetchWCWithRetry(url, auth) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WC_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { Authorization: auth, 'Accept': 'application/json' },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const txt = await res.text();
        const snippet = txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
        return { ok: false, status: res.status, error: `WC devolvió HTML (HTTP ${res.status}). Probable firewall/plugin bloqueando. Snippet: "${snippet}"`, retryable: false };
      }

      // 5xx y 429 son retryables
      if (res.status >= 500 || res.status === 429) {
        lastErr = `HTTP ${res.status}`;
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 800 * attempt));
          continue;
        }
        const txt = await res.text().catch(() => '');
        return { ok: false, status: res.status, error: `WC HTTP ${res.status} tras ${MAX_RETRIES} intentos: ${txt.slice(0, 200)}`, retryable: true };
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return { ok: false, status: res.status, error: `WC HTTP ${res.status}: ${txt.slice(0, 300)}`, retryable: false };
      }

      const items = await res.json();
      return {
        ok: true,
        items,
        totalPages: parseInt(res.headers.get('X-WP-TotalPages') || '1', 10),
        totalItems: parseInt(res.headers.get('X-WP-Total') || '0', 10),
      };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e.name === 'AbortError' ? `Timeout ${WC_TIMEOUT_MS}ms` : e.message;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 800 * attempt));
        continue;
      }
    }
  }
  return { ok: false, error: `WC falló tras ${MAX_RETRIES} intentos: ${lastErr}`, retryable: true };
}

// Inserta rows en staging con chunks + fallback individual
async function safeBulkInsert(svc, rows) {
  let imported = 0;
  for (let i = 0; i < rows.length; i += BULK_CHUNK) {
    const chunk = rows.slice(i, i + BULK_CHUNK);
    try {
      await svc.entities.WooStagingItem.bulkCreate(chunk);
      imported += chunk.length;
    } catch {
      for (const r of chunk) {
        try { await svc.entities.WooStagingItem.create(r); imported++; } catch {}
      }
    }
  }
  return imported;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { resource, page = 1 } = body || {};
    if (!['product', 'customer', 'customer_guest', 'order'].includes(resource)) {
      return Response.json({ error: 'resource debe ser product, customer, customer_guest u order' }, { status: 200 });
    }

    const url = Deno.env.get('WOOCOMMERCE_URL');
    const key = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const secret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
    if (!url || !key || !secret) {
      return Response.json({ error: 'Faltan credenciales WooCommerce en Secrets' }, { status: 200 });
    }

    const auth = 'Basic ' + btoa(`${key}:${secret}`);
    const base = `${url.replace(/\/$/, '').replace(/\/wp-json.*$/, '')}/wp-json/wc/v3`;
    const svc = base44.asServiceRole;

    let endpoint;
    if (resource === 'product') {
      endpoint = `products?per_page=${PER_PAGE}&page=${page}&status=publish`;
    } else if (resource === 'customer') {
      endpoint = `customers?per_page=${PER_PAGE}&page=${page}&orderby=registered_date&order=desc`;
    } else {
      endpoint = `orders?per_page=${PER_PAGE}&page=${page}&orderby=date&order=asc&status=any`;
    }

    const wc = await fetchWCWithRetry(`${base}/${endpoint}`, auth);
    if (!wc.ok) {
      // Devolver 200 con error para que el frontend decida si seguir
      return Response.json({ error: wc.error, retryable: wc.retryable, page }, { status: 200 });
    }

    const { items, totalPages, totalItems } = wc;

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ imported: 0, totalPages, totalItems, page, hasMore: false });
    }

    // ───────── Modo especial: customer_guest ─────────
    if (resource === 'customer_guest') {
      // Agrupar por email dentro del batch
      const byEmail = new Map();
      for (const o of items) {
        const email = (o.billing?.email || '').toLowerCase().trim();
        if (!email) continue;
        const existing = byEmail.get(email);
        if (!existing) {
          byEmail.set(email, { order: o, orders_count: 1, total_spent: parseFloat(o.total || '0') || 0 });
        } else {
          existing.orders_count += 1;
          existing.total_spent += parseFloat(o.total || '0') || 0;
          if (o.date_created && o.date_created < existing.order.date_created) existing.order = o;
        }
      }

      // Dedupe contra staging existente — en chunks por si hay muchos
      const emails = [...byEmail.keys()];
      const existingEmails = new Set();
      const DEDUPE_CHUNK = 20;
      for (let i = 0; i < emails.length; i += DEDUPE_CHUNK) {
        const slice = emails.slice(i, i + DEDUPE_CHUNK);
        try {
          const found = await svc.entities.WooStagingItem.filter({
            resource_type: 'customer_guest',
            email: { $in: slice },
          });
          for (const e of found) existingEmails.add((e.email || '').toLowerCase());
        } catch {}
      }

      const rows = [];
      for (const [email, { order, orders_count, total_spent }] of byEmail) {
        if (existingEmails.has(email)) continue;
        const mapped = mapGuestFromOrder(order);
        mapped.num_pedidos = orders_count;
        mapped.total_compras_clp = Math.round(total_spent);
        rows.push({
          woo_id: order.customer_id || 0,
          resource_type: 'customer_guest',
          email,
          nombre: mapped.contacto,
          raw_data: { sample_order_id: order.id, orders_count, total_spent },
          mapped_preview: mapped,
          status: 'pending',
          target_entity: 'Cliente',
          imported_at: new Date().toISOString(),
        });
      }

      const imported = rows.length > 0 ? await safeBulkInsert(svc, rows) : 0;

      return Response.json({
        imported,
        page,
        totalPages,
        totalItems,
        hasMore: page < totalPages,
        uniqueEmailsInBatch: byEmail.size,
        skippedDuplicates: byEmail.size - rows.length,
      });
    }

    // ───────── Modo normal: product / customer / order ─────────
    const mapper = resource === 'product' ? mapProduct : resource === 'customer' ? mapCustomer : mapOrder;
    const targetMap = { product: 'Producto', customer: 'Cliente', order: 'PedidoWeb' };

    // Dedupe por woo_id contra staging (evita duplicar al re-importar)
    const wooIds = items.map(i => i.id).filter(Boolean);
    const existingIds = new Set();
    const DEDUPE_CHUNK = 20;
    for (let i = 0; i < wooIds.length; i += DEDUPE_CHUNK) {
      const slice = wooIds.slice(i, i + DEDUPE_CHUNK);
      try {
        const found = await svc.entities.WooStagingItem.filter({
          resource_type: resource,
          woo_id: { $in: slice },
        });
        for (const e of found) existingIds.add(e.woo_id);
      } catch {}
    }

    const stagingRows = items
      .filter(item => !existingIds.has(item.id))
      .map(item => ({
        woo_id: item.id,
        resource_type: resource,
        sku: resource === 'product' ? (item.sku || `WOO-${item.id}`) : undefined,
        nombre: item.name || item.number || `${item.first_name || ''} ${item.last_name || ''}`.trim() || undefined,
        email: resource === 'customer' ? (item.email || '').toLowerCase().trim() : undefined,
        raw_data: item,
        mapped_preview: mapper(item),
        status: 'pending',
        target_entity: targetMap[resource],
        imported_at: new Date().toISOString(),
      }));

    const imported = stagingRows.length > 0 ? await safeBulkInsert(svc, stagingRows) : 0;

    return Response.json({
      imported,
      page,
      totalPages,
      totalItems,
      hasMore: page < totalPages,
      skippedDuplicates: items.length - stagingRows.length,
    });
  } catch (error) {
    // Nunca devolvemos 500 al frontend — siempre JSON con error
    return Response.json({ error: `Error interno: ${error.message}`, retryable: true }, { status: 200 });
  }
});