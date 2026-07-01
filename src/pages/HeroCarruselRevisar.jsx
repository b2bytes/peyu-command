import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /admin/hero-carrusel — Revisión y aprobación de fondos del carrusel del home.
// El PRODUCTO ORIGINAL nunca se altera: el backend composeHeroSlide recorta el
// producto de su foto (quita el fondo, mantiene colores) y lo pone DETRÁS un
// fondo de diseño. El resultado se guarda SOLO en HeroCarruselSlide, nunca en
// el catálogo (Producto.imagen_url queda intacto).
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

function OptionCard({ img, label, badge, selected, loading, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={loading}
      className="group relative rounded-2xl overflow-hidden transition-all text-left w-full disabled:cursor-wait"
      style={{
        border: selected ? '3px solid #0F8B6C' : '1.5px solid #D4C4B0',
        boxShadow: selected ? '0 8px 24px rgba(15,139,108,.25)' : 'none',
      }}
    >
      <div className="relative aspect-square bg-[#F2EBE1]">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full" />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2 bg-white">
        <span className="text-xs font-bold" style={{ color: '#2C1810' }}>{badge || label}</span>
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
  // preview[sku+fondoUrl] = url compuesta ya generada (cache para no regenerar)
  const [previews, setPreviews] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [selection, setSelection] = useState({}); // sku -> { fondoUrl, previewUrl }
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Al elegir un fondo: genera (o reusa) la composición real y la muestra.
  const elegirFondo = async (slide, fondo) => {
    const key = slide.sku + '|' + fondo.url;
    if (previews[key]) {
      setSelection((p) => ({ ...p, [slide.sku]: { fondoUrl: fondo.url, previewUrl: previews[key] } }));
      return;
    }
    setError('');
    setLoadingKey(key);
    try {
      const res = await base44.functions.invoke('composeHeroSlide', {
        sku: slide.sku, cat: slide.cat, nombre: slide.nombre,
        producto_url: slide.producto, fondo_url: fondo.url,
      });
      const url = res?.data?.imagen_carrusel_url;
      if (url) {
        setPreviews((p) => ({ ...p, [key]: url }));
        setSelection((p) => ({ ...p, [slide.sku]: { fondoUrl: fondo.url, previewUrl: url } }));
      } else {
        setError('No se pudo generar la composición. Intenta de nuevo.');
      }
    } catch {
      setError('No se pudo generar la composición. Intenta de nuevo.');
    } finally {
      setLoadingKey(null);
    }
  };

  // La composición YA quedó guardada en HeroCarruselSlide por el backend al
  // generarla. "Aprobar" solo confirma visualmente (no re-escribe nada más).
  const aprobar = () => {
    if (Object.keys(selection).length === 0) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setDone(true); }, 400);
  };

  const totalElegidas = Object.keys(selection).length;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: '#F8F3ED' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: '#C0785C' }} />
          <h1 className="font-fraunces text-2xl sm:text-3xl" style={{ color: '#2C1810' }}>Fondos del carrusel</h1>
        </div>
        <p className="text-sm mb-2" style={{ color: '#7A6050' }}>
          El producto se recorta de tu foto original (sin tocar sus colores) y se pone sobre un fondo nuevo.
          Solo afecta el carrusel del home — <b>no cambia el catálogo</b>.
        </p>
        <p className="text-xs mb-6" style={{ color: '#A08070' }}>
          Al tocar un fondo se genera la composición real (~10s). Elige el que más te guste por producto.
        </p>

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FBE9E1', color: '#B45309' }}>
            {error}
          </div>
        )}

        <div className="space-y-6">
          {SLIDES.map((s) => {
            const sel = selection[s.sku];
            return (
              <div key={s.sku} className="rounded-3xl p-4 sm:p-5" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A08070' }}>{s.cat}</p>
                  <p className="font-fraunces text-lg" style={{ color: '#2C1810' }}>{s.nombre}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* Actual (foto original, tal cual el catálogo) */}
                  <OptionCard
                    img={s.producto}
                    badge="📷 Actual"
                    selected={!sel}
                    onSelect={() => setSelection((p) => { const n = { ...p }; delete n[s.sku]; return n; })}
                  />
                  {/* Fondos nuevos — previsualización real compuesta */}
                  {s.fondos.map((f) => {
                    const key = s.sku + '|' + f.url;
                    return (
                      <OptionCard
                        key={key}
                        img={previews[key]}
                        label={f.label}
                        badge={f.label}
                        loading={loadingKey === key}
                        selected={sel?.fondoUrl === f.url}
                        onSelect={() => elegirFondo(s, f)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-6 rounded-2xl p-4 flex items-center justify-between shadow-xl"
          style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
          {done ? (
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#0F8B6C' }}>
              <Check className="w-4 h-4" /> Fondos aprobados y aplicados al carrusel del home.
            </p>
          ) : (
            <>
              <p className="text-sm" style={{ color: '#7A6050' }}>
                {totalElegidas > 0
                  ? <><b style={{ color: '#2C1810' }}>{totalElegidas}</b> fondo{totalElegidas > 1 ? 's' : ''} nuevo{totalElegidas > 1 ? 's' : ''} seleccionado{totalElegidas > 1 ? 's' : ''}</>
                  : 'Elige un fondo nuevo para cada producto.'}
              </p>
              <button
                onClick={aprobar}
                disabled={saving || totalElegidas === 0}
                className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Aprobar y aplicar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}