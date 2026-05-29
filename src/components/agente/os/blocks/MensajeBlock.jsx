// ============================================================================
// PEYU OS · MensajeBlock
// Mensaje al cliente declarado por el LLM. Preview editable (asunto + cuerpo)
// y un botón que envía vía WhatsApp (wa.me) o email (Core.SendEmail).
// ============================================================================
import { useState } from 'react';
import { Send, Loader2, CheckCircle2, MessageCircle, Mail } from 'lucide-react';

export default function MensajeBlock({ mensaje, onEnviar }) {
  const [asunto, setAsunto] = useState(mensaje?.asunto || '');
  const [cuerpo, setCuerpo] = useState(mensaje?.cuerpo || '');
  const [estado, setEstado] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!mensaje?.canal || !mensaje?.destino) return null;

  const esEmail = mensaje.canal === 'email';

  const handleSend = async () => {
    if (estado === 'loading' || estado === 'done') return;
    setEstado('loading');
    try {
      await onEnviar({ ...mensaje, asunto, cuerpo });
      setEstado('done');
    } catch (e) {
      setErrorMsg(e?.message || 'No se pudo enviar el mensaje');
      setEstado('error');
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#e7d8c6] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${esEmail ? 'bg-[#0F8B6C]/10 text-[#0F8B6C]' : 'bg-[#25D366]/15 text-[#128C7E]'}`}>
          {esEmail ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#22302c] truncate">
            {mensaje.etiqueta || (esEmail ? 'Enviar email' : 'Enviar WhatsApp')}
          </p>
          <p className="text-[11px] text-[#9aa6a0] truncate">{mensaje.destino}</p>
        </div>
      </div>

      {esEmail && (
        <input
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto"
          className="w-full mb-2 px-3 py-2 rounded-xl border border-[#ece4d8] bg-[#fbfaf7] text-sm text-[#22302c] outline-none focus:border-[#0F8B6C]/50"
        />
      )}

      <textarea
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        rows={4}
        placeholder="Mensaje…"
        className="w-full mb-3 px-3 py-2 rounded-xl border border-[#ece4d8] bg-[#fbfaf7] text-sm text-[#22302c] outline-none focus:border-[#0F8B6C]/50 resize-none peyu-scrollbar"
      />

      {estado === 'done' ? (
        <div className="flex items-center gap-2 text-sm font-medium text-[#0F8B6C]">
          <CheckCircle2 className="w-4 h-4" /> {esEmail ? 'Email enviado' : 'WhatsApp abierto'}
        </div>
      ) : (
        <button
          onClick={handleSend}
          disabled={estado === 'loading' || !cuerpo.trim()}
          className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white transition-colors disabled:opacity-50"
        >
          {estado === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {esEmail ? 'Enviar email' : 'Enviar WhatsApp'}
        </button>
      )}

      {estado === 'error' && <p className="text-xs text-[#D96B4D] mt-2">{errorMsg}</p>}
    </div>
  );
}