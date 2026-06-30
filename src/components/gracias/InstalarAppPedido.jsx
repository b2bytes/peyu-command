import { useEffect, useState } from 'react';
import { Smartphone, Bell, Package, Share, Plus, X, Download } from 'lucide-react';
import { PWA_UTILS } from '@/lib/pwa-utils';

// ════════════════════════════════════════════════════════════════════════
// InstalarAppPedido — Bloque post-compra (SOLO móvil) que invita a instalar
// la PWA de PEYU para seguir el pedido desde el celular y recibir avisos.
// Es el momento de máxima intención (acaba de comprar), así que el copy es
// contextual al pedido, no genérico.
//
// - Android: usa el evento beforeinstallprompt → install nativo en 1 toque.
// - iOS: muestra instrucciones (Compartir → Agregar a pantalla de inicio).
// - No aparece en desktop ni si la app ya está instalada (standalone).
// - Si lo cierran, no vuelve a aparecer (localStorage).
// ════════════════════════════════════════════════════════════════════════

const DISMISS_KEY = 'pwa-gracias-dismissed';

export default function InstalarAppPedido({ numero }) {
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const platform = PWA_UTILS.getPlatform();
  const isMobile = platform === 'ios' || platform === 'android';

  useEffect(() => {
    // No mostrar: en desktop, si ya está instalada, o si lo cerraron antes.
    if (!isMobile) return;
    if (PWA_UTILS.isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch { /* noop */ }

    setVisible(true);

    // Android: captura el prompt nativo de instalación.
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isMobile]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
    setVisible(false);
  };

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIosSteps((s) => !s);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') dismiss();
    } else {
      // Android sin prompt disponible: mostramos los pasos del menú del navegador.
      setShowIosSteps((s) => !s);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="mt-6 rounded-3xl p-6 sm:p-7 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 12px 32px -10px rgba(15,139,108,.45)' }}
    >
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90"
        style={{ background: 'rgba(255,255,255,.15)' }}
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div className="relative text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.18)' }}>
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#A7D9C9' }}>Lleva PEYU contigo</p>
            <h3 className="font-fraunces text-xl leading-tight">Instala la app y sigue tu pedido</h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,.9)' }}>
          Agrega PEYU a tu pantalla de inicio y sigue {numero ? <strong>el pedido {numero}</strong> : 'tu pedido'} con un toque,
          recibe avisos de despacho y entrega, y compra más rápido la próxima vez.
        </p>

        {/* Beneficios */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            [Package, 'Sigue tu pedido'],
            [Bell, 'Avisos de envío'],
            [Smartphone, 'Acceso 1 toque'],
          ].map(([Icon, label], i) => (
            <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,.12)' }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: '#A7D9C9' }} />
              <p className="text-[10px] font-semibold leading-tight">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleInstall}
          className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[.98]"
          style={{ background: 'white', color: '#0B6E55' }}
        >
          {platform === 'ios' ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {platform === 'ios' ? 'Cómo instalar en iPhone' : 'Instalar app PEYU'}
        </button>

        {/* Pasos iOS / fallback Android */}
        {showIosSteps && (
          <div className="mt-4 rounded-2xl p-4 space-y-2.5 text-sm" style={{ background: 'rgba(255,255,255,.14)' }}>
            {platform === 'ios' ? (
              <>
                <Paso n="1" texto={<>Toca <Share className="w-3.5 h-3.5 inline -mt-0.5" /> <strong>Compartir</strong> abajo en Safari</>} />
                <Paso n="2" texto={<>Elige <Plus className="w-3.5 h-3.5 inline -mt-0.5" /> <strong>Agregar a pantalla de inicio</strong></>} />
                <Paso n="3" texto={<>Confirma <strong>Agregar</strong> y abre PEYU desde tu inicio 🐢</>} />
              </>
            ) : (
              <>
                <Paso n="1" texto={<>Abre el menú <strong>⋮</strong> del navegador</>} />
                <Paso n="2" texto={<>Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla de inicio</strong></>} />
                <Paso n="3" texto={<>Confirma y abre PEYU desde tu inicio 🐢</>} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Paso({ n, texto }) {
  return (
    <div className="flex items-start gap-2.5 text-white">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'rgba(255,255,255,.25)' }}>{n}</span>
      <span className="leading-snug" style={{ color: 'rgba(255,255,255,.95)' }}>{texto}</span>
    </div>
  );
}