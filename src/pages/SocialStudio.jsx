// ============================================================================
// SocialStudio · Tablero completo de programación de contenido social PEYU
// ----------------------------------------------------------------------------
// Tabs:
//   1. Generador masivo  · selecciona N productos × redes × variantes
//   2. Cola de aprobación · revisa, edita, aprueba y publica
//   3. Calendario semanal · 1 tema → 7 posts diarios automáticos
//   4. Backlinks insights · vista de la PR que alimenta el copy IA
// ============================================================================
import { useState } from 'react';
import { Sparkles, Inbox, Calendar, Globe, Layers } from 'lucide-react';
import BulkGeneratorPanel from '@/components/social-studio/BulkGeneratorPanel';
import ApprovalQueuePanel from '@/components/social-studio/ApprovalQueuePanel';
import WeeklyPlannerPanel from '@/components/social-studio/WeeklyPlannerPanel';
import BacklinksInsightsPanel from '@/components/social-studio/BacklinksInsightsPanel';

const TABS = [
  { id: 'bulk',     label: 'Generador masivo',  icon: Layers,    color: 'from-violet-500 to-pink-500' },
  { id: 'queue',    label: 'Cola de aprobación', icon: Inbox,    color: 'from-amber-500 to-rose-500' },
  { id: 'weekly',   label: 'Calendario semanal', icon: Calendar, color: 'from-cyan-500 to-violet-500' },
  { id: 'insights', label: 'Backlinks insights', icon: Globe,    color: 'from-emerald-500 to-teal-500' },
];

export default function SocialStudio() {
  const [tab, setTab] = useState('bulk');
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshQueue = () => setRefreshKey(k => k + 1);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-pink-400 flex-shrink-0" />
            <span className="truncate">Social Studio</span>
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">
            Generación masiva con IA · Aprobación humana · Calendario semanal · Publicación a redes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex flex-wrap gap-1 flex-shrink-0">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-none justify-center ${
                active
                  ? `bg-gradient-to-r ${t.color} text-white shadow-lg`
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel activo */}
      <div className="flex-1 min-h-0">
        {tab === 'bulk' && <BulkGeneratorPanel onGenerated={refreshQueue} />}
        {tab === 'queue' && <ApprovalQueuePanel refreshKey={refreshKey} />}
        {tab === 'weekly' && <WeeklyPlannerPanel onGenerated={refreshQueue} />}
        {tab === 'insights' && <BacklinksInsightsPanel />}
      </div>
    </div>
  );
}