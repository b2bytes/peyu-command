import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, RefreshCw, Loader2, ArrowLeft, QrCode, Inbox, KanbanSquare } from 'lucide-react';
import WhatsAppConvList from '@/components/whatsapp/WhatsAppConvList';
import WhatsAppPipeline from '@/components/whatsapp/WhatsAppPipeline';
import WhatsAppThread from '@/components/whatsapp/WhatsAppThread';
import WhatsAppQRModal from '@/components/whatsapp/WhatsAppQRModal';

// ════════════════════════════════════════════════════════════════════════
// /admin/whatsapp — Bandeja especial de conversaciones WhatsApp.
// El agente "whatsapp_peyu" (canal WhatsApp nativo de Base44) responde a los
// clientes 24/7; aquí el equipo ve cada conversación en vivo y puede
// intervenir. Conexión rápida del teléfono vía QR. Mobile-first.
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [connectError, setConnectError] = useState('');
  const [view, setView] = useState('inbox'); // 'inbox' | 'pipeline'
  const [etapas, setEtapas] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // El link de conexión puede ser sync o async según la versión del SDK, y el
  // nombre del método varía en casing. Probamos las variantes y guardamos el
  // error real si falla, para mostrarlo en el modal.
  useEffect(() => {
    (async () => {
      try {
        const fn = base44.agents?.getWhatsAppConnectURL
          || base44.agents?.getWhatsappConnectURL
          || base44.agents?.getWhatsAppConnectUrl;
        if (!fn) {
          setConnectError('El SDK no expone el método de conexión WhatsApp (getWhatsAppConnectURL).');
          return;
        }
        const result = await fn.call(base44.agents, 'whatsapp_peyu');
        if (typeof result === 'string' && result.length > 0) {
          // El SDK puede devolver un path relativo (serverUrl: '') — lo
          // resolvemos contra el dominio de la app, que proxea /api a Base44.
          setConnectUrl(new URL(result, window.location.origin).href);
        } else {
          setConnectError(`El método devolvió un valor inesperado: ${JSON.stringify(result)}`);
        }
      } catch (err) {
        setConnectError(err?.message || String(err));
      }
    })();
  }, []);

  const load = async () => {
    const convs = await base44.agents.listConversations({ agent_name: 'whatsapp_peyu' }).catch(() => []);
    setConversations(convs || []);
    const et = await base44.entities.WhatsAppConvEtapa.list('-updated_date', 300).catch(() => []);
    setEtapas(et || []);
    setLoading(false);
  };

  // Fuerza la clasificación del pipeline (además del CRON cada 10 min)
  const syncPipeline = async () => {
    setSyncing(true);
    await base44.functions.invoke('whatsappPipelineSync', {}).catch(() => null);
    await load();
    setSyncing(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // refresco liviano de la bandeja
    return () => clearInterval(t);
  }, []);

  const openConversation = async (c) => {
    const full = await base44.agents.getConversation(c.id).catch(() => c);
    setActive(full || c);
  };

  const activeNombre = active?.metadata?.name || (active ? `Cliente ${active.id?.slice(-5)}` : '');

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header — verde WhatsApp con prestancia */}
      <header
        className="flex-shrink-0 h-16 px-3 sm:px-4 flex items-center gap-2.5 shadow-md z-10"
        style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 60%, #1DA851 100%)' }}
      >
        {active && (
          <button onClick={() => setActive(null)} className="md:hidden w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white" aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <span className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#0c7a6b] animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-white leading-none truncate">
            {active ? activeNombre : 'WhatsApp PEYU'}
          </h1>
          <p className="text-[10px] text-white/75 mt-0.5 truncate">
            {active ? 'Agente Peyu activo en esta conversación' : `Agente Peyu en línea 24/7 · ${conversations.length} conversaciones`}
          </p>
        </div>
        {/* Toggle Bandeja | Pipeline */}
        <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-full bg-white/15 flex-shrink-0">
          <button
            onClick={() => setView('inbox')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'inbox' ? 'bg-white text-[#075E54] shadow-sm' : 'text-white/80 hover:text-white'}`}
          >
            <Inbox className="w-3.5 h-3.5" /> Bandeja
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'pipeline' ? 'bg-white text-[#075E54] shadow-sm' : 'text-white/80 hover:text-white'}`}
          >
            <KanbanSquare className="w-3.5 h-3.5" /> Pipeline
          </button>
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#075E54] bg-white hover:bg-white/90 transition-colors shadow-sm flex-shrink-0"
          title="Conectar tu teléfono escaneando un QR"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">Conectar con QR</span>
        </button>
        <button onClick={load} className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white/85 flex-shrink-0" aria-label="Refrescar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Toggle mobile Bandeja | Pipeline */}
      <div className="sm:hidden flex-shrink-0 flex items-center gap-1 px-3 py-2 border-b border-ld-border bg-ld-bg">
        <button
          onClick={() => setView('inbox')}
          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'inbox' ? 'bg-[#128C7E] text-white' : 'text-ld-fg-muted'}`}
        >
          <Inbox className="w-3.5 h-3.5" /> Bandeja
        </button>
        <button
          onClick={() => setView('pipeline')}
          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'pipeline' ? 'bg-[#128C7E] text-white' : 'text-ld-fg-muted'}`}
        >
          <KanbanSquare className="w-3.5 h-3.5" /> Pipeline
        </button>
      </div>

      {/* Vista Pipeline: kanban inteligente de conversaciones */}
      {view === 'pipeline' && (
        <WhatsAppPipeline
          etapas={etapas}
          syncing={syncing}
          onSync={syncPipeline}
          onOpen={(item) => {
            const conv = conversations.find((c) => c.id === item.conversation_id);
            if (conv) { openConversation(conv); setView('inbox'); }
          }}
        />
      )}

      {/* Layout: lista + hilo (en móvil se alternan) */}
      <div className={`flex-1 min-h-0 ${view === 'pipeline' ? 'hidden' : 'flex'}`}>
        <aside className={`w-full md:w-[340px] md:flex-shrink-0 md:border-r border-ld-border bg-ld-bg ${active ? 'hidden md:flex' : 'flex'} flex-col min-h-0`}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-ld-fg-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <WhatsAppConvList conversations={conversations} activeId={active?.id} onSelect={openConversation} />
          )}
        </aside>

        <main className={`flex-1 min-w-0 ${active ? 'flex' : 'hidden md:flex'} flex-col`}>
          {active ? (
            <WhatsAppThread key={active.id} conversation={active} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6" style={{ background: 'var(--ld-bg-soft)' }}>
              <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-9 h-9 text-[#25D366]" />
              </div>
              <p className="text-base font-bold text-ld-fg">Bandeja WhatsApp PEYU</p>
              <p className="text-xs text-ld-fg-muted mt-1.5 max-w-xs leading-relaxed">
                El agente Peyu 🐢 responde automáticamente a tus clientes. Selecciona una conversación para verla en vivo o intervenir.
              </p>
              <button
                onClick={() => setShowQR(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-md hover:brightness-105 transition-all"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <QrCode className="w-4 h-4" /> Conectar mi teléfono
              </button>
            </div>
          )}
        </main>
      </div>

      {showQR && <WhatsAppQRModal url={connectUrl} errorDetail={connectError} onClose={() => setShowQR(false)} />}
    </div>
  );
}