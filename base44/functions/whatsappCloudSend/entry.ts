// ════════════════════════════════════════════════════════════════════════
// whatsappCloudSend — Envío manual desde el panel PEYU por el canal oficial.
// Lo usa la bandeja (/admin/whatsapp) cuando el equipo escribe a un cliente.
// Solo administradores.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enviarTextoCloud, enviarMediaCloud } from '../../shared/whatsapp-cloud.ts';
import { partirEnBurbujas } from '../../shared/evolution.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { telefono, texto, mediaUrl, mediaTipo, nombreArchivo } = await req.json().catch(() => ({}));
    if (!telefono) return Response.json({ ok: false, error: 'Falta el teléfono del destinatario' }, { status: 400 });

    if (mediaUrl) {
      const r = await enviarMediaCloud(telefono, {
        url: mediaUrl,
        tipo: mediaTipo || 'image',
        caption: texto || '',
        nombreArchivo: nombreArchivo || '',
      });
      return Response.json({ ok: r.ok, enviado: 'media', detalle: r.data });
    }

    if (!texto) return Response.json({ ok: false, error: 'Falta el mensaje a enviar' }, { status: 400 });

    const burbujas = partirEnBurbujas(texto);
    const resultados = [];
    for (const b of burbujas) {
      const r = await enviarTextoCloud(telefono, b);
      resultados.push({ ok: r.ok, detalle: r.data });
      if (!r.ok) break;
    }

    return Response.json({ ok: resultados.every((r) => r.ok), burbujas: resultados.length, resultados });
  } catch (error) {
    console.error('[whatsappCloudSend] Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}