import React from 'react';
import { AlertTriangle, RefreshCw, MessageCircle, Home } from 'lucide-react';

/**
 * ErrorBoundary global.
 * - En rutas admin (/admin/*) muestra el detalle técnico (útil para builders).
 * - En rutas públicas muestra una pantalla amigable con CTAs:
 *   recargar, volver al inicio, escribir por WhatsApp.
 * Esto evita que un crash deje al cliente con una pantalla en blanco
 * o con stack traces visibles.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const errMsg = String(this.state.error?.message || this.state.error || '').slice(0, 200);

    // ── Admin: detalle técnico ────────────────────────────────────────
    if (isAdmin) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 z-50 p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-4 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Algo salió mal</h1>
            <p className="text-sm text-white/70">
              Intentamos recuperarnos automáticamente. Si el problema persiste, recarga la página.
            </p>
            {errMsg && (
              <pre className="text-[10px] text-red-300 bg-black/30 rounded-lg p-2 text-left overflow-auto max-h-24">
                {errMsg}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </button>
          </div>
        </div>
      );
    }

    // ── Público: experiencia amigable con tortuga ─────────────────────
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 z-50 p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-8 sm:p-10 space-y-6 text-center shadow-2xl">
          <div className="text-6xl">🐢</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-poppins font-bold text-white">Ups, algo se atascó</h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Esta tortuga tropezó. Refrésca la página o vuelve al inicio — y si necesitas ayuda urgente, escríbenos por WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={this.handleReload}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg"
            >
              <RefreshCw className="w-4 h-4" /> Recargar página
            </button>
            <div className="flex gap-2">
              <button
                onClick={this.handleHome}
                className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                <Home className="w-4 h-4" /> Inicio
              </button>
              <a
                href="https://wa.me/56935040242?text=Hola%20Peyu%2C%20la%20web%20me%20mostr%C3%B3%20un%20error"
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-11 rounded-xl bg-green-500/30 hover:bg-green-500/50 border border-green-400/40 text-green-100 text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;