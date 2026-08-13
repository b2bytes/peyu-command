import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const PRIO = { Alta: 'var(--ld-highlight)', Media: 'var(--ld-action)', Baja: 'var(--ld-fg-muted)' };

// Análisis logístico BlueExpress dentro de la conversación: OTIF, atrasos,
// comunas problemáticas y sugerencias accionables del agente de logística.
export default function LogisticsAnalysisCard({ dias = 30 }) {
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);

  const analizar = async () => {
    setCargando(true); setError(null); setRes(null);
    try {
      const r = await base44.functions.invoke('bluexAnalyzeShipments', { dias });
      const d = r?.data || {};
      if (!d.ok) setError(d.error || 'No se pudo analizar la operación.');
      else setRes(d);
    } catch (e) {
      setError(e?.message || 'Falló el análisis logístico.');
    }
    setCargando(false);
  };

  const s = res?.stats;
  const ia = res?.analisis_ia;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg-elevated)' }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'var(--ld-border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ld-action-soft)' }}>
          <Activity className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--ld-fg)' }}>Salud del despacho</p>
          <p className="text-[11px] leading-tight" style={{ color: 'var(--ld-fg-muted)' }}>Últimos {dias} días · BlueExpress</p>
        </div>
        <button onClick={analizar} disabled={cargando}
          className="h-9 px-3 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0"
          style={{ background: 'var(--ld-action)' }}>
          {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {res ? 'Recalcular' : 'Analizar'}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="flex items-start gap-2 rounded-xl p-3 text-xs font-semibold"
            style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {!res && !error && !cargando && (
          <p className="text-xs" style={{ color: 'var(--ld-fg-muted)' }}>
            Revisa entregas a tiempo, atrasos, excepciones y qué comunas te están costando caro.
          </p>
        )}

        {s && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: 'Envíos', v: s.total },
                { l: 'A tiempo', v: `${Math.round(s.otif_pct)}%`, t: s.otif_pct >= 85 ? 'var(--ld-action)' : 'var(--ld-highlight)' },
                { l: 'Atrasados', v: s.atrasados, t: s.atrasados ? 'var(--ld-highlight)' : undefined },
                { l: 'Días prom.', v: s.lead_time_prom ? s.lead_time_prom.toFixed(1) : '—' },
              ].map((m) => (
                <div key={m.l} className="rounded-xl px-2 py-2 text-center" style={{ background: 'var(--ld-bg-soft)' }}>
                  <p className="text-[13px] font-bold tabular-nums" style={{ color: m.t || 'var(--ld-fg)' }}>{m.v}</p>
                  <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ld-fg-muted)' }}>{m.l}</p>
                </div>
              ))}
            </div>

            {ia?.resumen_ejecutivo && (
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--ld-fg-soft)' }}>{ia.resumen_ejecutivo}</p>
            )}

            {!!res.comunas_top_problemas?.length && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ld-fg-muted)' }}>Comunas con más problemas</p>
                {res.comunas_top_problemas.slice(0, 4).map((c) => (
                  <div key={c.comuna} className="flex items-center justify-between text-[11.5px]">
                    <span className="truncate" style={{ color: 'var(--ld-fg)' }}>{c.comuna}</span>
                    <span className="font-bold tabular-nums flex-shrink-0" style={{ color: c.problema_pct > 20 ? 'var(--ld-highlight)' : 'var(--ld-fg-muted)' }}>
                      {Math.round(c.problema_pct)}% · {c.total} envíos
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!!ia?.sugerencias?.length && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ld-fg-muted)' }}>Qué hacer</p>
                {ia.sugerencias.slice(0, 4).map((sg, i) => (
                  <div key={i} className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--ld-border)' }}>
                    <p className="text-[11.5px] font-bold" style={{ color: PRIO[sg.prioridad] || 'var(--ld-fg)' }}>{sg.titulo}</p>
                    <p className="text-[10.5px] leading-snug" style={{ color: 'var(--ld-fg-muted)' }}>{sg.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}