import { useEffect, useRef } from 'react';
import { X, Send, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessageContent from '@/components/chat/ChatMessageContent';

/**
 * Modal full-screen del chat Peyu en móvil.
 * Reutiliza la lógica de chat del padre (ShopLanding) mediante props.
 * Diseñado para que la conversación AI sea inmersiva sin perder navegación.
 */
const OCASIONES = [
  { id: 'navidad', label: 'Navidad', icon: '🎄' },
  { id: 'patrias', label: 'Patrias', icon: '🇨🇱' },
  { id: 'madre', label: 'Día Madre', icon: '❤️' },
  { id: 'trabajador', label: 'Trabajador', icon: '💼' },
  { id: 'profesor', label: 'Profesor', icon: '📚' },
  { id: 'logros', label: 'Logros', icon: '🏆' },
];

export default function MobileChatModal({
  open,
  onClose,
  messages,
  loading,
  input,
  setInput,
  onSend,
  onOccasionClick,
  historyCount,
  onShowHistory,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages, loading]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 backdrop-blur-md bg-black/30 flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-base shadow-md ring-2 ring-white/20">🐢</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Peyu IA</p>
          <p className="text-white/60 text-[10px]">Asistente de Gifting · en línea</p>
        </div>
        {historyCount > 0 && (
          <button
            onClick={onShowHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/85 text-[10px] font-semibold transition"
          >
            <History className="w-3 h-3" />
            <span>{historyCount}</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition"
          aria-label="Cerrar chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden peyu-scrollbar-light px-3 py-3 flex flex-col gap-2.5 min-h-0">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 text-sm">🐢</div>
            )}
            <div className={`rounded-2xl px-3.5 py-2 text-[13px] break-words leading-relaxed shadow-sm ${
              msg.role === 'user'
                ? 'bg-teal-600 text-white rounded-br-sm max-w-[78%]'
                : 'bg-white/15 text-white border border-white/25 rounded-bl-sm backdrop-blur-sm max-w-[88%]'
            }`}>
              {msg.role === 'assistant'
                ? <ChatMessageContent content={msg.content} />
                : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 text-sm">🐢</div>
            <div className="bg-white/15 border border-white/25 rounded-2xl px-3.5 py-2.5 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick replies */}
      <div className="flex-shrink-0 overflow-x-auto scrollbar-hide flex gap-1.5 px-3 py-2 border-t border-white/5">
        {OCASIONES.map(occ => (
          <button
            key={occ.id}
            onClick={() => onOccasionClick(occ)}
            className="flex items-center gap-1 flex-shrink-0 bg-white/10 hover:bg-teal-500/20 border border-white/15 hover:border-teal-400/40 active:bg-teal-600/30 transition rounded-full px-2.5 py-1"
          >
            <span className="text-xs leading-none">{occ.icon}</span>
            <span className="text-white/80 text-[11px] font-medium whitespace-nowrap">{occ.label}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-1.5 pb-safe bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="flex gap-2 items-center bg-slate-900/80 rounded-full pl-1.5 pr-1.5 py-1.5 border border-white/15 shadow-lg">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && onSend(input)}
            placeholder="Escribe tu mensaje a Peyu…"
            className="bg-transparent border-0 text-white placeholder:text-white/45 text-sm rounded-full focus:ring-0 focus-visible:ring-0 flex-1 h-11 px-4 disabled:opacity-60 shadow-none font-medium"
            disabled={loading}
          />
          <Button
            onClick={() => onSend(input)}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30 disabled:opacity-50"
          >
            <Send className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}