// Vectoriza TODOS los clientes existentes en el namespace 'customers'.
// Solo admin. Idempotente — puede correrse varias veces.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!r.ok) throw new Error('Índice no encontrado');
  const d = await r.json();
  if (!d?.status?.ready) throw new Error('Índice no Ready aún');
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
      c.contacto ? `Contacto: ${c.contacto}` : '',
      c.email ? `Email: ${c.email}` : '',
      c.segmento ? `Segmento: ${c.segmento}` : '',
      `Estado: ${c.estado || 'Activo'} · ${nivel}`,
      c.total_compras_clp ? `Total histórico: $${c.total_compras_clp.toLocaleString('es-CL')} CLP` : '',
      c.num_pedidos ? `Pedidos: ${c.num_pedidos}` : '',
      c.sku_favorito ? `Favorito: ${c.sku_favorito}` : '',
      c.personalizacion_habitual ? 'Suele personalizar con láser' : '',
      c.nps_score ? `NPS: ${c.nps_score}/10` : '',
    ].filter(Boolean).join('. '),
    empresa: c.empresa,
    email: c.email || '',
    tipo: c.tipo || 'B2C',
    estado: c.estado || 'Activo',
    total_compras_clp: totalCLP,
    entity_type: 'cliente',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    const host = await getIndexHost(apiKey);

    const clientes = await base44.asServiceRole.entities.Cliente.list('-total_compras_clp', 1000);
    const validos = clientes.filter(c => c.estado !== 'Bloqueado');
    const records = validos.map(buildCustomerRecord);

    if (records.length === 0) return Response.json({ ok: true, upserted: 0, message: 'No hay clientes para vectorizar' });

    // Batches de 96
    const chunks = [];
    for (let i = 0; i < records.length; i += 96) chunks.push(records.slice(i, i + 96));
    let total = 0;
    for (const batch of chunks) {
      const res = await fetch(`https://${host}/records/namespaces/customers/upsert`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
        body: batch.map(r => JSON.stringify(r)).join('\n'),
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: 'Upsert failed', details: err, total_so_far: total }, { status: 500 });
      }
      total += batch.length;
    }

    return Response.json({ ok: true, upserted: total, total_clientes: clientes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});