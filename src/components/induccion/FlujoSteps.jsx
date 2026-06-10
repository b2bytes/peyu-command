import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Lista numerada de pasos de un flujo operativo, con link opcional al módulo.
export default function FlujoSteps({ flujo }) {
  return (
    <div className="ld-card p-5">
      <div className="flex items-start gap-3 mb-1">
        <span className="text-2xl leading-none">{flujo.emoji}</span>
        <div>
          <h3 className="font-jakarta font-bold text-base text-ld-fg">{flujo.titulo}</h3>
          <p className="text-sm text-ld-fg-muted mt-0.5">{flujo.intro}</p>
        </div>
      </div>
      <ol className="mt-4 space-y-0">
        {flujo.pasos.map((p, i) => (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {/* línea vertical */}
            {i < flujo.pasos.length - 1 && (
              <span className="absolute left-[13px] top-7 bottom-0 w-px bg-ld-border" />
            )}
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--ld-action)' }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-semibold text-sm text-ld-fg leading-snug">{p.titulo}</p>
              <p className="text-[13px] text-ld-fg-muted leading-relaxed mt-0.5">{p.detalle}</p>
              {p.ruta && (
                <Link
                  to={p.ruta}
                  className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-ld-action hover:underline"
                >
                  Ir al módulo <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}