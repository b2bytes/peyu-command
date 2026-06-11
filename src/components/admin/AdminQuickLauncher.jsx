import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { searchModules } from '@/lib/admin-modules';

// ════════════════════════════════════════════════════════════════════════
// AdminQuickLauncher — Buscador rápido global del admin (Ctrl/Cmd + K).
// Escribe el nombre o lo que quieres hacer ("etiqueta", "stock", "caja")
// y salta directo al módulo. Navegable con flechas + Enter.
// Colores fijos (siempre oscuro) para ser legible en ambos modos.
// ════════════════════════════════════════════════════════════════════════
export default function AdminQuickLauncher({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => searchModules(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const go = (mod) => {
    onClose();
    navigate(mod.ruta);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) go(results[active]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="¿Qué quieres hacer? (ej: etiqueta, stock, caja, leads…)"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-white/40">Sin resultados para "{query}"</p>
          ) : (
            results.map((m, i) => (
              <button
                key={m.ruta}
                onClick={() => go(m)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === active ? 'bg-teal-500/15' : ''
                }`}
              >
                <span className="text-base flex-shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.nombre}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">{m.grupo}</p>
                </div>
                {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 text-[10px] text-white/35">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>esc cerrar</span>
        </div>
      </div>
    </div>
  );
}