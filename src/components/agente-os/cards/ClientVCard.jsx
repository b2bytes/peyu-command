import { useState } from 'react';
import { Mail, Phone, Hash, Star, TrendingUp, ShoppingBag, ChevronDown, MessageCircle, Crown, AlertTriangle, Package, Wallet, CalendarDays, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');
const fmtFecha = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};
const wa = (tel) => tel ? `https://wa.me/${tel.replace(/[^0-9]/g, '')}` : null;

const ESTADO_STYLE = {
  VIP: { cls: 'bg-ld-highlight-soft text-ld-highlight', icon: Crown },
  Activo: { cls: 'bg-ld-action-soft text-ld-action', icon: null },
  'En Riesgo': { cls: 'bg-ld-highlight-soft text-ld-highlight', icon: AlertTriangle },
  Inactivo: { cls: 'bg-ld-bg-soft text-ld-fg-muted', icon: null },
  Bloqueado: { cls: 'bg-ld-bg-soft text-ld-fg-muted', icon: null },
};

const PEDIDO_ESTADO_CLS = {
  Entregado: 'bg-ld-action-soft text-ld-action',
  Despachado: 'bg-ld-action-soft text-ld-action',
  Cancelado: 'bg-ld-highlight-soft text-ld-highlight',
  Reembolsado: 'bg-ld-highlight-soft text-ld-highlight',
};

// vCard inteligente de un cliente: datos reales (cruzados con sus pedidos por
// peyuBrainOps), último pedido, contacto accionable y CTA a la ficha 360°.
// Diseñada mobile-first: tap targets grandes, info clave visible sin expandir.
export default function ClientVCard({ cliente }) {
  const [open, setOpen] = useState(false);
  const c = cliente;
  const nombre = c.contacto || c.empresa || 'Cliente';
  const est = ESTADO_STYLE[c.estado] || ESTADO_STYLE.Activo;
  const EstIcon = est.icon;
  const tieneCompras = (c.num_pedidos || 0) > 0;

  return (
    <div className="rounded-xl bg-ld-bg-soft/60 border border-ld-border overflow-hidden">
      {/* Fila principal — la info clave SIN expandir: nombre, estado, $ y pedidos */}
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-3 py-3 text-left min-h-[56px]">
        <span className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 text-white" style={{ background: 'var(--ld-grad-action)' }}>
          {nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-ld-fg truncate">{nombre}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 flex-shrink-0 ${est.cls}`}>
              {EstIcon && <EstIcon className="w-2.5 h-2.5" />}{c.estado || 'Activo'}
            </span>
          </div>
          <div className="text-[11px] text-ld-fg-muted truncate mt-0.5">
            {c.empresa && c.contacto ? `${c.empresa} · ` : ''}{c.tipo || 'B2C'}{c.email ? ` · ${c.email}` : ''}
          </div>
        </div>
        {/* Resumen $ visible sin expandir */}
        <div className="text-right flex-shrink-0 hidden min-[380px]:block">
          <div className="text-sm font-bold text-ld-fg">{tieneCompras ? fmtCLP(c.total_compras_clp) : 'Sin compras'}</div>
          <div className="text-[10px] text-ld-fg-subtle">{tieneCompras ? `${c.num_pedidos} pedido${c.num_pedidos > 1 ? 's' : ''}` : 'aún'}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-ld-fg-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-ld-border">
          {/* KPIs reales */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-ld-bg-elevated p-2 text-center">
              <Wallet className="w-3.5 h-3.5 text-ld-action mx-auto mb-1" />
              <div className="text-xs sm:text-sm font-bold text-ld-fg truncate">{tieneCompras ? fmtCLP(c.total_compras_clp) : '—'}</div>
              <div className="text-[9px] text-ld-fg-subtle">Total comprado</div>
            </div>
            <div className="rounded-lg bg-ld-bg-elevated p-2 text-center">
              <ShoppingBag className="w-3.5 h-3.5 text-ld-action mx-auto mb-1" />
              <div className="text-xs sm:text-sm font-bold text-ld-fg">{c.num_pedidos ?? 0}</div>
              <div className="text-[9px] text-ld-fg-subtle">Pedidos</div>
            </div>
            <div className="rounded-lg bg-ld-bg-elevated p-2 text-center">
              <TrendingUp className="w-3.5 h-3.5 text-ld-action mx-auto mb-1" />
              <div className="text-xs sm:text-sm font-bold text-ld-fg truncate">{c.ticket_promedio ? fmtCLP(c.ticket_promedio) : '—'}</div>
              <div className="text-[9px] text-ld-fg-subtle">Ticket prom.</div>
            </div>
          </div>

          {/* Último pedido — contexto inmediato de la relación */}
          {c.ultimo_pedido && (
            <div className="rounded-lg bg-ld-bg-elevated px-2.5 py-2 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-ld-action flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-ld-fg truncate">
                  Último pedido {c.ultimo_pedido.numero || ''} · {fmtCLP(c.ultimo_pedido.total)}
                </div>
                {c.ultimo_pedido.items && <div className="text-[10px] text-ld-fg-muted truncate">{c.ultimo_pedido.items}</div>}
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${PEDIDO_ESTADO_CLS[c.ultimo_pedido.estado] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
                {c.ultimo_pedido.estado}
              </span>
            </div>
          )}

          {/* Contacto + datos */}
          <div className="space-y-1.5 text-xs">
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-ld-fg-soft hover:text-ld-action transition-colors min-h-[28px]">
                <Mail className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> <span className="truncate">{c.email}</span>
              </a>
            )}
            {c.telefono && (
              <a href={wa(c.telefono)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ld-fg-soft hover:text-ld-action transition-colors min-h-[28px]">
                <Phone className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> <span className="truncate">{c.telefono}</span>
                <MessageCircle className="w-3.5 h-3.5 text-ld-action ml-auto flex-shrink-0" />
              </a>
            )}
            {c.rut && (
              <div className="flex items-center gap-2 text-ld-fg-soft">
                <Hash className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> {c.rut}
              </div>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {c.created_date && (
              <span className="px-2 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted inline-flex items-center gap-1">
                <CalendarDays className="w-2.5 h-2.5" /> Cliente desde {fmtFecha(c.created_date)}
              </span>
            )}
            {c.fecha_ultima_compra && <span className="px-2 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted">Últ. compra: {fmtFecha(c.fecha_ultima_compra)}</span>}
            {c.sku_favorito && <span className="px-2 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted">❤ {c.sku_favorito}</span>}
            {c.nps_score != null && (
              <span className="px-2 py-0.5 rounded-full bg-ld-action-soft text-ld-action inline-flex items-center gap-1">
                <Star className="w-2.5 h-2.5" /> NPS {c.nps_score}/10
              </span>
            )}
            {c.canal_preferido && <span className="px-2 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted">{c.canal_preferido}</span>}
            {c.pagos_al_dia === false && <span className="px-2 py-0.5 rounded-full bg-ld-highlight-soft text-ld-highlight font-bold">Pago pendiente</span>}
          </div>

          {c.notas && <p className="text-[11px] text-ld-fg-muted italic leading-relaxed">{c.notas}</p>}

          {/* Acciones rápidas — tap targets grandes para móvil */}
          <div className="flex gap-2">
            {c.telefono && (
              <a href={wa(c.telefono)} target="_blank" rel="noopener noreferrer"
                className="flex-1 ld-btn-primary rounded-xl py-2 text-center text-xs font-bold inline-flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            <Link to={`/admin/cliente-360?email=${encodeURIComponent(c.email || '')}`}
              className="flex-1 ld-btn-ghost rounded-xl py-2 text-center text-xs font-bold text-ld-fg-soft inline-flex items-center justify-center gap-1.5">
              Ficha 360° <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}