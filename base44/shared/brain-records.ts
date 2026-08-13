// ============================================================================
// brain-records · Normalizadores del CEREBRO PEYU (índice Pinecone peyu-brain).
// ----------------------------------------------------------------------------
// Fuente única de verdad de CÓMO se convierte un registro del negocio en un
// vector de memoria: a qué namespace va, con qué id y con qué texto legible.
// Lo usan brainIngest (flujo vivo por automatización) y los backfills, para
// que no existan dos formas distintas de escribir la misma memoria.
//
// Namespaces del cerebro:
//   products · customers · orders · proposals · quotes · leads · support
//   reviews  · knowledge_base · meta_ads_memory
// ============================================================================

export const INDEX_NAME = 'peyu-brain';

export const clp = (n: unknown) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

const join = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join('. ');

export type BrainRecord = { _id: string; chunk_text: string; entity_type: string } & Record<string, unknown>;

/** Mapa entidad → namespace del cerebro. Si no está aquí, no se indexa. */
export const ENTITY_NAMESPACE: Record<string, string> = {
  B2BLead: 'leads',
  ChatLead: 'leads',
  Consulta: 'support',
  ResenaPedido: 'reviews',
  Cotizacion: 'quotes',
  VentaTienda: 'orders',
};

/** Lead B2B: intención de compra corporativa con su score y estado. */
function b2bLead(r: any): BrainRecord {
  return {
    _id: `lead-${r.id}`,
    chunk_text: join([
      `Lead B2B de ${r.empresa || r.nombre || 'empresa sin nombre'}`,
      r.nombre && `Contacto: ${r.nombre}`,
      r.cargo && `Cargo: ${r.cargo}`,
      r.email && `Email: ${r.email}`,
      r.telefono && `Teléfono: ${r.telefono}`,
      r.industria && `Industria: ${r.industria}`,
      r.producto_interes && `Producto de interés: ${r.producto_interes}`,
      r.cantidad_estimada && `Cantidad estimada: ${r.cantidad_estimada} u`,
      r.presupuesto_estimado && `Presupuesto: ${clp(r.presupuesto_estimado)}`,
      r.lead_score != null && `Lead score: ${r.lead_score}`,
      r.temperatura && `Temperatura: ${r.temperatura}`,
      r.estado && `Estado: ${r.estado}`,
      r.origen && `Origen: ${r.origen}`,
      r.mensaje && `Mensaje del cliente: ${r.mensaje}`,
      r.notas && `Notas internas: ${r.notas}`,
    ]),
    empresa: r.empresa || '',
    email: (r.email || '').toLowerCase(),
    estado: r.estado || '',
    lead_score: Number(r.lead_score) || 0,
    entity_type: 'lead_b2b',
  };
}

/** Lead del chat web: qué conversó y qué quería quien aún no compra. */
function chatLead(r: any): BrainRecord {
  return {
    _id: `chatlead-${r.id}`,
    chunk_text: join([
      `Lead del chat web${r.nombre ? ` · ${r.nombre}` : ''}`,
      r.email && `Email: ${r.email}`,
      r.telefono && `Teléfono: ${r.telefono}`,
      r.empresa && `Empresa: ${r.empresa}`,
      r.tipo_cliente && `Tipo: ${r.tipo_cliente}`,
      r.producto_interes && `Producto de interés: ${r.producto_interes}`,
      r.cantidad && `Cantidad: ${r.cantidad} u`,
      r.estado && `Estado: ${r.estado}`,
      r.intencion && `Intención detectada: ${r.intencion}`,
      r.resumen && `Resumen: ${r.resumen}`,
      r.notas && `Notas: ${r.notas}`,
    ]),
    email: (r.email || '').toLowerCase(),
    estado: r.estado || '',
    entity_type: 'lead_chat',
  };
}

/** Consulta de soporte: el problema real del cliente y cómo se resolvió. */
function consulta(r: any): BrainRecord {
  return {
    _id: `support-${r.id}`,
    chunk_text: join([
      `Consulta de soporte${r.asunto ? `: ${r.asunto}` : ''}`,
      r.nombre && `Cliente: ${r.nombre}`,
      r.email && `Email: ${r.email}`,
      r.categoria && `Categoría: ${r.categoria}`,
      r.prioridad && `Prioridad: ${r.prioridad}`,
      r.estado && `Estado: ${r.estado}`,
      r.canal && `Canal: ${r.canal}`,
      r.mensaje && `Consulta: ${r.mensaje}`,
      r.respuesta && `Respuesta dada: ${r.respuesta}`,
      r.resolucion && `Resolución: ${r.resolucion}`,
    ]),
    email: (r.email || '').toLowerCase(),
    categoria: r.categoria || '',
    estado: r.estado || '',
    entity_type: 'support',
  };
}

/** Reseña: la voz del cliente después de recibir su pedido. */
function resena(r: any): BrainRecord {
  return {
    _id: `review-${r.id}`,
    chunk_text: join([
      `Reseña del pedido ${r.numero_pedido || r.pedido_id}`,
      r.cliente_nombre && `Cliente: ${r.cliente_nombre}`,
      Array.isArray(r.skus) && r.skus.length && `Productos: ${r.skus.join(', ')}`,
      r.rating_producto && `Producto: ${r.rating_producto}/5`,
      r.rating_servicio && `Servicio: ${r.rating_servicio}/5`,
      r.rating_envio && `Envío: ${r.rating_envio}/5`,
      r.nps != null && `NPS: ${r.nps}/10`,
      r.recomendaria != null && `¿Recomendaría PEYU?: ${r.recomendaria ? 'sí' : 'no'}`,
      r.comentario && `Comentario: ${r.comentario}`,
      r.respuesta_equipo && `Respuesta del equipo: ${r.respuesta_equipo}`,
    ]),
    numero_pedido: r.numero_pedido || '',
    rating_producto: Number(r.rating_producto) || 0,
    nps: Number(r.nps) || 0,
    entity_type: 'review',
  };
}

/** Cotización: precio y condiciones que ya se ofrecieron a un cliente. */
function cotizacion(r: any): BrainRecord {
  return {
    _id: `quote-${r.id}`,
    chunk_text: join([
      `Cotización ${r.numero || r.id} para ${r.empresa || 'cliente'}`,
      r.contacto && `Contacto: ${r.contacto}`,
      r.email && `Email: ${r.email}`,
      r.sku && `Producto: ${r.sku}`,
      r.cantidad && `Cantidad: ${r.cantidad} u`,
      r.precio_unitario && `Precio unitario: ${clp(r.precio_unitario)}`,
      r.descuento_pct && `Descuento: ${r.descuento_pct}%`,
      r.personalizacion_tipo && `Personalización: ${r.personalizacion_tipo}`,
      r.lead_time_dias && `Lead time: ${r.lead_time_dias} días hábiles`,
      `Total: ${clp(r.total)} CLP`,
      r.estado && `Estado: ${r.estado}`,
      r.responsable && `Vendedor: ${r.responsable}`,
      r.es_express && 'Pedido express (+12%)',
      r.pago_confirmado && 'Anticipo confirmado',
      r.notas && `Notas: ${r.notas}`,
    ]),
    empresa: r.empresa || '',
    email: (r.email || '').toLowerCase(),
    estado: r.estado || '',
    total: Number(r.total) || 0,
    entity_type: 'quote',
  };
}

/** Venta en tienda física: la venta presencial también es memoria de ventas. */
function ventaTienda(r: any): BrainRecord {
  return {
    _id: `store-${r.id}`,
    chunk_text: join([
      `Venta en tienda física${r.tienda ? ` ${r.tienda}` : ''} el ${r.fecha || ''}`,
      r.cliente_nombre && `Cliente: ${r.cliente_nombre}`,
      r.cliente_telefono && `Teléfono: ${r.cliente_telefono}`,
      r.sku && `Producto: ${r.sku}`,
      r.producto && `Producto: ${r.producto}`,
      r.cantidad && `Cantidad: ${r.cantidad} u`,
      `Total: ${clp(r.total)} CLP`,
      r.medio_pago && `Medio de pago: ${r.medio_pago}`,
      r.vendedor && `Vendedor: ${r.vendedor}`,
      r.notas && `Notas: ${r.notas}`,
    ]),
    tienda: r.tienda || '',
    total: Number(r.total) || 0,
    entity_type: 'store_sale',
  };
}

const BUILDERS: Record<string, (r: any) => BrainRecord> = {
  B2BLead: b2bLead,
  ChatLead: chatLead,
  Consulta: consulta,
  ResenaPedido: resena,
  Cotizacion: cotizacion,
  VentaTienda: ventaTienda,
};

/** Devuelve { namespace, record } o null si esa entidad no alimenta el cerebro. */
export function buildBrainRecord(entityName: string, row: any) {
  const namespace = ENTITY_NAMESPACE[entityName];
  const builder = BUILDERS[entityName];
  if (!namespace || !builder || !row?.id) return null;
  const record = builder(row);
  // Sin texto útil no hay memoria que guardar (evita vectores vacíos).
  if (!record.chunk_text || record.chunk_text.length < 20) return null;
  return { namespace, record };
}

export async function getIndexHost(apiKey: string) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' },
  });
  if (!r.ok) throw new Error('Índice peyu-brain no encontrado');
  return (await r.json()).host as string;
}

export async function upsertRecords(host: string, apiKey: string, namespace: string, records: BrainRecord[]) {
  const res = await fetch(`https://${host}/records/namespaces/${namespace}/upsert`, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
    body: records.map((r) => JSON.stringify(r)).join('\n'),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deleteRecord(host: string, apiKey: string, namespace: string, id: string) {
  await fetch(`https://${host}/vectors/delete`, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
    body: JSON.stringify({ ids: [id], namespace }),
  });
}