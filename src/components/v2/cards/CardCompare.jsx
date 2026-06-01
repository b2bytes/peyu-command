import { formatCLP } from '@/lib/v2-catalog';

// Tabla de comparación lado a lado de 2-3 productos, en el río del chat.
export default function CardCompare({ data, perfil, onPick }) {
  const productos = (data?.productos || []).slice(0, 3);
  if (productos.length < 2) return null;

  const precioDe = (p) => {
    if (perfil === 'b2b') {
      const t = p.precio_b2b_tramos || {};
      return `Desde ${formatCLP(t.t2000_mas || t.t1000_1999 || t.unitario)} c/u`;
    }
    return formatCLP(p.precio_b2c);
  };

  return (
    <div className="v2-card v2-fade-up p-3 w-full max-w-[560px] overflow-x-auto v2-scroll">
      <table className="v2-compare">
        <thead>
          <tr>
            <th></th>
            {productos.map((p) => (
              <th key={p.sku} className="min-w-[120px]">
                <button onClick={() => onPick?.(p)} className="flex flex-col gap-1">
                  {p.imagen_url && <img src={p.imagen_url} alt="" loading="lazy" decoding="async" className="w-16 h-16 rounded-lg object-cover" style={{ background: 'var(--v2-surface-2)', backfaceVisibility: 'hidden' }} />}
                  <span className="font-semibold line-clamp-2" style={{ color: 'var(--v2-fg)' }}>{p.nombre}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Precio</th>
            {productos.map((p) => <td key={p.sku} style={{ color: 'var(--v2-gold)', fontWeight: 700 }}>{precioDe(p)}</td>)}
          </tr>
          <tr>
            <th>Categoría</th>
            {productos.map((p) => <td key={p.sku}>{p.categoria_v2 || '—'}</td>)}
          </tr>
          <tr>
            <th>Incluye</th>
            {productos.map((p) => <td key={p.sku} className="line-clamp-3">{p.incluye_v2 || '—'}</td>)}
          </tr>
          <tr>
            <th>Personalización</th>
            {productos.map((p) => <td key={p.sku}>✦ Logo láser gratis +10u</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}