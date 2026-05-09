// ============================================================================
// BacklinksInsightsPanel — Vista analítica de backlinks ganados.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ExternalLink, TrendingUp, Award, Loader2 } from 'lucide-react';

export default function BacklinksInsightsPanel() {
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Backlink.list('-created_date', 100).then(b => {
      setBacklinks(b);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: backlinks.length,
    altaAutoridad: backlinks.filter(b => (b.domain_authority || 0) >= 50).length,
    promedio_DA: backlinks.length > 0
      ? Math.round(backlinks.reduce((s, b) => s + (b.domain_authority || 0), 0) / backlinks.length)
      : 0,
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-white/50">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Cargando backlinks…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KPI label="Backlinks totales" value={stats.total} icon={ExternalLink} color="text-sky-300" />
        <KPI label="Alta autoridad (DA ≥ 50)" value={stats.altaAutoridad} icon={Award} color="text-amber-300" />
        <KPI label="DA promedio" value={stats.promedio_DA} icon={TrendingUp} color="text-emerald-300" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
        <h3 className="font-poppins font-semibold text-white text-sm mb-3 px-2">Top backlinks</h3>
        {backlinks.length === 0 ? (
          <p className="text-center py-8 text-white/40 text-sm">Aún no hay backlinks registrados</p>
        ) : (
          <div className="space-y-1.5">
            {backlinks.slice(0, 30).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all">
                <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-400 to-pink-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{b.source_domain || b.source_url}</p>
                  {b.anchor_text && <p className="text-xs text-white/50 truncate">"{b.anchor_text}"</p>}
                </div>
                {typeof b.domain_authority === 'number' && (
                  <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                    b.domain_authority >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/60'
                  }`}>
                    DA {b.domain_authority}
                  </span>
                )}
                {b.source_url && (
                  <a href={b.source_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-white/50">{label}</span>
      </div>
      <p className={`text-2xl font-poppins font-bold ${color}`}>{value}</p>
    </div>
  );
}