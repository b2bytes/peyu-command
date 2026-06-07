import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShoppingBag, Sparkles, Recycle, Star, Zap, Leaf,
  ChevronRight, Search, ShieldCheck, Truck, Heart, Plus, Minus,
  Check, Package, Tag, Gift, ArrowLeft, X, Clock, Flame,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════
// /FunnelDesignLab v2 — 5 propuestas premium con animaciones CSS fluidas
// Cada propuesta: Home · Catálogo · Producto · Carrito completos
// ══════════════════════════════════════════════════════════════════════

const IMG = {
  c1: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-negro.webp?fit=600%2C600&ssl=1',
  c2: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/carcasa-iphon-13-pro-turquesa.webp?fit=600%2C600&ssl=1',
  c3: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-amarillo.webp?fit=600%2C600&ssl=1',
  p4: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/4-3.jpg?fit=600%2C600&ssl=1',
  p6: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/6-3.jpg?fit=600%2C600&ssl=1',
  mac: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  lamp: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/lampara-1.webp?fit=600%2C600&ssl=1',
  cacho: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/1-2.jpg?fit=600%2C600&ssl=1',
};

// CSS animations injected once
const ANIM_CSS = `
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeSlideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
@keyframes shimmerPulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes floatBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes progressFill{from{width:0}to{width:var(--w)}}
.anim-fadeup{animation:fadeSlideUp .4s cubic-bezier(.22,1,.36,1) both}
.anim-fadein{animation:fadeSlideIn .35s cubic-bezier(.22,1,.36,1) both}
.anim-popin{animation:popIn .3s cubic-bezier(.34,1.56,.64,1) both}
.anim-float{animation:floatBob 3s ease-in-out infinite}
.anim-delay-1{animation-delay:.08s}
.anim-delay-2{animation-delay:.16s}
.anim-delay-3{animation-delay:.24s}
.anim-delay-4{animation-delay:.32s}
.anim-delay-5{animation-delay:.40s}
.btn-lift{transition:transform .18s ease,box-shadow .18s ease}
.btn-lift:hover{transform:translateY(-2px);box-shadow:0 8px 24px -4px rgba(0,0,0,.18)}
.btn-lift:active{transform:translateY(0)}
.card-hover{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.card-hover:hover{transform:translateY(-4px)}
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById('dlab-styles')) return;
    const el = document.createElement('style');
    el.id = 'dlab-styles';
    el.textContent = ANIM_CSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

// Shared step navigator (tab bar inside each mockup)
function StepBar({ step, setStep, accent = '#0F8B6C', bg = '#F5F0E8', activeBg = '#fff' }) {
  const steps = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'catalogo', label: 'Catálogo', icon: '🛍' },
    { id: 'producto', label: 'Producto', icon: '📦' },
    { id: 'carrito', label: 'Carrito', icon: '🛒' },
  ];
  return (
    <div className="flex border-b" style={{ background: bg, borderColor: 'rgba(0,0,0,.08)' }}>
      {steps.map((s, i) => {
        const active = step === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-black uppercase tracking-wider transition-all relative"
            style={{
              color: active ? accent : 'rgba(0,0,0,.35)',
              background: active ? activeBg : 'transparent',
            }}
          >
            <span className="text-sm leading-none">{s.icon}</span>
            <span>{s.label}</span>
            {active && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: accent }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────── PROPUESTA 1: "Nordic Eco" ─────────────────────────
// Blancos, beige, serif editorial, mucho espacio, ultra limpio
function Proposal1() {
  const [step, setStep] = useState('home');
  const [activeColor, setActiveColor] = useState(0);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const colors = [{ hex: '#4A9B7F', name: 'Turquesa' }, { hex: '#1A1A18', name: 'Negro' }, { hex: '#E8C5B0', name: 'Rosa' }, { hex: '#2E5FA3', name: 'Azul' }];

  const handleAdd = () => { setAdded(true); setTimeout(() => setAdded(false), 2000); };

  return (
    <div className="bg-[#FAFAF8] text-[#1A1A18] rounded-3xl overflow-hidden border border-[#E8E4DC] shadow-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {/* NAV */}
      <nav className="flex items-center justify-between px-7 py-4 bg-white/80 backdrop-blur border-b border-[#E8E4DC] sticky top-0 z-10">
        <span className="text-lg font-bold tracking-tight">PEYU <span className="text-[#5B8A6F] text-sm font-normal italic">studio</span></span>
        <div className="hidden sm:flex items-center gap-7 text-sm" style={{ fontFamily: 'system-ui' }}>
          {['Tienda', 'Empresas', 'Blog'].map((n, i) => (
            <span key={n} className={`cursor-pointer transition-colors ${i === 0 ? 'text-[#1A1A18] font-bold' : 'text-[#9B9B8C] hover:text-[#1A1A18]'}`}>{n}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-[#E8E4DC] flex items-center justify-center hover:bg-[#F5F3EE] transition-colors cursor-pointer">
            <Search className="w-4 h-4 text-[#9B9B8C]" />
          </div>
          <div className="relative w-9 h-9 rounded-full border border-[#E8E4DC] flex items-center justify-center hover:bg-[#F5F3EE] transition-colors cursor-pointer">
            <ShoppingBag className="w-4 h-4 text-[#1A1A18]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#5B8A6F] text-white text-[8px] font-black rounded-full flex items-center justify-center">2</span>
          </div>
        </div>
      </nav>
      <StepBar step={step} setStep={setStep} accent="#5B8A6F" bg="#F5F3EE" activeBg="#FAFAF8" />

      {step === 'home' && (
        <div>
          {/* Hero split */}
          <div className="grid sm:grid-cols-2">
            <div className="px-8 sm:px-12 py-12 sm:py-16 flex flex-col justify-center anim-fadeup">
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#9B9B8C] mb-4" style={{ fontFamily: 'system-ui' }}>
                Santiago · 100% reciclado
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] mb-5">
                Objetos que<br />
                <em className="not-italic" style={{ color: '#5B8A6F' }}>cuidan</em><br />
                el planeta.
              </h1>
              <p className="text-[#6B6B60] text-sm leading-relaxed mb-8 max-w-xs" style={{ fontFamily: 'system-ui' }}>
                Fabricados con tapitas plásticas recicladas. Grabado láser gratis desde 10 unidades.
              </p>
              <div className="flex gap-3 flex-wrap" style={{ fontFamily: 'system-ui' }}>
                <button onClick={() => setStep('catalogo')} className="btn-lift px-7 py-3.5 bg-[#1A1A18] text-white text-sm font-bold rounded-full">
                  Explorar tienda →
                </button>
                <button onClick={() => setStep('producto')} className="btn-lift px-6 py-3.5 border-2 border-[#E8E4DC] text-sm font-bold rounded-full text-[#1A1A18] hover:bg-[#F5F3EE] transition-colors">
                  Personalizar ✦
                </button>
              </div>
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-[#E8E4DC]" style={{ fontFamily: 'system-ui' }}>
                {[['12K+', 'Vendidos'], ['98%', 'Satisfacción'], ['10 años', 'Garantía']].map(([n, l]) => (
                  <div key={n}>
                    <p className="text-lg font-bold text-[#1A1A18]">{n}</p>
                    <p className="text-[10px] text-[#9B9B8C]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative bg-[#EDE9E0] flex items-center justify-center min-h-[280px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5B8A6F]/5 to-transparent" />
              <img src={IMG.c2} alt="" className="anim-float w-52 h-52 object-contain drop-shadow-2xl relative z-10" />
              <div className="anim-popin anim-delay-3 absolute top-6 right-6 bg-white/95 backdrop-blur rounded-2xl px-3.5 py-2.5 shadow-xl border border-[#E8E4DC]" style={{ fontFamily: 'system-ui' }}>
                <p className="text-[10px] font-bold text-[#5B8A6F]">✦ Logo gratis</p>
                <p className="text-[10px] text-[#6B6B60]">desde 10 unidades</p>
              </div>
              <div className="anim-popin anim-delay-4 absolute bottom-6 left-6 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-[#E8E4DC]" style={{ fontFamily: 'system-ui' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  {Array(5).fill(0).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-[#F0B429] text-[#F0B429]" />)}
                </div>
                <p className="text-[10px] text-[#6B6B60]">"El mejor regalo eco"</p>
              </div>
            </div>
          </div>
          {/* Categorías */}
          <div className="px-8 py-10 border-t border-[#E8E4DC]" style={{ fontFamily: 'system-ui' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Colecciones</h2>
              <button onClick={() => setStep('catalogo')} className="text-xs text-[#5B8A6F] font-bold flex items-center gap-1 hover:gap-2 transition-all">Ver todo <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[[IMG.c1, 'Carcasas', '69 modelos'], [IMG.p4, 'Entretenimiento', 'Cachos y juegos'], [IMG.mac, 'Hogar', 'Maceteros'], [IMG.lamp, 'Escritorio', 'Lámparas']].map(([img, n, d], idx) => (
                <div key={n} onClick={() => setStep('catalogo')} className={`card-hover group relative overflow-hidden rounded-2xl aspect-square bg-[#EDE9E0] cursor-pointer anim-fadeup anim-delay-${idx + 1}`}>
                  <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm">{n}</p>
                    <p className="text-white/65 text-[10px]">{d}</p>
                  </div>
                  <div className="absolute top-3 right-3 w-7 h-7 bg-white/0 group-hover:bg-white/90 rounded-full flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3 h-3 text-[#1A1A18] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'catalogo' && (
        <div className="p-6 anim-fadeup" style={{ fontFamily: 'system-ui' }}>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep('home')} className="w-8 h-8 rounded-full border border-[#E8E4DC] flex items-center justify-center hover:bg-[#F5F3EE] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h1 className="text-2xl font-bold flex-1" style={{ fontFamily: 'Georgia, serif' }}>Nuestra tienda</h1>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E4DC] rounded-full text-sm text-[#9B9B8C] hover:border-[#5B8A6F]/40 transition-colors cursor-pointer">
              <Search className="w-4 h-4" /><span>Buscar...</span>
            </div>
          </div>
          {/* Chips */}
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {['Todos', 'Carcasas', 'Entretenimiento', 'Hogar', 'Escritorio'].map((c, i) => (
              <button key={c} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all btn-lift ${i === 0 ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-white border-[#E8E4DC] text-[#6B6B60] hover:border-[#1A1A18]/30'}`}>{c}</button>
            ))}
          </div>
          <p className="text-xs text-[#9B9B8C] mb-3 font-semibold">6 productos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[[IMG.c1, 'Carcasa iPhone 16', '$8.990', 'Negro', '🔥'],
              [IMG.c2, 'Carcasa iPhone 13 Pro', '$8.990', 'Turquesa', ''],
              [IMG.p4, 'Pack 4 Cachos', '$19.990', 'Natural', '⭐'],
              [IMG.mac, 'Macetero XL', '$14.990', 'Verde', ''],
              [IMG.lamp, 'Lámpara Eco', '$22.990', 'Blanco', ''],
              [IMG.cacho, 'Cacho Unitario', '$4.990', 'Mix', '']
            ].map(([img, n, p, c, badge], idx) => (
              <div key={n} onClick={() => setStep('producto')} className={`card-hover group bg-white rounded-3xl border border-[#E8E4DC] overflow-hidden cursor-pointer anim-popin anim-delay-${idx % 5 + 1}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <div className="relative aspect-square bg-[#F5F3EE] overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {badge && <span className="absolute top-2.5 left-2.5 text-sm bg-white/90 rounded-full px-2 py-0.5">{badge} Popular</span>}
                  <button className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                    <Heart className="w-3.5 h-3.5 text-[#1A1A18]" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-[#9B9B8C] mb-0.5">{c}</p>
                  <p className="font-bold text-sm line-clamp-1 mb-3">{n}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base">{p}</span>
                    <button className="w-8 h-8 bg-[#1A1A18] text-white rounded-full flex items-center justify-center hover:bg-[#333] btn-lift">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'producto' && (
        <div className="grid sm:grid-cols-2 anim-fadein" style={{ fontFamily: 'system-ui' }}>
          <div className="bg-[#EDE9E0] flex flex-col items-center justify-center p-10 min-h-[360px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5B8A6F]/8 to-transparent" />
            <img src={IMG.c2} alt="" className="anim-float w-52 h-52 object-contain drop-shadow-2xl relative z-10" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.2))' }} />
            <div className="flex gap-2 mt-6 z-10">
              {colors.map((c, i) => (
                <button key={c.hex} onClick={() => setActiveColor(i)}
                  style={{ background: c.hex }}
                  className={`w-7 h-7 rounded-full border-4 transition-all ${activeColor === i ? 'border-[#1A1A18] scale-110' : 'border-white/60 hover:scale-105'}`}
                />
              ))}
            </div>
            <p className="text-xs text-[#6B6B60] mt-2 z-10">{colors[activeColor].name}</p>
          </div>
          <div className="p-8 space-y-5 overflow-y-auto">
            <button onClick={() => setStep('catalogo')} className="flex items-center gap-1 text-xs text-[#9B9B8C] hover:text-[#1A1A18] transition-colors mb-1">
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9B9B8C] mb-1">Carcasa Biodegradable</p>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Carcasa iPhone 13 Pro</h1>
              <div className="flex items-center gap-1 mb-3">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#F0B429] text-[#F0B429]" />)}
                <span className="text-xs text-[#9B9B8C] ml-1.5">4.9 · (48 reseñas)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">$8.990</p>
                <p className="text-sm text-[#9B9B8C] line-through">$11.990</p>
                <span className="text-xs font-bold text-white bg-[#5B8A6F] px-2 py-0.5 rounded-full">−25%</span>
              </div>
            </div>
            {/* Qty */}
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold">Cantidad</p>
              <div className="flex items-center border-2 border-[#E8E4DC] rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F3EE] transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F3EE] transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {qty >= 2 && <span className="text-xs font-bold text-[#5B8A6F] bg-[#5B8A6F]/10 px-2 py-1 rounded-full">−10% desde 2u</span>}
            </div>
            {/* Personalización */}
            <div className="bg-[#F5F3EE] border border-[#E8E4DC] rounded-2xl p-4">
              <p className="text-sm font-bold mb-1">✨ Grabado láser</p>
              <p className="text-[11px] text-[#9B9B8C] mb-3">Gratis desde 10u · Sin tintas · Permanente</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase', 'Diseño PEYU', 'Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold border-2 border-[#E8E4DC] bg-white rounded-xl py-2 hover:border-[#5B8A6F] hover:text-[#5B8A6F] transition-all">{t}</button>
                ))}
              </div>
            </div>
            {/* CTA */}
            <button onClick={() => { handleAdd(); setTimeout(() => setStep('carrito'), 600); }}
              className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 btn-lift transition-all"
              style={{ background: added ? '#5B8A6F' : '#1A1A18', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
              {added ? <><Check className="w-4 h-4" /> ¡Agregado!</> : <><ShoppingBag className="w-4 h-4" /> Agregar · ${(8990 * qty).toLocaleString()}</>}
            </button>
            <div className="grid grid-cols-3 gap-2">
              {[['🌱', 'Reciclado'], ['🚚', 'BlueExpress'], ['🔒', 'Seguro']].map(([e, t]) => (
                <div key={t} className="text-center p-2 bg-[#F5F3EE] rounded-xl">
                  <p className="text-lg">{e}</p>
                  <p className="text-[10px] text-[#9B9B8C] font-semibold mt-0.5">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'carrito' && (
        <div className="anim-fadeup p-0" style={{ fontFamily: 'system-ui' }}>
          {/* Progress */}
          <div className="px-6 py-3 bg-[#5B8A6F]/8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B8A6F]">
              <Check className="w-3.5 h-3.5" /> Carrito → <span className="text-[#9B9B8C] font-normal">Datos → Pago → Confirmación</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-5 gap-0">
            <div className="sm:col-span-3 p-6 space-y-3 border-r border-[#E8E4DC]">
              <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Tu carrito <span className="text-[#9B9B8C] text-lg font-normal">(2)</span></h1>
              {[[IMG.c2, 'Carcasa iPhone 13 Pro', 'Turquesa · Frase grabada', '$8.990', true],
                [IMG.p4, 'Pack 4 Cachos', 'Natural', '$19.990', false]].map(([img, n, c, p, pers]) => (
                <div key={n} className="card-hover flex gap-4 p-4 bg-white border border-[#E8E4DC] rounded-2xl">
                  <div className="relative flex-shrink-0 w-18 h-18">
                    <img src={img} alt="" className="w-16 h-16 object-contain bg-[#F5F3EE] rounded-xl" />
                    {pers && <span className="absolute -top-1 -right-1 bg-[#5B8A6F] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">✦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm line-clamp-1">{n}</p>
                      <button className="text-[#9B9B8C] hover:text-[#D96B4D] transition-colors flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#9B9B8C] mt-0.5">{c}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#E8E4DC] rounded-lg overflow-hidden">
                        <button className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F3EE]"><Minus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-xs font-bold">1</span>
                        <button className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F3EE]"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold">{p}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Discount teaser */}
              <div className="flex items-center gap-2 bg-[#5B8A6F]/8 border border-[#5B8A6F]/20 rounded-xl px-3 py-2.5">
                <Tag className="w-4 h-4 text-[#5B8A6F] flex-shrink-0" />
                <p className="text-xs font-bold text-[#5B8A6F]">¡Agrega 1 más y obtén −10% en tu pedido!</p>
              </div>
            </div>
            <div className="sm:col-span-2 p-6 bg-[#FAFAF8]">
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Georgia, serif' }}>Resumen</h2>
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-[#6B6B60]"><span>Subtotal (2 items)</span><span>$28.980</span></div>
                <div className="flex justify-between font-bold text-[#5B8A6F] bg-[#5B8A6F]/5 px-2 py-1 rounded-lg"><span>🎉 Descuento −10%</span><span>−$2.898</span></div>
                <div className="flex justify-between text-[#9B9B8C] text-xs"><span>Envío</span><span>Se calcula al pagar</span></div>
                <div className="flex justify-between font-bold text-xl pt-3 border-t border-[#E8E4DC] mt-2">
                  <span>Total</span><span>$26.082</span>
                </div>
                <p className="text-[10px] text-[#9B9B8C]">IVA incluido</p>
              </div>
              <button onClick={() => {}} className="w-full py-4 bg-[#1A1A18] text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 btn-lift mb-3">
                Ir a pagar <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#9B9B8C]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5B8A6F]" /> Pago seguro · WebPay · MP
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────── PROPUESTA 2: "Dark Commerce" ──────────────────────
// Negro profundo · acento verde néon · tipografía sin bold
function Proposal2() {
  const [step, setStep] = useState('home');
  const [activeColor, setActiveColor] = useState(0);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const colors = [{ hex: '#4A9B7F', name: 'Turquesa' }, { hex: '#0D0D0D', name: 'Negro' }, { hex: '#D4C4B0', name: 'Beige' }, { hex: '#2E5FA3', name: 'Azul' }];
  const handleAdd = () => { setAdded(true); setTimeout(() => { setAdded(false); setStep('carrito'); }, 1000); };

  return (
    <div className="bg-[#080808] text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
      <nav className="flex items-center justify-between px-7 py-4 bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <span className="font-black text-lg tracking-tight">
          PEYU<span style={{ color: '#00E5A0' }}>.</span>
        </span>
        <div className="hidden sm:flex items-center gap-7 text-sm text-white/50">
          {['Tienda', 'Empresas', 'Blog'].map((n, i) => (
            <span key={n} className={`cursor-pointer transition-colors ${i === 0 ? 'text-white font-bold' : 'hover:text-white/80'}`}>{n}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer border border-white/10">
            <Search className="w-4 h-4 text-white/60" />
          </div>
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,229,160,.15)', border: '1px solid rgba(0,229,160,.3)' }}>
            <ShoppingBag className="w-4 h-4" style={{ color: '#00E5A0' }} />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-black text-[8px] font-black rounded-full flex items-center justify-center" style={{ background: '#00E5A0' }}>2</span>
          </div>
        </div>
      </nav>
      <StepBar step={step} setStep={setStep} accent="#00E5A0" bg="#111" activeBg="#0D0D0D" />

      {step === 'home' && (
        <div>
          {/* Hero */}
          <div className="relative px-8 sm:px-16 py-14 overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,160,.06) 0%, transparent 70%)' }} />
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(0,229,160,.04)', transform: 'translate(30%,-40%)' }} />
            <div className="relative z-10 grid sm:grid-cols-2 gap-8 items-center">
              <div className="anim-fadeup">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6 border" style={{ background: 'rgba(0,229,160,.1)', borderColor: 'rgba(0,229,160,.25)' }}>
                  <Zap className="w-3 h-3" style={{ color: '#00E5A0' }} />
                  <span className="text-xs font-bold" style={{ color: '#00E5A0' }}>Plástico 100% reciclado · Chile 🇨🇱</span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-black leading-[0.9] mb-6">
                  Diseño<br />que<br /><span style={{ color: '#00E5A0' }}>cuida.</span>
                </h1>
                <p className="text-white/55 text-base mb-8 max-w-sm leading-relaxed">
                  Personaliza productos eco con tu logo. Grabado láser gratis desde 10u.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setStep('catalogo')} className="btn-lift px-8 py-3.5 font-black rounded-2xl text-sm text-black" style={{ background: '#00E5A0', boxShadow: '0 8px 32px rgba(0,229,160,.3)' }}>
                    Explorar →
                  </button>
                  <button onClick={() => setStep('producto')} className="btn-lift px-6 py-3.5 font-bold rounded-2xl text-sm border" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)' }}>
                    <Sparkles className="w-4 h-4 inline mr-1.5" />Personalizar
                  </button>
                </div>
              </div>
              <div className="flex justify-center anim-popin anim-delay-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-3xl scale-125" style={{ background: 'rgba(0,229,160,.08)' }} />
                  <img src={IMG.c2} alt="" className="anim-float w-48 h-48 object-contain relative z-10 drop-shadow-2xl" />
                  <div className="anim-popin anim-delay-4 absolute -bottom-3 -left-4 rounded-2xl p-3 border" style={{ background: '#111', borderColor: 'rgba(255,255,255,.15)', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#00E5A0' }}>🔥 Más vendido</p>
                    <p className="text-xs font-bold text-white">Carcasa iPhone 16</p>
                    <p className="text-lg font-black" style={{ color: '#00E5A0' }}>$8.990</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Grid categorías */}
          <div className="px-8 pb-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[[IMG.c1, '📱 Carcasas', '69 modelos'], [IMG.p4, '🎲 Entretenimiento', 'Cachos'], [IMG.mac, '🌿 Hogar', 'Maceteros'], [IMG.lamp, '💡 Escritorio', 'Lámparas']].map(([img, n, d], i) => (
              <div key={n} onClick={() => setStep('catalogo')} className={`card-hover group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer border anim-popin anim-delay-${i + 1}`} style={{ background: '#111', borderColor: 'rgba(255,255,255,.08)' }}>
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-75 group-hover:scale-105 transition-all duration-600" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-sm font-black text-white">{n}</p>
                  <p className="text-[10px] text-white/45">{d}</p>
                </div>
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center" style={{ background: '#00E5A0' }}>
                  <ArrowRight className="w-3 h-3 text-black" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'catalogo' && (
        <div className="p-6 anim-fadeup">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep('home')} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h1 className="text-2xl font-black flex-1">Tienda</h1>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50 border cursor-pointer" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)' }}>
              <Search className="w-4 h-4" /><span>Buscar...</span>
            </div>
          </div>
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {['Todos', 'Carcasas', 'Entretenimiento', 'Hogar', 'Escritorio'].map((c, i) => (
              <button key={c} className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all btn-lift border"
                style={{ background: i === 0 ? '#00E5A0' : 'rgba(255,255,255,.08)', color: i === 0 ? '#000' : 'rgba(255,255,255,.6)', borderColor: i === 0 ? '#00E5A0' : 'rgba(255,255,255,.12)' }}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[[IMG.c1, 'Carcasa iPhone 16', '$8.990', '🔥'], [IMG.c2, 'Carcasa iPhone 13', '$8.990', ''],
              [IMG.p4, 'Pack 4 Cachos', '$19.990', '⭐'], [IMG.mac, 'Macetero XL', '$14.990', ''],
              [IMG.lamp, 'Lámpara Eco', '$22.990', ''], [IMG.cacho, 'Cacho Unitario', '$4.990', '']
            ].map(([img, n, p, badge], idx) => (
              <div key={n} onClick={() => setStep('producto')} className={`card-hover group rounded-2xl overflow-hidden cursor-pointer border anim-popin anim-delay-${idx % 5 + 1}`} style={{ background: '#111', borderColor: 'rgba(255,255,255,.1)' }}>
                <div className="aspect-square flex items-center justify-center p-4 relative" style={{ background: 'rgba(255,255,255,.04)' }}>
                  <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-400" />
                  {badge && <span className="absolute top-2 left-2 text-sm">{badge}</span>}
                </div>
                <div className="p-3.5 border-t" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
                  <p className="font-bold text-sm line-clamp-1 mb-2 text-white">{n}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base" style={{ color: '#00E5A0' }}>{p}</span>
                    <button className="w-8 h-8 rounded-xl flex items-center justify-center btn-lift text-black" style={{ background: '#00E5A0' }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'producto' && (
        <div className="grid sm:grid-cols-2 anim-fadein">
          <div className="flex flex-col items-center justify-center p-10 min-h-[360px] relative border-r" style={{ background: '#0D0D0D', borderColor: 'rgba(255,255,255,.08)' }}>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,160,.06) 0%, transparent 65%)' }} />
            <img src={IMG.c2} alt="" className="anim-float w-52 h-52 object-contain drop-shadow-2xl relative z-10" />
            <div className="flex gap-2.5 mt-6 z-10">
              {colors.map((c, i) => (
                <button key={c.hex} onClick={() => setActiveColor(i)} style={{ background: c.hex }}
                  className={`w-8 h-8 rounded-xl border-2 transition-all btn-lift ${activeColor === i ? 'scale-115' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  style={{ background: c.hex, border: activeColor === i ? '2px solid #00E5A0' : '2px solid transparent' }}
                />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2 z-10">{colors[activeColor].name}</p>
          </div>
          <div className="p-8 space-y-5" style={{ background: '#0A0A0A' }}>
            <button onClick={() => setStep('catalogo')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/80 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ color: '#00E5A0', background: 'rgba(0,229,160,.1)' }}>🔥 Más vendido</span>
              <h1 className="text-2xl font-black mt-3 mb-2">Carcasa iPhone 13 Pro</h1>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black" style={{ color: '#00E5A0' }}>$8.990</p>
                <p className="text-sm text-white/30 line-through">$11.990</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-white/60">Cantidad</p>
              <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,.15)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {qty >= 2 && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: '#00E5A0', background: 'rgba(0,229,160,.1)' }}>−10%</span>}
            </div>
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.1)' }}>
              <p className="text-sm font-bold flex items-center gap-1.5 mb-3"><Sparkles className="w-4 h-4" style={{ color: '#00E5A0' }} /> Grabado láser</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase', 'Diseño', 'Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold rounded-xl py-2.5 border transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.65)' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleAdd} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 btn-lift"
              style={{ background: added ? '#00B87A' : '#00E5A0', color: '#000', boxShadow: '0 8px 32px rgba(0,229,160,.25)' }}>
              {added ? <><Check className="w-4 h-4" /> ¡Agregado!</> : <><ShoppingBag className="w-4 h-4" /> Agregar · ${(8990 * qty).toLocaleString()}</>}
            </button>
            <div className="grid grid-cols-3 gap-2">
              {[['🌱', 'Reciclado'], ['🚚', 'BlueExpress'], ['🔒', 'Seguro']].map(([e, t]) => (
                <div key={t} className="text-center p-2 rounded-xl border" style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.08)' }}>
                  <p className="text-base">{e}</p>
                  <p className="text-[9px] text-white/40 font-bold mt-0.5">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'carrito' && (
        <div className="anim-fadeup">
          <div className="px-6 py-3 border-b flex items-center gap-2 text-xs font-bold" style={{ background: 'rgba(0,229,160,.06)', borderColor: 'rgba(255,255,255,.08)', color: '#00E5A0' }}>
            <Check className="w-3.5 h-3.5" /> Carrito → <span className="text-white/30 font-normal">Datos → Pago → Confirmación</span>
          </div>
          <div className="grid sm:grid-cols-5 gap-0">
            <div className="sm:col-span-3 p-6 space-y-3 border-r" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <h1 className="text-2xl font-black mb-4">Carrito <span style={{ color: '#00E5A0' }}>(2)</span></h1>
              {[[IMG.c2, 'Carcasa iPhone 13 Pro', 'Turquesa · Grabado frase', '$8.990'],
                [IMG.p4, 'Pack 4 Cachos', 'Natural', '$19.990']].map(([img, n, c, p]) => (
                <div key={n} className="flex gap-4 p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.1)' }}>
                  <img src={img} alt="" className="w-16 h-16 object-contain rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm">{n}</p>
                      <button className="text-white/30 hover:text-white/70 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{c}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,.15)' }}>
                        <button className="w-7 h-7 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Minus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-xs font-bold">1</span>
                        <button className="w-7 h-7 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-black" style={{ color: '#00E5A0' }}>{p}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border" style={{ background: 'rgba(0,229,160,.06)', borderColor: 'rgba(0,229,160,.2)' }}>
                <Tag className="w-4 h-4 flex-shrink-0" style={{ color: '#00E5A0' }} />
                <p className="text-xs font-bold" style={{ color: '#00E5A0' }}>+1 ítem = −10% en todo el pedido</p>
              </div>
            </div>
            <div className="sm:col-span-2 p-6" style={{ background: '#0D0D0D' }}>
              <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.12)' }}>
                <h2 className="font-black text-lg mb-4">Resumen</h2>
                <div className="space-y-2.5 text-sm mb-4">
                  <div className="flex justify-between text-white/55"><span>Subtotal</span><span>$28.980</span></div>
                  <div className="flex justify-between font-bold rounded-lg px-2 py-1" style={{ color: '#00E5A0', background: 'rgba(0,229,160,.08)' }}>
                    <span>🎉 Descuento</span><span>−$2.898</span>
                  </div>
                  <div className="flex justify-between font-black text-xl pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                    <span>Total</span><span style={{ color: '#00E5A0' }}>$26.082</span>
                  </div>
                </div>
                <button className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 btn-lift mb-3 text-black"
                  style={{ background: '#00E5A0', boxShadow: '0 8px 24px rgba(0,229,160,.2)' }}>
                  Pagar ahora <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[10px] text-white/30 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" style={{ color: '#00E5A0' }} /> Pago seguro · WebPay · MP
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────── PROPUESTA 3: "Warm Clay" ─────────────────────────
function Proposal3() {
  const [step, setStep] = useState('home');
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const handleAdd = () => { setAdded(true); setTimeout(() => { setAdded(false); setStep('carrito'); }, 900); };
  return (
    <div className="rounded-3xl overflow-hidden border shadow-2xl" style={{ background: '#F8F3ED', color: '#2C1810', borderColor: '#D4C4B0', fontFamily: 'Georgia, serif' }}>
      <nav className="flex items-center justify-between px-7 py-4 bg-white/80 backdrop-blur border-b sticky top-0 z-10" style={{ borderColor: '#D4C4B0' }}>
        <div>
          <span className="text-lg font-bold">PEYU</span>
          <span className="text-xs ml-2 italic" style={{ color: '#A08070' }}>· eco</span>
        </div>
        <div className="hidden sm:flex items-center gap-7 text-sm" style={{ fontFamily: 'system-ui', color: '#7A6050' }}>
          {['Tienda', 'Empresas', 'Nosotros'].map((n, i) => (
            <span key={n} className="cursor-pointer" style={i === 0 ? { color: '#2C1810', fontWeight: 700, textDecoration: 'underline', textDecorationColor: '#C0785C', textUnderlineOffset: 4 } : {}}>{n}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 cursor-pointer" style={{ color: '#A08070' }} />
          <div className="relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'rgba(192,120,92,.12)' }}>
            <ShoppingBag className="w-4 h-4" style={{ color: '#C0785C' }} />
            <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-black rounded-full flex items-center justify-center" style={{ background: '#C0785C' }}>2</span>
          </div>
        </div>
      </nav>
      <StepBar step={step} setStep={setStep} accent="#C0785C" bg="#F2EBE1" activeBg="#F8F3ED" />

      {step === 'home' && (
        <div>
          <div className="relative overflow-hidden px-8 sm:px-16 py-14">
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20" style={{ background: '#C0785C' }} />
            <div className="absolute bottom-0 left-24 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: '#8BAD8A' }} />
            <div className="relative grid sm:grid-cols-2 gap-10 items-center">
              <div className="anim-fadeup">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5" style={{ background: 'rgba(139,173,138,.15)', color: '#5B7D5A', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700 }}>
                  <Leaf className="w-3 h-3" /> Fabricado con tapitas recicladas
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-5">
                  Objetos con<br /><em style={{ color: '#C0785C' }}>alma</em><br />y propósito.
                </h1>
                <p className="text-sm leading-relaxed mb-7 max-w-sm" style={{ color: '#7A6050', fontFamily: 'system-ui' }}>
                  Cada producto contiene tapitas que habrían terminado en el océano. Personaliza con tu logo.
                </p>
                <div className="flex gap-3" style={{ fontFamily: 'system-ui' }}>
                  <button onClick={() => setStep('catalogo')} className="btn-lift px-7 py-3.5 text-white font-bold rounded-2xl text-sm" style={{ background: '#C0785C', boxShadow: '0 8px 24px rgba(192,120,92,.3)' }}>
                    Descubrir →
                  </button>
                  <button onClick={() => setStep('producto')} className="btn-lift px-6 py-3.5 font-bold rounded-2xl text-sm border-2" style={{ borderColor: '#D4C4B0', color: '#2C1810', background: 'white' }}>
                    Personalizar ✨
                  </button>
                </div>
              </div>
              <div className="flex justify-center anim-popin anim-delay-2">
                <div className="relative">
                  <div className="w-52 h-52 rounded-full flex items-center justify-center" style={{ background: '#D4C4B0' }}>
                    <img src={IMG.c2} alt="" className="anim-float w-44 h-44 object-contain drop-shadow-xl" />
                  </div>
                  <div className="anim-popin anim-delay-4 absolute -bottom-4 -right-4 rounded-2xl px-3.5 py-2.5 shadow-xl border" style={{ background: 'white', borderColor: '#D4C4B0', fontFamily: 'system-ui' }}>
                    <p className="text-xs font-bold" style={{ color: '#C0785C' }}>♻️ 12 tapitas</p>
                    <p className="text-[10px]" style={{ color: '#7A6050' }}>en este producto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 pb-12 grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ fontFamily: 'system-ui' }}>
            {[[IMG.c1, 'Carcasas', '69'], [IMG.p4, 'Entretenimiento', 'Cachos'], [IMG.mac, 'Hogar', 'Maceteros'], [IMG.lamp, 'Escritorio', 'Lámparas']].map(([img, n, d], i) => (
              <div key={n} onClick={() => setStep('catalogo')} className={`card-hover group text-center cursor-pointer anim-popin anim-delay-${i + 1}`}>
                <div className="w-full aspect-square rounded-full flex items-center justify-center mb-3 overflow-hidden transition-all group-hover:scale-105" style={{ background: '#EDE3D6' }}>
                  <img src={img} alt="" className="w-3/4 h-3/4 object-contain transition-transform duration-400 group-hover:scale-110" />
                </div>
                <p className="font-bold text-sm">{n}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#A08070' }}>{d}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-8 py-5" style={{ background: '#C0785C' }}>
            <div style={{ fontFamily: 'system-ui' }}>
              <p className="font-black text-white text-base">🎁 Grabado láser GRATIS</p>
              <p className="text-white/80 text-sm">Desde 10 unidades · Sin tintas · Para siempre</p>
            </div>
            <button onClick={() => setStep('producto')} className="btn-lift font-bold px-5 py-2.5 rounded-2xl text-sm flex-shrink-0" style={{ background: 'white', color: '#C0785C', fontFamily: 'system-ui' }}>Ver más →</button>
          </div>
        </div>
      )}

      {step === 'catalogo' && (
        <div className="p-6 anim-fadeup" style={{ fontFamily: 'system-ui' }}>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep('home')} className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#D4C4B0' }}>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h1 className="text-2xl font-bold flex-1" style={{ fontFamily: 'Georgia, serif' }}>Nuestra tienda</h1>
          </div>
          <div className="flex gap-2 flex-wrap mb-6">
            {['Todos', 'Carcasas', 'Entretenimiento', 'Hogar', 'Escritorio'].map((c, i) => (
              <button key={c} className="btn-lift px-5 py-2 rounded-full text-sm font-bold border-2 transition-all"
                style={{ background: i === 0 ? '#C0785C' : 'white', color: i === 0 ? 'white' : '#7A6050', borderColor: i === 0 ? '#C0785C' : '#D4C4B0' }}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[[IMG.c1, 'Carcasa iPhone 16', '$8.990'], [IMG.c2, 'Carcasa iPhone 13 Pro', '$8.990'],
              [IMG.p4, 'Pack 4 Cachos', '$19.990'], [IMG.mac, 'Macetero XL', '$14.990'],
              [IMG.lamp, 'Lámpara Eco', '$22.990'], [IMG.cacho, 'Cacho Unitario', '$4.990']
            ].map(([img, n, p], idx) => (
              <div key={n} onClick={() => setStep('producto')} className={`card-hover group bg-white rounded-3xl border overflow-hidden cursor-pointer anim-popin anim-delay-${idx % 5 + 1}`} style={{ borderColor: '#D4C4B0', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div className="aspect-square flex items-center justify-center p-4 overflow-hidden" style={{ background: '#F2EBE1' }}>
                  <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm line-clamp-1 mb-3">{n}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: '#C0785C' }}>{p}</span>
                    <button className="text-xs font-bold px-3 py-1.5 rounded-full btn-lift" style={{ background: 'rgba(192,120,92,.1)', color: '#C0785C' }}>Ver →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'producto' && (
        <div className="grid sm:grid-cols-2 anim-fadein" style={{ fontFamily: 'system-ui' }}>
          <div className="flex flex-col items-center justify-center p-10 min-h-[360px]" style={{ background: '#EDE3D6' }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl scale-150 opacity-30" style={{ background: '#C0785C' }} />
              <img src={IMG.c2} alt="" className="anim-float w-52 h-52 object-contain drop-shadow-2xl relative z-10" />
            </div>
            <div className="flex gap-2 mt-6">
              {[{ hex: '#4A9B7F', n: 'Turquesa' }, { hex: '#2C1810', n: 'Negro' }, { hex: '#D4C4B0', n: 'Beige' }, { hex: '#5B7D5A', n: 'Verde' }].map((c, i) => (
                <button key={c.hex} style={{ background: c.hex }} className="w-8 h-8 rounded-full border-4 border-white shadow-md hover:scale-115 transition-transform btn-lift" />
              ))}
            </div>
          </div>
          <div className="p-8 space-y-5">
            <button onClick={() => setStep('catalogo')} className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: '#A08070' }}>
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#8BAD8A' }}>♻️ Plástico reciclado · 12 tapitas</p>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Carcasa iPhone 13 Pro</h1>
              <div className="flex items-center gap-1 mb-3">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#F0B429] text-[#F0B429]" />)}
                <span className="text-xs ml-1" style={{ color: '#A08070' }}>(48)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold" style={{ color: '#C0785C' }}>$8.990</p>
                <p className="text-sm line-through" style={{ color: '#B0A090' }}>$11.990</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold" style={{ color: '#7A6050' }}>Cantidad</p>
              <div className="flex items-center rounded-full overflow-hidden border-2" style={{ borderColor: '#D4C4B0' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center" style={{ background: '#F2EBE1' }}><Minus className="w-3.5 h-3.5" /></button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center" style={{ background: '#F2EBE1' }}><Plus className="w-3.5 h-3.5" /></button>
              </div>
              {qty >= 2 && <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: '#8BAD8A' }}>−10%</span>}
            </div>
            <div className="rounded-2xl p-4 border-2" style={{ background: '#F2EBE1', borderColor: '#D4C4B0' }}>
              <p className="text-sm font-bold mb-1">✨ Grabado láser</p>
              <p className="text-[11px] mb-3" style={{ color: '#A08070' }}>Gratis desde 10u · Sin tintas · Para siempre</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase', 'Diseño PEYU', 'Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold border-2 bg-white rounded-xl py-2 hover:border-[#C0785C] hover:text-[#C0785C] transition-all" style={{ borderColor: '#D4C4B0' }}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={handleAdd} className="w-full py-4 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 btn-lift"
              style={{ background: added ? '#8BAD8A' : '#C0785C', boxShadow: '0 8px 24px rgba(192,120,92,.25)' }}>
              {added ? <><Check className="w-4 h-4" /> ¡Agregado!</> : <><ShoppingBag className="w-4 h-4" /> Agregar · ${(8990 * qty).toLocaleString()}</>}
            </button>
          </div>
        </div>
      )}

      {step === 'carrito' && (
        <div className="anim-fadeup p-6" style={{ fontFamily: 'system-ui' }}>
          <div className="flex items-center gap-3 mb-5">
            <ShoppingBag className="w-5 h-5" style={{ color: '#C0785C' }} />
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Tu carrito <span style={{ color: '#A08070', fontSize: '1rem', fontFamily: 'system-ui' }}>(2 items)</span></h1>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2 space-y-3">
              {[[IMG.c2, 'Carcasa iPhone 13 Pro', 'Turquesa · Frase grabada', '$8.990'],
                [IMG.p4, 'Pack 4 Cachos', 'Natural', '$19.990']].map(([img, n, c, p]) => (
                <div key={n} className="card-hover flex gap-4 bg-white border-2 rounded-2xl p-4" style={{ borderColor: '#D4C4B0' }}>
                  <img src={img} alt="" className="w-20 h-20 object-contain rounded-xl flex-shrink-0" style={{ background: '#F2EBE1' }} />
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="font-bold">{n}</p>
                      <button style={{ color: '#A08070' }}><X className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{c}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center rounded-full overflow-hidden border-2" style={{ borderColor: '#D4C4B0' }}>
                        <button className="w-8 h-8 flex items-center justify-center" style={{ background: '#F2EBE1' }}><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center font-bold text-sm">1</span>
                        <button className="w-8 h-8 flex items-center justify-center" style={{ background: '#F2EBE1' }}><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-base" style={{ color: '#C0785C' }}>{p}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border-2" style={{ background: 'rgba(139,173,138,.08)', borderColor: 'rgba(139,173,138,.3)' }}>
                <Tag className="w-4 h-4 flex-shrink-0" style={{ color: '#8BAD8A' }} />
                <p className="text-xs font-bold" style={{ color: '#5B7D5A' }}>+1 ítem = −10% en todo el pedido</p>
              </div>
            </div>
            <div className="bg-white border-2 rounded-2xl p-5 self-start" style={{ borderColor: '#D4C4B0' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Georgia, serif' }}>Resumen</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between" style={{ color: '#7A6050' }}><span>Subtotal</span><span>$28.980</span></div>
                <div className="flex justify-between font-bold rounded-lg px-2 py-1" style={{ color: '#8BAD8A', background: 'rgba(139,173,138,.08)' }}>
                  <span>Descuento</span><span>−$2.898</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: '#A08070' }}><span>Envío</span><span>Al pagar</span></div>
                <div className="flex justify-between font-bold text-xl pt-3 border-t-2" style={{ borderColor: '#D4C4B0' }}>
                  <span>Total</span><span style={{ color: '#C0785C' }}>$26.082</span>
                </div>
              </div>
              <button className="w-full py-4 text-white font-bold rounded-2xl mt-4 text-sm flex items-center justify-center gap-2 btn-lift"
                style={{ background: '#C0785C', boxShadow: '0 8px 24px rgba(192,120,92,.25)' }}>
                Ir a pagar <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] mt-2 flex items-center justify-center gap-1" style={{ color: '#A08070' }}>
                <ShieldCheck className="w-3 h-3" style={{ color: '#8BAD8A' }} /> IVA incluido · Pago seguro
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────── PROPUESTA 4: "Glassmorphism Pro" ──────────────────
function Proposal4() {
  const [step, setStep] = useState('home');
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const handleAdd = () => { setAdded(true); setTimeout(() => { setAdded(false); setStep('carrito'); }, 900); };
  const g = { bg: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', blur: 'blur(16px)' };

  return (
    <div className="relative rounded-3xl overflow-hidden border shadow-2xl shadow-black/60" style={{ background: 'linear-gradient(135deg,#0D1B2A 0%,#1B2E3C 50%,#122A1E 100%)', borderColor: 'rgba(255,255,255,.15)', fontFamily: 'system-ui,sans-serif' }}>
      {/* ambient glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(94,234,212,.06)' }} />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(94,234,212,.04)' }} />

      <nav className="relative flex items-center justify-between px-7 py-4 border-b sticky top-0 z-10" style={{ background: 'rgba(13,27,42,.7)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,.1)' }}>
        <span className="font-black text-lg text-white tracking-tight">PEYU<span style={{ color: '#5EEAD4' }}>.</span></span>
        <div className="hidden sm:flex items-center gap-7 text-sm">
          {['Tienda', 'Empresas', 'Blog'].map((n, i) => (
            <span key={n} className="cursor-pointer" style={{ color: i === 0 ? '#5EEAD4' : 'rgba(255,255,255,.4)', fontWeight: i === 0 ? 700 : 400 }}>{n}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer" style={{ background: g.bg, border: g.border, backdropFilter: g.blur }}>
            <Search className="w-4 h-4 text-white/50" />
            <span className="text-xs text-white/35 hidden sm:inline">Buscar</span>
          </div>
          <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer" style={{ background: g.bg, border: g.border }}>
            <ShoppingBag className="w-4 h-4 text-white/60" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 text-black text-[8px] font-black rounded-full flex items-center justify-center" style={{ background: '#5EEAD4' }}>2</span>
          </div>
        </div>
      </nav>
      <StepBar step={step} setStep={setStep} accent="#5EEAD4" bg="rgba(255,255,255,.04)" activeBg="rgba(255,255,255,.06)" />

      {step === 'home' && (
        <div className="relative p-8">
          <div className="text-center mb-10 anim-fadeup">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', backdropFilter: 'blur(12px)' }}>
              <Recycle className="w-3.5 h-3.5" style={{ color: '#5EEAD4' }} />
              <span className="text-xs font-bold text-white">Plástico 100% reciclado · Santiago 🇨🇱</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[0.9] mb-6">
              Eco<br /><span style={{ color: '#5EEAD4' }}>productos</span><br />personalizados
            </h1>
            <div className="flex gap-3 justify-center mb-2">
              <button onClick={() => setStep('catalogo')} className="btn-lift px-8 py-3.5 rounded-2xl font-black text-sm text-black" style={{ background: '#5EEAD4', boxShadow: '0 8px 32px rgba(94,234,212,.25)' }}>
                Ver tienda →
              </button>
              <button onClick={() => setStep('producto')} className="btn-lift px-6 py-3.5 rounded-2xl font-bold text-sm text-white border" style={{ background: g.bg, border: '1px solid rgba(255,255,255,.2)', backdropFilter: g.blur }}>
                <Sparkles className="w-4 h-4 inline mr-1" />Personalizar
              </button>
            </div>
          </div>
          <div className="flex justify-center mb-10 anim-popin anim-delay-2">
            <div className="relative">
              <img src={IMG.c2} alt="" className="anim-float w-44 h-44 object-contain drop-shadow-2xl" />
              <div className="absolute -bottom-2 -left-6 rounded-2xl p-3 border" style={{ background: 'rgba(13,27,42,.8)', borderColor: 'rgba(255,255,255,.15)', backdropFilter: 'blur(12px)' }}>
                <p className="text-[10px] font-bold" style={{ color: '#5EEAD4' }}>⭐ 4.9/5</p>
                <p className="text-xs font-bold text-white">Carcasa iPhone 13</p>
                <p className="font-black" style={{ color: '#5EEAD4' }}>$8.990</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[[IMG.c1, 'Carcasas', '69 modelos', '$8.990'],
              [IMG.p4, 'Entretenimiento', 'Cachos', '$4.990'],
              [IMG.mac, 'Hogar', 'Maceteros', '$12.990'],
              [IMG.lamp, 'Escritorio', 'Lámparas', '$22.990']].map(([img, n, d, p], i) => (
              <div key={n} onClick={() => setStep('catalogo')} className={`card-hover group rounded-2xl overflow-hidden cursor-pointer border anim-popin anim-delay-${i + 1}`}
                style={{ background: g.bg, border: g.border, backdropFilter: g.blur }}>
                <div className="aspect-[4/3] flex items-center justify-center p-3" style={{ background: 'rgba(255,255,255,.04)' }}>
                  <img src={img} alt="" className="h-18 object-contain group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-3">
                  <p className="font-black text-white text-xs">{n}</p>
                  <p className="text-white/40 text-[10px]">{d}</p>
                  <p className="font-bold text-xs mt-1" style={{ color: '#5EEAD4' }}>desde {p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'catalogo' && (
        <div className="p-6 anim-fadeup">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep('home')} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: g.bg, border: g.border }}>
              <ArrowLeft className="w-3.5 h-3.5 text-white" />
            </button>
            <h1 className="text-2xl font-black text-white flex-1">Tienda</h1>
          </div>
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
            {['Todos', 'Carcasas', 'Entretenimiento', 'Hogar', 'Escritorio'].map((c, i) => (
              <button key={c} className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold btn-lift border transition-all"
                style={{ background: i === 0 ? '#5EEAD4' : g.bg, color: i === 0 ? '#000' : 'rgba(255,255,255,.55)', borderColor: i === 0 ? '#5EEAD4' : 'rgba(255,255,255,.15)' }}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[[IMG.c1, 'Carcasa iPhone 16', '$8.990', '🔥'], [IMG.c2, 'Carcasa iPhone 13', '$8.990', ''],
              [IMG.p4, 'Pack 4 Cachos', '$19.990', '⭐'], [IMG.mac, 'Macetero XL', '$14.990', ''],
              [IMG.lamp, 'Lámpara Eco', '$22.990', ''], [IMG.cacho, 'Cacho Unitario', '$4.990', '']
            ].map(([img, n, p, badge], idx) => (
              <div key={n} onClick={() => setStep('producto')} className={`card-hover group rounded-2xl overflow-hidden cursor-pointer border anim-popin anim-delay-${idx % 5 + 1}`}
                style={{ background: g.bg, borderColor: 'rgba(255,255,255,.1)', backdropFilter: g.blur }}>
                <div className="aspect-square flex items-center justify-center p-4 relative" style={{ background: 'rgba(255,255,255,.04)' }}>
                  <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-108 transition-transform" />
                  {badge && <span className="absolute top-2 left-2 text-sm">{badge}</span>}
                </div>
                <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
                  <p className="font-bold text-white text-xs line-clamp-1 mb-2">{n}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm" style={{ color: '#5EEAD4' }}>{p}</span>
                    <button className="w-7 h-7 rounded-xl flex items-center justify-center text-black btn-lift" style={{ background: '#5EEAD4' }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'producto' && (
        <div className="grid sm:grid-cols-2 anim-fadein">
          <div className="flex flex-col items-center justify-center p-10 min-h-[360px] border-r" style={{ background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.08)' }}>
            <div className="absolute" style={{ width: 240, height: 240, background: 'rgba(94,234,212,.06)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <img src={IMG.c2} alt="" className="anim-float w-52 h-52 object-contain drop-shadow-2xl relative z-10" />
            <div className="flex gap-2 mt-6 z-10">
              {[{ hex: '#4A9B7F' }, { hex: '#E8E8E8' }, { hex: '#D96B4D' }, { hex: '#2E5FA3' }].map((c, i) => (
                <button key={c.hex} style={{ background: c.hex, border: i === 0 ? '3px solid #5EEAD4' : '3px solid rgba(255,255,255,.2)' }}
                  className="w-8 h-8 rounded-xl hover:scale-110 transition-transform btn-lift" />
              ))}
            </div>
          </div>
          <div className="p-8 space-y-5">
            <button onClick={() => setStep('catalogo')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ color: '#5EEAD4', background: 'rgba(94,234,212,.1)' }}>Más vendido</span>
              <h1 className="text-2xl font-black text-white mt-3 mb-2">Carcasa iPhone 13 Pro</h1>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black" style={{ color: '#5EEAD4' }}>$8.990</p>
                <p className="text-sm text-white/30 line-through">$11.990</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-white/60">Cantidad</p>
              <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,.15)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center" style={{ background: g.bg }}><Minus className="w-3.5 h-3.5 text-white" /></button>
                <span className="w-10 text-center font-bold text-sm text-white">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center" style={{ background: g.bg }}><Plus className="w-3.5 h-3.5 text-white" /></button>
              </div>
              {qty >= 2 && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: '#5EEAD4', background: 'rgba(94,234,212,.1)' }}>−10%</span>}
            </div>
            <div className="rounded-2xl p-4 border" style={{ background: g.bg, borderColor: 'rgba(255,255,255,.12)', backdropFilter: g.blur }}>
              <p className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" style={{ color: '#5EEAD4' }} /> Grabado láser</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase', 'Diseño', 'Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold rounded-xl py-2.5 border transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.6)' }}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={handleAdd} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 btn-lift text-black"
              style={{ background: added ? '#4DD8C2' : '#5EEAD4', boxShadow: '0 8px 32px rgba(94,234,212,.25)' }}>
              {added ? <><Check className="w-4 h-4" /> ¡Agregado!</> : <><ShoppingBag className="w-4 h-4" /> Agregar · ${(8990 * qty).toLocaleString()}</>}
            </button>
          </div>
        </div>
      )}

      {step === 'carrito' && (
        <div className="anim-fadeup">
          <div className="px-6 py-3 border-b flex items-center gap-2 text-xs font-bold" style={{ background: 'rgba(94,234,212,.06)', borderColor: 'rgba(255,255,255,.08)', color: '#5EEAD4' }}>
            <Check className="w-3.5 h-3.5" /> Carrito → <span className="text-white/30 font-normal">Datos → Pago → Confirmación</span>
          </div>
          <div className="grid sm:grid-cols-5">
            <div className="sm:col-span-3 p-6 space-y-3 border-r" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <h1 className="text-2xl font-black text-white mb-4">Carrito <span style={{ color: '#5EEAD4' }}>(2)</span></h1>
              {[[IMG.c2, 'Carcasa iPhone 13 Pro', 'Turquesa · Frase', '$8.990'],
                [IMG.p4, 'Pack 4 Cachos', 'Natural', '$19.990']].map(([img, n, c, p]) => (
                <div key={n} className="flex gap-4 p-4 rounded-2xl border" style={{ background: g.bg, borderColor: 'rgba(255,255,255,.1)', backdropFilter: g.blur }}>
                  <img src={img} alt="" className="w-16 h-16 object-contain rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)' }} />
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="font-bold text-white text-sm">{n}</p>
                      <button className="text-white/30 hover:text-white/70"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{c}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,.15)' }}>
                        <button className="w-7 h-7 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Minus className="w-3 h-3 text-white" /></button>
                        <span className="w-7 text-center text-xs font-bold text-white">1</span>
                        <button className="w-7 h-7 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Plus className="w-3 h-3 text-white" /></button>
                      </div>
                      <span className="font-black" style={{ color: '#5EEAD4' }}>{p}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sm:col-span-2 p-6">
              <div className="rounded-2xl p-5 border" style={{ background: g.bg, borderColor: 'rgba(255,255,255,.15)', backdropFilter: 'blur(20px)' }}>
                <h2 className="font-black text-white text-lg mb-4">Resumen</h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-white/50"><span>Subtotal</span><span>$28.980</span></div>
                  <div className="flex justify-between font-bold rounded-lg px-2 py-1" style={{ color: '#5EEAD4', background: 'rgba(94,234,212,.08)' }}>
                    <span>🎉 Descuento</span><span>−$2.898</span>
                  </div>
                  <div className="flex justify-between font-black text-xl text-white pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                    <span>Total</span><span style={{ color: '#5EEAD4' }}>$26.082</span>
                  </div>
                </div>
                <button className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 btn-lift mt-4 text-black"
                  style={{ background: '#5EEAD4', boxShadow: '0 8px 24px rgba(94,234,212,.2)' }}>
                  Pagar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────── PROPUESTA 5: "Radical Warm" (PEYU Native) ─────────
function Proposal5() {
  const [step, setStep] = useState('home');
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const handleAdd = () => { setAdded(true); setTimeout(() => { setAdded(false); setStep('carrito'); }, 900); };

  return (
    <div className="rounded-3xl overflow-hidden border-2 shadow-2xl" style={{ background: '#F5F0E8', color: '#1C1C1A', borderColor: '#E0D8CC', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif' }}>
      <nav className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ background: '#1C1C1A', color: 'white' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight">PEYU</span>
          <span className="w-2 h-2 rounded-full" style={{ background: '#0F8B6C' }} />
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          {['Tienda', 'Personalizar', 'Empresas'].map((n, i) => (
            <span key={n} className="cursor-pointer transition-colors"
              style={{ color: i === 0 ? '#0F8B6C' : 'rgba(255,255,255,.5)', fontWeight: i === 0 ? 700 : 400, borderBottom: i === 0 ? '2px solid #0F8B6C' : 'none', paddingBottom: i === 0 ? 2 : 0 }}>
              {n}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,.1)' }}>
            <Search className="w-4 h-4 text-white/60" />
          </div>
          <div className="relative w-9 h-9 flex items-center justify-center rounded-2xl" style={{ background: '#0F8B6C' }}>
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-black rounded-full flex items-center justify-center" style={{ background: '#D96B4D' }}>2</span>
          </div>
        </div>
      </nav>
      <StepBar step={step} setStep={setStep} accent="#0F8B6C" bg="#F0EBE0" activeBg="#F5F0E8" />

      {step === 'home' && (
        <div>
          <div className="px-8 sm:px-12 py-12 sm:py-16" style={{ background: '#1C1C1A', color: 'white' }}>
            <div className="max-w-3xl anim-fadeup">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 border" style={{ background: 'rgba(15,139,108,.15)', borderColor: 'rgba(15,139,108,.3)' }}>
                <Recycle className="w-3 h-3" style={{ color: '#0F8B6C' }} />
                <span className="text-xs font-bold" style={{ color: '#0F8B6C' }}>Hecho en Santiago · Plástico reciclado</span>
              </div>
              <h1 className="font-black leading-[0.88] mb-6" style={{ fontSize: 'clamp(3rem,8vw,5rem)' }}>
                PEYU<br />
                <span style={{ color: '#0F8B6C' }}>ECO</span><br />
                STORE.
              </h1>
              <p className="text-white/55 text-base max-w-md mb-8 leading-relaxed">
                Carcasas, maceteros, cachos y más. Personalizables con tu logo. Grabado láser gratis desde 10u.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setStep('catalogo')} className="btn-lift px-8 py-4 text-white font-black rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: '#0F8B6C', boxShadow: '0 8px 24px rgba(15,139,108,.35)' }}>
                  Ver tienda <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setStep('producto')} className="btn-lift px-6 py-4 text-white font-black rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: '#D96B4D', boxShadow: '0 8px 24px rgba(217,107,77,.3)' }}>
                  <Sparkles className="w-4 h-4" /> Personalizar
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black">Categorías</h2>
              <button onClick={() => setStep('catalogo')} className="text-sm font-black flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#0F8B6C' }}>
                Ver todo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['📱', 'Carcasas', '69 modelos', '#0F8B6C'], ['🎲', 'Entretenimiento', 'Cachos', '#D96B4D'], ['🌿', 'Hogar', 'Maceteros', '#8BAD8A'], ['💡', 'Escritorio', 'Lámparas', '#9B8560']].map(([e, n, d, color], i) => (
                <div key={n} onClick={() => setStep('catalogo')} className={`card-hover bg-white border-2 rounded-2xl p-5 cursor-pointer group anim-popin anim-delay-${i + 1}`}
                  style={{ borderColor: '#E0D8CC' }}
                  onMouseOver={ev => ev.currentTarget.style.borderColor = color}
                  onMouseOut={ev => ev.currentTarget.style.borderColor = '#E0D8CC'}>
                  <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{e}</span>
                  <p className="font-black text-sm">{n}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9B9580' }}>{d}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-black" style={{ color }}>
                    Ver <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-6 mb-6 rounded-2xl flex items-center justify-between px-6 py-5" style={{ background: '#0F8B6C' }}>
            <div>
              <p className="font-black text-white text-base">🎁 Grabado láser GRATIS</p>
              <p className="text-white/75 text-sm">Desde 10 unidades · Frase, diseño PEYU o tu logo</p>
            </div>
            <button onClick={() => setStep('producto')} className="btn-lift font-black px-5 py-2.5 rounded-2xl text-sm flex-shrink-0" style={{ background: 'white', color: '#0F8B6C' }}>Ver más →</button>
          </div>
        </div>
      )}

      {step === 'catalogo' && (
        <div className="p-6 anim-fadeup">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('home')} className="w-8 h-8 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: '#E0D8CC' }}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div>
                <h1 className="text-2xl font-black">Tienda</h1>
                <p className="text-xs" style={{ color: '#9B9580' }}>100% reciclado</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border-2 rounded-2xl px-4 py-2.5 text-sm cursor-pointer" style={{ borderColor: '#E0D8CC', color: '#9B9580' }}>
              <Search className="w-4 h-4" /><span>Buscar</span>
            </div>
          </div>
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {['Todos', 'Carcasas', 'Entretenimiento', 'Hogar', 'Escritorio'].map((c, i) => (
              <button key={c} className="flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-black transition-all btn-lift"
                style={{ background: i === 0 ? '#0F8B6C' : 'white', color: i === 0 ? 'white' : '#6B6560', border: `2px solid ${i === 0 ? '#0F8B6C' : '#E0D8CC'}` }}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[[IMG.c1, 'Carcasa iPhone 16', '$8.990', '🔥'], [IMG.c2, 'Carcasa iPhone 13', '$8.990', ''],
              [IMG.p4, 'Pack 4 Cachos', '$19.990', '⭐'], [IMG.mac, 'Macetero XL', '$14.990', ''],
              [IMG.lamp, 'Lámpara Eco', '$22.990', ''], [IMG.cacho, 'Cacho Unitario', '$4.990', '']
            ].map(([img, n, p, badge], idx) => (
              <div key={n} onClick={() => setStep('producto')} className={`card-hover group bg-white border-2 rounded-2xl overflow-hidden cursor-pointer anim-popin anim-delay-${idx % 5 + 1}`}
                style={{ borderColor: '#E0D8CC', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div className="relative aspect-square flex items-center justify-center p-3 overflow-hidden" style={{ background: '#F5F0E8' }}>
                  <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-400" />
                  {badge && <span className="absolute top-2 left-2 text-base">{badge}</span>}
                </div>
                <div className="p-4 border-t-2" style={{ borderColor: '#E0D8CC' }}>
                  <p className="font-black text-sm line-clamp-1">{n}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-base" style={{ color: '#0F8B6C' }}>{p}</span>
                    <button className="w-8 h-8 text-white rounded-xl flex items-center justify-center btn-lift" style={{ background: '#0F8B6C' }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'producto' && (
        <div className="grid sm:grid-cols-2 anim-fadein">
          <div className="flex flex-col items-center justify-center p-10 min-h-[360px] relative overflow-hidden" style={{ background: '#1C1C1A' }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,139,108,.2) 0%,transparent 70%)' }} />
            <img src={IMG.c2} alt="" className="anim-float w-52 h-52 object-contain drop-shadow-2xl relative z-10" />
            <div className="flex gap-1.5 mt-6 z-10">
              {[{ hex: '#4A9B7F' }, { hex: '#E8E8E8' }, { hex: '#D96B4D' }, { hex: '#2E5FA3' }].map((c, i) => (
                <button key={c.hex} style={{ background: c.hex, border: i === 0 ? '3px solid white' : '3px solid rgba(255,255,255,.3)' }}
                  className="w-8 h-7 rounded-lg hover:scale-110 transition-transform btn-lift" />
              ))}
            </div>
          </div>
          <div className="p-8 space-y-4">
            <button onClick={() => setStep('catalogo')} className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity" style={{ color: '#9B9580' }}>
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: '#0F8B6C' }}>EN STOCK</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(217,107,77,.1)', color: '#D96B4D' }}>🔥 POPULAR</span>
            </div>
            <div>
              <h1 className="text-2xl font-black">Carcasa iPhone 13 Pro</h1>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-4xl font-black" style={{ color: '#0F8B6C' }}>$8.990</p>
                <p className="text-sm text-[#B0A898] line-through">$11.990</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold" style={{ color: '#6B6560' }}>Cantidad</p>
              <div className="flex items-center rounded-xl overflow-hidden border-2" style={{ borderColor: '#E0D8CC' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center" style={{ background: '#F5F0E8' }}><Minus className="w-3.5 h-3.5" /></button>
                <span className="w-10 text-center font-black text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center" style={{ background: '#F5F0E8' }}><Plus className="w-3.5 h-3.5" /></button>
              </div>
              {qty >= 2 && <span className="text-xs font-black text-white px-2 py-1 rounded-full" style={{ background: '#0F8B6C' }}>−10%</span>}
            </div>
            <div className="rounded-2xl p-4 border-2" style={{ background: 'rgba(15,139,108,.06)', borderColor: 'rgba(15,139,108,.2)' }}>
              <p className="text-sm font-black mb-1" style={{ color: '#0F8B6C' }}>✨ Grabado láser</p>
              <p className="text-[11px] mb-3" style={{ color: '#6B6560' }}>Gratis desde 10u · Sin tintas · Para siempre</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase', 'Diseño PEYU', 'Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-black bg-white border-2 rounded-xl py-2 hover:border-[#0F8B6C] hover:text-[#0F8B6C] transition-all" style={{ borderColor: '#E0D8CC' }}>{t}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-4 border-2 font-black rounded-2xl text-sm flex items-center justify-center gap-2 btn-lift" style={{ borderColor: '#0F8B6C', color: '#0F8B6C' }}>
                <Heart className="w-4 h-4" /> Guardar
              </button>
              <button onClick={handleAdd} className="py-4 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 btn-lift"
                style={{ background: added ? '#0B6E55' : '#0F8B6C', boxShadow: '0 8px 24px rgba(15,139,108,.3)' }}>
                {added ? <><Check className="w-4 h-4" /> ¡Listo!</> : <><ShoppingBag className="w-4 h-4" /> Agregar</>}
              </button>
            </div>
            <div className="flex gap-2">
              {[['🚚', 'BlueExpress'], ['🔒', 'Pago seguro'], ['♻️', 'Eco']].map(([e, t]) => (
                <div key={t} className="flex-1 text-center bg-white border border-[#E0D8CC] rounded-xl py-2.5">
                  <p className="text-base">{e}</p>
                  <p className="text-[9px] font-black mt-0.5" style={{ color: '#9B9580' }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'carrito' && (
        <div className="anim-fadeup">
          <div className="px-6 py-3 border-b-2 flex items-center gap-2 text-xs font-black" style={{ background: 'rgba(15,139,108,.08)', borderColor: '#E0D8CC', color: '#0F8B6C' }}>
            <Check className="w-3.5 h-3.5" /> Carrito → <span style={{ color: '#9B9580', fontWeight: 400 }}>Datos → Pago → Confirmación</span>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <ShoppingBag className="w-6 h-6" style={{ color: '#0F8B6C' }} />
              <h1 className="text-2xl font-black">Tu carrito <span style={{ color: '#0F8B6C' }}>(2)</span></h1>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2 space-y-3">
                {[[IMG.c2, 'Carcasa iPhone 13 Pro', 'Turquesa · Frase: "Mi empresa"', '$8.990', '−10%'],
                  [IMG.p4, 'Pack 4 Cachos', 'Natural', '$19.990', '']].map(([img, n, c, p, disc]) => (
                  <div key={n} className="card-hover flex gap-4 bg-white border-2 rounded-2xl p-4" style={{ borderColor: '#E0D8CC' }}>
                    <img src={img} alt="" className="w-20 h-20 object-contain rounded-xl flex-shrink-0" style={{ background: '#F5F0E8' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black text-sm">{n}</p>
                        {disc && <span className="text-[10px] font-black text-white flex-shrink-0 px-2 py-0.5 rounded-full" style={{ background: '#0F8B6C' }}>{disc}</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9B9580' }}>{c}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center overflow-hidden border-2 rounded-xl" style={{ borderColor: '#E0D8CC' }}>
                          <button className="w-8 h-8 flex items-center justify-center" style={{ background: '#F5F0E8' }}><Minus className="w-3 h-3" /></button>
                          <span className="w-8 text-center text-sm font-black">1</span>
                          <button className="w-8 h-8 flex items-center justify-center" style={{ background: '#F5F0E8' }}><Plus className="w-3 h-3" /></button>
                        </div>
                        <span className="font-black text-base" style={{ color: '#0F8B6C' }}>{p}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border-2" style={{ background: 'rgba(15,139,108,.06)', borderColor: 'rgba(15,139,108,.2)' }}>
                  <Tag className="w-4 h-4 flex-shrink-0" style={{ color: '#0F8B6C' }} />
                  <p className="text-xs font-black" style={{ color: '#0F8B6C' }}>+1 ítem = −10% en todo el pedido</p>
                </div>
              </div>
              <div>
                <div className="bg-white border-2 rounded-2xl p-5" style={{ borderColor: '#E0D8CC' }}>
                  <h2 className="font-black text-lg mb-4">Resumen</h2>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between" style={{ color: '#6B6560' }}><span>Subtotal</span><span>$28.980</span></div>
                    <div className="flex justify-between font-black rounded-lg px-2 py-1" style={{ color: '#0F8B6C', background: 'rgba(15,139,108,.08)' }}>
                      <span>🎉 Descuento</span><span>−$2.898</span>
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: '#9B9580' }}><span>Envío</span><span>Al pagar</span></div>
                    <div className="flex justify-between font-black text-xl pt-3 border-t-2 mt-1" style={{ borderColor: '#E0D8CC' }}>
                      <span>Total</span><span style={{ color: '#0F8B6C' }}>$26.082</span>
                    </div>
                  </div>
                  <button className="w-full py-4 text-white font-black rounded-2xl mt-4 text-sm flex items-center justify-center gap-2 btn-lift"
                    style={{ background: '#0F8B6C', boxShadow: '0 8px 24px rgba(15,139,108,.25)' }}>
                    Ir a pagar <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[10px] mt-2 flex items-center justify-center gap-1" style={{ color: '#9B9580' }}>
                    <ShieldCheck className="w-3 h-3" style={{ color: '#0F8B6C' }} /> IVA incluido · Pago seguro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════
const PROPOSALS = [
  { id: 1, nombre: 'Nordic Eco', sub: 'Serif · Off-white · Premium', desc: 'Minimalismo escandinavo. Tipografía editorial serif, espacios amplios, paleta crema. Inspira: Muji, Fjällräven.', paleta: ['#FAFAF8', '#1A1A18', '#5B8A6F', '#EDE9E0'], score: { conversion: 87, mobile: 82, branding: 91 }, Component: Proposal1 },
  { id: 2, nombre: 'Dark Commerce', sub: 'Apple × Stripe · Néon', desc: 'Negro profundo con verde néon. Bold, aspiracional, tecnológico. Diferenciador máximo en el mercado local.', paleta: ['#080808', '#00E5A0', '#111', '#1A1A1A'], score: { conversion: 91, mobile: 88, branding: 86 }, Component: Proposal2 },
  { id: 3, nombre: 'Warm Clay', sub: 'Artesanal · Terracota · Orgánico', desc: 'Terracota, marfil, serif + sans. Conecta emocionalmente con la sostenibilidad. Inspira: Aesop, The Body Shop.', paleta: ['#F8F3ED', '#2C1810', '#C0785C', '#8BAD8A'], score: { conversion: 84, mobile: 87, branding: 93 }, Component: Proposal3 },
  { id: 4, nombre: 'Glassmorphism Pro', sub: 'Vidrio · Aurora · Ultra 2026', desc: 'Fondo aurora oscuro, tarjetas cristal, teal vibrante. Futurista y diferente a todo el ecommerce chileno.', paleta: ['#0D1B2A', '#5EEAD4', '#1B2E3C', '#142A20'], score: { conversion: 83, mobile: 85, branding: 92 }, Component: Proposal4 },
  { id: 5, nombre: 'Radical Warm', sub: 'PEYU Native · Bold · Conversión', desc: 'Colores firma PEYU (#0F8B6C + #D96B4D), typografía oversized. Mayor score de conversión y consistencia de marca.', paleta: ['#F5F0E8', '#1C1C1A', '#0F8B6C', '#D96B4D'], score: { conversion: 94, mobile: 92, branding: 96 }, Component: Proposal5 },
];

export default function FunnelDesignLab() {
  const [active, setActive] = useState(0);
  const Comp = PROPOSALS[active].Component;
  const prev = () => setActive(a => Math.max(0, a - 1));
  const next = () => setActive(a => Math.min(PROPOSALS.length - 1, a + 1));

  return (
    <div className="min-h-screen font-inter" style={{ background: '#F0EAE0', color: '#1C1C1A' }}>
      <StyleInjector />

      {/* Header */}
      <div style={{ background: '#1C1C1A', color: 'white' }} className="px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#0F8B6C' }}>🔬 Design Lab · Embudo B2C v2</p>
            <h1 className="text-2xl font-black">5 propuestas UI/UX para el nuevo embudo</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>Inicio · Catálogo · Producto · Carrito — completamente interactivos</p>
          </div>
          <Link to="/TiendaNueva" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-105" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)' }}>
            Ver tienda actual <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Selector sticky */}
      <div className="bg-white border-b border-[#E0D8CC] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
            {PROPOSALS.map((p, i) => (
              <button key={p.id} onClick={() => setActive(i)}
                className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 transition-all hover:scale-[1.02]"
                style={{ borderColor: active === i ? '#0F8B6C' : '#E0D8CC', background: active === i ? 'rgba(15,139,108,.07)' : 'white' }}>
                <div className="flex gap-1">
                  {p.paleta.slice(0, 3).map((c) => (
                    <span key={c} className="w-3 h-3 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black leading-none" style={{ color: active === i ? '#0F8B6C' : '#1C1C1A' }}>{p.id}. {p.nombre}</p>
                  <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: '#9B9580' }}>{p.sub}</p>
                </div>
                {active === i && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0F8B6C' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Panel lateral */}
          <div className="lg:col-span-1 space-y-4">
            {/* Info propuesta */}
            <div className="bg-white border border-[#E0D8CC] rounded-2xl p-5 shadow-sm">
              <div className="flex gap-1.5 mb-4">
                {PROPOSALS[active].paleta.map((c) => (
                  <span key={c} className="flex-1 h-7 rounded-xl border border-black/8" style={{ background: c }} />
                ))}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black">{PROPOSALS[active].nombre}</h2>
                  <p className="text-xs font-bold mt-0.5" style={{ color: '#0F8B6C' }}>{PROPOSALS[active].sub}</p>
                </div>
                <span className="text-2xl font-black" style={{ color: '#0F8B6C' }}>{PROPOSALS[active].id}</span>
              </div>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: '#6B6560' }}>{PROPOSALS[active].desc}</p>
            </div>

            {/* Scores */}
            <div className="bg-white border border-[#E0D8CC] rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: '#9B9580' }}>Scores estimados</p>
              {Object.entries(PROPOSALS[active].score).map(([k, v]) => (
                <div key={k} className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold" style={{ color: '#1C1C1A' }}>
                      {k === 'conversion' ? '🎯 Conversión' : k === 'mobile' ? '📱 UX Mobile' : '🎨 Branding'}
                    </span>
                    <span className="text-sm font-black" style={{ color: v >= 90 ? '#0F8B6C' : v >= 85 ? '#D96B4D' : '#9B9580' }}>{v}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${v}%`, background: v >= 90 ? '#0F8B6C' : v >= 85 ? '#D96B4D' : '#9B9580' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Research */}
            <div className="rounded-2xl p-5" style={{ background: '#1C1C1A', color: 'white' }}>
              <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: '#0F8B6C' }}>💡 Baymard Research 2026</p>
              <div className="space-y-2 text-xs" style={{ color: 'rgba(255,255,255,.6)' }}>
                {['Precio transparente +12% conversión', 'Sticky CTA mobile +18%', 'Color picker visual −23% abandonos', 'Trust badges −15% drop carrito', 'Descuento qty visible desde pdto', 'Breadcrumb checkout +8% completación'].map((t) => (
                  <div key={t} className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#0F8B6C' }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navegación */}
            <div className="flex gap-2">
              <button onClick={prev} disabled={active === 0}
                className="flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all hover:scale-[1.02] disabled:opacity-35"
                style={{ background: 'white', borderColor: '#E0D8CC', color: '#6B6560' }}>
                ← Anterior
              </button>
              <button onClick={next} disabled={active === PROPOSALS.length - 1}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-35"
                style={{ background: '#0F8B6C', color: 'white' }}>
                Siguiente →
              </button>
            </div>
          </div>

          {/* Mockup */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9B9580' }}>
                {PROPOSALS[active].id} / {PROPOSALS.length} · {PROPOSALS[active].nombre} · Haz clic en las pestañas ↓
              </p>
              <div className="flex items-center gap-1.5">
                {PROPOSALS.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === active ? 24 : 8, height: 8, background: i === active ? '#0F8B6C' : '#D0C8BC' }} />
                ))}
              </div>
            </div>
            <Comp />
            <p className="text-center text-[10px] mt-3" style={{ color: '#B0A898' }}>
              🔬 Mockup interactivo · Sin afectar el embudo real · Navega entre Home → Catálogo → Producto → Carrito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}