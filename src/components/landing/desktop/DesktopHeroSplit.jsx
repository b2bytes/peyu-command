import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Recycle, ShieldCheck, Award } from 'lucide-react';

/**
 * Hero gigante (col izquierda) en desktop.
 * Propuesta de valor + CTAs + micro trust signals.
 * Glassmorphism sobre el fondo dinámico (BackgroundSwitcher).
 */
export default function DesktopHeroSplit({ onOpenChat }) {
  return (
    <div className="peyu-liquid-glass rounded-3xl overflow-hidden flex flex-col h-full p-8 xl:p-10 relative">
      {/* Glow ambient */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex-1 flex flex-col justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3 py-1 mb-5 self-start">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
            Hecho en Chile · 100% Reciclado
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-poppins font-black text-white text-[44px] xl:text-[56px] leading-[1.02] mb-4 tracking-tight">
          Regalos chilenos<br />
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            con propósito 🌱
          </span>
        </h2>

        <p className="text-white/80 text-base xl:text-lg leading-relaxed mb-7 max-w-[480px]">
          Diseñados con plástico 100% reciclado, grabado láser gratis y 10 años de garantía.
          Para tu casa, tu oficina o tu equipo entero.
        </p>

        {/* CTAs duales */}
        <div className="flex flex-wrap gap-3 mb-7">
          <Link to="/shop">
            <button className="bg-white hover:bg-white/95 active:bg-white/90 text-emerald-900 font-bold rounded-2xl px-6 py-3.5 flex items-center gap-2 shadow-xl shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <span className="text-sm">Ver tienda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={onOpenChat}
            className="bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/30 backdrop-blur-md font-semibold rounded-2xl px-6 py-3.5 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span className="text-sm">Hablar con Peyu IA →</span>
          </button>
        </div>

        {/* Trust mini-row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 border-t border-white/15">
          <div className="flex items-center gap-1.5 text-white/85">
            <Recycle className="w-4 h-4 text-emerald-300" />
            <span className="text-[12px] font-semibold">100% Reciclado</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/85">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            <span className="text-[12px] font-semibold">10 años garantía</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/85">
            <Award className="w-4 h-4 text-yellow-300" />
            <span className="text-[12px] font-semibold">Empresa B Chile</span>
          </div>
        </div>
      </div>
    </div>
  );
}