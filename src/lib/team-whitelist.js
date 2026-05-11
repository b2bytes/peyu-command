// Whitelist de emails autorizados para acceder a /admin/*.
// Cualquier usuario fuera de esta lista es redirigido a "Acceso restringido".
// Para agregar/quitar miembros del equipo, edita SOLO esta lista.

export const TEAM_EMAILS = [
  'alfonsovambe@gmail.com',
  'jnilo@peyuchile.cl',
  'cmoscoso@peyuchile.cl',
  'ventas@peyuchile.cl',
  'corporativos@peyuchile.cl',
  'jsanchez@peyuchile.cl',
  'ti@peyuchile.cl',
];

// Normalizamos la lista una sola vez al cargar el módulo.
const NORMALIZED = TEAM_EMAILS.map(e => String(e).trim().toLowerCase());

export function isTeamMember(email) {
  if (!email) return false;
  return NORMALIZED.includes(String(email).trim().toLowerCase());
}