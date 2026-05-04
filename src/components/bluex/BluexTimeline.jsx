import { CheckCircle2, AlertTriangle, Truck, Package, MapPin } from 'lucide-react';

const ICONS = {
  '01': Package, '02': Truck, '03': Truck, '04': Truck,
  '05': CheckCircle2, '06': AlertTriangle, '07': AlertTriangle, '99': AlertTriangle,
};

/**
 * Timeline de eventos del envío (orden cronológico inverso).
 */
export default function BluexTimeline({ eventos = [] }) {
  if (eventos.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        Sin eventos registrados aún
      </div>
    );
  }

  // Ya viene ordenado descendente; mostramos así (más reciente arriba)
  return (
    <div className="space-y-0">
      {eventos.map((e, idx) => {
        const Icon = ICONS[e.code] || MapPin;
        const isFirst = idx === 0;
        const isException = e.es_excepcion;
        const isDelivered = e.code === '05';
        return (
          <div key={idx} className="flex gap-3 relative">
            {/* Línea conectora */}
            {idx < eventos.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}
            {/* Icono */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isException ? 'bg-red-100' :
              isDelivered ? 'bg-emerald-100' :
              isFirst ? 'bg-cyan-100' : 'bg-slate-100'
            }`}>
              <Icon className={`w-4 h-4 ${
                isException ? 'text-red-600' :
                isDelivered ? 'text-emerald-600' :
                isFirst ? 'text-cyan-600' : 'text-slate-500'
              }`} />
            </div>
            {/* Contenido */}
            <div className="flex-1 pb-4">
              <p className={`text-sm font-semibold ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                {e.estado}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {e.descripcion}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="tabular-nums">{new Date(e.at).toLocaleString('es-CL')}</span>
                {e.ubicacion && <><span>·</span><span>{e.ubicacion}</span></>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}