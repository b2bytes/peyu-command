import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

// ════════════════════════════════════════════════════════════════════════
// ChatCardShell · Chasis único de las cards del Agente (nivel agencia).
// ----------------------------------------------------------------------------
// Problema que resuelve: cada card volcaba una lista plana e interminable en el
// río del chat, así que la conversación se volvía ilegible y el dato importante
// quedaba enterrado. Este chasis impone una jerarquía de lectura:
//   1. Titular + conteo    → de qué estamos hablando
//   2. Cifras clave        → el resumen que el fundador necesita de un vistazo
//   3. Top 3 accionable    → lo urgente, siempre visible
//   4. El resto, plegado   → "ver N más" con scroll propio, nunca estira el chat
//
// Así la card ocupa un alto FIJO y predecible en la conversación, sin importar
// si hay 3 registros o 300.
// ════════════════════════════════════════════════════════════════════════
export default function ChatCardShell({
  icon: Icon,
  title,
  subtitle,
  count,
  metrics = [],          // [{ label, value, tone? }] · tone: 'accent' | 'warn'
  items = [],
  renderItem,
  previewCount = 3,
  emptyText = 'Sin registros.',
  linkTo,
  linkLabel = 'Ver todo',
  footer,
}) {
  const [abierto, setAbierto] = useState(false);
  const visibles = abierto ? items : items.slice(0, previewCount);
  const restantes = items.length - visibles.length;

  return (
    <div className="ld-glass rounded-2xl overflow-hidden">
      {/* ── Cabecera: identidad + conteo + salida al módulo completo ──── */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-ld-border">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-ld-action" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-ld-fg truncate">{title}</span>
              {count != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-ld-bg-soft text-ld-fg-muted tabular-nums">
                  {count}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-ld-fg-muted truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="text-[11px] font-semibold text-ld-action hover:underline flex items-center gap-0.5 flex-shrink-0 mt-0.5"
          >
            {linkLabel} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* ── Cifras clave: el resumen antes del detalle ──────────────────── */}
      {metrics.length > 0 && (
        <div className="grid gap-px bg-ld-border" style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0,1fr))` }}>
          {metrics.map((m) => (
            <div key={m.label} className="bg-ld-bg-elevated px-3 py-2.5">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-ld-fg-subtle truncate">{m.label}</p>
              <p
                className={`text-[15px] font-bold tabular-nums leading-tight mt-0.5 ${
                  m.tone === 'accent' ? 'text-ld-action' : m.tone === 'warn' ? 'text-ld-highlight' : 'text-ld-fg'
                }`}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Detalle: top accionable + resto plegado con scroll propio ───── */}
      <div className="p-3">
        {items.length === 0 ? (
          <p className="text-[12.5px] text-ld-fg-muted px-1 py-1.5">{emptyText}</p>
        ) : (
          <>
            <div className={abierto ? 'space-y-1.5 max-h-72 overflow-y-auto peyu-scrollbar pr-1' : 'space-y-1.5'}>
              {visibles.map((item, i) => renderItem(item, i))}
            </div>
            {(restantes > 0 || abierto) && (
              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                className="w-full mt-2 h-8 rounded-lg text-[11px] font-bold text-ld-fg-muted hover:text-ld-fg hover:bg-ld-bg-soft transition-colors flex items-center justify-center gap-1"
              >
                {abierto ? (
                  <><ChevronDown className="w-3 h-3 rotate-180" /> Mostrar solo lo urgente</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Ver {restantes} más</>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {footer && <div className="px-4 pb-3.5 -mt-1">{footer}</div>}
    </div>
  );
}