import { useState } from 'react';
import { Package, Search, ArrowRight } from 'lucide-react';

// Card de seguimiento dentro del río del chat → enlaza al flujo existente.
export default function CardOrderStatus() {
  const [q, setQ] = useState('');
  const go = () => {
    const url = q.trim() ? `/seguimiento?q=${encodeURIComponent(q.trim())}` : '/seguimiento';
    window.location.href = url;
  };
  return (
    <div className="v2-card v2-fade-up p-4 w-full max-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4" style={{ color: 'var(--v2-teal)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Seguir mi pedido</p>
      </div>
      <div className="v2-input flex items-center gap-2 pl-3 pr-1.5 py-1.5">
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--v2-fg-muted)' }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder="N° de pedido o email"
          className="flex-1 bg-transparent border-0 outline-none text-xs h-8"
          style={{ color: 'var(--v2-fg)' }}
        />
        <button onClick={go} className="v2-btn-primary w-8 h-8 flex items-center justify-center flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}