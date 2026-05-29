// ============================================================================
// PEYU OS · Kanban de leads B2B (drag & drop entre estados)
// ─────────────────────────────────────────────────────────────────────────────
// Arrastra leads entre las columnas de estado. Al soltar, persiste el nuevo
// status en B2BLead vía base44.entities.B2BLead.update. Optimista: mueve la
// tarjeta de inmediato y refresca el CRM en segundo plano.
// ============================================================================
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import LeadCard from './LeadCard';

const COLUMNAS = [
  { id: 'Nuevo', label: 'Nuevo', accent: '#6f7d77' },
  { id: 'Contactado', label: 'Contactado', accent: '#0891b2' },
  { id: 'En revisión', label: 'En revisión', accent: '#b45309' },
  { id: 'Propuesta enviada', label: 'Propuesta enviada', accent: '#0F8B6C' },
  { id: 'Aceptado', label: 'Aceptado', accent: '#047857' },
  { id: 'Perdido', label: 'Perdido', accent: '#b91c1c' },
];

export default function LeadKanban({ leads = [], onRefresh }) {
  const [board, setBoard] = useState([]);

  useEffect(() => { setBoard(leads); }, [leads]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const nuevoStatus = destination.droppableId;
    setBoard((prev) => prev.map((l) => (l.id === draggableId ? { ...l, status: nuevoStatus } : l)));
    await base44.entities.B2BLead.update(draggableId, { status: nuevoStatus });
    onRefresh?.();
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 sm:px-6 py-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 h-full min-w-max pb-2">
          {COLUMNAS.map((col) => {
            const items = board.filter((l) => (l.status || 'Nuevo') === col.id);
            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div className="w-[260px] flex-shrink-0 flex flex-col">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
                        <span className="text-xs font-semibold text-[#22302c]">{col.label}</span>
                      </div>
                      <span className="text-[11px] text-[#9aa6a0] font-medium">{items.length}</span>
                    </div>
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto peyu-scrollbar rounded-2xl p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[#0F8B6C]/8' : 'bg-[#f6f1ea]/60'
                      }`}
                    >
                      {items.map((lead, index) => (
                        <LeadCard key={lead.id} lead={lead} index={index} />
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-[11px] text-[#bcc4bf] text-center py-6">Vacío</p>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}