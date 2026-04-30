// ============================================================================
// PEYU · Web Vitals Tracking (LCP, CLS, INP, FCP, TTFB)
// ----------------------------------------------------------------------------
// Mide Core Web Vitals usando la PerformanceObserver API nativa (sin
// dependencias externas) y los reporta a GA4 vía gtag. Crítico para SEO
// porque Google usa estas métricas como ranking factor desde 2021.
// ============================================================================

const REPORTED = new Set();

const sendToGA = (name, value, rating) => {
  if (REPORTED.has(name)) return;
  REPORTED.add(name);
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        metric_value: value,
        metric_rating: rating,
        non_interaction: true,
      });
    }
  } catch { /* noop */ }
};

const rate = (name, v) => {
  // Thresholds oficiales Google (2024+)
  if (name === 'LCP') return v <= 2500 ? 'good' : v <= 4000 ? 'needs-improvement' : 'poor';
  if (name === 'CLS') return v <= 0.1 ? 'good' : v <= 0.25 ? 'needs-improvement' : 'poor';
  if (name === 'INP') return v <= 200 ? 'good' : v <= 500 ? 'needs-improvement' : 'poor';
  if (name === 'FCP') return v <= 1800 ? 'good' : v <= 3000 ? 'needs-improvement' : 'poor';
  if (name === 'TTFB') return v <= 800 ? 'good' : v <= 1800 ? 'needs-improvement' : 'poor';
  return 'unknown';
};

export const initWebVitals = () => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // ── LCP ──
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) sendToGA('LCP', last.renderTime || last.loadTime || last.startTime, rate('LCP', last.startTime));
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* noop */ }

  // ── CLS ──
  try {
    let clsValue = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });

    // Reportar al ocultar la pestaña (más preciso para CLS acumulado)
    const report = () => {
      if (document.visibilityState === 'hidden') {
        sendToGA('CLS', clsValue, rate('CLS', clsValue));
      }
    };
    document.addEventListener('visibilitychange', report, { once: true });
  } catch { /* noop */ }

  // ── INP (sustituyó a FID en marzo 2024) ──
  try {
    let worstINP = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const dur = entry.duration || 0;
        if (dur > worstINP) worstINP = dur;
      }
    });
    po.observe({ type: 'event', buffered: true, durationThreshold: 16 });

    const report = () => {
      if (document.visibilityState === 'hidden' && worstINP > 0) {
        sendToGA('INP', worstINP, rate('INP', worstINP));
      }
    };
    document.addEventListener('visibilitychange', report, { once: true });
  } catch { /* noop */ }

  // ── FCP + TTFB ──
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          sendToGA('FCP', entry.startTime, rate('FCP', entry.startTime));
        }
      }
    });
    po.observe({ type: 'paint', buffered: true });

    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      const ttfb = nav.responseStart - nav.requestStart;
      sendToGA('TTFB', ttfb, rate('TTFB', ttfb));
    }
  } catch { /* noop */ }
};