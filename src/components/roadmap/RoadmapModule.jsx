import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ExternalLink, Cpu } from 'lucide-react';
import { STATUS_META } from '@/lib/peyu-roadmap';

const STATUS_CLASSES = {
  done:       'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  optimizing: 'bg-teal-500/15 text-teal-300 border-teal-400/30',
  testing:    'bg-sky-500/15 text-sky-300 border-sky-400/30',
  building:   'bg-amber-500/15 text-amber-300 border-amber-400/30',
  planned:    'bg-slate-500/15 text-slate-300 border-slate-400/30',
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.planned;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${STATUS_CLASSES[status]}`}>
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export default function RoadmapModule({ module, progress, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {open ? <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-poppins font-semibold text-white text-sm truncate">{module.title}</h3>
              <span className="text-[10px] text-white/40">· {module.items.length} items</span>
            </div>
            <p className="text-xs text-white/50 mt-0.5 truncate">{module.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-poppins font-bold text-white">{progress}%</div>
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress >= 80 ? '#0F8B6C' : progress >= 50 ? '#A7D9C9' : '#D96B4D',
                }}
              />
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-1.5">
          {module.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm text-white/85 truncate">{item.name}</span>
                {item.fn && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-violet-300/70 bg-violet-500/10 px-1.5 py-0.5 rounded">
                    <Cpu className="w-2.5 h-2.5" />
                    {item.fn}
                  </span>
                )}
                {item.page && (
                  <Link
                    to={item.page.startsWith('/admin') ? item.page : item.page}
                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-sky-300/70 bg-sky-500/10 px-1.5 py-0.5 rounded hover:bg-sky-500/20"
                    target={item.page.startsWith('/admin') ? '_self' : '_blank'}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    {item.page}
                  </Link>
                )}
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}