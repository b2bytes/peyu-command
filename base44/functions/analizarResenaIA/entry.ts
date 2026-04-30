import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger entity al crear una ResenaPedido.
 * Analiza el sentimiento con IA y, si NPS<7 o rating_servicio≤3,
 * notifica al equipo para acción rápida (recuperación de cliente).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const resenaId = body?.event?.entity_id || body?.data?.id;
    if (!resenaId) return Response.json({ error: 'resenaId requerido' }, { status: 400 });

    const lista = await base44.asServiceRole.entities.ResenaPedido.filter({ id: resenaId });
    const resena = lista?.[0];
    if (!resena) return Response.json({ error: 'Reseña no encontrada' }, { status: 404 });

    const promedio = (
      (resena.rating_producto || 0) +
      (resena.rating_servicio || 0) +
      (resena.rating_envio || 0)
    ) / 3;

    const esCritica = (resena.nps != null && resena.nps < 7) ||
                      (resena.rating_servicio || 5) <= 3 ||
                      promedio < 3.5;

    // Analizar sentimiento + sugerir respuesta con IA si hay comentario
    let sentimiento = 'neutral';
    let respuestaSugerida = '';
    if (resena.comentario && resena.comentario.length > 10) {
      try {
        const ai = await base44.integrations.Core.InvokeLLM({
          prompt: `Eres parte del equipo de servicio al cliente de Peyu Chile (regalos corporativos sostenibles, plástico 100% reciclado).
Analiza esta reseña de un cliente:

Cliente: ${resena.cliente_nombre || 'N/A'}
Pedido: ${resena.numero_pedido || 'N/A'}
Rating producto: ${resena.rating_producto}/5
Rating servicio: ${resena.rating_servicio}/5
Rating envío: ${resena.rating_envio || 'N/A'}/5
NPS: ${resena.nps != null ? resena.nps + '/10' : 'N/A'}
Comentario: "${resena.comentario}"

Responde SOLO un JSON:
{
  "sentimiento": "positivo" | "neutral" | "negativo",
  "respuesta_sugerida": "respuesta cálida y profesional de máximo 80 palabras, en español formal de Chile, agradeciendo y abordando los puntos del cliente. Si es negativa, ofrecer solución concreta."
}`,
          response_json_schema: {
            type: 'object',
            properties: {
              sentimiento: { type: 'string' },
              respuesta_sugerida: { type: 'string' },
            },
          },
        });
        sentimiento = ai?.sentimiento || 'neutral';
        respuestaSugerida = ai?.respuesta_sugerida || '';
      } catch (e) {
        console.warn('Análisis IA falló:', e.message);
      }
    }

    // Guardar análisis en la reseña
    if (respuestaSugerida) {
      await base44.asServiceRole.entities.ResenaPedido.update(resenaId, {
        respuesta_equipo: `[Sugerencia IA · ${sentimiento}]\n${respuestaSugerida}`,
      });
    }

    // Notificar al equipo si es crítica
    if (esCritica) {
      await base44.integrations.Core.SendEmail({
        from_name: 'Sistema PEYU · Cliente en Riesgo',
        to: 'ti@peyuchile.cl',
        subject: `⚠️ Reseña crítica · ${resena.cliente_nombre || 'cliente'} · ${resena.numero_pedido || ''}`,
        body: `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#fff5f5">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #ef4444;padding:24px">
  <h2 style="color:#dc2626;margin:0 0 16px">⚠️ Cliente en Riesgo · Acción Requerida</h2>
  <table style="width:100%;font-size:13px;color:#4B4F54;line-height:1.7">
    <tr><td><strong>Cliente:</strong></td><td>${resena.cliente_nombre || 'N/A'}</td></tr>
    <tr><td><strong>Email:</strong></td><td>${resena.cliente_email || 'N/A'}</td></tr>
    <tr><td><strong>Pedido:</strong></td><td>${resena.numero_pedido || 'N/A'}</td></tr>
    <tr><td><strong>Rating producto:</strong></td><td>${resena.rating_producto}/5</td></tr>
    <tr><td><strong>Rating servicio:</strong></td><td>${resena.rating_servicio}/5</td></tr>
    <tr><td><strong>NPS:</strong></td><td>${resena.nps != null ? resena.nps + '/10' : 'N/A'}</td></tr>
    <tr><td><strong>Sentimiento:</strong></td><td>${sentimiento}</td></tr>
  </table>
  ${resena.comentario ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:16px 0;font-size:13px;color:#991b1b">"${resena.comentario}"</div>` : ''}
  ${respuestaSugerida ? `<div style="background:#f0faf7;padding:12px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#006D5B;font-weight:700;margin:0 0 6px">RESPUESTA SUGERIDA POR IA:</p>
    <p style="font-size:13px;color:#4B4F54;margin:0;line-height:1.6">${respuestaSugerida}</p>
  </div>` : ''}
  <p style="font-size:12px;color:#6b7280;margin:16px 0 0">
    Recomendación: contactar al cliente en menos de 24 horas para recuperar la relación.
  </p>
</div></body></html>`,
      });
    }

    return Response.json({
      ok: true,
      resenaId,
      sentimiento,
      esCritica,
      respuestaSugerida,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});