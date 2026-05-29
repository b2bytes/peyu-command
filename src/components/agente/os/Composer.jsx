// ============================================================================
// PEYU OS · Composer flotante (fijo abajo del canvas)
// Mini-avatares de los 4 agentes + input + enviar.
// ============================================================================
import { Send, Loader2 } from 'lucide-react';
import { SUB_AGENTES } from './helpers';
import TemplatePicker from './TemplatePicker';

export default function Composer({ value, onChange, onSend, loading }) {
  return (
    <div className="px-3 sm:px-6 pb-4 pt-2">
      <div className="max-w-[880px] mx-auto">
        <div className="flex items-end gap-2 rounded-2xl bg-white border border-[#e7d8c6] shadow-[0_4px_24px_-12px_rgba(34,48,44,0.25)] p-2 pl-3 focus-within:border-[#0F8B6C]/50 transition-colors">
          {/* Mini avatares de agentes */}
          <div className="hidden sm:flex -space-x-1.5 items-center pb-1.5">
            {SUB_AGENTES.map((a) => (
              <span
                key={a.id}
                title={a.label}
                className="w-7 h-7 rounded-full bg-[#f6f1ea] border-2 border-white flex items-center justify-center text-xs"
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
            placeholder="Habla con Peyu — la pantalla se arma sola"
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-[#22302c] placeholder:text-[#9aa6a0] py-2 max-h-32 min-w-0 font-inter"
            style={{ lineHeight: '1.5' }}
          />

          <button
            onClick={onSend}
            disabled={loading || !value.trim()}
            className="w-10 h-10 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] flex items-center justify-center text-white transition-colors disabled:opacity-30 flex-shrink-0"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-[#9aa6a0] mt-2 text-center">
          Hasta que el plástico deje de ser basura · Contexto CRM completo · Solo admin
        </p>
      </div>
    </div>
  );
}