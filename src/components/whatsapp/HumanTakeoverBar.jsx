import { useState } from 'react';
import { Bot, User, Hand, Play, Pause, AlertCircle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// HumanTakeoverBar — Barra de control del pipeline agéntico-humano.
// Muestra quién tiene el control de la conversación (agente o humano)
// y permite pausar/reanudar el agente con un clic.
// ════════════════════════════════════════════════════════════════════════

export default function HumanTakeoverBar({ conversation, onTakeover, onResume }) {
  const humanMode = conversation?.metadata?.human_takeover === true;
  const escalated = conversation?.metadata?.escalated === true;

  if (humanMode) {
    return (
      <div className="flex-shrink-0 flex items-center gap-2.5 px-3 sm:px-4 py-2 border-b border-ld-border"
        style={{ background: 'rgba(217, 107, 77, 0.08)' }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#D96B4D' }}>
          <User className="w-3.5 h-3.5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold" style={{ color: '#B85530' }}>Tú tienes el control</p>
          <p className="text-[10px] text-ld-fg-muted">El agente está pausado — tus mensajes van directos al cliente</p>
        </div>
        <button
          onClick={onResume}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white flex-shrink-0 transition-all hover:brightness-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
        >
          <Play className="w-3 h-3" />
          Devolver al agente
        </button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 px-3 sm:px-4 py-2 border-b border-ld-border"
      style={{ background: escalated ? 'rgba(239, 68, 68, 0.06)' : 'rgba(37, 211, 102, 0.06)' }}>
      <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: escalated ? '#EF4444' : '#25D366' }}>
        {escalated
          ? <AlertCircle className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-white" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold" style={{ color: escalated ? '#DC2626' : '#0B6E55' }}>
          {escalated ? 'Escalado — necesita humano' : 'Agente Peyu activo 24/7'}
        </p>
        <p className="text-[10px] text-ld-fg-muted">
          {escalated ? 'El agente derivó este caso — tómalo cuando puedas' : 'Respondiendo automáticamente a este cliente'}
        </p>
      </div>
      <button
        onClick={onTakeover}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 transition-all active:scale-95"
        style={{
          background: escalated ? '#EF4444' : 'rgba(217, 107, 77, 0.1)',
          color: escalated ? 'white' : '#B85530',
          border: escalated ? 'none' : '1px solid rgba(217, 107, 77, 0.25)',
        }}
      >
        <Hand className="w-3 h-3" />
        Yo me hago cargo
      </button>
    </div>
  );
}