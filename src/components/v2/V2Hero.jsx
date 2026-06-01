import { useState } from 'react';
import { Sparkles, Send, Leaf, MapPin } from 'lucide-react';
import PEYULogo from '@/components/PEYULogo';
import V2ModeToggle from './V2ModeToggle';

const QUICK = [
  'Cachos para 50 personas con mi logo',
  'Regalo de escritorio sustentable',
  'Algo para el hogar bajo $25.000',
];

// Hero corto /v2: identidad Peyu + barra conversacional + toggle modo.
export default function V2Hero({ mode, onModeChange, onAsk }) {
  const [text, setText] = useState('');

  const send = (val) => {
    const q = (val ?? text).trim();
    if (!q) return;
    onAsk?.(q);
    setText('');
  };

  return (
    <header className="px-4 pt-5 pb-6 sm:pt-8 sm:pb-10 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-7">
        <PEYULogo size="sm" forceInvert={true} />
        <V2ModeToggle mode={mode} onChange={onModeChange} />
      </div>

      {/* Identidad */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="v2-badge-eco inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold">
          <Leaf className="w-3 h-3" /> Plástico 100% reciclado
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold v2-chip">
          <MapPin className="w-3 h-3" /> Hecho en Chile
        </span>
      </div>

      <h1 className="v2-display text-3xl sm:text-5xl mb-2" style={{ color: 'var(--v2-fg)' }}>
        Regalos que <span className="v2-display-italic" style={{ color: 'var(--v2-gold)' }}>cuidan el planeta</span>
      </h1>
      <p className="text-sm sm:text-base mb-5 max-w-xl" style={{ color: 'var(--v2-fg-soft)' }}>
        Cuéntale a Peyu IA qué buscas y te mostramos el regalo perfecto — personal o para tu empresa.
      </p>

      {/* Barra conversacional */}
      <div className="v2-input flex items-center gap-2 pl-4 pr-1.5 py-1.5 max-w-xl">
        <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--v2-gold)' }} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ej: quiero cachos para 50 personas con mi logo…"
          className="flex-1 bg-transparent border-0 outline-none text-sm h-10"
          style={{ color: 'var(--v2-fg)' }}
        />
        <button onClick={() => send()} className="v2-btn-primary w-10 h-10 flex items-center justify-center flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mt-3 max-w-xl">
        {QUICK.map((q) => (
          <button key={q} onClick={() => send(q)} className="v2-chip px-3 py-1.5 text-[11px]">
            {q}
          </button>
        ))}
      </div>
    </header>
  );
}