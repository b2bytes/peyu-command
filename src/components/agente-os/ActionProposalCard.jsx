import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Check, X, Loader2, AlertTriangle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// ActionProposalCard — Tarjeta de acción propuesta por el agente en el chat.
// El LLM detecta la intención ("marca el pedido X como pagado") y propone la
// acción; el founder la confirma con 1 clic y se ejecuta vía agentOSAction.
// Toda mutación pasa por aquí: nunca se ejecuta sin confirmación humana.
// ════════════════════════════════════════════════════════════════════════
export default function ActionProposalCard({ proposal, onDone }) {
  const [status, setStatus] = useState('pending'); // pending | running | done | error | cancelled
  const [result, setResult] = useState('');

  const ejecutar = async () => {
    setStatus('running');
    try {
      const res = await base44.functions.invoke('agentOSAction', {
        action: proposal.action,
        payload: proposal.payload || {},
      });
      setResult(res?.data?.message || 'Acción ejecutada ✓');
      setStatus('done');
      onDone?.();
    } catch (e) {
      setResult(e?.response?.data?.error || e.message || 'Error ejecutando la acción');
      setStatus('error');
    }
  };

  if (status === 'cancelled') return null;

  return (
    <div className="ml-12 max-w-[680px]">
      <div className="ld-card rounded-2xl p-3.5 border-l-4" style={{ borderLeftColor: 'var(--ld-highlight)' }}>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-ld-highlight-soft flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ld-highlight" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ld-fg">
              {proposal.descripcion || `Ejecutar: ${proposal.action}`}
            </p>
            <p className="text-[10px] text-ld-fg-muted mt-0.5 font-mono truncate">
              {proposal.action}
              {proposal.payload && Object.keys(proposal.payload).length > 0 &&
                ` · ${Object.entries(proposal.payload).map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`).join(' · ')}`}
            </p>

            {status === 'pending' && (
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={ejecutar}
                  className="ld-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" /> Confirmar y ejecutar
                </button>
                <button
                  onClick={() => setStatus('cancelled')}
                  className="ld-btn-ghost inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-ld-fg-soft"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              </div>
            )}

            {status === 'running' && (
              <p className="flex items-center gap-1.5 mt-2.5 text-xs text-ld-fg-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ejecutando…
              </p>
            )}

            {status === 'done' && (
              <p className="flex items-center gap-1.5 mt-2.5 text-xs font-bold" style={{ color: 'var(--ld-action)' }}>
                <Check className="w-3.5 h-3.5" /> {result}
              </p>
            )}

            {status === 'error' && (
              <p className="flex items-center gap-1.5 mt-2.5 text-xs font-bold text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {result}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}