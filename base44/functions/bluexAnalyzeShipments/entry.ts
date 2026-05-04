// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Análisis IA de la operación logística
// ─────────────────────────────────────────────────────────────────────────────
// Agente IA analiza envíos del periodo y devuelve:
//   - Resumen ejecutivo de la operación
//   - Comunas problemáticas (más excepciones / más atrasos)
//   - Sugerencias para mejorar (cambio de servicio, precaución, etc.)
//   - Score logístico
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { dias = 30 } = await req.json().catch(() => ({}));
    const sr = base44.asServiceRole;
    const since = new Date(Date.now() - dias * 86400000).toISOString();

    const envios = await sr.entities.Envio.filter({});
    const recientes = envios.filter(e => (e.fecha_emision || e.created_date) >= since);

    if (recientes.length === 0) {
      return Response.json({ ok: true, mensaje: 'Sin envíos en el periodo', sugerencias: [] });
    }

    // Stats agregadas
    const total = recientes.length;
    const entregados = recientes.filter(e => e.estado === 'Entregado').length;
    const enTransito = recientes.filter(e => ['En Tránsito', 'En Reparto', 'Retirado por Courier'].includes(e.estado)).length;
    const conExcepcion = recientes.filter(e => e.tiene_excepcion).length;
    const atrasados = recientes.filter(e => e.atrasado).length;

    const otifPct = total > 0 ? (entregados / total * 100) : 0;

    // Comunas con problemas
    const comunaStats = {};
    recientes.forEach(e => {
      const c = e.comuna_destino || 'Sin comuna';
      if (!comunaStats[c]) comunaStats[c] = { total: 0, excepciones: 0, atrasados: 0, entregados: 0 };
      comunaStats[c].total++;
      if (e.tiene_excepcion) comunaStats[c].excepciones++;
      if (e.atrasado) comunaStats[c].atrasados++;
      if (e.estado === 'Entregado') comunaStats[c].entregados++;
    });

    const comunasTop = Object.entries(comunaStats)
      .filter(([_, s]) => s.total >= 2)
      .map(([c, s]) => ({ comuna: c, ...s, problema_pct: (s.excepciones + s.atrasados) / s.total * 100 }))
      .sort((a, b) => b.problema_pct - a.problema_pct)
      .slice(0, 10);

    // Tiempo promedio de entrega
    const entregadosConTiempo = recientes.filter(e => e.estado === 'Entregado' && e.dias_en_transito);
    const leadTimeProm = entregadosConTiempo.length > 0
      ? entregadosConTiempo.reduce((s, e) => s + e.dias_en_transito, 0) / entregadosConTiempo.length
      : 0;

    // Pedir análisis IA
    const prompt = `Eres el agente Logística IA de PEYU Chile. Analiza la operación BlueExpress de los últimos ${dias} días.

Datos:
- Total envíos: ${total}
- Entregados: ${entregados} (${otifPct.toFixed(1)}%)
- En tránsito: ${enTransito}
- Con excepción: ${conExcepcion}
- Atrasados: ${atrasados}
- Lead time promedio: ${leadTimeProm.toFixed(1)} días

Comunas con más problemas (top 10):
${JSON.stringify(comunasTop, null, 2)}

Tareas:
1. Resumen ejecutivo (2-3 frases)
2. Identifica patrones (¿hay comunas problemáticas? ¿zonas extremas con muchas excepciones?)
3. 3-5 sugerencias accionables (cambiar servicio, alertar antes, contactar Bluex, etc.)
4. Score 0-100 de la operación logística

Responde JSON estricto.`;

    const aiRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          resumen_ejecutivo: { type: 'string' },
          patrones: { type: 'array', items: { type: 'string' } },
          sugerencias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string' },
                descripcion: { type: 'string' },
                prioridad: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
              },
            },
          },
          score_logistico: { type: 'number' },
          comunas_alerta: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    return Response.json({
      ok: true,
      periodo_dias: dias,
      stats: { total, entregados, en_transito: enTransito, con_excepcion: conExcepcion, atrasados, otif_pct: otifPct, lead_time_prom: leadTimeProm },
      comunas_top_problemas: comunasTop,
      analisis_ia: aiRes,
    });
  } catch (error) {
    console.error('[bluexAnalyzeShipments]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});