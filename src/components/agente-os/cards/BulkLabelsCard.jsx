import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag, Loader2, Printer, CheckCircle2, AlertTriangle, Package, Square, CheckSquare } from 'lucide-react';
import EtiquetaViewerModal from '../EtiquetaViewerModal';

// ════════════════════════════════════════════════════════════════════════
// BulkLabelsCard — Generación de etiquetas BlueExpress POR VOLUMEN desde el
// chat del agente. El founder selecciona todos los pedidos pagados listos para
// despacho, genera las OT en lote con un clic, y luego imprime cada etiqueta
// (o todas de golpe) sin salir de la conversación.
// ════════════════════════════════════════════════════════════════════════
const fmt = (n) => '$' + (n || 0).toLocaleString('es-CL');

export default function BulkLabelsCard({ pedidos = [], onDone }) {
  // Solo pedidos pagados/post-pago sin tracking: candidatos a generar etiqueta.
  const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
  const candidatos = pedidos.filter((p) => {
    const pagadoOk = p.payment_status === 'paid' || ESTADOS_PAGADOS.includes(p.estado);
    return pagadoOk && !p.tracking;
  });

  const [selected, setSelected] = useState(() => new Set(candidatos.map((p) => p.id)));
  const [generating, setGenerating] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [viewLabel, setViewLabel] = useState(null);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => (prev.size === candidatos.length ? new Set() : new Set(candidatos.map((p) => p.id))));
  };

  const generar = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('agentOSAction', {
        action: 'generarEtiquetasMasivo',
        payload: { ids: Array.from(selected) },
      });
      const d = res?.data || {};
      setResultados(d.resultados || []);
      onDone?.();
    } catch (e) {
      setResultados([{ ok: false, error: e?.response?.data?.error || e.message }]);
    } finally {
      setGenerating(false);
    }
  };

  // Imprime todas las etiquetas generadas con éxito (abre cada PDF para imprimir).
  const imprimirTodas = () => {
    (resultados || []).filter((r) => r.ok && r.label_url).forEach((r, i) => {
      setTimeout(() => window.open(r.label_url, '_blank'), i * 350);
    });
  };

  const okResultados = (resultados || []).filter((r) => r.ok);

  if (candidatos.length === 0 && !resultados) {
    return (
      <div className="ld-glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Tag className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Etiquetas por volumen</span>
        </div>
        <p className="text-sm text-ld-fg-muted">No hay pedidos pagados listos para etiqueta en este momento 🎉</p>
      </div>
    );
  }

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Tag className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Etiquetas BlueExpress por volumen</span>
        </div>
        {!resultados && candidatos.length > 0 && (
          <button onClick={toggleAll} className="text-[11px] text-ld-action hover:underline flex items-center gap-1">
            {selected.size === candidatos.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {selected.size === candidatos.length ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        )}
      </div>

      {/* ── Resultados de generación ── */}
      {resultados ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-ld-action-soft border border-ld-border">
            <CheckCircle2 className="w-4 h-4 text-ld-action flex-shrink-0" />
            <span className="text-sm font-semibold text-ld-fg">{okResultados.length} etiqueta{okResultados.length !== 1 ? 's' : ''} generada{okResultados.length !== 1 ? 's' : ''}</span>
            {okResultados.length > 0 && (
              <button onClick={imprimirTodas} className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                <Printer className="w-3.5 h-3.5" /> Imprimir todas
              </button>
            )}
          </div>
          {resultados.map((r, i) => (
            <div key={r.pedido_id || i} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ld-fg truncate">{r.cliente_nombre || 'Cliente'}</p>
                <p className="text-[11px] text-ld-fg-muted truncate">
                  {r.numero_pedido || ''}{r.ok ? ` · OT ${r.tracking || ''}` : ` · ${r.error || 'error'}`}
                </p>
              </div>
              {r.ok && r.label_url ? (
                <button onClick={() => setViewLabel({ url: r.label_url, titulo: `${r.numero_pedido || ''} · ${r.cliente_nombre || ''}` })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-ld-action hover:underline flex-shrink-0">
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
              ) : (
                <AlertTriangle className="w-4 h-4 text-ld-highlight flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Lista de pedidos a etiquetar ── */}
          <div className="space-y-2 mb-3">
            {candidatos.map((p) => {
              const checked = selected.has(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border text-left transition-colors ${checked ? 'bg-ld-action-soft border-ld-action/40' : 'bg-ld-bg-soft/60 border-ld-border'}`}>
                  {checked ? <CheckSquare className="w-4 h-4 text-ld-action flex-shrink-0" /> : <Square className="w-4 h-4 text-ld-fg-muted flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ld-fg truncate">{p.cliente_nombre || 'Cliente'}</p>
                    <p className="text-[11px] text-ld-fg-muted truncate">{p.numero_pedido || ''} · {p.ciudad || 'destino'} · {fmt(p.total)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={generar} disabled={generating || selected.size === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl ld-btn-primary text-white text-sm font-bold disabled:opacity-50">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando {selected.size} etiqueta{selected.size !== 1 ? 's' : ''}…</> : <><Package className="w-4 h-4" /> Generar {selected.size} etiqueta{selected.size !== 1 ? 's' : ''}</>}
          </button>
        </>
      )}

      {viewLabel && (
        <EtiquetaViewerModal labelUrl={viewLabel.url} titulo={viewLabel.titulo} onClose={() => setViewLabel(null)} />
      )}
    </div>
  );
}