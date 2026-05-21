// ============================================================================
// QuickSerpAnalyzer · Bloque destacado al inicio de /admin/seo-keywords.
// Permite analizar cualquier keyword en Google.cl con un click. Incluye
// las 10 keywords prioritarias de PEYU como atajos rápidos.
// ============================================================================
import { useState } from 'react';
import { Globe, Sparkles, Search as SearchIcon } from 'lucide-react';
import KeywordSerpAnalysisModal from '@/components/seo-keywords/KeywordSerpAnalysisModal';

const QUICK_KEYWORDS = [
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

export default function QuickSerpAnalyzer() {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(null);

  const handleAnalyze = (kw) => {
    const v = (kw || input).trim();
    if (!v) return;
    setAnalyzing(v);
    setInput('');
  };

  return (
    <div className="bg-gradient-to-br from-violet-950/60 via-slate-900 to-fuchsia-950/40 border border-violet-500/30 rounded-2xl overflow-hidden">
      <div className="px-4 md:px-5 py-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-jakarta font-extrabold text-slate-50 text-base md:text-lg tracking-tight">
                Analizar SERP en Google.cl
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40 font-jakarta">
                <Sparkles className="w-2.5 h-2.5" />
                IA en vivo
              </span>
            </div>
            <p className="text-[12px] md:text-[13px] text-slate-400 font-inter mt-0.5 leading-relaxed">
              Gemini busca la keyword en Google Chile, lee los TOP 10 y devuelve competidores, gap, título sugerido y plan de ataque.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="relative mb-3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAnalyze(); } }}
            placeholder="Escribe cualquier keyword y presiona Enter…"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-28 py-2.5 text-[14px] text-slate-50 placeholder:text-slate-500 font-inter focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={!input.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-bold font-jakarta inline-flex items-center gap-1 shadow-lg shadow-violet-500/30"
          >
            <Sparkles className="w-3 h-3" />
            Analizar
          </button>
        </div>

        {/* Atajos rápidos · 10 keywords prioritarias */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta mb-1.5">
            Keywords prioritarias de PEYU · click para analizar
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_KEYWORDS.map(kw => (
              <button
                key={kw}
                onClick={() => handleAnalyze(kw)}
                className="text-[12px] px-3 h-8 rounded-lg bg-slate-900 hover:bg-violet-500/20 active:bg-violet-500/30 hover:text-violet-200 text-slate-300 border border-slate-700 hover:border-violet-400/40 transition-all font-inter inline-flex items-center gap-1.5"
              >
                <Globe className="w-3 h-3 opacity-70" />
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {analyzing && (
        <KeywordSerpAnalysisModal
          keyword={analyzing}
          onClose={() => setAnalyzing(null)}
        />
      )}
    </div>
  );
}