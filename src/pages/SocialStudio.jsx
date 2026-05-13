// ============================================================================
// SocialStudio · 2027 trend UI
// ----------------------------------------------------------------------------
// Filosofía: el contenido visual es el rey. Layout edge-to-edge,
// stat bar viva arriba, segmented control glassmorphic, imágenes grandes.
// ============================================================================
import { useState, useEffect } from 'react';
import { Sparkles, Layers, CheckSquare, Calendar, Link2, Image as ImageIcon, Send, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BulkGeneratorPanel from '@/components/social-studio/BulkGeneratorPanel';
import ApprovalQueuePanel from '@/components/social-studio/ApprovalQueuePanel';
import WeeklyPlannerPanel from '@/components/social-studio/WeeklyPlannerPanel';
import BacklinksInsightsPanel from '@/components/social-studio/BacklinksInsightsPanel';
import SocialStudioHero from '@/components/social-studio/SocialStudioHero';

const TABS = [
  { id: 'queue',     label: 'Cola de aprobación', icon: CheckSquare, accent: 'from-amber-400 to-orange-500' },
  { id: 'bulk',      label: 'Generar lote',       icon: Layers,      accent: 'from-pink-500 to-violet-500' },
  { id: 'planner',   label: 'Plan semanal',       icon: Calendar,    accent: 'from-cyan-400 to-blue-500' },
  { id: 'backlinks', label: 'Backlinks',          icon: Link2,       accent: 'from-emerald-400 to-teal-500' },
];

export default function SocialStudio() {
  // Por defecto abrimos cola — es el inbox de decisión, lo más usado día a día
  const [tab, setTab] = useState('queue');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, publicados_hoy: 0, total: 0 });

  const loadStats = async () => {
    const posts = await base44.entities.ContentPost.list('-created_date', 200);
    const hoy = new Date().toISOString().slice(0, 10);
    setStats({
      pendientes: posts.filter(p => p.estado === 'En revisión').length,
      aprobados:  posts.filter(p => p.estado === 'Aprobado').length,
      publicados_hoy: posts.filter(p => p.estado === 'Publicado' && (p.link_publicado || p.fecha_publicacion?.startsWith(hoy))).length,
      total: posts.length,
    });
  };

  useEffect(() => { loadStats(); }, [refreshKey]);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="h-full flex flex-col min-h-0 relative">
      {/* Ambient glow de fondo · 2027 trend */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">
        {/* Hero · KPIs vivos */}
        <SocialStudioHero stats={stats} onPendientesClick={() => setTab('queue')} />

        {/* Segmented control glassmorphic */}
        <div className="flex-shrink-0">
          <div className="inline-flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl gap-1 max-w-full overflow-x-auto scrollbar-hide">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    active ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {active && (
                    <span className={`absolute inset-0 rounded-xl bg-gradient-to-br ${t.accent} opacity-90 shadow-lg`} />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{t.label}</span>
                  {t.id === 'queue' && stats.pendientes > 0 && (
                    <span className={`relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-amber-500/30 text-amber-200'
                    }`}>
                      {stats.pendientes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace · ocupa todo el alto restante */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-2xl">
          {tab === 'queue'     && <ApprovalQueuePanel refreshKey={refreshKey} onChange={triggerRefresh} />}
          {tab === 'bulk'      && <BulkGeneratorPanel onGenerated={triggerRefresh} />}
          {tab === 'planner'   && <WeeklyPlannerPanel onGenerated={triggerRefresh} />}
          {tab === 'backlinks' && <BacklinksInsightsPanel />}
        </div>
      </div>
    </div>
  );
}