// ════════════════════════════════════════════════════════════════════════
// PhoneScreens — Las 4 pantallas mockup COMPLETAS de la app PEYU móvil:
// Inicio · Tienda · Producto · Carrito. Renderizan UI realista premium con
// fotos de producto, precios CLP, ratings, badges y barra de navegación.
// Cada pantalla recibe `v` (variant con colores) para teñirse a la dirección.
// ════════════════════════════════════════════════════════════════════════
import { Search, Heart, Star, ShoppingBag, Home, Grid3x3, User, Minus, Plus, ChevronRight, Truck, ShieldCheck, Leaf } from 'lucide-react';
import { MOCK_PRODUCTS, HERO_IMG, CATEGORIES, TURTLE } from './phone-mock-data';

const fg = (v) => (v.dark ? '#fff' : '#2C1810');
const fgSoft = (v) => (v.dark ? 'rgba(255,255,255,.62)' : '#8A7160');
const surface = (v) => (v.dark ? 'rgba(255,255,255,.06)' : '#fff');
const cardBorder = (v) => (v.dark ? 'rgba(255,255,255,.09)' : 'rgba(44,24,16,.07)');
const imgBg = (v) => (v.dark ? '#0B1220' : '#F2EFE8');
const cardShadow = (v) => (v.dark ? '0 8px 20px -10px rgba(0,0,0,.6)' : '0 8px 22px -12px rgba(44,24,16,.18)');

// Imagen de producto con fondo de relleno (evita "hueco" mientras carga).
function ProdImg({ src, v, className = '' }) {
  return (
    <img
      src={src}
      alt=""
      loading="eager"
      referrerPolicy="no-referrer"
      className={`w-full h-full object-cover ${className}`}
      style={{ background: imgBg(v) }}
    />
  );
}

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
      className="flex-shrink-0 flex items-center justify-around px-3 pt-2.5 pb-3.5"
      style={{ background: v.dark ? 'rgba(10,21,18,.94)' : 'rgba(255,255,255,.96)', borderTop: `1px solid ${cardBorder(v)}`, backdropFilter: 'blur(14px)' }}
    >
      {tabs.map(({ id, icon: Icon, label, badge }) => {
        const on = id === active;
        return (
          <div key={id} className="relative flex flex-col items-center gap-1">
            {on && <span className="absolute -top-2.5 w-7 h-[3px] rounded-full" style={{ background: v.accent }} />}
            <div className="relative">
              <Icon className="w-[19px] h-[19px]" strokeWidth={on ? 2.5 : 1.8}
                style={{ color: on ? v.accent : v.dark ? 'rgba(255,255,255,.42)' : '#B8AC9C' }} />
              {badge && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[8px] font-extrabold text-white flex items-center justify-center"
                  style={{ background: v.accent, boxShadow: `0 0 0 2px ${v.dark ? '#0A1512' : '#fff'}` }}>{badge}</span>
              )}
            </div>
            <span className="text-[8px] font-bold tracking-tight" style={{ color: on ? v.accent : v.dark ? 'rgba(255,255,255,.4)' : '#B8AC9C' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Chips de categoría reutilizables.
function CategoryChips({ v, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  return (
    <div className="flex gap-1.5 overflow-hidden">
      {CATEGORIES.map((c, i) => (
        <span key={c} className={`${pad} rounded-full text-[9px] font-bold whitespace-nowrap transition-colors`}
          style={i === 0
            ? { background: v.accent, color: '#fff', boxShadow: `0 4px 12px -4px ${v.accent}99` }
            : { background: surface(v), color: fgSoft(v), border: `1px solid ${cardBorder(v)}` }}>{c}</span>
      ))}
    </div>
  );
}

// ── 1 · INICIO ────────────────────────────────────────────────────────────
export function ScreenInicio({ v }) {
  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 pt-1 pb-2.5">
          <img src={TURTLE} alt="" className={`h-[26px] w-auto object-contain ${v.dark ? 'brightness-0 invert' : ''}`} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
              <Search className="w-3.5 h-3.5" style={{ color: fgSoft(v) }} />
            </div>
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}` }}>
              <ShoppingBag className="w-3.5 h-3.5" style={{ color: v.accent }} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-bold text-white flex items-center justify-center" style={{ background: v.accent, boxShadow: `0 0 0 1.5px ${v.dark ? '#0A1512' : '#FBF7F0'}` }}>2</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 space-y-3.5">
          {/* hero */}
          <div className="relative rounded-[1.4rem] overflow-hidden h-[150px]" style={{ boxShadow: cardShadow(v) }}>
            <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(165deg,rgba(0,0,0,.05) 30%,rgba(0,0,0,.7))' }} />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider text-white" style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)' }}>
              <Leaf className="w-2.5 h-2.5" /> Hecho en Chile
            </span>
            <div className="absolute bottom-3.5 left-3.5 right-3.5">
              <p className="font-fraunces text-white text-[19px] leading-[1.05] font-semibold mb-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,.4)' }}>Regala una experiencia,<br />no un objeto</p>
              <button className="px-3.5 py-1.5 rounded-full text-[10px] font-bold text-white inline-flex items-center gap-1" style={{ background: v.accent, boxShadow: `0 6px 16px -4px ${v.accent}` }}>
                Ver catálogo <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* categorías */}
          <CategoryChips v={v} />

          {/* destacados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-extrabold" style={{ color: fg(v) }}>Lo más vendido 🔥</p>
              <span className="text-[9px] font-bold inline-flex items-center gap-0.5" style={{ color: v.accent }}>Ver todo <ChevronRight className="w-2.5 h-2.5" /></span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {MOCK_PRODUCTS.slice(0, 2).map((p) => (
                <div key={p.nombre} className="rounded-[1rem] overflow-hidden" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}`, boxShadow: cardShadow(v) }}>
                  <div className="relative aspect-square" style={{ background: imgBg(v) }}>
                    <ProdImg src={p.img} v={v} />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[7px] font-extrabold" style={{ background: 'rgba(255,255,255,.9)', color: v.green }}>★ 4.9</span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] font-bold leading-tight truncate" style={{ color: fg(v) }}>{p.nombre}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] font-extrabold" style={{ color: v.green }}>{p.precio}</p>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: v.accent, boxShadow: `0 4px 10px -3px ${v.accent}` }}>
                        <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.6} />
                      </div>
                    </div>
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
        <div className="px-4 pt-1 pb-2.5">
          <p className="font-fraunces text-xl font-semibold mb-2.5" style={{ color: fg(v) }}>Tienda</p>
          <div className="flex items-center gap-2 h-9 px-3.5 rounded-full" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}`, boxShadow: cardShadow(v) }}>
            <Search className="w-3.5 h-3.5" style={{ color: fgSoft(v) }} />
            <span className="text-[10px]" style={{ color: fgSoft(v) }}>Buscar productos…</span>
          </div>
          <div className="mt-2.5">
            <CategoryChips v={v} size="sm" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            {MOCK_PRODUCTS.slice(0, 4).map((p, i) => (
              <div key={p.nombre} className="rounded-[1rem] overflow-hidden" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}`, boxShadow: cardShadow(v) }}>
                <div className="relative aspect-square" style={{ background: imgBg(v) }}>
                  <ProdImg src={p.img} v={v} />
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(4px)' }}>
                    <Heart className={`w-3 h-3 ${i === 0 ? 'fill-current' : ''}`} style={{ color: v.accent }} />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[7px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: v.accent }}>{p.cat}</p>
                  <p className="text-[9px] font-bold leading-tight truncate" style={{ color: fg(v) }}>{p.nombre}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[11px] font-extrabold" style={{ color: v.green }}>{p.precio}</p>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: v.accent, boxShadow: `0 4px 10px -3px ${v.accent}` }}>
                      <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.6} />
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
        <div className="relative aspect-square mx-4 mt-1 rounded-[1.4rem] overflow-hidden" style={{ background: imgBg(v), boxShadow: cardShadow(v) }}>
          <ProdImg src={p.img} v={v} />
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-extrabold" style={{ background: 'rgba(255,255,255,.92)', color: v.green }}>
            <Leaf className="w-2.5 h-2.5" /> 100% reciclado
          </span>
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.92)' }}>
            <Heart className="w-3.5 h-3.5" style={{ color: v.accent }} />
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === 0 ? 14 : 6, background: i === 0 ? v.accent : v.dark ? 'rgba(255,255,255,.2)' : '#D4C4B0' }} />
          ))}
        </div>

        <div className="flex-1 px-4 pt-2.5 space-y-2">
          <p className="text-[8px] font-extrabold uppercase tracking-widest" style={{ color: v.accent }}>{p.cat}</p>
          <p className="font-fraunces text-[17px] font-semibold leading-tight" style={{ color: fg(v) }}>{p.nombre}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-current" style={{ color: '#F5A623' }} />)}
            <span className="text-[9px] ml-1 font-semibold" style={{ color: fgSoft(v) }}>4.9 · 213 reseñas</span>
          </div>
          <p className="font-fraunces text-[22px] font-bold" style={{ color: v.green }}>{p.precio}</p>
          {/* color swatches */}
          <div className="flex items-center gap-2 pt-0.5">
            {['#0F8B6C', '#1C1410', '#D96B4D', '#22D3EE'].map((c, i) => (
              <span key={c} className="w-6 h-6 rounded-full transition-all" style={{ background: c, boxShadow: i === 0 ? `0 0 0 2px ${v.bgCanvas}, 0 0 0 3.5px ${v.accent}` : 'none', border: '1px solid rgba(0,0,0,.08)' }} />
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: fgSoft(v) }}>
              <Truck className="w-3.5 h-3.5" style={{ color: v.green }} /> Envío 2-4 días
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: fgSoft(v) }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: v.green }} /> Garantía 1 año
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-3.5 pt-1">
          <button className="w-full h-12 rounded-[1.1rem] text-white text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: v.accent, boxShadow: `0 10px 24px -8px ${v.accent}` }}>
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
        <div className="px-4 pt-1 pb-2.5">
          <p className="font-fraunces text-xl font-semibold" style={{ color: fg(v) }}>Tu carrito</p>
          <p className="text-[9px] font-medium" style={{ color: fgSoft(v) }}>2 productos · plástico reciclado</p>
        </div>

        <div className="flex-1 px-4 space-y-2.5">
          {items.map((p) => (
            <div key={p.nombre} className="flex gap-2.5 p-2.5 rounded-[1rem] items-center" style={{ background: surface(v), border: `1px solid ${cardBorder(v)}`, boxShadow: cardShadow(v) }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: imgBg(v) }}>
                <ProdImg src={p.img} v={v} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold leading-tight truncate" style={{ color: fg(v) }}>{p.nombre}</p>
                <p className="text-[11px] font-extrabold mt-0.5" style={{ color: v.green }}>{p.precio}</p>
                <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-full w-fit" style={{ background: v.dark ? 'rgba(255,255,255,.07)' : '#F2EFE8' }}>
                  <Minus className="w-3 h-3" style={{ color: fgSoft(v) }} />
                  <span className="text-[9px] font-extrabold w-3 text-center" style={{ color: fg(v) }}>1</span>
                  <Plus className="w-3 h-3" style={{ color: v.accent }} />
                </div>
              </div>
            </div>
          ))}

          {/* impacto */}
          <div className="rounded-[1rem] p-3 flex items-center gap-2.5" style={{ background: v.green + '1A', border: `1px solid ${v.green}2E` }}>
            <span className="text-xl">🐢</span>
            <p className="text-[9px] font-semibold leading-snug" style={{ color: v.dark ? '#fff' : '#0B6E55' }}>
              Tu compra rescata <b>~80 tapitas</b> de plástico del océano.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-3.5 pt-2.5 space-y-1.5" style={{ borderTop: `1px solid ${cardBorder(v)}` }}>
          <div className="flex justify-between text-[10px]" style={{ color: fgSoft(v) }}>
            <span>Subtotal</span><span className="font-semibold" style={{ color: fg(v) }}>$18.980</span>
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: fgSoft(v) }}>
            <span>Envío</span><span className="font-semibold" style={{ color: v.green }}>$3.490</span>
          </div>
          <div className="flex justify-between text-[13px] font-extrabold pt-0.5">
            <span style={{ color: fg(v) }}>Total</span><span className="font-fraunces" style={{ color: v.green }}>$22.470</span>
          </div>
          <button className="w-full h-12 rounded-[1.1rem] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 mt-1" style={{ background: v.accent, boxShadow: `0 10px 24px -8px ${v.accent}` }}>
            Ir a pagar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <TabBar v={v} active="carrito" />
    </>
  );
}