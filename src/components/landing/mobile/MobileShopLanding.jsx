import { useState } from 'react';
import MobileTopBar from './MobileTopBar';
import MobileHero from './MobileHero';
import MobileCategoryTiles from './MobileCategoryTiles';
import MobileTopSellers from './MobileTopSellers';
import MobileChatPreview from './MobileChatPreview';
import MobileTrustBand from './MobileTrustBand';
import MobileChatModal from './MobileChatModal';
import CelebrationBanner from '@/components/landing/CelebrationBanner';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

/**
 * Mobile shop landing — e-commerce agéntico.
 * Recibe las props del chat (estado + handlers) desde ShopLanding (parent),
 * para no duplicar la lógica del chat (publicChatProxy, history, etc).
 *
 * Estructura:
 *  1. TopBar (sticky)
 *  2. Hero (propuesta valor + CTA dual)
 *  3. Celebration banner (próxima fecha)
 *  4. Categorías visuales 2x2
 *  5. Top sellers (carrusel)
 *  6. Chat preview card
 *  7. Trust band
 *  8. Footer mini con admin discreto
 *  + Modal chat full-screen
 *  + WhatsApp flotante
 */
export default function MobileShopLanding({
  menuItems,
  cartCount,
  // chat state
  messages,
  loading,
  input,
  setInput,
  onSend,
  onOccasionClick,
  historyCount,
  onShowHistory,
  showHistory,
  onCloseHistory,
  onResumeFromHistory,
}) {
  const [chatOpen, setChatOpen] = useState(false);

  const handleSuggestion = (text) => {
    setChatOpen(true);
    onSend(text);
  };

  const handleSendFromModal = (text) => {
    onSend(text);
  };

  return (
    <div className="min-h-screen ld-canvas relative">
      {/* Glow ambient auto-adaptativo (verde acción + terracota highlight) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-30"
          style={{ background: 'var(--ld-action)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-[100px] opacity-20"
          style={{ background: 'var(--ld-highlight)' }}
        />
      </div>

      <div className="relative">
        <MobileTopBar menuItems={menuItems} cartCount={cartCount} />

        <MobileHero onOpenChat={() => setChatOpen(true)} />

        {/* Banner próxima fecha festiva (compacto) */}
        <div className="px-4 pb-4">
          <CelebrationBanner
            onChatPrompt={(text) => {
              setChatOpen(true);
              onSend(text);
            }}
            compact
          />
        </div>

        <MobileCategoryTiles />

        <MobileTopSellers />

        <MobileChatPreview
          onOpenChat={() => setChatOpen(true)}
          onSuggestionClick={handleSuggestion}
        />

        <MobileTrustBand />

        {/* Footer mini Liquid Dual */}
        <footer className="px-4 py-6 border-t border-ld-border">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-ld-fg-muted text-[11px] font-medium">PEYU Chile · Regalos con propósito</p>
            <div className="flex items-center gap-3 text-[10px] text-ld-fg-muted">
              <Link to="/nosotros"    className="hover:text-ld-action transition">Nosotros</Link>
              <span className="text-ld-fg-subtle">·</span>
              <Link to="/blog"        className="hover:text-ld-action transition">Blog</Link>
              <span className="text-ld-fg-subtle">·</span>
              <Link to="/soporte"     className="hover:text-ld-action transition">Soporte</Link>
              <span className="text-ld-fg-subtle">·</span>
              <Link to="/seguimiento" className="hover:text-ld-action transition">Seguimiento</Link>
            </div>
            <Link
              to="/admin"
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-ld-fg-subtle hover:text-ld-action transition"
            >
              <Lock className="w-3 h-3" /> Admin
            </Link>
          </div>
        </footer>
      </div>

      {/* WhatsApp flotante: en mobile el chat Peyu ya ocupa la esquina inferior,
          no agregamos un segundo botón flotante que compita visualmente. */}

      {/* Chat modal */}
      <MobileChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        loading={loading}
        input={input}
        setInput={setInput}
        onSend={handleSendFromModal}
        onOccasionClick={onOccasionClick}
        historyCount={historyCount}
        onShowHistory={onShowHistory}
      />

      {/* Panel historial overlay (controlado desde el padre) */}
      {showHistory && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm">
          <ChatHistoryPanel
            onResume={onResumeFromHistory}
            onClose={onCloseHistory}
          />
        </div>
      )}
    </div>
  );
}