// ============================================================================
// CampaignGeneratorForm — Briefing form para el Commander
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Rocket, CheckCircle2, XCircle } from 'lucide-react';

const TYPES = ['Search', 'Performance Max', 'Shopping'];
const AUDIENCES = ['B2B Corporativo', 'B2B Pyme', 'B2C Regalos', 'B2C Sostenibilidad'];
const OBJECTIVES = ['Leads B2B', 'Sales B2C', 'Traffic', 'Brand Search Defense', 'Competitor Conquest'];

export default function CampaignGeneratorForm({ onGenerated }) {
  const [brief, setBrief] = useState('Lanzamiento PEYU 2026 — regalos corporativos sostenibles, foco Navidad + B2B Q2');
  const [type, setType] = useState('Search');
  const [audience, setAudience] = useState('B2B Corporativo');
  const [objective, setObjective] = useState('Leads B2B');
  const [budget, setBudget] = useState(50);
  const [landing, setLanding] = useState('https://peyuchile.cl/b2b/contacto');
  const [codename, setCodename] = useState('OP_LAUNCH_01');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('adsGenerateCampaign', {
        operation_brief: brief,
        campaign_type: type,
        audience,
        objective,
        daily_budget_usd: Number(budget),
        landing_url: landing,
        codename,
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
      <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
        <Rocket className="w-5 h-5 text-orange-400" />
        <h3 className="font-bold">Briefing al Commander</h3>
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
          <Label className="text-xs text-slate-300">Budget diario (USD)</Label>
          <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-8 text-sm" />
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

      <Button onClick={generate} disabled={loading || !brief || !landing} className="w-full bg-orange-500 hover:bg-orange-600 gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
        Ordenar generación de campaña
      </Button>

      {result?.error && (
        <div className="p-2.5 bg-red-950 border border-red-700 rounded text-xs text-red-300 flex items-start gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{result.error}</span>
        </div>
      )}
      {result?.success && (
        <div className="p-2.5 bg-emerald-950 border border-emerald-700 rounded text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Campaña <strong>{result.draft.campaign_name}</strong> generada. Revisa abajo el detalle y exporta a CSV.</span>
        </div>
      )}
    </div>
  );
}