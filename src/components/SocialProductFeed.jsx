import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Share2, Bookmark, ShoppingCart, Building2, Loader2 } from 'lucide-react';
import { getProductImage } from '@/utils/productImages.js';

const CATEGORIES = ['Todos', 'Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];

const formatCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

// Pseudo-random pero estable por SKU para likes/comentarios — se ve "real"
// sin golpear backend. No afecta negocio, es decorativo.
const seeded = (str, min, max) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return min + (Math.abs(h) % (max - min));
};

export default function SocialProductFeed() {
  const [filter, setFilter] = useState('Todos');
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['social-feed-productos'],
    queryFn: () => base44.entities.Producto.filter({ activo: true }, '-created_date', 60),
    staleTime: 5 * 60 * 1000,
  });

  // Persistir likes en localStorage para que se mantengan
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('peyu_feed_likes') || '{}');
      setLiked(stored);
    } catch {}
  }, []);

  const toggleLike = (sku) => {
    setLiked(prev => {
      const next = { ...prev, [sku]: !prev[sku] };
      try { localStorage.setItem('peyu_feed_likes', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleSave = (sku) => setSaved(prev => ({ ...prev, [sku]: !prev[sku] }));

  const filtered = useMemo(() => {
    if (filter === 'Todos') return productos;
    return productos.filter(p => p.categoria === filter);
  }, [productos, filter]);

  const sharePost = async (producto) => {
    const url = `${window.location.origin}/producto/${producto.id}`;
    const title = `${producto.nombre} · PEYU Chile`;
    if (navigator.share) {
      try { await navigator.share({ title, url, text: producto.descripcion || '' }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado al portapapeles');
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Filtros tipo "Stories" horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              filter === cat
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-teal-400 shadow-lg shadow-teal-500/30'
                : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-white/60">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Cargando productos...
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-white/60 text-sm">
          No hay productos en esta categoría aún.
        </div>
      )}

      {/* Feed Grid — estilo Instagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((producto) => {
          const sku = producto.sku || producto.id;
          const baseLikes = seeded(sku, 180, 3200);
          const comments = seeded(sku + 'c', 12, 280);
          const isLiked = !!liked[sku];
          const likesCount = baseLikes + (isLiked ? 1 : 0);
          const img = getProductImage(producto);
          const precio = producto.precio_b2c || producto.precio_base_b2b || 0;
          const esCarcasa = producto.categoria === 'Carcasas B2C';

          return (
            <article
              key={producto.id}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col"
            >
              {/* Post Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 via-cyan-500 to-emerald-500 p-[2px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg">🐢</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-gray-900 leading-tight truncate">peyu.chile</p>
                  <p className="text-[10px] text-gray-500 leading-tight truncate">{producto.categoria} · Chile</p>
                </div>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full flex-shrink-0">
                  ♻️ Eco
                </span>
              </div>

              {/* Imagen del producto — linkea al detalle */}
              <Link to={`/producto/${producto.id}`} className="relative block aspect-square bg-gray-50 group overflow-hidden">
                <img
                  src={img}
                  alt={producto.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {producto.personalizacion_gratis_desde > 0 && (
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    ✨ Personalizable
                  </span>
                )}
                {producto.stock_actual > 0 && producto.stock_actual < 20 && (
                  <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    🔥 Últimas {producto.stock_actual}
                  </span>
                )}
              </Link>

              {/* Actions row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(sku)} className="transition-transform active:scale-125" aria-label="Me gusta">
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-800 hover:text-red-400'}`} />
                  </button>
                  <Link to={`/producto/${producto.id}#reviews`} aria-label="Comentar">
                    <MessageCircle className="w-6 h-6 text-gray-800 hover:text-blue-500" />
                  </Link>
                  <button onClick={() => sharePost(producto)} aria-label="Compartir">
                    <Share2 className="w-6 h-6 text-gray-800 hover:text-teal-500" />
                  </button>
                </div>
                <button onClick={() => toggleSave(sku)} aria-label="Guardar">
                  <Bookmark className={`w-6 h-6 ${saved[sku] ? 'fill-gray-800 text-gray-800' : 'text-gray-800 hover:text-gray-600'}`} />
                </button>
              </div>

              {/* Likes + Copy */}
              <div className="px-4 pb-2">
                <p className="font-bold text-xs text-gray-900">{likesCount.toLocaleString('es-CL')} me gusta</p>
              </div>

              <div className="px-4 pb-3 flex-1">
                <p className="text-sm text-gray-900 leading-relaxed">
                  <span className="font-bold">peyu.chile</span>{' '}
                  <span className="font-semibold">{producto.nombre}</span>
                  {producto.descripcion && (
                    <span className="text-gray-700"> — {producto.descripcion.slice(0, 90)}{producto.descripcion.length > 90 ? '…' : ''}</span>
                  )}
                </p>
                <p className="text-[11px] text-teal-600 font-semibold mt-1.5">
                  #PEYU #RegalosSostenibles #{(producto.material || '').replace(/\s+/g, '')}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Ver los {comments} comentarios</p>
              </div>

              {/* Precio + CTAs */}
              <div className="border-t border-gray-100 px-4 py-3 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-baseline justify-between mb-2.5">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Precio B2C</p>
                    <p className="text-xl font-black text-gray-900">{formatCLP(precio)}</p>
                  </div>
                  {producto.precio_500_mas && (
                    <div className="text-right">
                      <p className="text-[10px] text-teal-600 uppercase font-bold tracking-wide">Desde 500u</p>
                      <p className="text-sm font-bold text-teal-700">{formatCLP(producto.precio_500_mas)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/producto/${producto.id}`}>
                    <button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition">
                      <ShoppingCart className="w-3.5 h-3.5" /> Comprar
                    </button>
                  </Link>
                  <Link to={esCarcasa ? `/producto/${producto.id}` : `/b2b/self-service?sku=${encodeURIComponent(sku)}`}>
                    <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-teal-500/20">
                      <Building2 className="w-3.5 h-3.5" /> Cotizar B2B
                    </button>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}