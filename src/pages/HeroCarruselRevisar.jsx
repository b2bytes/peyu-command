import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /admin/hero-carrusel — Revisión y aprobación de fondos del carrusel del home.
// El PRODUCTO ORIGINAL nunca cambia: se compone por capas (fondo de diseño +
// la foto real encima con mix-blend-multiply, que integra el producto sobre el
// nuevo fondo sin alterar sus colores). El founder elige un fondo por producto
// y solo al aprobar se sube (se genera la composición final y se guarda).
// ════════════════════════════════════════════════════════════════════════

const SLIDES = [
  {
    cat: 'Escritorio',
    sku: 'HOG-PACK-ESC',
    nombre: 'Pack Escritorio',
    producto: 'https://base44.app/api/apps/69d99b9d61f699701129c103/files/mp/public/69d99b9d61f699701129c103/9516027c9_clasico1.jpg',
    fondos: [
      { label: 'Verde salvia', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/8a0b206d0_generated_image.png' },
      { label: 'Terracota', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2d72f13_generated_image.png' },
    ],
  },
  {
    cat: 'Entretenimiento',
    sku: '61411',
    nombre: 'Cachos PEYU',
    producto: 'https://base44.app/api/apps/69d99b9d61f699701129c103/files/mp/public/69d99b9d61f699701129c103/03bbe6ddd_cachosss4.jpg',
    fondos: [
      { label: 'Crema arena', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/e31aa5077_generated_image.png' },
      { label: 'Verde PEYU', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/1926ad6dd_generated_image.png' },
    ],
  },
  {
    cat: 'Carcasas B2C',
    sku: '61825',
    nombre: 'Carcasa marmolada',
    producto: 'https://base44.app/api/apps/69d99b9d61f699701129c103/files/mp/public/69d99b9d61f699701129c103/7a245c098_P30lite.jpg',
    fondos: [
      { label: 'Blush terracota', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/382f34d17_generated_image.png' },
      { label: 'Verde bosque', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/118011f92_generated_image.png' },
    ],
  },
  {
    cat: 'Hogar',
    sku: 'e7ea267ece44',
    nombre: 'Posavasos circulares',
    producto: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/76984d283_redond5.jpg',
    fondos: [
      { label: 'Avena beige', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/7f4b7c058_generated_image.png' },
      { label: 'Blush cálido', url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/382f34d17_generated_image.png' },
    ],
  },
];

// Composición visual: fondo de diseño + producto real encima (multiply integra
// el producto sobre el fondo sin cambiar sus colores propios).
function Composicion({ fondo, producto, className = '' }) {
  return (
    <div className={`relative aspect-square overflow-hidden ${className}`}>
      <img src={fondo} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <img
        src={producto}
        alt=""
        className="absolute inset-0 w-full h-full object-contain p-[8%]"
        style={{ mixBlendMode: 'multiply' }}
        draggable={false}
      />
    </div>
  );
}

function OptionCard({ fondo, producto, label, selected, onSelect, isActual }) {
  return (
    <button
      onClick={onSelect}
      className="group relative rounded-2xl overflow-hidden transition-all text-left w-full"
      style={{
        border: selected ? '3px solid #0F8B6C' : '1.5px solid #D4C4B0',
        boxShadow: selected ? '0 8px 24px rgba(15,139,108,.25)' : 'none',
      }}
    >
      {isActual ? (
        <div className="aspect-square bg-[#F2EBE1]">
          <img src={producto} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      ) : (
        <Composicion fondo={fondo} producto={producto} />
      )}
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

// Renderiza la composición en un canvas y sube el PNG resultante.
async function componerYSubir(fondoUrl, productoUrl) {
  const load = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
  const [bg, prod] = await Promise.all([load(fondoUrl), load(productoUrl)]);
  const S = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  // Fondo (cover)
  ctx.drawImage(bg, 0, 0, S, S);
  // Producto (contain con 8% de margen, multiply)
  ctx.globalCompositeOperation = 'multiply';
  const pad = S * 0.08;
  const box = S - pad * 2;
  const scale = Math.min(box / prod.width, box / prod.height);
  const w = prod.width * scale, h = prod.height * scale;
  ctx.drawImage(prod, (S - w) / 2, (S - h) / 2, w, h);

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], 'hero-composicion.png', { type: 'image/png' });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

export default function HeroCarruselRevisar() {
  const [selection, setSelection] = useState({}); // sku -> fondo url
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const aprobar = async () => {
    const cambios = SLIDES.filter((s) => selection[s.sku]);
    if (!cambios.length) return;
    setSaving(true);
    for (const s of cambios) {
      const finalUrl = await componerYSubir(selection[s.sku], s.producto);
      const prods = await base44.entities.Producto.filter({ sku: s.sku }, undefined, 1);
      if (prods?.[0]) await base44.entities.Producto.update(prods[0].id, { imagen_url: finalUrl });
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
          El producto es siempre tu foto original — solo cambia el fondo. Elige una composición por producto.
          Se sube solo al aprobar.
        </p>

        <div className="space-y-6">
          {SLIDES.map((s) => (
            <div key={s.sku} className="rounded-3xl p-4 sm:p-5" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A08070' }}>{s.cat}</p>
                <p className="font-fraunces text-lg" style={{ color: '#2C1810' }}>{s.nombre}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  isActual
                  producto={s.producto}
                  selected={selection[s.sku] === undefined}
                  onSelect={() => setSelection((p) => { const n = { ...p }; delete n[s.sku]; return n; })}
                />
                {s.fondos.map((f) => (
                  <OptionCard
                    key={f.url + f.label}
                    fondo={f.url}
                    producto={s.producto}
                    label={f.label}
                    selected={selection[s.sku] === f.url}
                    onSelect={() => setSelection((p) => ({ ...p, [s.sku]: f.url }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

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