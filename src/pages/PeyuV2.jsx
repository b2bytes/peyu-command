import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import '@/styles/v2-warm-dusk.css';
import { V2_CATEGORIES, groupByCategoria } from '@/lib/v2-catalog';
import V2Hero from '@/components/v2/V2Hero';
import V2ProductCard from '@/components/v2/V2ProductCard';
import V2ProductDetail from '@/components/v2/V2ProductDetail';
import V2ChatPanel from '@/components/v2/V2ChatPanel';
import { ShoppingCart, Leaf } from 'lucide-react';

// Página /v2 "Peyu Commerce OS" — AISLADA. Lee solo productos mostrar_en_v2===true.
export default function PeyuV2() {
  const [mode, setMode] = useState('b2c'); // default Personal
  const [activeCat, setActiveCat] = useState('Todos');
  const [detail, setDetail] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState(null);
  const [cartCount, setCartCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carrito') || '[]').length; } catch { return 0; }
  });

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['v2-productos'],
    queryFn: () => base44.entities.Producto.filter({ mostrar_en_v2: true }, '-created_date', 100),
    initialData: [],
  });

  const groups = useMemo(() => groupByCategoria(productos), [productos]);
  const cats = ['Todos', ...V2_CATEGORIES];

  const visibleCats = activeCat === 'Todos' ? V2_CATEGORIES : [activeCat];

  const handleAsk = (q) => {
    setChatSeed(q);
    setChatOpen(true);
  };

  const handleQuote = (producto) => {
    setDetail(null);
    setChatSeed(`Quiero cotizar por volumen: ${producto.nombre}. ¿Me ayudas con precios y personalización con logo?`);
    setChatOpen(true);
  };

  const handleAddCart = (producto, color) => {
    try {
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
      carrito.push({
        sku: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio_b2c,
        imagen: producto.imagen_url,
        cantidad: 1,
        color,
      });
      localStorage.setItem('carrito', JSON.stringify(carrito));
      setCartCount(carrito.length);
      window.dispatchEvent(new Event('peyu:cart-added'));
    } catch { /* noop */ }
  };

  return (
    <div className="v2-root v2-scroll">
      <V2Hero mode={mode} onModeChange={setMode} onAsk={handleAsk} />

      {/* Chips categoría */}
      <nav className="px-4 max-w-5xl mx-auto flex gap-2 overflow-x-auto v2-scrollbar-hide pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            data-active={activeCat === c}
            className="v2-chip px-4 py-2 text-xs flex-shrink-0"
          >
            {c}
          </button>
        ))}
      </nav>

      {/* Grilla por categoría */}
      <main className="px-4 max-w-5xl mx-auto pb-28 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="v2-card aspect-[3/4]" style={{ opacity: 0.4 }} />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <p className="text-center text-sm py-16" style={{ color: 'var(--v2-fg-muted)' }}>
            Catálogo en preparación 🐢
          </p>
        ) : (
          visibleCats.map((cat) => (
            groups[cat] && groups[cat].length > 0 && (
              <section key={cat} className="mb-10">
                <h2 className="v2-display text-xl mb-3 flex items-center gap-2" style={{ color: 'var(--v2-fg)' }}>
                  {cat}
                  <span className="text-xs font-sans font-normal" style={{ color: 'var(--v2-fg-subtle)' }}>
                    · {groups[cat].length}
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {groups[cat].map((p, i) => (
                    <V2ProductCard key={p.id} producto={p} mode={mode} index={i} onOpen={setDetail} />
                  ))}
                </div>
              </section>
            )
          ))
        )}
      </main>

      {/* Footer mini */}
      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--v2-border)' }}>
        <p className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--v2-fg-muted)' }}>
          <Leaf className="w-3.5 h-3.5" style={{ color: 'var(--v2-teal)' }} />
          PEYU · Plástico 100% reciclado chileno · Garantía 10 años
        </p>
      </footer>

      {/* FAB carrito (solo B2C) */}
      {mode === 'b2c' && cartCount > 0 && (
        <a
          href="/cart"
          className="v2-btn-primary fixed bottom-5 right-5 z-[110] w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-[10px] font-bold rounded-full flex items-center justify-center" style={{ background: 'var(--v2-gold)', color: '#2a1f2b' }}>
            {cartCount}
          </span>
        </a>
      )}

      {detail && (
        <V2ProductDetail
          producto={detail}
          mode={mode}
          onClose={() => setDetail(null)}
          onAddCart={handleAddCart}
          onQuote={handleQuote}
        />
      )}

      <V2ChatPanel
        open={chatOpen}
        seedMessage={chatSeed}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}