// ════════════════════════════════════════════════════════════════════════
// whatsapp-media — Entiende lo que el cliente MANDA, no solo lo que escribe.
// ────────────────────────────────────────────────────────────────────────
// Notas de voz → transcripción real. Fotos → descripción útil para vender
// (modelo de celular, producto, logo). El texto resultante entra al agente
// como si el cliente lo hubiera escrito, así que todo el flujo de venta
// (cotizar, mockup, checkout) funciona igual.
// Usado por whatsappEvolutionWebhook.
// ════════════════════════════════════════════════════════════════════════
import { descargarMediaBase64 } from './evolution.ts';

const EXT = {
  audio: { nombre: 'nota-voz.ogg', mime: 'audio/ogg' },
  imagen: { nombre: 'foto-cliente.jpg', mime: 'image/jpeg' },
};

/** base64 → File (Deno) para poder subirlo al storage de la app. */
function aFile(base64, { nombre, mime }) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new File([bytes], nombre, { type: mime });
}

const PROMPT_FOTO = `Eres el asistente de ventas de PEYU Chile (productos de plástico reciclado: carcasas de celular, cachos, soportes de escritorio, paletas, artículos para el hogar; todos personalizables con grabado láser).

Un cliente envió esta foto por WhatsApp. Describe en 1 o 2 frases, en español de Chile, SOLO lo relevante para atenderlo:
- Si es un celular: qué modelo o marca aparenta ser (di "parece" si no estás seguro).
- Si es un producto PEYU: cuál es y de qué color.
- Si es un logo, dibujo o texto para grabar: descríbelo y di si se ve apto para grabado láser (mejor si es simple, de un color y con buen contraste).
- Si es otra cosa: descríbela en pocas palabras.
No saludes, no des precios, no inventes datos. Solo la descripción.`;

/**
 * Interpreta el adjunto y devuelve el texto que se le pasará al agente.
 * Si no se puede procesar, devuelve '' y el webhook responde el aviso normal.
 */
export async function interpretarAdjunto(base44, data, tipo, caption = '') {
  if (tipo !== 'audio' && tipo !== 'imagen') return '';

  const base64 = await descargarMediaBase64(data).catch(() => '');
  if (!base64) return '';

  const { file_url } = await base44.integrations.Core.UploadFile({
    file: aFile(base64, EXT[tipo]),
  }).catch(() => ({ file_url: '' }));
  if (!file_url) return '';

  if (tipo === 'audio') {
    const transcripcion = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url }).catch(() => '');
    const limpia = String(transcripcion || '').trim();
    if (!limpia) return '';
    return `[Nota de voz del cliente, transcrita] ${limpia}`;
  }

  const descripcion = await base44.integrations.Core.InvokeLLM({
    prompt: PROMPT_FOTO,
    file_urls: [file_url],
  }).catch(() => '');
  const limpia = String(descripcion || '').trim();
  if (!limpia) return '';

  return [
    `[El cliente envió una foto. Esto se ve en la imagen] ${limpia}`,
    caption ? `[Texto que escribió con la foto] ${caption}` : '',
    `[Imagen guardada: ${file_url} — úsala como logo_url si el cliente quiere grabarla]`,
  ].filter(Boolean).join('\n');
}