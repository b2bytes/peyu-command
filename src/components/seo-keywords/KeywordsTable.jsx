// ============================================================================
// KeywordsTable · Tabla ordenable de queries con filtro por bucket
// ============================================================================
import { useState, useMemo } from 'react';
import { ExternalLink, ArrowUpDown, Search as SearchIcon, X } from 'lucide-react';

const BUCKET_BADGE = {
  top3:  'bg-emerald-500/15 text-emerald-200 border-emerald-400/25',
  top10: 'bg-teal-500/15 text-teal-200 border-teal-400/25',
  top20: 'bg-amber-500/15 text-amber-200 border-amber-400/25',
  top50: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/25',
  fondo: 'bg-rose-500/15 text-rose-200 border-rose-400/25',
};
const BUCKET_LABEL = { top3: 'TOP 3', top10: 'P1', top20: 'P2', top50: '21-50', fondo: '+50' };

export default function KeywordsTable({ keywords }) {
  const [sortBy, setSortBy] = useState('impressions');
  const [filter, setFilter] = useState('all');
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
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { k: 'all',   l: 'Todas' },
            { k: 'top3',  l: 'TOP 3' },
            { k: 'top10', l: 'Página 1' },
            { k: 'top20', l: 'Página 2' },
            { k: 'top50', l: '21-50' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-jakarta transition-all ${
                filter === f.k
                  ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30'
                  : 'text-white/50 hover:text-white border border-transparent hover:bg-white/5'
              }`}
            >
              {f.l}
            </button>
          ))}
          {/* Buscador inline */}
          <div className="relative ml-2">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar query…"
              className="bg-white/5 border border-white/10 rounded-md pl-7 pr-7 py-1 text-[12px] text-white placeholder:text-white/30 font-inter w-44 focus:outline-none focus:border-teal-400/40"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {(search || filter !== 'all') && (
            <span className="text-[10px] font-jakarta font-bold text-white/40 ml-1">
              {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-jakarta">
          <ArrowUpDown className="w-3 h-3" /> Ordenar:
          {[
            { k: 'impressions', l: 'Impresiones' },
            { k: 'clicks', l: 'Clicks' },
            { k: 'position', l: 'Posición' },
            { k: 'ctr', l: 'CTR' },
          ].map(s => (
            <button
              key={s.k}
              onClick={() => setSortBy(s.k)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                sortBy === s.k ? 'text-teal-300' : 'text-white/50 hover:text-white'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/40 font-jakarta font-bold">
            <tr>
              <th className="px-4 py-2.5 text-left">#</th>
              <th className="px-4 py-2.5 text-left">Query</th>
              <th className="px-4 py-2.5 text-right">Pos</th>
              <th className="px-4 py-2.5 text-right">Impresiones</th>
              <th className="px-4 py-2.5 text-right">Clicks</th>
              <th className="px-4 py-2.5 text-right">CTR</th>
              <th className="px-4 py-2.5 text-center">Bucket</th>
              <th className="px-4 py-2.5 text-center">Buscar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((k, i) => (
              <tr key={k.query} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-2.5 text-white/40 font-mono text-[11px]">{i + 1}</td>
                <td className="px-4 py-2.5 text-white font-medium font-inter">{k.query}</td>
                <td className="px-4 py-2.5 text-right font-jakarta font-bold text-white/90 font-mono">
                  {k.position.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right text-white/70 font-mono">{k.impressions}</td>
                <td className="px-4 py-2.5 text-right text-white/70 font-mono">{k.clicks}</td>
                <td className="px-4 py-2.5 text-right text-white/60 font-mono text-[12px]">
                  {(k.ctr * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-jakarta ${BUCKET_BADGE[k.bucket]}`}>
                    {BUCKET_LABEL[k.bucket]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <a
                    href={buildSearchUrl(k.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/5 hover:bg-teal-500/15 hover:text-teal-300 text-white/40 transition-colors"
                    title="Probar en Google.cl"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-white/40 text-sm">
                  Sin queries en este bucket en la ventana actual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}