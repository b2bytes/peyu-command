import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, TrendingDown, TrendingUp, Package } from 'lucide-react';

const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;
const margenColor = (m) => m >= 55 ? 'text-emerald-600' : m >= 35 ? 'text-amber-600' : 'text-red-600';

/**
 * Tabla de cost breakdown REAL por producto, con expansión para ver
 * los costos fantasma detallados que se prorratearon a cada SKU.
 */
export default function CostBreakdownTable({ rows }) {
  const [expanded, setExpanded] = useState(null);

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
        <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">Sin cálculo para este mes</p>
        <p className="text-xs text-muted-foreground mt-1">Ejecuta "Recalcular costos reales" para empezar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-bold w-8"></th>
              <th className="px-4 py-3 text-left font-bold">SKU</th>
              <th className="px-4 py-3 text-left font-bold">Producto</th>
              <th className="px-3 py-3 text-right font-bold">Vendidas</th>
              <th className="px-3 py-3 text-right font-bold">Directo</th>
              <th className="px-3 py-3 text-right font-bold">Fantasma</th>
              <th className="px-3 py-3 text-right font-bold">Fijo</th>
              <th className="px-3 py-3 text-right font-bold border-l border-border">Costo Real</th>
              <th className="px-3 py-3 text-right font-bold">Precio</th>
              <th className="px-3 py-3 text-right font-bold">Margen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const isOpen = expanded === r.id;
              return (
                <>
                  <tr
                    key={r.id}
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className={`border-t border-border hover:bg-muted/20 transition-colors cursor-pointer ${r.alerta_margen_bajo ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{r.producto_sku}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground line-clamp-1 flex items-center gap-1.5">
                        {r.alerta_margen_bajo && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                        {r.producto_nombre}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{r.unidades_vendidas || 0}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(r.costo_directo_total_clp)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={r.costo_fantasma_prorrateado_clp > 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}>
                        {fmt(r.costo_fantasma_prorrateado_clp)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{fmt(r.costo_fijo_prorrateado_clp)}</td>
                    <td className="px-3 py-3 text-right font-poppins font-bold border-l border-border tabular-nums">{fmt(r.costo_real_total_clp)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(r.precio_venta_actual_clp)}</td>
                    <td className={`px-3 py-3 text-right font-poppins font-bold tabular-nums ${margenColor(r.margen_real_pct)}`}>
                      {(r.margen_real_pct || 0).toFixed(1)}%
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={10} className="px-6 py-4">
                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Composición costo directo</p>
                            <div className="space-y-1.5 text-xs">
                              <Row label="Material" val={r.costo_material_clp} />
                              <Row label="Mano de obra" val={r.costo_mano_obra_clp} />
                              <Row label="Packaging" val={r.costo_packaging_clp} />
                              <Row label="Energía" val={r.costo_energia_clp} />
                              <Row label="Scrap" val={r.costo_scrap_clp} />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                              Costos fantasma asignados ({r.fantasmas_breakdown?.length || 0})
                            </p>
                            {r.fantasmas_breakdown?.length > 0 ? (
                              <div className="space-y-1.5 text-xs max-h-32 overflow-y-auto">
                                {r.fantasmas_breakdown.map((f, i) => (
                                  <div key={i} className="flex items-start justify-between gap-2 py-1 border-b border-border/40 last:border-0">
                                    <div className="min-w-0">
                                      <p className="font-medium text-foreground truncate">{f.categoria}</p>
                                      <p className="text-[10px] text-muted-foreground italic">{f.metodo}</p>
                                    </div>
                                    <span className="font-mono text-amber-700 tabular-nums">{fmt(f.monto_clp)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">Sin fantasmas asignados a este SKU</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Margen unitario:</span>
                          <span className={`font-poppins font-bold ${margenColor(r.margen_real_pct)}`}>
                            {r.margen_real_clp >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                            {fmt(r.margen_real_clp)} · {(r.margen_real_pct || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div className="flex justify-between border-b border-border/40 last:border-0 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{fmt(val)}</span>
    </div>
  );
}