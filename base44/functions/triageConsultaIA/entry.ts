import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger entity al crear una Consulta nueva.
 * IA clasifica calidad/urgencia, redacta borrador de respuesta y notifica
 * al equipo si es CALIENTE para responder en <2h (SLA PEYU).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const consultaId = body?.event?.entity_id || body?.data?.id;
    if (!consultaId) return Response.json({ error: 'consultaId requerido' }, { status: 400 });

    const lista = await base44.asServiceRole.entities.Consulta.filter({ id: consultaId });
    const consulta = lista?.[0];
    if (!consulta) return Response.json({ error: 'Consulta no encontrada' }, { status: 404 });

    // No reprocesar si ya tiene respuesta sugerida
    if (consulta.notas?.includes('[IA_TRIAGE]')) {
      return Response.json({ ok: true, skipped: 'ya procesada' });
    }

    const ai = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres parte del equipo comercial de PEYU Chile (regalos corporativos sostenibles, plástico 100% reciclado, fabricación local en Quinta Normal, personalización láser UV gratis desde 10 unidades).

Analiza esta consulta entrante y responde en JSON:

Canal: ${consulta.canal || 'N/A'}
Tipo declarado: ${consulta.tipo || 'N/A'}
Nombre/Empresa: ${consulta.nombre || 'N/A'}
Cantidad estimada: ${consulta.cantidad_estimada || 'No especificada'}
Mensaje original: "${consulta.mensaje || ''}"

Necesito:
1. Clasificar calidad real del lead (Caliente / Tibio / Frío / No Comercial)
2. Detectar urgencia (Alta / Normal / Baja) según fecha requerida y tono
3. Redactar borrador de respuesta cálida y profesional en español formal de Chile (máximo 100 palabras), abordando concretamente lo que pregunta. Si pide cotización, indicar próximos pasos. Si es B2B, mencionar mockup gratis y lead time real.
4. Sugerir 1 acción concreta para el equipo`,
      response_json_schema: {
        type: 'object',
        properties: {
          calidad: { type: 'string' },
          urgencia: { type: 'string' },
          respuesta_sugerida: { type: 'string' },
          accion_equipo: { type: 'string' },
        },
      },
    });

    const calidad = ai?.calidad || 'Tibio';
    const urgencia = ai?.urgencia || 'Normal';
    const respuesta = ai?.respuesta_sugerida || '';
    const accion = ai?.accion_equipo || '';

    // Persistir en consulta
    await base44.asServiceRole.entities.Consulta.update(consultaId, {
      calidad,
      respuesta: respuesta ? `[Borrador IA - revisar antes de enviar]\n\n${respuesta}` : consulta.respuesta,
      notas: `${consulta.notas || ''}\n[IA_TRIAGE] calidad=${calidad} · urgencia=${urgencia} · ${new Date().toISOString().split('T')[0]}\nAcción sugerida: ${accion}`.trim(),
    });

    // Notificar SOLO si caliente o urgencia alta
    const esCritica = calidad === 'Caliente' || urgencia === 'Alta';
    if (esCritica) {
      await base44.integrations.Core.SendEmail({
        from_name: 'PEYU Triage · Lead Caliente',
        to: 'ti@peyuchile.cl',
        subject: `🔥 ${calidad} · ${consulta.canal} · ${consulta.nombre || 'Sin nombre'} ${urgencia === 'Alta' ? '· URGENTE' : ''}`,
        body: `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#fff5f5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid ${calidad === 'Caliente' ? '#dc2626' : '#f59e0b'};padding:24px">
  <h2 style="color:${calidad === 'Caliente' ? '#dc2626' : '#92400e'};margin:0 0 12px;font-size:18px">${calidad === 'Caliente' ? '🔥' : '⚡'} Lead ${calidad} · Responder en ${urgencia === 'Alta' ? '<2h' : '<24h'}</h2>
  <table style="width:100%;font-size:13px;color:#4B4F54;line-height:1.7">
    <tr><td><strong>Nombre:</strong></td><td>${consulta.nombre || 'N/A'}</td></tr>
    <tr><td><strong>Canal:</strong></td><td>${consulta.canal || 'N/A'}</td></tr>
    <tr><td><strong>Tipo:</strong></td><td>${consulta.tipo || 'N/A'}</td></tr>
    <tr><td><strong>Teléfono:</strong></td><td>${consulta.telefono || 'N/A'}</td></tr>
    <tr><td><strong>Cantidad:</strong></td><td>${consulta.cantidad_estimada ? consulta.cantidad_estimada + ' u' : 'No especificada'}</td></tr>
  </table>
  <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#6b7280;font-weight:700;margin:0 0 6px;text-transform:uppercase">Mensaje original</p>
    <p style="font-size:13px;color:#0F172A;margin:0;line-height:1.6">${consulta.mensaje || 'Sin mensaje'}</p>
  </div>
  <div style="background:#f0faf7;padding:12px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#006D5B;font-weight:700;margin:0 0 6px;text-transform:uppercase">Respuesta sugerida (IA)</p>
    <p style="font-size:13px;color:#4B4F54;margin:0;line-height:1.6">${respuesta}</p>
  </div>
  <div style="background:#fef9e7;padding:12px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#92400e;font-weight:700;margin:0 0 6px;text-transform:uppercase">Acción recomendada</p>
    <p style="font-size:13px;color:#4B4F54;margin:0">${accion}</p>
  </div>
  <p style="font-size:11px;color:#6b7280;text-align:center;margin:16px 0 0">El borrador ya está guardado en la consulta · Editar antes de enviar</p>
</div></body></html>`,
      });
    }

    return Response.json({
      ok: true,
      consultaId,
      calidad,
      urgencia,
      esCritica,
      respuesta_sugerida: respuesta?.slice(0, 80) + '...',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});