import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, X, CreditCard, Tag, CheckSquare } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// BulkActionBar — Barra de acciones rápidas en LOTE para el pipeline.
// Permite confirmar pagos o generar etiquetas BlueExpress de VARIOS pedidos
// a la vez, ejecutando agentOSAction secuencialmente por cada id seleccionado.
// No cambia la lógica de negocio: reutiliza las acciones individuales ya
// validadas en el backend (marcarPedidoPagado / generarEtiqueta).
// ════════════════════════════════════════════════════════════════════════
export default function BulkActionBar({ seleccionados = [], onClear, onDone }) {
  const [running, setRunning] = useState(false);
  const [progreso, setProgreso] = useState(null); // { hechos, total, ok, fail }

  const n = seleccionados.length;
  if (n === 0) return null;

  // ¿Qué acción aplica según las etapas de los pedidos seleccionados?
  const algunoPorPagar = seleccionados.some((p) => p.__bulk === 'pagar');
  const algunoPorEtiqueta = seleccionados.some((p) => p.__bulk === 'etiqueta');

  const ejecutar = async (action) => {
    // Solo opera sobre los pedidos cuya etapa coincide con la acción.
    const objetivo = seleccionados.filter((p) =>
      action === 'marcarPedidoPagado' ? p.__bulk === 'pagar' : p.__bulk === 'etiqueta'
    );
    if (!objetivo.length) return;
    setRunning(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < objetivo.length; i++) {
      setProgreso({ hechos: i, total: objetivo.length, ok, fail });
      try {
        const res = await base44.functions.invoke('agentOSAction', {
          action,
          payload: { id: objetivo[i].id },
        });
        if (res?.data?.error) throw new Error(res.data.error);
        ok++;
      } catch {
        fail++;
      }
    }
    setProgreso({ hechos: objetivo.length, total: objetivo.length, ok, fail });
    setRunning(false);
    onDone?.();
    // Limpia la barra tras un breve respiro para que se vea el resultado.
    setTimeout(() => { setProgreso(null); onClear?.(); }, 1800);
  };

  return (
    <div className="sticky bottom-0 z-10 mt-3 rounded-2xl border border-ld-action/40 bg-ld-bg-elevated/95 backdrop-blur px-3 py-2.5 shadow-lg"
      style={{ boxShadow: '0 8px 32px -8px rgba(15,139,108,0.35)' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ld-action">
          <CheckSquare className="w-4 h-4" /> {n} seleccionado{n > 1 ? 's' : ''}
        </span>

        <div className="flex-1" />

        {progreso ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-ld-fg-soft">
            {running && <Loader2 className="w-3.5 h-3.5 animate-spin text-ld-action" />}
            {progreso.hechos}/{progreso.total}
            {progreso.ok > 0 && <span className="text-ld-action inline-flex items-center gap-0.5"><Check className="w-3 h-3" />{progreso.ok}</span>}
            {progreso.fail > 0 && <span className="text-ld-highlight inline-flex items-center gap-0.5"><X className="w-3 h-3" />{progreso.fail}</span>}
          </span>
        ) : (
          <>
            {algunoPorPagar && (
              <button
                onClick={() => ejecutar('marcarPedidoPagado')}
                disabled={running}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors disabled:opacity-60">
                <CreditCard className="w-3.5 h-3.5" /> Confirmar pagos
              </button>
            )}
            {algunoPorEtiqueta && (
              <button
                onClick={() => ejecutar('generarEtiqueta')}
                disabled={running}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl ld-btn-primary text-white transition-colors disabled:opacity-60">
                <Tag className="w-3.5 h-3.5" /> Generar etiquetas
              </button>
            )}
            <button onClick={onClear} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-2 rounded-xl text-ld-fg-muted hover:text-ld-fg transition-colors">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          </>
        )}
      </div>
    </div>
  );
}