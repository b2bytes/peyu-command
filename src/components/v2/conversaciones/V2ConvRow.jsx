import { Flame, Building2, User, HelpCircle, Mail } from 'lucide-react';
import { isHotConversation } from '@/lib/v2-founders';

const TIPO_STYLE = {
  B2B: { bg: 'var(--v2-gold-soft, rgba(227,193,150,0.18))', fg: 'var(--v2-gold)', Icon: Building2, label: 'B2B' },
  B2C: { bg: 'var(--v2-teal-soft, rgba(95,191,166,0.15))', fg: 'var(--v2-teal)', Icon: User, label: 'B2C' },
  'Sin clasificar': { bg: 'var(--v2-surface-2)', fg: 'var(--v2-fg-muted)', Icon: HelpCircle, label: 'S/C' },
};

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) +
      ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

// Fila de una conversación (ChatLead) en el panel Conversaciones (read-only).
export default function V2ConvRow({ cl, onClick }) {
  const t = TIPO_STYLE[cl.tipo] || TIPO_STYLE['Sin clasificar'];
  const hot = isHotConversation(cl);
  const Icon = t.Icon;

  return (
    <button
      onClick={() => onClick(cl)}
      className="v2-card v2-fade-up w-full text-left p-3.5 flex flex-col gap-2 hover:opacity-95 transition"
      style={hot ? { borderColor: 'var(--v2-gold)', boxShadow: '0 0 0 1px var(--v2-gold)' } : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: t.bg, color: t.fg }}>
          <Icon className="w-3 h-3" /> {t.label}
        </span>
        {hot && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--v2-highlight-soft, rgba(224,88,79,0.15))', color: 'var(--v2-highlight, #e0584f)' }}>
            <Flame className="w-3 h-3" /> Caliente
          </span>
        )}
        <span className="ml-auto text-[10px]" style={{ color: 'var(--v2-fg-subtle)' }}>{fmtDate(cl.ultimo_mensaje_at || cl.updated_date)}</span>
      </div>

      <p className="text-[13px] line-clamp-2 leading-snug" style={{ color: 'var(--v2-fg-soft)' }}>
        {cl.ultimo_mensaje_preview || 'Sin mensajes aún'}
      </p>

      <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>
        <span>{cl.mensajes_count || 0} mensajes</span>
        {cl.empresa && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {cl.empresa}</span>}
        {cl.email && <span className="flex items-center gap-1 truncate max-w-[140px]"><Mail className="w-3 h-3" /> {cl.email}</span>}
        {cl.convertido_a_b2b_lead_id && (
          <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'var(--v2-teal-soft, rgba(95,191,166,0.15))', color: 'var(--v2-teal)' }}>LEAD ✓</span>
        )}
      </div>
    </button>
  );
}