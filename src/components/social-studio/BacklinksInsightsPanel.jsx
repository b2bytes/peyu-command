// ============================================================================
// BacklinksInsightsPanel — Vista analítica de la huella de PEYU en la web:
// prensa, blogs, videos, menciones y recomendaciones que la empresa ha ganado
// a lo largo de su historia. Lee la entidad Backlink (campos reales en español).
// ============================================================================
import { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  ExternalLink, TrendingUp, Award, Loader2, Newspaper, Video, FileText,
  Link2, Globe, MessageSquare, Search,
} from 'lucide-react';

// Iconos por tipo de enlace (los tipos reales del catálogo)
const TIPO_META = {
  'Prensa / Medio':   { icon: Newspaper,     color: 'from-sky-500 to-blue-600',     text: 'text-sky-300' },
  'Video':            { icon: Video,          color: 'from-pink-500 to-rose-600',    text: 'text-pink-300' },
  'Blog':             { icon: FileText,       color: 'from-amber-400 to-orange-500', text: 'text-amber-300' },
  'Directorio':       { icon: Link2,          color: 'from-violet-500 to-purple-600',text: 'text-violet-300' },
  'Red Social':       { icon: MessageSquare,  color: 'from-fuchsia-500 to-pink-600', text: 'text-fuchsia-300' },
  'Mención':          { icon: Globe,          color: 'from-emerald-400 to-teal-500', text: 'text-emerald-300' },
};
const metaDe = (tipo) => TIPO_META[tipo] || { icon: Globe, color: 'from-white/20 to-white/10', text: 'text-white/60' };

// La autoridad real es texto ("Alta (Emol, T13...)", "Media (Blogs...)"). Lo clasificamos.
const nivelAutoridad = (a = '') => {
  const s = a.toLowerCase();
  if (s.startsWith('alta')) return 'alta';
  if (s.startsWith('media')) return 'media';
  if (s.startsWith('baja')) return 'baja';
  return 'otra';
};

export default function BacklinksInsightsPanel() {
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    base44.entities.Backlink.list('-fecha_publicacion', 200).then(b => {
      setBacklinks(b);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = backlinks.length;
    const altaAutoridad = backlinks.filter(b => nivelAutoridad(b.autoridad) === 'alta').length;
    const dofollow = backlinks.filter(b => b.dofollow).length;
    const tipos = {};
    backlinks.forEach(b => { tipos[b.tipo] = (tipos[b.tipo] || 0) + 1; });
    return { total, altaAutoridad, dofollow, tipos };
  }, [backlinks]);

  const tiposDisponibles = useMemo(
    () => Object.entries(stats.tipos).sort((a, b) => b[1] - a[1]),
    [stats.tipos]
  );

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return backlinks.filter(b => {
      if (filtroTipo !== 'todos' && b.tipo !== filtroTipo) return false;
      if (!term) return true;
      return (
        (b.titulo || '').toLowerCase().includes(term) ||
        (b.dominio || '').toLowerCase().includes(term) ||
        (b.extracto || '').toLowerCase().includes(term) ||
        (b.notas || '').toLowerCase().includes(term)
      );
    });
  }, [backlinks, q, filtroTipo]);

  if (loading) {
    return (
      <div className="text-center py-12 text-white/50">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Cargando huella web de PEYU…
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light pr-2 pb-6 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <KPI label="Enlaces totales" value={stats.total} icon={ExternalLink} color="text-sky-300" />
          <KPI label="Alta autoridad" value={stats.altaAutoridad} icon={Award} color="text-amber-300" />
          <KPI label="Dofollow (SEO)" value={stats.dofollow} icon={TrendingUp} color="text-emerald-300" />
        </div>

        {/* Buscador + filtros por tipo */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar medio, título o mención…"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/60"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Chip active={filtroTipo === 'todos'} onClick={() => setFiltroTipo('todos')}>
              Todos {stats.total}
            </Chip>
            {tiposDisponibles.map(([tipo, n]) => (
              <Chip key={tipo} active={filtroTipo === tipo} onClick={() => setFiltroTipo(tipo)}>
                {tipo} {n}
              </Chip>
            ))}
          </div>
        </div>

        {/* Lista de enlaces */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <h3 className="font-poppins font-semibold text-white text-sm mb-3 px-1 flex items-center justify-between">
            <span>Huella de PEYU en la web</span>
            <span className="text-xs font-normal text-white/40">{filtrados.length} enlaces</span>
          </h3>
          {filtrados.length === 0 ? (
            <p className="text-center py-8 text-white/40 text-sm">Sin resultados para tu búsqueda</p>
          ) : (
            <div className="space-y-2">
              {filtrados.map(b => {
                const meta = metaDe(b.tipo);
                const Icon = meta.icon;
                const esAlta = nivelAutoridad(b.autoridad) === 'alta';
                return (
                  <a
                    key={b.id}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-[11px] font-semibold ${meta.text}`}>{b.dominio}</p>
                          {esAlta && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300">Alta autoridad</span>
                          )}
                          {b.dofollow && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300">dofollow</span>
                          )}
                        </div>
                        <p className="text-sm text-white font-medium leading-snug group-hover:text-white">{b.titulo}</p>
                        {b.extracto && (
                          <p className="text-xs text-white/45 leading-snug mt-1 line-clamp-2">{b.extracto}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/35">
                          <span>{b.tipo}</span>
                          {b.fecha_publicacion && <><span>·</span><span>{b.fecha_publicacion}</span></>}
                          {b.categoria && <><span>·</span><span>{b.categoria}</span></>}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white flex-shrink-0 mt-0.5" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-white/50">{label}</span>
      </div>
      <p className={`text-2xl font-poppins font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
        active
          ? 'bg-gradient-to-br from-violet-500 to-pink-600 text-white shadow-md'
          : 'bg-white/[0.05] text-white/55 hover:bg-white/10 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  );
}