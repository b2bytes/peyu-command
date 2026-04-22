// Entity automation handler: vectoriza un cliente en el namespace 'customers'.
// Triggered on Cliente create/update/delete.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!r.ok) throw new Error('Índice no encontrado');
  const d = await r.json();
  return d.host;
}

function buildCustomerRecord(c) {
  const totalCLP = c.total_compras_clp || 0;
  const nivel = totalCLP > 5000000 ? 'VIP / cliente estratégico' :
                totalCLP > 1000000 ? 'cliente recurrente premium' :
                totalCLP > 100000  ? 'cliente activo' :
                                     'cliente nuevo';

  return {
    _id: `cust-${c.id}`,
    chunk_text: [
      `Cliente ${c.empresa} (${c.tipo || 'B2C'})`,
      c.contacto ? `Contacto principal: ${c.contacto}` : '',
      c.email ? `Email: ${c.email}` : '',
      c.segmento ? `Segmento: ${c.segmento}` : '',
      `Estado: ${c.estado || 'Activo'} · ${nivel}`,
      c.total_compras_clp ? `Total histórico: $${c.total_compras_clp.toLocaleString('es-CL')} CLP` : '',
      c.num_pedidos ? `Pedidos totales: ${c.num_pedidos}` : '',
      c.ticket_promedio ? `Ticket promedio: $${c.ticket_promedio.toLocaleString('es-CL')} CLP` : '',
      c.sku_favorito ? `Producto favorito: ${c.sku_favorito}` : '',
      c.canal_preferido ? `Canal preferido: ${c.canal_preferido}` : '',
      c.personalizacion_habitual ? 'Suele usar personalización láser' : '',
      c.fecha_ultima_compra ? `Última compra: ${c.fecha_ultima_compra}` : '',
      c.nps_score ? `NPS: ${c.nps_score}/10` : '',
      c.notas ? `Notas internas: ${c.notas}` : '',
    ].filter(Boolean).join('. '),
    empresa: c.empresa,
    email: c.email || '',
    tipo: c.tipo || 'B2C',
    estado: c.estado || 'Activo',
    total_compras_clp: totalCLP,
    num_pedidos: c.num_pedidos || 0,
    sku_favorito: c.sku_favorito || '',
    entity_type: 'cliente',
  };
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const payload = await req.json();
    const { event, data, payload_too_large } = payload;

    let cliente = data;
    if (payload_too_large && event?.entity_id) {
      const base44 = createClientFromRequest(req);
      cliente = await base44.asServiceRole.entities.Cliente.get(event.entity_id);
    }
    if (!cliente?.id) return Response.json({ ok: false, skip: 'no id' });

    const host = await getIndexHost(apiKey);

    if (event?.type === 'delete' || cliente.estado === 'Bloqueado') {
      await fetch(`https://${host}/vectors/delete`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
        body: JSON.stringify({ ids: [`cust-${cliente.id}`], namespace: 'customers' }),
      });
      return Response.json({ ok: true, action: 'deleted', id: cliente.id });
    }

    const record = buildCustomerRecord(cliente);
    const res = await fetch(`https://${host}/records/namespaces/customers/upsert`, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const err = await res.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    return Response.json({ ok: true, action: 'upserted', id: cliente.id });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});