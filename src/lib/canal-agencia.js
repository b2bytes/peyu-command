// Helpers del canal PEYU ↔ Agencia (b2bytes).
// El "lado" se deriva del dominio del email: @peyuchile.cl → peyu, resto → agencia.

export function ladoDeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e.endsWith('@peyuchile.cl') ? 'peyu' : 'agencia';
}

export const LADO_INFO = {
  peyu: {
    nombre: 'PEYU',
    color: '#0F8B6C',
    bg: 'rgba(15,139,108,.10)',
  },
  agencia: {
    nombre: 'Agencia (b2bytes)',
    color: '#C0785C',
    bg: 'rgba(192,120,92,.10)',
  },
};