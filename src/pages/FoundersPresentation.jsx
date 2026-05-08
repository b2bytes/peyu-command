import { useState, useMemo } from 'react';
import { FOUNDERS_LAYOUTS, ROUND_INFO } from '@/lib/founders-layouts';
import LayoutCard from '@/components/founders/LayoutCard';
import LayoutPreviewModal from '@/components/founders/LayoutPreviewModal';
import { Sparkles, Filter, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Presentación a fundadores: 22 layouts del design system PEYU 2026.
 * Permite filtrar por ronda, ver detalle, marcar shortlist en localStorage.
 */
const STORAGE_KEY = 'peyu-founders-shortlist';

const loadShortlist = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export default function FoundersPresentation() {
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const [shortlist, setShortlist] = useState(loadShortlist);

  const rounds = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    FOUNDERS_LAYOUTS.forEach((l) => {
      counts[l.round] = (counts[l.round] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredLayouts = useMemo(() => {
    if (filter === 'all') return FOUNDERS_LAYOUTS;
    if (filter === 'shortlist') return FOUNDERS_LAYOUTS.filter((l) => shortlist.includes(l.id));
    return FOUNDERS_LAYOUTS.filter((l) => l.round === parseInt(filter));
  }, [filter, shortlist]);

  const toggleSelect = (id) => {
    const next = shortlist.includes(id) ? shortlist.filter((x) => x !== id) : [...shortlist, id];
    setShortlist(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-amber-50/40">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-slate-200/70 bg-white/60 backdrop-blur-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-300/20 rounded-full blur-[100px]" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-300/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Presentación fundadores
            </span>
            <span className="text-xs text-slate-500 font-mono">PEYU · Mayo 2026</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold font-jakarta text-slate-900 leading-[1.05] mb-4 tracking-tight">
            Design System{' '}
            <span className="italic" style={{ fontFamily: 'serif' }}>
              PEYU 2026
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-700 max-w-3xl leading-relaxed">
            <strong>{FOUNDERS_LAYOUTS.length} propuestas visuales</strong> para evolucionar la cohesión digital de PEYU
            (desktop + móvil). Cada propuesta tiene un mecanismo de conversión distinto validado para B2C y B2B en 2026.
            Recórralas, abran cada una y armen su shortlist.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 mt-6 text-sm">
            <div>
              <p className="text-2xl font-bold font-jakarta text-slate-900">{FOUNDERS_LAYOUTS.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Layouts totales</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-2xl font-bold font-jakarta text-emerald-700">+31%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">CVR AI-traffic (Adobe 2026)</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-2xl font-bold font-jakarta text-amber-700">+59%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Growth con shopping agent</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-2xl font-bold font-jakarta text-rose-600 flex items-center gap-1">
                <Heart className="w-5 h-5 fill-rose-600" /> {shortlist.length}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">En shortlist</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Todas <span className="opacity-60 ml-1">{FOUNDERS_LAYOUTS.length}</span>
          </FilterChip>
          {[1, 2, 3, 4].map((r) => (
            <FilterChip key={r} active={filter === String(r)} onClick={() => setFilter(String(r))}>
              {ROUND_INFO[r].name} <span className="opacity-60 ml-1">{rounds[r]}</span>
            </FilterChip>
          ))}
          {shortlist.length > 0 && (
            <FilterChip
              active={filter === 'shortlist'}
              onClick={() => setFilter('shortlist')}
              variant="rose"
            >
              <Heart className="w-3.5 h-3.5 inline mr-1 fill-current" /> Shortlist {shortlist.length}
            </FilterChip>
          )}
        </div>
      </div>

      {/* Round descripción */}
      {filter !== 'all' && filter !== 'shortlist' && ROUND_INFO[filter] && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-100 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 mb-1">
              Ronda {filter} · {ROUND_INFO[filter].name}
            </p>
            <p className="text-slate-800 font-medium">{ROUND_INFO[filter].desc}</p>
          </div>
        </div>
      )}

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {filteredLayouts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p>Aún no hay layouts en tu shortlist.</p>
            <button
              onClick={() => setFilter('all')}
              className="mt-3 text-emerald-700 font-semibold hover:underline"
            >
              Ver todas las propuestas →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredLayouts.map((layout, i) => (
              <LayoutCard
                key={layout.id}
                layout={layout}
                index={FOUNDERS_LAYOUTS.indexOf(layout)}
                selected={shortlist.includes(layout.id)}
                onToggleSelect={toggleSelect}
                onPreview={setPreview}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200/70 mt-12">
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 md:p-12 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-emerald-300" />
          <h2 className="text-3xl md:text-4xl font-bold font-jakarta mb-3">¿Listos para decidir?</h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-6">
            Una vez que tengan la(s) propuesta(s) favorita(s) en su shortlist, avísenle al equipo y arrancamos la
            implementación: tokens de diseño, componentes base y aplicación a /shop, /producto y /cart en desktop+móvil.
          </p>
          {shortlist.length > 0 ? (
            <button
              onClick={() => setFilter('shortlist')}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              Ver shortlist ({shortlist.length}) <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-emerald-200 text-sm">👆 Marquen sus favoritas usando el botón "+ Añadir a shortlist"</p>
          )}
          <p className="mt-8 text-xs text-white/40 font-mono">
            <Link to="/" className="hover:text-emerald-300 underline">
              ← Volver a la home actual de PEYU
            </Link>
          </p>
        </div>
      </footer>

      {/* Modal preview */}
      <LayoutPreviewModal
        layout={preview}
        onClose={() => setPreview(null)}
        onToggleSelect={toggleSelect}
        selected={preview && shortlist.includes(preview.id)}
      />
    </div>
  );
}

function FilterChip({ active, onClick, children, variant = 'emerald' }) {
  const activeCls =
    variant === 'rose'
      ? 'bg-rose-500 text-white shadow-md'
      : 'bg-slate-900 text-white shadow-md';
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0 ${
        active ? activeCls : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
      }`}
    >
      {children}
    </button>
  );
}