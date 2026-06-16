import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Truck, CreditCard, Factory, Tag, CheckCircle2, Loader2, Clock, Building2, User, ChevronRight } from 'lucide-react';
import ActionButton from '../ActionButton';
import BulkActionBar from './BulkActionBar';
import EtiquetaViewerModal from '../EtiquetaViewerModal';
import { fmtRelativo, fmtFechaHora } from '@/lib/fecha-relativa';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// ¿El pedido está pagado? (payment_status paid o estado post-pago).
const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
const estaPagado = (p) => p.payment_status === 'paid' || ESTADOS_PAGADOS.includes(p.estado);

// ¿Es un pedido B2B? (factura o tipo de cliente corporativo/pyme).
const esB2B = (p) =>
  p.tipo_documento === 'Factura' ||
  (typeof p.tipo_cliente === 'string' && p.tipo_cliente.startsWith('B2B')) ||
  !!p.razon_social;

// Etapa del pipeline a la que pertenece cada pedido.
function etapaDe(p) {
  if (['Despachado', 'Entregado'].includes(p.estado)) return 'despachado';
  if (!estaPagado(p) || p.estado === 'Nuevo') return 'por_pagar';
  if (p.tracking) return 'con_etiqueta';      // pagado y con OT → listo para despachar
  if (p.estado === 'Listo para Despacho') return 'etiqueta';
  return 'produccion';                        // confirmado / en producción
}

// ── Flujo secuencial canónico de un pedido (e-commerce moderno) ──────────
// Inspirado en los flujos estándar de Shopify/Amazon: cada pedido recorre
// estas 5 etapas en orden lógico, de principio a fin.
const COLUMNAS = [
  { id: 'por_pagar',    label: 'Por confirmar pago', icon: CreditCard,   color: 'text-ld-highlight' },
  { id: 'produccion',   label: 'En producción',      icon: Factory,      color: 'text-ld-action' },
  { id: 'etiqueta',     label: 'Listo · generar etiqueta', icon: Tag,    color: 'text-ld-action' },
  { id: 'con_etiqueta', label: 'Con etiqueta · despachar',  icon: Truck,  color: 'text-ld-action' },
  { id: 'despachado',   label: 'Despachados',        icon: CheckCircle2, color: 'text-ld-action' },
];
const ORDEN = COLUMNAS.map((c) => c.id);

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

// Mini-stepper que muestra POR DÓNDE va este pedido en el flujo completo.
function FlowStepper({ etapaActual }) {
  const idx = ORDEN.indexOf(etapaActual);
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {COLUMNAS.map((c, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <span key={c.id} className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                active ? 'bg-ld-action ring-2 ring-ld-action/30' : done ? 'bg-ld-action/60' : 'bg-ld-border-strong'
              }`}
              title={c.label}
            />
            {i < COLUMNAS.length - 1 && (
              <span className={`w-3 h-px ${i < idx ? 'bg-ld-action/50' : 'bg-ld-border'}`} />
            )}
          </span>
        );
      })}
    </div>
  );
}

// Fila compacta de un pedido dentro de una columna del pipeline.
// `selectable` muestra checkbox para acciones en lote; `selected`/`onSelect`
// controlan ese estado desde el padre.
function PedidoRow({ p, etapa, onDone, selectable, selected, onSelect }) {
  const b2b = esB2B(p);
  return (
    <div className={`rounded-xl px-2.5 py-2 border transition-colors ${selected ? 'bg-ld-action-soft border-ld-action/50' : 'bg-ld-bg-soft/60 border-ld-border'}`}>
      <div className="flex items-center gap-2">
        {selectable && (
          <button
            onClick={() => onSelect(p)}
            className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
              selected ? 'bg-ld-action border-ld-action text-white' : 'border-ld-border-strong text-transparent hover:border-ld-action'
            }`}
            aria-label="Seleccionar pedido"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {/* Badge B2C / B2B — diferencia el flujo según tipo de pedido */}
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              b2b ? 'bg-ld-highlight-soft text-ld-highlight' : 'bg-ld-action-soft text-ld-action'
            }`}>
              {b2b ? <Building2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
              {b2b ? 'B2B' : 'B2C'}
            </span>
            <span className="text-[13px] font-medium text-ld-fg truncate">{p.cliente_nombre || p.razon_social || 'Cliente'}</span>
          </div>
          <div className="text-[10px] text-ld-fg-muted truncate">
            {p.numero_pedido || p.id?.slice(-6)}{p.ciudad ? ` · ${p.ciudad}` : ''}{p.tracking ? ` · OT ${p.tracking}` : ''}
          </div>
        </div>
        <span className="text-[13px] font-semibold text-ld-fg flex-shrink-0">{fmtCLP(p.total)}</span>
      </div>

      {/* Stepper visual de avance en el flujo completo */}
      <FlowStepper etapaActual={etapa} />

      {/* Fechas precisas del pedido: generado y, si aplica, pagado */}
      <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px] text-ld-fg-subtle">
        {(p.created_date || p.fecha) && (
          <span className="inline-flex items-center gap-1" title={fmtFechaHora(p.created_date || p.fecha) || ''}>
            <Clock className="w-2.5 h-2.5" /> Generado {fmtRelativo(p.created_date || p.fecha)}
          </span>
        )}
        {p.comprobante_enviado_at && (
          <span className="inline-flex items-center gap-1 text-ld-action" title={fmtFechaHora(p.comprobante_enviado_at) || ''}>
            <CheckCircle2 className="w-2.5 h-2.5" /> Pagado {fmtRelativo(p.comprobante_enviado_at)}
          </span>
        )}
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
// PipelineCard — Pipeline de pedidos aplicado DENTRO de la conversación.
// Muestra el flujo secuencial completo de principio a fin (e-commerce moderno):
// Por confirmar pago → En producción → Generar etiqueta → Despachar → Despachado.
// Cada pedido lleva un badge B2C/B2B y un stepper visual de avance.
// En las etapas "por pagar" y "generar etiqueta" se pueden SELECCIONAR varios
// pedidos y confirmar pagos / generar etiquetas EN LOTE.
// ════════════════════════════════════════════════════════════════════════
export default function PipelineCard({ lista = [], onDone }) {
  // Mapa de seleccionados: { [id]: pedido enriquecido con __bulk }
  const [sel, setSel] = useState({});

  // Excluye pedidos cancelados/reembolsados; los entregados sí cuentan (etapa
  // "despachado"). Así el pipeline refleja solo el flujo accionable real.
  const enCurso = lista.filter((p) => !['Cancelado', 'Reembolsado'].includes(p.estado));
  const grupos = COLUMNAS.reduce((acc, c) => ({ ...acc, [c.id]: [] }), {});
  for (const p of enCurso) {
    const e = etapaDe(p);
    if (grupos[e]) grupos[e].push(p);
  }

  // Etapas que permiten acción en lote y su tipo de acción.
  const BULK_ETAPA = { por_pagar: 'pagar', etiqueta: 'etiqueta' };

  const toggle = (p, bulkType) => {
    setSel((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = { ...p, __bulk: bulkType };
      return next;
    });
  };

  // Selecciona/deselecciona todos los de una etapa.
  const toggleEtapa = (items, bulkType) => {
    setSel((prev) => {
      const next = { ...prev };
      const todosSel = items.every((p) => next[p.id]);
      items.forEach((p) => {
        if (todosSel) delete next[p.id];
        else next[p.id] = { ...p, __bulk: bulkType };
      });
      return next;
    });
  };

  const seleccionados = Object.values(sel);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Package className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Flujo de pedidos · de principio a fin</span>
        </div>
        <span className="text-[11px] text-ld-fg-subtle">{enCurso.length} en curso</span>
      </div>

      {/* Leyenda del flujo secuencial — orden lógico visible siempre */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {COLUMNAS.map((c, i) => {
          const Icon = c.icon;
          const count = grupos[c.id].length;
          return (
            <div key={c.id} className="flex items-center gap-1 flex-shrink-0">
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg ${count ? 'bg-ld-action-soft text-ld-action' : 'bg-ld-bg-soft text-ld-fg-subtle'}`}>
                <Icon className="w-3 h-3" /> {c.label.split(' · ')[0]}
                {count > 0 && <span className="font-bold">· {count}</span>}
              </span>
              {i < COLUMNAS.length - 1 && <ChevronRight className="w-3 h-3 text-ld-fg-subtle flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {enCurso.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">No hay pedidos en curso 🎉</p>
      ) : (
        <div className="space-y-3">
          {COLUMNAS.map((col) => {
            const items = grupos[col.id];
            if (!items.length) return null;
            const Icon = col.icon;
            const bulkType = BULK_ETAPA[col.id];
            const selectable = !!bulkType;
            const todosSel = selectable && items.every((p) => sel[p.id]);
            return (
              <div key={col.id}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted">{col.label}</span>
                  <span className="text-[10px] px-1.5 rounded-full bg-ld-bg-elevated text-ld-fg-subtle">{items.length}</span>
                  {selectable && items.length > 1 && (
                    <button
                      onClick={() => toggleEtapa(items, bulkType)}
                      className="ml-auto text-[10px] font-medium text-ld-action hover:underline"
                    >
                      {todosSel ? 'Quitar todos' : 'Seleccionar todos'}
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {items.map((p) => (
                    <PedidoRow
                      key={p.id}
                      p={p}
                      etapa={col.id}
                      onDone={onDone}
                      selectable={selectable}
                      selected={!!sel[p.id]}
                      onSelect={(ped) => toggle(ped, bulkType)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BulkActionBar
        seleccionados={seleccionados}
        onClear={() => setSel({})}
        onDone={onDone}
      />
    </div>
  );
}