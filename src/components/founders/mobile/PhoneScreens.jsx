// ════════════════════════════════════════════════════════════════════════
// PhoneScreens — Las 4 pantallas mockup COMPLETAS de la app PEYU móvil:
// Inicio · Tienda · Producto · Carrito. Renderizan UI realista con fotos
// reales de producto, precios CLP y la barra inferior de navegación.
// Cada pantalla recibe `v` (variant con colores) para teñirse a la dirección.
// ════════════════════════════════════════════════════════════════════════
import { Search, Heart, Star, ShoppingBag, Home, Grid3x3, User, Minus, Plus, ChevronRight, Truck } from 'lucide-react';
import { MOCK_PRODUCTS, HERO_IMG, CATEGORIES, TURTLE } from './phone-mock-data';

// Barra inferior compartida — tab activo según pantalla.
function TabBar({ v, active }) {
  const tabs = [
    { id: 'inicio', icon: Home, label: 'Inicio' },
    { id: 'tienda', icon: Grid3x3, label: 'Tienda' },
    { id: 'carrito', icon: ShoppingBag, label: 'Carrito', badge: 2 },
    { id: 'cuenta', icon: User, label: 'Cuenta' },
  ];
  return (
    <div
      className="flex-shrink-0 flex items-center justify-around px-3 pt-2 pb-3"
      style={{ background: v.dark ? 'rgba(10,21,18,.92)' : 'rgba(255,255,255,.95)', borderTop: `1px solid ${v.dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`, backdropFilter: 'blur(10px)' }}
    >
      {tabs.map(({ id, icon: Icon, label, badge }) => {
        const on = id === active;
        return (
          <div key={id} className="relative flex flex-col items-center gap-0.5">
            <div className="relative">
              <Icon className="w-[19px] h-[19px]" strokeWidth={on ? 2.5 : 1.8}
                style={{ color: on ? v.accent : v.dark ? 'rgba(255,255,255,.45)' : '#B8AC9C' }} />
              {badge && (
                <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full text-[8px] font-extrabold text-white flex items-center justify-center"
                  style={{ background: v.accent }}>{badge}</span>
              )}
            </div>
            <span className="text-[8px] font-bold" style={{ color: on ? v.accent : v.dark ? 'rgba(255,255,255,.4)' : '#B8AC9C' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const fg = (v) => (v.dark ? '#fff' : '#2C1810');
const fgSoft = (v) => (v.dark ? 'rgba(255,255,255,.6)' : '#7A6050');
const surface = (v) => (v.dark ? 'rgba(255,255,255,.05)' : '#fff');
const cardBorder = (v) => (v.dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)');

// ── 1 · INICIO ────────────────────────────────────────────────────────────
export function ScreenInicio({ v }) {
  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <img src={TURTLE} alt="" className={`h-6 w-auto object-contain ${v.dark ? 'brightness-0 invert' : ''}`} style={!v.dark ? { filter: 'none' } : {}} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
              <Search className="w-3.5 h-3.5" style={{ color: fgSoft(v) }} />
            </div>
            <div className="relative w-7 h-7 rounded-full flex items-center justify-center" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
              <ShoppingBag className="w-3.5 h-3.5" style={{ color: v.accent }} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] font-bold text-white flex items-center justify-center" style={{ background: v.accent }}>2</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 space-y-3">
          {/* hero */}
          <div className="relative rounded-2xl overflow-hidden h-36">
            <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent,rgba(0,0,0,.55))' }} />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/80 mb-0.5">Hecho en Chile · 100% reciclado</p>
              <p className="font-fraunces text-white text-lg leading-tight font-semibold">Regala una experiencia, no un objeto</p>
              <button className="mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: v.accent }}>Ver catálogo</button>
            </div>
          </div>

          {/* categorías */}
          <div className="flex gap-2 overflow-hidden">
            {CATEGORIES.map((c, i) => (
              <span key={c} className="px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap"
                style={i === 0 ? { background: v.accent, color: '#fff' } : { background: surface(v), color: fgSoft(v), border: `1px solid ${cardBorder(v)}` }}>{c}</span>
            ))}
          </div>

          {/* destacados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-extrabold" style={{ color: fg(v) }}>Lo más vendido 🔥</p>
              <span className="text-[9px] font-semibold" style={{ color: v.accent }}>Ver todo</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_PRODUCTS.slice(0, 2).map((p) => (
                <div key={p.nombre} className="rounded-xl overflow-hidden" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
                  <div className="aspect-square" style={{ background: v.dark ? '#0B1220' : '#F4F2EC' }}>
                    <img src={p.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-[9px] font-bold leading-tight truncate" style={{ color: fg(v) }}>{p.nombre}</p>
                    <p className="text-[10px] font-extrabold" style={{ color: v.green }}>{p.precio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TabBar v={v} active="inicio" />
    </>
  );
}

// ── 2 · TIENDA ────────────────────────────────────────────────────────────
export function ScreenTienda({ v }) {
  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 pt-1 pb-2">
          <p className="font-fraunces text-lg font-semibold mb-2" style={{ color: fg(v) }}>Tienda</p>
          <div className="flex items-center gap-2 h-8 px-3 rounded-full" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
            <Search className="w-3.5 h-3.5" style={{ color: fgSoft(v) }} />
            <span className="text-[10px]" style={{ color: fgSoft(v) }}>Buscar productos…</span>
          </div>
          <div className="flex gap-1.5 mt-2 overflow-hidden">
            {CATEGORIES.map((c, i) => (
              <span key={c} className="px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap"
                style={i === 0 ? { background: v.accent, color: '#fff' } : { background: surface(v), color: fgSoft(v), border: `1px solid ${cardBorder(v)}` }}>{c}</span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {MOCK_PRODUCTS.slice(0, 4).map((p) => (
              <div key={p.nombre} className="rounded-xl overflow-hidden" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
                <div className="relative aspect-square" style={{ background: v.dark ? '#0B1220' : '#F4F2EC' }}>
                  <img src={p.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.85)' }}>
                    <Heart className="w-2.5 h-2.5" style={{ color: v.accent }} />
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[8px] font-bold uppercase tracking-wide" style={{ color: fgSoft(v) }}>{p.cat}</p>
                  <p className="text-[9px] font-bold leading-tight truncate" style={{ color: fg(v) }}>{p.nombre}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] font-extrabold" style={{ color: v.green }}>{p.precio}</p>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: v.accent }}>
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar v={v} active="tienda" />
    </>
  );
}

// ── 3 · PRODUCTO ──────────────────────────────────────────────────────────
export function ScreenProducto({ v }) {
  const p = MOCK_PRODUCTS[0];
  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="relative aspect-square mx-4 mt-1 rounded-2xl overflow-hidden" style={{ background: v.dark ? '#0B1220' : '#F4F2EC' }}>
          <img src={p.img} alt="" className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold" style={{ background: 'rgba(255,255,255,.9)', color: v.green }}>100% reciclado</span>
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? v.accent : v.dark ? 'rgba(255,255,255,.2)' : '#D4C4B0' }} />
          ))}
        </div>

        <div className="flex-1 px-4 pt-2 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: fgSoft(v) }}>{p.cat}</p>
          <p className="font-fraunces text-base font-semibold leading-tight" style={{ color: fg(v) }}>{p.nombre}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-current" style={{ color: '#F5A623' }} />)}
            <span className="text-[9px] ml-1" style={{ color: fgSoft(v) }}>4.9 · 213 reseñas</span>
          </div>
          <p className="font-fraunces text-xl font-bold" style={{ color: v.green }}>{p.precio}</p>
          {/* color swatches */}
          <div className="flex items-center gap-1.5">
            {['#0F8B6C', '#1C1410', '#D96B4D', '#22D3EE'].map((c, i) => (
              <span key={c} className="w-5 h-5 rounded-full" style={{ background: c, boxShadow: i === 0 ? `0 0 0 2px ${v.accent}` : 'none', border: '1px solid rgba(0,0,0,.1)' }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] mt-1" style={{ color: fgSoft(v) }}>
            <Truck className="w-3 h-3" style={{ color: v.green }} /> Envío a todo Chile · 2-4 días
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-3 pt-1">
          <button className="w-full h-11 rounded-2xl text-white text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: v.accent, boxShadow: `0 6px 18px ${v.accent}55` }}>
            <ShoppingBag className="w-4 h-4" /> Agregar al carrito · {p.precio}
          </button>
        </div>
      </div>
    </>
  );
}

// ── 4 · CARRITO ───────────────────────────────────────────────────────────
export function ScreenCarrito({ v }) {
  const items = MOCK_PRODUCTS.slice(0, 2);
  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 pt-1 pb-2">
          <p className="font-fraunces text-lg font-semibold" style={{ color: fg(v) }}>Tu carrito</p>
          <p className="text-[9px]" style={{ color: fgSoft(v) }}>2 productos · plástico reciclado</p>
        </div>

        <div className="flex-1 px-4 space-y-2">
          {items.map((p) => (
            <div key={p.nombre} className="flex gap-2.5 p-2 rounded-xl items-center" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
              <img src={p.img} alt="" className="w-12 h-12 rounded-lg object-cover" style={{ background: v.dark ? '#0B1220' : '#F4F2EC' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold leading-tight truncate" style={{ color: fg(v) }}>{p.nombre}</p>
                <p className="text-[10px] font-extrabold" style={{ color: v.green }}>{p.precio}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full" style={{ background: v.dark ? 'rgba(255,255,255,.06)' : '#F4F2EC' }}>
                    <Minus className="w-2.5 h-2.5" style={{ color: fgSoft(v) }} />
                    <span className="text-[9px] font-bold" style={{ color: fg(v) }}>1</span>
                    <Plus className="w-2.5 h-2.5" style={{ color: fgSoft(v) }} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* impacto */}
          <div className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: v.green + '18' }}>
            <span className="text-base">🐢</span>
            <p className="text-[9px] font-semibold leading-tight" style={{ color: v.dark ? '#fff' : '#0B6E55' }}>
              Tu compra rescata <b>~80 tapitas</b> de plástico del océano.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-3 pt-1 space-y-1.5" style={{ borderTop: `1px solid ${cardBorder(v)}` }}>
          <div className="flex justify-between text-[10px] pt-2" style={{ color: fgSoft(v) }}>
            <span>Subtotal</span><span style={{ color: fg(v) }}>$18.980</span>
          </div>
          <div className="flex justify-between text-[11px] font-extrabold">
            <span style={{ color: fg(v) }}>Total</span><span style={{ color: v.green }}>$22.470</span>
          </div>
          <button className="w-full h-11 rounded-2xl text-white text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: v.accent, boxShadow: `0 6px 18px ${v.accent}55` }}>
            Ir a pagar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <TabBar v={v} active="carrito" />
    </>
  );
}