// ============================================================================
// ClauseAccordion · Lista de cláusulas del contrato con resumen + postura PEYU
// ============================================================================
import { useState } from 'react';
import { ChevronDown, Scale, Shield } from 'lucide-react';

export default function ClauseAccordion({ clausulas }) {
  const [openId, setOpenId] = useState(clausulas[0]?.id || null);

  return (
    <div className="space-y-2">
      {clausulas.map(cl => {
        const open = openId === cl.id;
        return (
          <div key={cl.id} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenId(open ? null : cl.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-400/25 flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 text-teal-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300/80 font-jakarta">Cláusula {cl.id}</span>
                </div>
                <p className="text-sm font-jakarta font-bold text-white truncate">{cl.titulo}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                <p className="text-[13px] text-white/75 leading-relaxed font-inter">{cl.resumen}</p>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1.5 font-jakarta">Puntos clave</p>
                  <ul className="space-y-1.5">
                    {cl.puntos_clave.map((p, i) => (
                      <li key={i} className="text-[12px] text-white/70 flex gap-2 leading-relaxed">
                        <span className="text-teal-400 flex-shrink-0">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg p-3 flex gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-300 mb-0.5 font-jakarta">Postura PEYU</p>
                    <p className="text-[12px] text-emerald-100/90 leading-relaxed font-inter">{cl.nuestra_postura}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}