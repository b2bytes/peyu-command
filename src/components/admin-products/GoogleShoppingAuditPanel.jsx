// ============================================================================
// GoogleShoppingAuditPanel — Audita con IA la imagen principal de cada producto
// y le da un score 0-100 contra políticas Google Shopping (sin marcas, sin
// texto, producto centrado, fondo limpio). Marca con ⚠️ los urgentes.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, AlertTriangle, Sparkles,
  RefreshCw, ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon,
} from 'lucide-react';

const VEREDICTO_STYLE = {
  blocked:   { label: 'Bloqueado',  icon: ShieldX,     ring: 'ring-rose-500/40',    text: 'text-rose-200',    bg: 'bg-rose-500/15',    border: 'border-rose-500/40' },
  warning:   { label: 'Revisar',    icon: ShieldAlert, ring: 'ring-amber-500/40',   text: 'text-amber-200',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40' },
  compliant: { label: 'Aprobado',   icon: ShieldCheck, ring: 'ring-emerald-500/40', text: 'text-emerald-200', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  error:     { label: 'Error',      icon: AlertTriangle, ring: 'ring-white/20',     text: 'text-white/60',    bg: 'bg-white/5',        border: 'border-white/15' },
};

function scoreColor(score) {
  if (score == null) return 'text-white/40';
  if (score >= 90) return 'text-emerald-300';
  if (score >= 70) return 'text-amber-300';
  return 'text-rose-300';
}

export default function GoogleShoppingAuditPanel({ onProductClick }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all'); // all | blocked | warning | compliant
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('auditGoogleShoppingCompliance', { limit });
      setData(res?.data || null);
      if (!open) setOpen(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const results = data?.results || [];
  const stats = data?.stats;
  const filtered = filter === 'all' ? results : results.filter(r => r.veredicto === filter);

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-fuchsia-500/10 border border-indigo-400/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              Auditoría Google Shopping (IA)
              {stats?.blocked > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40">
                  <AlertTriangle className="w-3 h-3" /> {stats.blocked} urgentes
                </span>
              )}
            </p>
            <p className="text-[11px] text-white/55 truncate">
              IA escanea cada imagen y detecta marcas, texto, descentrado → score 0-100 + veredicto Merchant Center.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-white/60 flex items-center gap-1.5">
            Cuántos
            <input
              type="number"
              min={5}
              max={200}
              value={limit}
              onChange={e => setLimit(Number(e.target.value) || 50)}
              className="w-16 h-7 rounded bg-white/10 border border-white/15 px-2 text-white text-xs"
            />
          </label>
          <Button
            onClick={run}
            disabled={loading}
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white h-8"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {data ? 'Re-auditar' : 'Auditar ahora'}
          </Button>
          {data && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(o => !o)}
              className="bg-white/5 border-white/15 text-white hover:bg-white/10 h-8 px-2"
            >
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* Stats + resultados */}
      {data && open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <StatPill label="Score promedio" value={`${stats.avg_score}/100`} accent={scoreColor(stats.avg_score)} />
            <StatPill label="Bloqueados" value={stats.blocked} accent="text-rose-300" />
            <StatPill label="A revisar" value={stats.warning} accent="text-amber-300" />
            <StatPill label="Aprobados" value={stats.compliant} accent="text-emerald-300" />
            <StatPill label="Con marca/logo" value={stats.con_marca} accent="text-fuchsia-300" />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'blocked', 'warning', 'compliant'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  filter === f
                    ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-50'
                    : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? `Todos · ${results.length}` :
                 f === 'blocked' ? `Bloqueados · ${stats.blocked}` :
                 f === 'warning' ? `Revisar · ${stats.warning}` :
                 `Aprobados · ${stats.compliant}`}
              </button>
            ))}
          </div>

          {/* Lista de resultados */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto peyu-scrollbar-light pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-white/45 text-xs">Sin resultados en este filtro.</div>
            ) : filtered.map(r => (
              <AuditResultRow key={r.producto_id} row={r} onClick={() => onProductClick?.(r.producto_id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] text-white/50">{label}</p>
      <p className={`text-base font-poppins font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function AuditResultRow({ row, onClick }) {
  const style = VEREDICTO_STYLE[row.veredicto] || VEREDICTO_STYLE.error;
  const Icon = style.icon;
  const urgente = row.veredicto === 'blocked';

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} px-2.5 py-2 flex items-start gap-2.5`}>
      {/* Thumb */}
      <div className={`w-12 h-12 rounded-md bg-black/30 border ${urgente ? 'ring-2 ring-rose-500/60' : ''} overflow-hidden flex-shrink-0 flex items-center justify-center`}>
        {row.imagen_url ? (
          <img src={row.imagen_url} alt={row.nombre} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <ImageIcon className="w-4 h-4 text-white/30" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${style.border} ${style.text} ${style.bg}`}>
            {urgente && <AlertTriangle className="w-2.5 h-2.5" />}
            <Icon className="w-2.5 h-2.5" /> {style.label}
          </span>
          {row.score != null && (
            <span className={`text-[11px] font-mono font-bold ${scoreColor(row.score)}`}>
              {row.score}/100
            </span>
          )}
          <span className="text-[10px] text-white/40 font-mono">{row.sku}</span>
        </div>
        <p className="text-xs font-medium text-white mt-0.5 truncate">{row.nombre}</p>

        {row.problemas?.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {row.problemas.slice(0, 3).map((p, i) => (
              <li key={i} className="text-[10.5px] text-white/65 leading-snug">
                <span className={style.text}>›</span> {p}
              </li>
            ))}
          </ul>
        )}
        {row.recomendacion && (
          <p className="text-[10.5px] text-indigo-200/80 mt-1 italic leading-snug">
            💡 {row.recomendacion}
          </p>
        )}
      </div>

      {/* Acción */}
      <button
        onClick={onClick}
        className="flex-shrink-0 text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-1 self-center"
      >
        <ExternalLink className="w-3 h-3" /> Abrir
      </button>
    </div>
  );
}