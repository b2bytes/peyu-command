import { Recycle, Truck, Lock, Star, Leaf, Award } from 'lucide-react';

// Barra de trust + relato real PEYU — Tema Warm Clay 2027.
export default function TrustSocialBarV2() {
  const badges = [
    { icon: Recycle, t: 'Tapitas 100% recicladas', sub: 'recolectadas en Santiago' },
    { icon: Leaf, t: 'Marmolado único', sub: 'cada pieza es irrepetible' },
    { icon: Truck, t: 'BlueExpress a todo Chile', sub: 'despacho en 24–72 h' },
    { icon: Lock, t: 'Pago seguro', sub: 'WebPay · MercadoPago' },
    { icon: Award, t: 'Grabado láser gratis', sub: 'desde 10 unidades' },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
      <div className="bg-white rounded-2xl px-4 sm:px-6 py-4" style={{ border: '1.5px solid #D4C4B0' }}>
        {/* Mobile: scroll horizontal · Desktop: flex wrap */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide -mx-1 sm:flex-wrap sm:justify-between sm:gap-y-2">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 sm:py-0">
              <b.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#8BAD8A' }} />
              <div className="leading-tight">
                <p className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#2C1810' }}>{b.t}</p>
                <p className="text-[10px] whitespace-nowrap hidden sm:block" style={{ color: '#A08070' }}>{b.sub}</p>
              </div>
              {i < badges.length - 1 && <span className="ml-3 w-px h-6 flex-shrink-0 hidden sm:block" style={{ background: '#D4C4B0' }} />}
            </div>
          ))}
        </div>

        {/* Social proof row */}
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #EDE3D6' }}>
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
              ))}
            </div>
            <span className="text-xs font-bold" style={{ color: '#2C1810' }}>4.9</span>
            <span className="text-xs" style={{ color: '#A08070' }}>· +12.000 piezas vendidas</span>
          </div>
          <p className="text-xs font-semibold hidden sm:block" style={{ color: '#8BAD8A' }}>
            🌿 Más de 360 kg de plástico rescatados
          </p>
        </div>
      </div>
    </section>
  );
}