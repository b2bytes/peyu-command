import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import MobileFunnelStep from '@/components/embudo/MobileFunnelStep';
import { filtrarLogs, construirEmbudo, pasoCritico } from '@/lib/mobile-funnel';

// ════════════════════════════════════════════════════════════════════════
// /admin/embudo-movil — Desglose del embudo de compra por dispositivo.
// Muestra en qué paso exacto de la web móvil se pierden los usuarios.
// ════════════════════════════════════════════════════════════════════════
const DEVICES = [
  { id: 'mobile', label: 'Móvil', icon: Smartphone },
  { id: 'desktop', label: 'Escritorio', icon: Monitor },
  { id: 'todos', label: 'Todos', icon: null },
];
const RANGOS = [7, 30, 90];

export default function EmbudoMovil() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState('mobile');
  const [dias, setDias] = useState(30);
  const [carritos, setCarritos] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.ActivityLog.list('-created_date', 5000),
      base44.entities.CarritoAbandonado.filter({ estado: 'Pendiente' }, '-captured_at', 200),
    ])
      .then(([l, c]) => { setLogs(l || []); setCarritos(c || []); })
      .finally(() => setLoading(false));
  }, []);

  const embudo = useMemo(
    () => construirEmbudo(filtrarLogs(logs, { device, dias })),
    [logs, device, dias]
  );
  const critico = useMemo(() => pasoCritico(embudo), [embudo]);
  const conversion = embudo[0]?.sesiones
    ? ((embudo[embudo.length - 1].sesiones / embudo[0].sesiones) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-poppins font-bold text-2xl text-gray-900">Embudo de ventas por dispositivo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dónde se cae la gente en la web móvil, paso a paso. Cada número son personas únicas (sesiones).
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            onClick={() => setDevice(d.id)}
            className={`px-3 h-9 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              device === d.id ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
            style={device === d.id ? { background: 'linear-gradient(135deg,#C0785C,#A86440)' } : undefined}
          >
            {d.icon ? <d.icon className="w-3.5 h-3.5" /> : null} {d.label}
          </button>
        ))}
        <span className="mx-1 text-gray-300">|</span>
        {RANGOS.map((r) => (
          <button
            key={r}
            onClick={() => setDias(r)}
            className={`px-3 h-9 rounded-xl text-xs font-bold transition-all ${
              dias === r ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {r} días
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sesiones', valor: embudo[0]?.sesiones ?? 0 },
          { label: 'Compras', valor: embudo[embudo.length - 1]?.sesiones ?? 0 },
          { label: 'Conversión', valor: `${conversion}%` },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <p className="font-poppins font-bold text-xl text-gray-900">{k.valor}</p>
            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Punto crítico */}
      {critico && critico.perdidos > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-900">Mayor fuga: {critico.label}</p>
            <p className="text-xs text-red-700 mt-0.5">
              {critico.perdidos} personas ({critico.abandonoPct}%) no avanzan desde este paso. Es el punto con
              más impacto si lo optimizas.
            </p>
          </div>
        </div>
      )}

      {/* Pasos */}
      <div>
        {embudo.map((paso, i) => (
          <MobileFunnelStep
            key={paso.id}
            paso={paso}
            index={i}
            critico={critico?.id === paso.id && paso.perdidos > 0}
          />
        ))}
      </div>

      {/* Carritos abandonados vivos */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <p className="font-bold text-sm text-gray-900">Carritos pendientes ahora mismo: {carritos.length}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Personas que dejaron su email en el checkout y no completaron el pago. Reciben recordatorio automático
          por correo y WhatsApp.
        </p>
      </div>
    </div>
  );
}