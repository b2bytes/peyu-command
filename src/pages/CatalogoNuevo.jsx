import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, PackageOpen, Smartphone } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
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
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420]">
      <ShopV2Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        <div className="mb-6">
          <h1 className="font-fraunces text-3xl sm:text-4xl mb-1.5">Nuestra tienda</h1>
          <p className="text-[#4B4F54] text-sm">Productos de plástico 100% reciclado, hechos en Chile.</p>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78B6F]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar carcasas, cachos, maceteros..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#EBE3D6] text-sm text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15 transition-all"
          />
        </div>

        {/* Chips de categoría */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-[#A78B6F] flex-shrink-0" />
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                cat === c
                  ? 'bg-[#0F8B6C] text-white shadow-sm'
                  : 'bg-white border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40'
              }`}
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
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  modelo === m
                    ? 'bg-[#D96B4D] text-white shadow-sm'
                    : 'bg-white border border-[#EBE3D6] text-[#4B4F54] hover:border-[#D96B4D]/40'
                }`}
              >
                {m === 'Todos' ? 'Todos los modelos' : m}
              </button>
            ))}
          </div>
        )}

        {/* Grilla */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white border border-[#EBE3D6] animate-pulse" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20">
            <PackageOpen className="w-12 h-12 text-[#A78B6F] mx-auto mb-3" />
            <p className="font-bold text-[#2A2420]">No encontramos productos</p>
            <p className="text-sm text-[#4B4F54] mt-1">Prueba con otra categoría o búsqueda.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#A78B6F] mb-3 font-semibold">{filtrados.length} productos</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtrados.map((p, i) => <ProductCardV2 key={p.id} producto={p} index={i} />)}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] mt-6">
        PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>
    </div>
  );
}