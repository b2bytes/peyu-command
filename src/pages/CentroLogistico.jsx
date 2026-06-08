import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck, Loader2, RefreshCw, Sparkles, ExternalLink, Bell, Zap, BarChart3, Mail,
  Plus, Settings, FileText, AlertTriangle, TrendingUp, CheckCircle2, Clock, MapPin, DollarSign,
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
  const [generandoEtiqueta, setGenerandoEtiqueta] = useState(false);

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
      if (!res || !res.data) throw new Error('Sin respuesta del servidor');
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`✓ ${res.data.polled || 0} envíos actualizados · ${res.data.notifs_sent || 0} avisos enviados`);
      await load();
    } catch (e) {
      const errMsg = e?.message || e?.toString() || 'Error de conexión al refrescar';
      console.error('Error en refrescarTodos:', errMsg);
      toast.error(errMsg);
    } finally {
      setRefreshingAll(false);
    }
  };

  const analizarIA = async () => {
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke('bluexAnalyzeShipments', { dias: 30 });
      if (!res || !res.data) throw new Error('Sin respuesta del servidor');
      if (res.data?.error) throw new Error(res.data.error);
      setAnalysis(res.data);
      setTab('analisis');
      toast.success('Análisis IA listo');
    } catch (e) {
      const errMsg = e?.message || e?.toString() || 'Error de conexión en análisis';
      console.error('Error en analizarIA:', errMsg);
      toast.error(errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full">
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
              Refrescar
            </Button>
            <Button
              onClick={analizarIA}
              disabled={analyzing || envios.length === 0}
              className="bg-gradient-to-br from-cyan-300 to-teal-400 hover:from-cyan-400 hover:to-teal-500 text-slate-900 gap-2 h-11 shadow-lg shadow-cyan-400/30 font-bold"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analizar IA
            </Button>
            <a
              href="https://ecommerce.blue.cl/"
              target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 h-11 rounded-md bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 backdrop-blur-md"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Portal
            </a>
          </div>
        </div>
      </div>

      {/* KPIs + Stats Cards */}
      <BluexKPIs envios={envios} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: 'Entregados hoy', value: envios.filter(e => e.estado === 'Entregado' && e.fecha_entrega_real?.startsWith(new Date().toISOString().split('T')[0])).length, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: TrendingUp, label: 'En tránsito', value: envios.filter(e => e.estado === 'En Tránsito').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: AlertTriangle, label: 'Excepciones', value: envios.filter(e => e.tiene_excepcion).length, color: 'text-red-600', bg: 'bg-red-50' },
          { icon: Clock, label: 'Atrasados', value: envios.filter(e => e.atrasado && e.estado !== 'Entregado').length, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-xl border border-${stat.color.split('-')[1]}-200 p-3`}>
            <div className={`w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

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
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="listado" className="gap-1.5 text-xs sm:text-sm">
            <Truck className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Envíos</span>
          </TabsTrigger>
          <TabsTrigger value="secuencias" className="gap-1.5 text-xs sm:text-sm">
            <Mail className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Secuencias</span>
          </TabsTrigger>
          <TabsTrigger value="analisis" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Análisis</span>
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Config</span>
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

        <TabsContent value="configuracion" className="mt-4 space-y-4">
          {/* Configuración y Documentación */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tarifas */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold">Tarifas BlueExpress</h3>
                  <p className="text-xs text-muted-foreground">Precios por comuna y servicio</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Importa las tarifas más recientes desde BlueExpress para cálculos precisos en checkout.
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    const res = await base44.functions.invoke('importBluexTarifas', {});
                    toast.success(res.data?.message || 'Tarifas importadas');
                    await load();
                  } catch (e) {
                    toast.error('Error importando tarifas');
                  }
                }}
              >
                <RefreshCw className="w-4 h-4" /> Sincronizar tarifas
              </Button>
            </div>

            {/* Análisis de Envíos */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold">Análisis Profundo</h3>
                  <p className="text-xs text-muted-foreground">OTIF, problemas, oportunidades</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Ejecuta análisis avanzado de tu operación logística para optimizar entregas.
              </p>
              <Button 
                className="w-full gap-2"
                style={{ background: 'var(--ld-action)' }}
                onClick={analizarIA}
                disabled={analyzing || envios.length === 0}
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                Analizar operación
              </Button>
            </div>

            {/* Documentación */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold">Documentación</h3>
                  <p className="text-xs text-muted-foreground">Guías y referencias</p>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <p className="text-sm text-muted-foreground">
                  • Cómo generar etiquetas desde pedidos<br/>
                  • Estados de envíos explicados<br/>
                  • Secuencias de notificación por ciudad<br/>
                  • Códigos de excepción
                </p>
              </div>
              <a href="/soporte" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" /> Ver documentación
                </Button>
              </a>
            </div>

            {/* Estado de API */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold">Estado API</h3>
                  <p className="text-xs text-muted-foreground">Conexión con BlueExpress</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Verifica que la conexión a la API de BlueExpress esté funcionando correctamente.
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    const res = await base44.functions.invoke('healthCheck', {});
                    toast.success('✓ Conexión OK');
                  } catch (e) {
                    toast.error('Error verificando conexión');
                  }
                }}
              >
                <Clock className="w-4 h-4" /> Verificar conexión
              </Button>
            </div>
          </div>

          {/* Secuencias de Notificaciones por Ciudad */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold">Secuencias por Tipo de Destino</h3>
                <p className="text-xs text-muted-foreground">Notificaciones automáticas inteligentes</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                { tipo: 'Urbano (Santiago)', desc: 'Avisos estándar cada 24h', color: 'bg-blue-50' },
                { tipo: 'Extremo Norte/Sur', desc: 'Lead time largo, avisos preventivos', color: 'bg-red-50' },
                { tipo: 'Rural', desc: 'Notificaciones cada 48h', color: 'bg-amber-50' },
                { tipo: 'Alto Valor', desc: 'Atención prioritaria, avisos frecuentes', color: 'bg-purple-50' },
              ].map((seq, i) => (
                <div key={i} className={`${seq.color} rounded-xl p-3 border`}>
                  <p className="font-semibold text-foreground text-xs mb-0.5">{seq.tipo}</p>
                  <p className="text-xs text-muted-foreground">{seq.desc}</p>
                </div>
              ))}
            </div>
          </div>
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