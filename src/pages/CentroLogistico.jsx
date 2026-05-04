import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck, Loader2, RefreshCw, Sparkles, ExternalLink, Bell, Zap, BarChart3, Mail,
} from 'lucide-react';
import { toast } from 'sonner';

import BluexKPIs from '@/components/bluex/BluexKPIs';
import BluexFilters from '@/components/bluex/BluexFilters';
import BluexShipmentRow from '@/components/bluex/BluexShipmentRow';
import BluexShipmentDrawer from '@/components/bluex/BluexShipmentDrawer';
import BluexAnalysisPanel from '@/components/bluex/BluexAnalysisPanel';
import BluexSecuenciasPanel from '@/components/bluex/BluexSecuenciasPanel';

/**
 * Centro Logístico BlueExpress · Comando central de toda la operación de envíos.
 *
 * Funciones agénticas:
 *   • Refresh manual o batch (consulta tracking en vivo a la API Bluex)
 *   • CRON automático cada 6h actualiza estados + dispara secuencias por ciudad
 *   • Análisis IA de la operación (OTIF, comunas problemáticas, sugerencias)
 *   • Acciones por envío: ver/imprimir etiqueta, anular, contactar cliente
 */
export default function CentroLogistico() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('activos');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const [refreshingAll, setRefreshingAll] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [tab, setTab] = useState('listado');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Envio.list('-fecha_emision', 500);
    setEnvios(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Counts por filtro
  const counts = useMemo(() => ({
    all: envios.length,
    activos: envios.filter(e => !['Entregado', 'Anulado', 'Devuelto'].includes(e.estado)).length,
    excepciones: envios.filter(e => e.tiene_excepcion).length,
    atrasados: envios.filter(e => e.atrasado && e.estado !== 'Entregado').length,
    entregados: envios.filter(e => e.estado === 'Entregado').length,
  }), [envios]);

  const filtered = useMemo(() => {
    let list = envios;
    if (filtro === 'activos') list = list.filter(e => !['Entregado', 'Anulado', 'Devuelto'].includes(e.estado));
    else if (filtro === 'excepciones') list = list.filter(e => e.tiene_excepcion);
    else if (filtro === 'atrasados') list = list.filter(e => e.atrasado && e.estado !== 'Entregado');
    else if (filtro === 'entregados') list = list.filter(e => e.estado === 'Entregado');

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.tracking_number?.toLowerCase().includes(q) ||
        e.numero_pedido?.toLowerCase().includes(q) ||
        e.cliente_nombre?.toLowerCase().includes(q) ||
        e.cliente_email?.toLowerCase().includes(q) ||
        e.comuna_destino?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [envios, filtro, search]);

  const refrescarTodos = async () => {
    setRefreshingAll(true);
    try {
      const res = await base44.functions.invoke('bluexTrackingPollerCRON', {});
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`✓ ${res.data.polled} envíos actualizados · ${res.data.notifs_sent} avisos enviados`);
      await load();
    } catch (e) {
      toast.error(e.message || 'Error al refrescar');
    } finally {
      setRefreshingAll(false);
    }
  };

  const analizarIA = async () => {
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke('bluexAnalyzeShipments', { dias: 30 });
      if (res.data?.error) throw new Error(res.data.error);
      setAnalysis(res.data);
      setTab('analisis');
      toast.success('Análisis IA listo');
    } catch (e) {
      toast.error(e.message || 'Error análisis');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-blue-700 via-cyan-700 to-teal-700 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-2.5 py-1 mb-2.5">
              <Truck className="w-3 h-3 text-cyan-200" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-100">BlueExpress · Centro Logístico</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-poppins font-extrabold tracking-tight leading-tight">
              Toda la operación, sin salir de PEYU
            </h1>
            <p className="text-white/70 text-sm mt-1 max-w-2xl">
              Genera etiquetas, sigue cada envío, imprime, anula y contacta clientes desde acá. El agente IA actualiza tracking cada 6h y dispara secuencias inteligentes por ciudad.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button
              onClick={refrescarTodos}
              disabled={refreshingAll}
              className="bg-white/15 hover:bg-white/25 border border-white/25 text-white gap-2 h-11 backdrop-blur-md"
            >
              {refreshingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refrescar todos
            </Button>
            <Button
              onClick={analizarIA}
              disabled={analyzing || envios.length === 0}
              className="bg-gradient-to-br from-cyan-300 to-teal-400 hover:from-cyan-400 hover:to-teal-500 text-slate-900 gap-2 h-11 shadow-lg shadow-cyan-400/30 font-bold"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analizar con IA
            </Button>
            <a
              href="https://ecommerce.blue.cl/"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 h-11 rounded-md bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 backdrop-blur-md"
            >
              <ExternalLink className="w-4 h-4" /> Portal Bluex
            </a>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <BluexKPIs envios={envios} />

      {/* Banner agente */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-poppins font-bold text-cyan-900 text-sm">Agente Logística IA activo · secuencias por ciudad</p>
          <p className="text-xs text-cyan-800/85 mt-0.5 leading-relaxed">
            Avisos automáticos diferenciados: <strong>Urbano</strong> (estándar), <strong>Extremo Norte/Sur</strong> (lead time largo), <strong>Rural</strong> (preventivo) y <strong>Alto valor</strong> (atención prioritaria). Atraso &gt;5 días gatilla email proactivo.
          </p>
        </div>
        <Bell className="w-4 h-4 text-cyan-600 flex-shrink-0" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="listado" className="gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Listado
          </TabsTrigger>
          <TabsTrigger value="secuencias" className="gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Secuencias IA
          </TabsTrigger>
          <TabsTrigger value="analisis" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Análisis IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-4 space-y-4">
          <BluexFilters
            filtro={filtro} setFiltro={setFiltro}
            search={search} setSearch={setSearch}
            counts={counts}
          />

          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-4 py-3 font-bold">Pedido / OT</th>
                    <th className="text-left px-4 py-3 font-bold">Cliente</th>
                    <th className="text-left px-3 py-3 font-bold">Destino</th>
                    <th className="text-left px-3 py-3 font-bold">Estado</th>
                    <th className="text-left px-3 py-3 font-bold">Última novedad</th>
                    <th className="text-right px-3 py-3 font-bold">Servicio</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12">
                      <Truck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">Sin envíos en este filtro</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Genera tu primera etiqueta desde "Procesar Pedidos"
                      </p>
                    </td></tr>
                  )}
                  {filtered.map(e => (
                    <BluexShipmentRow
                      key={e.id}
                      envio={e}
                      onClick={() => setSelected(e)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="secuencias" className="mt-4">
          <BluexSecuenciasPanel envios={envios} />
        </TabsContent>

        <TabsContent value="analisis" className="mt-4">
          <BluexAnalysisPanel analysis={analysis} />
        </TabsContent>
      </Tabs>

      {selected && (
        <BluexShipmentDrawer
          envio={selected}
          onClose={() => setSelected(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}