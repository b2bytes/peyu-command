import { Link } from 'react-router-dom';
import { Recycle, ShieldCheck, Truck, Award, Lock } from 'lucide-react';

const SIGNALS = [
  { icon: Recycle,     label: '100% Plástico Reciclado', desc: 'Recolectado en Chile' },
  { icon: ShieldCheck, label: '10 años de garantía',     desc: 'Sin letra chica' },
  { icon: Truck,       label: 'Despacho Bluex',          desc: 'A todo Chile en 2-5 días' },
  { icon: Award,       label: 'Hecho en Chile',          desc: 'Producción local · Santiago' },
];

export default function DesktopTrustFooter() {
  return (
    <>
      {/* Trust band */}
      <section className="px-6 py-12 border-t border-ld-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SIGNALS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="ld-card p-5 flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight text-ld-fg">{s.label}</p>
                  <p className="text-[11px] leading-tight mt-0.5 text-ld-fg-muted">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-ld-border mt-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <p className="font-bold text-sm text-ld-fg">PEYU Chile</p>
            <p className="text-[11px] mt-0.5 text-ld-fg-muted">Regalos con propósito · Hecho a mano en Chile</p>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-ld-fg-muted">
            <Link to="/nosotros"    className="hover:text-ld-fg transition">Nosotros</Link>
            <span className="text-ld-fg-subtle">·</span>
            <Link to="/blog"        className="hover:text-ld-fg transition">Blog</Link>
            <span className="text-ld-fg-subtle">·</span>
            <Link to="/soporte"     className="hover:text-ld-fg transition">Soporte</Link>
            <span className="text-ld-fg-subtle">·</span>
            <Link to="/seguimiento" className="hover:text-ld-fg transition">Seguimiento</Link>
            <span className="text-ld-fg-subtle">·</span>
            <Link to="/faq"         className="hover:text-ld-fg transition">FAQ</Link>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-[11px] text-ld-fg-subtle hover:text-ld-action transition"
          >
            <Lock className="w-3 h-3" /> Admin
          </Link>
        </div>
      </footer>
    </>
  );
}