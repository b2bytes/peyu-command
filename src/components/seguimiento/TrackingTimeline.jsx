import { Clock, CheckCircle2, RefreshCw, Package, Truck, AlertCircle } from 'lucide-react';

const PASOS = [
  { estado: 'Nuevo', label: 'Pedido recibido', icon: Clock, desc: 'Tu pedido fue registrado y está en revisión.' },
  { estado: 'Confirmado', label: 'Confirmado', icon: CheckCircle2, desc: 'Confirmado y en cola de producción.' },
  { estado: 'En Producción', label: 'En producción', icon: RefreshCw, desc: 'Fabricando y personalizando tu pedido.' },
  { estado: 'Listo para Despacho', label: 'Listo', icon: Package, desc: 'Tu pedido está listo esperando el courier.' },
  { estado: 'Despachado', label: 'Despachado', icon: Truck, desc: 'En camino a tu dirección.' },
  { estado: 'Entregado', label: 'Entregado', icon: CheckCircle2, desc: '¡Tu pedido llegó!' },
];

const ESTADO_IDX = Object.fromEntries(PASOS.map((p, i) => [p.estado, i]));

// ETA en días por paso (acumulativo desde "Nuevo")
const ETA_DIAS = {
  'Nuevo': 0,
  'Confirmado': 1,
  'En Producción': 2,
  'Listo para Despacho': 5,
  'Despachado': 6,
  'Entregado': 9,
};

const sumarDiasHabiles = (fechaIso, dias) => {
  if (!fechaIso) return null;
  const d = new Date(fechaIso);
  let added = 0;
  while (added < dias) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

export default function TrackingTimeline({ pedido }) {
  const esCancelado = pedido?.estado === 'Cancelado' || pedido?.estado === 'Reembolsado';
  const pasoActual = ESTADO_IDX[pedido?.estado] ?? -1;

  if (esCancelado) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="font-poppins font-bold text-red-700 text-lg">{pedido.estado}</p>
        <p className="text-sm text-red-500 mt-1">¿Tienes preguntas? Escríbenos por WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="font-poppins font-bold text-gray-900">Estado del pedido</h3>
        {pedido?.fecha && pasoActual >= 0 && pasoActual < 5 && (
          <p className="text-xs text-gray-400">
            Entrega estimada: <strong className="text-gray-700">{sumarDiasHabiles(pedido.fecha, ETA_DIAS['Entregado']) || '—'}</strong>
          </p>
        )}
      </div>

      <div className="space-y-0">
        {PASOS.map((paso, i) => {
          const completado = i <= pasoActual;
          const activo = i === pasoActual;
          const Icon = paso.icon;
          const etaPaso = pedido?.fecha ? sumarDiasHabiles(pedido.fecha, ETA_DIAS[paso.estado] || 0) : null;

          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                  activo ? 'bg-gray-900 text-white shadow-lg scale-110' :
                  completado ? 'bg-[#0F8B6C]/10 text-[#0F8B6C]' :
                  'bg-gray-100 text-gray-300'
                }`}>
                  <Icon className={`w-4 h-4 ${activo ? 'animate-pulse' : ''}`} />
                </div>
                {i < PASOS.length - 1 && (
                  <div className={`w-0.5 h-10 mt-1 mb-1 rounded-full transition-colors ${
                    i < pasoActual ? 'bg-[#0F8B6C]' : 'bg-gray-100'
                  }`} />
                )}
              </div>
              <div className="pb-6 pt-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-semibold text-sm ${activo ? 'text-gray-900' : completado ? 'text-gray-600' : 'text-gray-300'}`}>
                    {paso.label}
                  </p>
                  {activo && (
                    <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">EN CURSO</span>
                  )}
                  {!activo && !completado && etaPaso && (
                    <span className="text-[10px] text-gray-400 font-medium">≈ {etaPaso}</span>
                  )}
                </div>
                {(activo || completado) && (
                  <p className="text-xs text-gray-400 mt-0.5">{paso.desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { PASOS, ESTADO_IDX };