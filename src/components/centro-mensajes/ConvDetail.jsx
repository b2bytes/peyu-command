import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  X, Clock, Loader2, Send, Sparkles, CheckCheck, Archive, UserCheck,
  ShoppingCart, Trash2, Mail, MessageSquare, Phone
} from 'lucide-react';
import { CANAL_AVATAR_BG, CANAL_AVATAR_FG, CANAL_STYLES } from './styles';

const CANAL_ICONS = { web: MessageSquare, whatsapp: Phone, gmail: Mail, instagram: MessageSquare, linkedin: MessageSquare };

export default function ConvDetail({ item, onClose, onAction, actionLoading, onRefresh }) {
  const [conversation, setConversation] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setConversation(null);
    setLoadingDetail(true);
    setReplyText('');

    if (item._type === 'chatlead' && item.conversation_id) {
      base44.functions.invoke('getChatConversation', { conversation_id: item.conversation_id })
        .then(res => setConversation(res?.data))
        .catch(() => setConversation(null))
        .finally(() => setLoadingDetail(false));
    } else if (item._type === 'whatsapp') {
      base44.agents.getConversation(item.id)
        .then(full => setConversation(full))
        .catch(() => setConversation(item.raw))
        .finally(() => setLoadingDetail(false));
    } else {
      setLoadingDetail(false);
    }
  }, [item]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [conversation?.messages]);

  const messages = conversation?.messages || [];
  const isGmail = item._type === 'gmail';
  const hasActions = item._type === 'chatlead';
  const CanalIcon = CANAL_ICONS[item.channel] || MessageSquare;

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      if (item._type === 'chatlead' && item.conversation_id) {
        await base44.functions.invoke('publicChatProxy', {
          conversation_id: item.conversation_id,
          message: replyText.trim(),
          session_id: item.raw?.session_id || '',
        });
      } else if (item._type === 'whatsapp') {
        await base44.agents.addMessage(conversation || item.raw, { role: 'user', content: replyText.trim() });
      } else if (item._type === 'gmail' && item.email) {
        await base44.functions.invoke('sendGmailEmail', {
          to: item.email,
          subject: `Re: ${item.asunto || 'Tu consulta'}`,
          body: replyText.trim(),
        });
      }
      setReplyText('');
      if (onRefresh) onRefresh();
    } catch (e) {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const handleAiDraft = async () => {
    setAiDrafting(true);
    try {
      const context = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un agente de ventas de PEYU Chile (productos sostenibles de plástico reciclado). El cliente escribió:\n\n${context}\n\nRedacta una respuesta profesional, cálida y útil en español. Sé breve (2-3 oraciones). Firma como "Equipo PEYU 🐢".`,
        model: 'gpt_5_mini',
      });
      setReplyText(typeof res === 'string' ? res : res?.response || '');
    } catch {}
    setAiDrafting(false);
  };

  // Quick actions
  const quickActions = [
    { accion: 'calificar', icon: CheckCheck, label: 'Calificar', color: 'emerald' },
    { accion: 'convertir_b2b', icon: UserCheck, label: 'B2B', color: 'blue' },
    { accion: 'convertir_b2c', icon: ShoppingCart, label: 'B2C', color: 'amber' },
    { accion: 'archivar', icon: Archive, label: 'Archivar', color: 'slate' },
    { accion: 'descartar', icon: Trash2, label: 'Descartar', color: 'red' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur flex items-center gap-3">
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors lg:hidden">
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{ background: CANAL_AVATAR_BG[item.channel] || '#0F8B6C20', color: CANAL_AVATAR_FG[item.channel] || '#3dd9b0' }}>
          {(item.nombre || '?')[0].toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-100 text-sm truncate">{item.nombre || 'Sin nombre'}</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${CANAL_STYLES[item.channel] || CANAL_STYLES.web}`}>
              {item.channelLabel}
            </span>
            {item.asunto && (
              <span className="text-[10px] text-slate-400 truncate hidden sm:inline">· {item.asunto}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
            {item.email && <span className="truncate">{item.email}</span>}
            {item.telefono && <span className="truncate">{item.telefono}</span>}
            {item.empresa && <span className="font-semibold text-slate-400 truncate">{item.empresa}</span>}
            {item.tipo !== 'Sin clasificar' && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                item.tipo === 'B2B' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'
              }`}>{item.tipo}</span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">{item.estado}</span>
          </div>
        </div>

        {/* Quick action buttons */}
        {hasActions && (
          <div className="hidden sm:flex items-center gap-1">
            {quickActions.map(a => {
              const loading = actionLoading === `${item.id}-${a.accion}`;
              const colors = {
                emerald: 'hover:bg-emerald-500/15 hover:text-emerald-400',
                blue: 'hover:bg-blue-500/15 hover:text-blue-400',
                amber: 'hover:bg-amber-500/15 hover:text-amber-400',
                slate: 'hover:bg-slate-600/30 hover:text-slate-300',
                red: 'hover:bg-red-500/15 hover:text-red-400',
              };
              return (
                <button
                  key={a.accion}
                  onClick={() => onAction?.(item, a.accion)}
                  disabled={loading}
                  className={`p-1.5 rounded-lg text-slate-400 transition-colors ${colors[a.color]} disabled:opacity-40`}
                  title={a.label}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <a.icon className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions bar (mobile) */}
      {hasActions && (
        <div className="sm:hidden flex-shrink-0 px-3 py-1.5 border-b border-slate-700/50 bg-slate-800/50 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {quickActions.map(a => {
            const loading = actionLoading === `${item.id}-${a.accion}`;
            return (
              <button
                key={a.accion}
                onClick={() => onAction?.(item, a.accion)}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold text-slate-400 hover:bg-slate-700/50 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <a.icon className="w-2.5 h-2.5" />}
                {a.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      {loadingDetail ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando…
        </div>
      ) : isGmail ? (
        <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar px-5 py-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-bold text-slate-100 mb-1">{item.asunto || '(sin asunto)'}</h3>
            <p className="text-xs text-slate-400 mb-4">
              {item.email} · {item.ultimoAt ? new Date(item.ultimoAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {item.ultimoMensaje || '(sin contenido)'}
            </p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Clock className="w-8 h-8 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">Sin mensajes aún</p>
          <p className="text-xs text-slate-500 mt-1">La conversación está vacía o no se pudo cargar.</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar px-4 py-4 space-y-3">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user' || msg.role === 'customer';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content || '(sin contenido)'}</p>
                  {msg.at && (
                    <p className={`text-[9px] mt-1 ${isUser ? 'text-white/50' : 'text-slate-500'}`}>
                      {new Date(msg.at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply box */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700/50 bg-slate-900/90 backdrop-blur">
        <div className="flex items-end gap-2">
          <button
            onClick={handleAiDraft}
            disabled={aiDrafting}
            className="flex-shrink-0 h-10 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
            title="Redactar con IA"
          >
            {aiDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">IA</span>
          </button>

          <div className="flex-1 relative">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={`Responder por ${item.channelLabel}…`}
              rows={1}
              className="w-full resize-none rounded-xl bg-slate-800 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !replyText.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #0F8B6C, #0B6E55)' }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nueva línea
          {item._type === 'gmail' && ' · Se envía por Gmail'}
          {item._type === 'whatsapp' && ' · Se envía por WhatsApp'}
          {item._type === 'chatlead' && ' · Se envía por chat web'}
        </p>
      </div>
    </div>
  );
}