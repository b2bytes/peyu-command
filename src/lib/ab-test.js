// ============================================================================
// ab-test · Sistema A/B mínimo para landings.
// Asigna al visitante la variante A o B (50/50, persistente en el navegador)
// y registra dos eventos: "view" al abrir la landing y "click" al tocar el
// botón de compra final. La comparación se ve en /admin/ab-tests.
// ============================================================================
import { base44 } from '@/api/base44Client';

const VISITOR_KEY = 'peyu_ab_visitor';

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch { return 'anon'; }
}

/** Variante estable del visitante para un test dado ('A' | 'B'). */
export function getVariante(testId) {
  const key = `peyu_ab_${testId}`;
  try {
    // ?ab=A o ?ab=B permite forzar la variante para revisarla manualmente.
    const forzada = new URLSearchParams(window.location.search).get('ab');
    if (forzada === 'A' || forzada === 'B') {
      localStorage.setItem(key, forzada);
      return forzada;
    }
    let v = localStorage.getItem(key);
    if (v !== 'A' && v !== 'B') {
      v = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem(key, v);
    }
    return v;
  } catch { return 'A'; }
}

async function registrar(testId, variante, evento) {
  try {
    await base44.entities.ABTestEvent.create({
      test_id: testId,
      variante,
      evento,
      visitor_id: visitorId(),
      page_path: window.location.pathname,
    });
  } catch { /* nunca bloquear la landing por analítica */ }
}

/** Registra la visita una sola vez por sesión de pestaña. */
export function trackABView(testId, variante) {
  const key = `peyu_ab_view_${testId}_${variante}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* sigue igual */ }
  registrar(testId, variante, 'view');
}

/** Registra el clic en el botón de compra final. */
export function trackABClick(testId, variante) {
  registrar(testId, variante, 'click');
}