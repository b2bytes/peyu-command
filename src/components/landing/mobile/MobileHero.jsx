import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MessageCircle } from 'lucide-react';

/**
 * Hero móvil con propuesta de valor + CTA dual:
 * - Ver tienda (e-commerce primario)
 * - Hablar con Peyu IA (diferenciador agéntico)
 *
 * Visual: imagen lifestyle con overlay verde, texto bold, 2 CTAs grandes.
 */
export default function MobileHero({ onOpenChat }) {
  return (
    <section className="relative px-4 pt-4 pb-5">
      {/* Card principal */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-emerald-900/40">
        {/* Background gradient + grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0F8B6C 0%, #14a583 45%, #0d6e58 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(167,217,201,0.5) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div className="relative px-5 py-7 text-white">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 mb-3">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Hecho en Chile · 100% Reciclado</span>
          </div>

          <h1 className="font-poppins font-black text-[26px] leading-[1.1] mb-2">
            Regalos chilenos<br />con propósito 🌱
          </h1>
          <p className="text-white/85 text-[13px] leading-snug mb-4 max-w-[90%]">
            Diseñados con plástico 100% reciclado, grabado láser gratis y 10 años de garantía.
          </p>

          {/* CTAs duales */}
          <div className="flex flex-col gap-2">
            <Link to="/shop" className="block">
              <button className="w-full bg-white hover:bg-white/95 active:bg-white/90 text-emerald-900 font-bold rounded-2xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
                <span className="text-sm">Ver tienda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={onOpenChat}
              className="w-full bg-emerald-950/40 hover:bg-emerald-950/60 active:bg-emerald-950/80 text-white border border-white/25 backdrop-blur-sm font-semibold rounded-2xl py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 text-cyan-200" />
              <span className="text-sm">Hablar con Peyu IA</span>
            </button>
          </div>

          {/* Trust micro-line */}
          <p className="text-[10px] text-white/65 text-center mt-3 font-medium">
            ⚡ Despacho Bluex · 🎁 Personalización láser gratis ≥10u
          </p>
        </div>
      </div>
    </section>
  );
}