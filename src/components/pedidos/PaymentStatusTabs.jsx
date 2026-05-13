import { CheckCircle2, Clock, AlertTriangle, XCircle, Inbox, ShieldAlert } from 'lucide-react';

// Tabs para filtrar pedidos por payment_status.
// "todos" → no filtra · resto filtra por el valor exacto en p.payment_status.
const TABS = [
  { key: 'todos',         label: 'Todos',           icon: Inbox,         color: 'text-gray-700',   bg: 'bg-gray-100' },
  { key: 'paid',          label: 'Confirmados',     icon: CheckCircle2,  color: 'text-green-700',  bg: 'bg-green-100' },
  { key: 'pending_mp',    label: 'Esperando pago',  icon: Clock,         color: 'text-amber-700',  bg: 'bg-amber-100' },
  { key: 'manual_review', label: 'Sospechosos',     icon: ShieldAlert,   color: 'text-red-700',    bg: 'bg-red-100' },
  { key: 'expired',       label: 'Expirados',       icon: XCircle,       color: 'text-gray-500',   bg: 'bg-gray-100' },
  { key: 'failed',        label: 'Fallidos',        icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-100' },
];

export default function PaymentStatusTabs({ active, onChange, counts = {} }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const count = counts[tab.key] || 0;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
              isActive
                ? `${tab.bg} ${tab.color} border-current shadow-sm`
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              isActive ? 'bg-white/70' : 'bg-gray-100'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { TABS as PAYMENT_TABS };