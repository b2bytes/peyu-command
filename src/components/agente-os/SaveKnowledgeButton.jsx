import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookmarkPlus, Check, Loader2, BrainCircuit } from 'lucide-react';

// Botón "Guardar" presente en cada respuesta de los agentes (Meta Ads y Agent
// OS). Al presionarlo, valida y guarda esa respuesta en Pinecone + la base de
// conocimiento general de PEYU (vía saveKnowledge). Estados: idle → saving →
// saved. dark=true para el tema oscuro del panel de Meta Ads.
export default function SaveKnowledgeButton({ text, source = 'agente_os', dark = false }) {
  const [state, setState] = useState('idle'); // idle | saving | saved

  const save = async () => {
    if (state !== 'idle' || !text?.trim()) return;
    setState('saving');
    try {
      const res = await base44.functions.invoke('saveKnowledge', { text, source });
      setState(res?.data?.ok ? 'saved' : 'idle');
    } catch {
      setState('idle');
    }
  };

  const base = dark
    ? 'text-white/40 hover:text-emerald-300 hover:bg-emerald-500/10'
    : 'text-ld-fg-subtle hover:text-ld-action hover:bg-ld-action-soft';
  const savedCls = dark ? 'text-emerald-300 bg-emerald-500/15' : 'text-ld-action bg-ld-action-soft';

  return (
    <button
      onClick={save}
      disabled={state !== 'idle'}
      className={`inline-flex items-center gap-1 p-1 rounded-full transition-colors ${state === 'saved' ? savedCls : base}`}
      title={state === 'saved' ? 'Guardado en la base de conocimiento de PEYU' : 'Guardar esta respuesta en Pinecone + base de conocimiento'}
    >
      {state === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : state === 'saved' ? <Check className="w-3.5 h-3.5" />
        : <BookmarkPlus className="w-3.5 h-3.5" />}
    </button>
  );
}