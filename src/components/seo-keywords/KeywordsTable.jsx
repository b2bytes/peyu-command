// ============================================================================
// KeywordsTable · Tabla ordenable de queries con filtro por bucket + buscador.
// Rediseño 2026: cards verticales en mobile, tabla en desktop. Fondo slate-900
// sólido, contraste AAA, tap-targets cómodos.
// ============================================================================
import { useState, useMemo } from 'react';
import { ExternalLink, ArrowUpDown, Search as SearchIcon, X } from 'lucide-react';

const BUCKET_BADGE = {
  top3:  'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  top10: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
  top20: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  top50: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  fondo: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
};
const BUCKET_LABEL = { top3: 'TOP 3', top10: 'P1', top20: 'P2', top50: '21-50', fondo: '+50' };

const BUCKET_FILTERS = [
  { k: 'all',   l: 'Todas' },
  { k: 'top3',  l: 'TOP 3' },
  { k: 'top10', l: 'Página 1' },
  { k: 'top20', l: 'Página 2' },
  { k: 'top50', l: '21-50' },
];

const SORT_OPTIONS = [
  { k: 'impressions', l: 'Impresiones' },
  { k: 'clicks',      l: 'Clicks' },
  { k: 'position',    l: 'Posición' },
  { k: 'ctr',         l: 'CTR' },
];

export default function KeywordsTable({ keywords }) {
  const [sortBy, setSortBy] = useState('position');
  const [filter, setFilter] = useState('top3');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = keywords || [];
    if (filter !== 'all') list = list.filter(k => k.bucket === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(k => k.query.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'position') return a.position - b.position;
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });
    return list;
  }, [keywords, sortBy, filter, search]);

  const buildSearchUrl = q => `https://www.google.cl/search?q=${encodeURIComponent(q)}&gl=cl&hl=es`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* ─── Toolbar ─── */}
      <div className="px-3 md:px-4 py-3 border-b border-slate-800 space-y-3">
        {/* Buscador full-width en mobile */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar query… (ej: regalos corporativos)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-9 py-2.5 text-[14px] text-white placeholder:text-slate-500 font-inter focus:outline-none focus:border-teal-500/50 focus:bg-slate-950"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros buckets + contador */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mb-1">
          {BUCKET_FILTERS.map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-2.5 py-1.5 rounded-md text-[12px] font-bold font-jakarta whitespace-nowrap transition-all ${
                filter === f.k
                  ? 'bg-teal-500/20 text-teal-200 border border-teal-400/40'
                  : 'text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {f.l}
            </button>
          ))}
          {(search || filter !== 'all') && (
            <span className="text-[11px] font-jakarta font-bold text-slate-500 ml-1 whitespace-nowrap">
              {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Ordenar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <ArrowUpDown className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta whitespace-nowrap">Ordenar:</span>
          {SORT_OPTIONS.map(s => (
            <button
              key={s.k}
              onClick={() => setSortBy(s.k)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors whitespace-nowrap ${
                sortBy === s.k ? 'text-teal-300' : 'text-slate-500 hover:text-white'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Vista MOBILE: cards ─── */}
      <div className="md:hidden divide-y divide-slate-800">
        {filtered.map((k, i) => (
          <div key={k.query} className="p-3 hover:bg-slate-800/40 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <span className="text-slate-600 font-mono text-[11px] mt-0.5 flex-shrink-0">{i + 1}</span>
                <p className="text-white font-medium font-inter text-[14px] leading-snug break-words">
                  {k.query}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-jakarta whitespace-nowrap flex-shrink-0 ${BUCKET_BADGE[k.bucket]}`}>
                {BUCKET_LABEL[k.bucket]}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono pl-6">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  <span className="text-slate-500">pos </span>
                  <span className="text-white font-bold">{k.position.toFixed(1)}</span>
                </span>
                <span className="text-slate-400">
                  <span className="text-slate-500">imp </span>
                  <span className="text-white font-bold">{k.impressions}</span>
                </span>
                <span className="text-slate-400">
                  <span className="text-slate-500">clk </span>
                  <span className="text-white font-bold">{k.clicks}</span>
                </span>
                <span className="text-slate-400">
                  <span className="text-slate-500">ctr </span>
                  <span className="text-white font-bold">{(k.ctr * 100).toFixed(1)}%</span>
                </span>
              </div>
              <a
                href={buildSearchUrl(k.query)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-800 hover:bg-teal-500/20 hover:text-teal-300 text-slate-400 transition-colors flex-shrink-0"
                title="Probar en Google.cl"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center text-slate-500 text-sm">
            Sin queries que coincidan con el filtro.
          </div>
        )}
      </div>

      {/* ─── Vista DESKTOP: tabla ─── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500 font-jakarta font-bold">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Query</th>
              <th className="px-4 py-3 text-right">Pos</th>
              <th className="px-4 py-3 text-right">Imp.</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 text-center">Bucket</th>
              <th className="px-4 py-3 text-center">Probar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((k, i) => (
              <tr key={k.query} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">{i + 1}</td>
                <td className="px-4 py-2.5 text-white font-medium font-inter">{k.query}</td>
                <td className="px-4 py-2.5 text-right font-jakarta font-bold text-white font-mono">
                  {k.position.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-300 font-mono">{k.impressions}</td>
                <td className="px-4 py-2.5 text-right text-slate-300 font-mono">{k.clicks}</td>
                <td className="px-4 py-2.5 text-right text-slate-400 font-mono text-[12px]">
                  {(k.ctr * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-jakarta ${BUCKET_BADGE[k.bucket]}`}>
                    {BUCKET_LABEL[k.bucket]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <a
                    href={buildSearchUrl(k.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-800 hover:bg-teal-500/20 hover:text-teal-300 text-slate-400 transition-colors"
                    title="Probar en Google.cl"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500 text-sm">
                  Sin queries que coincidan con el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}