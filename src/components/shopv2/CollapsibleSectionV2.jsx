import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// CollapsibleSectionV2 — Checkout Shop v2. Tema Warm Clay 2027.
// Mobile-first: header compacto, contenido animado, tap target ≥ 44px.
// Soporta modo NO controlado (defaultOpen) y CONTROLADO (open + onToggle):
// en móvil el checkout abre solo el paso activo y auto-avanza al completar,
// reduciendo el scroll y acelerando el flujo.
export default function CollapsibleSectionV2({
  step, title, subtitle, complete = false, summary, defaultOpen = false, children,
  open: openProp, onToggle,
}) {
  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = isControlled ? openProp : openState;

  // En modo no controlado, sincroniza si defaultOpen cambia (responsive).
  useEffect(() => {
    if (!isControlled) setOpenState(defaultOpen);
  }, [defaultOpen, isControlled]);

  const toggle = () => {
    if (isControlled) onToggle?.(!open);
    else setOpenState((o) => !o);
  };

  return (
    <section
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1.5px solid #D4C4B0', boxShadow: '0 2px 12px rgba(44,24,16,.05)' }}
    >
      {/* Header — tap target mínimo 52px en mobile */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 sm:p-5 text-left transition-colors"
        style={{ minHeight: 52, background: 'white' }}
        onMouseOver={e => e.currentTarget.style.background = '#FAF6F0'}
        onMouseOut={e => e.currentTarget.style.background = 'white'}
      >
        {/* Badge de paso */}
        <span
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 text-white"
          style={{
            background: complete
              ? 'linear-gradient(135deg,#8BAD8A,#5B7D5A)'
              : 'linear-gradient(135deg,#C0785C,#A86440)',
          }}
        >
          {complete ? <Check className="w-3.5 h-3.5" /> : step}
        </span>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <h2 className="font-fraunces text-base sm:text-lg leading-tight" style={{ color: '#2C1810' }}>
            {title}
          </h2>
          {!open && summary ? (
            <p className="text-[11px] font-semibold truncate mt-0.5" style={{ color: '#8BAD8A' }}>✓ {summary}</p>
          ) : subtitle ? (
            <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: '#A08070' }}>{subtitle}</p>
          ) : null}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#A08070' }}
        />
      </button>

      {/* Contenido con animación simple */}
      <div
        style={{
          maxHeight: open ? 2000 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div className="px-4 pb-5 sm:px-6 sm:pb-6" style={{ borderTop: '1px solid #EDE3D6' }}>
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}