import { useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

const CHIPS = ['Ventas de hoy', 'Pedidos pendientes', 'Stock bajo', 'Cotizaciones B2B'];

// Barra de comando fija abajo: chips de sugerencias + textarea + enviar.
export default function CommandBar({ value, onChange, onSend, onChip, loading }) {
  const ref = useRef(null);

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

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-ld-bg to-transparent">
      <div className="max-w-[820px] mx-auto">
        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => onChip(c)}
              disabled={loading}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ld-glass rounded-2xl flex items-end gap-2 p-2 pl-4">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregúntale a Peyu… (ej: ¿cuánto vendimos hoy?)"
            className="flex-1 bg-transparent resize-none outline-none text-sm text-ld-fg placeholder:text-ld-fg-muted py-1.5 max-h-[140px] peyu-scrollbar"
          />
          <button
            onClick={onSend}
            disabled={loading || !value.trim()}
            className="ld-btn-primary w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}