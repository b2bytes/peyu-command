import { Truck, Package, AlertTriangle, Clock, CheckCircle2, MapPin } from 'lucide-react';

/**
 * KPIs del centro logístico Bluex.
 */
export default function BluexKPIs({ envios }) {
  const total = envios.length;
  const entregados = envios.filter(e => e.estado === 'Entregado').length;
  const enTransito = envios.filter(e => ['En Tránsito', 'En Reparto', 'Retirado por Courier'].includes(e.estado)).length;
  const pendientes = envios.filter(e => e.estado === 'Etiqueta Generada' || e.estado === 'En Bodega').length;
  const conExcepcion = envios.filter(e => e.tiene_excepcion).length;
  const atrasados = envios.filter(e => e.atrasado && e.estado !== 'Entregado').length;

  const otifPct = total > 0 ? (entregados / total * 100) : 0;

  const cards = [
    { label: 'Envíos totales', val: total, sub: `${entregados} entregados`, icon: Package, gradient: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200' },
    { label: 'En tránsito', val: enTransito, sub: 'viajando ahora', icon: Truck, gradient: 'from-cyan-500 to-teal-500', bg: 'from-cyan-50 to-teal-50', border: 'border-cyan-200' },
    { label: 'Por despachar', val: pendientes, sub: 'esperando courier', icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
    { label: 'OTIF', val: `${otifPct.toFixed(0)}%`, sub: 'entregas a tiempo', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200' },
    { label: 'Excepciones', val: conExcepcion, sub: 'requieren atención', icon: AlertTriangle, gradient: 'from-red-500 to-rose-500', bg: 'from-red-50 to-rose-50', border: 'border-red-200', urgent: conExcepcion > 0 },
    { label: 'Atrasados', val: atrasados, sub: 'vs promesa cliente', icon: MapPin, gradient: 'from-orange-500 to-red-500', bg: 'from-orange-50 to-red-50', border: 'border-orange-200', urgent: atrasados > 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-lg sm:rounded-2xl p-2.5 sm:p-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all ${c.urgent ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}>
            <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-sm mb-1.5 sm:mb-2`}>
              <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
            </div>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">{c.label}</p>
            <p className="font-poppins font-extrabold text-lg sm:text-2xl text-foreground tabular-nums leading-none mt-1">{c.val}</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}