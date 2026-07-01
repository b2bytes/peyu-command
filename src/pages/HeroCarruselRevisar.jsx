import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, ImageOff, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /admin/hero-carrusel — Revisión y aprobación de fondos del carrusel del home.
// Muestra la foto ACTUAL de cada slide junto a 2 alternativas de fondo con
// color/diseño generadas por IA. El founder elige una por producto y solo al
// aprobar se sube (se guarda como imagen_url del producto).
// ════════════════════════════════════════════════════════════════════════

// Las 8 alternativas generadas, agrupadas por producto (sku).
const SLIDES = [
  {
    cat: 'Escritorio',
    sku: 'HOG-PACK-ESC',
    nombre: 'Pack Escritorio',
    actual: 'https://base44.app/api/apps/69d99b9d61f699701129c103/files/mp/public/69d99b9d61f699701129c103/9516027c9_clasico1.jpg',
    alternativas: [
      { label: 'Verde salvia', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/97a59051b_generated_image.png' },
      { label: 'Terracota', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/38ba318e9_generated_image.png' },
    ],
  },
  {
    cat: 'Entretenimiento',
    sku: '61411',
    nombre: 'Cachos PEYU',
    actual: 'https://base44.app/api/apps/69d99b9d61f699701129c103/files/mp/public/69d99b9d61f699701129c103/03bbe6ddd_cachosss4.jpg',
    alternativas: [
      { label: 'Crema arena', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/7ebfff529_generated_image.png' },
      { label: 'Verde PEYU', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/9b47e5e58_generated_image.png' },
    ],
  },
  {
    cat: 'Carcasas B2C',
    sku: '61825',
    nombre: 'Carcasa marmolada',
    actual: 'https://base44.app/api/apps/69d99b9d61f699701129c103/files/mp/public/69d99b9d61f699701129c103/7a245c098_P30lite.jpg',
    alternativas: [
      { label: 'Blush terracota', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/83a649c0c_generated_image.png' },
      { label: 'Verde bosque', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/1c54bb8d4_generated_image.png' },
    ],
  },
  {
    cat: 'Hogar',
    sku: 'e7ea267ece44',
    nombre: 'Posavasos circulares',
    actual: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/76984d283_redond5.jpg',
    alternativas: [
      { label: 'Avena beige', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/105c1c4cf_generated_image.png' },
      { label: 'Rosa malva', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/2f794e684_generated_image.png' },
    ],
  },
];

function OptionCard({ url, label, selected, onSelect, isActual }) {
  return (
    <button
      onClick={onSelect}
      className="group relative rounded-2xl overflow-hidden transition-all text-left w-full"
      style={{
        border: selected ? '3px solid #0F8B6C' : '1.5px solid #D4C4B0',
        boxShadow: selected ? '0 8px 24px rgba(15,139,108,.25)' : 'none',
      }}
    >
      <div className="aspect-square bg-[#F2EBE1]">
        <img src={url} alt={label} className="w-full h-full object-cover" draggable={false} />
      </div>
      <div className="flex items-center justify-between px-3 py-2 bg-white">
        <span className="text-xs font-bold" style={{ color: '#2C1810' }}>
          {isActual ? '📷 Actual' : label}
        </span>
        {selected && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: '#0F8B6C' }}>
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}

export default function HeroCarruselRevisar() {
  // Selección por sku: la URL elegida (null = mantiene actual).
  const [selection, setSelection] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const aprobar = async () => {
    const cambios = Object.entries(selection).filter(([, url]) => url);
    if (!cambios.length) return;
    setSaving(true);
    for (const [sku, url] of cambios) {
      const prods = await base44.entities.Producto.filter({ sku }, undefined, 1);
      if (prods?.[0]) await base44.entities.Producto.update(prods[0].id, { imagen_url: url });
    }
    setSaving(false);
    setDone(true);
  };

  const totalElegidas = Object.values(selection).filter(Boolean).length;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: '#F8F3ED' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: '#C0785C' }} />
          <h1 className="font-fraunces text-2xl sm:text-3xl" style={{ color: '#2C1810' }}>Fondos del carrusel</h1>
        </div>
        <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
          Elige el fondo para cada producto del carrusel del home. Los fondos nuevos quitan el texto sobreimpreso original.
          Solo se suben al aprobar.
        </p>

        <div className="space-y-6">
          {SLIDES.map((s) => (
            <div key={s.sku} className="rounded-3xl p-4 sm:p-5" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A08070' }}>{s.cat}</p>
                  <p className="font-fraunces text-lg" style={{ color: '#2C1810' }}>{s.nombre}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  url={s.actual}
                  label="Actual"
                  isActual
                  selected={selection[s.sku] === undefined}
                  onSelect={() => setSelection((p) => { const n = { ...p }; delete n[s.sku]; return n; })}
                />
                {s.alternativas.map((a) => (
                  <OptionCard
                    key={a.url}
                    url={a.url}
                    label={a.label}
                    selected={selection[s.sku] === a.url}
                    onSelect={() => setSelection((p) => ({ ...p, [s.sku]: a.url }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Barra de aprobación */}
        <div className="sticky bottom-4 mt-6 rounded-2xl p-4 flex items-center justify-between shadow-xl"
          style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
          {done ? (
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#0F8B6C' }}>
              <Check className="w-4 h-4" /> Fondos aprobados y aplicados al carrusel.
            </p>
          ) : (
            <>
              <p className="text-sm" style={{ color: '#7A6050' }}>
                {totalElegidas > 0
                  ? <><b style={{ color: '#2C1810' }}>{totalElegidas}</b> fondo{totalElegidas > 1 ? 's' : ''} nuevo{totalElegidas > 1 ? 's' : ''} seleccionado{totalElegidas > 1 ? 's' : ''}</>
                  : 'Selecciona un fondo nuevo para aprobar cambios.'}
              </p>
              <button
                onClick={aprobar}
                disabled={saving || totalElegidas === 0}
                className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Aprobar y subir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}