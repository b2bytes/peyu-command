// Entity automation: vectoriza propuestas aceptadas/rechazadas en namespace 'proposals'.
// Permite que el chatbot tenga memoria de qué se vendió, a qué precio, con qué condiciones.
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

function parseItems(itemsJson) {
  if (!itemsJson) return [];
  try {
    return typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
  } catch {
    return [];
  }
}

function buildProposalRecord(p) {
  const items = parseItems(p.items_json);
  const itemsTxt = items.map(i =>
    `${i.cantidad || i.qty || 1}u de ${i.nombre || i.producto || i.sku} a $${(i.precio_unitario || i.precio || 0).toLocaleString('es-CL')}`
  ).join(', ');

  return {
    _id: `prop-${p.id}`,
    chunk_text: [
      `Propuesta ${p.numero || p.id} para ${p.empresa}`,
      p.contacto ? `Contacto: ${p.contacto}` : '',
      `Estado: ${p.status}`,
      `Total: $${(p.total || 0).toLocaleString('es-CL')} CLP`,
      p.subtotal ? `Subtotal: $${p.subtotal.toLocaleString('es-CL')}` : '',
      p.descuento_pct ? `Descuento aplicado: ${p.descuento_pct}%` : '',
      p.fee_personalizacion ? `Fee personalización: $${p.fee_personalizacion.toLocaleString('es-CL')}` : '',
      p.lead_time_dias ? `Lead time: ${p.lead_time_dias} días` : '',
      itemsTxt ? `Productos: ${itemsTxt}` : '',
      p.production_notes ? `Notas producción: ${p.production_notes}` : '',
      p.fecha_envio ? `Enviada: ${p.fecha_envio}` : '',
      p.auto_generated ? 'Generada automáticamente por IA' : '',
    ].filter(Boolean).join('. '),
    empresa: p.empresa,
    contacto: p.contacto || '',
    status: p.status,
    total: p.total || 0,
    auto_generated: !!p.auto_generated,
    entity_type: 'proposal',
  };
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const payload = await req.json();
    const { event, data, payload_too_large } = payload;

    let propuesta = data;
    if (payload_too_large && event?.entity_id) {
      const base44 = createClientFromRequest(req);
      propuesta = await base44.asServiceRole.entities.CorporateProposal.get(event.entity_id);
    }
    if (!propuesta?.id) return Response.json({ ok: false, skip: 'no id' });

    // Solo vectorizar propuestas en estados finales o avanzados
    const estadosUtiles = ['Enviada', 'Aceptada', 'Rechazada'];
    if (!estadosUtiles.includes(propuesta.status)) {
      return Response.json({ ok: true, skip: `estado=${propuesta.status}` });
    }

    const host = await getIndexHost(apiKey);

    if (event?.type === 'delete') {
      await fetch(`https://${host}/vectors/delete`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
        body: JSON.stringify({ ids: [`prop-${propuesta.id}`], namespace: 'proposals' }),
      });
      return Response.json({ ok: true, action: 'deleted', id: propuesta.id });
    }

    const record = buildProposalRecord(propuesta);
    const res = await fetch(`https://${host}/records/namespaces/proposals/upsert`, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const err = await res.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    return Response.json({ ok: true, action: 'upserted', id: propuesta.id, status: propuesta.status });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});