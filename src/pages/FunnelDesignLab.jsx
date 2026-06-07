import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, ShoppingBag, Sparkles, Recycle, Star, Zap, Leaf,
  ChevronRight, Search, SlidersHorizontal, ShieldCheck, Truck,
  Heart, Eye, Plus, Minus, Package, ChevronDown
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /FunnelDesignLab — 5 propuestas de diseño para el embudo B2C nuevo.
// Cada propuesta muestra: Home · Catálogo · Producto · Carrito (mini).
// SIN AFECTAR el embudo real. Solo visual.
// ════════════════════════════════════════════════════════════════════════

const MOCKUP_IMGS = {
  carcasa: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-negro.webp?fit=600%2C600&ssl=1',
  carcasaTurq: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/carcasa-iphon-13-pro-turquesa.webp?fit=600%2C600&ssl=1',
  cacho: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/1-2.jpg?fit=600%2C600&ssl=1',
  pack4: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/4-3.jpg?fit=600%2C600&ssl=1',
  macetero: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  lamp: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/lampara-1.webp?fit=600%2C600&ssl=1',
};

// ─────────────────────────────────────────────
// PROPUESTA 1: "Nordic Eco" — Minimalismo escandinavo
// Blancos, beige off-white, tipografía editorial serif, mucho espacio
// ─────────────────────────────────────────────
function Proposal1() {
  const [activeStep, setActiveStep] = useState('home');
  return (
    <div className="font-serif bg-[#FAFAF8] text-[#1A1A18] rounded-3xl overflow-hidden border border-[#E8E4DC] shadow-2xl">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-5 bg-[#FAFAF8] border-b border-[#E8E4DC]">
        <span className="text-xl font-bold tracking-tight">PEYU</span>
        <div className="hidden sm:flex items-center gap-8 text-sm text-[#6B6B60]">
          <span className="text-[#1A1A18] font-medium border-b-2 border-[#1A1A18] pb-0.5">Tienda</span>
          <span>Personalizar</span>
          <span>Empresas</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-[#E8E4DC]">
            <Search className="w-4 h-4 text-[#6B6B60]" />
          </div>
          <div className="relative w-8 h-8 flex items-center justify-center rounded-full border border-[#E8E4DC]">
            <ShoppingBag className="w-4 h-4 text-[#6B6B60]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1A1A18] text-white text-[9px] rounded-full flex items-center justify-center font-bold">2</span>
          </div>
        </div>
      </nav>

      {/* STEP TABS */}
      <div className="flex gap-0 border-b border-[#E8E4DC] bg-[#F5F3EE] px-4">
        {['home', 'catalogo', 'producto', 'carrito'].map((s) => (
          <button key={s} onClick={() => setActiveStep(s)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeStep === s ? 'bg-[#FAFAF8] border-b-2 border-[#1A1A18] text-[#1A1A18]' : 'text-[#9B9B8C] hover:text-[#1A1A18]'}`}>
            {s === 'home' ? 'Inicio' : s === 'catalogo' ? 'Catálogo' : s === 'producto' ? 'Producto' : 'Carrito'}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {activeStep === 'home' && (
        <div>
          {/* Hero editorial */}
          <div className="grid sm:grid-cols-2 gap-0">
            <div className="px-8 sm:px-12 py-12 sm:py-16 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9B9B8C] mb-4">Hecho en Santiago · Plástico reciclado</p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] mb-5">
                Objetos que<br /><em className="not-italic text-[#5B8A6F]">cuidan</em><br />el planeta.
              </h1>
              <p className="text-[#6B6B60] text-sm leading-relaxed mb-8 max-w-xs">
                Cada producto está fabricado con plástico 100% reciclado y personalizable con tu logo.
              </p>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-[#1A1A18] text-white text-sm font-bold rounded-full hover:bg-[#333] transition-all">
                  Ver productos
                </button>
                <button className="px-6 py-3 border border-[#E8E4DC] text-sm font-bold rounded-full text-[#1A1A18] hover:bg-[#F5F3EE] transition-all">
                  Personalizar →
                </button>
              </div>
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-[#E8E4DC]">
                {[['12K+','Productos vendidos'],['98%','Satisfacción'],['10 años','Garantía']].map(([n,l]) => (
                  <div key={n}>
                    <p className="font-bold text-[#1A1A18]">{n}</p>
                    <p className="text-[10px] text-[#9B9B8C]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative bg-[#EDE9E0] flex items-center justify-center min-h-[280px]">
              <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="w-48 h-48 object-contain drop-shadow-2xl" />
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur rounded-2xl px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold text-[#5B8A6F]">✦ Logo gratis</p>
                <p className="text-[10px] text-[#6B6B60]">desde 10 unidades</p>
              </div>
            </div>
          </div>
          {/* Categorías minimal */}
          <div className="px-8 py-10 border-t border-[#E8E4DC]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Colecciones</h2>
              <button className="text-xs text-[#9B9B8C] flex items-center gap-1">Ver todo <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['Carcasas',MOCKUP_IMGS.carcasa,'69 modelos'],['Entretenimiento',MOCKUP_IMGS.pack4,'Cachos y más'],['Hogar',MOCKUP_IMGS.macetero,'Maceteros'],['Escritorio',MOCKUP_IMGS.lamp,'Lámparas']].map(([n,img,d]) => (
                <div key={n} className="group relative overflow-hidden rounded-2xl aspect-square bg-[#EDE9E0] cursor-pointer">
                  <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm">{n}</p>
                    <p className="text-white/70 text-[10px]">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeStep === 'catalogo' && (
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold flex-1">Nuestra tienda</h1>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E4DC] rounded-full text-sm text-[#6B6B60]">
              <Search className="w-4 h-4" /><span>Buscar...</span>
            </div>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {['Todos','Carcasas','Entretenimiento','Hogar','Escritorio'].map((c,i) => (
              <button key={c} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${i===0 ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-white border-[#E8E4DC] text-[#6B6B60]'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[[MOCKUP_IMGS.carcasa,'Carcasa iPhone 16','$8.990','Negro'],
              [MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','$8.990','Turquesa'],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','$19.990','Natural'],
              [MOCKUP_IMGS.macetero,'Macetero XL','$14.990','Verde'],
              [MOCKUP_IMGS.lamp,'Lámpara Eco','$22.990','Blanco'],
              [MOCKUP_IMGS.cacho,'Cacho Unitario','$4.990','Mix']
            ].map(([img,n,p,c]) => (
              <div key={n} className="group bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden hover:shadow-lg transition-all">
                <div className="relative aspect-square bg-[#F5F3EE]">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Heart className="w-4 h-4 text-[#6B6B60]" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-[#9B9B8C] mb-0.5">{c}</p>
                  <p className="font-bold text-sm text-[#1A1A18] line-clamp-1">{n}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-[#1A1A18]">{p}</span>
                    <button className="w-8 h-8 bg-[#1A1A18] text-white rounded-full flex items-center justify-center hover:bg-[#333] transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'producto' && (
        <div className="grid sm:grid-cols-2 gap-0">
          <div className="bg-[#EDE9E0] flex items-center justify-center p-8 min-h-[350px]">
            <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="w-52 h-52 object-contain drop-shadow-2xl" />
          </div>
          <div className="p-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9B9B8C] mb-1">Carcasa Biodegradable</p>
              <h1 className="text-2xl font-bold mb-1">Carcasa iPhone 13 Pro</h1>
              <div className="flex items-center gap-1 mb-3">
                {Array(5).fill(0).map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-[#F0B429] text-[#F0B429]" />)}
                <span className="text-xs text-[#9B9B8C] ml-1">(48)</span>
              </div>
              <p className="text-3xl font-bold">$8.990</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9B9B8C] mb-2">Color</p>
              <div className="flex gap-2">
                {['#4A9B7F','#1A1A18','#E8C5B0','#2E5FA3'].map((c) => (
                  <button key={c} style={{background:c}} className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform" />
                ))}
              </div>
            </div>
            <div className="bg-[#F5F3EE] rounded-2xl p-4">
              <p className="text-sm font-bold mb-2">+ Personalización láser</p>
              <div className="flex gap-2">
                {['Frase','Diseño PEYU','Tu logo'].map((t) => (
                  <button key={t} className="flex-1 text-[11px] font-bold border border-[#E8E4DC] bg-white rounded-xl py-2 hover:border-[#5B8A6F] hover:text-[#5B8A6F] transition-all">{t}</button>
                ))}
              </div>
            </div>
            <button className="w-full py-4 bg-[#1A1A18] text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 hover:bg-[#333] transition-all">
              <ShoppingBag className="w-4 h-4" /> Agregar · $8.990
            </button>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[['🌱','Reciclado'],['🚚','BlueExpress'],['🔒','Pago seguro']].map(([e,t]) => (
                <div key={t} className="text-center">
                  <p className="text-lg">{e}</p>
                  <p className="text-[10px] text-[#9B9B8C] font-semibold">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeStep === 'carrito' && (
        <div className="grid sm:grid-cols-5 gap-0">
          <div className="sm:col-span-3 p-6 space-y-3 border-r border-[#E8E4DC]">
            <h1 className="text-2xl font-bold mb-4">Tu carrito (2)</h1>
            {[[MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','Turquesa','$8.990'],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','Natural','$19.990']
            ].map(([img,n,c,p]) => (
              <div key={n} className="flex gap-4 p-4 bg-white border border-[#E8E4DC] rounded-2xl">
                <img src={img} alt="" className="w-16 h-16 object-contain bg-[#F5F3EE] rounded-xl" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{n}</p>
                  <p className="text-[11px] text-[#9B9B8C]">{c}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-[#F5F3EE] rounded-full px-3 py-1">
                      <Minus className="w-3 h-3" /><span className="text-sm font-bold">1</span><Plus className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-sm">{p}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sm:col-span-2 p-6">
            <h2 className="font-bold text-lg mb-4">Resumen</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-[#6B6B60]"><span>Subtotal</span><span>$28.980</span></div>
              <div className="flex justify-between font-bold text-[#5B8A6F]"><span>Descuento 2u</span><span>−$2.898</span></div>
              <div className="flex justify-between text-[#6B6B60]"><span>Envío</span><span className="text-[#9B9B8C]">Al pagar</span></div>
              <div className="flex justify-between font-bold text-lg border-t border-[#E8E4DC] pt-3 mt-2"><span>Total</span><span>$26.082</span></div>
            </div>
            <button className="w-full py-4 bg-[#1A1A18] text-white font-bold rounded-full text-sm flex items-center justify-center gap-2">
              Ir a pagar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROPUESTA 2: "Dark Commerce" — Apple/Stripe vibe oscuro premium
// Negro profundo, verde néon como acento, tipografía sans bold
// ─────────────────────────────────────────────
function Proposal2() {
  const [activeStep, setActiveStep] = useState('home');
  return (
    <div className="font-sans bg-[#0A0A0A] text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
      <nav className="flex items-center justify-between px-8 py-5 bg-[#0A0A0A]/90 backdrop-blur border-b border-white/10">
        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-[#00E5A0] to-[#00B07A] bg-clip-text text-transparent">PEYU</span>
        <div className="hidden sm:flex items-center gap-8 text-sm text-white/50">
          <span className="text-white font-medium">Tienda</span>
          <span>Personalizar</span>
          <span>B2B</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
            <Search className="w-4 h-4 text-white/60" />
          </div>
          <div className="relative">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
              <ShoppingBag className="w-4 h-4 text-white/60" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E5A0] text-black text-[9px] rounded-full flex items-center justify-center font-black">2</span>
          </div>
        </div>
      </nav>

      <div className="flex gap-0 border-b border-white/10 bg-white/5 px-4">
        {['home','catalogo','producto','carrito'].map((s) => (
          <button key={s} onClick={() => setActiveStep(s)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeStep === s ? 'text-[#00E5A0] border-b-2 border-[#00E5A0]' : 'text-white/40 hover:text-white/70'}`}>
            {s === 'home' ? 'Inicio' : s === 'catalogo' ? 'Catálogo' : s === 'producto' ? 'Producto' : 'Carrito'}
          </button>
        ))}
      </div>

      {activeStep === 'home' && (
        <div>
          <div className="relative px-8 sm:px-16 py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00E5A0]/10 via-transparent to-[#0A0A0A]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5A0]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#00E5A0]/15 border border-[#00E5A0]/30 rounded-full px-3 py-1.5 mb-6">
                <Zap className="w-3 h-3 text-[#00E5A0]" />
                <span className="text-xs font-bold text-[#00E5A0]">Plástico 100% reciclado · Hecho en Chile</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black leading-[0.95] mb-6">
                Diseño que<br /><span className="text-[#00E5A0]">cuida</span><br />el futuro.
              </h1>
              <p className="text-white/60 text-base mb-8">Personaliza productos eco con tu logo o frase. Grabado láser incluido desde 10 unidades.</p>
              <div className="flex gap-3">
                <button className="px-8 py-3.5 bg-[#00E5A0] text-black font-black rounded-2xl text-sm hover:bg-[#00C896] transition-all shadow-lg shadow-[#00E5A0]/25">
                  Explorar →
                </button>
                <button className="px-6 py-3.5 bg-white/10 text-white font-bold rounded-2xl text-sm hover:bg-white/15 border border-white/20 transition-all">
                  Personalizar
                </button>
              </div>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:block">
              <div className="relative">
                <img src={MOCKUP_IMGS.carcasa} alt="" className="w-40 h-40 object-contain drop-shadow-2xl" />
                <div className="absolute -bottom-4 -left-4 bg-[#111] border border-white/20 rounded-2xl p-3 shadow-2xl">
                  <p className="text-[10px] text-[#00E5A0] font-bold">🔥 Más vendido</p>
                  <p className="text-xs text-white font-bold">Carcasa iPhone 16</p>
                  <p className="text-lg font-black text-[#00E5A0]">$8.990</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 pb-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[[MOCKUP_IMGS.carcasa,'📱 Carcasas','69 modelos'],[MOCKUP_IMGS.pack4,'🎲 Entretenimiento','Cachos'],[MOCKUP_IMGS.macetero,'🌿 Hogar','Maceteros'],[MOCKUP_IMGS.lamp,'💡 Escritorio','Lámparas']].map(([img,n,d]) => (
              <div key={n} className="relative group overflow-hidden rounded-2xl aspect-[4/5] bg-[#111] border border-white/10 cursor-pointer hover:border-[#00E5A0]/40 transition-all">
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-sm font-black text-white">{n}</p>
                  <p className="text-[10px] text-white/50">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'catalogo' && (
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-black flex-1">Tienda</h1>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl text-sm text-white/50">
              <Search className="w-4 h-4" /><span>Buscar...</span>
            </div>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {['Todos','Carcasas','Entretenimiento','Hogar','Escritorio'].map((c,i) => (
              <button key={c} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${i===0 ? 'bg-[#00E5A0] text-black' : 'bg-white/10 text-white/60 border border-white/10 hover:border-[#00E5A0]/40'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[[MOCKUP_IMGS.carcasa,'Carcasa iPhone 16','$8.990'],
              [MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','$8.990'],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','$19.990'],
              [MOCKUP_IMGS.macetero,'Macetero XL','$14.990'],
              [MOCKUP_IMGS.lamp,'Lámpara Eco','$22.990'],
              [MOCKUP_IMGS.cacho,'Cacho Unitario','$4.990']
            ].map(([img,n,p]) => (
              <div key={n} className="group bg-[#111] rounded-2xl border border-white/10 overflow-hidden hover:border-[#00E5A0]/30 hover:shadow-lg hover:shadow-[#00E5A0]/5 transition-all">
                <div className="aspect-square bg-[#1A1A1A] flex items-center justify-center p-4">
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-white line-clamp-1 mb-2">{n}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#00E5A0]">{p}</span>
                    <button className="w-8 h-8 bg-[#00E5A0] text-black rounded-xl flex items-center justify-center hover:bg-[#00C896] transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'producto' && (
        <div className="grid sm:grid-cols-2 gap-0">
          <div className="bg-[#111] flex items-center justify-center p-10 min-h-[320px] border-r border-white/10">
            <div className="relative">
              <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="w-44 h-44 object-contain drop-shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-[#00E5A0]/10 rounded-full blur-xl" />
            </div>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00E5A0] bg-[#00E5A0]/10 px-2 py-1 rounded-full">Más vendido</span>
              <h1 className="text-2xl font-black mt-3 mb-1">Carcasa iPhone 13 Pro</h1>
              <p className="text-4xl font-black text-[#00E5A0]">$8.990</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Color</p>
              <div className="flex gap-2">
                {['#4A9B7F','#1A1A18','#E8C5B0','#2E5FA3'].map((c) => (
                  <button key={c} style={{background:c}} className="w-9 h-9 rounded-xl border-2 border-transparent hover:border-[#00E5A0] transition-all" />
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-bold mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#00E5A0]" /> Grabado láser</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase','Diseño','Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold bg-white/10 border border-white/20 rounded-xl py-2.5 hover:border-[#00E5A0] hover:text-[#00E5A0] transition-all text-white/70">{t}</button>
                ))}
              </div>
            </div>
            <button className="w-full py-4 bg-[#00E5A0] text-black font-black rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-[#00C896] transition-all shadow-lg shadow-[#00E5A0]/25">
              <ShoppingBag className="w-4 h-4" /> Agregar al carrito
            </button>
          </div>
        </div>
      )}

      {activeStep === 'carrito' && (
        <div className="grid sm:grid-cols-5 gap-0">
          <div className="sm:col-span-3 p-6 space-y-3 border-r border-white/10">
            <h1 className="text-2xl font-black mb-4">Carrito <span className="text-[#00E5A0]">(2)</span></h1>
            {[[MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','Turquesa','$8.990'],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','Natural','$19.990']
            ].map(([img,n,c,p]) => (
              <div key={n} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <img src={img} alt="" className="w-16 h-16 object-contain bg-white/5 rounded-xl" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{n}</p>
                  <p className="text-[11px] text-white/40">{c}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1">
                      <Minus className="w-3 h-3 text-white/60" /><span className="text-sm font-bold">1</span><Plus className="w-3 h-3 text-white/60" />
                    </div>
                    <span className="font-black text-[#00E5A0]">{p}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sm:col-span-2 p-6">
            <h2 className="font-black text-lg mb-4">Resumen</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-white/60"><span>Subtotal</span><span>$28.980</span></div>
              <div className="flex justify-between font-bold text-[#00E5A0]"><span>Descuento 2u</span><span>−$2.898</span></div>
              <div className="flex justify-between font-black text-xl border-t border-white/10 pt-3 mt-2"><span>Total</span><span className="text-[#00E5A0]">$26.082</span></div>
            </div>
            <button className="w-full py-4 bg-[#00E5A0] text-black font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00E5A0]/20">
              Pagar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROPUESTA 3: "Warm Clay" — Artesanal/orgánico premium
// Terracota, marfil, tipografía serif + sans, bordes suaves
// ─────────────────────────────────────────────
function Proposal3() {
  const [activeStep, setActiveStep] = useState('home');
  return (
    <div className="bg-[#F8F3ED] text-[#2C1810] rounded-3xl overflow-hidden border border-[#D4C4B0] shadow-2xl" style={{fontFamily:'Georgia, serif'}}>
      <nav className="flex items-center justify-between px-8 py-5 bg-[#F8F3ED] border-b border-[#D4C4B0]">
        <div>
          <span className="text-xl font-bold">PEYU</span>
          <span className="text-xs text-[#A08070] ml-2">· eco products</span>
        </div>
        <div className="hidden sm:flex items-center gap-8 text-sm text-[#7A6050]" style={{fontFamily:'system-ui,sans-serif'}}>
          <span className="font-bold text-[#2C1810] underline underline-offset-4 decoration-[#C0785C]">Tienda</span>
          <span>Empresas</span>
          <span>Nosotros</span>
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-[#A08070]" />
          <div className="relative">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#C0785C]/15">
              <ShoppingBag className="w-4 h-4 text-[#C0785C]" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C0785C] text-white text-[9px] rounded-full flex items-center justify-center font-bold">2</span>
          </div>
        </div>
      </nav>

      <div className="flex gap-0 border-b border-[#D4C4B0] bg-[#F2EBE1] px-4" style={{fontFamily:'system-ui,sans-serif'}}>
        {['home','catalogo','producto','carrito'].map((s) => (
          <button key={s} onClick={() => setActiveStep(s)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeStep === s ? 'text-[#C0785C] border-b-2 border-[#C0785C]' : 'text-[#A08070] hover:text-[#2C1810]'}`}>
            {s === 'home' ? 'Inicio' : s === 'catalogo' ? 'Catálogo' : s === 'producto' ? 'Producto' : 'Carrito'}
          </button>
        ))}
      </div>

      {activeStep === 'home' && (
        <div>
          <div className="relative overflow-hidden px-8 sm:px-16 py-14">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#C0785C]/10 rounded-full" />
            <div className="absolute bottom-0 left-20 w-40 h-40 bg-[#8BAD8A]/15 rounded-full blur-2xl" />
            <div className="relative grid sm:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#8BAD8A]/20 text-[#5B7D5A] text-xs font-bold px-3 py-1.5 rounded-full mb-5" style={{fontFamily:'system-ui,sans-serif'}}>
                  <Leaf className="w-3 h-3" /> Fabricado con tapitas recicladas
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-5">
                  Objetos con<br /><em className="text-[#C0785C]">alma</em><br />y propósito.
                </h1>
                <p className="text-[#7A6050] text-sm leading-relaxed mb-7" style={{fontFamily:'system-ui,sans-serif'}}>
                  Cada carcasa, cada macetero, cada cacho contiene tapitas plásticas que habrían terminado en el océano.
                </p>
                <button className="px-8 py-3.5 bg-[#C0785C] text-white font-bold rounded-2xl text-sm hover:bg-[#A86648] transition-all shadow-lg shadow-[#C0785C]/25" style={{fontFamily:'system-ui,sans-serif'}}>
                  Descubrir colección →
                </button>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-[#D4C4B0] rounded-full flex items-center justify-center">
                    <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="w-40 h-40 object-contain drop-shadow-xl" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-white border border-[#D4C4B0] rounded-2xl px-4 py-2.5 shadow-lg">
                    <p className="text-xs font-bold text-[#C0785C]" style={{fontFamily:'system-ui,sans-serif'}}>♻️ 12 tapitas</p>
                    <p className="text-[10px] text-[#7A6050]" style={{fontFamily:'system-ui,sans-serif'}}>en este producto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 pb-12 grid grid-cols-2 sm:grid-cols-4 gap-4" style={{fontFamily:'system-ui,sans-serif'}}>
            {[[MOCKUP_IMGS.carcasa,'Carcasas','69 modelos'],
              [MOCKUP_IMGS.pack4,'Entretenimiento','Cachos & más'],
              [MOCKUP_IMGS.macetero,'Hogar','Maceteros'],
              [MOCKUP_IMGS.lamp,'Escritorio','Lámparas']].map(([img,n,d]) => (
              <div key={n} className="group text-center cursor-pointer">
                <div className="w-full aspect-square rounded-full bg-[#EDE3D6] flex items-center justify-center mb-3 overflow-hidden group-hover:bg-[#D4C4B0] transition-all">
                  <img src={img} alt="" className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
                <p className="font-bold text-sm">{n}</p>
                <p className="text-[10px] text-[#A08070]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'catalogo' && (
        <div className="p-6" style={{fontFamily:'system-ui,sans-serif'}}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-1">Nuestra tienda</h1>
            <p className="text-[#A08070] text-sm">Diseñados para durar, creados para cuidar.</p>
          </div>
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {['Todos','Carcasas','Entretenimiento','Hogar','Escritorio'].map((c,i) => (
              <button key={c} className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${i===0 ? 'bg-[#C0785C] text-white border-[#C0785C]' : 'bg-white border-[#D4C4B0] text-[#7A6050] hover:border-[#C0785C]/50'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[[MOCKUP_IMGS.carcasa,'Carcasa iPhone 16','$8.990'],
              [MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','$8.990'],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','$19.990'],
              [MOCKUP_IMGS.macetero,'Macetero XL','$14.990'],
              [MOCKUP_IMGS.lamp,'Lámpara Eco','$22.990'],
              [MOCKUP_IMGS.cacho,'Cacho Unitario','$4.990']
            ].map(([img,n,p]) => (
              <div key={n} className="group bg-white rounded-3xl border border-[#D4C4B0] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="aspect-square bg-[#F2EBE1] flex items-center justify-center p-4">
                  <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-[#2C1810] line-clamp-1">{n}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-[#C0785C]">{p}</span>
                    <button className="text-xs font-bold bg-[#C0785C]/10 text-[#C0785C] px-3 py-1.5 rounded-full hover:bg-[#C0785C]/20 transition-all">Ver →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'producto' && (
        <div className="grid sm:grid-cols-2 gap-0" style={{fontFamily:'system-ui,sans-serif'}}>
          <div className="bg-[#EDE3D6] flex items-center justify-center p-10 min-h-[320px]">
            <div className="relative">
              <div className="absolute inset-0 bg-[#C0785C]/10 rounded-full blur-2xl scale-150" />
              <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="relative w-44 h-44 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <p className="text-xs text-[#8BAD8A] font-bold mb-1">♻️ Plástico reciclado</p>
              <h1 className="text-2xl font-bold mb-1">Carcasa iPhone 13 Pro</h1>
              <p className="text-3xl font-bold text-[#C0785C]">$8.990</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#A08070] mb-2">Color</p>
              <div className="flex gap-2">
                {['#4A9B7F','#2C1810','#D4C4B0','#5B7D5A'].map((c) => (
                  <button key={c} style={{background:c}} className="w-8 h-8 rounded-full border-4 border-white shadow-md hover:scale-110 transition-transform" />
                ))}
              </div>
            </div>
            <div className="bg-[#F2EBE1] border border-[#D4C4B0] rounded-2xl p-4">
              <p className="text-sm font-bold mb-2">✨ Grabado láser</p>
              <p className="text-[11px] text-[#A08070] mb-3">Gratis desde 10 unidades. Duradero y sin tintas.</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase','Diseño PEYU','Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold border border-[#D4C4B0] bg-white rounded-xl py-2 hover:border-[#C0785C] hover:text-[#C0785C] transition-all">{t}</button>
                ))}
              </div>
            </div>
            <button className="w-full py-4 bg-[#C0785C] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-[#A86648] transition-all shadow-lg shadow-[#C0785C]/25">
              <ShoppingBag className="w-4 h-4" /> Agregar al carrito · $8.990
            </button>
          </div>
        </div>
      )}

      {activeStep === 'carrito' && (
        <div className="p-6" style={{fontFamily:'system-ui,sans-serif'}}>
          <h1 className="text-2xl font-bold mb-5">Tu carrito</h1>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2 space-y-3">
              {[[MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','Turquesa · Grabado: Frase','$8.990'],
                [MOCKUP_IMGS.pack4,'Pack 4 Cachos','Natural','$19.990']].map(([img,n,c,p]) => (
                <div key={n} className="flex gap-4 bg-white border border-[#D4C4B0] rounded-2xl p-4">
                  <img src={img} alt="" className="w-20 h-20 object-contain bg-[#F2EBE1] rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">{n}</p>
                    <p className="text-xs text-[#A08070] mt-0.5">{c}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-[#F2EBE1] rounded-full px-3 py-1 text-sm">
                        <Minus className="w-3 h-3 text-[#A08070]" /><span className="font-bold w-4 text-center">1</span><Plus className="w-3 h-3 text-[#A08070]" />
                      </div>
                      <span className="font-bold text-[#C0785C]">{p}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-[#D4C4B0] rounded-2xl p-5 self-start">
              <h2 className="font-bold text-lg mb-4">Resumen</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#7A6050]"><span>Subtotal</span><span>$28.980</span></div>
                <div className="flex justify-between font-bold text-[#8BAD8A]"><span>Descuento</span><span>−$2.898</span></div>
                <div className="flex justify-between font-bold text-lg border-t border-[#D4C4B0] pt-3 mt-2"><span>Total</span><span className="text-[#C0785C]">$26.082</span></div>
              </div>
              <button className="w-full py-3.5 bg-[#C0785C] text-white font-bold rounded-2xl mt-4 text-sm flex items-center justify-center gap-2">
                Ir a pagar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROPUESTA 4: "Glassmorphism Pro" — Ultra moderno, vidrio + blur
// Fondo degradado aurora, tarjetas glass, colores vibrantes
// ─────────────────────────────────────────────
function Proposal4() {
  const [activeStep, setActiveStep] = useState('home');
  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl" style={{background:'linear-gradient(135deg,#0D1B2A 0%,#1B2E3C 40%,#142A20 100%)'}}>
      <nav className="flex items-center justify-between px-8 py-5 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <span className="text-xl font-black tracking-tight text-white">PEYU<span className="text-[#5EEAD4]">.</span></span>
        <div className="hidden sm:flex items-center gap-8 text-sm text-white/50">
          <span className="text-[#5EEAD4] font-bold">Tienda</span>
          <span>Personalizar</span>
          <span>Empresas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-2xl px-3 py-2 border border-white/20">
            <Search className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/40 hidden sm:inline">Buscar</span>
          </div>
          <div className="relative w-10 h-10 bg-white/10 backdrop-blur rounded-2xl border border-white/20 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white/60" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#5EEAD4] text-black text-[9px] rounded-full flex items-center justify-center font-black">2</span>
          </div>
        </div>
      </nav>

      <div className="flex gap-0 border-b border-white/10 bg-white/5 backdrop-blur px-4">
        {['home','catalogo','producto','carrito'].map((s) => (
          <button key={s} onClick={() => setActiveStep(s)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeStep === s ? 'text-[#5EEAD4] border-b-2 border-[#5EEAD4]' : 'text-white/40 hover:text-white/70'}`}>
            {s === 'home' ? 'Inicio' : s === 'catalogo' ? 'Catálogo' : s === 'producto' ? 'Producto' : 'Carrito'}
          </button>
        ))}
      </div>

      {activeStep === 'home' && (
        <div className="p-8">
          <div className="relative mb-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#5EEAD4]/10 rounded-full blur-3xl" />
            <div className="text-center relative z-10 pt-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-5">
                <Recycle className="w-3 h-3 text-[#5EEAD4]" />
                <span className="text-xs font-bold text-white">Plástico 100% reciclado · Chile</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.95] mb-5">
                Productos eco<br /><span className="text-[#5EEAD4]">personalizables</span>
              </h1>
              <div className="flex gap-3 justify-center">
                <button className="px-8 py-3.5 bg-[#5EEAD4] text-black font-black rounded-2xl text-sm hover:bg-[#4DD8C2] transition-all shadow-lg shadow-[#5EEAD4]/20">
                  Ver tienda →
                </button>
                <button className="px-6 py-3.5 bg-white/10 backdrop-blur text-white font-bold rounded-2xl text-sm border border-white/20 hover:bg-white/15 transition-all">
                  <Sparkles className="w-4 h-4 inline mr-1" /> Personalizar
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[[MOCKUP_IMGS.carcasa,'Carcasas','69 modelos','from $8.990'],
              [MOCKUP_IMGS.pack4,'Entretenimiento','Cachos','from $4.990'],
              [MOCKUP_IMGS.macetero,'Hogar','Maceteros','from $12.990'],
              [MOCKUP_IMGS.lamp,'Escritorio','Lámparas','from $22.990']].map(([img,n,d,p]) => (
              <div key={n} className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-[#5EEAD4]/40 transition-all cursor-pointer">
                <div className="aspect-[4/3] flex items-center justify-center p-4 bg-white/5">
                  <img src={img} alt="" className="h-20 object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3">
                  <p className="font-black text-white text-xs">{n}</p>
                  <p className="text-white/40 text-[10px]">{d}</p>
                  <p className="text-[#5EEAD4] font-bold text-xs mt-1">{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'catalogo' && (
        <div className="p-6">
          <h1 className="text-2xl font-black text-white mb-5">Tienda</h1>
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
            {['Todos','Carcasas','Entretenimiento','Hogar','Escritorio'].map((c,i) => (
              <button key={c} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${i===0 ? 'bg-[#5EEAD4] text-black border-[#5EEAD4]' : 'bg-white/10 backdrop-blur text-white/60 border-white/20 hover:border-[#5EEAD4]/40'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[[MOCKUP_IMGS.carcasa,'Carcasa iPhone 16','$8.990','🔥'],
              [MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13','$8.990',''],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','$19.990','⭐'],
              [MOCKUP_IMGS.macetero,'Macetero XL','$14.990',''],
              [MOCKUP_IMGS.lamp,'Lámpara Eco','$22.990',''],
              [MOCKUP_IMGS.cacho,'Cacho Unitario','$4.990','']
            ].map(([img,n,p,badge]) => (
              <div key={n} className="group bg-white/10 backdrop-blur border border-white/15 rounded-2xl overflow-hidden hover:border-[#5EEAD4]/30 transition-all">
                <div className="aspect-square bg-white/5 flex items-center justify-center p-4 relative">
                  <img src={img} alt="" className="w-full h-full object-contain" />
                  {badge && <span className="absolute top-2 left-2 text-sm">{badge}</span>}
                </div>
                <div className="p-3">
                  <p className="font-bold text-white text-xs line-clamp-1">{n}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#5EEAD4] text-sm">{p}</span>
                    <button className="w-7 h-7 bg-[#5EEAD4] text-black rounded-lg flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'producto' && (
        <div className="grid sm:grid-cols-2 gap-0">
          <div className="flex items-center justify-center p-10 min-h-[300px] bg-white/5 border-r border-white/10">
            <div className="relative">
              <div className="absolute inset-0 bg-[#5EEAD4]/20 rounded-full blur-3xl scale-150" />
              <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="relative w-40 h-40 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <div className="p-8 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#5EEAD4] bg-[#5EEAD4]/15 px-2 py-1 rounded-full uppercase tracking-wider">Más vendido</span>
              <h1 className="text-xl font-black text-white mt-3 mb-1">Carcasa iPhone 13 Pro</h1>
              <p className="text-3xl font-black text-[#5EEAD4]">$8.990</p>
            </div>
            <div>
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2">Color</p>
              <div className="flex gap-2">
                {['#4A9B7F','#EBF4F1','#D96B4D','#2E5FA3'].map((c) => (
                  <button key={c} style={{background:c}} className="w-8 h-8 rounded-xl border-2 border-transparent hover:border-[#5EEAD4] transition-all" />
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              <p className="text-sm font-bold text-white mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#5EEAD4]" /> Grabado láser</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase','Diseño','Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-bold bg-white/10 border border-white/20 rounded-xl py-2 hover:border-[#5EEAD4] hover:text-[#5EEAD4] text-white/60 transition-all">{t}</button>
                ))}
              </div>
            </div>
            <button className="w-full py-4 bg-[#5EEAD4] text-black font-black rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-[#4DD8C2] transition-all shadow-lg shadow-[#5EEAD4]/20">
              <ShoppingBag className="w-4 h-4" /> Agregar al carrito
            </button>
          </div>
        </div>
      )}

      {activeStep === 'carrito' && (
        <div className="grid sm:grid-cols-5 gap-0">
          <div className="sm:col-span-3 p-6 space-y-3 border-r border-white/10">
            <h1 className="text-2xl font-black text-white mb-4">Carrito <span className="text-[#5EEAD4]">(2)</span></h1>
            {[[MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13','Turquesa','$8.990'],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','Natural','$19.990']].map(([img,n,c,p]) => (
              <div key={n} className="flex gap-4 bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4">
                <img src={img} alt="" className="w-16 h-16 object-contain rounded-xl bg-white/5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{n}</p>
                  <p className="text-[11px] text-white/40">{c}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1">
                      <Minus className="w-3 h-3 text-white/50" /><span className="text-sm font-bold text-white">1</span><Plus className="w-3 h-3 text-white/50" />
                    </div>
                    <span className="font-black text-[#5EEAD4]">{p}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sm:col-span-2 p-6">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
              <h2 className="font-black text-white text-lg mb-4">Resumen</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>$28.980</span></div>
                <div className="flex justify-between font-bold text-[#5EEAD4]"><span>Descuento 2u</span><span>−$2.898</span></div>
                <div className="flex justify-between font-black text-white text-lg border-t border-white/10 pt-3 mt-2"><span>Total</span><span className="text-[#5EEAD4]">$26.082</span></div>
              </div>
              <button className="w-full py-4 bg-[#5EEAD4] text-black font-black rounded-2xl mt-4 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#5EEAD4]/20">
                Pagar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROPUESTA 5: "Radical Warm" — Tipografía oversized, colores firma PEYU
// Verde #0F8B6C + terracota #D96B4D, maximalism funcional, bold
// ─────────────────────────────────────────────
function Proposal5() {
  const [activeStep, setActiveStep] = useState('home');
  return (
    <div className="bg-[#F5F0E8] text-[#1C1C1A] rounded-3xl overflow-hidden border border-[#E0D8CC] shadow-2xl" style={{fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif'}}>
      <nav className="flex items-center justify-between px-6 py-4 bg-[#1C1C1A] text-white">
        <span className="text-lg font-black tracking-tight">PEYU <span className="text-[#0F8B6C]">●</span></span>
        <div className="hidden sm:flex items-center gap-6 text-sm text-white/60">
          <span className="text-[#0F8B6C] font-bold border-b-2 border-[#0F8B6C] pb-0.5">Tienda</span>
          <span>Personalizar</span>
          <span>Empresas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2">
            <Search className="w-4 h-4 text-white/60" />
          </div>
          <div className="relative">
            <div className="w-9 h-9 bg-[#0F8B6C] rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D96B4D] text-white text-[9px] rounded-full flex items-center justify-center font-black">2</span>
          </div>
        </div>
      </nav>

      <div className="flex gap-0 border-b-2 border-[#1C1C1A] bg-[#F5F0E8] px-4">
        {['home','catalogo','producto','carrito'].map((s) => (
          <button key={s} onClick={() => setActiveStep(s)}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeStep === s ? 'text-[#0F8B6C] border-b-4 border-[#0F8B6C] -mb-[2px]' : 'text-[#9B9580] hover:text-[#1C1C1A]'}`}>
            {s === 'home' ? 'Inicio' : s === 'catalogo' ? 'Catálogo' : s === 'producto' ? 'Producto' : 'Carrito'}
          </button>
        ))}
      </div>

      {activeStep === 'home' && (
        <div>
          <div className="bg-[#1C1C1A] text-white px-8 sm:px-12 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-[#0F8B6C]/20 border border-[#0F8B6C]/40 rounded-full px-3 py-1.5 mb-5">
                <Recycle className="w-3 h-3 text-[#0F8B6C]" />
                <span className="text-xs font-bold text-[#0F8B6C]">Hecho en Santiago con plástico reciclado</span>
              </div>
              <h1 className="text-5xl sm:text-7xl font-black leading-[0.9] mb-6">
                PEYU<br />
                <span className="text-[#0F8B6C]">ECO</span><br />
                STORE.
              </h1>
              <p className="text-white/60 text-base max-w-md mb-8">
                Carcasas, maceteros, cachos y más. Personalizables con tu logo. Grabado láser gratis desde 10u.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button className="px-8 py-4 bg-[#0F8B6C] text-white font-black rounded-2xl text-sm hover:bg-[#0B6E55] transition-all flex items-center gap-2">
                  Ir a la tienda <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-6 py-4 bg-[#D96B4D] text-white font-black rounded-2xl text-sm hover:bg-[#C05A3E] transition-all flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Personalizar
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-8">
            <h2 className="text-2xl font-black mb-5">Categorías →</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['📱','Carcasas','69 modelos','#0F8B6C'],
                ['🎲','Entretenimiento','Cachos & juegos','#D96B4D'],
                ['🌿','Hogar','Maceteros y más','#8BAD8A'],
                ['💡','Escritorio','Lámparas & kits','#9B8560']].map(([e,n,d,color]) => (
                <div key={n} className="group bg-white border-2 border-[#E0D8CC] rounded-2xl p-5 cursor-pointer hover:border-current transition-all" style={{borderColor: undefined}} onMouseOver={e2=>e2.currentTarget.style.borderColor=color} onMouseOut={e2=>e2.currentTarget.style.borderColor='#E0D8CC'}>
                  <span className="text-3xl block mb-2">{e}</span>
                  <p className="font-black text-sm">{n}</p>
                  <p className="text-xs text-[#9B9580] mt-0.5">{d}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold" style={{color}}>Ver <ChevronRight className="w-3 h-3" /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0F8B6C] px-8 py-6 flex items-center justify-between">
            <div>
              <p className="font-black text-white text-lg">🎁 Grabado láser GRATIS</p>
              <p className="text-white/80 text-sm">Desde 10 unidades · Frase, diseño PEYU o tu logo</p>
            </div>
            <button className="bg-white text-[#0F8B6C] font-black px-5 py-2.5 rounded-2xl text-sm flex-shrink-0">Ver más →</button>
          </div>
        </div>
      )}

      {activeStep === 'catalogo' && (
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-3xl font-black">Tienda</h1>
              <p className="text-[#9B9580] text-sm">Productos 100% reciclados</p>
            </div>
            <div className="flex items-center gap-2 bg-white border-2 border-[#E0D8CC] rounded-2xl px-4 py-2.5 text-sm text-[#9B9580]">
              <Search className="w-4 h-4" /><span>Buscar</span>
            </div>
          </div>
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {['Todos','Carcasas','Entretenimiento','Hogar','Escritorio'].map((c,i) => (
              <button key={c} className={`flex-shrink-0 px-5 py-2 rounded-2xl text-sm font-black transition-all ${i===0 ? 'bg-[#0F8B6C] text-white' : 'bg-white border-2 border-[#E0D8CC] text-[#6B6560] hover:border-[#0F8B6C]/40'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[[MOCKUP_IMGS.carcasa,'Carcasa iPhone 16','$8.990','🔥'],
              [MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13','$8.990',''],
              [MOCKUP_IMGS.pack4,'Pack 4 Cachos','$19.990','⭐'],
              [MOCKUP_IMGS.macetero,'Macetero XL','$14.990',''],
              [MOCKUP_IMGS.lamp,'Lámpara Eco','$22.990',''],
              [MOCKUP_IMGS.cacho,'Cacho Unitario','$4.990','']
            ].map(([img,n,p,badge]) => (
              <div key={n} className="group bg-white border-2 border-[#E0D8CC] rounded-2xl overflow-hidden hover:border-[#0F8B6C]/40 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="relative aspect-square bg-[#F5F0E8] flex items-center justify-center p-3">
                  <img src={img} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  {badge && <span className="absolute top-2 left-2 text-base">{badge}</span>}
                </div>
                <div className="p-4 border-t-2 border-[#E0D8CC]">
                  <p className="font-black text-sm line-clamp-1">{n}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#0F8B6C] text-base">{p}</span>
                    <button className="w-8 h-8 bg-[#0F8B6C] text-white rounded-xl flex items-center justify-center hover:bg-[#0B6E55] transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 'producto' && (
        <div className="grid sm:grid-cols-2 gap-0">
          <div className="bg-[#1C1C1A] flex items-center justify-center p-10 min-h-[320px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F8B6C]/20 to-transparent" />
            <img src={MOCKUP_IMGS.carcasaTurq} alt="" className="relative w-44 h-44 object-contain drop-shadow-2xl" />
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              {['#4A9B7F','#1A1A18','#E8C5B0','#2E5FA3'].map((c) => (
                <button key={c} style={{background:c}} className="flex-1 h-6 rounded-lg border-2 border-white/30 hover:border-white transition-all" />
              ))}
            </div>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#0F8B6C] bg-[#0F8B6C]/10 px-2.5 py-1 rounded-full">EN STOCK</span>
              <span className="text-xs font-black text-[#D96B4D] bg-[#D96B4D]/10 px-2.5 py-1 rounded-full">🔥 POPULAR</span>
            </div>
            <h1 className="text-2xl font-black">Carcasa iPhone 13 Pro</h1>
            <p className="text-4xl font-black text-[#0F8B6C]">$8.990</p>
            <div className="bg-[#0F8B6C]/8 border-2 border-[#0F8B6C]/20 rounded-2xl p-4">
              <p className="text-sm font-black mb-2 text-[#0F8B6C]">✨ Grabado láser (opcional)</p>
              <p className="text-[11px] text-[#6B6560] mb-3">Gratis desde 10 unidades · Sin tintas · Para siempre</p>
              <div className="grid grid-cols-3 gap-2">
                {['Frase','Diseño PEYU','Tu logo'].map((t) => (
                  <button key={t} className="text-[11px] font-black bg-white border-2 border-[#E0D8CC] rounded-xl py-2 hover:border-[#0F8B6C] hover:text-[#0F8B6C] transition-all">{t}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-4 border-2 border-[#0F8B6C] text-[#0F8B6C] font-black rounded-2xl text-sm hover:bg-[#0F8B6C]/5 transition-all">
                <Heart className="w-4 h-4 inline mr-1" /> Guardar
              </button>
              <button className="py-4 bg-[#0F8B6C] text-white font-black rounded-2xl text-sm hover:bg-[#0B6E55] transition-all flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              {[['🚚','Envío rápido'],['🔒','Pago seguro'],['♻️','Eco-friendly']].map(([e,t]) => (
                <div key={t} className="flex-1 text-center bg-white border border-[#E0D8CC] rounded-xl py-2">
                  <span className="text-base">{e}</span>
                  <p className="text-[9px] font-black text-[#9B9580] mt-0.5">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeStep === 'carrito' && (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <ShoppingBag className="w-6 h-6 text-[#0F8B6C]" />
            <h1 className="text-2xl font-black">Tu carrito <span className="text-[#0F8B6C]">(2)</span></h1>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2 space-y-3">
              {[[MOCKUP_IMGS.carcasaTurq,'Carcasa iPhone 13 Pro','Turquesa · Frase: "Hola"','$8.990','−10%'],
                [MOCKUP_IMGS.pack4,'Pack 4 Cachos','Natural','$19.990','']].map(([img,n,c,p,disc]) => (
                <div key={n} className="flex gap-4 bg-white border-2 border-[#E0D8CC] rounded-2xl p-4">
                  <img src={img} alt="" className="w-20 h-20 object-contain bg-[#F5F0E8] rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-black text-sm">{n}</p>
                      {disc && <span className="text-[10px] font-black text-white bg-[#0F8B6C] px-2 py-0.5 rounded-full">{disc}</span>}
                    </div>
                    <p className="text-xs text-[#9B9580] mt-0.5">{c}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-0 border-2 border-[#E0D8CC] rounded-xl overflow-hidden">
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-[#F5F0E8] transition-all"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm font-black">1</span>
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-[#F5F0E8] transition-all"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-black text-[#0F8B6C] text-base">{p}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="bg-white border-2 border-[#E0D8CC] rounded-2xl p-5">
                <h2 className="font-black text-lg mb-4">Resumen</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B6560]"><span>Subtotal</span><span>$28.980</span></div>
                  <div className="flex justify-between font-black text-[#0F8B6C]"><span>Descuento 2u</span><span>−$2.898</span></div>
                  <div className="flex justify-between text-[#9B9580] text-xs"><span>Envío</span><span>Al pagar</span></div>
                  <div className="flex justify-between font-black text-xl border-t-2 border-[#E0D8CC] pt-3 mt-1"><span>Total</span><span className="text-[#0F8B6C]">$26.082</span></div>
                </div>
                <button className="w-full py-4 bg-[#0F8B6C] text-white font-black rounded-2xl mt-4 text-sm flex items-center justify-center gap-2 hover:bg-[#0B6E55] transition-all shadow-lg shadow-[#0F8B6C]/20">
                  Ir a pagar <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[10px] text-[#9B9580] mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0F8B6C]" /> Pago seguro · IVA incluido
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL: Design Lab
// ─────────────────────────────────────────────
const PROPOSALS = [
  {
    id: 1,
    nombre: 'Nordic Eco',
    subtitulo: 'Minimalismo escandinavo',
    desc: 'Blancos limpios, beige off-white, tipografía editorial serif. Espacioso, premium, confiable. Inspiración: Fjällräven, Muji.',
    paleta: ['#FAFAF8','#1A1A18','#5B8A6F','#EDE9E0'],
    score: { conversion: 87, mobile: 82, branding: 90 },
    Component: Proposal1,
  },
  {
    id: 2,
    nombre: 'Dark Commerce',
    subtitulo: 'Apple × Stripe premium oscuro',
    desc: 'Negro profundo con acento verde néon. Bold, tecnológico, aspiracional. Inspira confianza premium instantánea.',
    paleta: ['#0A0A0A','#FFFFFF','#00E5A0','#111111'],
    score: { conversion: 91, mobile: 88, branding: 85 },
    Component: Proposal2,
  },
  {
    id: 3,
    nombre: 'Warm Clay',
    subtitulo: 'Artesanal / orgánico premium',
    desc: 'Terracota, marfil, serif + sans. Comunica sustentabilidad desde la emoción. Inspira: Aesop, The Body Shop.',
    paleta: ['#F8F3ED','#2C1810','#C0785C','#8BAD8A'],
    score: { conversion: 84, mobile: 86, branding: 93 },
    Component: Proposal3,
  },
  {
    id: 4,
    nombre: 'Glassmorphism Pro',
    subtitulo: 'Vidrio + blur ultra moderno 2026',
    desc: 'Fondo aurora oscuro, tarjetas vidrio, teal vibrante. Diferenciador máximo del mercado local. Inspira: Linear, Vercel.',
    paleta: ['#0D1B2A','#5EEAD4','#1B2E3C','#142A20'],
    score: { conversion: 83, mobile: 85, branding: 92 },
    Component: Proposal4,
  },
  {
    id: 5,
    nombre: 'Radical Warm',
    subtitulo: 'PEYU-branded · Bold nativo',
    desc: 'Colores firma PEYU (#0F8B6C + #D96B4D), tipografía oversized, bordes marcados. El más reconocible y consistente con la marca.',
    paleta: ['#F5F0E8','#1C1C1A','#0F8B6C','#D96B4D'],
    score: { conversion: 93, mobile: 91, branding: 95 },
    Component: Proposal5,
  },
];

export default function FunnelDesignLab() {
  const [active, setActive] = useState(0);
  const Comp = PROPOSALS[active].Component;

  return (
    <div className="min-h-screen bg-[#F2EEE6] font-inter text-[#1C1C1A]">
      {/* Header */}
      <div className="bg-[#1C1C1A] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#0F8B6C] uppercase tracking-widest mb-1">🔬 Design Lab · Embudo B2C</p>
            <h1 className="text-2xl font-black">5 propuestas de diseño para el nuevo embudo</h1>
            <p className="text-white/50 text-sm mt-0.5">Cada propuesta muestra Inicio → Catálogo → Producto → Carrito</p>
          </div>
          <Link to="/TiendaNueva" className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all">
            Ver tienda actual <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Selector de propuesta */}
      <div className="bg-white border-b border-[#E0D8CC] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {PROPOSALS.map((p, i) => (
              <button key={p.id} onClick={() => setActive(i)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${active === i ? 'border-[#0F8B6C] bg-[#0F8B6C]/8 text-[#0F8B6C]' : 'border-[#E0D8CC] bg-white text-[#6B6560] hover:border-[#0F8B6C]/40'}`}>
                <div className="flex gap-1 flex-shrink-0">
                  {p.paleta.slice(0,3).map((c) => (
                    <span key={c} className="w-3 h-3 rounded-full border border-black/10" style={{background:c}} />
                  ))}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black leading-none ${active === i ? 'text-[#0F8B6C]' : 'text-[#1C1C1A]'}`}>
                    {p.id}. {p.nombre}
                  </p>
                  <p className="text-[10px] text-[#9B9580] mt-0.5 hidden sm:block">{p.subtitulo}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* INFO PANEL */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-[#E0D8CC] rounded-2xl p-5">
              <div className="flex gap-1.5 mb-3">
                {PROPOSALS[active].paleta.map((c) => (
                  <span key={c} className="flex-1 h-6 rounded-lg border border-black/10" style={{background:c}} />
                ))}
              </div>
              <h2 className="text-xl font-black">{PROPOSALS[active].nombre}</h2>
              <p className="text-sm font-bold text-[#0F8B6C] mb-2">{PROPOSALS[active].subtitulo}</p>
              <p className="text-sm text-[#6B6560] leading-relaxed">{PROPOSALS[active].desc}</p>
            </div>

            {/* Scores */}
            <div className="bg-white border border-[#E0D8CC] rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#9B9580] mb-4">Scores estimados</p>
              {Object.entries(PROPOSALS[active].score).map(([k, v]) => (
                <div key={k} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold capitalize text-[#1C1C1A]">
                      {k === 'conversion' ? '🎯 Conversión' : k === 'mobile' ? '📱 UX Mobile' : '🎨 Branding'}
                    </span>
                    <span className="text-xs font-black text-[#0F8B6C]">{v}/100</span>
                  </div>
                  <div className="h-2 bg-[#F2EEE6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F8B6C] rounded-full transition-all duration-500" style={{width:`${v}%`}} />
                  </div>
                </div>
              ))}
            </div>

            {/* Research insights */}
            <div className="bg-[#1C1C1A] text-white rounded-2xl p-5">
              <p className="text-xs font-black text-[#0F8B6C] uppercase tracking-wider mb-3">💡 Research 2026</p>
              <div className="space-y-2 text-xs text-white/70">
                <p>• Baymard: transparencia de precios (+12% conversión)</p>
                <p>• Sticky CTA en mobile aumenta conversión 18%</p>
                <p>• Color picker visual = +23% menos abandonos</p>
                <p>• Trust badges visibles = −15% drop en carrito</p>
                <p>• Descuento por cantidad visible desde producto</p>
              </div>
            </div>

            {/* Nav entre propuestas */}
            <div className="flex gap-2">
              <button onClick={() => setActive(a => Math.max(0,a-1))} disabled={active===0}
                className="flex-1 py-3 bg-white border border-[#E0D8CC] rounded-2xl text-sm font-bold text-[#6B6560] disabled:opacity-40 hover:border-[#0F8B6C]/40 transition-all">
                ← Anterior
              </button>
              <button onClick={() => setActive(a => Math.min(PROPOSALS.length-1,a+1))} disabled={active===PROPOSALS.length-1}
                className="flex-1 py-3 bg-[#0F8B6C] text-white rounded-2xl text-sm font-bold disabled:opacity-40 hover:bg-[#0B6E55] transition-all">
                Siguiente →
              </button>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#9B9580] uppercase tracking-wider">
                Propuesta {PROPOSALS[active].id} / {PROPOSALS.length} · {PROPOSALS[active].nombre}
              </p>
              <div className="flex items-center gap-1">
                {PROPOSALS.map((_,i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i===active ? 'bg-[#0F8B6C] w-6' : 'bg-[#D0C8BC] hover:bg-[#0F8B6C]/50'}`} />
                ))}
              </div>
            </div>
            <Comp />
            <p className="text-center text-[10px] text-[#B0A898] mt-3">
              ⚠️ Mockup solo visual · No afecta el embudo real · Clic en las pestañas para ver cada paso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}