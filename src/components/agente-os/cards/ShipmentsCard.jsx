import { useState } from 'react';
import { Truck, AlertTriangle, RefreshCw, MapPin, FileText, Loader2, Tag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ActionButton from '../ActionButton';
import EtiquetaViewerModal from '../EtiquetaViewerModal';

// Ver/imprimir la etiqueta Bluex de un envío DENTRO del chat (visor embebido).
function LabelButton({ envio }) {
  const [state, setState] = useState('idle'); // idle | loading | error
  const [labelUrl, setLabelUrl] = useState(null);

  const ver = async () => {
    setState('loading');
    try {
      const res = await base44.functions.invoke('bluexGetLabel', { envio_id: envio.id });
      const d = res?.data || {};
      const url = d.label_url || (d.label_base64 ? `data:application/pdf;base64,${d.label_base64}` : null);
      if (url) { setLabelUrl(url); setState('idle'); }
      else setState('error');
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <button onClick={ver} disabled={state === 'loading'}
        className="text-[11px] text-ld-action hover:underline flex items-center gap-0.5 flex-shrink-0 disabled:opacity-60">
        {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
        {state === 'error' ? 'Sin etiqueta' : 'Etiqueta'}
      </button>
      {labelUrl && (
        <EtiquetaViewerModal
          labelUrl={labelUrl}
          titulo={`OT ${envio.tracking_number || ''} · ${envio.cliente_nombre || ''}`}
          onClose={() => setLabelUrl(null)}
        />
      )}
    </>
  );
}

const ESTADO_STYLE = {
  'Pendiente Emisión': 'bg-ld-highlight-soft text-ld-highlight',
  'Etiqueta Generada': 'bg-ld-action-soft text-ld-action',
  'En Bodega': 'bg-ld-action-soft text-ld-action',
  'Retirado por Courier': 'bg-ld-action-soft text-ld-action',
  'En Tránsito': 'bg-ld-action-soft text-ld-action',
  'En Reparto': 'bg-ld-action-soft text-ld-action',
  'No Entregado': 'bg-ld-highlight-soft text-ld-highlight',
  'Excepción': 'bg-ld-highlight-soft text-ld-highlight',
};

// Estado de envíos BlueExpress embebido en la conversación del agente:
// el founder ve OTs, estados, excepciones y sincroniza tracking sin salir.
export default function ShipmentsCard({ envios = [], metrics = {}, onDone }) {
  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Truck className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Envíos BlueExpress</span>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'En tránsito', value: metrics.envios_en_transito ?? '—' },
          { label: 'Entregados hoy', value: metrics.envios_entregados_hoy ?? '—' },
          { label: 'Con excepción', value: metrics.envios_con_excepcion ?? '—', alert: (metrics.envios_con_excepcion || 0) > 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-xl px-2.5 py-2 bg-ld-bg-soft/60 border border-ld-border text-center">
            <p className={`text-lg font-bold leading-none ${k.alert ? 'text-ld-highlight' : 'text-ld-fg'}`}>{k.value}</p>
            <p className="text-[10px] text-ld-fg-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {envios.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">Sin envíos activos en este momento 🎉</p>
      ) : (
        <div className="space-y-2.5">
          {envios.map((e) => (
            <div key={e.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ld-fg truncate flex items-center gap-1.5">
                    {e.tiene_excepcion && <AlertTriangle className="w-3.5 h-3.5 text-ld-highlight flex-shrink-0" />}
                    {e.cliente_nombre || 'Cliente'}
                  </div>
                  <div className="text-[11px] text-ld-fg-muted truncate">
                    OT {e.tracking_number || 'sin emitir'} · {e.numero_pedido || ''}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ESTADO_STYLE[e.estado] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
                  {e.estado}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <div className="text-[11px] text-ld-fg-muted truncate flex items-center gap-1 min-w-0">
                  {e.comuna_destino && <><MapPin className="w-3 h-3 flex-shrink-0" /> {e.comuna_destino}</>}
                  {e.ultimo_evento_descripcion && <span className="truncate"> · {e.ultimo_evento_descripcion}</span>}
                  {e.atrasado && <span className="text-ld-highlight font-semibold flex-shrink-0"> · atrasado</span>}
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Ver etiqueta (visor in-place) si ya fue emitida */}
                  {e.tracking_number && e.estado !== 'Pendiente Emisión' && <LabelButton envio={e} />}
                </div>
              </div>
              {/* Generar etiqueta si la OT aún no fue emitida */}
              {e.estado === 'Pendiente Emisión' && e.pedido_id && (
                <div className="mt-2">
                  <ActionButton
                    action="generarEtiqueta"
                    payload={{ id: e.pedido_id }}
                    label="Generar etiqueta BlueExpress"
                    icon={Tag}
                    onDone={onDone}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sincronizar tracking de todos los envíos sin salir del chat */}
      <div className="mt-3">
        <ActionButton
          action="sincronizarTracking"
          payload={{}}
          label="Sincronizar tracking BlueExpress"
          icon={RefreshCw}
          onDone={onDone}
        />
      </div>
    </div>
  );
}