import { useState, useEffect, useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SEOHead from '@/components/SEOHead';
import { Search, SlidersHorizontal, PackageOpen, Smartphone, AlertCircle, X } from 'lucide-react';

import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import ResumeJourneyBannerV2 from '@/components/shopv2/ResumeJourneyBannerV2';
import ProductCardV2 from '@/components/shopv2/ProductCardV2';
import PhoneModelsModal from '@/components/shopv2/PhoneModelsModal';
import { CATEGORIAS_V2 } from '@/lib/shop-v2-config';
import { modeloDe, marcaDe, modelosDisponibles, marcasDisponibles } from '@/lib/phone-models-v2';

// ════════════════════════════════════════════════════════════════════════
// /CatalogoNuevo — Grilla del Shop v2 (Tema 6). Filtro por categoría (chips) +
// búsqueda + filtro por MODELO de teléfono visible (Baymard) en carcasas.
// ════════════════════════════════════════════════════════════════════════
const MemoProductCardV2 = memo(ProductCardV2);

export default function CatalogoNuevo() {
  const location = useLocation();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');
  const [marca, setMarca] = useState('Todas');
  const [modelo, setModelo] = useState('Todos');
  const [retry, setRetry] = useState(0);
  const [openModelsModal, setOpenModelsModal] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await base44.entities.Producto.filter({ activo: true }, '-updated_date', 150);
        const b2c = (data || []).filter(
          (p) => p.canal !== 'B2B Exclusivo' && p.categoria !== 'Gift Card' && p.precio_b2c
        );
        setProductos(b2c);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [retry]);

  // Pre-filtro por ?cat= y ?q= (este último alimenta la búsqueda de Google
  // sitelinks searchbox, que apunta a /CatalogoNuevo?q={search_term_string}).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preCat = params.get('cat');
    if (preCat) setCat(preCat);
    const preQ = params.get('q');
    if (preQ) setQ(preQ);
  }, [location.search]);

  // Reset filtros marca/modelo al cambiar de categoría; modelo al cambiar marca.
  useEffect(() => { setMarca('Todas'); setModelo('Todos'); }, [cat]);
  useEffect(() => { setModelo('Todos'); }, [marca]);

  const esCarcasas = cat === 'Carcasas B2C';

  // Carcasas: navegación por MARCA (categoría) → MODELO (subcategoría).
  const carcasas = useMemo(
    () => productos.filter((p) => p.categoria === 'Carcasas B2C'),
    [productos]
  );
  const marcas = useMemo(() => (esCarcasas ? marcasDisponibles(carcasas) : []), [carcasas, esCarcasas]);
  const modelos = useMemo(() => {
    if (!esCarcasas) return [];
    return modelosDisponibles(carcasas, marca === 'Todas' ? null : marca);
  }, [carcasas, esCarcasas, marca]);

  const filtrados = useMemo(() => {
    let list = productos;
    if (cat === 'Corporativo') {
      // Corporativo: productos con categoría Corporativo + todo el catálogo apto
      // para empresas (canal B2B + B2C). Así la categoría nunca queda vacía.
      list = list.filter((p) => p.categoria === 'Corporativo' || p.canal === 'B2B + B2C');
    } else if (cat !== 'Todos') {
      list = list.filter((p) => p.categoria === cat);
    }
    if (esCarcasas && marca !== 'Todas') list = list.filter((p) => marcaDe(p) === marca);
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
  }, [productos, cat, q, esCarcasas, marca, modelo]);

  const chips = ['Todos', ...CATEGORIAS_V2.map((c) => c.cat)];
  const chipLabel = (c) =>
    c === 'Todos' ? 'Todos' : CATEGORIAS_V2.find((x) => x.cat === c)?.label || c;

  if (error) {
    return (
      <div className="font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: '#FBE9E1', border: '1.5px solid #D96B4D' }}>
            <AlertCircle className="w-8 h-8" style={{ color: '#D96B4D' }} />
          </div>
          <h1 className="font-fraunces text-xl mb-2">Error cargando tienda</h1>
          <p className="text-sm mb-6" style={{ color: '#7A6050' }}>Intenta de nuevo en unos segundos.</p>
          <button
            onClick={() => setRetry(r => r + 1)}
            className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-inter max-w-[100vw] overflow-x-hidden" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEOHead
        title="Catálogo de Productos Sustentables · Reciclados | PEYU Chile"
        description="Explora el catálogo completo de PEYU: carcasas iPhone recicladas, organizadores de escritorio, maceteros y regalos corporativos en plástico 100% reciclado. Hecho en Chile, envío a todo el país."
        url="https://peyuchile.cl/CatalogoNuevo"
        type="website"
      />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5">
        <CheckoutStepperV2 current="tienda" />
        <ResumeJourneyBannerV2 />
        {/* Título compacto en mobile: una sola línea (título + claim inline) */}
        <div className="mb-1.5 sm:mb-3 flex items-baseline gap-2 sm:block">
          <h1 className="font-fraunces text-lg sm:text-4xl mb-0" style={{ color: '#2C1810' }}>Nuestra tienda</h1>
          <p className="text-[10px] sm:text-sm truncate" style={{ color: '#7A6050' }}>100% reciclado · Chile 🇨🇱</p>
        </div>

        {/* Buscador */}
        <div className="relative mb-2 sm:mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#A78B6F]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="w-full h-8 sm:h-11 pl-8 sm:pl-9 pr-3 sm:pr-4 rounded-lg sm:rounded-2xl text-[11px] sm:text-sm focus:outline-none transition-all"
            style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
            onFocus={e => { e.target.style.borderColor = '#C0785C'; e.target.style.boxShadow = '0 0 0 3px rgba(192,120,92,.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#D4C4B0'; e.target.style.boxShadow = 'none'; }}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 peyu-tap-sm"
              style={{ background: '#F2EBE1', color: '#7A6050' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chips de categoría */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 mb-2 sm:mb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
          <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#A78B6F] flex-shrink-0" />
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold transition-all whitespace-nowrap"
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

        {/* Carcasas: filtro por MARCA (categoría) */}
        {esCarcasas && marcas.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 mb-1.5 sm:mb-3 -mx-3 sm:mx-0 px-3 sm:px-0">
            <span className="text-[10px] sm:text-xs font-bold flex-shrink-0" style={{ color: '#A78B6F' }}>Marca</span>
            {['Todas', ...marcas].map((m) => (
              <button
                key={m}
                onClick={() => setMarca(m)}
                className="flex-shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap"
                style={{
                  background: marca === m ? '#2C1810' : 'white',
                  color: marca === m ? 'white' : '#7A6050',
                  border: `1.5px solid ${marca === m ? '#2C1810' : '#D4C4B0'}`,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Carcasas: filtro por MODELO (subcategoría de la marca elegida) */}
         {esCarcasas && modelos.length > 0 && (
          <>
            {/* Mobile: solo botón */}
            <button
              onClick={() => setOpenModelsModal(true)}
              className="lg:hidden w-full mb-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#7A6050' }}
            >
              <Smartphone className="w-4 h-4" /> {modelo === 'Todos' ? 'Ver modelos' : modelo}
            </button>

            {/* Desktop: chips horizontal compactos */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-6 -mx-6 px-6">
              <Smartphone className="w-4 h-4 text-[#A78B6F] flex-shrink-0" />
              {['Todos', ...modelos.slice(0, 10)].map((m) => (
                <button
                  key={m}
                  onClick={() => setModelo(m)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                  style={{
                    background: modelo === m ? '#8BAD8A' : 'white',
                    color: modelo === m ? 'white' : '#7A6050',
                    border: `1.5px solid ${modelo === m ? '#8BAD8A' : '#D4C4B0'}`,
                  }}
                >
                  {m === 'Todos' ? 'Modelos' : m}
                </button>
              ))}
              {modelos.length > 10 && (
                <button
                  onClick={() => setOpenModelsModal(true)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{ background: '#F2EBE1', color: '#7A6050', border: '1.5px solid #D4C4B0' }}
                >
                  +{modelos.length - 10}
                </button>
              )}
            </div>

            {/* Modal de modelos */}
            {openModelsModal && (
              <PhoneModelsModal
                modelos={modelos}
                selected={modelo}
                onSelect={setModelo}
                onClose={() => setOpenModelsModal(false)}
              />
            )}
          </>
        )}

        {/* Grilla */}
         {loading ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
             {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="aspect-[3/4] rounded-2xl sm:rounded-3xl animate-pulse will-change-auto" style={{ background: '#EDE3D6', border: '1px solid #D4C4B0' }} />
             ))}
           </div>
         ) : filtrados.length === 0 ? (
           <div className="text-center py-14 sm:py-20">
             <PackageOpen className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3" style={{ color: '#A08070' }} />
             <p className="font-bold text-sm sm:text-base" style={{ color: '#2C1810' }}>No encontramos productos</p>
             <p className="text-xs sm:text-sm mt-1" style={{ color: '#7A6050' }}>Prueba con otra categoría o búsqueda.</p>
             <button
               onClick={() => { setCat('Todos'); setQ(''); setMarca('Todas'); setModelo('Todos'); }}
               className="mt-5 inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-2xl transition-all active:scale-95"
               style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 6px 20px rgba(192,120,92,.25)' }}
             >
               Ver todo el catálogo
             </button>
           </div>
         ) : (
           <>
             <p className="text-[10px] sm:text-xs text-[#A78B6F] mb-1.5 sm:mb-3 font-semibold">{filtrados.length} productos</p>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
               {filtrados.map((p, i) => <MemoProductCardV2 key={p.id} producto={p} index={i} />)}
             </div>
           </>
         )}
      </div>

      <footer className="py-5 sm:py-8 text-center text-xs mt-4 sm:mt-6" style={{ borderTop: '1px solid #D4C4B0', color: '#A08070' }}>
        PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>

    </div>
  );
}