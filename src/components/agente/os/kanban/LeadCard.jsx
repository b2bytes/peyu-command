// ============================================================================
// PEYU OS · Kanban · Tarjeta de lead arrastrable
// ============================================================================
import { Draggable } from '@hello-pangea/dnd';
import { Building2, Flame, Package } from 'lucide-react';

const URGENCIA_DOT = { Alta: 'bg-[#D96B4D]', Normal: 'bg-[#0F8B6C]', Baja: 'bg-[#c9bca9]' };

export default function LeadCard({ lead, index }) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-xl border p-3 mb-2 select-none transition-shadow ${
            snapshot.isDragging
              ? 'border-[#0F8B6C]/50 shadow-[0_8px_24px_-8px_rgba(15,139,108,0.35)]'
              : 'border-[#ece4d8] hover:border-[#0F8B6C]/30'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#22302c] truncate">{lead.company_name}</p>
              <p className="text-[11px] text-[#6f7d77] truncate flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                {lead.contact_name || 'Sin contacto'}
              </p>
            </div>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${URGENCIA_DOT[lead.urgency] || URGENCIA_DOT.Normal}`} />
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {lead.product_interest && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#6f7d77] bg-[#f6f1ea] px-1.5 py-0.5 rounded-md">
                <Package className="w-2.5 h-2.5" />
                {lead.product_interest}
              </span>
            )}
            {lead.qty_estimate ? (
              <span className="text-[10px] text-[#6f7d77] bg-[#f6f1ea] px-1.5 py-0.5 rounded-md">
                {lead.qty_estimate} u
              </span>
            ) : null}
            {(lead.urgency === 'Alta' || lead.lead_score >= 70) && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#D96B4D] bg-[#D96B4D]/10 px-1.5 py-0.5 rounded-md">
                <Flame className="w-2.5 h-2.5" /> {lead.lead_score >= 70 ? lead.lead_score : 'urgente'}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}