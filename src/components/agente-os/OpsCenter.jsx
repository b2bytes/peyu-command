import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { getPagoStatus } from '@/lib/pago-status';
import { Loader2, RefreshCw, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import OpsPedidoRow from './OpsPedidoRow';
import EtiquetaWizardModal from './EtiquetaWizardModal';
import EtiquetaViewerModal from './EtiquetaViewerModal';
import OpsLeadsPanel from './OpsLeadsPanel';
import OpsVentasPanel from './OpsVentasPanel';
import { lazy, Suspense } from 'react';
const PedidoDetailDrawer = lazy(() => import('@/components/pedidos/PedidoDetailDrawer'));

// Secciones del centro operativo — TODO se gestiona aquí, sin saltar de página.
const SECTIONS = [
  { id: 'pedidos', label: '📦 Pedidos & Etiquetas' },
  { id: 'leads', label: '🎯 Leads B2B' },
  { id: 'ventas', label: '💼 Ventas & Propuestas' },
];

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

export default function OpsCenter({ onRefreshAll }) {
  const [section, setSection] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('por_pagar');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { ok, message, label_url }
  const [wizardPedido, setWizardPedido] = useState(null); // asistente de etiqueta Bluex
  const [viewerLabel, setViewerLabel] = useState(null);   // { url, titulo } — visor de etiqueta in-place
  const [detailPedido, setDetailPedido] = useState(null); // pedido seleccionado para drawer completo

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
    // Etiqueta Bluex: abre el asistente inteligente con checklist guiado
    // (pago, dirección, cobertura, anti-duplicados) en vez de disparar directo.
    if (action === 'generarEtiqueta') {
      const p = pedidos.find((x) => x.id === payload.id);
      if (p) { setWizardPedido(p); return; }
    }
    setBusyId(payload.id);
    setFeedback(null);
    try {
      const res = await base44.functions.invoke('agentOSAction', { action, payload });
      setFeedback({ ok: true, message: res?.data?.message || 'Listo ✓', label_url: res?.data?.label_url });
      if (res?.data?.label_url) setViewerLabel({ url: res.data.label_url, titulo: payload.id ? (pedidos.find((x) => x.id === payload.id)?.numero_pedido || '') : '' });
      await load();
      onRefreshAll?.();
    } catch (err) {
      setFeedback({ ok: false, message: err?.response?.data?.error || err.message });
    }
    setBusyId(null);
  };

  // Abre la etiqueta en el visor DENTRO del chat (sin pestañas externas).
  const openLabelUrl = (url, titulo = '') => {
    if (!url) return;
    setViewerLabel({ url, titulo });
  };

  const openLabel = async (pedido) => {
    // Busca el Envio asociado y muestra su etiqueta en el visor in-place.
    const envios = await base44.entities.Envio.filter({ tracking_number: pedido.tracking }).catch(() => []);
    const envio = envios?.[0];
    const url = envio?.label_url || (envio?.label_base64 ? `data:application/pdf;base64,${envio.label_base64}` : null);
    if (url) setViewerLabel({ url, titulo: `${pedido.numero_pedido || ''} · ${pedido.cliente_nombre || ''}${pedido.tracking ? ` · OT ${pedido.tracking}` : ''}` });
    else setFeedback({ ok: false, message: 'No hay etiqueta guardada para este pedido. Genérala primero.' });
  };

  return (
    <div className="flex-1 overflow-y-auto peyu-scrollbar px-3 sm:px-4 py-4">
      <div className="max-w-[920px] mx-auto w-full space-y-4">

        {/* Selector de sección — un solo lugar para gestionar todo */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${section === s.id ? 'ld-btn-primary !border-transparent' : 'ld-btn-ghost text-ld-fg-soft'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === 'leads' && <OpsLeadsPanel onRefreshAll={onRefreshAll} />}
        {section === 'ventas' && <OpsVentasPanel onRefreshAll={onRefreshAll} />}

        {section === 'pedidos' && (<>

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
              <OpsPedidoRow key={p.id} pedido={p} busy={busyId === p.id} onAction={handleAction} onOpenLabel={openLabel} onOpenDetail={setDetailPedido} />
            ))}
          </div>
        )}
        </>)}

      </div>

      {/* Asistente inteligente de etiqueta BlueExpress (burbujas paso a paso) */}
      {wizardPedido && (
        <EtiquetaWizardModal
          pedido={wizardPedido}
          onClose={() => setWizardPedido(null)}
          onDone={() => { load(); onRefreshAll?.(); }}
          openLabelUrl={openLabelUrl}
        />
      )}

      {/* Visor de etiqueta DENTRO del chat (PDF embebido, imprimir/descargar) */}
      {viewerLabel && (
        <EtiquetaViewerModal
          labelUrl={viewerLabel.url}
          titulo={viewerLabel.titulo}
          onClose={() => setViewerLabel(null)}
        />
      )}

      {/* Drawer de pedido completo: items, mockups, archivos, Bluex, cliente, pago */}
      {detailPedido && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}>
          <PedidoDetailDrawer
            pedido={detailPedido}
            onClose={() => setDetailPedido(null)}
            onUpdate={() => { load(); onRefreshAll?.(); }}
          />
        </Suspense>
      )}
    </div>
  );
}