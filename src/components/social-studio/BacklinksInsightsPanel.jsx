// ============================================================================
// BacklinksInsightsPanel — Vista de backlinks que el sistema usa como
// "insights" en la generación de contenido (PR, menciones, autoridad SEO).
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Globe, ExternalLink, TrendingUp, Award, Calendar, Filter } from 'lucide-react';

const AUTORIDAD_ORDEN = {
  'Alta (Emol, T13, BioBio, gov)': 0,
  'Media (Blogs, Medios nicho)': 1,
  'Baja (Redes, foros)': 2,
  'Sin clasificar': 3,
};

const AUTORIDAD_COLORS = {
  'Alta (Emol, T13, BioBio, gov)': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  'Media (Blogs, Medios nicho)': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  'Baja (Redes, foros)': 'bg-sky-500/20 text-sky-300 border-sky-400/30',
  'Sin clasificar': 'bg-white/10 text-white/60 border-white/20',
};

export default function BacklinksInsightsPanel() {
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAutoridad, setFilterAutoridad] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');

  useEffect(() => {
    base44.entities.Backlink.list('-fecha_publicacion', 200).then(d => {
      setBacklinks(d);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = backlinks.length;
    const altos = backlinks.filter(b => b.autoridad?.startsWith('Alta')).length;
    const dofollow = backlinks.filter(b => b.dofollow).length;
    const prensa = backlinks.filter(b => b.tipo === 'Prensa / Medio').length;
    return { total, altos, dofollow, prensa };
  }, [backlinks]);

  const tipos = useMemo(() => [...new Set(backlinks.map(b => b.tipo).filter(Boolean))], [backlinks]);

  const filtered = useMemo(() => {
    let f = backlinks;
    if (filterAutoridad !== 'all') f = f.filter(b => b.autoridad === filterAutoridad);
    if (filterTipo !== 'all') f = f.filter(b => b.tipo === filterTipo);
    return [...f].sort((a, b) => (AUTORIDAD_ORDEN[a.autoridad] ?? 99) - (AUTORIDAD_ORDEN[b.autoridad] ?? 99));
  }, [backlinks, filterAutoridad, filterTipo]);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
        <KPI label="Total backlinks" value={stats.total} color="text-white" icon={Globe} />
        <KPI label="Alta autoridad" value={stats.altos} color="text-emerald-300" icon={Award} highlight={stats.altos > 0} />
        <KPI label="Dofollow (SEO+)" value={stats.dofollow} color="text-violet-300" icon={TrendingUp} />
        <KPI label="Prensa / Medios" value={stats.prensa} color="text-amber-300" icon={Globe} />
      </div>

      <div className="bg-violet-500/10 border border-violet-400/30 rounded-xl p-3 text-xs text-violet-200 flex items-start gap-2 flex-shrink-0">
        <Award className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Estos backlinks <strong>alimentan automáticamente</strong> al generador semanal y a las variantes en bulk.
          Cuando activas <em>"Inyectar backlinks como insights"</em>, la IA cita tus menciones de PR como social proof real en el copy.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-wrap gap-2 items-center flex-shrink-0">
        <div className="flex items-center gap-1 text-white/40 text-[10px] uppercase tracking-wider mr-1">
          <Filter className="w-3 h-3" /> Filtros
        </div>
        <select
          value={filterAutoridad}
          onChange={e => setFilterAutoridad(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white"
        >
          <option value="all" className="bg-slate-900">Todas autoridades</option>
          {Object.keys(AUTORIDAD_ORDEN).map(a => (
            <option key={a} value={a} className="bg-slate-900">{a}</option>
          ))}
        </select>
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white"
        >
          <option value="all" className="bg-slate-900">Todos los tipos</option>
          {tipos.map(t => (
            <option key={t} value={t} className="bg-slate-900">{t}</option>
          ))}
        </select>
        <span className="text-[11px] text-white/50 ml-auto">{filtered.length} resultados</span>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 pr-1">
        {loading ? (
          <div className="text-center py-12 text-white/50">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Cargando backlinks…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin backlinks con esos filtros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(b => (
              <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/8 transition-all">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-white hover:text-violet-300 flex items-center gap-1 truncate flex-1 min-w-0"
                  >
                    <span className="truncate">{b.titulo || b.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                  </a>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold flex-shrink-0 ${AUTORIDAD_COLORS[b.autoridad] || AUTORIDAD_COLORS['Sin clasificar']}`}>
                    {b.autoridad?.split(' ')[0] || '?'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/50 flex-wrap">
                  <span className="font-mono">{b.dominio || '—'}</span>
                  <span>·</span>
                  <span>{b.tipo}</span>
                  {b.dofollow && (
                    <>
                      <span>·</span>
                      <span className="text-violet-300 font-bold">DoFollow</span>
                    </>
                  )}
                  {b.fecha_publicacion && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {b.fecha_publicacion}</span>
                    </>
                  )}
                </div>
                {b.extracto && (
                  <p className="text-[11px] text-white/60 mt-1.5 line-clamp-2 italic">"{b.extracto}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, color, icon: Icon, highlight }) {
  return (
    <div className={`bg-white/5 border rounded-xl px-3 py-2 ${highlight ? 'border-emerald-400/40' : 'border-white/10'}`}>
      <div className="text-[11px] text-white/50 mb-0.5 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`text-xl font-poppins font-bold ${color}`}>{value}</div>
    </div>
  );
}