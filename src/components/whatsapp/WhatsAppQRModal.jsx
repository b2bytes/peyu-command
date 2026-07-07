import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Smartphone, AlertTriangle, QrCode, Loader2 } from 'lucide-react';

// Modal de conexión WhatsApp: abre el link de activación de Base44, que
// redirige a WhatsApp con un mensaje pre-escrito + código de activación.
// El usuario solo envía ese mensaje y el agente queda conectado respondiendo
// desde el número que Base44 le asignó al agente.
//
// ⚠️ Los agentes in-app de Base44 reciben su PROPIO número de WhatsApp (asignado
// automáticamente). No se puede usar el número de WhatsApp existente de la tienda.
export default function WhatsAppQRModal({ url, errorDetail, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const validUrl = typeof url === 'string' && url.startsWith('http');
  // QR generado desde la URL de Base44 — al escanearlo con la cámara del
  // teléfono, abre la página de conexión que tiene el botón "Abrir en WhatsApp".
  const qrSrc = validUrl && showQR
    ? `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=16&ecc=M&data=${encodeURIComponent(url)}`
    : null;

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="ld-glass-strong rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header verde WhatsApp */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)' }}>
          <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white">Conectar WhatsApp</h3>
            <p className="text-[11px] text-white/80">Activa el agente Peyu 🐢</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-white" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {!validUrl ? (
            <div className="w-full space-y-2">
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                No se pudo generar el link de conexión. Intenta refrescar la página.
              </div>
              {errorDetail && (
                <p className="text-[11px] text-ld-fg-muted break-all bg-ld-bg-soft border border-ld-border rounded-xl px-3 py-2">
                  Detalle técnico: {errorDetail}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Info: el agente usa su propio número asignado por Base44 */}
              <div className="w-full flex items-start gap-2 text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                <span>El agente usa un <b>número propio asignado por Base44</b>. Al conectarte, enviarás un mensaje de activación y el agente quedará respondiendo desde ese número automáticamente.</span>
              </div>

              {/* PASO 1: Botón principal — abre el link de conexión */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir WhatsApp y activar
              </a>

              {/* Pasos */}
              <ol className="text-xs text-ld-fg-muted space-y-1.5 self-start w-full">
                <li className="flex gap-2"><span className="font-bold text-ld-fg-soft flex-shrink-0">1.</span> Toca <b>"Abrir WhatsApp y activar"</b></li>
                <li className="flex gap-2"><span className="font-bold text-ld-fg-soft flex-shrink-0">2.</span> Se abre WhatsApp con un mensaje pre-escrito + código</li>
                <li className="flex gap-2"><span className="font-bold text-ld-fg-soft flex-shrink-0">3.</span> <b>Envía ese mensaje</b> tal cual — no lo modifiques</li>
                <li className="flex gap-2"><span className="font-bold text-ld-fg-soft flex-shrink-0">4.</span> Listo 🐢 — el agente Peyu queda respondiendo 24/7</li>
              </ol>

              {/* Opción QR — para escanear desde otro dispositivo */}
              <div className="w-full pt-2 border-t border-ld-border">
                {!showQR ? (
                  <button
                    onClick={() => setShowQR(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ld-btn-ghost"
                  >
                    <QrCode className="w-4 h-4" />
                    Escanear desde otro teléfono (QR)
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white rounded-2xl shadow-inner border border-ld-border">
                      <img src={qrSrc} alt="QR de conexión WhatsApp" className="w-48 h-48 rounded-lg" />
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Escanea con la <b>cámara del teléfono</b>. Al abrirse, toca <b>"Abrir en WhatsApp"</b> y envía el mensaje de activación.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Link visible para copiar / compartir */}
              <div className="w-full px-3 py-2 rounded-xl bg-ld-bg-soft border border-ld-border">
                <p className="text-[10px] text-ld-fg-subtle font-bold uppercase mb-0.5">Link de conexión</p>
                <p className="text-[11px] text-ld-fg-muted break-all leading-snug">{url}</p>
              </div>

              <div className="w-full flex gap-2">
                <button
                  onClick={copy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold ld-btn-ghost"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar link'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}