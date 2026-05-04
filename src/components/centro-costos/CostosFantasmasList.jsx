import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Receipt, Calendar, MapPin, Tag, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIA_COLORS = {
  'Viaje / Transporte': 'bg-blue-50 text-blue-700 border-blue-200',
  'Materiales menores': 'bg-amber-50 text-amber-700 border-amber-200',
  'Herramientas': 'bg-purple-50 text-purple-700 border-purple-200',
  'Software / Suscripción': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Marketing menor (regalos, muestras)': 'bg-pink-50 text-pink-700 border-pink-200',
};

const ESTADO_COLORS = {
  pendiente_revision: 'bg-amber-100 text-amber-800',
  aprobado: 'bg-blue-100 text-blue-800',
  prorrateado: 'bg-emerald-100 text-emerald-800',
  rechazado: 'bg-red-100 text-red-800',
};

export default function CostosFantasmasList({ items, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este costo? No se podrá recuperar.')) return;
    setDeletingId(id);
    try {
      await base44.entities.CostoFantasma.delete(id);
      toast.success('Eliminado');
      onDeleted?.();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
        <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">Sin costos registrados aún</p>
        <p className="text-xs text-muted-foreground mt-1">Captura tu primera boleta o gasto fantasma</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-semibold">Fecha</th>
              <th className="text-left px-4 py-2.5 font-semibold">Descripción</th>
              <th className="text-left px-4 py-2.5 font-semibold">Categoría</th>
              <th className="text-left px-4 py-2.5 font-semibold">Asignación</th>
              <th className="text-right px-4 py-2.5 font-semibold">Monto</th>
              <th className="text-center px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {c.fecha}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground line-clamp-1">{c.descripcion || c.proveedor || '—'}</p>
                  {c.proveedor && c.descripcion && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {c.proveedor}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${CATEGORIA_COLORS[c.categoria] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {c.categoria}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <Tag className="w-3 h-3 inline mr-1" />
                  {c.asignacion_tipo || 'Indirecto general (todos)'}
                </td>
                <td className="px-4 py-3 text-right font-poppins font-bold tabular-nums">
                  ${(c.monto_clp || 0).toLocaleString('es-CL')}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${ESTADO_COLORS[c.estado] || 'bg-slate-100 text-slate-700'}`}>
                    {c.estado === 'pendiente_revision' ? 'Pend.' : c.estado === 'prorrateado' ? '✓ Prorrat.' : c.estado}
                  </span>
                </td>
                <td className="px-2 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {c.boleta_url && (
                      <a href={c.boleta_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground p-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-muted-foreground hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}