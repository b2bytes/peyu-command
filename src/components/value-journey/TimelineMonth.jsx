// Mes de la línea de tiempo del proyecto.
// Estados visuales: pagado (teal) · sin pago (amber) · futuro (slate punteado).
import { Check, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TimelineMonth({ entry, index }) {
  const isFuture = entry.es_futuro;
  const isUnpaid = entry.pagado === false;
  const isPaid = entry.pagado === true;

  // Color del nodo según estado
  let nodeStyle, kickerColor, bulletColor, badge;
  if (isFuture) {
    nodeStyle = 'bg-slate-800 border-2 border-dashed border-slate-500';
    kickerColor = 'text-slate-400';
    bulletColor = 'bg-slate-500';
    badge = { text: 'Próximo', tone: 'slate' };
  } else if (isUnpaid) {
    nodeStyle = 'bg-amber-500/20 border-2 border-amber-400/70 shadow-lg shadow-amber-500/20';
    kickerColor = 'text-amber-300';
    bulletColor = 'bg-amber-400';
    badge = { text: 'Construido sin pago', tone: 'amber' };
  } else {
    nodeStyle = 'bg-teal-500 border-2 border-teal-300 shadow-lg shadow-teal-500/40';
    kickerColor = 'text-teal-300';
    bulletColor = 'bg-teal-400';
    badge = { text: 'Pagado', tone: 'teal' };
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative pl-10 md:pl-14 pb-10 last:pb-0"
    >
      {/* Línea vertical */}
      <div className="absolute left-3 md:left-5 top-3 bottom-0 w-px bg-slate-800" />
      {/* Punto */}
      <div className={`absolute left-0 md:left-2 top-1 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center ${nodeStyle}`}>
        {isFuture ? (
          <Clock className="w-3 h-3 text-slate-400" />
        ) : isUnpaid ? (
          <AlertCircle className="w-3 h-3 text-amber-300" />
        ) : (
          <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <span className={`text-[11px] uppercase tracking-wider font-bold font-jakarta ${kickerColor}`}>
          {entry.mes}
        </span>
        <h3 className="font-fraunces text-xl md:text-2xl font-medium text-slate-50 tracking-tight flex-1">
          {entry.titulo}
        </h3>
        <Badge tone={badge.tone}>{badge.text}</Badge>
      </div>
      <p className="text-slate-400 text-[14px] md:text-[15px] font-inter mb-3 leading-relaxed">
        {entry.descripcion}
      </p>
      <ul className="space-y-1.5">
        {entry.entregables.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-300 text-[13px] md:text-sm font-inter">
            <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${bulletColor}`} />
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function Badge({ tone, children }) {
  const TONE = {
    teal:  'bg-teal-500/15 text-teal-200 border-teal-400/40',
    amber: 'bg-amber-500/15 text-amber-200 border-amber-400/40',
    slate: 'bg-slate-700/30 text-slate-400 border-slate-600/40',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold font-jakarta px-2 py-0.5 rounded-full border ${TONE[tone]}`}>
      {children}
    </span>
  );
}