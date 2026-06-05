import { Recycle, Truck, Lock, Star } from 'lucide-react';

// Barra de trust badges + social proof bajo el hero (Tema 6).
export default function TrustSocialBarV2() {
  const badges = [
    { icon: Recycle, t: 'Plástico 100% reciclado' },
    { icon: Truck, t: 'Envío BlueExpress' },
    { icon: Lock, t: 'Pago seguro' },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
      <div className="bg-white border border-[#EBE3D6] rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <b.icon className="w-4 h-4 text-[#0F8B6C] flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-[#2A2420]">{b.t}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:border-l sm:border-[#EBE3D6] sm:pl-5">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#2A2420]">4.9</span>
          <span className="text-xs text-[#A78B6F]">· +miles vendidos</span>
        </div>
      </div>
    </section>
  );
}