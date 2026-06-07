// ============================================================================
// ProductPhotoLibrary · Galería completa de fotos reales de productos PEYU
// Permite seleccionar una foto como referencia para generación IA.
// Muestra todos los productos activos (B2B + carcasas) con sus fotos reales.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Check, Image as ImageIcon, Package, X } from 'lucide-react';

const CATS = ['Todos', 'Carcasas B2C', 'Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo'];

export default function ProductPhotoLibrary({ onSelect, selectedUrl }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');
  const [expanded, setExpanded] = useState(null); // productoId con galería expandida

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, 'nombre', 200)
      .then(data => {
        // Todos los productos con al menos una imagen
        const conFoto = (data || []).filter(p => p.imagen_url || (p.galeria_urls?.length > 0));
        setProductos(conFoto);
      })
      .finally(() => setLoading(false));
  }, []);

  // Aplanar todos los productos → filas de (producto + imagen)
  const allPhotos = useMemo(() => {
    const rows = [];
    productos.forEach(p => {
      const imgs = [];
      if (p.imagen_url) imgs.push({ url: p.imagen_url, label: 'Principal', isMain: true });
      if (Array.isArray(p.galeria_urls)) {
        p.galeria_urls
          .filter(u => u?.startsWith('http') && u !== p.imagen_url)
          .forEach((u, i) => imgs.push({ url: u, label: `Ángulo ${i + 1}`, isMain: false }));
      }
      // También imágenes por color (carcasas)
      if (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') {
        Object.entries(p.imagenes_por_color).forEach(([color, u]) => {
          if (u?.startsWith('http') && !imgs.some(i => i.url === u)) {
            imgs.push({ url: u, label: color, isMain: false });
          }
        });
      }
      if (imgs.length > 0) {
        rows.push({ producto: p, imgs });
      }
    });
    return rows;
  }, [productos]);

  const filtered = useMemo(() => {
    let list = allPhotos;
    if (cat !== 'Todos') list = list.filter(r => r.producto.categoria === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.producto.nombre?.toLowerCase().includes(q) ||
        r.producto.sku?.toLowerCase().includes(q) ||
        r.producto.descripcion?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allPhotos, cat, search]);

  const catCounts = useMemo(() => {
    const map = { Todos: allPhotos.length };
    CATS.slice(1).forEach(c => { map[c] = allPhotos.filter(r => r.producto.categoria === c).length; });
    return map;
  }, [allPhotos]);

  const totalFotos = useMemo(() => filtered.reduce((acc, r) => acc + r.imgs.length, 0), [filtered]);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-12 text-white/40">
      <Loader2 className="w-4 h-4 animate-spin" /> Cargando fotos del catálogo…
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white/80 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-violet-400" />
            Fotos reales del catálogo PEYU
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">{filtered.length} productos · {totalFotos} fotografías</p>
        </div>
        {selectedUrl && (
          <div className="flex items-center gap-2">
            <img src={selectedUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-violet-400/50" />
            <button onClick={() => onSelect(null)} className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1">
              <X className="w-3 h-3" /> Quitar
            </button>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto, SKU…"
          className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {/* Chips de categoría */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {CATS.map(c => {
          const count = catCounts[c] || 0;
          if (c !== 'Todos' && count === 0) return null;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                cat === c
                  ? 'bg-violet-500 text-white'
                  : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
              }`}
            >
              {c} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de productos con sus fotos */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto peyu-scrollbar-light pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-xs">Sin productos con estos filtros</div>
        ) : (
          filtered.map(({ producto, imgs }) => {
            const isExpanded = expanded === producto.id;
            const displayImgs = isExpanded ? imgs : imgs.slice(0, 5);
            const extra = imgs.length - 5;

            return (
              <div key={producto.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-2.5">
                {/* Info del producto */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/80 truncate">{producto.nombre}</p>
                    <p className="text-[10px] text-white/30">{producto.sku} · {producto.categoria} · {imgs.length} foto{imgs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Grid de miniaturas */}
                <div className="flex flex-wrap gap-1.5">
                  {displayImgs.map((img, i) => {
                    const isSelected = selectedUrl === img.url;
                    return (
                      <button
                        key={i}
                        onClick={() => onSelect(isSelected ? null : img.url)}
                        title={`${producto.nombre} · ${img.label}`}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 group ${
                          isSelected
                            ? 'border-violet-400 ring-2 ring-violet-400/40'
                            : 'border-white/10 hover:border-violet-400/50'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-violet-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white/70 text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate px-0.5">
                          {img.label}
                        </div>
                      </button>
                    );
                  })}

                  {/* Botón "ver más" */}
                  {!isExpanded && extra > 0 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : producto.id)}
                      className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-[10px] font-bold"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mb-0.5" />
                      +{extra}
                    </button>
                  )}
                  {isExpanded && (
                    <button
                      onClick={() => setExpanded(null)}
                      className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-[10px] font-bold"
                    >
                      <X className="w-3.5 h-3.5 mb-0.5" />
                      menos
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}