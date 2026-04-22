// Entity automation handler: re-vectoriza un producto cuando se crea o actualiza.
// Se invoca automáticamente al cambiar la entidad Producto.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2024-10' }
  });
  if (!r.ok) throw new Error('Índice no encontrado');
  const d = await r.json();
  return d.host;
}

function buildProductRecord(p) {
  return {
    _id: `prod-${p.sku}`,
    chunk_text: [
      p.nombre,
      p.descripcion || '',
      `Categoría: ${p.categoria}`,
      `Material: ${p.material}`,
      `Canal de venta: ${p.canal}`,
      p.precio_b2c ? `Precio individual (B2C): $${p.precio_b2c} CLP` : '',
      p.precio_base_b2b ? `Precio B2B desde 10u: $${p.precio_base_b2b} CLP` : '',
      p.precio_500_mas ? `Precio volumen 500+u: $${p.precio_500_mas} CLP` : '',
      p.moq_personalizacion ? `Personalización láser gratis desde ${p.moq_personalizacion}u` : '',
    ].filter(Boolean).join('. '),
    sku: p.sku,
    nombre: p.nombre,
    categoria: p.categoria,
    material: p.material,
    canal: p.canal,
    precio_b2c: p.precio_b2c || 0,
    precio_base_b2b: p.precio_base_b2b || 0,
    tipo: 'producto',
  };
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const payload = await req.json();
    const { event, data, payload_too_large } = payload;

    // Si es muy grande, re-fetch
    let producto = data;
    if (payload_too_large && event?.entity_id) {
      const base44 = createClientFromRequest(req);
      producto = await base44.asServiceRole.entities.Producto.get(event.entity_id);
    }
    if (!producto?.sku) return Response.json({ ok: false, skip: 'no sku' });

    const host = await getIndexHost(apiKey);

    // Delete si el producto fue desactivado
    if (producto.activo === false || event?.type === 'delete') {
      await fetch(`https://${host}/vectors/delete`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2024-10' },
        body: JSON.stringify({ ids: [`prod-${producto.sku}`], namespace: 'products' }),
      });
      return Response.json({ ok: true, action: 'deleted', sku: producto.sku });
    }

    // Upsert
    const record = buildProductRecord(producto);
    const res = await fetch(`https://${host}/records/namespaces/products/upsert`, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2024-10' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const err = await res.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    return Response.json({ ok: true, action: 'upserted', sku: producto.sku });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});