import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Search, UserRound, FileText, CreditCard, CheckCircle2, Truck, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import PipelineConvCard from '@/components/whatsapp/PipelineConvCard';

// ════════════════════════════════════════════════════════════════════════
// Pipeline inteligente de conversaciones WhatsApp — kanban con etapas que
// avanzan automáticamente (whatsappPipelineSync clasifica cada conversación
// según lo que el agente hizo: explorar, cotizar, cobrar, escalar…).
// ════════════════════════════════════════════════════════════════════════

export const WA_STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: '#64748B', icon: Sparkles },
  { id: 'explorando', label: 'Explorando catálogo', color: '#0EA5E9', icon: Search },
  { id: 'datos', label: 'Capturando datos', color: '#8B5CF6', icon: UserRound },
  { id: 'cotizado', label: 'Cotización B2B', color: '#F59E0B', icon: FileText },
  { id: 'pago', label: 'Link de pago', color: '#F97316', icon: CreditCard },
  { id: 'convertido', label: 'Convertido', color: '#10B981', icon: CheckCircle2 },
  { id: 'postventa', label: 'Postventa', color: '#14B8A6', icon: Truck },
  { id: 'escalado', label: 'Escalado', color: '#EF4444', icon: AlertTriangle },
];

export default function WhatsAppPipeline({ etapas, onOpen, onSync, syncing }) {
  const byStage = WA_STAGES.map((s) => ({
    ...s,
    items: (etapas || []).filter((e) => e.etapa === s.id)
      .sort((a, b) => new Date(b.ultimo_mensaje_at || 0) - new Date(a.ultimo_mensaje_at || 0)),
  }));
  const total = (etapas || []).length;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--ld-bg-soft)' }}>
      {/* Barra superior del pipeline */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-ld-border bg-ld-bg">
        <p className="text-xs font-bold text-ld-fg">Pipeline de conversaciones</p>
        <span className="text-[10px] text-ld-fg-muted">{total} conversaciones · se actualiza solo cada 10 min</span>
        <button
          onClick={onSync}
          disabled={syncing}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white disabled:opacity-60 transition-all hover:brightness-105"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {syncing ? 'Clasificando…' : 'Actualizar ahora'}
        </button>
      </div>

      {/* Columnas kanban con scroll horizontal */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex gap-3 p-3" style={{ minWidth: 'max-content' }}>
          {byStage.map((stage) => (
            <div key={stage.id} className="w-[248px] flex-shrink-0 flex flex-col min-h-0 rounded-2xl bg-ld-bg border border-ld-border">
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-ld-border">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${stage.color}18` }}>
                  <stage.icon className="w-3.5 h-3.5" style={{ color: stage.color }} />
                </span>
                <p className="text-[11px] font-bold text-ld-fg truncate">{stage.label}</p>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${stage.color}18`, color: stage.color }}>
                  {stage.items.length}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 peyu-scrollbar">
                <AnimatePresence mode="popLayout">
                  {stage.items.map((item) => (
                    <PipelineConvCard
                      key={item.conversation_id}
                      item={item}
                      color={stage.color}
                      onOpen={() => onOpen(item)}
                    />
                  ))}
                </AnimatePresence>
                {stage.items.length === 0 && (
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
    </div>
  );
}