import { useState } from 'react';
import { AlertTriangle, MapPin, FileText, Loader2, Tag, CalendarCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ActionButton from '../ActionButton';
import EtiquetaViewerModal from '../EtiquetaViewerModal';
import { fmtRelativo, fmtFecha, fmtFechaHora } from '@/lib/fecha-relativa';

// Ver/imprimir la etiqueta Bluex del envío dentro del chat.
function LabelButton({ envio }) {
  const [state, setState] = useState('idle');
  const [labelUrl, setLabelUrl] = useState(null);

  const ver = async () => {
    setState('loading');
    try {
      const res = await base44.functions.invoke('bluexGetLabel', { envio_id: envio.id });
      const d = res?.data || {};
      const url = d.label_url || (d.label_base64 ? `data:application/pdf;base64,${d.label_base64}` : null);
      if (url) { setLabelUrl(url); setState('idle'); } else setState('error');
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <button onClick={ver} disabled={state === 'loading'}
        className="text-[10.5px] font-semibold text-ld-action hover:underline flex items-center gap-0.5 flex-shrink-0 disabled:opacity-60">
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

const ESTADO_DOT = {
  'Pendiente Emisión': 'var(--ld-highlight)',
  'No Entregado': 'var(--ld-highlight)',
  'Excepción': 'var(--ld-highlight)',
  'Entregado': 'var(--ld-fg-subtle)',
};

// Fila de envío: estado + destino + última señal en dos líneas, acciones al lado.
export default function ShipmentRow({ envio: e, onDone }) {
  const emision = e.fecha_emision || e.created_date;

  return (
    <div className="rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" title={e.estado}
            style={{ background: ESTADO_DOT[e.estado] || 'var(--ld-action)' }} />
          {e.tiene_excepcion && <AlertTriangle className="w-3 h-3 text-ld-highlight flex-shrink-0" />}
          <span className="text-[12.5px] font-semibold text-ld-fg truncate">{e.cliente_nombre || 'Cliente'}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-ld-fg-muted">{e.estado}</span>
          {e.tracking_number && e.estado !== 'Pendiente Emisión' && <LabelButton envio={e} />}
        </div>
      </div>

      <p className="text-[10.5px] text-ld-fg-muted truncate mt-0.5 flex items-center gap-1">
        {e.comuna_destino && <><MapPin className="w-2.5 h-2.5 flex-shrink-0" />{e.comuna_destino} · </>}
        OT {e.tracking_number || 'sin emitir'}
        {e.atrasado && <span className="text-ld-highlight font-bold flex-shrink-0"> · atrasado</span>}
      </p>

      <p className="text-[10px] text-ld-fg-subtle mt-0.5 truncate" title={fmtFechaHora(emision) || ''}>
        {e.fecha_entrega_real
          ? <span className="text-ld-action inline-flex items-center gap-1"><CalendarCheck className="w-2.5 h-2.5" /> Entregado {fmtRelativo(e.fecha_entrega_real)}</span>
          : e.fecha_entrega_estimada
            ? `Entrega est. ${fmtFecha(e.fecha_entrega_estimada)}`
            : emision ? `OT emitida ${fmtRelativo(emision)}` : ''}
        {e.ultimo_evento_descripcion ? ` · ${e.ultimo_evento_descripcion}` : ''}
      </p>

      {e.estado === 'Pendiente Emisión' && e.pedido_id && (
        <div className="mt-2">
          <ActionButton action="generarEtiqueta" payload={{ id: e.pedido_id }} label="Generar etiqueta" icon={Tag} onDone={onDone} />
        </div>
      )}
    </div>
  );
}