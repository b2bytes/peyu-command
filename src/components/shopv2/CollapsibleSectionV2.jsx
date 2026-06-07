import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// CollapsibleSectionV2 — Checkout Shop v2. Tema Warm Clay 2027.
export default function CollapsibleSectionV2({
  step, title, subtitle, complete = false, summary, defaultOpen = false, children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-white rounded-3xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0', boxShadow: '0 2px 12px rgba(44,24,16,.06)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-5 text-left transition-colors"
        style={{ background: open ? 'white' : undefined }}
        onMouseOver={e => e.currentTarget.style.background = '#FAF6F0'}
        onMouseOut={e => e.currentTarget.style.background = 'white'}
      >
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
          style={{ background: complete ? 'linear-gradient(135deg,#8BAD8A,#5B7D5A)' : 'linear-gradient(135deg,#C0785C,#A86440)' }}
        >
          {complete ? <Check className="w-4 h-4" /> : step}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-fraunces text-lg leading-tight" style={{ color: '#2C1810' }}>{title}</h2>
          {!open && summary ? (
            <p className="text-xs font-semibold truncate mt-0.5" style={{ color: '#8BAD8A' }}>✓ {summary}</p>
          ) : subtitle ? (
            <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#A08070' }}
        />
      </button>
      {open && (
        <div className="px-5 pb-6 sm:px-6" style={{ borderTop: '1px solid #EDE3D6' }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </section>
  );
}