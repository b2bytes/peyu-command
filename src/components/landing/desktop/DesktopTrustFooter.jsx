import { Link } from 'react-router-dom';
import { Recycle, ShieldCheck, Truck, Award, Lock } from 'lucide-react';

const SIGNALS = [
  { icon: Recycle, label: '100% Plástico Reciclado', desc: 'Recolectado en Chile', color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-600/5' },
  { icon: ShieldCheck, label: '10 años de garantía', desc: 'Sin letra chica', color: 'text-cyan-400', bg: 'from-cyan-500/15 to-cyan-600/5' },
  { icon: Truck, label: 'Despacho Bluex', desc: 'A todo Chile en 2-5 días', color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-600/5' },
  { icon: Award, label: 'Empresa B Chile', desc: 'Triple impacto certificado', color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-600/5' },
];

export default function DesktopTrustFooter() {
  return (
    <>
      {/* Trust band */}
      <section className="px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SIGNALS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`bg-gradient-to-br ${s.bg} backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/25 transition`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${s.color}`} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold leading-tight">{s.label}</p>
                  <p className="text-white/55 text-[11px] leading-tight mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer rico */}
      <footer className="px-6 py-8 border-t border-white/10 mt-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <p className="text-white font-bold text-sm">PEYU Chile</p>
            <p className="text-white/50 text-[11px] mt-0.5">Regalos con propósito · Hecho a mano en Chile</p>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-white/50">
            <Link to="/nosotros" className="hover:text-teal-300 transition">Nosotros</Link>
            <span className="text-white/20">·</span>
            <Link to="/blog" className="hover:text-teal-300 transition">Blog</Link>
            <span className="text-white/20">·</span>
            <Link to="/soporte" className="hover:text-teal-300 transition">Soporte</Link>
            <span className="text-white/20">·</span>
            <Link to="/seguimiento" className="hover:text-teal-300 transition">Seguimiento</Link>
            <span className="text-white/20">·</span>
            <Link to="/faq" className="hover:text-teal-300 transition">FAQ</Link>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-[11px] text-white/35 hover:text-teal-300 transition"
          >
            <Lock className="w-3 h-3" /> Admin
          </Link>
        </div>
      </footer>
    </>
  );
}