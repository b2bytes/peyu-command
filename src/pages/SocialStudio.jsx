// ============================================================================
// SocialStudio — Suite de marketing social automatizado para PEYU.
// Combina: generación masiva, cola de aprobación, planner semanal y backlinks.
// ============================================================================
import { useState } from 'react';
import { Sparkles, Layers, CheckSquare, Calendar, Link2 } from 'lucide-react';
import BulkGeneratorPanel from '@/components/social-studio/BulkGeneratorPanel';
import ApprovalQueuePanel from '@/components/social-studio/ApprovalQueuePanel';
import WeeklyPlannerPanel from '@/components/social-studio/WeeklyPlannerPanel';
import BacklinksInsightsPanel from '@/components/social-studio/BacklinksInsightsPanel';

const TABS = [
  { id: 'bulk', label: 'Generador masivo', icon: Layers, desc: 'Producto + red + variantes' },
  { id: 'queue', label: 'Cola de aprobación', icon: CheckSquare, desc: 'Revisar y publicar' },
  { id: 'planner', label: 'Planner semanal', icon: Calendar, desc: 'Plan editorial 7 días' },
  { id: 'backlinks', label: 'Backlinks', icon: Link2, desc: 'Insights de PR' },
];

export default function SocialStudio() {
  const [tab, setTab] = useState('bulk');
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-pink-400" />
          Social Studio
        </h1>
        <p className="text-white/60 text-xs lg:text-sm mt-1">
          Suite completa: genera, aprueba y publica contenido para Instagram, LinkedIn, Facebook y TikTok desde un solo lugar.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap flex-shrink-0 border-b border-white/10 -mb-px">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
                active
                  ? 'border-pink-400 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-pink-400' : ''}`} />
              <div className="text-left">
                <p className="text-sm font-medium leading-tight">{t.label}</p>
                <p className="text-[10px] text-white/40 leading-tight">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'bulk' && <BulkGeneratorPanel onGenerated={triggerRefresh} />}
        {tab === 'queue' && <ApprovalQueuePanel refreshKey={refreshKey} />}
        {tab === 'planner' && <WeeklyPlannerPanel onGenerated={triggerRefresh} />}
        {tab === 'backlinks' && <BacklinksInsightsPanel />}
      </div>
    </div>
  );
}