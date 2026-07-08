import { useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Paperclip, Mic, Volume2, VolumeX, Pause, Play, X, FileText, Image as ImageIcon } from 'lucide-react';

// Accesos a TODOS los módulos del negocio desde la misma conversación:
// dashboard, pedidos, envíos Bluex, pipeline B2B, catálogo, clientes.
const CHIPS = [
  'Resumen del día',
  'Gestionar pedidos',
  'Editar catálogo',
  'Imagen por color',
  'Diseños láser',
  'Ventas de hoy',
  'Stock bajo',
  'Clientes',
];

// Barra de comando fija abajo: chips + adjuntos + voz + mic + textarea + enviar.
export default function CommandBar({
  value, onChange, onSend, onChip, loading,
  attachments = [], onAttach, onRemoveAttachment, uploading,
  voice,
}) {
  const ref = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 140) + 'px';
    }
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const speaking = voice?.speakingId != null;

  return (
    <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 pb-safe bg-gradient-to-t from-ld-bg to-transparent">
      <div className="max-w-[820px] mx-auto w-full">
        {/* Barra de voz activa: pausar / reanudar / detener a Joaquín */}
        {speaking && (
          <div className="flex items-center gap-2 mb-2 ld-glass rounded-full px-3 py-1.5 w-fit">
            <span className="flex gap-0.5 items-end h-3.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`w-0.5 rounded-full bg-ld-action ${voice.paused ? '' : 'animate-pulse'}`} style={{ height: `${6 + i * 4}px`, animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
            <span className="text-[11px] font-bold text-ld-fg-soft">Joaquín {voice.paused ? 'en pausa' : 'hablando…'}</span>
            <button onClick={voice.togglePause} className="p-2 sm:p-1 rounded-full hover:bg-ld-action-soft" title={voice.paused ? 'Reanudar' : 'Pausar'}>
              {voice.paused ? <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-ld-action" /> : <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-ld-action" />}
            </button>
            <button onClick={voice.stop} className="p-2 sm:p-1 rounded-full hover:bg-ld-highlight-soft" title="Detener">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--ld-highlight)' }} />
            </button>
          </div>
        )}

        {/* Adjuntos pendientes de enviar */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((a, i) => (
              <span key={i} className="ld-glass-soft inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-ld-fg-soft">
                {a.type?.startsWith('image') ? <ImageIcon className="w-3 h-3 text-ld-action" /> : <FileText className="w-3 h-3 text-ld-action" />}
                <span className="max-w-[140px] truncate">{a.name}</span>
                <button onClick={() => onRemoveAttachment(i)} className="hover:text-ld-fg"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Chips — 1 fila con scroll horizontal (no tapan el input en móvil) */}
        <div className="flex gap-2 pb-2.5 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => onChip(c)}
              disabled={loading}
              className="flex-shrink-0 whitespace-nowrap text-xs px-3 py-1.5 rounded-full ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ld-glass rounded-2xl flex items-end gap-2 sm:gap-1.5 p-2 pl-2">
          {/* Adjuntar documentos / imágenes */}
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.csv,.xlsx,.json,.txt" className="hidden"
            onChange={(e) => { onAttach(Array.from(e.target.files || [])); e.target.value = ''; }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-ld-fg-muted hover:text-ld-fg active:bg-ld-action-soft hover:bg-ld-action-soft transition-colors"
            title="Adjuntar documento o imagen"
            aria-label="Adjuntar documento o imagen"
          >
            {uploading ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Paperclip className="w-5 h-5 sm:w-4 sm:h-4" />}
          </button>

          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={voice?.listening ? 'Escuchando… habla ahora 🎙' : 'Pregúntale a Peyu… (ej: ¿cuánto vendimos hoy?)'}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-ld-fg placeholder:text-ld-fg-muted py-3 sm:py-1.5 max-h-[140px] peyu-scrollbar"
          />

          {/* Modo conversación por voz (auto-lee respuestas con Joaquín) */}
          <button
            onClick={() => voice?.setVoiceOn((v) => !v)}
            className={`w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${voice?.voiceOn ? 'bg-ld-action-soft text-ld-action' : 'text-ld-fg-muted hover:text-ld-fg active:bg-ld-action-soft hover:bg-ld-action-soft'}`}
            title={voice?.voiceOn ? 'Voz de Joaquín activada (auto-lee respuestas)' : 'Activar voz de Joaquín'}
            aria-label="Voz de Joaquín"
          >
            {voice?.voiceOn ? <Volume2 className="w-5 h-5 sm:w-4 sm:h-4" /> : <VolumeX className="w-5 h-5 sm:w-4 sm:h-4" />}
          </button>

          {/* Micrófono: dictar al agente */}
          <button
            onClick={() => voice?.startListening((t) => onChange(value ? `${value} ${t}` : t))}
            className={`w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${voice?.listening ? 'bg-red-500 text-white animate-pulse' : 'text-ld-fg-muted hover:text-ld-fg active:bg-ld-action-soft hover:bg-ld-action-soft'}`}
            title={voice?.listening ? 'Detener dictado' : 'Hablar al agente'}
            aria-label="Dictar por voz"
          >
            <Mic className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onSend}
            disabled={loading || uploading || (!value.trim() && attachments.length === 0)}
            className="ld-btn-primary w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <ArrowUp className="w-5 h-5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}