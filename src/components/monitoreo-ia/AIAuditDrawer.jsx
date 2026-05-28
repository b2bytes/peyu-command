// ============================================================================
// AIAuditDrawer · Drawer de auditoría de un AILog específico
// ----------------------------------------------------------------------------
// Muestra el detalle completo (mensaje, contexto, respuesta), permite al
// auditor: aprobar, flag, marcar para re-train con respuesta corregida.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { buildAuditUpdates } from '@/lib/ai-stats';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  X, CheckCircle2, AlertTriangle, GraduationCap, MessageSquare, Cpu,
  Coins, Zap, Clock, User, Sparkles, Save, Loader2, RotateCcw, MessagesSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import ConversationThread from './ConversationThread';
import ConversationCustomerData from './ConversationCustomerData';

// Limpia el user_message quitando el prefijo [CONTEXTO] page=/... top_skus="..."
function cleanUserMessage(content) {
  if (!content) return '(sin mensaje)';
  let m = String(content);
  m = m.replace(/^\[CONTEXTO\][^\n]*/g, '').trim();
  return m || '(solo contexto técnico — el usuario no envió mensaje real en este turno)';
}

const ACTIONS = [
  { id: 'approve', label: 'Aprobar', icon: CheckCircle2, color: 'emerald', desc: 'La respuesta fue correcta' },
  { id: 'flag', label: 'Flag', icon: AlertTriangle, color: 'amber', desc: 'Necesita revisión humana' },
  { id: 'retrain', label: 'Re-entrenar', icon: GraduationCap, color: 'violet', desc: 'Marcar como ejemplo gold para fine-tuning' },
];

export default function AIAuditDrawer({ log, onClose, onUpdated }) {
  const [correctedResponse, setCorrectedResponse] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    if (log) {
      setCorrectedResponse(log.retraining_corrected_response || log.ai_response || '');
      setNotes(log.auditor_notes || '');
    }
  }, [log]);

  if (!log) return null;

  const handleAction = async (action) => {
    setSubmitting(action);
    try {
      // Update directo en entidad (resiliente: no depende del despliegue de la backend function)
      const updates = buildAuditUpdates(action, { correctedResponse, notes });
      await base44.entities.AILog.update(log.id, updates);
      toast.success(
        action === 'approve' ? '✅ Respuesta aprobada' :
        action === 'flag'    ? '🚩 Marcada como flag' :
        action === 'retrain' ? '🎓 Añadida a cola de re-train' :
        action === 'reject_retrain' ? 'Removida de la cola' :
        'Actualizada'
      );
      onUpdated?.();
      if (action !== 'retrain') onClose();
    } catch (e) {
      toast.error('Error: ' + (e?.message || 'desconocido'));
    }
    setSubmitting(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-ld-bg border-l border-ld-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ld-border flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
              <h2 className="font-jakarta font-bold text-ld-fg text-base tracking-tight">Auditoría IA</h2>
            </div>
            <p className="text-xs text-ld-fg-muted">{log.agent_name} · {log.model || 'modelo desconocido'} · {new Date(log.created_date).toLocaleString('es-CL')}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-ld-bg-soft hover:bg-ld-bg-elevated border border-ld-border flex items-center justify-center text-ld-fg-muted hover:text-ld-fg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto peyu-scrollbar px-5 py-4 space-y-5">
          {/* Métricas rápidas */}
          <div className="grid grid-cols-4 gap-2">
            <Metric icon={Zap} label="Tokens" value={log.tokens_total || 0} />
            <Metric icon={Coins} label="Costo" value={`$${(log.cost_usd || 0).toFixed(4)}`} />
            <Metric icon={Clock} label="Latencia" value={`${log.latency_ms || 0}ms`} />
            <Metric icon={Cpu} label="Estado" value={log.status || 'success'} />
          </div>

          {/* 🆕 Datos del cliente capturados durante la conversación */}
          {log.conversation_id && (
            <ConversationCustomerData conversationId={log.conversation_id} />
          )}

          {/* 🆕 Conversación completa (mensajes reales del cliente ↔ Peyu IA) */}
          {log.conversation_id && (
            <Section icon={MessagesSquare} title="Conversación completa">
              <ConversationThread conversationId={log.conversation_id} />
            </Section>
          )}

          {/* Mensaje específico de este registro (puede venir contaminado con
              el bloque [CONTEXTO] que envía el frontend — lo limpiamos). */}
          <Section icon={User} title="Mensaje registrado en este log" collapsible>
            <p className="text-sm text-ld-fg leading-relaxed whitespace-pre-wrap ld-glass-soft rounded-lg p-3">
              {cleanUserMessage(log.user_message)}
            </p>
          </Section>

          {log.system_context && (
            <Section icon={MessageSquare} title="Contexto / sistema" collapsible>
              <pre className="text-[11px] text-ld-fg-muted font-mono whitespace-pre-wrap ld-glass-soft rounded-lg p-3 max-h-40 overflow-y-auto peyu-scrollbar">
                {log.system_context}
              </pre>
            </Section>
          )}

          <Section icon={Sparkles} title="Respuesta registrada" collapsible>
            <p className="text-sm text-ld-fg leading-relaxed whitespace-pre-wrap rounded-lg p-3 border" style={{ background: 'var(--ld-action-soft)', borderColor: 'var(--ld-action)', borderLeftWidth: '3px' }}>
              {log.ai_response || '(sin respuesta)'}
            </p>
            {log.ai_response?.includes('esperando respuesta') && (
              <p className="text-[11px] mt-2 italic" style={{ color: 'var(--ld-highlight)' }}>
                ℹ️ La respuesta real del agente vive en la conversación de arriba (que se carga desde el SDK). Este campo solo registra el momento del turno.
              </p>
            )}
          </Section>

          {log.error_message && (
            <Section icon={AlertTriangle} title="Error">
              <p className="text-sm text-red-700 font-mono bg-red-50 border border-red-200 rounded-lg p-3">
                {log.error_message}
              </p>
            </Section>
          )}

          {/* Auditor */}
          <div className="border-t border-ld-border pt-5 space-y-4">
            <h3 className="font-jakarta font-bold text-ld-fg text-sm tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
              Acciones del auditor
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ld-fg-muted mb-2">
                Notas (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Por qué la respuesta es correcta / incorrecta..."
                className="min-h-[60px] text-xs ld-input text-ld-fg placeholder:text-ld-fg-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ld-fg-muted mb-2">
                Respuesta corregida (gold standard para re-train)
              </label>
              <Textarea
                value={correctedResponse}
                onChange={e => setCorrectedResponse(e.target.value)}
                placeholder="Escribe aquí la respuesta ideal que debió dar el modelo..."
                className="min-h-[120px] text-sm ld-input text-ld-fg placeholder:text-ld-fg-muted"
              />
              <button
                onClick={() => setCorrectedResponse(log.ai_response || '')}
                className="text-[10px] text-ld-fg-muted hover:text-ld-fg mt-1 flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Restaurar respuesta original
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {ACTIONS.map(action => {
                const Icon = action.icon;
                const isLoading = submitting === action.id;
                const colorMap = {
                  emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/30 text-emerald-200',
                  amber:   'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-200',
                  violet:  'bg-violet-500/15 hover:bg-violet-500/25 border-violet-400/30 text-violet-200',
                };
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={!!submitting}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border font-inter transition-all disabled:opacity-50 ${colorMap[action.color]}`}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    <span className="text-[12px] font-bold">{action.label}</span>
                    <span className="text-[10px] opacity-70 text-center leading-tight">{action.desc}</span>
                  </button>
                );
              })}
            </div>

            {log.marked_for_retraining && (
              <div className="bg-violet-500/10 border border-violet-400/25 rounded-lg p-3 text-xs text-violet-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  En cola de re-entrenamiento ({log.retraining_status || 'queued'})
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleAction('reject_retrain')}
                  disabled={!!submitting} className="h-7 text-violet-300 hover:bg-violet-500/20 text-[10px]">
                  Quitar de cola
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="ld-card p-2.5 text-center">
      <Icon className="w-3 h-3 mx-auto text-ld-fg-muted mb-1" />
      <p className="text-[9px] uppercase tracking-wider text-ld-fg-muted mb-0.5 font-jakarta font-bold">{label}</p>
      <p className="text-xs font-bold text-ld-fg font-jakarta">{value}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children, collapsible }) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full flex items-center gap-2 mb-2 ${collapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      >
        <Icon className="w-3.5 h-3.5 text-ld-fg-muted" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-ld-fg-muted font-jakarta">{title}</h3>
        {collapsible && <span className="text-[10px] text-ld-fg-muted ml-auto">{open ? '−' : '+'}</span>}
      </button>
      {open && children}
    </div>
  );
}