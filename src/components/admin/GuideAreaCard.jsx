import { Link } from 'react-router-dom';

// Un camino guiado (Vender / Producir / Administrar / Crecer) con sus 3 destinos.
export default function GuideAreaCard({ area, onNavigate }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-2.5">
      <p className="text-xs font-bold text-white leading-none">{area.emoji} {area.label}</p>
      <p className="text-[10px] text-white/40 mt-1 leading-snug">{area.desc}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {area.links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={onNavigate}
            className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-all"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}