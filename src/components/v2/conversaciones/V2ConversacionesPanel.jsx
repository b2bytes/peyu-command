import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, MessageSquare, TrendingUp, Flame, UserCheck } from 'lucide-react';
import { isHotConversation } from '@/lib/v2-founders';
import V2ConvRow from './V2ConvRow';
import V2ConvThread from './V2ConvThread';

const PAGE = 25;
const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'B2C', label: 'B2C' },
  { id: 'B2B', label: 'B2B' },
  { id: 'hot', label: '🔥 Calientes' },
];

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

// Panel "Conversaciones" — inteligencia de negocio (read-only, founders).
// Lee ChatLead + AILog (entidades existentes). Paginado.
export default function V2ConversacionesPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(PAGE);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await base44.entities.ChatLead.list('-ultimo_mensaje_at', limit + 1);
        if (alive) {
          setHasMore((data || []).length > limit);
          setLeads((data || []).slice(0, limit));
        }
      } catch { if (alive) setLeads([]); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [limit]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const b2b = leads.filter((l) => l.tipo === 'B2B').length;
    const hotToday = leads.filter((l) => isHotConversation(l) && isToday(l.ultimo_mensaje_at)).length;
    const leadsCap = leads.filter((l) => l.convertido_a_b2b_lead_id || l.email).length;
    return { total, b2bPct: total ? Math.round((b2b / total) * 100) : 0, hotToday, leadsCap };
  }, [leads]);

  const filtered = useMemo(() => {
    if (filter === 'all') return leads;
    if (filter === 'hot') return leads.filter(isHotConversation);
    return leads.filter((l) => l.tipo === filter);
  }, [leads, filter]);

  return (
    <div className="flex-1 overflow-y-auto v2-scroll">
      <div className="max-w-[920px] w-full mx-auto px-6 py-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <MetricCard icon={MessageSquare} label="Conversaciones" value={metrics.total} color="var(--v2-fg)" />
          <MetricCard icon={TrendingUp} label="% B2B" value={`${metrics.b2bPct}%`} color="var(--v2-gold)" />
          <MetricCard icon={Flame} label="Calientes hoy" value={metrics.hotToday} color="var(--v2-highlight, #e0584f)" />
          <MetricCard icon={UserCheck} label="Leads capturados" value={metrics.leadsCap} color="var(--v2-teal)" />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto v2-scrollbar-hide">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} data-active={filter === f.id} className="v2-chip px-3.5 py-2 text-xs flex-shrink-0">
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--v2-teal)' }} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center py-16" style={{ color: 'var(--v2-fg-subtle)' }}>No hay conversaciones en este filtro.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((cl) => (
              <V2ConvRow key={cl.id} cl={cl} onClick={setSelected} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="v2-btn-ghost w-full h-10 mt-4 text-xs font-semibold">
            Cargar más
          </button>
        )}
      </div>

      {selected && <V2ConvThread cl={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="v2-card p-3.5 flex flex-col gap-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>{label}</span>
    </div>
  );
}