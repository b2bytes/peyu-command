import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Loader2, RefreshCw, Sparkles, Zap, Receipt, Layers, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import CostosKPIs from '@/components/centro-costos/CostosKPIs';
import QuickCaptureForm from '@/components/centro-costos/QuickCaptureForm';
import CostosFantasmasList from '@/components/centro-costos/CostosFantasmasList';
import CostBreakdownTable from '@/components/centro-costos/CostBreakdownTable';
import PriceSuggestionsPanel from '@/components/centro-costos/PriceSuggestionsPanel';

// Mes actual YYYY-MM
const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * Centro de Costos Real · Página agéntica controlada por el agente Finanzas IA.
 *
 * 4 vistas:
 *   1. Captura  → registrar boletas, viajes, gastos pequeños (con OCR foto)
 *   2. Costos Reales → cost breakdown unitario por SKU del mes
 *   3. Sugerencias IA → precios dinámicos propuestos por el agente
 *   4. Resumen del mes → KPIs + acciones del agente
 */
export default function CentroCostosReal() {
  const [mes, setMes] = useState(currentMonth());
  const [tab, setTab] = useState('captura');

  const [fantasmas, setFantasmas] = useState([]);
  const [costosReales, setCostosReales] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [resumenAgente, setResumenAgente] = useState(null);

  const [loadingProrr, setLoadingProrr] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const loadAll = useCallback(async () => {
    const [f, c, s] = await Promise.all([
      base44.entities.CostoFantasma.filter({ mes_imputacion: mes }, '-fecha', 200),
      base44.entities.ProductoCostoReal.filter({ mes }, '-margen_real_pct', 100),
      base44.entities.PriceSuggestion.filter({ mes_base: mes, estado: 'pendiente' }, '-urgencia', 50),
    ]);
    setFantasmas(f || []);
    setCostosReales(c || []);
    setSugerencias(s || []);
  }, [mes]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Acción: prorratear costos del mes
  const handleProrratear = async () => {
    setLoadingProrr(true);
    try {
      const res = await base44.functions.invoke('prorratearCostosFantasma', { mes });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`✓ ${res.data.productos_calculados} productos recalculados · ${res.data.fantasmas_prorrateados} fantasmas prorrateados`);
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Error al recalcular');
    } finally {
      setLoadingProrr(false);
    }
  };

  // Acción: agente IA analiza y sugiere precios
  const handleAnalizarIA = async () => {
    setLoadingAI(true);
    try {
      const res = await base44.functions.invoke('analizarCostosReales', { mes });
      if (res.data?.error) throw new Error(res.data.error);
      setResumenAgente({
        resumen_ejecutivo: res.data.resumen_ejecutivo,
        alertas: res.data.alertas,
        patrones_detectados: res.data.patrones_detectados,
      });
      toast.success(`✨ ${res.data.sugerencias_creadas} sugerencias generadas`);
      setTab('sugerencias');
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Error análisis IA');
    } finally {
      setLoadingAI(false);
    }
  };

  // KPIs derivados
  const totalFantasmas = useMemo(() => fantasmas.reduce((s, f) => s + (f.monto_clp || 0), 0), [fantasmas]);
  const productosAlerta = costosReales.filter(c => c.alerta_margen_bajo).length;
  const margenPromedio = costosReales.length > 0
    ? costosReales.reduce((s, c) => s + (c.margen_real_pct || 0), 0) / costosReales.length
    : 0;

  // Generar opciones de meses (últimos 12)
  const mesesOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push(d.toISOString().slice(0, 7));
    }
    return opts;
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header con acciones agénticas */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/20 border border-teal-400/40 rounded-full px-2.5 py-1 mb-2.5">
              <Brain className="w-3 h-3 text-teal-300" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-200">Agente Finanzas IA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-poppins font-extrabold tracking-tight leading-tight">
              Centro de Costos Real
            </h1>
            <p className="text-white/65 text-sm mt-1 max-w-2xl">
              Captura cada gasto fantasma · prorratea automáticamente · descubre el costo verdadero por producto · obtén precios dinámicos del agente IA cada mes.
            </p>
          </div>

          {/* Selector de mes + acciones */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
            <select
              value={mes}
              onChange={e => setMes(e.target.value)}
              className="h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm backdrop-blur-md focus:outline-none focus:border-teal-400/60 cursor-pointer"
            >
              {mesesOptions.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
            </select>
            <Button
              onClick={handleProrratear}
              disabled={loadingProrr}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white gap-2 h-11"
            >
              {loadingProrr ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Recalcular
            </Button>
            <Button
              onClick={handleAnalizarIA}
              disabled={loadingAI || costosReales.length === 0}
              className="bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white gap-2 h-11 shadow-lg shadow-teal-500/30"
            >
              {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analizar con IA
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <CostosKPIs
        totalFantasmas={totalFantasmas}
        fantasmasCount={fantasmas.length}
        productosCalculados={costosReales.length}
        productosAlerta={productosAlerta}
        sugerenciasPendientes={sugerencias.length}
        margenPromedio={margenPromedio}
      />

      {/* Flujo agéntico — banner explicativo */}
      {costosReales.length === 0 && fantasmas.length === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-poppins font-bold text-amber-900">Empieza por capturar gastos del mes</p>
            <p className="text-sm text-amber-800/85 mt-1 leading-relaxed">
              Registra cada boleta, viaje o gasto pequeño. Luego el agente prorratea esos costos a cada producto y te dice el costo real verdadero — incluyendo todo lo que normalmente se pierde.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="captura" className="gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Captura
            {fantasmas.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                {fantasmas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="costos" className="gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Costos reales
          </TabsTrigger>
          <TabsTrigger value="sugerencias" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Sugerencias IA
            {sugerencias.length > 0 && (
              <span className="ml-1 text-[10px] bg-teal-500/20 text-teal-700 px-1.5 py-0.5 rounded-full font-bold">
                {sugerencias.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1 — Captura rápida */}
        <TabsContent value="captura" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-[420px_1fr] gap-5">
            <QuickCaptureForm onCreated={loadAll} />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-poppins font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  Costos del mes ({mes})
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Total: <strong className="text-foreground">${totalFantasmas.toLocaleString('es-CL')}</strong>
                </span>
              </div>
              <CostosFantasmasList items={fantasmas} onDeleted={loadAll} />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2 — Cost breakdown real */}
        <TabsContent value="costos" className="mt-4 space-y-4">
          <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-cyan-900 leading-relaxed">
              <strong>Click en cada fila</strong> para ver el desglose: composición del costo directo + cada costo fantasma asignado al producto y cómo se prorrateó.
            </p>
          </div>
          <CostBreakdownTable rows={costosReales} />
        </TabsContent>

        {/* TAB 3 — Sugerencias del agente */}
        <TabsContent value="sugerencias" className="mt-4">
          <PriceSuggestionsPanel
            suggestions={sugerencias}
            resumen={resumenAgente}
            onChange={loadAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}