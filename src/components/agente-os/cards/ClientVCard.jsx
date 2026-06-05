import { useState } from 'react';
import { Mail, Phone, MapPin, Hash, Star, TrendingUp, ShoppingBag, ChevronDown, MessageCircle, Crown, AlertTriangle } from 'lucide-react';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');
const wa = (tel) => tel ? `https://wa.me/${tel.replace(/[^0-9]/g, '')}` : null;

const ESTADO_STYLE = {
  VIP: { cls: 'bg-ld-highlight-soft text-ld-highlight', icon: Crown },
  Activo: { cls: 'bg-ld-action-soft text-ld-action', icon: null },
  'En Riesgo': { cls: 'bg-ld-highlight-soft text-ld-highlight', icon: AlertTriangle },
  Inactivo: { cls: 'bg-ld-bg-soft text-ld-fg-muted', icon: null },
  Bloqueado: { cls: 'bg-ld-bg-soft text-ld-fg-muted', icon: null },
};

// vCard inteligente de un cliente: avatar + datos de contacto + KPIs reales
// (total histórico, nº pedidos, ticket, NPS) expandible. Toda la info viaja
// desde peyuBrainOps.lists.clientes_top a la página agente.
export default function ClientVCard({ cliente }) {
  const [open, setOpen] = useState(false);
  const c = cliente;
  const nombre = c.empresa || c.contacto || 'Cliente';
  const est = ESTADO_STYLE[c.estado] || ESTADO_STYLE.Activo;
  const EstIcon = est.icon;

  return (
    <div className="rounded-xl bg-ld-bg-soft/60 border border-ld-border overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
        <span className="w-10 h-10 rounded-full bg-ld-action-soft text-ld-action flex items-center justify-center text-base font-bold flex-shrink-0">
          {nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-ld-fg truncate">{nombre}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 flex-shrink-0 ${est.cls}`}>
              {EstIcon && <EstIcon className="w-2.5 h-2.5" />}{c.estado}
            </span>
          </div>
          <div className="text-[11px] text-ld-fg-muted truncate">
            {c.contacto && c.empresa ? `${c.contacto} · ` : ''}{c.tipo || ''}{c.total_compras_clp ? ` · ${fmtCLP(c.total_compras_clp)}` : ''}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-ld-fg-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-ld-border">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="rounded-lg bg-ld-bg-elevated p-2 text-center">
              <ShoppingBag className="w-3.5 h-3.5 text-ld-action mx-auto mb-1" />
              <div className="text-sm font-bold text-ld-fg">{c.num_pedidos ?? 0}</div>
              <div className="text-[9px] text-ld-fg-subtle">Pedidos</div>
            </div>
            <div className="rounded-lg bg-ld-bg-elevated p-2 text-center">
              <TrendingUp className="w-3.5 h-3.5 text-ld-action mx-auto mb-1" />
              <div className="text-sm font-bold text-ld-fg">{c.ticket_promedio ? fmtCLP(c.ticket_promedio) : '—'}</div>
              <div className="text-[9px] text-ld-fg-subtle">Ticket prom.</div>
            </div>
            <div className="rounded-lg bg-ld-bg-elevated p-2 text-center">
              <Star className="w-3.5 h-3.5 text-ld-action mx-auto mb-1" />
              <div className="text-sm font-bold text-ld-fg">{c.nps_score != null ? `${c.nps_score}/10` : '—'}</div>
              <div className="text-[9px] text-ld-fg-subtle">NPS</div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-1.5 text-xs">
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-ld-fg-soft hover:text-ld-action transition-colors">
                <Mail className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> <span className="truncate">{c.email}</span>
              </a>
            )}
            {c.telefono && (
              <a href={wa(c.telefono)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ld-fg-soft hover:text-ld-action transition-colors">
                <Phone className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> <span className="truncate">{c.telefono}</span>
                <MessageCircle className="w-3 h-3 text-ld-action ml-auto flex-shrink-0" />
              </a>
            )}
            {c.rut && (
              <div className="flex items-center gap-2 text-ld-fg-soft">
                <Hash className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> {c.rut}
              </div>
            )}
            {c.segmento && (
              <div className="flex items-center gap-2 text-ld-fg-soft">
                <MapPin className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> {c.segmento}{c.canal_preferido ? ` · ${c.canal_preferido}` : ''}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {c.sku_favorito && <span className="px-2 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted">❤ {c.sku_favorito}</span>}
            {c.fecha_ultima_compra && <span className="px-2 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted">Últ. compra: {c.fecha_ultima_compra}</span>}
            {c.pagos_al_dia === false && <span className="px-2 py-0.5 rounded-full bg-ld-highlight-soft text-ld-highlight">Pago pendiente</span>}
          </div>

          {c.notas && <p className="text-[11px] text-ld-fg-muted italic leading-relaxed">{c.notas}</p>}
        </div>
      )}
    </div>
  );
}