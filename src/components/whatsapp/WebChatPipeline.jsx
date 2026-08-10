import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, Globe } from 'lucide-react';
import { agruparPorEtapa } from '@/lib/webchat-pipeline';
import WebChatConvCard from '@/components/whatsapp/WebChatConvCard';
import WebChatThreadModal from '@/components/whatsapp/WebChatThreadModal';

// ════════════════════════════════════════════════════════════════════════
// Pipeline inteligente del chat de la tienda (agente vendedor_peyu). Mismo
// kanban que WhatsApp, pero con las conversaciones de la web: cada tarjeta
// abre la conversación completa con el cliente.
// ════════════════════════════════════════════════════════════════════════
export default function WebChatPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState(null);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.ChatLead.list('-ultimo_mensaje_at', 200).catch(() => []);
    setLeads(list || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columnas = agruparPorEtapa(leads);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full" style={{ background: 'var(--ld-bg-soft)' }}>
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-ld-border bg-ld-bg">
        <Globe className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
        <p className="text-xs font-bold text-ld-fg">Chat de la tienda · Peyu Vendedor</p>
        <span className="text-[10px] text-ld-fg-muted">{leads.length} conversaciones con datos del cliente</span>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white disabled:opacity-60 transition-all hover:brightness-105"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex gap-3 p-3" style={{ minWidth: 'max-content' }}>
          {columnas.map((stage) => (
            <div key={stage.id} className="w-[248px] flex-shrink-0 flex flex-col min-h-0 rounded-2xl bg-ld-bg border border-ld-border">
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-ld-border">
                <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                <p className="text-[11px] font-bold text-ld-fg truncate">{stage.label}</p>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${stage.color}18`, color: stage.color }}>
                  {stage.items.length}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 peyu-scrollbar">
                <AnimatePresence mode="popLayout">
                  {stage.items.map((lead) => (
                    <WebChatConvCard
                      key={lead.id}
                      lead={lead}
                      color={stage.color}
                      onOpen={() => setOpenLead(lead)}
                    />
                  ))}
                </AnimatePresence>
                {!loading && stage.items.length === 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[10px] text-ld-fg-subtle text-center py-6">
                    Sin conversaciones
                  </motion.p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {openLead && <WebChatThreadModal lead={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
}