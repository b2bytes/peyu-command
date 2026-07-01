// ════════════════════════════════════════════════════════════════════════
// whatsappPipelineSync — Clasificador automático del pipeline de WhatsApp.
// ────────────────────────────────────────────────────────────────────────
// Recorre las conversaciones del agente whatsapp_peyu y deduce la etapa
// REAL de cada una a partir de los mensajes y las herramientas que el
// agente usó (buscar productos, cotizar, link de pago, estado pedido,
// escalar consulta). Upsert en WhatsAppConvEtapa con historial de cambios.
// Corre cada 10 min vía automation + puede invocarse manual desde la bandeja.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sr = base44.asServiceRole;

    const convs = (await sr.agents.listConversations({ agent_name: 'whatsapp_peyu' }).catch(() => [])) || [];
    const existentes = await sr.entities.WhatsAppConvEtapa.list('-updated_date', 500).catch(() => []);
    const byConv = {};
    for (const e of existentes) byConv[e.conversation_id] = e;

    const parseResult = (r) => {
      if (!r) return null;
      if (typeof r === 'object') return r;
      try { return JSON.parse(r); } catch { return null; }
    };

    let created = 0, updated = 0, skipped = 0;
    const cambios = [];

    for (const c of convs.slice(0, 120)) {
      const prev = byConv[c.id];
      // Skip si la conversación no cambió desde la última clasificación
      if (prev && prev.clasificado_at && c.updated_date && new Date(c.updated_date) <= new Date(prev.clasificado_at)) {
        skipped++;
        continue;
      }

      const full = await sr.agents.getConversation(c.id).catch(() => null);
      const msgs = (full && full.messages) || c.messages || [];

      // ── Recolectar herramientas usadas y sus resultados ──
      const toolCalls = [];
      for (const m of msgs) {
        for (const tc of (m.tool_calls || [])) toolCalls.push(tc);
      }
      const names = toolCalls.map((t) => String(t.name || ''));
      const has = (s) => names.some((n) => n.toLowerCase().includes(s.toLowerCase()));
      const lastName = names.length ? names[names.length - 1] : '';

      const userMsgs = msgs.filter((m) => m.role === 'user');
      const userTexts = userMsgs.map((m) => m.content || '').join(' \n ');
      const hasEmail = /\S+@\S+\.\S+/.test(userTexts);

      // Extraer datos de resultados (cotización, pedido, monto)
      let numeroPedido = '', numeroCot = '', monto = 0;
      for (const tc of toolCalls) {
        const r = parseResult(tc.results);
        if (!r) continue;
        if (r.numero && String(r.numero).startsWith('COT')) numeroCot = r.numero;
        if (r.numero_pedido) numeroPedido = r.numero_pedido;
        if (Number(r.total) > 0) monto = Number(r.total);
      }

      // ── Clasificación por prioridad (último estado gana) ──
      let etapa = 'nuevo';
      let tipo = prev?.tipo && prev.tipo !== 'Sin clasificar' ? prev.tipo : 'Sin clasificar';
      if (userMsgs.length >= 2 || has('BuscarProductos') || has('Recomendar')) etapa = 'explorando';
      if (hasEmail || has('BuscarCliente') && userMsgs.length >= 3) etapa = hasEmail ? 'datos' : etapa;
      if (has('CheckoutLink') || has('CartCheckout')) { etapa = 'pago'; tipo = 'B2C'; }
      if (has('generateChatQuotePDF')) { etapa = 'cotizado'; tipo = 'B2B'; }
      if (lastName.toLowerCase().includes('estadopedido')) etapa = 'postventa';
      if (names.some((n) => /consulta/i.test(n))) etapa = 'escalado';

      // Convertido: si hay pedido generado y ya está pagado
      if (numeroPedido && etapa !== 'escalado') {
        const pedidos = await sr.entities.PedidoWeb.filter({ numero_pedido: numeroPedido }).catch(() => []);
        if (pedidos.length && pedidos[0].payment_status === 'paid') etapa = 'convertido';
      }

      const nowIso = new Date().toISOString();
      const lastUser = userMsgs[userMsgs.length - 1];
      const data = {
        conversation_id: c.id,
        etapa,
        tipo,
        cliente_nombre: c.metadata?.name || prev?.cliente_nombre || `Cliente ${String(c.id).slice(-5)}`,
        resumen: (lastUser?.content || '').slice(0, 140),
        mensajes_count: msgs.length,
        numero_pedido: numeroPedido || prev?.numero_pedido || '',
        numero_cotizacion: numeroCot || prev?.numero_cotizacion || '',
        monto_clp: monto || prev?.monto_clp || 0,
        ultimo_mensaje_at: c.updated_date || nowIso,
        clasificado_at: nowIso,
      };

      if (prev) {
        const hist = Array.isArray(prev.historial_etapas) ? prev.historial_etapas : [];
        if (prev.etapa !== etapa) {
          data.historial_etapas = [...hist, { etapa, at: nowIso }];
          cambios.push({ conversation_id: c.id, de: prev.etapa, a: etapa });
        }
        await sr.entities.WhatsAppConvEtapa.update(prev.id, data);
        updated++;
      } else {
        data.historial_etapas = [{ etapa, at: nowIso }];
        await sr.entities.WhatsAppConvEtapa.create(data);
        created++;
      }
    }

    return Response.json({ ok: true, total: convs.length, created, updated, skipped, cambios });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});