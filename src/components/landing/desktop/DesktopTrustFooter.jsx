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
      {/* 📸 Bloque editorial "Hecho en Chile" — historia visual del producto.
          Dos imágenes: taller (humanidad) + proceso (transformación de residuo).
          Story-telling sustentable sin texto pesado. */}
      <section className="px-6 py-14 border-t border-ld-border">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="ld-card overflow-hidden aspect-[3/4]">
              <img
                src="https://media.base44.com/images/public/69d99b9d61f699701129c103/d5e4766e7_generated_image.png"
                alt="Taller artesanal PEYU en Santiago, Chile"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="ld-card overflow-hidden aspect-[3/4] mt-8">
              <img
                src="https://media.base44.com/images/public/69d99b9d61f699701129c103/42cc99473_generated_image.png"
                alt="De botella plástica reciclada a producto PEYU"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="space-y-5">
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: 'var(--ld-action)' }}>
              Hecho en Chile · Desde 2022
            </span>
            <h2 className="ld-display text-[40px] xl:text-[52px] leading-[0.98] text-ld-fg">
              De botella plástica a{' '}
              <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
                regalo con historia.
              </span>
            </h2>
            <p className="text-[15px] leading-relaxed text-ld-fg-soft max-w-[480px]">
              Cada producto PEYU nace en nuestro taller de Santiago. Recolectamos plástico
              post-consumo en Chile, lo trituramos, lo fundimos y le damos una segunda vida
              en productos que duran décadas. Un regalo que cuenta una historia.
            </p>
            <div className="flex flex-wrap gap-6 pt-2">
              <Stat number="+12.000" label="Botellas rescatadas" />
              <Stat number="+8.500" label="Productos hechos" />
              <Stat number="10 años" label="Garantía real" />
            </div>
            <Link to="/nosotros">
              <button className="ld-btn-ghost rounded-2xl px-6 py-3 text-[14px] font-semibold text-ld-fg mt-3">
                Conocer nuestra historia
              </button>
            </Link>
          </div>
        </div>
      </section>

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

function Stat({ number, label }) {
  return (
    <div>
      <p className="ld-display text-2xl text-ld-fg leading-none">{number}</p>
      <p className="text-[11px] mt-1 text-ld-fg-muted uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}