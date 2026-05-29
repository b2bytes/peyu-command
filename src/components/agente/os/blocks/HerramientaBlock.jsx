// ============================================================================
// PEYU OS · HerramientaBlock
// Tarjeta para ejecutar una tarea backend (CRON / función) declarada por el LLM.
// El usuario confirma con un botón; al pulsarlo invoca la función y recarga.
// ============================================================================
import { useState } from 'react';
import { CheckCircle2, Loader2, Wrench } from 'lucide-react';

export default function HerramientaBlock({ herramienta, onEjecutar }) {
  const [estado, setEstado] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!herramienta?.fn) return null;

  const handleConfirm = async () => {
    if (estado === 'loading' || estado === 'done') return;
    setEstado('loading');
    try {
      await onEjecutar(herramienta);
      setEstado('done');
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e?.message || 'No se pudo ejecutar');
      setEstado('error');
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#e7d8c6] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0F8B6C]/10 text-[#0F8B6C]">
          <Wrench className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#22302c] truncate">
            {herramienta.etiqueta || herramienta.fn}
          </p>
          <p className="text-[11px] text-[#9aa6a0] font-mono">{herramienta.fn}</p>
        </div>
      </div>

      {herramienta.detalle && <p className="text-sm text-[#6f7d77] mb-3 leading-relaxed">{herramienta.detalle}</p>}

      {estado === 'done' ? (
        <div className="flex items-center gap-2 text-sm font-medium text-[#0F8B6C]">
          <CheckCircle2 className="w-4 h-4" /> Tarea ejecutada
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={estado === 'loading'}
          className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white transition-colors disabled:opacity-50"
        >
          {estado === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
          Ejecutar tarea
        </button>
      )}

      {estado === 'error' && <p className="text-xs text-[#D96B4D] mt-2">{errorMsg}</p>}
    </div>
  );
}