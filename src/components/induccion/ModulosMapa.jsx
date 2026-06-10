import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { MODULOS } from '@/lib/induccion-data';

// Mapa de módulos del admin agrupados por área, en orden de importancia diaria.
export default function ModulosMapa() {
  return (
    <div className="space-y-5">
      {MODULOS.map((grupo) => (
        <div key={grupo.grupo}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-ld-fg-muted">
            <span className="w-2 h-2 rounded-full" style={{ background: grupo.color }} />
            {grupo.grupo}
          </p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {grupo.items.map((m) => (
              <Link
                key={m.ruta}
                to={m.ruta}
                className="ld-card p-3.5 flex items-start justify-between gap-2 group hover:-translate-y-0.5 transition-transform"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm text-ld-fg">{m.nombre}</p>
                  <p className="text-xs text-ld-fg-muted leading-relaxed mt-0.5">{m.desc}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-1 text-ld-fg-subtle group-hover:text-ld-action transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}