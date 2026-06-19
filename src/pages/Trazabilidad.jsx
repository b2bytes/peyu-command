import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Activity, Users, Eye, ShoppingCart, DollarSign, FileText,
  Search, Smartphone, Monitor, Tablet, X, Clock, RefreshCw, Route,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /admin/trazabilidad — Recorrido REAL de cada visitante en las páginas
// públicas, leído de la entidad ActivityLog (poblada por activity-tracker en
// cada navegación SPA). Muestra KPIs, sesiones agrupadas con su journey, y un
// detalle cronológico por sesión. Diseño claro, alineado al panel admin.
// ════════════════════════════════════════════════════════════════════════

const EVENT_LABEL = {
  page_view: { l: 'Visita', c: '#64748B', e: '👁' },
  product_view: { l: 'Producto', c: '#0891B2', e: '📦' },
  add_to_cart: { l: 'Al carrito', c: '#D97706', e: '🛒' },
  remove_from_cart: { l: 'Quitó del carrito', c: '#94A3B8', e: '➖' },
  checkout_start: { l: 'Inició pago', c: '#EA580C', e: '💳' },
  checkout_complete: { l: 'Compró', c: '#059669', e: '✅' },
  b2b_form_submit: { l: 'Form B2B', c: '#7C3AED', e: '📝' },
  b2b_proposal_view: { l: 'Vio propuesta', c: '#4F46E5', e: '👀' },
  b2b_proposal_accept: { l: 'Aceptó propuesta', c: '#059669', e: '🎉' },
  b2b_proposal_reject: { l: 'Rechazó propuesta', c: '#DC2626', e: '❌' },
  tracking_view: { l: 'Vio tracking', c: '#2563EB', e: '🚚' },
  giftcard_purchase: { l: 'Compró GiftCard', c: '#DB2777', e: '🎁' },
  giftcard_redeem: { l: 'Canjeó GiftCard', c: '#DB2777', e: '🎁' },
  review_submit: { l: 'Dejó reseña', c: '#CA8A04', e: '⭐' },
  chat_message: { l: 'Chat', c: '#0D9488', e: '💬' },
  newsletter_signup: { l: 'Newsletter', c: '#0F8B6C', e: '✉️' },
  blog_view: { l: 'Blog', c: '#64748B', e: '📰' },
  search: { l: 'Buscó', c: '#64748B', e: '🔍' },
  personalization_request: { l: 'Personalización', c: '#7C3AED', e: '🎨' },
  other: { l: 'Otro', c: '#94A3B8', e: '•' },
};

const DEVICE_ICON = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

const RANGES = [
  { v: '1d', l: '24h' }, { v: '7d', l: '7 días' },
  { v: '30d', l: '30 días' }, { v: 'all', l: 'Todo' },
];

function rangeStart(range) {
  if (range === 'all') return null;
  const days = range === '1d' ? 1 : range === '7d' ? 7 : 30;
  return new Date(Date.now() - days * 86400000);
}

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

const fmt = (n) => (n || 0).toLocaleString('es-CL');
const fmtClp = (n) => `$${Math.round(n || 0).toLocaleString('es-CL')}`;

function Kpi({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: color }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-black font-poppins text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

// Agrupa eventos por sesión y arma el resumen de cada recorrido.
function buildSessions(logs) {
  const map = new Map();
  for (const l of logs) {
    const key = l.session_id || l.user_email || l.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(l);
  }
  return Array.from(map.entries()).map(([key, evts]) => {
    const sorted = evts.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const last = sorted[sorted.length - 1];
    const email = sorted.find((e) => e.user_email)?.user_email || null;
    const name = sorted.find((e) => e.user_name)?.user_name || null;
    const compro = sorted.some((e) => e.event_type === 'checkout_complete');
    const gmv = sorted.filter((e) => e.event_type === 'checkout_complete').reduce((s, e) => s + (e.value_clp || 0), 0);
    return {
      key, email, name, eventos: sorted, count: sorted.length,
      device: last.device, lastAt: last.created_date,
      firstAt: sorted[0].created_date, compro, gmv,
      referrer: sorted[0].referrer || '',
      utm: sorted[0].utm_source || '',
    };
  }).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

function JourneyDrawer({ session, onClose }) {
  if (!session) return null;
  const identity = session.email || `Sesión anónima · ${(session.key || '').slice(-8)}`;
  return (
    <div className="fixed inset-0 z-[80] flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white border-l border-border overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white/95 backdrop-blur p-4 border-b border-border flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#0F8B6C20' }}>
            <Route className="w-4 h-4" style={{ color: '#0F8B6C' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-poppins font-bold text-foreground text-sm truncate">{identity}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {session.count} pasos · {session.device || 'desktop'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(session.referrer || session.utm) && (
          <div className="px-4 pt-3 text-[11px] text-muted-foreground space-y-0.5">
            {session.utm && <p>Origen: <span className="font-medium text-foreground">{session.utm}</span></p>}
            {session.referrer && <p className="truncate">Referrer: <span className="font-mono">{session.referrer}</span></p>}
          </div>
        )}

        <div className="p-4">
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {session.eventos.map((e, i) => {
              const ev = EVENT_LABEL[e.event_type] || EVENT_LABEL.other;
              const detalle = e.meta?.nombre || e.meta?.company || e.meta?.slug
                || e.meta?.numero_pedido || e.meta?.query || e.page_path || '';
              return (
                <div key={e.id || i} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px]"
                    style={{ background: ev.c }}>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: ev.c }}>{ev.e} {ev.l}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(e.created_date)}</span>
                  </div>
                  {detalle && <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{detalle}</p>}
                  {e.value_clp > 0 && <p className="text-xs font-bold mt-0.5" style={{ color: '#059669' }}>{fmtClp(e.value_clp)}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function Trazabilidad() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [eventType, setEventType] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ActivityLog.list('-created_date', 1000);
      setLogs(data || []);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Filtros aplicados
  const filtered = useMemo(() => {
    const start = rangeStart(range);
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (start && new Date(l.created_date) < start) return false;
      if (eventType && l.event_type !== eventType) return false;
      if (q) {
        const hay = `${l.user_email || ''} ${l.session_id || ''} ${l.page_path || ''} ${l.user_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, range, eventType, search]);

  const sessions = useMemo(() => buildSessions(filtered), [filtered]);

  // KPIs
  const kpis = useMemo(() => {
    const uniqueSessions = new Set(filtered.map((l) => l.session_id).filter(Boolean)).size;
    const known = new Set(filtered.map((l) => l.user_email).filter(Boolean)).size;
    const views = filtered.filter((l) => l.event_type === 'page_view').length;
    const prodViews = filtered.filter((l) => l.event_type === 'product_view').length;
    const carts = filtered.filter((l) => l.event_type === 'add_to_cart').length;
    const checkouts = filtered.filter((l) => l.event_type === 'checkout_complete').length;
    const forms = filtered.filter((l) => l.event_type === 'b2b_form_submit').length;
    const gmv = filtered.filter((l) => l.event_type === 'checkout_complete').reduce((s, l) => s + (l.value_clp || 0), 0);
    return { uniqueSessions, known, views, prodViews, carts, checkouts, forms, gmv };
  }, [filtered]);

  const EVENT_OPTS = [{ v: '', l: 'Todos los eventos' }, ...Object.entries(EVENT_LABEL).map(([v, o]) => ({ v, l: `${o.e} ${o.l}` }))];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground flex items-center gap-2">
            <Route className="w-6 h-6" style={{ color: '#0F8B6C' }} /> Recorrido de visitantes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Cada visualización y paso del cliente en las páginas públicas, en tiempo real.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={Activity} label="Eventos" value={fmt(filtered.length)} color="#475569" />
        <Kpi icon={Users} label="Sesiones" value={fmt(kpis.uniqueSessions)} color="#2563EB" sub={`${kpis.known} identificadas`} />
        <Kpi icon={Eye} label="Vistas producto" value={fmt(kpis.prodViews)} color="#0891B2" />
        <Kpi icon={ShoppingCart} label="Al carrito" value={fmt(kpis.carts)} color="#D97706" sub={kpis.prodViews > 0 ? `${((kpis.carts / kpis.prodViews) * 100).toFixed(0)}% conv.` : ''} />
        <Kpi icon={DollarSign} label="Ventas B2C" value={fmtClp(kpis.gmv)} color="#059669" sub={`${kpis.checkouts} pedidos`} />
        <Kpi icon={FileText} label="Forms B2B" value={fmt(kpis.forms)} color="#7C3AED" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 p-3 bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar email, sesión o ruta…"
            className="flex-1 bg-transparent border-b border-border focus:border-[#0F8B6C] outline-none text-sm py-1"
          />
        </div>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#0F8B6C]">
          {EVENT_OPTS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r.v} onClick={() => setRange(r.v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${range === r.v ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              style={range === r.v ? { background: '#0F8B6C' } : {}}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* Sesiones / recorridos */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando recorridos…</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-dashed border-border">
          <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aún no hay recorridos registrados para este filtro.</p>
          <p className="text-xs mt-1">Las visitas se registran apenas alguien navegue por las páginas públicas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{sessions.length} recorridos · {filtered.length} eventos</p>
          {sessions.map((s) => {
            const DevIcon = DEVICE_ICON[s.device] || Monitor;
            return (
              <button
                key={s.key}
                onClick={() => setSelected(s)}
                className="w-full text-left bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-[#0F8B6C]/40 transition-all p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <DevIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-poppins font-semibold text-sm text-foreground truncate">
                      {s.email || s.name || <span className="text-muted-foreground italic font-normal">Visitante anónimo · {(s.key || '').slice(-6)}</span>}
                    </span>
                    {s.compro && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: '#059669' }}>Compró {fmtClp(s.gmv)}</span>}
                    {s.utm && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">{s.utm}</span>}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">{timeAgo(s.lastAt)}</span>
                </div>

                {/* Mini-recorrido horizontal (primeros 8 pasos) */}
                <div className="flex items-center gap-1 flex-wrap">
                  {s.eventos.slice(0, 8).map((e, i) => {
                    const ev = EVENT_LABEL[e.event_type] || EVENT_LABEL.other;
                    return (
                      <span key={e.id || i} className="inline-flex items-center gap-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: `${ev.c}18`, color: ev.c }}>
                          {ev.e} {ev.l}
                        </span>
                        {i < Math.min(s.eventos.length, 8) - 1 && <span className="text-muted-foreground/40 text-xs">›</span>}
                      </span>
                    );
                  })}
                  {s.count > 8 && <span className="text-[11px] text-muted-foreground ml-1">+{s.count - 8} más</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <JourneyDrawer session={selected} onClose={() => setSelected(null)} />
    </div>
  );
}