import { Package } from 'lucide-react';

const fmtCLP = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('es-CL')}`);

const TRAMOS = [
  ['Unitario', 'precio_unitario_clp'],
  ['10-49', 'precio_10_49_clp'],
  ['50-99', 'precio_50_99_clp'],
  ['100-249', 'precio_100_249_clp'],
  ['250-499', 'precio_250_499_clp'],
  ['500-999', 'precio_500_999_clp'],
  ['1000-1999', 'precio_1000_1999_clp'],
  ['2000+', 'precio_2000_mas_clp'],
];

// Tarjeta de un producto del catálogo B2B oficial (transcrito del PDF).
export default function B2BOficialCard({ item }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-[#0F8B6C]/5 border-b border-[#0F8B6C]/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0F8B6C]">{item.categoria}</span>
          <h3 className="text-sm font-bold text-slate-800 truncate">{item.nombre}</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">#{item.orden}</span>
      </div>

      <div className="p-4 space-y-3">
        {item.descripcion && <p className="text-[11px] text-slate-500 leading-relaxed">{item.descripcion}</p>}

        <div className="flex items-start gap-1.5">
          <Package className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-600">{item.incluye}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
          {item.dimensiones && <span>📐 {item.dimensiones}</span>}
          {item.peso && <span>⚖️ {item.peso}</span>}
          {item.tapitas_aprox != null && <span>♻️ ~{item.tapitas_aprox} tapitas</span>}
        </div>

        {item.colores?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.colores.map((c) => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{c}</span>)}
          </div>
        )}

        {/* Tabla de precios sin IVA */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {TRAMOS.map(([label, key]) => (
            <div key={key} className="bg-slate-50 rounded-md px-1.5 py-1 text-center">
              <p className="text-[8px] text-slate-400 uppercase">{label}</p>
              <p className="text-[10px] font-semibold text-slate-700">{fmtCLP(item[key])}</p>
            </div>
          ))}
        </div>

        {item.notas && <p className="text-[10px] text-amber-600 italic">{item.notas}</p>}
      </div>
    </div>
  );
}