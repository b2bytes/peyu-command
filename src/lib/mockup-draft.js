/**
 * Draft de mockup/personalización que viaja con el cliente entre páginas.
 * Permite que, al generar un mockup en ProductoDetalle (u otra página) y luego
 * hacer clic en "Cotizar B2B", el formulario B2B precargue:
 *   - mockup ya generado (sin regenerarlo)
 *   - logo subido
 *   - texto/mensaje de personalización
 *   - contexto del producto
 *
 * Vive en localStorage bajo la clave PEYU_MOCKUP_DRAFT_KEY y expira a las 2 horas
 * para no "pegarse" en sesiones antiguas.
 */

export const PEYU_MOCKUP_DRAFT_KEY = 'peyu_mockup_draft';
const DRAFT_TTL_MS = 1000 * 60 * 60 * 2; // 2 horas

export function saveMockupDraft(data) {
  try {
    const payload = { ...data, savedAt: Date.now() };
    localStorage.setItem(PEYU_MOCKUP_DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

export function readMockupDraft(forProductoId = null) {
  try {
    const raw = localStorage.getItem(PEYU_MOCKUP_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // TTL
    if (!data?.savedAt || Date.now() - data.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(PEYU_MOCKUP_DRAFT_KEY);
      return null;
    }
    // Si se pide filtrar por producto específico y no coincide, no devolver
    if (forProductoId && data.productoId && String(data.productoId) !== String(forProductoId)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearMockupDraft() {
  try { localStorage.removeItem(PEYU_MOCKUP_DRAFT_KEY); } catch {}
}