import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getPagoStatus } from '@/lib/pago-status';
import { Loader2, RefreshCw, Search, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import OpsPedidoRow from './OpsPedidoRow';

// ════════════════════════════════════════════════════════════════════════
// OpsCenter — Centro de Operaciones maestro dentro del Agent OS.
// Gestión COMPLETA de pedidos sin salir de la página: marcar pagado,
// generar etiqueta Bluex, cambiar estado, abrir etiqueta/tracking.
// + Accesos directos a todos los módulos del admin.
// ════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'por_pagar', label: 'Por pagar' },
  { id: 'por_despachar', label: 'Por despachar' },
  { id: 'despachados', label: 'Despachados' },
  { id: 'todos', label: 'Todos' },
];

const QUICK_LINKS = [
  { to: '/admin/procesar-pedidos', label: 'Procesar Pedidos' },
  { to: '/admin/despacho', label: 'Despacho Rápido' },
  { to: '/admin/bluex', label: 'Centro Logístico' },
  { to: '/admin/pipeline', label: 'Pipeline B2B' },
  { to: '/admin/pipeline-b2c', label: 'Pipeline B2C' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/admin-products', label: 'Productos' },
  { to: '/admin/financiero', label: 'Financiero' },
  { to: '/admin/marketing-hub', label: 'Marketing' },
  { to: '/admin/analitica', label: 'Analítica' },
];

export default function OpsCenter({ onRefreshAll }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('por_pagar');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { ok, message, label_url }

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PedidoWeb.list('-created_date', 120).catch(() => []);
    setPedidos(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    let lista = pedidos;
    if (tab === 'por_pagar') lista = lista.filter((p) => !getPagoStatus(p).pagado && !['Cancelado', 'Reembolsado'].includes(p.estado));
    if (tab === 'por_despachar') lista = lista.filter((p) => getPagoStatus(p).pagado && !['Despachado', 'Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado));
    if (tab === 'despachados') lista = lista.filter((p) => ['Despachado', 'Entregado'].includes(p.estado));
    const q = search.trim().toLowerCase();
    if (q) lista = lista.filter((p) =>
      (p.numero_pedido || '').toLowerCase().includes(q) ||
      (p.cliente_nombre || '').toLowerCase().includes(q) ||
      (p.tracking || '').toLowerCase().includes(q)
    );
    return lista;
  }, [pedidos, tab, search]);

  const counts = useMemo(() => ({
    por_pagar: pedidos.filter((p) => !getPagoStatus(p).pagado && !['Cancelado', 'Reembolsado'].includes(p.estado)).length,
    por_despachar: pedidos.filter((p) => getPagoStatus(p).pagado && !['Despachado', 'Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado)).length,
  }), [pedidos]);

  const handleAction = async (action, payload) => {
    setBusyId(payload.id);
    setFeedback(null);
    try {
      const res = await base44.functions.invoke('agentOSAction', { action, payload });
      setFeedback({ ok: true, message: res?.data?.message || 'Listo ✓', label_url: res?.data?.label_url });
      if (res?.data?.label_url) openLabelUrl(res.data.label_url);
      await load();
      onRefreshAll?.();
    } catch (err) {
      setFeedback({ ok: false, message: err?.response?.data?.error || err.message });
    }
    setBusyId(null);
  };

  const openLabelUrl = (url) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      const base64 = url.split(',')[1];
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      window.open(URL.createObjectURL(new Blob([arr], { type: 'application/pdf' })), '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  const openLabel = async (pedido) => {
    // Busca el Envio asociado para abrir la etiqueta; fallback al tracking público.
    const envios = await base44.entities.Envio.filter({ tracking_number: pedido.tracking }).catch(() => []);
    const envio = envios?.[0];
    if (envio?.label_url) openLabelUrl(envio.label_url);
    else window.open(`https://www.bluex.cl/seguimiento?n=${pedido.tracking}`, '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto peyu-scrollbar px-3 sm:px-4 py-4">
      <div className="max-w-[920px] mx-auto w-full space-y-4">

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2 text-sm font-semibold ${feedback.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {feedback.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{feedback.message}</span>
            {feedback.label_url && (
              <button onClick={() => openLabelUrl(feedback.label_url)} className="underline text-xs font-bold">Ver etiqueta</button>
            )}
          </div>
        )}

        {/* Tabs + buscador + refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${tab === t.id ? 'ld-btn-primary !border-transparent' : 'ld-btn-ghost text-ld-fg-soft'}`}
            >
              {t.label}
              {t.id === 'por_pagar' && counts.por_pagar > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-amber-400 text-amber-950 text-[10px]">{counts.por_pagar}</span>}
              {t.id === 'por_despachar' && counts.por_despachar > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-blue-400 text-blue-950 text-[10px]">{counts.por_despachar}</span>}
            </button>
          ))}
          <div className="flex-1 min-w-[160px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ld-fg-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pedido, cliente o tracking…"
              className="ld-input w-full pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
          <button onClick={load} className="ld-btn-ghost p-2 rounded-full" title="Refrescar">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-ld-fg-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando pedidos…
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center py-10 text-sm text-ld-fg-muted">Sin pedidos en esta vista 🐢</p>
        ) : (
          <div className="space-y-2">
            {filtrados.map((p) => (
              <OpsPedidoRow key={p.id} pedido={p} busy={busyId === p.id} onAction={handleAction} onOpenLabel={openLabel} />
            ))}
          </div>
        )}

        {/* Accesos a módulos */}
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ld-fg-muted mb-2">Todos los módulos</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="ld-btn-ghost inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-ld-fg-soft">
                {l.label} <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}