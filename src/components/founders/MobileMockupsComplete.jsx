import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Smartphone } from 'lucide-react';
import PhoneShell from './mobile/PhoneShell';
import { ScreenInicio, ScreenTienda, ScreenProducto, ScreenCarrito } from './mobile/PhoneScreens';

// ════════════════════════════════════════════════════════════════════════
// MobileMockupsComplete — Mockups móviles COMPLETOS de PEYU para fundadores.
// Reemplaza los mockups genéricos de 1 pantalla. Cada dirección visual se
// muestra como un FLUJO completo: Inicio · Tienda · Producto · Carrito, con
// productos reales, precios CLP, navegación y barra inferior — como la app
// de verdad. El selector cambia la dirección visual (paleta + estética).
// ════════════════════════════════════════════════════════════════════════

const DIRECTIONS = [
  {
    id: 'warm', name: 'Warm Clay', tagline: 'Cálido editorial · crema + terracota',
    desc: 'La identidad PEYU actual llevada a su mejor versión: papel cremoso, Fraunces editorial y acentos terracota.',
    bgCanvas: '#FBF7F0', accent: '#C0785C', green: '#0F8B6C', dark: false,
  },
  {
    id: 'eco', name: 'Eco Fresco', tagline: 'Natural vibrante · verde + crema',
    desc: 'Más naturaleza y frescura: verde PEYU protagonista, fondos claros y un aire orgánico y sostenible.',
    bgCanvas: '#F2F5EE', accent: '#0F8B6C', green: '#0B6E55', dark: false,
  },
  {
    id: 'cockpit', name: 'Dark Cockpit', tagline: 'Premium oscuro · esmeralda + cyan',
    desc: 'Modo noche premium estilo copiloto: fondo profundo, glow esmeralda y cyan, sensación tech y futurista.',
    bgCanvas: '#0A0F1E', accent: '#D96B4D', green: '#14B894', dark: true,
  },
];

const SCREENS = [
  { id: 'inicio', label: 'Inicio', Comp: ScreenInicio },
  { id: 'tienda', label: 'Tienda', Comp: ScreenTienda },
  { id: 'producto', label: 'Producto', Comp: ScreenProducto },
  { id: 'carrito', label: 'Carrito', Comp: ScreenCarrito },
];

export default function MobileMockupsComplete() {
  const [activeDir, setActiveDir] = useState('warm');
  const v = DIRECTIONS.find((d) => d.id === activeDir);

  return (
    <section className="max-w-[1600px] mx-auto px-6 pt-10 pb-6">
      {/* header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Smartphone className="w-3.5 h-3.5" /> Mockups móviles completos · flujo real
        </span>
        <h2 className="text-3xl md:text-5xl font-bold font-jakarta text-slate-900 leading-tight tracking-tight mb-2">
          La app PEYU, pantalla por pantalla
        </h2>
        <p className="text-slate-600 max-w-3xl leading-relaxed">
          No es solo la home: aquí ves el <strong>flujo completo</strong> — Inicio, Tienda, ficha de Producto y
          Carrito — con <strong>productos reales</strong>, precios en CLP y navegación, tal como se vería en el celular.
          Elige una dirección visual para ver cómo se siente toda la experiencia.
        </p>
      </div>

      {/* selector de dirección */}
      <div className="flex flex-wrap gap-2 mb-8">
        {DIRECTIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDir(d.id)}
            className={`px-4 py-2.5 rounded-2xl text-left transition-all ${activeDir === d.id ? 'shadow-lg scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}
            style={{
              background: activeDir === d.id ? (d.dark ? '#0A0F1E' : d.bgCanvas) : 'white',
              border: `1.5px solid ${activeDir === d.id ? d.accent : '#e5e7eb'}`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: d.dark && activeDir === d.id ? '#fff' : '#1e293b' }}>{d.name}</p>
            <p className="text-[10px]" style={{ color: d.dark && activeDir === d.id ? 'rgba(255,255,255,.7)' : '#64748b' }}>{d.tagline}</p>
          </button>
        ))}
      </div>

      {/* descripción dirección activa */}
      <div className="rounded-2xl p-4 mb-8" style={{ background: v.dark ? '#0A0F1E' : v.bgCanvas, border: `1.5px solid ${v.accent}33` }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: v.accent }}>Dirección · {v.name}</p>
        <p className="text-sm leading-relaxed" style={{ color: v.dark ? 'rgba(255,255,255,.85)' : '#334155' }}>{v.desc}</p>
      </div>

      {/* los 4 teléfonos del flujo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 justify-items-center">
        {SCREENS.map(({ id, label, Comp }, i) => (
          <motion.div
            key={`${activeDir}-${id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <PhoneShell label={label} bgCanvas={v.bgCanvas} dark={v.dark}>
              <Comp v={v} />
            </PhoneShell>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-8 text-xs font-semibold text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        Flujo completo aprobable · luego se aplica a la tienda real en móvil + escritorio
      </div>
    </section>
  );
}