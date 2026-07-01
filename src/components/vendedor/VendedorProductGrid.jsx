import VendedorProductCard from './VendedorProductCard';

// ════════════════════════════════════════════════════════════════════════
// VendedorProductGrid — Cuando el agente recomienda varios productos, los
// muestra en un carrusel horizontal con snap (mobile) o grilla de 2 (desktop).
// El snap hace que cada card se centre al deslizar → sensación de app nativa.
// ════════════════════════════════════════════════════════════════════════
export default function VendedorProductGrid({ productos = [] }) {
  const items = productos.filter(Boolean);
  if (!items.length) return null;

  if (items.length === 1) {
    return <VendedorProductCard producto={items[0]} />;
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-2 lg:overflow-visible lg:mx-0 lg:px-0 lg:snap-none">
      {items.map((p) => (
        <div key={p.id || p.sku} className="flex-shrink-0 w-[270px] lg:w-auto snap-start">
          <VendedorProductCard producto={p} />
        </div>
      ))}
    </div>
  );
}