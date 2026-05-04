import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, TrendingUp, TrendingDown, ArrowRight, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const URGENCIA_STYLES = {
  Alta: 'bg-red-50 border-red-200 text-red-700',
  Media: 'bg-amber-50 border-amber-200 text-amber-700',
  Baja: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Informativa: 'bg-slate-50 border-slate-200 text-slate-700',
};

const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

/**
 * Panel con sugerencias de precio dinámico generadas por el agente Finanzas IA.
 * Cada card muestra el racional, factores, y permite aprobar/rechazar/aplicar.
 */
export default function PriceSuggestionsPanel({ suggestions, onChange, resumen }) {
  const [busyId, setBusyId] = useState(null);

  const handleApply = async (s) => {
    setBusyId(s.id);
    try {
      const res = await base44.functions.invoke('aplicarPriceSuggestion', { suggestion_id: s.id });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`✓ Precio actualizado a ${fmt(res.data.precio_nuevo)}`);
      onChange?.();
    } catch (e) {
      toast.error(e.message || 'Error al aplicar');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (s) => {
    setBusyId(s.id);
    try {
      await base44.entities.PriceSuggestion.update(s.id, {
        estado: 'rechazada',
        aprobada_por: '',
        notas_humano: 'Rechazada manualmente',
      });
      toast.success('Sugerencia rechazada');
      onChange?.();
    } catch {
      toast.error('Error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumen del agente */}
      {resumen && (
        <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 border border-teal-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-teal-700">Agente Finanzas IA</p>
              <p className="font-poppins font-bold text-foreground text-sm">Resumen ejecutivo</p>
            </div>
          </div>
          {resumen.resumen_ejecutivo && (
            <p className="text-sm text-foreground leading-relaxed mb-3">{resumen.resumen_ejecutivo}</p>
          )}
          {resumen.alertas?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-red-700 mb-1.5">Alertas</p>
              <ul className="space-y-1">
                {resumen.alertas.map((a, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <Zap className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resumen.patrones_detectados?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-cyan-700 mb-1.5">Patrones detectados</p>
              <ul className="space-y-1">
                {resumen.patrones_detectados.map((p, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-500 flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sugerencias */}
      {suggestions.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No hay sugerencias pendientes</p>
          <p className="text-xs text-muted-foreground mt-1">Ejecuta "Analizar costos" para que el agente IA proponga precios óptimos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {suggestions.map(s => {
            const subir = s.delta_clp > 0;
            return (
              <div key={s.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] text-muted-foreground">{s.producto_sku}</p>
                    <p className="font-poppins font-bold text-foreground text-sm leading-tight line-clamp-2">{s.producto_nombre}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap ${URGENCIA_STYLES[s.urgencia] || URGENCIA_STYLES.Media}`}>
                    {s.urgencia}
                  </span>
                </div>

                {/* Precio comparativo */}
                <div className="flex items-center justify-between gap-2 bg-muted/40 rounded-xl p-3 mb-3">
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Actual</p>
                    <p className="font-poppins font-bold text-foreground text-base tabular-nums">{fmt(s.precio_actual_clp)}</p>
                    <p className="text-[10px] text-muted-foreground">Margen {(s.margen_actual_pct || 0).toFixed(0)}%</p>
                  </div>
                  <div className={`flex flex-col items-center px-1 ${subir ? 'text-red-500' : 'text-emerald-600'}`}>
                    {subir ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-[10px] font-bold tabular-nums">{s.delta_pct >= 0 ? '+' : ''}{s.delta_pct?.toFixed(1)}%</span>
                  </div>
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold mb-0.5">Sugerido</p>
                    <p className="font-poppins font-bold text-teal-700 text-base tabular-nums">{fmt(s.precio_sugerido_clp)}</p>
                    <p className="text-[10px] text-teal-600">Margen {(s.margen_sugerido_pct || 0).toFixed(0)}%</p>
                  </div>
                </div>

                {/* Racional */}
                {s.razonamiento && (
                  <div className="bg-cyan-50/60 border border-cyan-100 rounded-lg p-2.5 mb-3">
                    <p className="text-[11px] text-cyan-900 leading-relaxed italic">💡 {s.razonamiento}</p>
                  </div>
                )}

                {/* Factores */}
                {s.factores?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {s.factores.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                        <span className="text-muted-foreground truncate">• {f.factor}</span>
                        {f.impacto_clp !== 0 && (
                          <span className={`font-mono tabular-nums ${f.impacto_clp > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {f.impacto_clp > 0 ? '+' : ''}{fmt(f.impacto_clp)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Costo real */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2 mb-3">
                  <span>Costo real unitario:</span>
                  <span className="font-mono tabular-nums">{fmt(s.costo_real_unitario_clp)}</span>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApply(s)}
                    disabled={busyId === s.id}
                    size="sm"
                    className="flex-1 bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white gap-1.5 h-9"
                  >
                    {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Aplicar
                  </Button>
                  <Button
                    onClick={() => handleReject(s)}
                    disabled={busyId === s.id}
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-9"
                  >
                    <X className="w-3.5 h-3.5" />
                    Descartar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}