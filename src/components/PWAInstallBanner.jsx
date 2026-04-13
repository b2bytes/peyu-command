import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { PWA_UTILS } from '@/lib/pwa-utils';
import { Button } from '@/components/ui/button';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    // Only show if not standalone and banner not dismissed recently
    if (!PWA_UTILS.isStandalone() && PWA_UTILS.showInstallBanner()) {
      setPlatform(PWA_UTILS.getPlatform());

      if (platform === 'android') {
        // Wait for beforeinstallprompt on Android
        const handler = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
      } else {
        // Show banner immediately on iOS/web
        setShowBanner(true);
      }
    }
  }, [platform]);

  if (!showBanner) return null;

  const instructions = PWA_UTILS.getInstallInstructions();

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        PWA_UTILS.dismissInstallBanner();
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    PWA_UTILS.dismissInstallBanner();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-transparent backdrop-blur-sm border-t border-white/10 p-4 sm:p-6">
      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Header con logo */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
              🐢
            </div>
            <div className="min-w-0">
              <h3 className="font-poppins font-bold text-white text-sm sm:text-base leading-tight">
                {instructions.title}
              </h3>
              <p className="text-white/60 text-xs mt-0.5">Acceso rápido • Offline • Sin publicidad</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Steps para iOS */}
        {platform === 'ios' && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 mb-3 space-y-2">
            {instructions.steps.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start text-xs sm:text-sm">
                <div className="w-6 h-6 rounded-full bg-teal-500/30 border border-teal-400/50 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-white/80 flex-1 pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2 flex-col sm:flex-row">
          {platform === 'android' && deferredPrompt && (
            <Button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 active:from-teal-700 active:to-cyan-700 text-white font-bold rounded-full py-3 gap-2 shadow-lg text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              Instalar Ahora
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full py-3 font-bold text-sm sm:text-base"
          >
            {platform === 'ios' ? 'Más tarde' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </div>
  );
}