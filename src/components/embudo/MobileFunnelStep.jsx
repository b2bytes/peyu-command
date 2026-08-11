import { TrendingDown, Users } from 'lucide-react';

// Una fila del embudo móvil: sesiones que llegaron al paso, barra proporcional
// y la fuga hacia el paso siguiente.
export default function MobileFunnelStep({ paso, index, critico }) {
  return (
    <div className="relative">
      <div
        className={`rounded-2xl p-4 bg-white transition-all ${critico ? 'ring-2 ring-red-300' : ''}`}
        style={{ border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Paso {index + 1}</p>
            <p className="font-bold text-gray-900 text-sm">{paso.label}</p>
            <p className="text-[11px] text-gray-500">{paso.ruta}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-poppins font-bold text-xl text-gray-900 flex items-center gap-1 justify-end">
              <Users className="w-4 h-4 text-gray-400" /> {paso.sesiones}
            </p>
            <p className="text-[11px] font-semibold text-gray-500">{paso.pctDelTotal}% del total</p>
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${paso.pctDelTotal}%`, background: 'linear-gradient(90deg,#C0785C,#A86440)' }}
          />
        </div>
      </div>

      {!paso.esUltimo && (
        <div className="flex items-center gap-2 pl-4 py-2">
          <TrendingDown className={`w-4 h-4 ${critico ? 'text-red-600' : 'text-gray-400'}`} />
          <p className={`text-xs font-bold ${critico ? 'text-red-600' : 'text-gray-500'}`}>
            Abandonan aquí: {paso.perdidos} personas ({paso.abandonoPct}%)
            {critico ? ' · mayor fuga del embudo' : ''}
          </p>
        </div>
      )}
    </div>
  );
}