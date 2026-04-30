import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON Mensual · Día 15 a las 11:00 — Genera FAQs desde consultas reales.
 * Analiza últimos 90 días de consultas (canal web/whatsapp/email/IG),
 * agrupa por intención con IA y genera 8-12 FAQs candidatas con respuesta.
 *
 * Output: email al equipo con borrador listo para copiar a /faq + JSON
 * estructurado para revisión humana antes de publicar.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ahora = new Date();
    const hace90 = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);

    const consultas = await base44.asServiceRole.entities.Consulta.list('-created_date', 300);
    const recientes = consultas.filter(c =>
      new Date(c.created_date) >= hace90 &&
      c.mensaje &&
      c.mensaje.length > 15
    );

    if (recientes.length < 10) {
      return Response.json({
        ok: true,
        skipped: `Solo ${recientes.length} consultas en últimos 90d (mínimo 10)`,
      });
    }

    // Compactar mensajes para IA (truncar largos)
    const muestra = recientes.slice(0, 80).map(c =>
      `[${c.canal || 'web'}/${c.tipo || 'general'}] ${(c.mensaje || '').slice(0, 250)}`
    ).join('\n---\n');

    const ai = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres el responsable de UX/Soporte de PEYU Chile (regalos corporativos sostenibles, plástico 100% reciclado, fabricación local en Quinta Normal, personalización láser UV gratis desde 10u, lead time típico 7-15 días).

Analiza estas ${recientes.length} consultas reales recibidas en los últimos 90 días por web/WhatsApp/email/IG:

${muestra}

Tu tarea: identificar las 8-12 PREGUNTAS FRECUENTES reales (no inventes preguntas que nadie hace).

Para cada FAQ:
1. Agrupa preguntas similares en una sola
2. Reformula la pregunta como la haría un cliente real (1ra persona, español Chile, máx 100 caracteres)
3. Redacta respuesta clara, profesional, útil (máx 280 caracteres) — sin emoji
4. Asigna categoría: "Personalización" | "Pedidos B2B" | "Despacho" | "Sostenibilidad" | "Pagos" | "Productos" | "Garantía"
5. Estima prioridad por frecuencia: "Alta" (>10 consultas similares) | "Media" (5-10) | "Baja" (<5)

Responde JSON con:
- total_consultas_analizadas (number)
- temas_dominantes (array de 3 strings, los temas que más se repiten)
- faqs (array de objects con: pregunta, respuesta, categoria, prioridad, frecuencia_estimada (number))`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_consultas_analizadas: { type: 'number' },
          temas_dominantes: { type: 'array', items: { type: 'string' } },
          faqs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pregunta: { type: 'string' },
                respuesta: { type: 'string' },
                categoria: { type: 'string' },
                prioridad: { type: 'string' },
                frecuencia_estimada: { type: 'number' },
              },
            },
          },
        },
      },
    });

    const faqs = (ai?.faqs || []).sort((a, b) => (b.frecuencia_estimada || 0) - (a.frecuencia_estimada || 0));

    const colorPrioridad = (p) => p === 'Alta' ? '#dc2626' : p === 'Media' ? '#f59e0b' : '#6b7280';

    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#0F8B6C);padding:24px 28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">FAQ Generator · IA</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">📚 ${faqs.length} FAQs candidatas</h1>
    <p style="color:#A7D9C9;font-size:13px;margin:6px 0 0">Generadas desde ${recientes.length} consultas reales · Últimos 90 días</p>
  </div>

  <div style="padding:24px 28px">
    ${ai?.temas_dominantes?.length ? `
    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:0 0 20px">
      <p style="color:#006D5B;font-weight:700;font-size:12px;margin:0 0 8px">🎯 Temas dominantes</p>
      <p style="color:#4B4F54;font-size:13px;margin:0;line-height:1.6">${ai.temas_dominantes.join(' · ')}</p>
    </div>` : ''}

    <p style="color:#4B4F54;font-size:13px;margin:0 0 16px">Estas FAQs están listas para revisar y publicar en <strong>/faq</strong>. Te enviamos el HTML directo abajo:</p>

    ${faqs.map((f, i) => `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
          <span style="color:#9ca3af;font-size:11px;font-weight:700">#${i + 1}</span>
          <div style="display:flex;gap:6px">
            <span style="background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${f.categoria}</span>
            <span style="background:${colorPrioridad(f.prioridad)}1a;color:${colorPrioridad(f.prioridad)};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${f.prioridad} · ${f.frecuencia_estimada || 0}</span>
          </div>
        </div>
        <p style="color:#0F172A;font-weight:700;font-size:13px;margin:0 0 6px;line-height:1.4">${f.pregunta}</p>
        <p style="color:#4B4F54;font-size:12px;margin:0;line-height:1.6">${f.respuesta}</p>
      </div>
    `).join('')}

    <div style="background:#fef9e7;border-radius:8px;padding:12px;margin:20px 0 0">
      <p style="color:#92400e;font-size:11px;margin:0;text-align:center">
        💡 <strong>Acción sugerida:</strong> revisar las de prioridad <strong>Alta</strong> y agregarlas hoy mismo a /faq · ROI directo en autoservicio.
      </p>
    </div>
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU FAQ Generator',
      to: 'ti@peyuchile.cl',
      subject: `📚 ${faqs.length} FAQs candidatas listas · Desde ${recientes.length} consultas reales`,
      body: html,
    });

    return Response.json({
      ok: true,
      consultas_analizadas: recientes.length,
      faqs_generadas: faqs.length,
      temas_dominantes: ai?.temas_dominantes,
      faqs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});