// ════════════════════════════════════════════════════════════════════════
// Evolution API · cliente compartido (middleware WhatsApp de PEYU)
// ────────────────────────────────────────────────────────────────────────
// Un solo lugar habla con el servidor Evolution API (Baileys/QR) que mantiene
// viva la sesión del número real de la tienda (+56 9 3504 0242).
// Todas las funciones del middleware importan desde aquí — nada de lógica
// duplicada entre entry.ts.
//
// Requiere estas variables de entorno (Settings → Environment variables):
//   EVOLUTION_API_URL         https://wa.peyuchile.cl  (sin barra final)
//   EVOLUTION_API_KEY         la AUTHENTICATION_API_KEY del docker-compose
//   EVOLUTION_INSTANCE        nombre de la instancia (ej: peyu)
//   EVOLUTION_WEBHOOK_SECRET  palabra secreta del webhook entrante
// ════════════════════════════════════════════════════════════════════════

export const AGENT_NAME = 'whatsapp_peyu';

/** Lee y valida la configuración. Lanza un error legible si falta algo. */
export function getEvoConfig() {
  // Tolera que el dominio se pegue sin esquema (Railway lo muestra así).
  let url = (Deno.env.get('EVOLUTION_API_URL') || '').trim().replace(/\/+$/, '');
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  const apiKey = Deno.env.get('EVOLUTION_API_KEY') || '';
  const instance = Deno.env.get('EVOLUTION_INSTANCE') || 'peyu';
  const webhookSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET') || '';

  const faltan = [];
  if (!url) faltan.push('EVOLUTION_API_URL');
  if (!apiKey) faltan.push('EVOLUTION_API_KEY');
  if (!webhookSecret) faltan.push('EVOLUTION_WEBHOOK_SECRET');
  if (faltan.length) {
    throw new Error(
      `Falta configurar el servidor de WhatsApp. Variables pendientes: ${faltan.join(', ')}. ` +
      'Cárgalas en Settings → Environment variables.'
    );
  }
  return { url, apiKey, instance, webhookSecret };
}

/** ¿Está configurado el middleware? (para mostrar estado sin lanzar error) */
export function evoConfigurado() {
  return !!(Deno.env.get('EVOLUTION_API_URL') && Deno.env.get('EVOLUTION_API_KEY') && Deno.env.get('EVOLUTION_WEBHOOK_SECRET'));
}

/** Llamada REST genérica a Evolution API. Devuelve { ok, status, data }. */
export async function evoFetch(path, { method = 'GET', body = null } = {}) {
  const cfg = getEvoConfig();
  const res = await fetch(`${cfg.url}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: cfg.apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const texto = await res.text();
  let data = null;
  try { data = texto ? JSON.parse(texto) : null; } catch { data = { raw: texto }; }
  return { ok: res.ok, status: res.status, data };
}

// ── Teléfonos ──────────────────────────────────────────────────────────

/** 56935040242 → 56935040242@s.whatsapp.net */
export function toJid(telefono) {
  const limpio = String(telefono || '').replace(/\D/g, '');
  return `${limpio}@s.whatsapp.net`;
}

/** 56935040242@s.whatsapp.net → 56935040242 */
export function fromJid(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

/** +56 9 3504 0242 legible desde 56935040242 (para mostrar en la bandeja). */
export function formatearTelefonoCL(numero) {
  const n = String(numero || '').replace(/\D/g, '');
  if (n.startsWith('569') && n.length === 11) {
    return `+56 9 ${n.slice(3, 7)} ${n.slice(7)}`;
  }
  return `+${n}`;
}

export function esGrupo(jid) {
  return String(jid || '').includes('@g.us');
}

// ── Mensajes entrantes ─────────────────────────────────────────────────

/**
 * Extrae el texto de un mensaje de WhatsApp, cubriendo los formatos que
 * Baileys entrega: texto simple, texto con link/reply, y pies de foto.
 */
export function extraerTexto(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.listResponseMessage?.title ||
    message.templateButtonReplyMessage?.selectedDisplayText ||
    ''
  ).trim();
}

/** Describe el tipo de adjunto cuando el cliente no manda texto. */
export function tipoAdjunto(message) {
  if (!message) return '';
  if (message.audioMessage) return 'audio';
  if (message.imageMessage) return 'imagen';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'documento';
  if (message.stickerMessage) return 'sticker';
  if (message.locationMessage) return 'ubicación';
  if (message.contactMessage) return 'contacto';
  return '';
}

// ── Envío ──────────────────────────────────────────────────────────────

/** Marca "escribiendo…" para que la respuesta se sienta humana. */
export async function enviarPresencia(telefono, presence = 'composing', delayMs = 1200) {
  const cfg = getEvoConfig();
  return await evoFetch(`/chat/sendPresence/${cfg.instance}`, {
    method: 'POST',
    body: { number: fromJid(toJid(telefono)), presence, delay: delayMs },
  });
}

/** Envía un mensaje de texto por WhatsApp. */
export async function enviarTexto(telefono, texto, { delayMs = 0 } = {}) {
  const cfg = getEvoConfig();
  return await evoFetch(`/message/sendText/${cfg.instance}`, {
    method: 'POST',
    body: {
      number: fromJid(toJid(telefono)),
      text: texto,
      delay: delayMs,
      linkPreview: true,
    },
  });
}

/** Envía una imagen o documento por URL pública. */
export async function enviarMedia(telefono, { url, tipo = 'image', caption = '', nombreArchivo = '' }) {
  const cfg = getEvoConfig();
  return await evoFetch(`/message/sendMedia/${cfg.instance}`, {
    method: 'POST',
    body: {
      number: fromJid(toJid(telefono)),
      mediatype: tipo,             // image | video | document
      media: url,
      caption,
      fileName: nombreArchivo || undefined,
    },
  });
}

/**
 * Parte una respuesta larga en burbujas naturales (WhatsApp se lee mal en
 * bloques gigantes). Corta por párrafos, nunca a mitad de palabra.
 */
export function partirEnBurbujas(texto, maxLargo = 900) {
  const limpio = String(texto || '').trim();
  if (!limpio) return [];
  if (limpio.length <= maxLargo) return [limpio];

  const parrafos = limpio.split(/\n{2,}/);
  const burbujas = [];
  let actual = '';
  for (const p of parrafos) {
    if ((actual + '\n\n' + p).trim().length > maxLargo && actual) {
      burbujas.push(actual.trim());
      actual = p;
    } else {
      actual = actual ? `${actual}\n\n${p}` : p;
    }
  }
  if (actual.trim()) burbujas.push(actual.trim());
  return burbujas.slice(0, 4);
}

/** Delay humano proporcional al largo del mensaje (1,2 s a 3,5 s). */
export function delayHumano(texto) {
  const largo = String(texto || '').length;
  return Math.min(3500, 1200 + largo * 12);
}