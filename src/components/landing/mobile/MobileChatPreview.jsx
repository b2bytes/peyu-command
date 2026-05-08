import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

/**
 * Card preview del chat IA Peyu en mobile.
 * Sugerencias clickeables que abren el chat completo (modal/expansión).
 */
const SUGGESTIONS = [
  { icon: '🎁', text: 'Regalo para Día de la Madre' },
  { icon: '🏢', text: 'Regalos para mi empresa' },
  { icon: '🌱', text: 'Productos sostenibles' },
];

export default function MobileChatPreview({ onOpenChat, onSuggestionClick }) {
  return (
    <section className="px-4 pb-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 p-5 shadow-2xl shadow-violet-900/30">
        {/* Pattern bg */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg ring-2 ring-white/30">
              🐢
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-poppins font-bold text-sm leading-tight">Peyu IA</p>
                <span className="inline-flex items-center gap-0.5 bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-[8px] font-bold text-white tracking-wider">EN LÍNEA</span>
                </span>
              </div>
              <p className="text-white/75 text-[10px]">Asistente personal de gifting</p>
            </div>
          </div>

          <p className="text-white text-[13px] leading-snug mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 inline -mt-0.5 mr-1" />
            ¿No sabes qué regalar? Te ayudo a encontrar el regalo perfecto.
          </p>

          {/* Sugerencias */}
          <div className="space-y-1.5 mb-3">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(s.text)}
                className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-left transition group"
              >
                <span className="text-base">{s.icon}</span>
                <span className="text-white text-[12px] font-medium flex-1 truncate">{s.text}</span>
                <ArrowRight className="w-3 h-3 text-white/60 group-active:translate-x-0.5 transition" />
              </button>
            ))}
          </div>

          {/* CTA principal */}
          <button
            onClick={onOpenChat}
            className="w-full bg-white text-violet-700 font-bold rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Conversar con Peyu</span>
          </button>
        </div>
      </div>
    </section>
  );
}