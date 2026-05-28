// ============================================================================
// LinkedInConnectBanner · invitación discreta para conectar LinkedIn oficial
// No fuerza OAuth. Solo muestra el estado actual y permite al usuario
// pedir la conexión cuando quiera (queda registrado en localStorage).
// ============================================================================
import { useState, useEffect } from 'react';
import { Linkedin, CheckCircle2, ArrowRight, X } from 'lucide-react';

const DISMISS_KEY = 'peyu_linkedin_connect_dismissed_v1';

export default function LinkedInConnectBanner({ onRequestConnect }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="ld-card flex items-center gap-3 px-3.5 py-2.5 border-l-4 relative" style={{ borderLeftColor: '#0A66C2' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#0A66C2' }}>
        <Linkedin className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ld-fg leading-tight">Conecta la página oficial de PEYU Chile en LinkedIn</p>
        <p className="text-xs text-ld-fg-muted mt-0.5">Para publicar automáticamente los posts aprobados en la página corporativa.</p>
      </div>
      <button
        onClick={onRequestConnect}
        className="ld-btn-primary text-xs font-bold px-3 py-1.5 rounded-full gap-1.5 inline-flex items-center flex-shrink-0"
      >
        Conectar
        <ArrowRight className="w-3 h-3" />
      </button>
      <button
        onClick={handleDismiss}
        className="text-ld-fg-muted hover:text-ld-fg p-1 rounded-md hover:bg-ld-bg-soft transition-colors"
        title="Ocultar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}