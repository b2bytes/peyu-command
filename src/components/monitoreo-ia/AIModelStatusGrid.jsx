// ============================================================================
// AIModelStatusGrid · Estado de los modelos en uso
// ----------------------------------------------------------------------------
// Muestra cada modelo IA con su tasa de uso, costo y health (latencia).
// ============================================================================
import { Activity, Sparkles } from 'lucide-react';

const MODEL_LABELS = {
  'gpt-4o-mini':      { label: 'GPT-4o mini',     vendor: 'OpenAI',   color: '#10a37f' },
  'gpt_5_mini':       { label: 'GPT-5 mini',      vendor: 'OpenAI',   color: '#10a37f' },
  'gpt_5_4':          { label: 'GPT-5.4',         vendor: 'OpenAI',   color: '#10a37f' },
  'claude_sonnet_4_6':{ label: 'Claude Sonnet 4.6', vendor: 'Anthropic', color: '#cc785c' },
  'claude_opus_4_6':  { label: 'Claude Opus 4.6', vendor: 'Anthropic', color: '#cc785c' },
  'gemini_3_flash':   { label: 'Gemini 3 Flash',  vendor: 'Google',   color: '#4285f4' },
  'gemini_3_1_pro':   { label: 'Gemini 3.1 Pro',  vendor: 'Google',   color: '#4285f4' },
  unknown:            { label: 'Sin clasificar',  vendor: 'N/A',      color: '#94a3b8' },
};

export default function AIModelStatusGrid({ stats }) {
  const byModel = stats?.by_model || {};
  const entries = Object.entries(byModel).sort((a, b) => b[1].count - a[1].count);

  if (entries.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm font-inter">Aún no hay llamadas registradas en esta ventana.</p>
      </div>
    );
  }

  const totalCalls = entries.reduce((s, [, v]) => s + v.count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {entries.map(([modelKey, data]) => {
        const meta = MODEL_LABELS[modelKey] || MODEL_LABELS.unknown;
        const pct = totalCalls > 0 ? (data.count / totalCalls) * 100 : 0;

        return (
          <div
            key={modelKey}
            className="group bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}80` }}
                  />
                  <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">{meta.label}</h3>
                </div>
                <p className="text-[11px] text-white/40 font-inter">{meta.vendor}</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                <Activity className="w-2.5 h-2.5" /> Activo
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Calls</p>
                <p className="font-jakarta font-bold text-white text-base">{data.count}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Tokens</p>
                <p className="font-jakarta font-bold text-white text-base">
                  {data.tokens >= 1000 ? `${(data.tokens / 1000).toFixed(1)}K` : data.tokens}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Costo</p>
                <p className="font-jakarta font-bold text-white text-base">${(data.cost || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Barra de uso */}
            <div className="mt-3">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1 text-right font-inter">{pct.toFixed(1)}% del tráfico</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}