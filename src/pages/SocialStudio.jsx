// ============================================================================
// SocialStudio · 2027 trend UI
// ----------------------------------------------------------------------------
// Filosofía: el contenido visual es el rey. Layout edge-to-edge,
// stat bar viva arriba, segmented control glassmorphic, imágenes grandes.
// ============================================================================
import { useState, useEffect } from 'react';
import { Sparkles, Layers, CheckSquare, Calendar, Link2, Image as ImageIcon, Send, Clock, Bot, Linkedin, Instagram, Wand2, Megaphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BulkGeneratorPanel from '@/components/social-studio/BulkGeneratorPanel';
import ApprovalQueuePanel from '@/components/social-studio/ApprovalQueuePanel';
import WeeklyPlannerPanel from '@/components/social-studio/WeeklyPlannerPanel';
import BacklinksInsightsPanel from '@/components/social-studio/BacklinksInsightsPanel';
import SocialStudioHero from '@/components/social-studio/SocialStudioHero';
import LinkedInConnectBanner from '@/components/social-studio/LinkedInConnectBanner';
import MarketingAgentPanel from '@/components/social-studio/MarketingAgentPanel';
import AdsAgentPanel from '@/components/social-studio/AdsAgentPanel';
import LinkedInPanel from '@/components/social-studio/LinkedInPanel';
import InstagramPanel from '@/components/social-studio/InstagramPanel';
import CreatorPanel from '@/components/social-studio/CreatorPanel';
import MediaGalleryPanel from '@/components/social-studio/MediaGalleryPanel';
import StudioModeToggle from '@/components/social-studio/StudioModeToggle';

const TABS = [
  { id: 'queue',     label: 'Cola',        icon: CheckSquare, accent: 'from-amber-400 to-orange-500' },
  { id: 'creator',   label: 'Crear IA',    icon: Wand2,       accent: 'from-pink-500 to-violet-600' },
  { id: 'agent',     label: 'Agente',      icon: Bot,         accent: 'from-violet-500 to-pink-500' },
  { id: 'ads',       label: 'Ads',         icon: Megaphone,   accent: 'from-cyan-500 to-blue-600' },
  { id: 'galeria',   label: 'Galería',     icon: ImageIcon,   accent: 'from-emerald-400 to-cyan-500' },
  { id: 'instagram', label: 'Instagram',   icon: Instagram,   accent: 'from-pink-500 to-purple-600' },
  { id: 'linkedin',  label: 'LinkedIn',    icon: Linkedin,    accent: 'from-sky-500 to-blue-600' },
  { id: 'bulk',      label: 'Lote',        icon: Layers,      accent: 'from-pink-500 to-violet-500' },
  { id: 'planner',   label: 'Semanal',     icon: Calendar,    accent: 'from-cyan-400 to-blue-500' },
  { id: 'backlinks', label: 'Backlinks',   icon: Link2,       accent: 'from-emerald-400 to-teal-500' },
];

export default function SocialStudio() {
  // Por defecto abrimos cola — es el inbox de decisión, lo más usado día a día
  const [tab, setTab] = useState('queue');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, publicados_hoy: 0, total: 0 });
  const [allPosts, setAllPosts] = useState([]);
  // Modo visual del estudio: 'dark' (sobrio) | 'social' (vibrante)
  const [mode, setMode] = useState(() => localStorage.getItem('peyu_socialstudio_mode') || 'dark');
  useEffect(() => { localStorage.setItem('peyu_socialstudio_mode', mode); }, [mode]);

  // El studio es dark-first: fuerza modo noche mientras está abierto y
  // restaura el modo previo del admin al salir.
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-liquid-mode');
    document.documentElement.setAttribute('data-liquid-mode', 'night');
    return () => document.documentElement.setAttribute('data-liquid-mode', prev || 'day');
  }, []);

  const loadStats = async () => {
    const posts = await base44.entities.ContentPost.list('-created_date', 200);
    setAllPosts(posts);
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
      {/* Ambient glow de fondo · dark (sobrio) vs social (vibrante) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-700">
        {mode === 'social' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/50 via-transparent to-indigo-950/50" />
            <div className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-fuchsia-500/25 rounded-full blur-[120px]" />
            <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-violet-500/25 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-pink-500/15 rounded-full blur-[90px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
            <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
          </>
        )}
      </div>

      <div className="relative flex-1 flex flex-col min-h-0 p-2 lg:p-3 gap-2">
        {/* Hero · KPI strip compacto */}
        <SocialStudioHero stats={stats} onPendientesClick={() => setTab('queue')} />

        {/* Segmented control glassmorphic compacto + toggle de modo */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2">
          <div className="inline-flex p-0.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl gap-0.5 max-w-full overflow-x-auto scrollbar-hide">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {active && (
                    <span className={`absolute inset-0 rounded-lg bg-gradient-to-br ${t.accent} opacity-90 shadow-md`} />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{t.label}</span>
                  {t.id === 'queue' && stats.pendientes > 0 && (
                    <span className={`relative z-10 px-1.5 rounded-full text-[9px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-amber-500/30 text-amber-200'
                    }`}>
                      {stats.pendientes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <StudioModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Workspace · ocupa todo el alto restante */}
        <div className="flex-1 min-h-0 rounded-2xl flex flex-col overflow-hidden">
          {tab === 'queue'     && <ApprovalQueuePanel refreshKey={refreshKey} onChange={triggerRefresh} />}
          {tab === 'creator'   && <CreatorPanel />}
          {tab === 'agent'     && <MarketingAgentPanel posts={allPosts} />}
          {tab === 'ads'       && <AdsAgentPanel />}
          {tab === 'galeria'   && <MediaGalleryPanel />}
          {tab === 'instagram' && <InstagramPanel onPublished={triggerRefresh} />}
          {tab === 'linkedin'  && <LinkedInPanel onPublished={triggerRefresh} />}
          {tab === 'bulk'      && <BulkGeneratorPanel onGenerated={triggerRefresh} />}
          {tab === 'planner'   && <WeeklyPlannerPanel onGenerated={triggerRefresh} />}
          {tab === 'backlinks' && <BacklinksInsightsPanel />}
        </div>
      </div>
    </div>
  );
}