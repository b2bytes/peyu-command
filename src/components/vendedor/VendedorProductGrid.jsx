import VendedorProductCard from './VendedorProductCard';

// ════════════════════════════════════════════════════════════════════════
// VendedorProductGrid — Cuando el agente recomienda varios productos, los
// muestra en un carrusel horizontal scrolleable (1 card) o grilla (2+).
// En desktop el panel es ancho → grilla de 2 columnas; en mobile, scroll.
// ════════════════════════════════════════════════════════════════════════
export default function VendedorProductGrid({ productos = [] }) {
  const items = productos.filter(Boolean);
  if (!items.length) return null;

  if (items.length === 1) {
    return <VendedorProductCard producto={items[0]} />;
  }

  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto pb-1 px-1 peyu-scrollbar lg:grid lg:grid-cols-2 lg:overflow-visible lg:mx-0 lg:px-0">
      {items.map((p) => (
        <div key={p.id || p.sku} className="flex-shrink-0 w-[260px] lg:w-auto">
          <VendedorProductCard producto={p} />
        </div>
      ))}
    </div>
  );
}