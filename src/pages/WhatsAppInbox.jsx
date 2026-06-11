import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, RefreshCw, Link2, Loader2, ArrowLeft, Check } from 'lucide-react';
import WhatsAppConvList from '@/components/whatsapp/WhatsAppConvList';
import WhatsAppThread from '@/components/whatsapp/WhatsAppThread';

// ════════════════════════════════════════════════════════════════════════
// /admin/whatsapp — Bandeja especial de conversaciones WhatsApp.
// El agente "whatsapp_peyu" (canal WhatsApp nativo de Base44) responde a los
// clientes 24/7; aquí el equipo ve cada conversación en vivo y puede
// intervenir. Mobile-first: lista ↔ hilo con navegación tipo WhatsApp.
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const convs = await base44.agents.listConversations({ agent_name: 'whatsapp_peyu' }).catch(() => []);
    setConversations(convs || []);
    setLoading(false);
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

  const copyConnectLink = async () => {
    const url = base44.agents.getWhatsAppConnectURL('whatsapp_peyu');
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 px-3 sm:px-4 border-b border-ld-border bg-ld-bg-soft/60 backdrop-blur-xl flex items-center gap-2.5">
        {active && (
          <button onClick={() => setActive(null)} className="md:hidden w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted" aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <span className="w-9 h-9 rounded-xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-ld-fg leading-none">Bandeja WhatsApp</h1>
          <p className="text-[10px] text-ld-fg-muted mt-0.5 truncate">Agente Peyu respondiendo 24/7 · {conversations.length} conversaciones</p>
        </div>
        <button
          onClick={copyConnectLink}
          className="ld-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-ld-fg-soft flex-shrink-0"
          title="Copiar link de conexión WhatsApp para compartir con clientes"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Link2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copiado' : 'Link de conexión'}</span>
        </button>
        <button onClick={load} className="w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted flex-shrink-0" aria-label="Refrescar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Layout: lista + hilo (en móvil se alternan) */}
      <div className="flex-1 flex min-h-0">
        <aside className={`w-full md:w-[340px] md:flex-shrink-0 md:border-r border-ld-border overflow-y-auto peyu-scrollbar bg-ld-bg ${active ? 'hidden md:block' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-ld-fg-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <WhatsAppConvList conversations={conversations} activeId={active?.id} onSelect={openConversation} />
          )}
        </aside>

        <main className={`flex-1 min-w-0 ${active ? '' : 'hidden md:flex'} flex-col`}>
          {active ? (
            <WhatsAppThread key={active.id} conversation={active} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ld-fg-muted">
              <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold text-ld-fg-soft">Selecciona una conversación</p>
              <p className="text-xs mt-1 max-w-xs">El agente Peyu responde automáticamente. Comparte el link de conexión para que tus clientes te escriban por WhatsApp.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}