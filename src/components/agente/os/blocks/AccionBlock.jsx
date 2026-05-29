// ============================================================================
// PEYU OS · AccionBlock
// Tarjeta de acción declarada por el LLM. Muestra entidad, registro, cambios
// propuestos y un botón de confirmación. Al pulsarlo, ejecuta el cambio real
// vía la entidad correspondiente (E.update) y recarga datos.
// ============================================================================
import { useState } from 'react';
import { CheckCircle2, Loader2, Zap } from 'lucide-react';

const ENTIDAD_LABEL = {
  Lead: 'Lead B2B',
  Cotizacion: 'Cotización',
  Pedido: 'Pedido',
  Producto: 'Producto',
};

export default function AccionBlock({ accion, onEjecutar }) {
  const [estado, setEstado] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!accion?.entidad || !accion?.registro_id || !accion?.cambios) return null;

  const handleConfirm = async () => {
    if (estado === 'loading' || estado === 'done') return;
    setEstado('loading');
    try {
      await onEjecutar(accion);
      setEstado('done');
    } catch (e) {
      setErrorMsg(e?.message || 'No se pudo aplicar el cambio');
      setEstado('error');
    }
  };

  const cambios = Object.entries(accion.cambios || {});

  return (
    <div className="rounded-2xl bg-white border border-[#e7d8c6] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#D96B4D]/10 text-[#D96B4D]">
          <Zap className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#22302c] truncate">
            {accion.etiqueta || `Actualizar ${ENTIDAD_LABEL[accion.entidad] || accion.entidad}`}
          </p>
          <p className="text-[11px] text-[#9aa6a0]">
            {ENTIDAD_LABEL[accion.entidad] || accion.entidad} · {accion.registro_id}
          </p>
        </div>
      </div>

      {accion.detalle && <p className="text-sm text-[#6f7d77] mb-3 leading-relaxed">{accion.detalle}</p>}

      {cambios.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cambios.map(([k, v]) => (
            <span key={k} className="text-[11px] px-2 py-1 rounded-lg bg-[#f6f1ea] text-[#22302c] border border-[#ece4d8]">
              <span className="text-[#9aa6a0]">{k}:</span> <span className="font-medium">{String(v)}</span>
            </span>
          ))}
        </div>
      )}

      {estado === 'done' ? (
        <div className="flex items-center gap-2 text-sm font-medium text-[#0F8B6C]">
          <CheckCircle2 className="w-4 h-4" /> Cambio aplicado
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={estado === 'loading'}
          className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white transition-colors disabled:opacity-50"
        >
          {estado === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Confirmar y aplicar
        </button>
      )}

      {estado === 'error' && <p className="text-xs text-[#D96B4D] mt-2">{errorMsg}</p>}
    </div>
  );
}