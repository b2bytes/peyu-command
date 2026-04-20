// Importa un BATCH (página) de un recurso de WooCommerce al staging.
// Lo llamamos en loop desde el frontend con {resource, page} para mostrar progreso.
// No toca ni Producto, ni Cliente, ni PedidoWeb — solo WooStagingItem.
//
// Recursos soportados:
//  - product        → productos publicados
//  - customer       → usuarios REGISTRADOS en WordPress (WooCommerce /customers)
//  - customer_guest → clientes únicos extraídos desde PEDIDOS (incluye guests, que en WC suelen ser la mayoría)
//  - order          → pedidos (TODO el histórico, sin filtro de fecha)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PER_PAGE = 50;

// Mapea WC category slug/nombre → enum de entidad Producto
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
    email: c.email,
    telefono: c.billing?.phone || '',
    tipo: c.billing?.company ? 'B2B Pyme' : 'B2C Recurrente',
    estado: 'Activo',
    fecha_primera_compra: c.date_created ? c.date_created.slice(0, 10) : undefined,
    total_compras_clp: parseFloat(c.total_spent || '0') || 0,
    num_pedidos: c.orders_count || 0,
    notas: 'Importado desde WooCommerce (usuario registrado)',
  };
}

// Cliente "guest" derivado de un pedido (billing)
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
    cliente_email: o.billing?.email || '',
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { resource, page = 1 } = body || {};
    if (!['product', 'customer', 'customer_guest', 'order'].includes(resource)) {
      return Response.json({ error: 'resource debe ser product, customer, customer_guest u order' }, { status: 400 });
    }

    const url = Deno.env.get('WOOCOMMERCE_URL');
    const key = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const secret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
    const auth = 'Basic ' + btoa(`${key}:${secret}`);
    const base = `${url.replace(/\/$/, '').replace(/\/wp-json.*$/, '')}/wp-json/wc/v3`;

    // Construye la URL según recurso (SIN filtros de fecha — todo el histórico)
    let endpoint;
    if (resource === 'product') {
      endpoint = `products?per_page=${PER_PAGE}&page=${page}&status=publish`;
    } else if (resource === 'customer') {
      endpoint = `customers?per_page=${PER_PAGE}&page=${page}&orderby=registered_date&order=desc`;
    } else if (resource === 'customer_guest' || resource === 'order') {
      // Para guests: recorremos pedidos completos (incluye todos los estados excepto trash)
      endpoint = `orders?per_page=${PER_PAGE}&page=${page}&orderby=date&order=asc&status=any`;
    }

    const res = await fetch(`${base}/${endpoint}`, { headers: { Authorization: auth, 'Accept': 'application/json' } });
    if (!res.ok) {
      const txt = await res.text();
      return Response.json({ error: `WC HTTP ${res.status}: ${txt.slice(0, 300)}` }, { status: 500 });
    }

    const items = await res.json();
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
    const totalItems = parseInt(res.headers.get('X-WP-Total') || '0', 10);

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ imported: 0, totalPages, totalItems, page, hasMore: false });
    }

    // ───────── Modo especial: customer_guest ─────────
    // Recorre pedidos, extrae billing.email únicos, dedupe contra WooStagingItem ya creados.
    if (resource === 'customer_guest') {
      // Agrupar por email
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
          // Guardar el más antiguo como fecha_primera_compra
          if (o.date_created && o.date_created < existing.order.date_created) existing.order = o;
        }
      }

      // Deduplicar contra lo que YA existe en staging (por email)
      const emails = [...byEmail.keys()];
      const existing = emails.length > 0
        ? await base44.asServiceRole.entities.WooStagingItem.filter({
            resource_type: 'customer_guest',
            email: { $in: emails },
          }).catch(() => [])
        : [];
      const existingEmails = new Set(existing.map(e => (e.email || '').toLowerCase()));

      const rows = [];
      for (const [email, { order, orders_count, total_spent }] of byEmail) {
        if (existingEmails.has(email)) continue;
        const mapped = mapGuestFromOrder(order);
        mapped.num_pedidos = orders_count;
        mapped.total_compras_clp = Math.round(total_spent);
        rows.push({
          woo_id: order.customer_id || 0, // 0 = guest
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

      let imported = 0;
      if (rows.length > 0) {
        try {
          await base44.asServiceRole.entities.WooStagingItem.bulkCreate(rows);
          imported = rows.length;
        } catch {
          for (const r of rows) {
            try { await base44.asServiceRole.entities.WooStagingItem.create(r); imported++; } catch {}
          }
        }
      }

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

    const stagingRows = items.map(item => ({
      woo_id: item.id,
      resource_type: resource,
      sku: resource === 'product' ? (item.sku || `WOO-${item.id}`) : undefined,
      nombre: item.name || item.number || `${item.first_name || ''} ${item.last_name || ''}`.trim() || undefined,
      email: resource === 'customer' ? item.email : undefined,
      raw_data: item,
      mapped_preview: mapper(item),
      status: 'pending',
      target_entity: targetMap[resource],
      imported_at: new Date().toISOString(),
    }));

    let imported = 0;
    try {
      await base44.asServiceRole.entities.WooStagingItem.bulkCreate(stagingRows);
      imported = stagingRows.length;
    } catch (e) {
      for (const row of stagingRows) {
        try {
          await base44.asServiceRole.entities.WooStagingItem.create(row);
          imported++;
        } catch {}
      }
    }

    return Response.json({
      imported,
      page,
      totalPages,
      totalItems,
      hasMore: page < totalPages,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});