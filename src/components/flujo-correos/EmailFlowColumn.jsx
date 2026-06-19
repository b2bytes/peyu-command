import { Mail, ArrowDown, Clock } from 'lucide-react';
import { TONOS } from '@/lib/email-sequences-data';

// Una columna = toda la secuencia de correos de un tipo de cliente (B2C o B2B).
// Las etapas se apilan verticalmente y cada correo es una tarjeta conectada por
// una flecha hacia abajo, mostrando el flujo cronológico completo.
export default function EmailFlowColumn({ flow }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Cabecera del flujo */}
      <div
        className="rounded-2xl p-4 sm:p-5 mb-5 border"
        style={{ background: flow.colorSoft, borderColor: flow.color + '40' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: flow.color }}
          >
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: flow.color }}>{flow.titulo}</h2>
            <p className="text-xs sm:text-sm text-ld-fg-muted truncate">{flow.subtitulo}</p>
          </div>
        </div>
        <p className="text-[13px] text-ld-fg-soft mt-3 leading-relaxed">{flow.descripcion}</p>
      </div>

      {/* Etapas → correos */}
      <div className="space-y-6">
        {flow.etapas.map((etapa, ei) => (
          <div key={ei}>
            {/* Encabezado de etapa */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: flow.color, color: '#fff' }}
              >
                {ei + 1}
              </span>
              <h3 className="text-sm font-bold text-ld-fg">{etapa.fase}</h3>
            </div>
            {etapa.nota && (
              <p className="text-[11px] text-ld-fg-muted italic mb-3 ml-1">{etapa.nota}</p>
            )}

            {/* Correos de la etapa */}
            <div className="space-y-2.5">
              {etapa.correos.map((c, ci) => {
                const tono = TONOS[c.tono] || TONOS.proceso;
                return (
                  <div key={ci}>
                    <div className="rounded-xl bg-ld-bg-elevated border border-ld-border p-3.5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: tono.bg }}
                        >
                          <Mail className="w-4 h-4" style={{ color: tono.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-ld-fg">{c.paso}</span>
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: tono.bg, color: tono.color }}
                            >
                              {tono.label}
                            </span>
                          </div>

                          {/* Disparador */}
                          <p className="text-[11px] text-ld-fg-muted mt-1 flex items-start gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{c.cuando}</span>
                          </p>

                          {/* Asunto del correo */}
                          <div className="mt-2 rounded-lg bg-ld-bg-soft px-2.5 py-1.5">
                            <p className="text-[10px] uppercase tracking-wide text-ld-fg-subtle font-bold mb-0.5">Asunto</p>
                            <p className="text-[12px] font-semibold text-ld-fg leading-snug">{c.asunto}</p>
                          </div>

                          {/* Detalle */}
                          <p className="text-[12px] text-ld-fg-soft mt-2 leading-relaxed">{c.detalle}</p>

                          {/* Función técnica */}
                          <p className="text-[10px] text-ld-fg-subtle mt-2 font-mono break-all">⚙ {c.funcion}</p>
                        </div>
                      </div>
                    </div>

                    {/* Flecha hacia el siguiente correo (no en el último de la etapa) */}
                    {ci < etapa.correos.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="w-4 h-4 text-ld-fg-subtle" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Conector entre etapas */}
            {ei < flow.etapas.length - 1 && (
              <div className="flex justify-center pt-4">
                <div
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{ background: flow.colorSoft, color: flow.color }}
                >
                  <ArrowDown className="w-3.5 h-3.5" /> siguiente etapa
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}