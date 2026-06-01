import { Link } from 'react-router-dom';
import { Boxes, Tag, Truck, Sparkles, Building2, Gift } from 'lucide-react';

// Fila de respuestas rápidas debajo del input del chat /v2.
// Dos clases de chip:
//  · "ask"  → dispara una consulta en el río de chat (onPick).
//  · "link" → navega directo a una sección de información del sitio.
// El set cambia según el modo (Personal B2C / Empresa B2B).
const REPLIES_B2C = [
  { kind: 'ask',  icon: Boxes,    label: '¿Tienen stock?',        prompt: '¿Tienen stock disponible de sus productos?' },
  { kind: 'ask',  icon: Gift,     label: 'Busco un regalo',       prompt: 'Busco un regalo sustentable' },
  { kind: 'ask',  icon: Sparkles, label: 'Personalizar con logo', prompt: '¿Cómo personalizo con mi logo?' },
  { kind: 'link', icon: Truck,    label: 'Tiempos de entrega',    to: '/envios' },
];

const REPLIES_B2B = [
  { kind: 'ask',  icon: Tag,      label: 'Precios por volumen',   prompt: 'Quiero ver precios B2B por volumen' },
  { kind: 'ask',  icon: Boxes,    label: 'Stock para pedido',     prompt: '¿Tienen stock para un pedido grande de empresa?' },
  { kind: 'ask',  icon: Building2, label: 'Cotizar para empresa', prompt: 'Quiero cotizar para mi empresa con mi logo' },
  { kind: 'link', icon: Truck,    label: 'Tiempos de entrega',    to: '/envios' },
];

export default function V2QuickReplies({ mode, onPick, disabled }) {
  const replies = mode === 'b2b' ? REPLIES_B2B : REPLIES_B2C;

  return (
    <div className="flex gap-2 overflow-x-auto v2-scrollbar-hide pb-2">
      {replies.map((r) => {
        const Icon = r.icon;
        const content = (
          <>
            <Icon className="w-3 h-3 flex-shrink-0" />
            {r.label}
          </>
        );
        return r.kind === 'link' ? (
          <Link
            key={r.label}
            to={r.to}
            className="v2-chip flex items-center gap-1.5 px-3 py-1.5 text-[11px] flex-shrink-0"
          >
            {content}
          </Link>
        ) : (
          <button
            key={r.label}
            onClick={() => onPick?.(r.prompt)}
            disabled={disabled}
            className="v2-chip flex items-center gap-1.5 px-3 py-1.5 text-[11px] flex-shrink-0 disabled:opacity-50"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}