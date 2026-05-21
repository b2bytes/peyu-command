// ============================================================================
// KeywordSerpAnalysisModal · Muestra el análisis SERP real para una keyword.
// Llama a `analyzeKeywordSerp` (Gemini con búsqueda web en vivo en Google.cl)
// y presenta competidores, gap, título sugerido, meta, outline y quick wins.
// Diseño dark sólido (#0F172A / slate-900) para consistencia con la página.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, X, ExternalLink, Trophy, AlertTriangle, Sparkles,
  Type, FileText, ListChecks, Zap, Target, Globe,
} from 'lucide-react';

const DIFFICULTY_TONE = {
  low:    { label: 'Baja',  bg: 'bg-emerald-500/20', text: 'text-emerald-200', border: 'border-emerald-400/40' },
  medium: { label: 'Media', bg: 'bg-amber-500/20',   text: 'text-amber-200',   border: 'border-amber-400/40' },
  high:   { label: 'Alta',  bg: 'bg-rose-500/20',    text: 'text-rose-200',    border: 'border-rose-400/40' },
};

export default function KeywordSerpAnalysisModal({ keyword, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('analyzeKeywordSerp', { keyword });
        if (cancelled) return;
        if (res?.data?.ok) setData(res.data.analysis);
        else setError(res?.data?.error || 'Error desconocido');
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Error de red');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [keyword]);

  const diff = data?.difficulty ? DIFFICULTY_TONE[data.difficulty] : null;

  return (
    <div
      data-liquid-mode="night"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[92vh] md:h-auto md:max-h-[92vh] overflow-y-auto rounded-t-2xl md:rounded-2xl border-t md:border"
        style={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F1F5F9', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile bottom sheet feel) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 md:px-5 py-3.5 border-b flex items-start justify-between gap-3"
          style={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta">
                Análisis SERP · Google.cl
              </p>
              <h2 className="font-jakarta font-extrabold text-slate-50 text-base md:text-lg leading-tight break-words">
                {keyword}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-50 hover:bg-slate-800 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 md:px-5 py-4 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
              <p className="text-sm font-inter">Gemini buscando en Google.cl en vivo…</p>
              <p className="text-[11px] text-slate-500">Esto puede tomar 15-30 segundos</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-4 text-rose-200 text-sm">
              ⚠️ {error}
            </div>
          )}

          {data && (
            <>
              {/* Resumen rápido: dificultad + tipo + intención */}
              <div className="grid grid-cols-3 gap-2">
                {diff && (
                  <ChipBlock label="Dificultad" tone={diff} icon={Target}>
                    {diff.label}
                  </ChipBlock>
                )}
                {data.content_type && (
                  <ChipBlock label="SERP" tone={{ bg: 'bg-cyan-500/20', text: 'text-cyan-200', border: 'border-cyan-400/40' }} icon={FileText}>
                    {data.content_type}
                  </ChipBlock>
                )}
                {data.intent && (
                  <ChipBlock label="Intención" tone={{ bg: 'bg-teal-500/20', text: 'text-teal-200', border: 'border-teal-400/40' }} icon={Sparkles}>
                    {data.intent}
                  </ChipBlock>
                )}
              </div>

              {data.difficulty_reason && (
                <p className="text-[12px] text-slate-400 font-inter -mt-2 pl-1">
                  {data.difficulty_reason}
                </p>
              )}

              {/* Gap + ángulo */}
              {(data.gap || data.angle) && (
                <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-3.5">
                  {data.gap && (
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-violet-300 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-violet-300 font-jakarta mb-0.5">Gap detectado</p>
                        <p className="text-[13px] text-slate-100 font-inter leading-relaxed">{data.gap}</p>
                      </div>
                    </div>
                  )}
                  {data.angle && (
                    <div className="flex items-start gap-2 pt-2 border-t border-violet-500/20">
                      <Zap className="w-4 h-4 text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-fuchsia-300 font-jakarta mb-0.5">Ángulo recomendado para PEYU</p>
                        <p className="text-[13px] text-slate-100 font-inter leading-relaxed">{data.angle}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Competidores TOP */}
              {data.competitors?.length > 0 && (
                <Section icon={Trophy} title="Quién rankea en TOP 10">
                  <div className="space-y-2">
                    {data.competitors.map((c, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold text-teal-300 truncate">{c.domain}</span>
                          <a
                            href={`https://${c.domain.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-teal-300 flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {c.title && (
                          <p className="text-[12px] font-semibold text-slate-50 font-inter leading-snug mb-0.5">{c.title}</p>
                        )}
                        {c.snippet && (
                          <p className="text-[11px] text-slate-400 font-inter leading-snug">{c.snippet}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Sugerencias on-page */}
              {data.suggested_title && (
                <Section icon={Type} title="Meta title sugerido">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <p className="text-[13px] text-slate-50 font-inter leading-snug break-words">{data.suggested_title}</p>
                    <p className="text-[10px] text-slate-500 mt-1.5 font-mono">{data.suggested_title.length} chars</p>
                  </div>
                </Section>
              )}

              {data.suggested_meta && (
                <Section icon={FileText} title="Meta description sugerida">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <p className="text-[13px] text-slate-50 font-inter leading-snug break-words">{data.suggested_meta}</p>
                    <p className="text-[10px] text-slate-500 mt-1.5 font-mono">{data.suggested_meta.length} chars</p>
                  </div>
                </Section>
              )}

              {data.suggested_h1 && (
                <Section icon={Type} title="H1 sugerido">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <p className="text-[13px] text-slate-50 font-inter font-semibold leading-snug break-words">{data.suggested_h1}</p>
                  </div>
                </Section>
              )}

              {data.content_outline?.length > 0 && (
                <Section icon={ListChecks} title="Outline de contenido para superar la SERP">
                  <ul className="space-y-1.5">
                    {data.content_outline.map((it, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-slate-200 font-inter">
                        <span className="text-violet-400 font-bold flex-shrink-0">{i + 1}.</span>
                        <span className="leading-snug">{it}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {data.quick_wins?.length > 0 && (
                <Section icon={Zap} title="Quick wins (acciones hoy)" highlight>
                  <ul className="space-y-1.5">
                    {data.quick_wins.map((it, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-100 font-inter">
                        <span className="text-emerald-400 flex-shrink-0">▸</span>
                        <span className="leading-snug">{it}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, highlight }) {
  return (
    <div className={`rounded-xl p-3.5 border ${highlight ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-emerald-300' : 'text-violet-300'}`} />
        <h3 className={`text-[10px] uppercase tracking-wider font-bold font-jakarta ${highlight ? 'text-emerald-300' : 'text-slate-400'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ChipBlock({ label, tone, icon: Icon, children }) {
  return (
    <div className={`${tone.bg} ${tone.border} border rounded-xl p-2.5`}>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`w-3 h-3 ${tone.text}`} />
        <p className="text-[9px] uppercase tracking-wider font-bold font-jakarta text-slate-400">{label}</p>
      </div>
      <p className={`text-[12px] font-bold font-jakarta ${tone.text} leading-tight`}>{children}</p>
    </div>
  );
}