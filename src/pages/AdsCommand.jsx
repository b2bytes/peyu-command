// ============================================================================
// /admin/ads-command — Google Ads Command Center
// ============================================================================
// Genera campañas con el Ads Commander, exporta CSV para Google Ads Editor,
// y analiza performance real con el Ads Scientist.
// ----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Radar, FlaskConical, DollarSign } from 'lucide-react';
import CampaignGenerator from '@/components/ads/CampaignGenerator';
import CampaignDraftCard from '@/components/ads/CampaignDraftCard';

export default function AdsCommand() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AdCampaignDraft.list('-created_date', 50);
      setDrafts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Stats agregadas
  const totalBudget = drafts.reduce((a, d) => a + (d.daily_budget_usd || 0), 0);
  const activeCount = drafts.filter(d => ['Activa', 'Subida a Ads', 'Ganadora'].includes(d.status)).length;
  const winnerCount = drafts.filter(d => d.status === 'Ganadora').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Target className="w-7 h-7 text-red-600" />
          Ads Command Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Agentes Commander (táctico) + Scientist (análisis) · Export directo a Google Ads Editor
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-700 uppercase">
            <Radar className="w-3 h-3" /> Drafts
          </div>
          <p className="text-2xl font-black text-red-900 mt-1">{drafts.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase">
            <Target className="w-3 h-3" /> Activas
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-1">{activeCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase">
            <FlaskConical className="w-3 h-3" /> Ganadoras
          </div>
          <p className="text-2xl font-black text-amber-900 mt-1">{winnerCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase">
            <DollarSign className="w-3 h-3" /> Budget total/día
          </div>
          <p className="text-2xl font-black text-blue-900 mt-1">${totalBudget} USD</p>
        </div>
      </div>

      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desplegar nueva campaña</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignGenerator onGenerated={(d) => d && load()} />
        </CardContent>
      </Card>

      {/* Drafts list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campañas ({drafts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              <Radar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No hay campañas aún. Despliega la primera arriba.
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map(d => (
                <CampaignDraftCard
                  key={d.id}
                  draft={d}
                  onExported={load}
                  onAnalyzed={load}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}