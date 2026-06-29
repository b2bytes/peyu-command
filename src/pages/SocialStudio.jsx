// ============================================================================
// SocialStudio · Centro de Comandos único de 3 columnas
// ----------------------------------------------------------------------------
// Filosofía: un solo cockpit agentico. Columna izquierda = TODAS las funciones
// (Agente, Cola, Crear IA, Ads, Galería, Instagram, LinkedIn, Lote, Semanal,
// Backlinks). Centro = workspace donde TODO sucede (chat del agente + cada
// panel montado aquí). Derecha = contexto vivo (KPIs + estado de redes).
// ============================================================================
import { useState, useEffect } from 'react';
import {
  Bot, Megaphone, CheckSquare, Wand2, Image as ImageIcon, Instagram,
  Linkedin, Layers, Calendar, Link2, Sparkles, Send, Clock, Facebook,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BulkGeneratorPanel from '@/components/social-studio/BulkGeneratorPanel';
import ApprovalQueuePanel from '@/components/social-studio/ApprovalQueuePanel';
import WeeklyPlannerPanel from '@/components/social-studio/WeeklyPlannerPanel';
import BacklinksInsightsPanel from '@/components/social-studio/BacklinksInsightsPanel';
import MarketingAgentPanel from '@/components/social-studio/MarketingAgentPanel';
import AdsAgentPanel from '@/components/social-studio/AdsAgentPanel';
import LinkedInPanel from '@/components/social-studio/LinkedInPanel';
import InstagramPanel from '@/components/social-studio/InstagramPanel';
import CreatorPanel from '@/components/social-studio/CreatorPanel';
import MediaGalleryPanel from '@/components/social-studio/MediaGalleryPanel';
import MetaAdsPanel from '@/components/social-studio/MetaAdsPanel';

// ── Definición de TODAS las funciones del estudio ───────────────────────────
const SECTIONS = [
  { id: 'agent',     label: 'Agente IA',  desc: 'Conversa y ejecuta todo',   icon: Bot,        accent: 'from-violet-500 to-pink-600',   text: 'text-violet-300', group: 'comando' },
  { id: 'ads',       label: 'Google Ads', desc: 'Campañas + CSV',            icon: Megaphone,  accent: 'from-cyan-500 to-blue-600',     text: 'text-cyan-300',   group: 'comando' },
  { id: 'meta',      label: 'Meta Ads',   desc: 'Facebook · Instagram · IA', icon: Facebook,   accent: 'from-blue-600 to-indigo-600',   text: 'text-blue-300',   group: 'comando' },
  { id: 'queue',     label: 'Cola',       desc: 'Aprobar y publicar',        icon: CheckSquare, accent: 'from-amber-400 to-orange-500',  text: 'text-amber-300',  group: 'contenido' },
  { id: 'creator',   label: 'Crear IA',   desc: 'Imágenes y videos',         icon: Wand2,      accent: 'from-pink-500 to-violet-600',   text: 'text-pink-300',   group: 'contenido' },
  { id: 'galeria',   label: 'Galería',    desc: 'Todos los assets',          icon: ImageIcon,  accent: 'from-emerald-400 to-cyan-500',  text: 'text-emerald-300',group: 'contenido' },
  { id: 'bulk',      label: 'Lote',       desc: 'Variantes en serie',        icon: Layers,     accent: 'from-pink-500 to-violet-500',   text: 'text-pink-300',   group: 'contenido' },
  { id: 'planner',   label: 'Semanal',    desc: 'Plan editorial',            icon: Calendar,   accent: 'from-cyan-400 to-blue-500',     text: 'text-cyan-300',   group: 'contenido' },
  { id: 'instagram', label: 'Instagram',  desc: 'Estado y publicación',      icon: Instagram,  accent: 'from-pink-500 to-purple-600',   text: 'text-pink-300',   group: 'canales' },
  { id: 'linkedin',  label: 'LinkedIn',   desc: 'Estado y publicación',      icon: Linkedin,   accent: 'from-sky-500 to-blue-600',      text: 'text-sky-300',    group: 'canales' },
  { id: 'backlinks', label: 'Backlinks',  desc: 'Insights SEO',              icon: Link2,      accent: 'from-emerald-400 to-teal-500',  text: 'text-emerald-300',group: 'canales' },
];

const GROUPS = [
  { id: 'comando',   label: 'Centro de comando' },
  { id: 'contenido', label: 'Contenido' },
  { id: 'canales',   label: 'Canales' },
];

export default function SocialStudio() {
  // Por defecto abrimos el Agente — es el corazón del cockpit
  const [section, setSection] = useState('agent');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, publicados_hoy: 0, total: 0 });
  const [redes, setRedes] = useState({ ig: null, li: null });
  // Columnas laterales colapsables: maximiza el espacio del chat del agente
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // El studio es dark-first: fuerza modo noche mientras está abierto.
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-liquid-mode');
    document.documentElement.setAttribute('data-liquid-mode', 'night');
    return () => document.documentElement.setAttribute('data-liquid-mode', prev || 'day');
  }, []);

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

  // Estado de redes (best-effort, no bloquea el cockpit)
  const loadRedes = async () => {
    try {
      const [ig, li] = await Promise.all([
        base44.functions.invoke('instagramStatus', {}).then(r => r.data).catch(() => null),
        base44.functions.invoke('linkedInStatus', {}).then(r => r.data).catch(() => null),
      ]);
      setRedes({ ig, li });
    } catch { /* best-effort */ }
  };

  useEffect(() => { loadStats(); }, [refreshKey]);
  useEffect(() => { loadRedes(); }, []);

  const triggerRefresh = () => setRefreshKey(k => k + 1);
  const active = SECTIONS.find(s => s.id === section);

  // ── Render del workspace central según sección activa ─────────────────────
  const renderWorkspace = () => {
    switch (section) {
      case 'agent':     return <MarketingAgentPanel />;
      case 'ads':       return <AdsAgentPanel />;
      case 'meta':      return <MetaAdsPanel />;
      case 'queue':     return <ApprovalQueuePanel refreshKey={refreshKey} onChange={triggerRefresh} />;
      case 'creator':   return <CreatorPanel />;
      case 'galeria':   return <MediaGalleryPanel />;
      case 'bulk':      return <BulkGeneratorPanel onGenerated={triggerRefresh} />;
      case 'planner':   return <WeeklyPlannerPanel onGenerated={triggerRefresh} />;
      case 'instagram': return <InstagramPanel onPublished={triggerRefresh} />;
      case 'linkedin':  return <LinkedInPanel onPublished={triggerRefresh} />;
      case 'backlinks': return <BacklinksInsightsPanel />;
      default:          return <MarketingAgentPanel />;
    }
  };

  // Las secciones "comando" (agent/ads) ya traen su propio layout 3-col interno,
  // así que las dejamos ocupar todo el centro sin padding extra. El resto se
  // monta dentro del marco del cockpit.
  const isAgentic = section === 'agent' || section === 'ads' || section === 'meta';

  return (
    <div className="h-full flex flex-col min-h-0 relative">
      {/* Ambient glow de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex-1 flex min-h-0 p-2 lg:p-3 gap-2.5">

        {/* ── COLUMNA IZQUIERDA · todas las funciones (colapsable) ────────── */}
        {leftOpen ? (
          <aside className="hidden md:flex flex-col w-56 lg:w-60 flex-shrink-0 rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white leading-none">Social Studio</p>
                <p className="text-[10px] text-white/40 mt-0.5">Centro de comandos</p>
              </div>
              <button
                onClick={() => setLeftOpen(false)}
                title="Colapsar panel"
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto peyu-scrollbar-light p-2.5 space-y-3">
              {GROUPS.map(group => (
                <div key={group.id}>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1.5">{group.label}</p>
                  <div className="space-y-1">
                    {SECTIONS.filter(s => s.group === group.id).map(s => {
                      const Icon = s.icon;
                      const isActive = section === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSection(s.id)}
                          className={`relative w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all group ${
                            isActive ? 'bg-white/[0.07] border border-white/15' : 'border border-transparent hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            isActive ? `bg-gradient-to-br ${s.accent} shadow-md` : 'bg-white/[0.06] group-hover:bg-white/10'
                          }`}>
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{s.label}</p>
                            <p className="text-[9px] text-white/35 leading-tight truncate">{s.desc}</p>
                          </div>
                          {s.id === 'queue' && stats.pendientes > 0 && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/30 text-amber-200">
                              {stats.pendientes}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        ) : (
          // Rail colapsado: solo íconos — no se pierde ninguna función
          <aside className="hidden md:flex flex-col w-14 flex-shrink-0 rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
            <button
              onClick={() => setLeftOpen(true)}
              title="Expandir panel"
              className="flex-shrink-0 h-12 flex items-center justify-center border-b border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <nav className="flex-1 overflow-y-auto peyu-scrollbar-light p-2 space-y-1">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const isActive = section === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    title={`${s.label} · ${s.desc}`}
                    className={`relative w-full h-10 rounded-lg flex items-center justify-center transition-all ${
                      isActive ? `bg-gradient-to-br ${s.accent} shadow-md` : 'hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                    {s.id === 'queue' && stats.pendientes > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold bg-amber-500 text-white flex items-center justify-center">
                        {stats.pendientes}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* ── COLUMNA CENTRAL · workspace donde TODO sucede ────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Selector compacto en mobile (la columna izquierda se oculta) */}
          <div className="md:hidden flex-shrink-0 mb-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const isActive = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    isActive ? 'text-white' : 'text-white/50'
                  }`}
                >
                  {isActive && <span className={`absolute inset-0 rounded-lg bg-gradient-to-br ${s.accent} opacity-90`} />}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{s.label}</span>
                </button>
              );
            })}
          </div>

          {isAgentic ? (
            // Agente / Ads ya traen su propio cockpit 3-col interno
            <div className="flex-1 min-h-0">{renderWorkspace()}</div>
          ) : (
            // El resto de paneles se enmarcan en el cockpit con header de sección
            <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-black/25 border border-white/10 overflow-hidden">
              <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-gradient-to-r ${active?.accent ? 'from-white/[0.04] to-transparent' : ''}`}>
                {active && (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${active.accent} flex items-center justify-center shadow-md`}>
                    <active.icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-white leading-none">{active?.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{active?.desc}</p>
                </div>
              </div>
              <div className="flex-1 min-h-0 p-3">{renderWorkspace()}</div>
            </div>
          )}
        </main>

        {/* ── COLUMNA DERECHA · contexto vivo (KPIs + redes) — colapsable ──── */}
        {!rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            title="Mostrar contexto"
            className="hidden xl:flex absolute top-5 right-5 z-10 w-9 h-9 rounded-xl bg-black/40 border border-white/10 items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}
        <aside className={`${rightOpen ? 'hidden xl:flex' : 'hidden'} flex-col w-64 flex-shrink-0 rounded-2xl bg-black/30 border border-white/10 overflow-y-auto peyu-scrollbar-light`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-white/30 uppercase tracking-wider px-0.5">Contexto vivo</p>
              <button
                onClick={() => setRightOpen(false)}
                title="Colapsar panel"
                className="w-7 h-7 -mr-1.5 -mt-1.5 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
            {/* KPIs de contenido */}
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2 px-0.5">Estado del contenido</p>
              <div className="grid grid-cols-2 gap-2">
                <KpiCard label="Pendientes" value={stats.pendientes} accent="text-amber-300" onClick={() => setSection('queue')} />
                <KpiCard label="Aprobados" value={stats.aprobados} accent="text-emerald-300" onClick={() => setSection('queue')} />
                <KpiCard label="Hoy" value={stats.publicados_hoy} accent="text-sky-300" />
                <KpiCard label="Total" value={stats.total} accent="text-white/80" />
              </div>
            </div>

            {/* Estado de redes */}
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2 px-0.5">Redes conectadas</p>
              <div className="space-y-2">
                <RedRow
                  icon={Instagram}
                  label="Instagram"
                  data={redes.ig}
                  followers={redes.ig?.followers_count ?? redes.ig?.profile?.followers_count}
                  accent="from-pink-500 to-purple-600"
                  onClick={() => setSection('instagram')}
                />
                <RedRow
                  icon={Linkedin}
                  label="LinkedIn"
                  data={redes.li}
                  followers={redes.li?.followers ?? redes.li?.follower_count}
                  accent="from-sky-500 to-blue-600"
                  onClick={() => setSection('linkedin')}
                />
              </div>
            </div>

            {/* Atajos del agente */}
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2 px-0.5">Atajos rápidos</p>
              <div className="space-y-1.5">
                <ShortcutBtn icon={Send} label="Publicar 1 post ahora" onClick={() => setSection('agent')} />
                <ShortcutBtn icon={Calendar} label="Lanzar semana completa" onClick={() => setSection('planner')} />
                <ShortcutBtn icon={Megaphone} label="Crear campaña de Ads" onClick={() => setSection('ads')} />
                <ShortcutBtn icon={Wand2} label="Generar imagen/video" onClick={() => setSection('creator')} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-componentes de la columna derecha ───────────────────────────────────
function KpiCard({ label, value, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl bg-white/[0.04] border border-white/[0.07] p-2.5 text-left transition-all ${onClick ? 'hover:bg-white/[0.07] cursor-pointer' : 'cursor-default'}`}
    >
      <p className={`text-2xl font-black leading-none ${accent}`}>{value}</p>
      <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wide">{label}</p>
    </button>
  );
}

function RedRow({ icon: Icon, label, data, followers, accent, onClick }) {
  const connected = !!data && !data.error;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] transition-all text-left"
    >
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white/85 leading-tight">{label}</p>
        <p className="text-[10px] text-white/40 leading-tight">
          {connected ? (followers != null ? `${Number(followers).toLocaleString('es-CL')} seguidores` : 'Conectado') : 'Sin conectar'}
        </p>
      </div>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-400' : 'bg-white/20'}`} />
    </button>
  );
}

function ShortcutBtn({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 transition-all text-left group"
    >
      <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 group-hover:text-violet-300" />
      <span className="text-[11px] text-white/70 group-hover:text-white leading-tight">{label}</span>
    </button>
  );
}