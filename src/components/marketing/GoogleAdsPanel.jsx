// ============================================================================
// GoogleAdsPanel — Panel embebido en Marketing Hub para crear campañas
// Google Ads 2026/2027 (API v23.1) directo desde el hub.
// Reutiliza CampaignGeneratorForm + CampaignDraftCard de /admin/ads-command.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Target, Rocket, ExternalLink, Sparkles, Info } from 'lucide-react';
import CampaignGeneratorForm from '@/components/ads/CampaignGeneratorForm';
import CampaignDraftCard from '@/components/ads/CampaignDraftCard';

export default function GoogleAdsPanel() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.AdCampaignDraft.list('-created_date', 20);
      setDrafts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      {/* Header explicativo */}
      <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-xl p-4 border border-orange-200">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white shadow flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-base text-gray-900 flex items-center gap-2">
                Google Ads Command Center
                <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                  API v23.1 · 2026
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                Genera campañas Search, Performance Max y <strong>Demand Gen</strong> (sucesor de Discovery) con IA militar.
                Incluye brand-safety AI (term exclusions + messaging restrictions v23.1), generación de visuales y export a Google Ads Editor.
              </p>
            </div>
          </div>
          <Link to="/admin/ads-command">
            <button className="text-xs font-semibold flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-orange-200 rounded-lg px-3 py-2 text-orange-700">
              Vista completa <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {/* Aviso developer token */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p><strong>Modo CSV (sin developer token):</strong> Las campañas se generan con IA y se exportan a CSV listo para Google Ads Editor (1 click).</p>
          <p className="mt-1 opacity-80">Cuando obtengas el developer token de Google, activaremos la publicación directa vía API v23.1.</p>
        </div>
      </div>

      {/* Generador */}
      <CampaignGeneratorForm onGenerated={load} />

      {/* Drafts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-orange-600" />
          <h4 className="font-poppins font-bold text-sm text-gray-900">
            Operaciones generadas <span className="text-gray-400 font-normal">({drafts.length})</span>
          </h4>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Cargando…</p>
        ) : drafts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm space-y-2 bg-white rounded-xl border border-gray-200">
            <Sparkles className="w-8 h-8 mx-auto opacity-40" />
            <p>Ninguna campaña generada aún.</p>
            <p className="text-xs">Usa el briefing de arriba para ordenar la primera.</p>
          </div>
        ) : (
          drafts.map(d => <CampaignDraftCard key={d.id} draft={d} onUpdated={load} />)
        )}
      </div>
    </div>
  );
}