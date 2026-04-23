import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Radar } from 'lucide-react';

const OBJECTIVES = ['Leads B2B', 'Sales B2C', 'Awareness', 'Brand Search Defense', 'Competitor Conquest'];
const TYPES = ['Search', 'Shopping', 'Performance Max'];
const AUDIENCES = ['B2B Corporativo', 'B2B Pyme', 'B2C Regalos', 'B2C Sostenibilidad'];

export default function CampaignGenerator({ onGenerated }) {
  const [form, setForm] = useState({
    codename: `OP_LAUNCH_${Date.now().toString(36).toUpperCase()}`,
    objective: 'Leads B2B',
    campaign_type: 'Search',
    audience: 'B2B Corporativo',
    daily_budget_usd: 30,
    target_domain: 'peyuchile.cl',
    landing_url: 'https://peyuchile.cl/b2b/contacto',
    context: 'Lanzamiento 24 abril 2026, blitz 7 días, all-in. Ventajas: único en Chile con plástico 100% reciclado + láser UV + MOQ 10u + garantía 10 años.',
  });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adsGenerateCampaign', form);
      onGenerated?.(res?.data?.draft);
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const Select = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Radar className="w-4 h-4 text-red-600" />
        <h3 className="font-semibold text-sm text-slate-900">Ads Commander — generador táctico</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Codename</Label>
          <Input value={form.codename} onChange={(e) => update('codename', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Tipo campaña</Label>
          <Select value={form.campaign_type} onChange={(v) => update('campaign_type', v)} options={TYPES} />
        </div>
        <div>
          <Label className="text-xs">Objetivo</Label>
          <Select value={form.objective} onChange={(v) => update('objective', v)} options={OBJECTIVES} />
        </div>
        <div>
          <Label className="text-xs">Audiencia</Label>
          <Select value={form.audience} onChange={(v) => update('audience', v)} options={AUDIENCES} />
        </div>
        <div>
          <Label className="text-xs">Presupuesto diario (USD)</Label>
          <Input type="number" value={form.daily_budget_usd} onChange={(e) => update('daily_budget_usd', Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Dominio target</Label>
          <Input value={form.target_domain} onChange={(e) => update('target_domain', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Landing URL</Label>
          <Input value={form.landing_url} onChange={(e) => update('landing_url', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Contexto estratégico extra</Label>
          <Textarea value={form.context} onChange={(e) => update('context', e.target.value)} rows={2} />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Generando campaña táctica... (20-40s)' : 'Desplegar Ads Commander 🎯'}
      </Button>
    </div>
  );
}