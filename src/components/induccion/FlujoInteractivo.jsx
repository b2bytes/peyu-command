import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, RotateCcw, PartyPopper } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// FlujoInteractivo — Paso a paso interactivo para la inducción de founders.
// Se avanza opción por opción: cada paso se muestra solo, se marca como
// hecho y el progreso queda guardado en localStorage (sobrevive recargas).
// ════════════════════════════════════════════════════════════════════════
export default function FlujoInteractivo({ flujo }) {
  const storageKey = `peyu_induccion_v1_${flujo.id}`;
  const total = flujo.pasos.length;

  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState([]);

  // Hidratar progreso guardado
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved) {
        setCurrent(Math.min(saved.current || 0, total - 1));
        setDone(Array.isArray(saved.done) ? saved.done : []);
      }
    } catch (_) { /* sin progreso guardado */ }
  }, [storageKey, total]);

  const save = (nextCurrent, nextDone) => {
    setCurrent(nextCurrent);
    setDone(nextDone);
    try { localStorage.setItem(storageKey, JSON.stringify({ current: nextCurrent, done: nextDone })); } catch (_) {}
  };

  const marcarHecho = () => {
    const nextDone = done.includes(current) ? done : [...done, current];
    const nextCurrent = current < total - 1 ? current + 1 : current;
    save(nextCurrent, nextDone);
  };

  const reset = () => save(0, []);

  const completado = done.length >= total;
  const paso = flujo.pasos[current];
  const pct = Math.round((done.length / total) * 100);

  return (
    <div className="ld-card p-4 sm:p-5">
      {/* Header del flujo + progreso */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl leading-none">{flujo.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-jakarta font-bold text-base text-ld-fg leading-snug">{flujo.titulo}</h3>
            <p className="text-sm text-ld-fg-muted mt-0.5">{flujo.intro}</p>
          </div>
        </div>
        {done.length > 0 && (
          <button onClick={reset} title="Reiniciar flujo" className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-subtle hover:text-ld-fg transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex-1 h-1.5 rounded-full bg-ld-bg-elevated overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--ld-grad-action)' }} />
        </div>
        <span className="text-[11px] font-bold text-ld-fg-muted flex-shrink-0">{done.length}/{total}</span>
      </div>

      {/* Pills de pasos — clickeables, scroll horizontal en móvil */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {flujo.pasos.map((p, i) => {
          const isDone = done.includes(i);
          const isActive = i === current;
          return (
            <button
              key={i}
              onClick={() => save(i, done)}
              title={p.titulo}
              className={`flex-shrink-0 h-8 min-w-8 px-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                isActive ? 'text-white scale-105' : isDone ? 'text-ld-action' : 'text-ld-fg-muted hover:text-ld-fg'
              }`}
              style={{
                background: isActive ? 'var(--ld-action)' : isDone ? 'var(--ld-action-soft)' : 'var(--ld-bg-elevated)',
                border: '1px solid var(--ld-border)',
              }}
            >
              {isDone && !isActive ? <Check className="w-3.5 h-3.5" /> : i + 1}
              {isActive && <span className="hidden sm:inline max-w-[140px] truncate font-semibold">{p.titulo}</span>}
            </button>
          );
        })}
      </div>

      {/* Paso actual o cierre */}
      {completado && current === total - 1 && done.includes(current) ? (
        <div className="mt-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--ld-action-soft)', border: '1px solid var(--ld-border)' }}>
          <PartyPopper className="w-6 h-6 flex-shrink-0 text-ld-action" />
          <div>
            <p className="font-bold text-sm text-ld-fg">¡Flujo dominado!</p>
            <p className="text-xs text-ld-fg-muted">Completaste los {total} pasos. Puedes reiniciarlo cuando quieras repasarlo.</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--ld-bg-elevated)', border: '1px solid var(--ld-border)' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-ld-fg-subtle mb-1">Paso {current + 1} de {total}</p>
          <p className="font-semibold text-sm text-ld-fg leading-snug">{paso.titulo}</p>
          <p className="text-[13px] text-ld-fg-muted leading-relaxed mt-1.5">{paso.detalle}</p>
          {paso.ruta && (
            <Link to={paso.ruta} className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-ld-action hover:underline">
              Abrir el módulo de este paso <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Controles */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => save(Math.max(0, current - 1), done)}
          disabled={current === 0}
          className="ld-btn-ghost h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Anterior
        </button>
        <button
          onClick={marcarHecho}
          className="ld-btn-primary flex-1 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          {current === total - 1 ? 'Marcar hecho y terminar' : 'Hecho, siguiente paso'}
          {current < total - 1 && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}