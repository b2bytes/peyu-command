import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, PackageOpen, Smartphone } from 'lucide-react';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import ProductCardV2 from '@/components/shopv2/ProductCardV2';
import { CATEGORIAS_V2 } from '@/lib/shop-v2-config';
import { modeloDe, modelosDisponibles } from '@/lib/phone-models-v2';

// ════════════════════════════════════════════════════════════════════════
// /CatalogoNuevo — Grilla del Shop v2 (Tema 6). Filtro por categoría (chips) +
// búsqueda + filtro por MODELO de teléfono visible (Baymard) en carcasas.
// ════════════════════════════════════════════════════════════════════════
export default function CatalogoNuevo() {
  const location = useLocation();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');
  const [modelo, setModelo] = useState('Todos');

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 300)
      .then((data) => {
        const b2c = (data || []).filter(
          (p) => p.canal !== 'B2B Exclusivo' && p.categoria !== 'Gift Card' && p.precio_b2c
        );
        setProductos(b2c);
      })
      .finally(() => setLoading(false));
  }, []);

  // Pre-filtro por ?cat=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preCat = params.get('cat');
    if (preCat) setCat(preCat);
  }, [location.search]);

  // Reset filtro de modelo al cambiar de categoría.
  useEffect(() => { setModelo('Todos'); }, [cat]);

  const esCarcasas = cat === 'Carcasas B2C';

  // Modelos de teléfono disponibles (solo en carcasas).
  const modelos = useMemo(() => {
    if (!esCarcasas) return [];
    return modelosDisponibles(productos.filter((p) => p.categoria === 'Carcasas B2C'));
  }, [productos, esCarcasas]);

  const filtrados = useMemo(() => {
    let list = productos;
    if (cat !== 'Todos') list = list.filter((p) => p.categoria === cat);
    if (esCarcasas && modelo !== 'Todos') list = list.filter((p) => modeloDe(p) === modelo);
    if (q.trim()) {
      const n = q.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(n) ||
          p.categoria?.toLowerCase().includes(n) ||
          p.sku?.toLowerCase().includes(n)
      );
    }
    return list;
  }, [productos, cat, q, esCarcasas, modelo]);

  const chips = ['Todos', ...CATEGORIAS_V2.map((c) => c.cat)];
  const chipLabel = (c) =>
    c === 'Todos' ? 'Todos' : CATEGORIAS_V2.find((x) => x.cat === c)?.label || c;

  return (
    <div className="min-h-screen font-inter pb-16 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <ShopV2Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-7">
        <CheckoutStepperV2 current="tienda" />
        <div className="mb-4 sm:mb-6">
          <h1 className="font-fraunces text-2xl sm:text-4xl mb-1" style={{ color: '#2C1810' }}>Nuestra tienda</h1>
          <p className="text-xs sm:text-sm" style={{ color: '#7A6050' }}>Plástico 100% reciclado · Hecho en Chile.</p>
        </div>

        {/* Buscador */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78B6F]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full h-10 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-2xl text-sm focus:outline-none transition-all"
            style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
            onFocus={e => { e.target.style.borderColor = '#C0785C'; e.target.style.boxShadow = '0 0 0 3px rgba(192,120,92,.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#D4C4B0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Chips de categoría */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 mb-3 sm:mb-4">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#A78B6F] flex-shrink-0" />
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all"
              style={{
                background: cat === c ? '#C0785C' : 'white',
                color: cat === c ? 'white' : '#7A6050',
                border: `1.5px solid ${cat === c ? '#C0785C' : '#D4C4B0'}`,
                boxShadow: cat === c ? '0 4px 12px rgba(192,120,92,.25)' : 'none',
              }}
            >
              {chipLabel(c)}
            </button>
          ))}
        </div>

        {/* Filtro por MODELO de teléfono (visible en carcasas — Baymard) */}
        {esCarcasas && modelos.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
            <Smartphone className="w-4 h-4 text-[#A78B6F] flex-shrink-0" />
            {['Todos', ...modelos].map((m) => (
              <button
                key={m}
                onClick={() => setModelo(m)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: modelo === m ? '#8BAD8A' : 'white',
                  color: modelo === m ? 'white' : '#7A6050',
                  border: `1.5px solid ${modelo === m ? '#8BAD8A' : '#D4C4B0'}`,
                }}
              >
                {m === 'Todos' ? 'Todos los modelos' : m}
              </button>
            ))}
          </div>
        )}

        {/* Grilla */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl sm:rounded-3xl animate-pulse" style={{ background: '#EDE3D6', border: '1px solid #D4C4B0' }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-14 sm:py-20">
            <PackageOpen className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3" style={{ color: '#A08070' }} />
            <p className="font-bold text-sm sm:text-base" style={{ color: '#2C1810' }}>No encontramos productos</p>
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#7A6050' }}>Prueba con otra categoría o búsqueda.</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] sm:text-xs text-[#A78B6F] mb-2 sm:mb-3 font-semibold">{filtrados.length} productos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filtrados.map((p, i) => <ProductCardV2 key={p.id} producto={p} index={i} />)}
            </div>
          </>
        )}
      </div>

      <footer className="py-8 text-center text-xs mt-6" style={{ borderTop: '1px solid #D4C4B0', color: '#A08070' }}>
        PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>

      <MobileNavBarV2 />
    </div>
  );
}