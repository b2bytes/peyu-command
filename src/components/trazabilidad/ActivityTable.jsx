// Tabla densa de eventos con drill-down al journey de la sesión
import { Smartphone, Monitor, Tablet, ExternalLink } from 'lucide-react';

const EVENT_BADGE = {
  page_view:           { c: 'bg-slate-500/15 text-slate-300',   l: 'Visit' },
  product_view:        { c: 'bg-cyan-500/15 text-cyan-300',     l: 'Producto' },
  add_to_cart:         { c: 'bg-amber-500/15 text-amber-300',   l: '🛒 Cart' },
  checkout_start:      { c: 'bg-orange-500/15 text-orange-300', l: 'Checkout' },
  checkout_complete:   { c: 'bg-emerald-500/15 text-emerald-300',l: '✅ Pago' },
  b2b_form_submit:     { c: 'bg-violet-500/15 text-violet-300', l: 'B2B' },
  b2b_proposal_view:   { c: 'bg-indigo-500/15 text-indigo-300', l: 'Propuesta vista' },
  b2b_proposal_accept: { c: 'bg-emerald-500/15 text-emerald-300',l: '🎉 Aceptada' },
  b2b_proposal_reject: { c: 'bg-red-500/15 text-red-300',       l: 'Rechazada' },
  tracking_view:       { c: 'bg-blue-500/15 text-blue-300',     l: 'Tracking' },
  giftcard_purchase:   { c: 'bg-pink-500/15 text-pink-300',     l: '🎁 GC' },
  giftcard_redeem:     { c: 'bg-pink-500/15 text-pink-300',     l: '🎁 Canje' },
  review_submit:       { c: 'bg-yellow-500/15 text-yellow-300', l: '⭐ Review' },
  chat_message:        { c: 'bg-teal-500/15 text-teal-300',     l: '💬 Chat' },
  blog_view:           { c: 'bg-slate-500/15 text-slate-300',   l: '📰 Blog' },
};

const DEVICE_ICON = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default function ActivityTable({ logs = [], onSelectSession }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-white/40 text-sm border border-dashed border-white/10 rounded-xl">
        Sin eventos para los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-3 py-2 text-left">Hace</th>
              <th className="px-3 py-2 text-left">Evento</th>
              <th className="px-3 py-2 text-left">Usuario</th>
              <th className="px-3 py-2 text-left">Ruta</th>
              <th className="px-3 py-2 text-left">Detalle</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-center">Dev</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const badge = EVENT_BADGE[l.event_type] || { c: 'bg-slate-500/15 text-slate-300', l: l.event_type };
              const DevIcon = DEVICE_ICON[l.device] || Monitor;
              return (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-3 py-2 text-white/60 text-xs whitespace-nowrap" title={l.created_date}>
                    {timeAgo(l.created_date)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${badge.c}`}>
                      {badge.l}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white/80 text-xs">
                    {l.user_email ? (
                      <span title={l.user_name || ''}>{l.user_email}</span>
                    ) : (
                      <span className="text-white/40 italic">anónimo · {(l.session_id || '').slice(-6)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white/60 text-xs font-mono truncate max-w-[180px]" title={l.page_path}>
                    {l.page_path || '—'}
                  </td>
                  <td className="px-3 py-2 text-white/60 text-xs max-w-[260px] truncate" title={JSON.stringify(l.meta || {})}>
                    {l.meta?.nombre || l.meta?.company || l.meta?.codigo || l.meta?.numero_pedido || l.meta?.slug || '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-white text-xs whitespace-nowrap">
                    {l.value_clp ? `$${l.value_clp.toLocaleString('es-CL')}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <DevIcon className="w-3.5 h-3.5 text-white/40 inline" />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onSelectSession?.(l)}
                      className="text-teal-300 hover:text-teal-200 text-xs flex items-center gap-1"
                      title="Ver journey de esta sesión"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}