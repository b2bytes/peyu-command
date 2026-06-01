// ============================================================================
// PEYU OS · Composer flotante (fijo abajo del canvas) — Command Cockpit (sage)
// Mini-avatares de los 4 agentes + input + enviar. Tema oscuro sage cálido.
// ============================================================================
import { Send, Loader2, Mic, Square } from 'lucide-react';
import { SUB_AGENTES } from './helpers';
import TemplatePicker from './TemplatePicker';

export default function Composer({ value, onChange, onSend, loading, grabando, procesando, onMicStart, onMicStop }) {
  const micActivo = grabando || procesando;
  return (
    <div className="px-3 sm:px-6 pb-4 pt-2">
      <div className="max-w-[880px] mx-auto">
        {(grabando || procesando) && (
          <div className="flex items-center justify-center gap-2 mb-2 text-xs font-medium text-[#3dd9b0]">
            {grabando ? (
              <>
                <span className="flex gap-0.5 items-center">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="w-1 bg-[#3dd9b0] rounded-full animate-pulse" style={{ height: `${8 + (i % 2) * 8}px`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </span>
                Escuchándote… toca el cuadrado para enviar
              </>
            ) : (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribiendo tu audio…</>
            )}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl bg-[#10231d]/90 border border-[#2a4a40] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl p-2 pl-3 focus-within:border-[#0F8B6C]/70 transition-colors">
          {/* Mini avatares de agentes */}
          <div className="hidden sm:flex -space-x-1.5 items-center pb-1.5">
            {SUB_AGENTES.map((a) => (
              <span
                key={a.id}
                title={a.label}
                className="w-7 h-7 rounded-full bg-[#1a3329] border-2 border-[#10231d] flex items-center justify-center text-xs"
              >
                {a.emoji}
              </span>
            ))}
          </div>

          <TemplatePicker onPick={(prompt) => onChange(value ? `${value}\n${prompt}` : prompt)} />

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Pregúntale algo a tu negocio…"
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-[#eaf5f0] placeholder:text-[#6f8f83] py-2 max-h-32 min-w-0 font-inter"
            style={{ lineHeight: '1.5' }}
          />

          {/* Micrófono: voz-a-voz. Si hay texto escrito, prioriza enviar. */}
          {!value.trim() && (
            <button
              onClick={grabando ? onMicStop : onMicStart}
              disabled={loading || procesando}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-30 ${
                grabando
                  ? 'bg-[#D96B4D] hover:bg-[#c25a3e] text-white'
                  : 'bg-[#1a3329] hover:bg-[#234539] text-[#9fc7b8]'
              }`}
              aria-label={grabando ? 'Detener y enviar' : 'Hablar'}
            >
              {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : grabando ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={onSend}
            disabled={loading || !value.trim() || micActivo}
            className="w-10 h-10 rounded-xl bg-[#0F8B6C] hover:bg-[#14b894] flex items-center justify-center text-white transition-colors disabled:opacity-30 flex-shrink-0"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-[#6f8f83] mt-2 text-center">
          Hasta que el plástico deje de ser basura · Contexto CRM completo · Solo admin
        </p>
      </div>
    </div>
  );
}