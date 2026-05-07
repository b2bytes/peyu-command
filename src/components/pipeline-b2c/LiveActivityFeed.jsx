// LiveActivityFeed · Stream cronológico de eventos de hoy.
import { Eye, ShoppingCart, MessageSquare, CreditCard, CheckCircle2, FileText, Search, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ICON_MAP = {
  page_view: { icon: Eye, color: 'text-slate-500 bg-slate-100' },
  product_view: { icon: Eye, color: 'text-indigo-600 bg-indigo-50' },
  add_to_cart: { icon: ShoppingCart, color: 'text-violet-600 bg-violet-50' },
  checkout_start: { icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  checkout_complete: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  chat_message: { icon: MessageSquare, color: 'text-teal-600 bg-teal-50' },
  b2b_form_submit: { icon: FileText, color: 'text-blue-600 bg-blue-50' },
  search: { icon: Search, color: 'text-slate-500 bg-slate-100' },
  newsletter_signup: { icon: Mail, color: 'text-rose-600 bg-rose-50' },
};

const LABEL_MAP = {
  page_view: 'Vista página',
  product_view: 'Vio producto',
  add_to_cart: 'Agregó al carrito',
  checkout_start: 'Inició checkout',
  checkout_complete: 'Compró',
  chat_message: 'Habló con Peyu',
  b2b_form_submit: 'Formulario B2B',
  search: 'Búsqueda',
  newsletter_signup: 'Suscribió newsletter',
};

export default function LiveActivityFeed({ events }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[640px] flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 font-jakarta">Actividad en vivo</h2>
        <span className="text-xs text-slate-500">{events.length} eventos</span>
      </div>
      <div className="flex-1 overflow-y-auto peyu-scrollbar p-3 space-y-2">
        {events.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Sin actividad aún hoy</p>
        )}
        {events.map((ev) => {
          const cfg = ICON_MAP[ev.event_type] || { icon: Eye, color: 'text-slate-500 bg-slate-100' };
          const Icon = cfg.icon;
          const label = LABEL_MAP[ev.event_type] || ev.event_type;
          const meta = ev.meta || {};
          return (
            <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 truncate">
                  {meta.nombre || meta.text_preview || meta.query || ev.page_path || ev.session_id?.slice(0, 12) || '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                  <span>{formatDistanceToNow(new Date(ev.created_date), { locale: es, addSuffix: true })}</span>
                  {ev.user_email && <span>· {ev.user_email}</span>}
                  {ev.device && <span>· {ev.device}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}