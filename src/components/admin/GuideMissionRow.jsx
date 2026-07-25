import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const COLOR = {
  critical: { dot: '#EF4444', label: 'Urgente' },
  high: { dot: '#F59E0B', label: 'Importante' },
  medium: { dot: '#0EA5E9', label: 'Cuando puedas' },
};

// Una tarea concreta que Peyu le propone al fundador, con su acceso directo.
export default function GuideMissionRow({ mission, onNavigate }) {
  const c = COLOR[mission.priority] || COLOR.medium;
  return (
    <Link
      to={mission.action_target || '/admin'}
      onClick={onNavigate}
      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/25 transition-all group"
    >
      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: c.dot }} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white leading-snug truncate">{mission.title}</p>
        <p className="text-[10px] text-white/45 leading-snug line-clamp-2 mt-0.5">{mission.subtitle}</p>
        <p className="text-[9px] uppercase tracking-wide mt-1" style={{ color: c.dot }}>
          {c.label} · {mission.action_label || 'Ver'}
        </p>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white flex-shrink-0 mt-1" />
    </Link>
  );
}