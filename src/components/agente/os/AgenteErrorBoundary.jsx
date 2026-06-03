// ============================================================================
// AgenteErrorBoundary · Fallback local para PEYU OS (página Agente).
// ─────────────────────────────────────────────────────────────────────────────
// Si cualquier parte del chat/canvas del agente lanza durante el render
// (típicamente solo en móvil por una API no soportada o un dato inesperado),
// mostramos un fallback usable y un botón de reintento — NUNCA pantalla negra.
// ============================================================================
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class AgenteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AgenteErrorBoundary] crash:', error, info?.componentStack);
    import('@/lib/error-reporter.js')
      .then(({ reportError }) => reportError({
        source: 'frontend_boundary',
        severity: 'critical',
        message: `PEYU OS: ${error?.message || error}`,
        stack: error?.stack || '',
        extra: { componentStack: info?.componentStack?.slice(0, 2000) },
      }))
      .catch(() => {});
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const msg = String(this.state.error?.message || this.state.error || '').slice(0, 240);
    return (
      <div
        className="min-h-[100dvh] w-full flex items-center justify-center px-5 py-10 text-[#eaf5f0]"
        style={{ background: 'radial-gradient(130% 100% at 0% 0%, #11352b 0%, #0a1813 45%, #081210 100%)' }}
      >
        <div className="max-w-sm w-full bg-[#10231d]/80 border border-[#2a4a40] rounded-3xl p-6 text-center space-y-4">
          <div className="text-5xl">🐢</div>
          <div className="flex items-center justify-center gap-2 text-[#f0a085]">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">PEYU OS tropezó</span>
          </div>
          <p className="text-sm text-[#9fc7b8] leading-relaxed">
            No pudimos cargar tu negocio en esta vista. Reintenta y debería abrir bien.
          </p>
          {msg && (
            <pre className="text-[10px] text-[#f0a085]/80 bg-black/30 rounded-xl p-2 text-left overflow-auto max-h-24">
              {msg}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-xl bg-[#0F8B6C] hover:bg-[#14b894] text-white text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }
}

export default AgenteErrorBoundary;