import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, BookOpen, Briefcase, ShoppingCart, Instagram,
  Heart, MessageCircle, Recycle, ArrowRight,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// 4 mockups del rediseño PEYU 2026→2027 — SOLO VISUAL, sin lógica de tienda.
// Viven únicamente en /founders-presentation para aprobación de fundadores.
// Cada mockup es una "concept frame" mostrando la misma propuesta con un
// tratamiento visual distinto: glass cálido, eco-orgánico, editorial pop,
// y community-first. No reemplazan ningún componente real.
// ════════════════════════════════════════════════════════════════════════

const TURTLE = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png';

const VARIANTS = [
  {
    id: 'glass',
    name: 'Glass Cálido',
    tagline: 'Vidrio líquido · terracota viva',
    desc: 'iOS 26 vibe. Profundidad, blur, micro-destellos. Premium pero juguetón.',
    bg: 'linear-gradient(160deg,#FBF7F0 0%,#F4EBE0 100%)',
    accent: '#C0785C',
    green: '#0F8B6C',
  },
  {
    id: 'eco',
    name: 'Eco Orgánico',
    tagline: 'Texturas reales · formas blandas',
    desc: 'Anti-genérico. Bordes orgánicos, papel reciclado, verde naturaleza.',
    bg: 'linear-gradient(160deg,#F2F5EE 0%,#E6EFDD 100%)',
    accent: '#5B7D4B',
    green: '#0F8B6C',
  },
  {
    id: 'editorial',
    name: 'Editorial Pop',
    tagline: 'Tipografía gigante · color audaz',
    desc: 'Maximalismo 2027. Fraunces protagonista, contraste alto, carácter.',
    bg: 'linear-gradient(160deg,#FFFFFF 0%,#FFF3EC 100%)',
    accent: '#D9542B',
    green: '#0B6E55',
  },
  {
    id: 'community',
    name: 'Community First',
    tagline: '+216K · el feed es la tienda',
    desc: 'Social commerce puro. La comunidad de Instagram al centro de todo.',
    bg: 'linear-gradient(160deg,#0E1A17 0%,#15302A 100%)',
    accent: '#F08560',
    green: '#16C79A',
    dark: true,
  },
];

// ── FAB Personalizar — rediseño con personalidad ──────────────────────────
// wide=true → pill ancho centrado (móvil, encima de la barra). Sin wide → compacto.
function PersonalizarFab({ v, wide }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative inline-flex items-center justify-center gap-2 h-11 rounded-full font-bold text-[13px] text-white overflow-hidden ${
        wide ? 'w-full max-w-[230px] px-5' : 'pl-3.5 pr-4'
      }`}
      style={{
        background: `linear-gradient(135deg, ${v.accent}, ${v.accent}cc)`,
        boxShadow: `0 8px 24px ${v.accent}55, inset 0 1px 0 rgba(255,255,255,.25)`,
      }}
    >
      <motion.span
        animate={{ rotate: [0, 18, -10, 0], scale: [1, 1.18, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.span>
      Personalizar tu regalo
      {/* destello que recorre el botón */}
      <motion.span
        className="absolute inset-0 -skew-x-12"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)' }}
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
      />
    </motion.div>
  );
}

// ── Widget tortuga PEYU flotante — botón firma con respiración ─────────────
function PeyuWidget({ v }) {
  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ background: v.green, filter: 'blur(14px)', opacity: 0.5 }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        whileHover={{ scale: 1.04 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${v.green}, ${v.green}dd)`,
          boxShadow: `0 10px 26px ${v.green}66, inset 0 1px 0 rgba(255,255,255,.3)`,
        }}
      >
        <img src={TURTLE} alt="PEYU" className="w-9 h-9 object-contain brightness-0 invert" draggable={false} />
        {/* badge comunidad */}
        <span className="absolute -top-1.5 -right-1.5 px-1.5 h-5 min-w-[20px] rounded-full bg-white text-[9px] font-extrabold flex items-center justify-center shadow-md" style={{ color: v.green }}>
          216K
        </span>
      </motion.div>
    </div>
  );
}

// ── Barra inferior rediseñada ──────────────────────────────────────────────
function BottomNav({ v }) {
  const items = [
    { icon: BookOpen, label: 'Blog' },
    { icon: Briefcase, label: 'B2B' },
    { icon: ShoppingCart, label: 'Carrito', badge: 2, active: true },
  ];
  return (
    <div
      className="w-full flex items-center justify-around px-4 py-2.5 rounded-2xl backdrop-blur-xl"
      style={{
        background: v.dark ? 'rgba(20,40,35,.7)' : 'rgba(255,255,255,.82)',
        border: `1px solid ${v.dark ? 'rgba(255,255,255,.12)' : v.accent + '22'}`,
        boxShadow: '0 -2px 20px rgba(0,0,0,.06)',
      }}
    >
      {items.map(({ icon: Icon, label, badge, active }) => (
        <div key={label} className="relative flex flex-col items-center gap-1 px-1.5">
          <motion.div whileTap={{ scale: 0.85 }} className="relative">
            <Icon
              className="w-5 h-5"
              style={{ color: active ? v.green : v.dark ? 'rgba(255,255,255,.55)' : '#9A8775' }}
              strokeWidth={active ? 2.4 : 1.8}
            />
            {badge && (
              <span
                className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full text-[9px] font-extrabold text-white flex items-center justify-center"
                style={{ background: v.accent, boxShadow: `0 2px 6px ${v.accent}88` }}
              >
                {badge}
              </span>
            )}
          </motion.div>
          <span
            className="text-[9px] font-bold"
            style={{ color: active ? v.green : v.dark ? 'rgba(255,255,255,.5)' : '#9A8775' }}
          >
            {label}
          </span>
          {active && <span className="w-1 h-1 rounded-full" style={{ background: v.green }} />}
        </div>
      ))}
    </div>
  );
}

// ── Bloque comunidad +216K ──────────────────────────────────────────────────
function CommunityBlock({ v }) {
  const fg = v.dark ? '#FFFFFF' : '#2C1810';
  const fgSoft = v.dark ? 'rgba(255,255,255,.65)' : '#7A6050';
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: v.dark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.7)',
        border: `1px solid ${v.dark ? 'rgba(255,255,255,.1)' : v.accent + '22'}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Instagram className="w-4 h-4" style={{ color: v.accent }} />
          <span className="text-xs font-extrabold" style={{ color: fg }}>Somos comunidad</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: v.green + '22', color: v.green }}>
          +216K 🐢
        </span>
      </div>
      <p className="text-[10px] leading-snug mb-3" style={{ color: fgSoft }}>
        De dos amigos del colegio a la fábrica de plástico reciclado de Chile.
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-lg relative overflow-hidden flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${v.green}33, ${v.accent}33)` }}
          >
            <Recycle className="w-5 h-5" style={{ color: v.green, opacity: 0.6 }} />
            <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
              <Heart className="w-2.5 h-2.5 fill-current" style={{ color: v.accent }} />
              <span className="text-[7px] font-bold" style={{ color: fg }}>{800 + i * 40}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Frame de teléfono que contiene un mockup completo ──────────────────────
function PhoneFrame({ v }) {
  const fg = v.dark ? '#FFFFFF' : '#2C1810';
  const fgSoft = v.dark ? 'rgba(255,255,255,.6)' : '#7A6050';
  return (
    <div
      className="relative mx-auto w-full max-w-[280px] rounded-[2.2rem] p-2.5"
      style={{ background: v.dark ? '#0A1512' : '#1C1410', boxShadow: '0 30px 60px -20px rgba(0,0,0,.4)' }}
    >
      {/* notch */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black/80 z-20" />
      <div
        className="relative rounded-[1.8rem] overflow-hidden h-[500px] flex flex-col"
        style={{ background: v.bg }}
      >
        {/* contenido scroll-fake */}
        <div className="flex-1 overflow-hidden px-3.5 pt-8 pb-2 space-y-3">
          {/* mini hero */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: v.accent }}>Hecho en Chile</p>
            <h3
              className="leading-[0.95] mt-0.5"
              style={{ color: fg, fontFamily: v.id === 'editorial' ? 'Fraunces, serif' : undefined, fontSize: v.id === 'editorial' ? '30px' : '22px', fontWeight: v.id === 'editorial' ? 500 : 800 }}
            >
              {v.id === 'editorial' ? <>Plástico que<br /><span className="italic">vuelve a vivir</span></> : <>Regalos con<br />propósito 🐢</>}
            </h3>
          </div>

          {/* community block */}
          <CommunityBlock v={v} />

          {/* mini product card */}
          <div
            className="rounded-2xl p-3 flex gap-3 items-center"
            style={{ background: v.dark ? 'rgba(255,255,255,.05)' : 'white', border: `1px solid ${v.dark ? 'rgba(255,255,255,.08)' : v.accent + '18'}` }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg,${v.green}22,${v.accent}22)` }}>
              <Recycle className="w-6 h-6" style={{ color: v.green }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold truncate" style={{ color: fg }}>Set Escritorio Pro</p>
              <p className="text-[9px]" style={{ color: fgSoft }}>100% reciclado</p>
              <p className="text-xs font-extrabold mt-0.5" style={{ color: v.accent }}>$24.990</p>
            </div>
          </div>
        </div>

        {/* Widget tortuga: flota SOLO arriba-derecha, separado del FAB */}
        <div className="absolute top-9 right-3.5 z-10 scale-90 origin-top-right pointer-events-none">
          <PeyuWidget v={v} />
        </div>

        {/* Zona inferior: FAB Personalizar (pill ancho) + barra, apilados sin tocarse */}
        <div className="px-2.5 pb-2.5 pt-1 space-y-2.5">
          <div className="flex justify-center">
            <PersonalizarFab v={v} wide />
          </div>
          <BottomNav v={v} />
        </div>
      </div>
    </div>
  );
}

export default function RedesignMockups2027() {
  const [active, setActive] = useState('glass');
  const v = VARIANTS.find((x) => x.id === active);

  return (
    <section className="max-w-[1600px] mx-auto px-6 pt-10 pb-4">
      {/* header de la sección */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Concepto 2026 → 2027 · Comunidad viva
        </span>
        <h2 className="text-3xl md:text-5xl font-bold font-jakarta text-slate-900 leading-tight tracking-tight mb-2">
          4 caras del nuevo PEYU
        </h2>
        <p className="text-slate-600 max-w-3xl leading-relaxed">
          Mockups del rediseño propuesto: <strong>FAB Personalizar</strong>, <strong>widget tortuga 🐢</strong>,
          <strong> barra inferior</strong> y el nuevo <strong>bloque de comunidad +216K</strong>. Todo es visual —
          no afecta la tienda real. Elige una dirección para aprobar.
        </p>
      </div>

      {/* selector de variantes */}
      <div className="flex flex-wrap gap-2 mb-8">
        {VARIANTS.map((variant) => (
          <button
            key={variant.id}
            onClick={() => setActive(variant.id)}
            className={`px-4 py-2.5 rounded-2xl text-left transition-all ${
              active === variant.id ? 'shadow-lg scale-[1.02]' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              background: active === variant.id ? variant.bg : 'white',
              border: `1.5px solid ${active === variant.id ? variant.accent : '#e5e7eb'}`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: variant.dark && active === variant.id ? '#fff' : '#1e293b' }}>
              {variant.name}
            </p>
            <p className="text-[10px]" style={{ color: variant.dark && active === variant.id ? 'rgba(255,255,255,.7)' : '#64748b' }}>
              {variant.tagline}
            </p>
          </button>
        ))}
      </div>

      {/* grid de los 4 teléfonos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {VARIANTS.map((variant) => (
          <motion.div
            key={variant.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl p-5 bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold font-jakarta text-slate-900">{variant.name}</p>
                <p className="text-xs text-slate-500">{variant.tagline}</p>
              </div>
              <span className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: variant.bg, border: `2px solid ${variant.accent}` }} />
            </div>
            <PhoneFrame v={variant} />
            <p className="text-xs text-slate-600 mt-4 leading-relaxed">{variant.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* foco interactivo de la variante seleccionada */}
      <div className="mt-10 rounded-3xl p-6 md:p-8" style={{ background: v.bg, border: `1.5px solid ${v.accent}33` }}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: v.accent }}>Vista detallada</span>
          <span className="font-bold" style={{ color: v.dark ? '#fff' : '#1e293b' }}>· {v.name}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-center">
          <div className="flex flex-col items-center gap-3">
            <PersonalizarFab v={v} />
            <p className="text-xs font-semibold" style={{ color: v.dark ? 'rgba(255,255,255,.7)' : '#475569' }}>Botón Personalizar</p>
          </div>
          <div className="flex flex-col items-center gap-3 py-2">
            <PeyuWidget v={v} />
            <p className="text-xs font-semibold" style={{ color: v.dark ? 'rgba(255,255,255,.7)' : '#475569' }}>Widget tortuga 🐢</p>
          </div>
          <div className="flex flex-col items-center gap-3 w-full max-w-[260px] mx-auto">
            <BottomNav v={v} />
            <p className="text-xs font-semibold" style={{ color: v.dark ? 'rgba(255,255,255,.7)' : '#475569' }}>Barra inferior</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs font-semibold" style={{ color: v.accent }}>
          <MessageCircle className="w-3.5 h-3.5" /> Concepto aprobable · luego se aplica a la tienda real <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </section>
  );
}