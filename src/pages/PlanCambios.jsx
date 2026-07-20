import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, MessageSquare, Loader2, GitBranch } from 'lucide-react';
import TareaGanttRow from '@/components/plan-cambios/TareaGanttRow';
import TareaFormModal from '@/components/plan-cambios/TareaFormModal';

const FILTROS = ['Todas', 'En curso', 'Pendiente', 'En revisión', 'Bloqueada', 'Completada'];

// ════════════════════════════════════════════════════════════════════════
// Plan de Cambios — comunicación de tareas B2bytes.tech ↔ PEYU Chile.
// Vista Gantt moderna: cada cambio es una fila con barra temporal + avance.
// Complementa el chat del Canal Agencia (mensajes/reportes).
// ════════════════════════════════════════════════════════════════════════
export default function PlanCambios() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todas');
  const [modal, setModal] = useState(null); // null | {} (nueva) | tarea (editar)

  const cargar = () => base44.entities.TareaAgencia.list('orden', 200).then((t) => {
    setTareas(t || []);
    setLoading(false);
  });
  useEffect(() => { cargar(); }, []);

  const visibles = useMemo(
    () => (filtro === 'Todas' ? tareas : tareas.filter((t) => t.estado === filtro)),
    [tareas, filtro]
  );

  // Rango temporal del plan (para posicionar las barras del Gantt).
  const [rangeStart, rangeEnd] = useMemo(() => {
    const fechas = tareas.flatMap((t) => [t.fecha_inicio, t.fecha_objetivo]).filter(Boolean).map((f) => new Date(f).getTime());
    if (!fechas.length) { const now = Date.now(); return [now - 7 * 86400000, now + 14 * 86400000]; }
    return [Math.min(...fechas) - 86400000, Math.max(...fechas) + 2 * 86400000];
  }, [tareas]);

  const kpis = useMemo(() => ({
    total: tareas.length,
    completadas: tareas.filter((t) => t.estado === 'Completada').length,
    encurso: tareas.filter((t) => t.estado === 'En curso' || t.estado === 'En revisión').length,
    bloqueadas: tareas.filter((t) => t.estado === 'Bloqueada').length,
  }), [tareas]);

  const guardar = async (data) => {
    if (modal?.id) await base44.entities.TareaAgencia.update(modal.id, data);
    else await base44.entities.TareaAgencia.create({ ...data, orden: data.orden || tareas.length + 1 });
    setModal(null);
    cargar();
  };
  const eliminar = async (id) => {
    await base44.entities.TareaAgencia.delete(id);
    setModal(null);
    cargar();
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-5 h-5" style={{ color: '#0F8B6C' }} />
            Plan de Cambios · B2bytes ↔ PEYU
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ld-fg-muted)' }}>
            Tareas y cambios de plataforma acordados entre la agencia y el equipo PEYU · estilo Gantt
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/canal-agencia"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors hover:bg-white"
            style={{ border: '1px solid var(--ld-border)', color: 'var(--ld-fg-soft)' }}>
            <MessageSquare className="w-3.5 h-3.5" /> Canal Agencia
          </Link>
          <button onClick={() => setModal({})}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white"
            style={{ background: '#0F8B6C' }}>
            <Plus className="w-3.5 h-3.5" /> Nuevo cambio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total cambios', value: kpis.total, color: 'var(--ld-fg)' },
          { label: 'Completados', value: kpis.completadas, color: '#0F8B6C' },
          { label: 'En curso / revisión', value: kpis.encurso, color: '#1D4ED8' },
          { label: 'Bloqueados', value: kpis.bloqueadas, color: '#B91C1C' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl px-4 py-3" style={{ border: '1px solid var(--ld-border)', background: 'var(--ld-bg-elevated)' }}>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--ld-fg-muted)' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {FILTROS.map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
            style={filtro === f
              ? { background: '#0F8B6C', color: 'white' }
              : { border: '1px solid var(--ld-border)', color: 'var(--ld-fg-muted)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Gantt */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0F8B6C' }} /></div>
      ) : visibles.length === 0 ? (
        <p className="text-center text-sm py-16" style={{ color: 'var(--ld-fg-muted)' }}>No hay cambios en este filtro.</p>
      ) : (
        <div className="space-y-2">
          {visibles.map((t) => (
            <TareaGanttRow key={t.id} tarea={t} rangeStart={rangeStart} rangeEnd={rangeEnd} onClick={() => setModal(t)} />
          ))}
        </div>
      )}

      {modal !== null && (
        <TareaFormModal
          open
          tarea={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={guardar}
          onDelete={eliminar}
        />
      )}
    </div>
  );
}