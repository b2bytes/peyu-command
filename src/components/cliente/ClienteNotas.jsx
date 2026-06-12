import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { StickyNote, Pencil, Check, X, Loader2 } from 'lucide-react';

// Notas internas editables in-place — administración uno a uno sin salir de la ficha.
export default function ClienteNotas({ cliente, onClienteUpdate }) {
  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState(cliente.notas || '');
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    setSaving(true);
    await base44.entities.Cliente.update(cliente.id, { notas: texto });
    onClienteUpdate({ ...cliente, notas: texto });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
          <StickyNote className="w-4 h-4" /> Notas internas
        </h3>
        {!editing ? (
          <button onClick={() => { setTexto(cliente.notas || ''); setEditing(true); }}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Editar
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button onClick={guardar} disabled={saving}
              className="px-2 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 flex items-center gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
            </button>
            <button onClick={() => setEditing(false)}
              className="px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-700 text-[11px] font-bold hover:bg-amber-100 flex items-center gap-1">
              <X className="w-3 h-3" /> Cancelar
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={4}
          className="w-full text-sm bg-white border border-amber-300 rounded-xl p-3 text-amber-900 outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Acuerdos, preferencias, contexto del cliente..." />
      ) : (
        <p className="text-sm text-amber-800 whitespace-pre-line">
          {cliente.notas || <span className="text-amber-500 italic">Sin notas aún — agrega contexto para la próxima conversación.</span>}
        </p>
      )}
    </div>
  );
}