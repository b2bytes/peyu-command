import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, Globe, Tags, KanbanSquare, Wand2 } from 'lucide-react';
import { agruparPorEtapa } from '@/lib/webchat-pipeline';
import WebChatConvCard from '@/components/whatsapp/WebChatConvCard';
import WebChatThreadModal from '@/components/whatsapp/WebChatThreadModal';
import WebChatTagsView from '@/components/whatsapp/WebChatTagsView';

// ════════════════════════════════════════════════════════════════════════
// Pipeline inteligente del chat de la tienda (agente vendedor_peyu). Mismo
// kanban que WhatsApp, pero con las conversaciones de la web: cada tarjeta
// abre la conversación completa con el cliente.
// ════════════════════════════════════════════════════════════════════════
export default function WebChatPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState(null);
  const [modo, setModo] = useState('etiquetas'); // 'etiquetas' | 'kanban'
  const [recuperando, setRecuperando] = useState(false);

  // Rescata las conversaciones cortadas: reconstruye mensajes y datos del cliente.
  const recuperar = async () => {
    setRecuperando(true);
    await base44.functions.invoke('recuperarChatLeads', { limit: 40 }).catch(() => null);
    setRecuperando(false);
    load();
  };

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
        <span className="text-[10px] text-ld-fg-muted hidden md:inline">{leads.length} conversaciones con datos del cliente</span>

        {/* Selector: vista de etiquetas o kanban */}
        <div className="ml-auto flex items-center gap-0.5 p-0.5 rounded-full" style={{ background: 'var(--ld-bg-soft)' }}>
          {[
            { id: 'etiquetas', label: 'Etiquetas', icon: Tags },
            { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setModo(id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                modo === id ? 'text-white' : 'text-ld-fg-muted'
              }`}
              style={modo === id ? { background: '#8B5CF6' } : undefined}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <button
          onClick={recuperar}
          disabled={recuperando}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold disabled:opacity-60 transition-all hover:brightness-110"
          style={{ background: 'rgba(139,92,246,.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,.3)' }}
        >
          {recuperando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {recuperando ? 'Recuperando…' : 'Recuperar conversaciones'}
        </button>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white disabled:opacity-60 transition-all hover:brightness-105"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {modo === 'etiquetas' && <WebChatTagsView leads={leads} onOpen={setOpenLead} />}

      {modo === 'kanban' && (
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex gap-3 p-3" style={{ minWidth: 'max-content' }}>
          {columnas.map((col) => (
            <div key={col.id} className="w-[260px] flex-shrink-0 flex flex-col min-h-0 rounded-2xl bg-ld-bg border border-ld-border">
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-ld-border">
                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <p className="text-[11px] font-bold text-ld-fg truncate">{col.label}</p>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${col.color}18`, color: col.color }}>
                  {col.items.length}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 peyu-scrollbar">
                <AnimatePresence mode="popLayout">
                  {col.items.map((lead) => (
                    <WebChatConvCard key={lead.id} lead={lead} color={col.color} onOpen={() => setOpenLead(lead)} />
                  ))}
                </AnimatePresence>
                {col.items.length === 0 && (
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
      )}

      {openLead && (
        <WebChatThreadModal
          lead={openLead}
          onClose={() => setOpenLead(null)}
          onSaved={(l) => setLeads((prev) => prev.map((x) => (x.id === l.id ? { ...x, ...l } : x)))}
        />
      )}
    </div>
  );
}