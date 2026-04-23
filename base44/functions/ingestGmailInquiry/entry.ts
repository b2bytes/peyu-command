// ============================================================================
// ingestGmailInquiry — Webhook Gmail → crea Consulta/Lead automáticamente
// ============================================================================
// Se dispara cuando llega un email nuevo a ti@peyuchile.cl. Lee el contenido,
// extrae datos básicos (remitente, asunto, cuerpo) y crea un registro en la
// entidad `Consulta` para que entre al flujo CRM como un lead no tratado.
//
// IMPORTANT: Este handler es llamado por la plataforma Base44, NO por Google.
// No añadir auth custom: la plataforma ya autentica la llamada.
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Extrae una header específica de un mensaje Gmail.
 */
function getHeader(headers, name) {
  const h = headers?.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

/**
 * Decodifica un body base64url (Gmail API) a texto UTF-8.
 */
function decodeBase64Url(data) {
  if (!data) return '';
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return atob(b64);
  }
}

/**
 * Extrae el texto plano del mensaje (preferencia text/plain, fallback text/html).
 */
function extractBodyText(payload) {
  if (!payload) return '';

  // Caso simple: body directo
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Caso multipart: buscar text/plain primero, luego text/html
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);

    const html = payload.parts.find((p) => p.mimeType === 'text/html');
    if (html?.body?.data) {
      const raw = decodeBase64Url(html.body.data);
      return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Recursivo para multipart anidados
    for (const part of payload.parts) {
      const inner = extractBodyText(part);
      if (inner) return inner;
    }
  }

  return '';
}

/**
 * Parsea un email From: "Juan Pérez <juan@acme.cl>" → { name, email }
 */
function parseFrom(fromHeader) {
  const match = fromHeader.match(/^(.*?)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ''),
      email: match[2].trim(),
    };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim() };
}

/**
 * Heurística simple: clasifica el tipo de consulta según palabras clave.
 */
function classifyInquiry(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  if (/cotiza|presupuest|corporativ|regal[oó] empres|b2b/.test(text)) return 'Cotización Corporativa';
  if (/personaliz|laser|l[áa]ser|grabad/.test(text)) return 'Personalización Tienda';
  if (/pedido|orden|envio|seguimient|tracking/.test(text)) return 'Estado Pedido';
  if (/compra|precio|dispon/.test(text)) return 'Compra Individual';
  return 'Pregunta General';
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // La plataforma pre-enriquece con new_message_ids
    const messageIds = body?.data?.new_message_ids ?? [];

    if (!messageIds.length) {
      return Response.json({ ok: true, skipped: 'no_new_messages' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const created = [];
    const skipped = [];

    for (const messageId of messageIds) {
      // Obtener mensaje completo
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!res.ok) {
        skipped.push({ messageId, reason: `fetch_failed_${res.status}` });
        continue;
      }

      const message = await res.json();
      const headers = message.payload?.headers || [];

      const from = getHeader(headers, 'From');
      const subject = getHeader(headers, 'Subject') || '(sin asunto)';
      const { name, email } = parseFrom(from);
      const bodyText = extractBodyText(message.payload).slice(0, 2000);

      // Filtrar emails propios (evitar loop con notificaciones salientes)
      if (email.endsWith('@peyuchile.cl')) {
        skipped.push({ messageId, reason: 'internal_sender', email });
        continue;
      }

      // Filtrar spam obvio / auto-respuestas
      if (/no-reply|noreply|mailer-daemon|auto-reply/i.test(email)) {
        skipped.push({ messageId, reason: 'auto_sender', email });
        continue;
      }

      // Evitar duplicados: verificar si ya existe una consulta con este messageId
      const existing = await base44.asServiceRole.entities.Consulta.filter({
        notas: `gmail:${messageId}`,
      });
      if (existing.length > 0) {
        skipped.push({ messageId, reason: 'duplicate' });
        continue;
      }

      // Crear consulta
      const tipo = classifyInquiry(subject, bodyText);
      const consulta = await base44.asServiceRole.entities.Consulta.create({
        nombre: name || email,
        telefono: '', // Gmail no trae teléfono
        mensaje: `📧 ${subject}\n\n${bodyText}`,
        tipo,
        estado: 'Sin responder',
        calidad: 'Tibio',
        canal: 'Email',
        notas: `gmail:${messageId}`,
      });

      created.push({
        consulta_id: consulta.id,
        from: email,
        subject,
        tipo,
      });
    }

    return Response.json({
      ok: true,
      processed: messageIds.length,
      created_count: created.length,
      skipped_count: skipped.length,
      created,
      skipped,
    });
  } catch (error) {
    console.error('[ingestGmailInquiry]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});