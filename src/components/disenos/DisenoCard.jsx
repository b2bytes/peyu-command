import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';

// Card de un diseño PEYU en el admin: preview, estado y acciones rápidas.
export default function DisenoCard({ diseno, onEdit, onChanged }) {
  const [busy, setBusy] = useState(false);

  const toggleActivo = async () => {
    setBusy(true);
    await base44.entities.DisenoPeyu.update(diseno.id, { activo: !diseno.activo }).catch(() => {});
    setBusy(false);
    onChanged();
  };

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar el diseño "${diseno.nombre}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await base44.entities.DisenoPeyu.delete(diseno.id).catch(() => {});
    setBusy(false);
    onChanged();
  };

  return (
    <div className={`ld-card overflow-hidden ${diseno.activo ? '' : 'opacity-55'}`}>
      <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
        <img
          src={diseno.imagen_grabado_url || diseno.imagen_url}
          alt={diseno.nombre}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
        {!diseno.imagen_grabado_url && (
          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            sin grabado
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-ld-fg truncate">{diseno.nombre}</p>
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={onEdit}
            className="flex-1 h-7 rounded-lg text-[10px] font-bold ld-btn-ghost flex items-center justify-center gap-1"
          >
            <Pencil className="w-3 h-3" /> Editar
          </button>
          <button
            onClick={toggleActivo}
            disabled={busy}
            className="w-7 h-7 rounded-lg ld-btn-ghost flex items-center justify-center"
            title={diseno.activo ? 'Ocultar del personalizador' : 'Mostrar en el personalizador'}
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : diseno.activo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button
            onClick={eliminar}
            disabled={busy}
            className="w-7 h-7 rounded-lg ld-btn-ghost flex items-center justify-center text-ld-highlight"
            title="Eliminar diseño"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}