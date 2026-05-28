// ============================================================================
// Países LATAM con prefijo telefónico + bandera. Chile (+56) por defecto.
// Usado por el selector de país emergente en formularios B2B/contacto.
// ============================================================================
export const LATAM_COUNTRIES = [
  { code: 'CL', name: 'Chile',        dial: '+56',  flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina',    dial: '+54',  flag: '🇦🇷' },
  { code: 'PE', name: 'Perú',         dial: '+51',  flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia',     dial: '+57',  flag: '🇨🇴' },
  { code: 'MX', name: 'México',       dial: '+52',  flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil',       dial: '+55',  flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay',      dial: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay',     dial: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia',      dial: '+591', flag: '🇧🇴' },
  { code: 'EC', name: 'Ecuador',      dial: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela',    dial: '+58',  flag: '🇻🇪' },
  { code: 'CR', name: 'Costa Rica',   dial: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá',       dial: '+507', flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala',    dial: '+502', flag: '🇬🇹' },
  { code: 'DO', name: 'Rep. Dominicana', dial: '+1', flag: '🇩🇴' },
];

export const DEFAULT_COUNTRY = LATAM_COUNTRIES[0]; // Chile

export function findCountryByDial(dial) {
  return LATAM_COUNTRIES.find(c => c.dial === dial) || DEFAULT_COUNTRY;
}