// Card de plan propuesto al cliente.
import { Check, X, Star } from 'lucide-react';
import { fmtCLP } from '@/lib/peyu-value-journey';

export default function PlanCard({ plan }) {
  const isRec = plan.recomendado;
  return (
    <div className={`relative rounded-2xl p-6 md:p-7 flex flex-col h-full border-2 ${
      isRec
        ? 'bg-gradient-to-br from-teal-950/60 to-slate-900 border-teal-400/60 shadow-2xl shadow-teal-500/20'
        : 'bg-slate-900 border-slate-800'
    }`}>
      {isRec && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center gap-1 shadow-lg shadow-teal-500/30">
          <Star className="w-3 h-3 text-slate-950" strokeWidth={3} fill="currentColor" />
          <span className="text-[10px] font-bold font-jakarta text-slate-950 uppercase tracking-wider">Recomendado</span>
        </div>
      )}
      <h3 className="font-fraunces text-2xl md:text-3xl font-medium text-slate-50 tracking-tight">
        {plan.nombre}
      </h3>
      <p className="text-[13px] text-slate-400 font-inter mt-1 mb-5 leading-relaxed">
        {plan.descripcion}
      </p>
      <div className="mb-6">
        <p className="font-jakarta font-extrabold text-3xl md:text-4xl text-slate-50">
          {fmtCLP(plan.precio_clp)}
        </p>
        <p className="text-[12px] text-slate-500 font-inter">CLP / mes + IVA</p>
      </div>
      <ul className="space-y-2 flex-1 mb-5">
        {plan.incluye.map((i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-slate-200 font-inter">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isRec ? 'text-teal-300' : 'text-emerald-400'}`} />
            <span>{i}</span>
          </li>
        ))}
        {plan.no_incluye.map((i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-slate-500 font-inter line-through">
            <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-600" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}