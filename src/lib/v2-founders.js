// Whitelist EXCLUSIVA para el panel "Conversaciones" dentro de /v2.
// Solo founders ven inteligencia de negocio (ChatLead/AILog). Solo lectura.
// Independiente de team-whitelist (admin) — NO modificar esa lista.

export const V2_FOUNDER_EMAILS = [
  'alfonsovambe@gmail.com',
  'ventas@b2business.lat',
  'lyamundaca007@gmail.com',
  'admin@lyalab.tech',
];

const NORMALIZED = V2_FOUNDER_EMAILS.map((e) => String(e).trim().toLowerCase());

export function isV2Founder(email) {
  if (!email) return false;
  return NORMALIZED.includes(String(email).trim().toLowerCase());
}

// Palabras que marcan una conversación como "caliente" (intención de compra).
export const HOT_KEYWORDS = [
  'precio', 'descuento', 'cantidad', 'volumen', 'cotiza', 'cotización', 'cotizacion',
  'logo', 'unidades', 'empresa', 'mayorista', 'por mayor', 'grabado', 'personaliza',
];

export function isHotConversation(cl) {
  if (!cl) return false;
  if (cl.tipo === 'B2B') return true;
  const hay = `${cl.ultimo_mensaje_preview || ''}`.toLowerCase();
  return HOT_KEYWORDS.some((k) => hay.includes(k));
}