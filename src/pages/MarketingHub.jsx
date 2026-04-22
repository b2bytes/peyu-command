import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, MessageSquare, CalendarDays, Target, Zap, Plug, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import MarketingHubChat from '@/components/marketing/MarketingHubChat';
import MarketingHubStats from '@/components/marketing/MarketingHubStats';
import ContentPostsList from '@/components/marketing/ContentPostsList';
import AdCampaignsList from '@/components/marketing/AdCampaignsList';
import ChannelConnections from '@/components/marketing/ChannelConnections';
import ContentGeneratorPanel from '@/components/marketing/ContentGeneratorPanel';
import AISuggestionsPanel from '@/components/marketing/AISuggestionsPanel';
import ContentCalendarView from '@/components/marketing/ContentCalendarView';

export default function MarketingHub() {
  const [posts, setPosts] = useState([]);
  const [calendarios, setCalendarios] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnections, setShowConnections] = useState(false);
  const [connections] = useState({}); // se llenará en Fase 2 con OAuth
  const chatRef = useRef(null);

  const askDirector = (prompt) => {
    chatRef.current?.sendPrompt(prompt);
    // Auto-scroll al chat
    document.getElementById('director-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success('Enviado al Director IA', { description: prompt.slice(0, 80) + '...' });
  };

  const loadAll = async () => {
    const [p, cal, camp, ass] = await Promise.all([
      base44.entities.ContentPost.list('-created_date', 100),
      base44.entities.ContentCalendar.list('-created_date', 50),
      base44.entities.AdCampaign.list('-created_date', 50),
      base44.entities.ContentAsset.list('-created_date', 100),
    ]);
    setPosts(p); setCalendarios(cal); setCampanas(camp); setAssets(ass);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const unsubP = base44.entities.ContentPost.subscribe(() => loadAll());
    const unsubC = base44.entities.AdCampaign.subscribe(() => loadAll());
    const unsubCal = base44.entities.ContentCalendar.subscribe(() => loadAll());
    return () => { unsubP(); unsubC(); unsubCal(); };
  }, []);

  const handleAuthorize = (channel) => {
    // Redirigimos al usuario a pedirlo por chat — el builder (yo) dispararé el request_oauth_authorization real
    toast.info(`Autorizar ${channel.name}`, {
      description: `Pídeme en el chat: "Conecta ${channel.name}" y lanzaré el flujo OAuth oficial. Tus tokens quedan encriptados en Base44.`,
      duration: 7000,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-poppins font-bold text-2xl text-gray-900">Marketing Hub</h1>
            <span className="text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">IA</span>
          </div>
          <p className="text-sm text-gray-500 ml-11">Director IA + 4 agentes especialistas orquestados</p>
        </div>
        <button
          onClick={() => setShowConnections(v => !v)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow transition-colors">
          <Plug className="w-4 h-4" />
          {showConnections ? 'Ocultar conexiones' : 'Conectar canales reales'}
        </button>
      </div>

      {/* Conexiones de canales (toggle) */}
      {showConnections && (
        <ChannelConnections connections={connections} onAuthorize={handleAuthorize} />
      )}

      {/* Stats */}
      <MarketingHubStats posts={posts} calendarios={calendarios} campanas={campanas} assets={assets} />

      {/* Sugerencias proactivas del Director IA */}
      {!loading && <AISuggestionsPanel posts={posts} campanas={campanas} onAskDirector={askDirector} />}

      {/* Generador Agéntico de Contenido */}
      <ContentGeneratorPanel onGenerated={loadAll} />

      {/* Vista calendario mensual — full width */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-purple-600" />
          <h3 className="font-poppins font-bold text-sm text-gray-900">Calendario editorial</h3>
          <span className="text-[10px] text-gray-500">Click en un post para editar · Click en + para generar</span>
        </div>
        {loading
          ? <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
          : <ContentCalendarView posts={posts} onUpdated={loadAll} onAskDirector={askDirector} />
        }
      </div>

      {/* Main grid: Chat + Panel lateral — altura fija para evitar que la página entera se mueva */}
      <div id="director-chat" className="grid grid-cols-1 lg:grid-cols-5 gap-6 scroll-mt-4">
        {/* Chat orquestador */}
        <div className="lg:col-span-3 h-[640px]">
          <MarketingHubChat ref={chatRef} />
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-2 h-[640px]">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <Tabs defaultValue="posts" className="flex flex-col h-full">
              <TabsList className="grid grid-cols-3 m-3 mb-0 flex-shrink-0">
                <TabsTrigger value="posts" className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" /> Posts
                </TabsTrigger>
                <TabsTrigger value="ads" className="text-xs">
                  <Target className="w-3 h-3 mr-1" /> Ads
                </TabsTrigger>
                <TabsTrigger value="calendars" className="text-xs">
                  <LayoutGrid className="w-3 h-3 mr-1" /> Plan
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <TabsContent value="posts" className="mt-0">
                  {loading ? <p className="text-sm text-gray-400 text-center py-8">Cargando...</p> : <ContentPostsList posts={posts} onUpdated={loadAll} />}
                </TabsContent>
                <TabsContent value="ads" className="mt-0">
                  {loading ? <p className="text-sm text-gray-400 text-center py-8">Cargando...</p> : <AdCampaignsList campanas={campanas} />}
                </TabsContent>
                <TabsContent value="calendars" className="mt-0">
                  {loading ? <p className="text-sm text-gray-400 text-center py-8">Cargando...</p> : (
                    calendarios.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm space-y-3">
                        <CalendarDays className="w-8 h-8 mx-auto opacity-40" />
                        <p>Aún no hay planes editoriales guardados.</p>
                        <button
                          onClick={() => askDirector('Arma un calendario editorial mensual para PEYU con 4 posts por semana rotando pilares. Guárdalo como ContentCalendar.')}
                          className="text-[11px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg"
                        >
                          ✨ Pedir al Director IA
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {calendarios.map(c => (
                          <div key={c.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <div className="font-semibold text-sm text-gray-900">{c.nombre}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {c.periodo} · {c.fecha_inicio} → {c.fecha_fin}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {c.num_posts_publicados || 0} / {c.num_posts_planificados || 0} publicados
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Info Fase 2 */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <h3 className="font-poppins font-bold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Roadmap del Marketing Hub
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-green-400 font-bold mb-1">✓ FASE 1 — Hoy</div>
            <div className="text-gray-300">Entidades + 5 agentes IA + Dashboard orquestador</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-yellow-400 font-bold mb-1">◉ FASE 2 — Disponible</div>
            <div className="text-gray-300">OAuth nativo: LinkedIn · TikTok · GA4 · Gmail · Drive. Custom: Meta · Google Ads · YouTube · Pinterest</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-gray-400 font-bold mb-1">○ FASE 3 — Esta semana</div>
            <div className="text-gray-300">Publicación automática · Reportes ROAS · A/B testing</div>
          </div>
        </div>
      </div>
    </div>
  );
}