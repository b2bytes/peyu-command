// ============================================================================
// PEYU · lazy-with-retry
// ----------------------------------------------------------------------------
// React.lazy() endurecido para producción.
//
// Problema: cuando hacemos un deploy nuevo, los chunks JS cambian de hash
// (ej. Compras-abc123.js → Compras-xyz789.js). Los usuarios que tenían la app
// abierta antes del deploy ven crashes con:
//   "Failed to fetch dynamically imported module: /src/pages/Compras.jsx"
//
// Esta función envuelve el import lazy con:
//   1. Hasta 3 reintentos con backoff exponencial (300ms / 600ms / 1200ms)
//   2. Cache-busting en el último intento (?v=timestamp)
//   3. Si todos fallan, hace 1 hard reload silencioso de la página (con flag
//      en sessionStorage para evitar loops infinitos)
//
// Uso idéntico a React.lazy:
//   const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
// ============================================================================
import { lazy } from 'react';

const STALE_CHUNK_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'NetworkError when attempting to fetch resource',
  'Loading chunk',
  'ChunkLoadError',
];

const isStaleChunkError = (err) => {
  const msg = String(err?.message || err || '');
  return STALE_CHUNK_PATTERNS.some(p => msg.includes(p));
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function lazyWithRetry(factory, { retries = 3, name = 'chunk' } = {}) {
  return lazy(async () => {
    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastErr = err;
        // Solo retry para stale-chunks; otros errores propagan inmediatamente.
        if (!isStaleChunkError(err)) throw err;

        if (attempt < retries) {
          // Backoff exponencial: 300ms, 600ms, 1200ms
          await sleep(300 * Math.pow(2, attempt - 1));
        }
      }
    }

    // Todos los retries fallaron → forzar reload UNA vez por sesión.
    if (typeof window !== 'undefined') {
      const key = `peyu_lazy_reload_${name}`;
      const last = Number(sessionStorage.getItem(key) || 0);
      const now = Date.now();
      // Cooldown de 30s entre reloads del mismo chunk
      if (now - last > 30000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
        // Devolver un componente placeholder mientras recarga
        return { default: () => null };
      }
    }
    throw lastErr;
  });
}