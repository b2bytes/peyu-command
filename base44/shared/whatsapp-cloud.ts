// ════════════════════════════════════════════════════════════════════════
// WhatsApp Cloud API (Meta oficial) · cliente compartido
// ────────────────────────────────────────────────────────────────────────
// Reemplaza el canal no oficial (Evolution/Baileys) por la API oficial de
// Meta, que no arriesga el bloqueo del número. Funciona en modo coexistencia:
// el número +56 9 3504 0242 sigue usable en la app WhatsApp Business del
// celular; la Cloud API solo agrega el canal automático.
//
// Variables de entorno requeridas:
//   WHATSAPP_CLOUD_TOKEN      token de acceso (System User) de Meta
//   WHATSAPP_PHONE_NUMBER_ID  identificador del número (no el número)
//   WHATSAPP_VERIFY_TOKEN     palabra secreta para verificar el webhook
//   WHATSAPP_APP_SECRET       clave secreta de la app (firma X-Hub-Signature)
// ════════════════════════════════════════════════════════════════════════

const GRAPH_VERSION = 'v21.0';

/** Lee y valida la configuración. Lanza un error legible si falta algo. */
export function getCloudConfig() {
  const token = (Deno.env.get('WHATSAPP_CLOUD_TOKEN') || '').trim();
  const phoneNumberId = (Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '').trim();
  const verifyToken = (Deno.env.get('WHATSAPP_VERIFY_TOKEN') || '').trim();
  const appSecret = (Deno.env.get('WHATSAPP_APP_SECRET') || '').trim();

  const faltan = [];
  if (!token) faltan.push('WHATSAPP_CLOUD_TOKEN');
  if (!phoneNumberId) faltan.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!verifyToken) faltan.push('WHATSAPP_VERIFY_TOKEN');

  if (faltan.length) {
    throw new Error(
      `Falta configurar WhatsApp Cloud API. Variables pendientes: ${faltan.join(', ')}. ` +
      'Cárgalas en Settings → Environment variables.'
    );
  }
  return { token, phoneNumberId, verifyToken, appSecret };
}

/** ¿Está configurado el canal oficial? (sin lanzar error) */
export function cloudConfigurado() {
  return !!(Deno.env.get('WHATSAPP_CLOUD_TOKEN') && Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'));
}

/** Llamada REST genérica a la Graph API. Devuelve { ok, status, data }. */
export async function cloudFetch(path, { method = 'POST', body = null } = {}) {
  const cfg = getCloudConfig();
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const texto = await res.text();
  let data = null;
  try { data = texto ? JSON.parse(texto) : null; } catch { data = { raw: texto }; }
  if (!res.ok) {
    console.error('[WhatsApp Cloud] Error Graph API:', res.status, JSON.stringify(data));
  }
  return { ok: res.ok, status: res.status, data };
}

// ── Seguridad del webhook ──────────────────────────────────────────────

/**
 * Valida la firma X-Hub-Signature-256 que Meta envía en cada webhook.
 * Si no hay APP_SECRET configurado, se omite (el verify token ya protege).
 */
export async function firmaValida(rawBody, signatureHeader) {
  const cfg = getCloudConfig();
  if (!cfg.appSecret) return true;

  const recibida = String(signatureHeader || '').replace(/^sha256=/, '').toLowerCase();
  if (!recibida) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(cfg.appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const esperada = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (esperada.length !== recibida.length) return false;
  // Comparación de tiempo constante
  let diff = 0;
  for (let i = 0; i < esperada.length; i++) diff |= esperada.charCodeAt(i) ^ recibida.charCodeAt(i);
  return diff === 0;
}

// ── Mensajes entrantes ─────────────────────────────────────────────────

/**
 * Normaliza el payload del webhook a algo simple de usar.
 * Devuelve null cuando el evento no es un mensaje de cliente (ej: estados
 * de entrega "delivered"/"read", que llegan por el mismo webhook).
 */
export function parsearMensajeEntrante(payload) {
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const mensaje = value?.messages?.[0];
  if (!mensaje) return null;

  const telefono = String(mensaje.from || '').replace(/\D/g, '');
  const nombre = value?.contacts?.[0]?.profile?.name || '';

  const texto = (
    mensaje.text?.body ||
    mensaje.image?.caption ||
    mensaje.video?.caption ||
    mensaje.document?.caption ||
    mensaje.button?.text ||
    mensaje.interactive?.button_reply?.title ||
    mensaje.interactive?.list_reply?.title ||
    ''
  ).trim();

  return {
    id: mensaje.id || '',
    tipo: mensaje.type || '',
    telefono,
    nombre,
    texto,
  };
}

/** Nombre legible del adjunto, para responder cuando no viene texto. */
export function nombreAdjunto(tipo) {
  const mapa = {
    audio: 'nota de voz',
    image: 'imagen',
    video: 'video',
    document: 'documento',
    sticker: 'sticker',
    location: 'ubicación',
    contacts: 'contacto',
  };
  return mapa[tipo] || '';
}

// ── Envío ──────────────────────────────────────────────────────────────

/** Marca el mensaje del cliente como leído (los dos ticks azules). */
export async function marcarLeido(messageId) {
  if (!messageId) return null;
  const cfg = getCloudConfig();
  return await cloudFetch(`/${cfg.phoneNumberId}/messages`, {
    body: { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
  });
}

/** Envía un mensaje de texto por WhatsApp (canal oficial). */
export async function enviarTextoCloud(telefono, texto) {
  const cfg = getCloudConfig();
  return await cloudFetch(`/${cfg.phoneNumberId}/messages`, {
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(telefono || '').replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: true, body: texto },
    },
  });
}

/** Envía una imagen o documento por URL pública. */
export async function enviarMediaCloud(telefono, { url, tipo = 'image', caption = '', nombreArchivo = '' }) {
  const cfg = getCloudConfig();
  const media = { link: url };
  if (caption) media.caption = caption;
  if (tipo === 'document' && nombreArchivo) media.filename = nombreArchivo;

  return await cloudFetch(`/${cfg.phoneNumberId}/messages`, {
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(telefono || '').replace(/\D/g, ''),
      type: tipo,
      [tipo]: media,
    },
  });
}