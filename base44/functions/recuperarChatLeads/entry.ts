// ============================================================================
// recuperarChatLeads — Rescata las conversaciones "cortadas" del chat web
// ----------------------------------------------------------------------------
// Recorre los ChatLead sin datos (sin preview / sin mensajes / sin nombre),
// lee la conversación real del agente y reconstruye: n° de mensajes, último
// mensaje del visitante, fecha, y los datos que dejó (nombre, email, teléfono,
// empresa, cantidad). Solo rellena lo que falta — nunca pisa datos existentes.
//
// Payload: { conversation_id? , limit? }  ·  Solo admin.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const RE_FONO = /(?:\+?56)?\s?9[\s.-]?\d{4}[\s.-]?\d{4}/;
const RE_NOMBRE = /(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]{2,})?)/;
const RE_EMPRESA = /(?:empresa|compañ[ií]a|trabajo en|somos de)\s+([\wÁÉÍÓÚÑáéíóúñ.\s&-]{3,40})/i;
const RE_CANT = /(\d{2,5})\s*(?:u|un|unidades|pzas|piezas)\b/i;

const limpiar = (t: string) => String(t || '')
  .replace(/\[\[[^\]]*\]\]/g, '')
  .replace(/\[CONTEXTO\][^\n]*/g, '')
  .replace(/\[CATALOGO\][\s\S]*$/g, '')
  .trim();

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { conversation_id, limit = 40 } = await req.json().catch(() => ({}));

  const todos = await base44.asServiceRole.entities.ChatLead.list('-created_date', 400);
  const objetivo = conversation_id
    ? todos.filter((l: any) => l.conversation_id === conversation_id)
    : todos.filter((l: any) => !l.ultimo_mensaje_preview || !l.mensajes_count).slice(0, limit);

  let recuperados = 0;
  const errores: string[] = [];

  for (const lead of objetivo) {
    try {
      const conv = await base44.asServiceRole.agents.getConversation(lead.conversation_id);
      const msgs = (conv?.messages || []).filter((m: any) => limpiar(m.content));
      if (msgs.length === 0) continue;

      const delVisitante = msgs.filter((m: any) => m.role === 'user');
      const texto = delVisitante.map((m: any) => limpiar(m.content)).join('\n');
      const ultimo = delVisitante[delVisitante.length - 1] || msgs[msgs.length - 1];

      const patch: Record<string, any> = {
        mensajes_count: msgs.length,
        ultimo_mensaje_preview: limpiar(ultimo.content).slice(0, 140),
      };
      if (ultimo.created_at) patch.ultimo_mensaje_at = ultimo.created_at;

      if (!lead.email) { const m = texto.match(RE_EMAIL); if (m) patch.email = m[0]; }
      if (!lead.telefono) { const m = texto.match(RE_FONO); if (m) patch.telefono = m[0].replace(/[\s.-]/g, ''); }
      if (!lead.nombre) { const m = texto.match(RE_NOMBRE); if (m) patch.nombre = m[1].trim(); }
      if (!lead.empresa) { const m = texto.match(RE_EMPRESA); if (m) patch.empresa = m[1].trim(); }
      if (!lead.cantidad_estimada) { const m = texto.match(RE_CANT); if (m) patch.cantidad_estimada = Number(m[1]); }

      await base44.asServiceRole.entities.ChatLead.update(lead.id, patch);
      recuperados++;
    } catch (err) {
      errores.push(`${lead.conversation_id}: ${(err as Error).message}`);
    }
  }

  return Response.json({ revisados: objetivo.length, recuperados, errores: errores.slice(0, 5) });
});