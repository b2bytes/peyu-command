// ============================================================================
// PEYU · error-reporter — captura global de errores en el frontend
// ----------------------------------------------------------------------------
// Se monta una sola vez en main.jsx. Reporta a /functions/logClientError:
// - window.onerror (errores síncronos)
// - unhandledrejection (promises sin catch)
// - Errores manuales vía reportError(...)
//
// Deduplicación: cada mensaje único se reporta máximo una vez por sesión
// para no saturar el backend.
// ============================================================================
import { base44 } from '@/api/base44Client';

const reported = new Set();
const SESSION_ID = (() => {
  try {
    let id = sessionStorage.getItem('peyu_session_id');
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('peyu_session_id', id);
    }
    return id;
  } catch { return 'unknown'; }
})();

function getViewport() {
  if (typeof window === 'undefined') return 'ssr';
  const w = window.innerWidth, h = window.innerHeight;
  const kind = w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  return `${kind}-${w}x${h}`;
}

export async function reportError({ source, severity = 'medium', message, stack = '', extra = {} }) {
  const key = `${source}:${String(message).slice(0, 100)}`;
  if (reported.has(key)) return; // dedupe por sesión
  reported.add(key);

  try {
    await base44.functions.invoke('logClientError', {
      source,
      severity,
      message: String(message || 'Unknown'),
      stack: String(stack || '').slice(0, 4000),
      url: window.location.href,
      user_agent: navigator.userAgent,
      viewport: getViewport(),
      session_id: SESSION_ID,
      extra,
    });
  } catch {
    // silencioso — no podemos romper la app si el reporte falla
  }
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    const filename = event.filename || '';
    const message = event.message || '';

    // Ignorar errores de extensiones, scripts cross-origin sin info útil,
    // y errores de carga de imágenes/recursos (no son bugs de la app).
    if (filename.startsWith('chrome-extension://')) return;
    if (filename.startsWith('moz-extension://')) return;
    if (filename.startsWith('safari-extension://')) return;
    if (message === 'Script error.' || message === 'ResizeObserver loop limit exceeded') return;
    if (message.includes('ResizeObserver loop completed with undelivered notifications')) return;
    // Errores de carga de imagen / video / audio: son del recurso, no del JS
    if (event.target && event.target !== window && (event.target.tagName === 'IMG' || event.target.tagName === 'VIDEO' || event.target.tagName === 'LINK')) return;

    // Stale chunk: lo maneja el ErrorBoundary con auto-reload, no spammear
    const isStaleChunk = message.includes('Failed to fetch dynamically imported module')
      || message.includes('Loading chunk')
      || message.includes('ChunkLoadError');

    reportError({
      source: 'frontend_window',
      severity: isStaleChunk ? 'low' : 'high',
      message,
      stack: event.error?.stack || '',
      extra: { lineno: event.lineno, colno: event.colno, filename, stale_chunk: isStaleChunk },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason || '');

    // Ignorar promesas canceladas (AbortController) y networks transitorios
    if (reason?.name === 'AbortError') return;
    if (message === 'cancelled' || message === 'canceled') return;
    // No reportar errores de fetch sin más contexto (ruido, no accionable)
    if (message === 'Failed to fetch' && !reason?.stack) return;

    reportError({
      source: 'frontend_promise',
      severity: 'medium',
      message,
      stack: reason?.stack || '',
    });
  });
}