// Panel de notas rápidas + historial de contacto para un ChatLead
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, StickyNote, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LeadNotasRapidas({ lead, onUpdate }) {
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  const notas = Array.isArray(lead?.datos_capturados)
    ? lead.datos_capturados.filter(d => d.campo === '_nota')
    : [];

  const handleSave = async () => {
    if (!nota.trim()) return;
    setSaving(true);
    const nuevaNota = {
      campo: '_nota',
      valor: nota.trim(),
      at: new Date().toISOString(),
    };
    const datos = [...(lead.datos_capturados || []), nuevaNota];
    const notas_internas = lead.notas_internas
      ? `${lead.notas_internas}\n\n[${new Date().toLocaleDateString('es-CL')}] ${nota.trim()}`
      : `[${new Date().toLocaleDateString('es-CL')}] ${nota.trim()}`;

    await base44.entities.ChatLead.update(lead.id, { datos_capturados: datos, notas_internas });
    onUpdate({ ...lead, datos_capturados: datos, notas_internas });
    setNota('');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Input nueva nota */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">Nota rápida</span>
        </div>
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Ej: Cliente interesado en 50u cachos, tiene evento el 15 de julio…"
          rows={3}
          className="w-full text-sm bg-white border border-amber-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-amber-400/70"
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
        />
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-amber-600">⌘+Enter para guardar</span>
          <button
            onClick={handleSave}
            disabled={!nota.trim() || saving}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Historial de notas */}
      {notas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Historial de notas ({notas.length})
          </p>
          {notas.slice().reverse().map((n, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{n.valor}</p>
              {n.at && (
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {formatDistanceToNow(new Date(n.at), { locale: es, addSuffix: true })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {notas.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-3 italic">Aún no hay notas para este lead.</p>
      )}
    </div>
  );
}