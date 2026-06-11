import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Smartphone, AlertTriangle } from 'lucide-react';

// Modal de conexión rápida: muestra el link de conexión WhatsApp como QR para
// escanear con la CÁMARA del teléfono (no con el escáner interno de WhatsApp,
// que solo acepta QRs propios de WhatsApp y marca "código QR inválido").
export default function WhatsAppQRModal({ url, errorDetail, onClose }) {
  const [copied, setCopied] = useState(false);

  const validUrl = typeof url === 'string' && url.startsWith('http');
  // QR negro sobre blanco = máximo contraste y compatibilidad con cualquier lector.
  const qrSrc = validUrl
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
            <h3 className="text-sm font-bold text-white">Conectar tu WhatsApp</h3>
            <p className="text-[11px] text-white/80">Escanea con la cámara de tu teléfono</p>
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
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-ld-border">
                <img src={qrSrc} alt="QR para conectar WhatsApp" className="w-56 h-56 rounded-lg" />
              </div>

              {/* Aviso clave: usar la CÁMARA, no el escáner de WhatsApp */}
              <div className="w-full flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Escanea con la <b>cámara del teléfono</b> (o Google Lens). El escáner interno de WhatsApp dirá "código QR inválido" porque solo lee QRs propios de WhatsApp.</span>
              </div>

              <ol className="text-xs text-ld-fg-muted space-y-1 self-start">
                <li><span className="font-bold text-ld-fg-soft">1.</span> Abre la app de <b>Cámara</b> y apunta al QR</li>
                <li><span className="font-bold text-ld-fg-soft">2.</span> Toca el link que aparece — se abre el chat del agente Peyu 🐢</li>
                <li><span className="font-bold text-ld-fg-soft">3.</span> Envía el primer mensaje y listo — conectado</li>
              </ol>

              {/* Link visible para verificar / compartir manualmente */}
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
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: '#25D366' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir en WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}