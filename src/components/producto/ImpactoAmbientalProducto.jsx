import { buildImpactoUnidad } from '@/lib/impacto-ambiental';
import { Leaf, ExternalLink } from 'lucide-react';

/**
 * Tarjeta de impacto ambiental por producto en la página de detalle.
 * Datos reales basados en LCA (no Math.random).
 */
export default function ImpactoAmbientalProducto({ producto }) {
  if (!producto) return null;
  const impacto = buildImpactoUnidad(producto);
  const isFibra = impacto.tipo === 'fibra_trigo';

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isFibra ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
            <Leaf className={`w-4 h-4 ${isFibra ? 'text-amber-300' : 'text-emerald-300'}`} />
          </div>
          <div>
            <h4 className="font-poppins font-bold text-sm text-white">{impacto.titulo}</h4>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
              {isFibra ? 'Fibra de trigo · Compostable' : 'Plástico 100% Reciclado'}
            </p>
          </div>
        </div>
      </div>

      {/* Narrativa */}
      <p className="text-xs text-white/60 leading-relaxed">{impacto.narrativa}</p>

      {/* 3 KPIs */}
      <div className="space-y-2">
        {impacto.kpis.map((k, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{k.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-[11px] font-semibold text-white/70">{k.label}</p>
                <p className={`font-poppins font-extrabold text-sm tabular-nums ${isFibra ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {k.valor}
                </p>
              </div>
              <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{k.detalle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* End of Life */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-2">{impacto.eol.titulo}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {impacto.eol.items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span>{item.e}</span><span>{item.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fuentes */}
      <p className="text-[9px] text-white/30 leading-relaxed pt-2 border-t border-white/5">
        Estimación basada en LCA publicados (ACS Sustainable Chem. Eng. 2022, MDPI Sustainability 2024, CE Delft 2023) y datos operacionales PEYU. <a href="/nosotros" className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-0.5">Cómo medimos <ExternalLink className="w-2.5 h-2.5" /></a>
      </p>
    </div>
  );
}