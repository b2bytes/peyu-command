// ============================================================================
// KeywordExplorer · Explora nuevas oportunidades de keywords combinando
// semillas del usuario + variantes generadas por IA + verificación GSC.
// Diseño dark sólido (no transparente) consistente con la página padre.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Lightbulb, Loader2, Plus, X, Trophy, AlertCircle, Sparkles,
  TrendingUp, ExternalLink, Target, Search as SearchIcon, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import KeywordSerpAnalysisModal from '@/components/seo-keywords/KeywordSerpAnalysisModal';

const SEED_SUGGESTIONS = [
  'regalos sustentables',
  'regalos corporativos reciclados',
  'regalos ecológicos chile',
  'merchandising sustentable',
  'productos reciclados oficina',
  'organizador escritorio sustentable',
  'fibra de trigo compostable',
  'carcasas iphone recicladas',
  'macetero reciclado',
  'bandeja plástico reciclado',
];

const STATUS_META = {
  top3:        { label: 'TOP 3',           tone: 'emerald', icon: Trophy },
  top10:       { label: 'Página 1',        tone: 'teal',    icon: TrendingUp },
  page2:       { label: 'Página 2',        tone: 'amber',   icon: Target },
  deep:        { label: '21+',             tone: 'cyan',    icon: Target },
  opportunity: { label: 'No rankeamos',    tone: 'rose',    icon: AlertCircle },
  error:       { label: 'Error',           tone: 'slate',   icon: AlertCircle },
};

const TONE_CLASSES = {
  emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  teal:    'bg-teal-500/20 text-teal-200 border-teal-400/40',
  amber:   'bg-amber-500/20 text-amber-200 border-amber-400/40',
  cyan:    'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  rose:    'bg-rose-500/20 text-rose-200 border-rose-400/40',
  slate:   'bg-slate-700/40 text-slate-300 border-slate-600/40',
};

export default function KeywordExplorer() {
  const [seeds, setSeeds] = useState([]);
  const [input, setInput] = useState('');
  const [variantsPerSeed, setVariantsPerSeed] = useState(8);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('all');
  const [analyzingKeyword, setAnalyzingKeyword] = useState(null);

  const addSeed = (s) => {
    const v = (s || input).trim().toLowerCase();
    if (!v) return;
    if (seeds.includes(v)) return;
    if (seeds.length >= 20) {
      toast.error('Máximo 20 semillas');
      return;
    }
    setSeeds([...seeds, v]);
    setInput('');
  };

  const removeSeed = (s) => setSeeds(seeds.filter(x => x !== s));

  const handleRun = async () => {
    if (seeds.length === 0) {
      toast.error('Agrega al menos una semilla');
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke('exploreKeywordOpportunities', {
        seeds,
        variants_per_seed: variantsPerSeed,
        days: 90,
      });
      if (res?.data?.ok) {
        setResult(res.data);
        toast.success(`✅ ${res.data.summary.total} keywords analizadas`);
      } else {
        toast.error(res?.data?.error || 'Error desconocido');
      }
    } catch (e) {
      toast.error(e?.message || 'Error de red');
    }
    setBusy(false);
  };

  const filteredKeywords = result?.keywords?.filter(k => {
    if (filter === 'all') return true;
    if (filter === 'ranking') return ['top3', 'top10', 'page2'].includes(k.status);
    return k.status === filter;
  }) || [];

  const buildSearchUrl = q => `https://www.google.cl/search?q=${encodeURIComponent(q)}&gl=cl&hl=es`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-4 border-b border-slate-800 bg-gradient-to-br from-violet-950/40 to-slate-900">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-slate-50" />
          </div>
          <div className="min-w-0">
            <h2 className="font-jakarta font-extrabold text-slate-50 text-base md:text-lg tracking-tight">
              Explorador de oportunidades
            </h2>
            <p className="text-[12px] md:text-[13px] text-slate-400 font-inter mt-0.5 leading-relaxed">
              Da semillas (ej: "regalos sustentables"), la IA arma variantes chilenas
              y verifica en Google Chile si ya rankeás de los primeros.
            </p>
          </div>
        </div>
      </div>

      {/* Input semillas */}
      <div className="px-4 md:px-5 py-4 space-y-3 border-b border-slate-800">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSeed(); } }}
            placeholder="Agregar semilla (Enter para confirmar)…"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-24 py-2.5 text-[14px] text-slate-50 placeholder:text-slate-500 font-inter focus:outline-none focus:border-violet-500/50"
          />
          <Button
            size="sm"
            onClick={() => addSeed()}
            disabled={!input.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 bg-violet-500 hover:bg-violet-600 text-white text-[12px] font-bold"
          >
            <Plus className="w-3 h-3" /> Agregar
          </Button>
        </div>

        {/* Sugerencias rápidas */}
        {seeds.length === 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta mb-1.5">
              Sugerencias rápidas (click para agregar)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SEED_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => addSeed(s)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-800 hover:bg-violet-500/20 hover:text-violet-200 text-slate-300 border border-slate-700 hover:border-violet-400/40 transition-all font-inter"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chips de semillas activas */}
        {seeds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {seeds.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/15 text-violet-200 border border-violet-400/30 text-[12px] font-inter"
              >
                {s}
                <button onClick={() => removeSeed(s)} className="hover:text-rose-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Ejecutar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 font-inter">
            <span>Variantes por semilla:</span>
            <select
              value={variantsPerSeed}
              onChange={e => setVariantsPerSeed(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-50 text-[12px] font-bold focus:outline-none focus:border-violet-500/50"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
            <span className="text-slate-500">
              ≈ {seeds.length} × {variantsPerSeed} = {seeds.length * (variantsPerSeed + 1)} kws
            </span>
          </div>
          <Button
            onClick={handleRun}
            disabled={busy || seeds.length === 0}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold font-jakarta gap-1.5 shadow-lg shadow-violet-500/30"
          >
            {busy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Explorando…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Explorar oportunidades
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {result && (
        <div className="px-4 md:px-5 py-4 space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <SummaryCard label="TOP 3" value={result.summary.top3} tone="emerald" filter="top3" current={filter} onClick={setFilter} />
            <SummaryCard label="Página 1" value={result.summary.top10} tone="teal" filter="top10" current={filter} onClick={setFilter} />
            <SummaryCard label="Página 2" value={result.summary.page2} tone="amber" filter="page2" current={filter} onClick={setFilter} />
            <SummaryCard label="21+" value={result.summary.deep} tone="cyan" filter="deep" current={filter} onClick={setFilter} />
            <SummaryCard label="Oportunidades" value={result.summary.opportunity} tone="rose" filter="opportunity" current={filter} onClick={setFilter} highlight />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {[
              { k: 'all', l: `Todas (${result.summary.total})` },
              { k: 'ranking', l: `Donde ya rankeamos (${result.summary.top3 + result.summary.top10 + result.summary.page2})` },
              { k: 'opportunity', l: `🎯 Oportunidades (${result.summary.opportunity})` },
            ].map(f => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`px-2.5 py-1.5 rounded-md text-[12px] font-bold font-jakarta whitespace-nowrap transition-all ${
                  filter === f.k
                    ? 'bg-violet-500/20 text-violet-200 border border-violet-400/40'
                    : 'text-slate-300 hover:text-slate-50 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>

          {/* Lista de keywords */}
          <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            {filteredKeywords.map((k, i) => {
              const meta = STATUS_META[k.status] || STATUS_META.error;
              const Icon = meta.icon;
              return (
                <div key={k.keyword + i} className="p-3 hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        meta.tone === 'emerald' ? 'text-emerald-300' :
                        meta.tone === 'teal' ? 'text-teal-300' :
                        meta.tone === 'amber' ? 'text-amber-300' :
                        meta.tone === 'cyan' ? 'text-cyan-300' :
                        meta.tone === 'rose' ? 'text-rose-300' :
                        'text-slate-400'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-slate-50 font-medium font-inter text-[14px] leading-snug break-words">
                          {k.keyword}
                        </p>
                        {k.parent_seed && k.parent_seed !== k.keyword && (
                          <p className="text-[10px] text-slate-500 font-inter mt-0.5">
                            ← variante de "{k.parent_seed}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-jakarta whitespace-nowrap flex-shrink-0 ${TONE_CLASSES[meta.tone]}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono pl-6">
                    <div className="flex items-center gap-3 text-slate-300">
                      {k.position !== null && k.position !== undefined ? (
                        <span>
                          <span className="text-slate-500">pos </span>
                          <span className="text-slate-50 font-bold">{k.position.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="text-rose-300 font-bold">No aparecemos</span>
                      )}
                      {(k.impressions > 0) && (
                        <span>
                          <span className="text-slate-500">imp </span>
                          <span className="text-slate-50 font-bold">{k.impressions}</span>
                        </span>
                      )}
                      {(k.clicks > 0) && (
                        <span>
                          <span className="text-slate-500">clk </span>
                          <span className="text-slate-50 font-bold">{k.clicks}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setAnalyzingKeyword(k.keyword)}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-violet-500/15 hover:bg-violet-500/30 text-violet-200 border border-violet-400/30 transition-colors text-[11px] font-bold font-jakarta"
                        title="Analizar SERP de Google.cl en vivo con IA"
                      >
                        <Globe className="w-3 h-3" />
                        Analizar SERP
                      </button>
                      <a
                        href={buildSearchUrl(k.keyword)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-800 hover:bg-violet-500/20 hover:text-violet-300 text-slate-300 transition-colors"
                        title="Abrir en Google.cl"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredKeywords.length === 0 && (
              <div className="p-10 text-center text-slate-500 text-sm">
                Sin keywords en este filtro.
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 font-inter text-center pt-1">
            Ventana: últimos {result.window_days} días · País: Chile · Fuente: Google Search Console
          </p>
        </div>
      )}

      {analyzingKeyword && (
        <KeywordSerpAnalysisModal
          keyword={analyzingKeyword}
          onClose={() => setAnalyzingKeyword(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone, filter, current, onClick, highlight }) {
  const TONE = {
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60 text-emerald-100',
    teal:    'border-teal-500/30 hover:border-teal-500/60 text-teal-100',
    amber:   'border-amber-500/30 hover:border-amber-500/60 text-amber-100',
    cyan:    'border-cyan-500/30 hover:border-cyan-500/60 text-cyan-100',
    rose:    'border-rose-500/30 hover:border-rose-500/60 text-rose-100',
  };
  const active = current === filter;
  return (
    <button
      onClick={() => onClick(active ? 'all' : filter)}
      className={`text-left bg-slate-950 border ${TONE[tone]} rounded-xl p-3 transition-all ${active ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-violet-500' : ''} ${highlight ? 'col-span-2 sm:col-span-1' : ''}`}
    >
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 font-jakarta">{label}</p>
      <p className="font-jakarta font-extrabold text-2xl tracking-tight leading-none">{value}</p>
    </button>
  );
}