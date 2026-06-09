import { CheckCircle2, AlertTriangle, Calendar, Bug, Sparkles, Rocket, ListChecks, TrendingUp } from 'lucide-react';
import { changelogKPIs, PENDIENTES, ESTADO_SISTEMA } from '@/lib/changelog-peyu';
import ChangelogTimeline from '@/components/resumen/ChangelogTimeline';
import AccesosRapidos from '@/components/resumen/AccesosRapidos';

/**
 * ResumenOperativo — Dashboard vivo de avances del proyecto.
 * INTELIGENTE: se alimenta 100% de lib/changelog-peyu.js. Para actualizarlo
 * solo se agregan entradas a ese archivo — KPIs, timeline y pendientes se
 * recalculan solos. No editar JSX para registrar avances.
 */
export default function ResumenOperativo() {
  const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const kpis = changelogKPIs();

  const kpiCards = [
    { label: 'Cambios totales', valor: kpis.total, icon: ListChecks, color: 'text-slate-700 bg-slate-100 border-slate-200' },
    { label: 'Bugs corregidos', valor: kpis.bugs, icon: Bug, color: 'text-red-700 bg-red-50 border-red-200' },
    { label: 'Mejoras', valor: kpis.mejoras, icon: Sparkles, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { label: 'Nuevas funciones', valor: kpis.features, icon: Rocket, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Pendientes', valor: kpis.pendientes, icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold mb-2.5 sm:mb-3 text-blue-700 capitalize">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {fechaHoy}
              </div>
              <h1 className="text-2xl sm:text-4xl font-poppins font-black text-slate-900">Resumen Operativo</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2">Historial vivo de avances, bugs corregidos y estado del sistema</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-50 border border-green-200 text-green-700 self-start">
              <CheckCircle2 className="w-4 h-4" /> Sistema operativo
            </div>
          </div>

          {/* KPIs auto-calculados desde el changelog */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 sm:mt-6">
            {kpiCards.map((k) => (
              <div key={k.label} className={`rounded-xl border p-2.5 sm:p-3 ${k.color}`}>
                <div className="flex items-center gap-1.5">
                  <k.icon className="w-3.5 h-3.5" />
                  <span className="text-lg sm:text-2xl font-black">{k.valor}</span>
                </div>
                <p className="text-[9px] sm:text-[11px] font-bold mt-0.5 opacity-80">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          {/* TIMELINE DE AVANCES (data-driven) */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> Historial de avances
            </h2>
            <ChangelogTimeline />
          </section>

          <div className="space-y-4 sm:space-y-6">
            {/* ESTADO DEL SISTEMA */}
            <section className="bg-white rounded-2xl border border-green-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Estado del Sistema
              </div>
              <div className="p-3.5 sm:p-5 space-y-1">
                {ESTADO_SISTEMA.map((s) => (
                  <div key={s.nombre} className="flex items-center justify-between py-1.5 sm:py-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">{s.nombre}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> {s.estado}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* PRÓXIMAS MEJORAS */}
            <section className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> Próximas Mejoras
              </div>
              <div className="p-3.5 sm:p-5 space-y-2.5">
                {PENDIENTES.map((p, i) => (
                  <div key={i} className="flex gap-2.5 text-xs sm:text-sm text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex-shrink-0 self-start">{p.tag}</span>
                    <span>{p.texto}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <AccesosRapidos />

      </div>
    </div>
  );
}