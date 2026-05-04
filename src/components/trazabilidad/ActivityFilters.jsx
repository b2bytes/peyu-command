// Filtros para el log de actividad (categoría, tipo evento, búsqueda email/sesión)
import { Search, Filter } from 'lucide-react';

const CATEGORIES = ['Todas', 'B2C', 'B2B', 'Soporte', 'Contenido', 'Sistema'];
const EVENT_TYPES = [
  { v: '', l: 'Todos los eventos' },
  { v: 'page_view', l: '👁 Page view' },
  { v: 'product_view', l: '📦 Product view' },
  { v: 'add_to_cart', l: '🛒 Add to cart' },
  { v: 'checkout_start', l: '💳 Checkout start' },
  { v: 'checkout_complete', l: '✅ Checkout complete' },
  { v: 'b2b_form_submit', l: '📝 B2B form submit' },
  { v: 'b2b_proposal_view', l: '👀 Propuesta vista' },
  { v: 'b2b_proposal_accept', l: '🎉 Propuesta aceptada' },
  { v: 'b2b_proposal_reject', l: '❌ Propuesta rechazada' },
  { v: 'tracking_view', l: '🚚 Tracking view' },
  { v: 'giftcard_purchase', l: '🎁 Gift Card compra' },
  { v: 'giftcard_redeem', l: '🎁 Gift Card canje' },
  { v: 'review_submit', l: '⭐ Reseña enviada' },
  { v: 'chat_message', l: '💬 Chat' },
  { v: 'blog_view', l: '📰 Blog view' },
];

export default function ActivityFilters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-white/40" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Buscar por email, sesión, ruta…"
          className="flex-1 bg-transparent border-b border-white/10 focus:border-teal-400 outline-none text-sm text-white placeholder:text-white/40 py-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-white/40" />
        <select
          value={filters.category || 'Todas'}
          onChange={(e) => set({ category: e.target.value })}
          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-teal-400 outline-none"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <select
        value={filters.event_type || ''}
        onChange={(e) => set({ event_type: e.target.value })}
        className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-teal-400 outline-none"
      >
        {EVENT_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
      </select>

      <select
        value={filters.range || '7d'}
        onChange={(e) => set({ range: e.target.value })}
        className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-teal-400 outline-none"
      >
        <option value="1d">Últimas 24h</option>
        <option value="7d">Últimos 7 días</option>
        <option value="30d">Últimos 30 días</option>
        <option value="all">Todo</option>
      </select>
    </div>
  );
}