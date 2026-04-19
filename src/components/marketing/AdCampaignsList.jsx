import { DollarSign, Target, TrendingUp } from 'lucide-react';

const PLATAFORMA_COLORS = {
  'Meta Ads (IG+FB)': 'from-blue-500 to-purple-500',
  'Google Ads': 'from-blue-500 to-green-500',
  'Google Shopping': 'from-green-500 to-yellow-500',
  'LinkedIn Ads': 'from-blue-600 to-blue-800',
  'TikTok Ads': 'from-pink-500 to-gray-900',
  'YouTube Ads': 'from-red-500 to-red-700',
};

const ESTADO_COLORS = {
  'Borrador': 'bg-gray-100 text-gray-700',
  'Planificada': 'bg-blue-100 text-blue-700',
  'En revisión': 'bg-yellow-100 text-yellow-700',
  'Activa': 'bg-green-100 text-green-700',
  'Pausada': 'bg-orange-100 text-orange-700',
  'Finalizada': 'bg-gray-100 text-gray-500',
  'Rechazada': 'bg-red-100 text-red-700',
};

export default function AdCampaignsList({ campanas }) {
  if (campanas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">Aún no hay campañas pagadas.</p>
        <p className="text-xs mt-1">Pide al Ads Strategist que diseñe tu primera campaña.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campanas.map((c) => (
        <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r ${PLATAFORMA_COLORS[c.plataforma] || 'from-gray-500 to-gray-700'} text-white`}>
                  {c.plataforma}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[c.estado] || 'bg-gray-100'}`}>
                  {c.estado}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 truncate">{c.nombre}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{c.tipo_campana} · {c.objetivo}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                <DollarSign className="w-3 h-3" /> Budget
              </div>
              <div className="font-bold text-xs text-gray-900">
                ${((c.presupuesto_total_clp || 0) / 1000).toFixed(0)}K
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                <Target className="w-3 h-3" /> Conv.
              </div>
              <div className="font-bold text-xs text-gray-900">{c.conversiones || 0}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                <TrendingUp className="w-3 h-3" /> ROAS
              </div>
              <div className="font-bold text-xs text-gray-900">{c.roas ? `${c.roas.toFixed(1)}x` : '—'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}