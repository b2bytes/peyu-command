import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON Semanal · Lunes 09:00 — Oportunidades SEO desde Search Console.
 * Cruza queries de últimos 28d (impresiones / posición / CTR) y usa IA
 * para identificar:
 *   - Quick wins (queries en posición 8-20 con buen volumen → optimizar)
 *   - Cannibalización (múltiples URLs compitiendo por misma query)
 *   - Queries sin click pero con muchas impresiones → mejorar title/meta
 *   - Temas emergentes para crear blog post
 *
 * Genera reporte ejecutivo + crea Tareas para los top 3 quick wins.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    if (!accessToken) {
      return Response.json({ error: 'GSC no autorizado' }, { status: 401 });
    }

    const siteUrl = 'https://peyuchile.cl/';
    const today = new Date().toISOString().split('T')[0];
    const start28 = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Top queries últimos 28d
    const resp = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start28,
          endDate: today,
          dimensions: ['query'],
          rowLimit: 100,
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      return Response.json({ error: 'GSC API error', details: errText.slice(0, 200) }, { status: 500 });
    }

    const dataGSC = await resp.json();
    const rows = dataGSC.rows || [];

    if (rows.length === 0) {
      return Response.json({ ok: true, message: 'Sin datos GSC en últimos 28d' });
    }

    // Quick wins: posición 8-20 con >50 impresiones
    const quickWins = rows
      .filter(r => r.position >= 8 && r.position <= 20 && r.impressions >= 50)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 8);

    // Sin click pero con impresiones
    const sinClicks = rows
      .filter(r => r.clicks === 0 && r.impressions >= 30)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);

    // Top performers (para mantener)
    const topPerf = rows
      .filter(r => r.position <= 5 && r.clicks >= 5)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const totalImpresiones = rows.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const ctrPromedio = totalImpresiones > 0 ? (totalClicks / totalImpresiones * 100) : 0;

    // IA para sugerir acciones priorizadas
    const ai = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres el SEO strategist de PEYU Chile (regalos corporativos sostenibles, plástico reciclado, fabricación local en Quinta Normal Santiago).

DATOS GSC últimos 28d para peyuchile.cl:
- Total impresiones: ${totalImpresiones.toLocaleString('es-CL')}
- Total clicks: ${totalClicks.toLocaleString('es-CL')}
- CTR promedio: ${ctrPromedio.toFixed(2)}%

QUICK WINS (queries en posición 8-20):
${quickWins.map(q => `- "${q.keys[0]}": pos ${q.position.toFixed(1)} · ${q.impressions} imp · ${q.clicks} clicks (CTR ${(q.ctr * 100).toFixed(1)}%)`).join('\n')}

QUERIES CON IMPRESIONES PERO 0 CLICKS:
${sinClicks.map(q => `- "${q.keys[0]}": pos ${q.position.toFixed(1)} · ${q.impressions} imp`).join('\n')}

Genera análisis JSON con:
- resumen (string, 1 línea con número clave)
- top_oportunidades (array de exactamente 3 objects con: query, accion_concreta (string máx 120 chars: qué hacer ya), tipo (string: "Optimizar contenido"|"Crear blog"|"Mejorar meta tags"|"Crear landing"))
- alertas (array de strings, problemas detectados)
- temas_blog_sugeridos (array de strings, 2-3 títulos de posts que cubrirían queries no atendidas)`,
      response_json_schema: {
        type: 'object',
        properties: {
          resumen: { type: 'string' },
          top_oportunidades: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                accion_concreta: { type: 'string' },
                tipo: { type: 'string' },
              },
            },
          },
          alertas: { type: 'array', items: { type: 'string' } },
          temas_blog_sugeridos: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Crear tareas para top 3 oportunidades
    const ahora = new Date();
    for (const op of (ai?.top_oportunidades || []).slice(0, 3)) {
      await base44.asServiceRole.entities.Tarea.create({
        titulo: `🔍 SEO · "${op.query}"`,
        descripcion: `${op.accion_concreta}\n\nTipo: ${op.tipo}`,
        tipo: 'Marketing',
        prioridad: 'Media',
        estado: 'Pendiente',
        asignado_a: 'ti@peyuchile.cl',
        fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }).catch(() => {});
    }

    // Email reporte
    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#0891b2);padding:24px 28px">
    <p style="color:#a7f3d0;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">SEO Intelligence · IA</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">🔍 Oportunidades SEO semanales</h1>
    <p style="color:#a7f3d0;font-size:13px;margin:6px 0 0">${ai?.resumen || ''}</p>
  </div>

  <div style="padding:24px 28px">
    <!-- Stats -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:0 0 20px">
      <div style="background:#f0faf7;border-radius:10px;padding:12px;text-align:center">
        <p style="color:#006D5B;font-size:9px;margin:0;text-transform:uppercase;font-weight:700">Impresiones 28d</p>
        <p style="color:#0F8B6C;font-size:16px;font-weight:900;margin:4px 0 0">${totalImpresiones.toLocaleString('es-CL')}</p>
      </div>
      <div style="background:#eff6ff;border-radius:10px;padding:12px;text-align:center">
        <p style="color:#1e40af;font-size:9px;margin:0;text-transform:uppercase;font-weight:700">Clicks 28d</p>
        <p style="color:#1e40af;font-size:16px;font-weight:900;margin:4px 0 0">${totalClicks.toLocaleString('es-CL')}</p>
      </div>
      <div style="background:#fef9e7;border-radius:10px;padding:12px;text-align:center">
        <p style="color:#92400e;font-size:9px;margin:0;text-transform:uppercase;font-weight:700">CTR Avg</p>
        <p style="color:#d97706;font-size:16px;font-weight:900;margin:4px 0 0">${ctrPromedio.toFixed(1)}%</p>
      </div>
    </div>

    <h2 style="color:#0F172A;font-size:14px;font-weight:700;margin:20px 0 10px">🎯 Top oportunidades</h2>
    ${(ai?.top_oportunidades || []).map((op, i) => `
      <div style="background:#fff;border:1px solid #e5e7eb;border-left:4px solid #0F8B6C;border-radius:8px;padding:14px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
          <p style="color:#0F172A;font-weight:700;font-size:13px;margin:0">#${i + 1} · "${op.query}"</p>
          <span style="background:#f0faf7;color:#006D5B;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${op.tipo}</span>
        </div>
        <p style="color:#4B4F54;font-size:12px;margin:0;line-height:1.5">${op.accion_concreta}</p>
      </div>
    `).join('')}

    ${quickWins.length ? `
    <h3 style="color:#0F172A;font-size:13px;font-weight:700;margin:20px 0 8px">⚡ Quick wins (pos 8-20)</h3>
    <table style="width:100%;font-size:11px;border-collapse:collapse">
      <thead><tr style="background:#f9fafb">
        <th style="padding:6px;text-align:left;color:#6b7280">Query</th>
        <th style="padding:6px;text-align:right;color:#6b7280">Pos</th>
        <th style="padding:6px;text-align:right;color:#6b7280">Impr</th>
        <th style="padding:6px;text-align:right;color:#6b7280">Clicks</th>
      </tr></thead>
      <tbody>
        ${quickWins.slice(0, 6).map(q => `
          <tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:8px 6px;color:#0F172A">${q.keys[0]}</td>
            <td style="padding:8px 6px;text-align:right;color:#92400e;font-weight:700">${q.position.toFixed(1)}</td>
            <td style="padding:8px 6px;text-align:right;color:#4B4F54">${q.impressions}</td>
            <td style="padding:8px 6px;text-align:right;color:#4B4F54">${q.clicks}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${ai?.temas_blog_sugeridos?.length ? `
    <div style="background:#f5f3ff;border-radius:10px;padding:14px;margin:20px 0 0">
      <p style="color:#5b21b6;font-weight:700;font-size:12px;margin:0 0 8px">📝 Temas de blog sugeridos</p>
      <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:12px;line-height:1.6">
        ${ai.temas_blog_sugeridos.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>` : ''}

    ${ai?.alertas?.length ? `
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px;border-radius:8px;margin:16px 0 0">
      <p style="color:#991b1b;font-weight:700;font-size:12px;margin:0 0 6px">⚠️ Alertas</p>
      <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:11px;line-height:1.5">
        ${ai.alertas.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>` : ''}

    <p style="color:#9ca3af;font-size:10px;text-align:center;margin:20px 0 0">${(ai?.top_oportunidades || []).length} tarea(s) creada(s) en /admin/plan</p>
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU SEO Intelligence',
      to: 'ti@peyuchile.cl',
      subject: `🔍 SEO Weekly · ${ai?.resumen?.slice(0, 60) || 'Reporte oportunidades'}`,
      body: html,
    });

    return Response.json({
      ok: true,
      total_queries: rows.length,
      quick_wins: quickWins.length,
      sin_clicks: sinClicks.length,
      tareas_creadas: (ai?.top_oportunidades || []).length,
      insights: ai,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});