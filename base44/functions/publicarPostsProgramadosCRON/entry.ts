import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────────────────────
// publicarPostsProgramadosCRON
// Cada 30 min publica los ContentPost en estado "Programado" cuya
// fecha_publicacion (+ hora_publicacion si existe) ya llegó, vía
// publishContentPost (Instagram/LinkedIn). Así el agente de marketing puede
// programar 1 post o la semana completa y se publica solo.
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sr = base44.asServiceRole;
    const programados = await sr.entities.ContentPost.filter({ estado: 'Programado' }, 'fecha_publicacion', 50);

    // Hora actual en Chile
    const ahora = new Date();
    const chileNow = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
    const hoyStr = chileNow.toISOString().split('T')[0];
    const horaActual = `${String(chileNow.getHours()).padStart(2, '0')}:${String(chileNow.getMinutes()).padStart(2, '0')}`;

    const resultados = [];
    for (const post of programados) {
      const fecha = (post.fecha_publicacion || '').slice(0, 10);
      if (!fecha || fecha > hoyStr) continue;
      // Si es hoy y tiene hora, esperar a que llegue la hora
      if (fecha === hoyStr && post.hora_publicacion && post.hora_publicacion > horaActual) continue;

      try {
        const res = await sr.functions.invoke('publishContentPost', { post_id: post.id, modo: 'auto' });
        resultados.push({ post_id: post.id, titulo: post.titulo, red: post.red_social, ok: true, detalle: res?.data || res });
        console.log(`[publicarProgramados] Publicado: ${post.titulo} (${post.red_social})`);
      } catch (err) {
        const detail = err?.response?.data?.error || err.message;
        resultados.push({ post_id: post.id, titulo: post.titulo, ok: false, error: detail });
        console.error(`[publicarProgramados] Falló ${post.titulo}:`, detail);
        // Marcar en notas para no reintentar infinito; lo deja en Pausado tras fallar
        await sr.entities.ContentPost.update(post.id, {
          estado: 'Pausado',
          notas: `${post.notas || ''}\n[auto] Publicación automática falló: ${String(detail).slice(0, 200)}`.trim(),
        });
      }
    }

    return Response.json({ ok: true, revisados: programados.length, publicados: resultados.filter(r => r.ok).length, resultados });
  } catch (error) {
    console.error('[publicarPostsProgramadosCRON]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});