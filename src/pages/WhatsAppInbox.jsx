import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  MessageCircle, RefreshCw, Loader2, ArrowLeft, QrCode,
  Inbox, KanbanSquare, Sparkles, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import WhatsAppConvList from '@/components/whatsapp/WhatsAppConvList';
import WhatsAppPipeline from '@/components/whatsapp/WhatsAppPipeline';
import WhatsAppThread from '@/components/whatsapp/WhatsAppThread';
import WhatsAppQRModal from '@/components/whatsapp/WhatsAppQRModal';
import WhatsAppContextPanel from '@/components/whatsapp/WhatsAppContextPanel';

// ════════════════════════════════════════════════════════════════════════
// /admin/whatsapp — WhatsApp Studio: bandeja de entrada conversacional
// estilo Social Studio (dark cockpit · 3 columnas · todo pasa en la
// conversación). El agente "whatsapp_peyu" responde 24/7; aquí el equipo ve
// cada conversación en vivo y puede intervenir. Enlazado a Social Studio.
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
  const [rightOpen, setRightOpen] = useState(true);

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
          setConnectUrl(new URL(result, window.location.origin).href);
        } else {
          setConnectError(`El método devolvió un valor inesperado: ${JSON.stringify(result)}`);
        }
      } catch (err) {
        setConnectError(err?.message || String(err));
      }
    })();
  }, []);

  // El studio es dark-first: fuerza modo noche mientras está abierto (igual
  // que Social Studio). Al desmontar, restaura el modo anterior.
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-liquid-mode');
    document.documentElement.setAttribute('data-liquid-mode', 'night');
    return () => document.documentElement.setAttribute('data-liquid-mode', prev || 'day');
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

  // Cuando el thread hace takeover/resume, actualiza la conversación activa
  // y refresca la lista para que el indicador se propague.
  const onConversationUpdate = (updated) => {
    setActive(updated);
    setConversations((prev) => prev.map((c) => c.id === updated.id ? { ...c, metadata: { ...c.metadata, ...updated.metadata } } : c));
  };

  const activeNombre = active?.metadata?.name || (active ? `Cliente ${active.id?.slice(-5)}` : '');
  const activeEtapa = etapas.find((e) => e.conversation_id === active?.id) || null;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* ── Ambient glow de fondo (estilo Social Studio) ─────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(37,211,102,.07)' }} />
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(18,140,126,.06)' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(139,92,246,.04)' }} />
      </div>

      {/* ── Header — dark glass bar con identidad WhatsApp ───────────────── */}
      <header
        className="relative flex-shrink-0 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 z-10"
        style={{ background: 'rgba(7,94,84,.10)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderBottom: '1px solid rgba(255,255,255,.08)' }}
      >
        {active && view !== 'pipeline' && (
          <button onClick={() => setActive(null)} className="md:hidden w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors" aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 60%, #25D366 100%)' }}>
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/40 animate-pulse" style={{ background: '#25D366' }} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-white leading-none truncate">
            {active && view !== 'pipeline' ? activeNombre : 'WhatsApp Studio'}
          </h1>
          <p className="text-[10px] text-white/50 mt-0.5 truncate">
            {active && view !== 'pipeline'
              ? (active?.metadata?.human_takeover ? '👤 Tú tienes el control' : '🐢 Agente Peyu activo')
              : `En línea 24/7 · ${conversations.length} chats`}
          </p>
        </div>

        {/* Toggle Bandeja | Pipeline — desktop */}
        <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.06] flex-shrink-0">
          <button
            onClick={() => setView('inbox')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'inbox' ? 'bg-white text-[#075E54] shadow-sm' : 'text-white/60 hover:text-white'}`}
          >
            <Inbox className="w-3.5 h-3.5" /> Bandeja
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'pipeline' ? 'bg-white text-[#075E54] shadow-sm' : 'text-white/60 hover:text-white'}`}
          >
            <KanbanSquare className="w-3.5 h-3.5" /> Pipeline
          </button>
        </div>

        {/* Enlace a Social Studio */}
        <Link
          to="/admin/social-studio"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white transition-all hover:brightness-110 flex-shrink-0 active:scale-95"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.22), rgba(236,72,153,.16))', border: '1px solid rgba(139,92,246,.28)' }}
          title="Ir a Social Studio — Centro de comandos"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden md:inline">Social Studio</span>
        </Link>

        {/* Conectar QR */}
        <button
          onClick={() => setShowQR(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white transition-all hover:brightness-105 flex-shrink-0 active:scale-95 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
          title="Conectar tu WhatsApp escaneando un QR"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">Conectar</span>
        </button>

        {/* Refrescar */}
        <button
          onClick={load}
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white flex-shrink-0 transition-colors active:scale-95"
          aria-label="Refrescar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Toggle mobile Bandeja | Pipeline */}
      <div className="sm:hidden flex-shrink-0 flex items-center gap-1 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <button
          onClick={() => setView('inbox')}
          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'inbox' ? 'bg-white/15 text-white' : 'text-white/40'}`}
        >
          <Inbox className="w-3.5 h-3.5" /> Bandeja
        </button>
        <button
          onClick={() => setView('pipeline')}
          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === 'pipeline' ? 'bg-white/15 text-white' : 'text-white/40'}`}
        >
          <KanbanSquare className="w-3.5 h-3.5" /> Pipeline
        </button>
      </div>

      {/* ── Vista Pipeline: kanban inteligente (full width) ──────────────── */}
      {view === 'pipeline' && (
        <div className="relative flex-1 min-h-0 p-2">
          <div className="h-full rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,.22)', border: '1px solid rgba(255,255,255,.08)' }}>
            <WhatsAppPipeline
              etapas={etapas}
              syncing={syncing}
              onSync={syncPipeline}
              onOpen={(item) => {
                const conv = conversations.find((c) => c.id === item.conversation_id);
                if (conv) { openConversation(conv); setView('inbox'); }
              }}
            />
          </div>
        </div>
      )}

      {/* ── Vista Bandeja: 3 columnas (lista + hilo + contexto) ──────────── */}
      {view !== 'pipeline' && (
        <div className="relative flex-1 flex min-h-0 p-2 gap-2">

          {/* Columna izquierda · Bandeja de conversaciones (glass, colapsable implícito en mobile) */}
          <aside className={`w-full md:w-[340px] md:flex-shrink-0 rounded-2xl overflow-hidden flex-col min-h-0 ${active ? 'hidden md:flex' : 'flex'}`}
            style={{ background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.08)' }}>
            {/* Brand header de la columna */}
            <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <Inbox className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white leading-none">Bandeja</p>
                <p className="text-[10px] text-white/40 mt-0.5">{conversations.length} conversaciones</p>
              </div>
            </div>
            {/* Lista de conversaciones */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-white/40 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
              </div>
            ) : (
              <WhatsAppConvList conversations={conversations} activeId={active?.id} onSelect={openConversation} />
            )}
          </aside>

          {/* Columna central · El hilo de conversación (la estrella) */}
          <main className={`flex-1 min-w-0 flex flex-col min-h-0 rounded-2xl overflow-hidden ${active ? 'flex' : 'hidden md:flex'}`}
            style={{ background: 'rgba(0,0,0,.22)', border: '1px solid rgba(255,255,255,.08)' }}>
            {active ? (
              <WhatsAppThread key={active.id} conversation={active} onConversationUpdate={onConversationUpdate} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(37,211,102,.10)' }}>
                  <MessageCircle className="w-9 h-9 text-[#25D366]" />
                </div>
                <p className="text-base font-bold text-white">Bandeja WhatsApp PEYU</p>
                <p className="text-xs text-white/50 mt-1.5 max-w-xs leading-relaxed">
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

          {/* Columna derecha · Contexto vivo (colapsable, XL+) */}
          {rightOpen ? (
            <aside className="hidden xl:flex flex-col w-64 flex-shrink-0 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="flex-shrink-0 flex items-center justify-end px-3 pt-3">
                <button
                  onClick={() => setRightOpen(false)}
                  title="Colapsar contexto"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto peyu-scrollbar-light">
                <WhatsAppContextPanel active={active} etapa={activeEtapa} onOpenPipeline={() => setView('pipeline')} />
              </div>
            </aside>
          ) : (
            <button
              onClick={() => setRightOpen(true)}
              title="Mostrar contexto"
              className="hidden xl:flex absolute top-3 right-3 z-10 w-9 h-9 rounded-xl items-center justify-center text-white/50 hover:text-white transition-all"
              style={{ background: 'rgba(0,0,0,.40)', border: '1px solid rgba(255,255,255,.10)' }}
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {showQR && <WhatsAppQRModal url={connectUrl} errorDetail={connectError} onClose={() => setShowQR(false)} />}
    </div>
  );
}