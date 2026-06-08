import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, ArrowLeft, ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { cartCountV2 } from '@/lib/shop-v2-cart';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// MobileNavBarV2 — Barra inferior fija para TODO el recorrido Shop v2 mobile.
// En páginas de acción (producto, carrito, checkout) muestra CTA primario +
// precio. En páginas de exploración (inicio, catálogo) muestra navegación.
// ════════════════════════════════════════════════════════════════════════

// Modo "exploración" (TiendaNueva, CatalogoNuevo): tabs de navegación
function NavTabs({ cartCount }) {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { to: '/TiendaNueva', icon: Home, label: 'Inicio' },
    { to: '/CatalogoNuevo', icon: LayoutGrid, label: 'Tienda' },
    { to: '/CarritoNuevo', icon: ShoppingBag, label: 'Carrito', badge: cartCount },
  ];

  return (
    <div className="flex items-stretch">
      {tabs.map((t) => {
        const active = path === t.to || (t.to === '/CatalogoNuevo' && path === '/CatalogoNuevo');
        return (
          <Link key={t.to} to={t.to} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative transition-colors">
            <div className="relative">
              <t.icon
                className="w-5 h-5 transition-colors"
                style={{ color: active ? '#C0785C' : '#A08070' }}
              />
              {t.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#C0785C' }}>
                  {t.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold" style={{ color: active ? '#C0785C' : '#A08070' }}>{t.label}</span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: '#C0785C' }} />
            )}
          </Link>
        );
      })}
    </div>
  );
}

// Modo "acción" (ProductoNuevo, CarritoNuevo, CheckoutNuevo): back + CTA
function ActionBar({ backTo, backLabel, ctaLabel, onCta, ctaDisabled, ctaLoading, total }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <button
        onClick={() => backTo ? navigate(backTo) : navigate(-1)}
        className="flex-shrink-0 h-12 px-4 rounded-2xl flex items-center gap-1.5 font-bold transition-all active:scale-[0.97]"
        style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#7A6050' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">{backLabel || 'Atrás'}</span>
      </button>
      <button
        onClick={onCta}
        disabled={ctaDisabled || ctaLoading}
        className="flex-1 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-55"
        style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 4px 16px rgba(192,120,92,.3)' }}
      >
        {ctaLoading ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
        ) : (
          <>
            <span className="truncate">{ctaLabel}</span>
            {total != null && <span className="opacity-80 flex-shrink-0">· {fmtCLP(total)}</span>}
            {!ctaLoading && <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />}
          </>
        )}
      </button>
    </div>
  );
}

export default function MobileNavBarV2({
  // Si se pasan estas props → modo "acción"
  backTo,
  backLabel,
  ctaLabel,
  onCta,
  ctaDisabled = false,
  ctaLoading = false,
  total,
  // Si no se pasan → modo "exploración" (nav tabs)
}) {
  const cartCount = cartCountV2();
  const isAction = !!onCta;

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe"
      style={{
        background: 'rgba(248,243,237,.97)',
        borderTop: '1.5px solid #D4C4B0',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        boxShadow: '0 -4px 24px rgba(44,24,16,.1)',
      }}
    >
      {isAction ? (
        <ActionBar
          backTo={backTo}
          backLabel={backLabel}
          ctaLabel={ctaLabel}
          onCta={onCta}
          ctaDisabled={ctaDisabled}
          ctaLoading={ctaLoading}
          total={total}
        />
      ) : (
        <NavTabs cartCount={cartCount} />
      )}
    </div>
  );
}