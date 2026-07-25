// ════════════════════════════════════════════════════════════════════════
// whatsappPipelineSync — Barrido de respaldo del pipeline de WhatsApp.
// La clasificación en vivo la hace el webhook en cada mensaje; esta función
// recorre todas las conversaciones (CRON cada 10 min o botón manual) para
// recuperar las que quedaron atrasadas y detectar pagos confirmados.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { AGENT_NAME } from '../../shared/evolution.ts';
import { clasificarConversacion } from '../../shared/whatsapp-pipeline.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sr = base44.asServiceRole;

    const convs = (await sr.agents.listConversations({ agent_name: AGENT_NAME }).catch(() => [])) || [];
    const existentes = (await sr.entities.WhatsAppConvEtapa.list('-updated_date', 500).catch(() => [])) || [];
    const byConv = {};
    for (const e of existentes) byConv[e.conversation_id] = e;

    let procesadas = 0, skipped = 0;
    const cambios = [];

    for (const c of convs.slice(0, 120)) {
      const prev = byConv[c.id];
      // La conversación no cambió desde la última clasificación → nada que hacer
      if (prev && prev.clasificado_at && c.updated_date && new Date(c.updated_date) <= new Date(prev.clasificado_at)) {
        skipped++;
        continue;
      }
      const { cambio } = await clasificarConversacion(sr, c, prev);
      if (cambio) cambios.push(cambio);
      procesadas++;
    }

    return Response.json({ ok: true, total: convs.length, procesadas, skipped, cambios });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});