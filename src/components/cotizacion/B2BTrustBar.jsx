import { TrendingDown, BadgeCheck, Clock, Recycle } from 'lucide-react';

// Barra de beneficios y confianza para el cotizador B2B. Comunica por qué
// comprar por volumen en PEYU: mejor precio, factura, plazos y sostenibilidad.
const BENEFICIOS = [
  { Icon: TrendingDown, titulo: 'Hasta -33% por volumen', sub: 'Mientras más unidades, mejor precio' },
  { Icon: BadgeCheck, titulo: 'Factura y datos de empresa', sub: 'Compra formal para tu organización' },
  { Icon: Clock, titulo: 'Respuesta en 24h hábiles', sub: 'Un ejecutivo revisa tu pedido' },
  { Icon: Recycle, titulo: '100% plástico reciclado', sub: 'Reporta tu impacto ESG' },
];

export default function B2BTrustBar() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {BENEFICIOS.map(({ Icon, titulo, sub }) => (
        <div key={titulo} className="bg-white border border-[#EBE3D6] rounded-2xl p-3.5 flex flex-col gap-1.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F8B6C]/10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-[#0F8B6C]" />
          </div>
          <p className="font-bold text-sm text-[#2A2420] leading-tight">{titulo}</p>
          <p className="text-[11px] text-[#A78B6F] leading-snug">{sub}</p>
        </div>
      ))}
    </div>
  );
}