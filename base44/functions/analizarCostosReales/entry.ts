/**
 * analizarCostosReales
 * ----------------------------------------------------------------------------
 * AGENTE FINANZAS IA · Analiza ProductoCostoReal del mes y genera:
 *   1. PriceSuggestion para cada producto que esté fuera del margen objetivo
 *   2. Insight ejecutivo (resumen del mes)
 *   3. Detección de costos fantasma anómalos / patrones
 *
 * Usa InvokeLLM con modelo de razonamiento para producir sugerencias
 * con racional explicable (no caja negra).
 *
 * Solo admin.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MARGEN_OBJETIVO_DEFAULT = 55;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo admin' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mes = body.mes || new Date().toISOString().slice(0, 7);
    const margenObjetivo = body.margen_objetivo || MARGEN_OBJETIVO_DEFAULT;

    const sr = base44.asServiceRole;

    const costos = await sr.entities.ProductoCostoReal.filter({ mes });
    const fantasmas = await sr.entities.CostoFantasma.filter({ mes_imputacion: mes });

    if (costos.length === 0) {
      return Response.json({ error: 'No hay ProductoCostoReal calculado para este mes. Ejecuta primero prorratearCostosFantasma.' }, { status: 400 });
    }

    // Resumen para el LLM
    const totalFantasmas = fantasmas.reduce((s, f) => s + (f.monto_clp || 0), 0);
    const fantasmasPorCategoria = fantasmas.reduce((acc, f) => {
      acc[f.categoria] = (acc[f.categoria] || 0) + (f.monto_clp || 0);
      return acc;
    }, {});

    // Productos con margen fuera de objetivo
    const productosFueraObjetivo = costos.filter(c => c.margen_real_pct < margenObjetivo);

    // Resumen compacto para el prompt
    const productosResumen = costos.slice(0, 30).map(c => ({
      sku: c.producto_sku,
      nombre: c.producto_nombre,
      precio_actual: c.precio_venta_actual_clp,
      costo_real: c.costo_real_total_clp,
      margen_pct: c.margen_real_pct,
      unidades_vendidas: c.unidades_vendidas,
      fantasma_unit: c.costo_fantasma_prorrateado_clp,
    }));

    const prompt = `Eres el agente Finanzas IA de PEYU Chile (regalos sostenibles 100% reciclados).

Análisis solicitado: mes ${mes}.
Margen bruto objetivo: ${margenObjetivo}%.
Total costos fantasma del mes: $${totalFantasmas.toLocaleString('es-CL')} CLP en ${fantasmas.length} registros.
Categorías fantasma top: ${JSON.stringify(fantasmasPorCategoria)}.

Productos del mes (sample):
${JSON.stringify(productosResumen, null, 2)}

Tarea: Para cada SKU con margen_pct < ${margenObjetivo}, genera una sugerencia de precio dinámico que:
1. Recupere el margen objetivo (${margenObjetivo}%) considerando el costo real (incluye fantasmas).
2. Sea sensato comercialmente (no subir más de 15% de golpe).
3. Tenga racional claro y factores explicables.

Responde JSON estricto:
{
  "resumen_ejecutivo": "2-3 frases sobre el mes",
  "alertas": ["alerta 1", "alerta 2"],
  "patrones_detectados": ["patrón 1"],
  "sugerencias": [
    {
      "sku": "...",
      "precio_actual": 0,
      "precio_sugerido": 0,
      "delta_pct": 0,
      "razonamiento": "...",
      "urgencia": "Alta|Media|Baja",
      "factores": [
        {"factor": "Costo fantasma alto", "impacto_clp": 0, "tipo": "fantasma_detectado"}
      ]
    }
  ]
}`;

    const aiRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          resumen_ejecutivo: { type: 'string' },
          alertas: { type: 'array', items: { type: 'string' } },
          patrones_detectados: { type: 'array', items: { type: 'string' } },
          sugerencias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                precio_actual: { type: 'number' },
                precio_sugerido: { type: 'number' },
                delta_pct: { type: 'number' },
                razonamiento: { type: 'string' },
                urgencia: { type: 'string' },
                factores: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      factor: { type: 'string' },
                      impacto_clp: { type: 'number' },
                      tipo: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const sugerenciasIA = aiRes?.sugerencias || [];

    // Persistir sugerencias como PriceSuggestion (limpiar pendientes previas del mes)
    const previas = await sr.entities.PriceSuggestion.filter({ mes_base: mes, estado: 'pendiente' });
    for (const old of previas) {
      await sr.entities.PriceSuggestion.delete(old.id);
    }

    const created = [];
    for (const s of sugerenciasIA) {
      const costo = costos.find(c => c.producto_sku === s.sku);
      if (!costo) continue;
      const precioActual = s.precio_actual || costo.precio_venta_actual_clp;
      const precioSugerido = Math.round(s.precio_sugerido / 10) * 10; // redondear a 10s
      const deltaClp = precioSugerido - precioActual;
      const deltaPct = precioActual > 0 ? (deltaClp / precioActual * 100) : 0;
      const margenSugerido = precioSugerido > 0
        ? ((precioSugerido - costo.costo_real_total_clp) / precioSugerido * 100)
        : 0;

      const ps = await sr.entities.PriceSuggestion.create({
        producto_sku: s.sku,
        producto_nombre: costo.producto_nombre,
        producto_id: costo.producto_id,
        mes_base: mes,
        tipo_precio: 'B2C',
        precio_actual_clp: precioActual,
        precio_sugerido_clp: precioSugerido,
        delta_clp: deltaClp,
        delta_pct: Math.round(deltaPct * 10) / 10,
        costo_real_unitario_clp: costo.costo_real_total_clp,
        margen_actual_pct: costo.margen_real_pct,
        margen_sugerido_pct: Math.round(margenSugerido * 10) / 10,
        margen_objetivo_pct: margenObjetivo,
        razonamiento: s.razonamiento || '',
        factores: s.factores || [],
        urgencia: s.urgencia || 'Media',
        estado: 'pendiente',
        generada_por_agente: 'finanzas_ai',
      });
      created.push(ps);
    }

    return Response.json({
      ok: true,
      mes,
      resumen_ejecutivo: aiRes?.resumen_ejecutivo || '',
      alertas: aiRes?.alertas || [],
      patrones_detectados: aiRes?.patrones_detectados || [],
      sugerencias_creadas: created.length,
      productos_fuera_objetivo: productosFueraObjetivo.length,
      total_fantasmas_clp: totalFantasmas,
    });
  } catch (error) {
    console.error('[analizarCostosReales] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});