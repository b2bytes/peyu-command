import { V2_B2B_TRAMOS, formatCLP } from '@/lib/v2-catalog';

// Tabla de precios por volumen B2B (8 tramos). Precios por unidad, sin IVA.
export default function V2B2BPriceTable({ tramos, compact = false }) {
  if (!tramos) return null;
  const rows = V2_B2B_TRAMOS.filter((t) => tramos[t.key] !== undefined && tramos[t.key] !== null);
  if (rows.length === 0) return null;

  return (
    <div>
      <table className="v2-price-table">
        <thead>
          <tr>
            <th>Cantidad</th>
            <th>Precio / unidad</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.key}>
              <td>{t.label}</td>
              <td>{formatCLP(tramos[t.key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--v2-fg-subtle)' }}>
          Precios por unidad · Excluyen IVA
        </p>
      )}
    </div>
  );
}