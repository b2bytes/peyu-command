// ============================================================================
// AIRetrainQueuePanel · Cola de casos marcados para re-entrenamiento
// ----------------------------------------------------------------------------
// Lista los AILog con marked_for_retraining=true y muestra el "gold standard"
// (respuesta corregida) que servirá para fine-tuning. Permite exportar JSONL.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Download, Eye, Check, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AIRetrainQueuePanel({ onSelectLog, refreshKey }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AILog.filter(
        { marked_for_retraining: true },
        '-created_date',
        50
      );
      setQueue(data || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  // Exporta la cola como JSONL para fine-tuning (formato OpenAI)
  const exportJsonl = () => {
    if (queue.length === 0) {
      toast.error('No hay casos en la cola');
      return;
    }
    const lines = queue
      .filter(l => l.user_message && l.retraining_corrected_response)
      .map(l => JSON.stringify({
        messages: [
          { role: 'system', content: `Eres ${l.agent_name}, asistente de PEYU.` },
          { role: 'user', content: l.user_message },
          { role: 'assistant', content: l.retraining_corrected_response },
        ],
        metadata: {
          ailog_id: l.id,
          agent: l.agent_name,
          original_model: l.model,
          original_response: l.ai_response,
          notes: l.auditor_notes,
        },
      }));

    const blob = new Blob([lines.join('\n')], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peyu_retrain_${new Date().toISOString().slice(0, 10)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`📦 ${lines.length} ejemplos exportados`);
  };

  const markApplied = async (id) => {
    try {
      await base44.entities.AILog.update(id, { retraining_status: 'applied' });
      toast.success('✅ Marcado como aplicado');
      load();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const removeFromQueue = async (id) => {
    try {
      await base44.entities.AILog.update(id, {
        marked_for_retraining: false,
        retraining_status: 'rejected',
      });
      toast.success('Removido de la cola');
      load();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-400/25 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">Cola de Re-entrenamiento</h3>
            <p className="text-[11px] text-white/50 font-inter">{queue.length} ejemplos gold standard listos para fine-tuning</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={exportJsonl}
          disabled={queue.length === 0}
          className="h-8 bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-400/30 gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-xs">Exportar JSONL</span>
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto peyu-scrollbar-light">
        {loading && queue.length === 0 && (
          <div className="p-6 text-center text-white/40 text-sm font-inter flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando cola...
          </div>
        )}
        {!loading && queue.length === 0 && (
          <div className="p-8 text-center">
            <GraduationCap className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm font-inter">No hay casos en la cola.</p>
            <p className="text-white/30 text-xs font-inter mt-1">Marca respuestas como "re-entrenar" desde la consola.</p>
          </div>
        )}
        <div className="divide-y divide-white/5">
          {queue.map(log => (
            <div key={log.id} className="p-4 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-jakarta font-bold text-white text-xs">{log.agent_name}</span>
                    <span className="text-[10px] text-white/30 font-mono">{log.model}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      log.retraining_status === 'applied'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
                        : 'bg-violet-500/15 text-violet-300 border-violet-400/25'
                    }`}>
                      {log.retraining_status || 'queued'}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 font-inter line-clamp-1 mb-1">
                    <span className="text-white/40">→</span> {log.user_message}
                  </p>
                  <p className="text-xs text-rose-300/70 font-inter line-clamp-1 mb-1">
                    <span className="text-white/40">❌ Original:</span> {log.ai_response?.slice(0, 100)}
                  </p>
                  <p className="text-xs text-emerald-300/80 font-inter line-clamp-2 bg-emerald-500/5 border border-emerald-400/15 rounded p-2 mt-1.5">
                    <span className="font-bold">✅ Corregida:</span> {log.retraining_corrected_response?.slice(0, 200)}
                  </p>
                  {log.auditor_notes && (
                    <p className="text-[11px] text-amber-200/80 font-inter mt-1 italic">
                      💬 {log.auditor_notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Button size="sm" variant="ghost" onClick={() => onSelectLog?.(log)}
                  className="h-7 text-white/60 hover:text-white hover:bg-white/5 text-[11px] gap-1">
                  <Eye className="w-3 h-3" /> Ver
                </Button>
                {log.retraining_status !== 'applied' && (
                  <Button size="sm" variant="ghost" onClick={() => markApplied(log.id)}
                    className="h-7 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 text-[11px] gap-1">
                    <Check className="w-3 h-3" /> Aplicado
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => removeFromQueue(log.id)}
                  className="h-7 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 text-[11px] gap-1 ml-auto">
                  <Trash2 className="w-3 h-3" /> Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}