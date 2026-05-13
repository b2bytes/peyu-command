import { useEffect, useRef } from 'react';
import { X, Send, History, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessageContent from '@/components/chat/ChatMessageContent';

/**
 * Modal full-screen del chat Peyu en móvil — Liquid Dual edition.
 *
 * Diseño:
 *  • Canvas ld-canvas auto-adaptativo día/noche con ambient glow firmado.
 *  • Header glass strong sticky con avatar animado + estado live.
 *  • Burbujas Liquid: usuario con gradient acción (verde firma),
 *    asistente con ld-glass-soft sobre canvas (legible en ambos modos).
 *  • Quick replies como chips ld-btn-ghost scroll horizontal.
 *  • Input pill ld-input con safe-area iOS.
 *  • Animaciones de entrada para mensajes nuevos (stagger sutil).
 *
 * Mantiene 100% la lógica del padre (props messages, loading, onSend...).
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

  // Scroll solo dentro del contenedor de mensajes (no la página completa).
  useEffect(() => {
    if (!open) return;
    const end = endRef.current;
    const scroller = end?.parentElement;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }
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
    <div className="fixed inset-0 z-[80] flex flex-col ld-canvas">
      {/* ─── Ambient glow firmado (verde acción + terracota highlight) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-16 w-72 h-72 rounded-full blur-[100px] opacity-30"
          style={{ background: 'var(--ld-action)' }}
        />
        <div
          className="absolute bottom-32 -left-20 w-64 h-64 rounded-full blur-[100px] opacity-20"
          style={{ background: 'var(--ld-highlight)' }}
        />
      </div>

      {/* ─── HEADER glass strong ─── */}
      <header className="relative flex-shrink-0 ld-glass-strong border-b border-ld-border">
        <div className="px-4 py-3 pt-safe flex items-center gap-3">
          {/* Avatar con anillo verde y dot vivo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md ring-2"
              style={{
                background: 'var(--ld-grad-action)',
                boxShadow: '0 4px 16px -4px rgba(15, 139, 108, 0.4)',
                color: '#FFFFFF',
              }}
            >
              🐢
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 animate-pulse"
              style={{ borderColor: 'var(--ld-bg)' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] leading-tight text-ld-fg">Peyu</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[10px] text-ld-fg-muted font-medium tracking-wide">
                En línea · responde al toque
              </p>
            </div>
          </div>

          {historyCount > 0 && (
            <button
              onClick={onShowHistory}
              className="ld-btn-ghost flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-ld-fg-soft active:scale-95 transition"
              aria-label="Ver historial de conversaciones"
            >
              <History className="w-3 h-3" />
              <span>{historyCount}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ld-btn-ghost w-10 h-10 rounded-full flex items-center justify-center text-ld-fg active:scale-95 transition flex-shrink-0"
            aria-label="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── MESSAGES scrollable area ─── */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden peyu-scrollbar min-h-0">
        <div className="px-3.5 py-4 flex flex-col gap-2.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 peyu-card-enter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 ring-1"
                  style={{
                    background: 'var(--ld-action-soft)',
                    borderColor: 'var(--ld-border)',
                  }}
                >
                  🐢
                </div>
              )}

              {msg.role === 'user' ? (
                <div
                  className="rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13.5px] break-words leading-relaxed shadow-sm max-w-[80%] text-white font-medium"
                  style={{
                    background: 'var(--ld-grad-action)',
                    boxShadow: '0 2px 12px -4px rgba(15, 139, 108, 0.3)',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="ld-glass-soft rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13.5px] break-words leading-relaxed text-ld-fg max-w-[82%]">
                  <ChatMessageContent content={msg.content} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start peyu-card-enter">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 ring-1"
                style={{ background: 'var(--ld-action-soft)', borderColor: 'var(--ld-border)' }}
              >
                🐢
              </div>
              <div className="ld-glass-soft rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--ld-action)' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--ld-action)', animationDelay: '0.15s' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--ld-action)', animationDelay: '0.3s' }}
                />
              </div>
            </div>
          )}

          <div ref={endRef} className="h-2" />
        </div>
      </div>

      {/* ─── QUICK REPLIES (chips horizontales) ─── */}
      <div className="relative flex-shrink-0 ld-glass border-t border-ld-border">
        <div className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ld-highlight)' }} />
          {OCASIONES.map(occ => (
            <button
              key={occ.id}
              onClick={() => onOccasionClick(occ)}
              disabled={loading}
              className="ld-btn-ghost flex items-center gap-1.5 flex-shrink-0 rounded-full px-3 py-1.5 active:scale-95 transition disabled:opacity-50"
            >
              <span className="text-xs leading-none">{occ.icon}</span>
              <span className="text-ld-fg-soft text-[11px] font-semibold whitespace-nowrap">
                {occ.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── INPUT BAR ─── */}
      <div className="relative flex-shrink-0 ld-glass-strong border-t border-ld-border pb-safe">
        <div className="px-3 py-2.5">
          <div className="ld-input flex items-center gap-2 pl-1.5 pr-1.5 py-1.5">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && onSend(input)}
              placeholder="Pregúntale a Peyu…"
              className="bg-transparent border-0 text-ld-fg placeholder:text-ld-fg-muted text-sm rounded-full focus:ring-0 focus-visible:ring-0 flex-1 h-11 px-4 disabled:opacity-60 shadow-none font-medium"
              disabled={loading}
              autoFocus
            />
            <Button
              onClick={() => onSend(input)}
              disabled={loading || !input.trim()}
              className="ld-btn-primary rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition"
              aria-label="Enviar mensaje"
            >
              <Send className="w-[18px] h-[18px]" />
            </Button>
          </div>
          <p className="text-[10px] text-ld-fg-subtle text-center mt-1.5 font-medium tracking-wide">
            Peyu es IA · puede tardar unos segundos
          </p>
        </div>
      </div>
    </div>
  );
}