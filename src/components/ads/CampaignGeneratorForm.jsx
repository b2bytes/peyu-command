// ============================================================================
// CampaignGeneratorForm — Briefing form para el Commander
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Rocket, CheckCircle2, XCircle, Sparkles, Zap } from 'lucide-react';

// v23.1 (2026) — agregamos Demand Gen (sucesor de Discovery) que es el formato
// más relevante para B2C visual hoy. Search/PMax/Shopping siguen igual.
const TYPES = ['Search', 'Performance Max', 'Demand Gen', 'Shopping'];
const AUDIENCES = ['B2B Corporativo', 'B2B Pyme', 'B2C Regalos', 'B2C Sostenibilidad', 'Remarketing', 'Lookalike', 'Custom Intent'];
const OBJECTIVES = ['Leads B2B', 'Sales B2C', 'Traffic', 'Awareness', 'Brand Search Defense', 'Competitor Conquest', 'Catalog Sales'];

// Tipos que soportan asset groups + generación de visuales con IA
const SUPPORTS_VISUALS = ['Performance Max', 'Demand Gen'];

export default function CampaignGeneratorForm({ onGenerated }) {
  const [brief, setBrief] = useState('Lanzamiento PEYU 2026 — regalos corporativos sostenibles, foco Navidad + B2B Q2');
  const [type, setType] = useState('Performance Max');
  const [audience, setAudience] = useState('B2B Corporativo');
  const [objective, setObjective] = useState('Leads B2B');
  const [budgetClp, setBudgetClp] = useState(25000);
  const [landing, setLanding] = useState('https://peyuchile.cl/b2b/contacto');
  const [codename, setCodename] = useState('OP_LAUNCH_01');
  const [generateVisuals, setGenerateVisuals] = useState(true);
  const [numVisuals, setNumVisuals] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const supportsVisuals = SUPPORTS_VISUALS.includes(type);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('adsGenerateCampaign2026', {
        operation_brief: brief,
        campaign_type: type,
        audience,
        objective,
        daily_budget_clp: Number(budgetClp),
        landing_url: landing,
        codename,
        generate_visuals: supportsVisuals && generateVisuals,
        num_visuals: Number(numVisuals),
      });
      setResult(res.data);
      if (res.data?.success && onGenerated) onGenerated(res.data.draft);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 text-white">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-orange-400" />
          <h3 className="font-bold">Briefing al Commander</h3>
        </div>
        <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
          Google Ads API v23.1 · 2026
        </span>
      </div>

      <div>
        <Label className="text-xs text-slate-300">Operation brief</Label>
        <Textarea value={brief} onChange={e => setBrief(e.target.value)} rows={2} className="bg-slate-950 border-slate-700 text-white text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-slate-300">Codename</Label>
          <Input value={codename} onChange={e => setCodename(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-slate-300">Budget diario (CLP)</Label>
          <Input type="number" value={budgetClp} onChange={e => setBudgetClp(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-8 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-slate-300">Tipo</Label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full h-8 rounded bg-slate-950 border border-slate-700 text-white text-sm px-2">
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-slate-300">Audiencia</Label>
          <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full h-8 rounded bg-slate-950 border border-slate-700 text-white text-sm px-2">
            {AUDIENCES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-slate-300">Objetivo</Label>
          <select value={objective} onChange={e => setObjective(e.target.value)} className="w-full h-8 rounded bg-slate-950 border border-slate-700 text-white text-sm px-2">
            {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-300">Landing URL</Label>
        <Input value={landing} onChange={e => setLanding(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-8 text-sm" />
      </div>

      {/* Visuales IA — solo PMax / Demand Gen */}
      {supportsVisuals && (
        <div className="p-2.5 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateVisuals}
                onChange={e => setGenerateVisuals(e.target.checked)}
                className="rounded accent-pink-500"
              />
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Generar visuales con IA
              </span>
            </label>
            {generateVisuals && (
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-slate-400">N°:</Label>
                <Input
                  type="number" min={1} max={5}
                  value={numVisuals}
                  onChange={e => setNumVisuals(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white h-6 text-xs w-12 px-1.5"
                />
              </div>
            )}
          </div>
          <p className="text-[10px] text-purple-200/70 leading-snug">
            La IA generará prompts visuales detallados y, si activas el toggle, las imágenes reales (1:1, 1.91:1, 4:5) listas para asset groups.
          </p>
        </div>
      )}

      <Button onClick={generate} disabled={loading || !brief || !landing} className="w-full bg-orange-500 hover:bg-orange-600 gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
        {loading ? 'Generando campaña + visuales…' : 'Ordenar generación de campaña 2026'}
      </Button>

      {result?.error && (
        <div className="p-2.5 bg-red-950 border border-red-700 rounded text-xs text-red-300 flex items-start gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{result.error}</span>
        </div>
      )}
      {result?.success && (
        <div className="p-2.5 bg-emerald-950 border border-emerald-700 rounded text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Campaña <strong>{result.draft.campaign_name}</strong> generada.
            {result.visuals_generated > 0 && (
              <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-pink-500/20 text-pink-300 rounded">
                <Zap className="w-2.5 h-2.5" />
                {result.visuals_generated} visuales IA
              </span>
            )}
            {' '}Revisa abajo y exporta a CSV.
          </span>
        </div>
      )}
    </div>
  );
}