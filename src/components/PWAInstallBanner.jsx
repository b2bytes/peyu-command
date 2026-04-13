import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { PWA_UTILS } from '@/lib/pwa-utils';
import { Button } from '@/components/ui/button';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    // Check if already installed
    if (PWA_UTILS.isStandalone()) {
      return;
    }

    // Get platform
    const currentPlatform = PWA_UTILS.getPlatform();
    setPlatform(currentPlatform);

    // Check if should show banner
    if (!PWA_UTILS.showInstallBanner()) {
      return;
    }

    // iOS: Show immediately
    if (currentPlatform === 'ios') {
      setShowBanner(true);
      return;
    }

    // Android: Wait for beforeinstallprompt event
    if (currentPlatform === 'android') {
      const checkForPrompt = () => {
        if (window.pwaPrompt) {
          setDeferredPrompt(window.pwaPrompt);
          setShowBanner(true);
        }
      };

      // Check if already available
      checkForPrompt();

      // Listen for new prompts
      const handlePrompt = (e) => {
        e.preventDefault();
        window.pwaPrompt = e;
        setDeferredPrompt(e);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handlePrompt);
      return () => {
        window.removeEventListener('beforeinstallprompt', handlePrompt);
      };
    }
  }, []);

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

  // Android con beforeinstallprompt o iOS
  const canShowAndroidPrompt = platform === 'android' && deferredPrompt;
  const isIOS = platform === 'ios';

  if (!canShowAndroidPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-md border-t border-teal-500/30 p-3 sm:p-4 safe-bottom">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-lg">
              🐢
            </div>
            <div className="min-w-0">
              <h3 className="font-poppins font-bold text-white text-sm sm:text-base leading-tight">
                Instalar PEYU
              </h3>
              <p className="text-white/70 text-xs leading-tight mt-0.5">Acceso rápido • Offline • Notificaciones</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors active:bg-white/20 touch-target"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Instrucciones iOS */}
        {isIOS && (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-2.5 sm:p-3 mb-2.5 space-y-1.5">
            {instructions.steps.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-teal-500/40 border border-teal-400/60 flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px] mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-white/80 text-xs sm:text-sm leading-snug pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 flex-col xs:flex-row">
          {canShowAndroidPrompt && (
            <Button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 active:from-teal-700 active:to-cyan-700 text-white font-bold rounded-full py-2.5 sm:py-3 gap-2 shadow-lg text-xs sm:text-sm touch-target transition-all"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Instalar
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 border border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-full py-2.5 sm:py-3 font-bold text-xs sm:text-sm touch-target transition-all"
          >
            {isIOS ? 'Ahora no' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </div>
  );
}