import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check } from 'lucide-react';

// Fila editable de un texto del sitio (TextoPagina) dentro del chat del Agente OS.
export default function TextoEditRow({ texto, onSaved }) {
  const [valor, setValor] = useState(texto.valor || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const changed = valor !== (texto.valor || '');

  const guardar = async () => {
    setSaving(true);
    await base44.entities.TextoPagina.update(texto.id, { valor }).catch(() => null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  };

  return (
    <div className="rounded-xl border border-ld-border bg-ld-bg-elevated p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-bold text-ld-fg truncate">{texto.etiqueta || texto.clave}</p>
        <span className="text-[9px] font-mono text-ld-fg-subtle truncate">{texto.clave}</span>
      </div>
      {texto.multilinea ? (
        <textarea
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          rows={3}
          className="w-full rounded-lg ld-input !rounded-xl text-xs px-3 py-2 resize-y"
        />
      ) : (
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full h-8 rounded-lg ld-input text-xs px-3"
        />
      )}
      {(changed || saved) && (
        <div className="flex justify-end mt-1.5">
          {saved ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ld-action"><Check className="w-3 h-3" /> Guardado</span>
          ) : (
            <button
              onClick={guardar}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-white ld-btn-primary"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Guardar
            </button>
          )}
        </div>
      )}
    </div>
  );
}