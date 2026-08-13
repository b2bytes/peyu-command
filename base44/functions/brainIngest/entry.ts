// ============================================================================
// brainIngest · PUERTA ÚNICA DE ENTRADA AL CEREBRO PEYU.
// ----------------------------------------------------------------------------
// Toda información nueva del negocio (lead B2B, lead del chat, consulta de
// soporte, reseña, cotización, venta en tienda) entra al cerebro por aquí, sin
// importar el canal por el que llegó. Una automatización de entidad por tipo
// apunta a esta misma función: el namespace y el texto los decide
// base44/shared/brain-records.ts, así no hay dos formatos de memoria distintos.
//
// Modos:
//   · Automatización de entidad → { event, data, payload_too_large }
//   · Manual/puntual           → { entity_name, record_id }
//   · Backfill histórico       → { backfill: 'B2BLead' | 'all', limit? }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  ENTITY_NAMESPACE,
  buildBrainRecord,
  getIndexHost,
  upsertRecords,
  deleteRecord,
} from '../../shared/brain-records.ts';

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { event, data, payload_too_large, entity_name, record_id, backfill, limit = 300 } = payload;
    const host = await getIndexHost(apiKey);

    // ── BACKFILL: carga el historial de una entidad (o de todas) ────────────
    if (backfill) {
      const entidades = backfill === 'all' ? Object.keys(ENTITY_NAMESPACE) : [backfill];
      const resumen: Record<string, number> = {};
      for (const ent of entidades) {
        if (!ENTITY_NAMESPACE[ent]) { resumen[ent] = -1; continue; }
        const rows = await base44.asServiceRole.entities[ent]
          .list('-created_date', Math.min(Number(limit) || 300, 500))
          .catch(() => []);
        const porNamespace: Record<string, any[]> = {};
        for (const row of rows || []) {
          const built = buildBrainRecord(ent, row);
          if (!built) continue;
          (porNamespace[built.namespace] ||= []).push(built.record);
        }
        let total = 0;
        for (const [ns, records] of Object.entries(porNamespace)) {
          for (let i = 0; i < records.length; i += 50) {
            await upsertRecords(host, apiKey, ns, records.slice(i, i + 50));
          }
          total += records.length;
        }
        resumen[ent] = total;
      }
      return Response.json({ ok: true, backfill: resumen });
    }

    // ── FLUJO VIVO / MANUAL ─────────────────────────────────────────────────
    const ent = entity_name || event?.entity_name;
    if (!ent || !ENTITY_NAMESPACE[ent]) {
      return Response.json({ ok: true, skip: `entidad no indexable: ${ent || 'desconocida'}` });
    }

    const id = record_id || event?.entity_id;

    // Borrado: saca el recuerdo del cerebro (data ya no existe).
    if (event?.type === 'delete') {
      const built = data ? buildBrainRecord(ent, data) : null;
      const vectorId = built?.record._id || `${ENTITY_NAMESPACE[ent]}-${id}`;
      await deleteRecord(host, apiKey, ENTITY_NAMESPACE[ent], vectorId);
      return Response.json({ ok: true, action: 'deleted', entity: ent, id });
    }

    let row = data;
    if (record_id || (payload_too_large && id)) {
      row = await base44.asServiceRole.entities[ent].get(id);
    }
    const built = buildBrainRecord(ent, row);
    if (!built) return Response.json({ ok: true, skip: 'sin contenido útil para recordar', entity: ent });

    await upsertRecords(host, apiKey, built.namespace, [built.record]);
    return Response.json({ ok: true, action: 'upserted', entity: ent, namespace: built.namespace, id: built.record._id });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});