import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Lightbulb, Check, Loader2, Tag } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// SaveInsightButton — Guarda un intercambio completo (pregunta del founder
// + respuesta del agente) como un INSIGHT DE MEJORA del sistema. Se escribe
// en Pinecone + MetaAgentMemory con kind='instruccion' para que todos los
// agentes puedan recuperarlo y "aprender" qué debe mejorar el sistema.
//
// A diferencia de SaveKnowledgeButton (que guarda solo la respuesta), este
// captura el CONTEXTO completo: qué preguntó el founder + qué respondió el
// agente, formateado como una mejora accionable.
// ════════════════════════════════════════════════════════════════════════
export default function SaveInsightButton({ userMessage, agentMessage }) {
  const [state, setState] = useState('idle'); // idle | saving | saved
  const [showTag, setShowTag] = useState(false);
  const [tag, setTag] = useState('');

  const tags = [
    'Mejorar catálogo',
    'Mejorar imágenes',
    'Mejorar respuesta del agente',
    'Flujo a optimizar',
    'Bug o error',
    'Idea de producto',
  ];

  const save = async () => {
    if (state !== 'idle') return;
    const userText = (userMessage || '').trim();
    const agentText = (agentMessage || '').trim();
    if (!userText && !agentText) return;

    setState('saving');
    try {
      const contexto = [
        tag ? `[TEMA: ${tag}]` : '[TEMA: mejora del sistema]',
        '',
        'PREGUNTA DEL FOUNDER:',
        userText || '(sin texto, con adjuntos)',
        '',
        'RESPUESTA DEL AGENTE:',
        agentText || '(tarjetas/acciones, sin texto)',
        '',
        `INSIGHT DE MEJORA (${new Date().toLocaleString('es-CL')}):`,
        'Este intercambio enseña al sistema qué debe mejorar. Analizar el patrón y optimizarlo.',
      ].join('\n');

      const res = await base44.functions.invoke('saveKnowledge', {
        text: contexto,
        source: 'agente_os',
        kind: 'instruccion',
      });
      setState(res?.data?.ok ? 'saved' : 'idle');
    } catch {
      setState('idle');
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {showTag && (
        <div className="flex items-center gap-1 flex-wrap mr-1">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border ${
                tag === t
                  ? 'bg-ld-highlight-soft text-ld-highlight border-ld-highlight/40'
                  : 'border-ld-border text-ld-fg-muted hover:text-ld-fg'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setShowTag((v) => !v)}
        className={`p-1 rounded-full transition-colors ${
          showTag ? 'text-ld-highlight bg-ld-highlight-soft' : 'text-ld-fg-subtle hover:text-ld-highlight hover:bg-ld-highlight-soft'
        }`}
        title="Etiquetar tema"
      >
        <Tag className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={save}
        disabled={state !== 'idle'}
        className={`inline-flex items-center gap-1 p-1 rounded-full transition-colors ${
          state === 'saved'
            ? 'text-ld-highlight bg-ld-highlight-soft'
            : 'text-ld-fg-subtle hover:text-ld-highlight hover:bg-ld-highlight-soft'
        }`}
        title={state === 'saved' ? 'Guardado como insight de mejora del sistema' : 'Guardar este intercambio como mejora que alimenta al sistema'}
      >
        {state === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : state === 'saved' ? <Check className="w-3.5 h-3.5" />
          : <Lightbulb className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}