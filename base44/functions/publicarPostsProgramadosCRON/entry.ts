import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// publicarPostsProgramadosCRON
// Cada 30 min publica automáticamente los ContentPost en estado "Programado"
// cuya fecha/hora de publicación ya pasó (hora Chile). Esto permite que el
// agente de marketing programe 1 post, una semana o un mes completo y la
// publicación ocurra sola vía publishContentPost (Instagram / LinkedIn).
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const sr = base44.asServiceRole;

    // Hora actual en Chile
    const nowCl = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
    const hoy = nowCl.toISOString().slice(0, 10); // YYYY-MM-DD aprox en CL
    const horaActual = `${String(nowCl.getHours()).padStart(2, '0')}:${String(nowCl.getMinutes()).padStart(2, '0')}`;

    const programados = await sr.entities.ContentPost.filter({ estado: 'Programado' }, 'fecha_publicacion', 50);

    const vencidos = (programados || []).filter((p) => {
      const fecha = (p.fecha_publicacion || '').slice(0, 10);
      if (!fecha) return false;
      if (fecha < hoy) return true;
      if (fecha > hoy) return false;
      // Mismo día: comparar hora (sin hora => publicar)
      const hora = (p.hora_publicacion || '').slice(0, 5);
      return !hora || hora <= horaActual;
    }).slice(0, 5); // máx 5 por corrida para no saturar APIs

    const resultados = [];
    for (const post of vencidos) {
      try {
        const res = await sr.functions.invoke('publishContentPost', { post_id: post.id, modo: 'auto' });
        resultados.push({ id: post.id, titulo: post.titulo, ok: true, detail: res?.message || 'publicado' });
        console.log(`[publicarProgramados] ✅ ${post.titulo} (${post.red_social})`);
      } catch (err) {
        const detail = err?.response?.data?.error || err.message;
        resultados.push({ id: post.id, titulo: post.titulo, ok: false, error: detail });
        console.error(`[publicarProgramados] ❌ ${post.titulo}: ${detail}`);
        // Marcar nota para revisión manual sin sacarlo de Programado más de 1 vez
        await sr.entities.ContentPost.update(post.id, {
          notas: `${post.notas ? post.notas + ' · ' : ''}Auto-publicación falló ${hoy} ${horaActual}: ${String(detail).slice(0, 150)}`,
        }).catch(() => {});
      }
    }

    return Response.json({
      ok: true,
      hora_chile: `${hoy} ${horaActual}`,
      programados_total: (programados || []).length,
      publicados_intentados: vencidos.length,
      resultados,
    });
  } catch (error) {
    console.error('[publicarPostsProgramadosCRON]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});