// ============================================================================
// AdsCommand — Google Ads Command Center (grado militar + científico)
// ----------------------------------------------------------------------------
// Genera campañas con ads_commander, las exporta a CSV Google Ads Editor,
// analiza performance con ads_scientist.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crosshair, Rocket } from 'lucide-react';
import CampaignGeneratorForm from '@/components/ads/CampaignGeneratorForm';
import CampaignDraftCard from '@/components/ads/CampaignDraftCard';

export default function AdsCommand() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = async () => {
    try {
      const data = await base44.entities.AdCampaignDraft.list('-created_date', 30);
      setDrafts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrafts(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-orange-600 flex items-center justify-center text-white shadow-lg">
          <Crosshair className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ads Command Center</h1>
          <p className="text-sm text-slate-500">Commander táctico · Scientist analítico · Export a Google Ads Editor</p>
        </div>
      </div>

      {/* Operations briefing */}
      <CampaignGeneratorForm onGenerated={loadDrafts} />

      {/* Drafts existentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="w-4 h-4 text-orange-600" />
            Operaciones generadas ({drafts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando operaciones…</p>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ninguna campaña generada aún. Usa el briefing de arriba para ordenar la primera operación.
            </p>
          ) : (
            drafts.map(d => (
              <CampaignDraftCard key={d.id} draft={d} onUpdated={loadDrafts} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}