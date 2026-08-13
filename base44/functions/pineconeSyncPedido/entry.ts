// ============================================================================
// pineconeSyncPedido · Vectoriza cada PedidoWeb en el namespace 'orders' del
// índice peyu-brain. Da memoria de VENTAS a los agentes: qué se vendió, a
// quién, en qué color, con qué grabado, a qué precio y cómo terminó el pedido.
//
// Se usa como entity automation (create/update/delete) sobre PedidoWeb, y
// también admite backfill manual: { pedido_id } o { backfill: true, limit }.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INDEX_NAME = 'peyu-brain';
const NAMESPACE = 'orders';

async function getIndexHost(apiKey: string) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' },
  });
  if (!r.ok) throw new Error('Índice peyu-brain no encontrado');
  return (await r.json()).host;
}

const clp = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

function buildRecord(p: any) {
  const items = Array.isArray(p.items_detalle) ? p.items_detalle : [];
  const itemsTxt = items.length
    ? items.map((i: any) => [
        `${i.cantidad || 1}u ${i.nombre || i.sku}`,
        i.color ? `color ${i.color}` : '',
        i.personalizacion ? `grabado "${i.personalizacion}"` : '',
        i.precio_unitario ? `a ${clp(i.precio_unitario)} c/u` : '',
      ].filter(Boolean).join(' '))
      .join('; ')
    : (p.descripcion_items || '');

  return {
    _id: `order-${p.id}`,
    chunk_text: [
      `Pedido ${p.numero_pedido || p.id} del ${p.fecha || ''} · canal ${p.canal || 'Web Propia'}`,
      `Cliente: ${p.cliente_nombre || 'sin nombre'}`,
      p.cliente_email ? `Email: ${p.cliente_email}` : '',
      p.cliente_telefono ? `Teléfono: ${p.cliente_telefono}` : '',
      p.tipo_cliente ? `Tipo: ${p.tipo_cliente}` : '',
      p.razon_social ? `Empresa: ${p.razon_social}` : '',
      itemsTxt ? `Productos: ${itemsTxt}` : '',
      `Cantidad total: ${p.cantidad || 0} u`,
      `Total: ${clp(p.total)} CLP`,
      p.descuento ? `Descuento: ${clp(p.descuento)}` : '',
      p.fee_personalizacion ? `Fee personalización: ${clp(p.fee_personalizacion)}` : '',
      p.tipo_personalizacion ? `Tipo de grabado: ${p.tipo_personalizacion}` : '',
      p.medio_pago ? `Medio de pago: ${p.medio_pago}` : '',
      `Estado: ${p.estado || ''}${p.payment_status ? ` (pago ${p.payment_status})` : ''}`,
      p.ciudad ? `Destino: ${p.ciudad}` : '',
      p.courier ? `Courier: ${p.courier}` : '',
      p.tracking ? `Tracking: ${p.tracking}` : '',
      p.calificacion_cliente ? `Calificación del cliente: ${p.calificacion_cliente}/5` : '',
    ].filter(Boolean).join('. '),
    numero_pedido: p.numero_pedido || '',
    cliente_email: (p.cliente_email || '').toLowerCase(),
    tipo_cliente: p.tipo_cliente || '',
    estado: p.estado || '',
    payment_status: p.payment_status || '',
    total: Number(p.total) || 0,
    entity_type: 'order',
  };
}

async function upsert(host: string, apiKey: string, records: any[]) {
  const res = await fetch(`https://${host}/records/namespaces/${NAMESPACE}/upsert`, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
    body: records.map((r) => JSON.stringify(r)).join('\n'),
  });
  if (!res.ok) throw new Error(await res.text());
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { event, data, payload_too_large, pedido_id, backfill, limit = 200 } = payload;
    const host = await getIndexHost(apiKey);

    // ── Modo backfill: vectoriza el historial de pedidos de una vez ──────────
    if (backfill) {
      const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', Math.min(Number(limit) || 200, 500));
      const utiles = (pedidos || []).filter((p: any) => p.estado !== 'Cancelado');
      if (!utiles.length) return Response.json({ ok: true, indexados: 0 });
      // Lotes de 50 para no exceder el tamaño del request de Pinecone.
      for (let i = 0; i < utiles.length; i += 50) {
        await upsert(host, apiKey, utiles.slice(i, i + 50).map(buildRecord));
      }
      return Response.json({ ok: true, indexados: utiles.length, revisados: pedidos.length });
    }

    // ── Modo evento / manual ────────────────────────────────────────────────
    let pedido = data;
    if (pedido_id) pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    else if (payload_too_large && event?.entity_id) pedido = await base44.asServiceRole.entities.PedidoWeb.get(event.entity_id);
    if (!pedido?.id) return Response.json({ ok: false, skip: 'sin pedido' });

    // Pedido eliminado o cancelado → fuera de la memoria (no es venta real).
    if (event?.type === 'delete' || pedido.estado === 'Cancelado') {
      await fetch(`https://${host}/vectors/delete`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
        body: JSON.stringify({ ids: [`order-${pedido.id}`], namespace: NAMESPACE }),
      });
      return Response.json({ ok: true, action: 'deleted', id: pedido.id });
    }

    await upsert(host, apiKey, [buildRecord(pedido)]);
    return Response.json({ ok: true, action: 'upserted', numero: pedido.numero_pedido, estado: pedido.estado });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});