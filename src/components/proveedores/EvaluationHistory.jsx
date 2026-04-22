import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Award } from 'lucide-react';
import EvaluationFormModal from './EvaluationFormModal';
import { scoreTier, SCORECARD_DIMENSIONS } from '@/lib/supplier-scorecard';

/**
 * Timeline de evaluaciones trimestrales del proveedor.
 */
export default function EvaluationHistory({ proveedor, evaluaciones, onReload }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-poppins font-semibold text-sm">Historial de evaluaciones</h3>
        <Button size="sm" onClick={() => setShowModal(true)} style={{ background: '#0F8B6C' }} className="text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" />Nueva evaluación
        </Button>
      </div>

      {evaluaciones.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-border border-dashed">
          <Award className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium">Sin evaluaciones aún</p>
          <p className="text-xs text-muted-foreground">Registra la primera evaluación trimestral</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evaluaciones.map(ev => {
            const tier = scoreTier(ev.score_global);
            return (
              <div key={ev.id} className="bg-white rounded-2xl p-3.5 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{ev.periodo}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.fecha_evaluacion} · {ev.evaluador || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.recomendacion && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-semibold">{ev.recomendacion}</span>
                    )}
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground uppercase font-semibold">Score</p>
                      <p className="font-poppins font-black text-xl" style={{ color: tier.color }}>{ev.score_global}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {SCORECARD_DIMENSIONS.map(dim => (
                    <div key={dim.key} className="text-center">
                      <p className="text-[9px] text-muted-foreground">{dim.icon}</p>
                      <p className="text-[11px] font-bold" style={{ color: dim.color }}>{ev[dim.key] ?? '—'}</p>
                    </div>
                  ))}
                </div>
                {(ev.fortalezas || ev.debilidades) && (
                  <div className="mt-2 pt-2 border-t border-border text-[11px] space-y-1">
                    {ev.fortalezas && <p><span className="font-semibold text-emerald-600">✓ Fortalezas:</span> <span className="text-muted-foreground">{ev.fortalezas}</span></p>}
                    {ev.debilidades && <p><span className="font-semibold text-amber-600">⚠ A mejorar:</span> <span className="text-muted-foreground">{ev.debilidades}</span></p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EvaluationFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        proveedor={proveedor}
        onSaved={() => { setShowModal(false); onReload?.(); }}
      />
    </div>
  );
}