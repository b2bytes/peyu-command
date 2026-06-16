import { Package, Truck, CreditCard, Factory, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ActionButton from '../ActionButton';
import EtiquetaViewerModal from '../EtiquetaViewerModal';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// ¿El pedido está pagado? (payment_status paid o estado post-pago).
const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
const estaPagado = (p) => p.payment_status === 'paid' || ESTADOS_PAGADOS.includes(p.estado);

// Etapa del pipeline a la que pertenece cada pedido.
function etapaDe(p) {
  if (['Despachado', 'Entregado'].includes(p.estado)) return 'despachado';
  if (!estaPagado(p) || p.estado === 'Nuevo') return 'por_pagar';
  if (p.tracking) return 'con_etiqueta';      // pagado y con OT → listo para despachar
  if (p.estado === 'Listo para Despacho') return 'etiqueta';
  return 'produccion';                        // confirmado / en producción
}

const COLUMNAS = [
  { id: 'por_pagar',    label: 'Por confirmar pago', icon: CreditCard, color: 'text-ld-highlight' },
  { id: 'produccion',   label: 'En producción',      icon: Factory,    color: 'text-ld-action' },
  { id: 'etiqueta',     label: 'Listo · generar etiqueta', icon: Tag,  color: 'text-ld-action' },
  { id: 'con_etiqueta', label: 'Con etiqueta · despachar',  icon: Truck, color: 'text-ld-action' },
  { id: 'despachado',   label: 'Despachados',        icon: CheckCircle2, color: 'text-ld-action' },
];

// Abre la etiqueta BlueExpress de un pedido ya emitido EN UN VISOR DENTRO DEL
// CHAT (modal con el PDF embebido) — sin enviar a páginas externas.
function VerEtiqueta({ pedido }) {
  const [busy, setBusy] = useState(false);
  const [labelUrl, setLabelUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const ver = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      const envios = await base44.entities.Envio.filter({ pedido_id: pedido.id }).catch(() => []);
      const envio = envios?.[0];
      if (envio?.id) {
        const res = await base44.functions.invoke('bluexGetLabel', { envio_id: envio.id });
        const d = res?.data || {};
        const url = d.label_url || (d.label_base64 ? `data:application/pdf;base64,${d.label_base64}` : null);
        if (url) setLabelUrl(url);
        else setErrorMsg('Sin etiqueta');
      } else {
        setErrorMsg('Sin envío');
      }
    } catch {
      setErrorMsg('Error');
    }
    setBusy(false);
  };

  return (
    <>
      <button onClick={ver} disabled={busy}
        className="text-[11px] text-ld-action hover:underline flex items-center gap-0.5 disabled:opacity-60">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
        {errorMsg || 'Etiqueta'}
      </button>
      {labelUrl && (
        <EtiquetaViewerModal
          labelUrl={labelUrl}
          titulo={`${pedido.numero_pedido || pedido.id?.slice(-6)} · ${pedido.cliente_nombre || ''}${pedido.tracking ? ` · OT ${pedido.tracking}` : ''}`}
          onClose={() => setLabelUrl(null)}
        />
      )}
    </>
  );
}

// Fila compacta de un pedido dentro de una columna del pipeline.
function PedidoRow({ p, etapa, onDone }) {
  return (
    <div className="rounded-xl px-2.5 py-2 bg-ld-bg-soft/60 border border-ld-border">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ld-fg truncate">{p.cliente_nombre || 'Cliente'}</div>
          <div className="text-[10px] text-ld-fg-muted truncate">
            {p.numero_pedido || p.id?.slice(-6)}{p.ciudad ? ` · ${p.ciudad}` : ''}{p.tracking ? ` · OT ${p.tracking}` : ''}
          </div>
        </div>
        <span className="text-[13px] font-semibold text-ld-fg flex-shrink-0">{fmtCLP(p.total)}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        {etapa === 'por_pagar' && (
          <ActionButton action="marcarPedidoPagado" payload={{ id: p.id }} label="Marcar pagado" icon={CheckCircle2} onDone={onDone} />
        )}
        {etapa === 'produccion' && (
          <ActionButton action="updatePedidoEstado" payload={{ id: p.id, estado: 'Listo para Despacho' }} label="→ Listo para despacho" icon={Factory} onDone={onDone} />
        )}
        {etapa === 'etiqueta' && (
          <ActionButton action="generarEtiqueta" payload={{ id: p.id }} label="Generar etiqueta BlueExpress" icon={Tag} variant="primary" onDone={onDone} />
        )}
        {etapa === 'con_etiqueta' && (
          <>
            <VerEtiqueta pedido={p} />
            <ActionButton action="updatePedidoEstado" payload={{ id: p.id, estado: 'Despachado' }} label="→ Despachado" icon={Truck} onDone={onDone} />
          </>
        )}
        {etapa === 'despachado' && p.tracking && <VerEtiqueta pedido={p} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PipelineCard — Pipeline de pedidos B2C aplicado DENTRO de la conversación.
// Agrupa los pedidos por etapa del flujo operativo y ofrece la acción correcta
// en cada una: confirmar pago → producción → generar etiqueta BlueExpress →
// despachar. Una sola pantalla, gestión real sin salir del chat.
// ════════════════════════════════════════════════════════════════════════
export default function PipelineCard({ lista = [], onDone }) {
  // Excluye pedidos cancelados/reembolsados; los entregados sí cuentan (etapa
  // "despachado"). Así el pipeline refleja solo el flujo accionable real.
  const enCurso = lista.filter((p) => !['Cancelado', 'Reembolsado'].includes(p.estado));
  const grupos = COLUMNAS.reduce((acc, c) => ({ ...acc, [c.id]: [] }), {});
  for (const p of enCurso) {
    const e = etapaDe(p);
    if (grupos[e]) grupos[e].push(p);
  }

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Package className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Pipeline de pedidos</span>
        </div>
        <span className="text-[11px] text-ld-fg-subtle">{enCurso.length} en curso</span>
      </div>

      {enCurso.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">No hay pedidos en curso 🎉</p>
      ) : (
        <div className="space-y-3">
          {COLUMNAS.map((col) => {
            const items = grupos[col.id];
            if (!items.length) return null;
            const Icon = col.icon;
            return (
              <div key={col.id}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted">{col.label}</span>
                  <span className="text-[10px] px-1.5 rounded-full bg-ld-bg-elevated text-ld-fg-subtle">{items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((p) => (
                    <PedidoRow key={p.id} p={p} etapa={col.id} onDone={onDone} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}