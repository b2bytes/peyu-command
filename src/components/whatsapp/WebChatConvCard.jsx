import { motion } from 'framer-motion';
import { MessageSquare, Building2, Mail, Phone, Package } from 'lucide-react';
import LeadDataChips from '@/components/whatsapp/LeadDataChips';

// Tarjeta de una conversación del vendedor Peyu web dentro del pipeline.
export default function WebChatConvCard({ lead, color, onOpen }) {
  const nombre = lead.nombre || lead.empresa || `Visitante ${String(lead.conversation_id || '').slice(-5)}`;
  const cuando = lead.ultimo_mensaje_at || lead.created_date;
  const fecha = cuando
    ? new Date(cuando).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onOpen}
      className="w-full text-left rounded-xl p-2.5 transition-all hover:brightness-105 active:scale-[0.99]"
      style={{ background: 'var(--ld-bg-elevated)', border: '1px solid var(--ld-border)' }}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-[11px] font-bold text-ld-fg truncate flex-1">{nombre}</p>
        {lead.tipo && lead.tipo !== 'Sin clasificar' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${color}18`, color }}>{lead.tipo}</span>
        )}
      </div>

      {lead.ultimo_mensaje_preview && (
        <p className="text-[10px] text-ld-fg-muted mt-1 line-clamp-2">{lead.ultimo_mensaje_preview}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[9px] text-ld-fg-subtle">
        {lead.empresa && <span className="inline-flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{lead.empresa}</span>}
        {lead.email && <span className="inline-flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{lead.email}</span>}
        {lead.telefono && <span className="inline-flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{lead.telefono}</span>}
        {lead.producto_interes_nombre && (
          <span className="inline-flex items-center gap-0.5"><Package className="w-2.5 h-2.5" />{lead.producto_interes_nombre}</span>
        )}
      </div>

      <div className="mt-1.5">
        <LeadDataChips lead={lead} />
      </div>

      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-ld-fg-subtle">
        <span className="inline-flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{lead.mensajes_count || 0}</span>
        {typeof lead.score === 'number' && <span>Score {lead.score}</span>}
        <span className="ml-auto">{fecha}</span>
      </div>
    </motion.button>
  );
}