import { Recycle, Truck, ShieldCheck, Star, Leaf, Zap } from 'lucide-react';

// ── Trust bar 2027: iconos SF-style thin stroke, dots de status, tipografía más editorial
const badges = [
  {
    icon: Recycle,
    t: 'Tapitas 100% recicladas',
    sub: 'recolectadas en Santiago',
    color: '#0F8B6C',
    bg: 'rgba(15,139,108,.09)',
  },
  {
    icon: Leaf,
    t: 'Marmolado único',
    sub: 'cada pieza irrepetible',
    color: '#8BAD8A',
    bg: 'rgba(139,173,138,.10)',
  },
  {
    icon: Truck,
    t: 'BlueExpress a todo Chile',
    sub: 'despacho en 24–72 h',
    color: '#5B7DB1',
    bg: 'rgba(91,125,177,.09)',
  },
  {
    icon: ShieldCheck,
    t: 'Pago 100% seguro',
    sub: 'WebPay · MercadoPago',
    color: '#7C6BB0',
    bg: 'rgba(124,107,176,.09)',
  },
  {
    icon: Zap,
    t: 'Grabado láser gratis',
    sub: 'desde 10 unidades',
    color: '#C0785C',
    bg: 'rgba(192,120,92,.09)',
  },
];

export default function TrustSocialBarV2() {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 mb-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1.5px solid #E8DDD0', boxShadow: '0 2px 16px rgba(44,24,16,.05)' }}>

          {/* Badges — 2 columnas en móvil, 5 en desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-5"
            style={{ borderBottom: '1px solid #F2EBE0' }}>
            {badges.map((b, i) => (
              <div key={i}
                className="flex items-center gap-2.5 px-3 py-3 sm:px-4 sm:py-4 group hover:bg-[#FDFAF6] transition-colors"
                style={{
                  borderRight: (i + 1) % 2 !== 0 ? '1px solid #F2EBE0' : 'none',
                  borderBottom: i < badges.length - 2 ? '1px solid #F2EBE0' : 'none',
                }}>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ background: b.bg }}>
                  <b.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: b.color }} strokeWidth={1.75} />
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold" style={{ color: '#2C1810' }}>{b.t}</p>
                  <p className="text-[9px] sm:text-[10px] hidden sm:block mt-0.5" style={{ color: '#A08070' }}>{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof row */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5">
            <div className="flex items-center gap-2.5">
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" strokeWidth={0} />
                ))}
              </div>
              <span className="text-xs font-bold" style={{ color: '#2C1810' }}>4.9</span>
              <span className="text-xs hidden sm:inline" style={{ color: '#A08070' }}>· +12.000 piezas vendidas</span>
            </div>

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0F8B6C' }} />
              <p className="text-xs font-semibold" style={{ color: '#0F8B6C' }}>
                360 kg de plástico rescatados · y contando
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}