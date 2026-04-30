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
    // Ignorar errores de extensiones del navegador
    if (event.filename && event.filename.startsWith('chrome-extension://')) return;
    reportError({
      source: 'frontend_window',
      severity: 'high',
      message: event.message,
      stack: event.error?.stack || '',
      extra: { lineno: event.lineno, colno: event.colno, filename: event.filename },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportError({
      source: 'frontend_promise',
      severity: 'medium',
      message: reason?.message || String(reason),
      stack: reason?.stack || '',
    });
  });
}