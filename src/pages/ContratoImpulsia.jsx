// ============================================================================
// ContratoImpulsia · Análisis del contrato PEYU-IMPULSIA vs entrega real
// ----------------------------------------------------------------------------
// Página PRIVADA (solo admins) que cruza el contrato firmado con métricas
// vivas de la plataforma para responder a IMPULSIA con datos duros.
//
// Se compone de 5 tabs:
//   1. Resumen     · KPIs ejecutivos + alerta de incumplimiento
//   2. Cláusulas   · Cláusulas resumidas con postura PEYU por cláusula
//   3. Evidencia   · Hechos probados con datos vivos del backend
//   4. Plataforma  · Lo que PEYU construyó vs lo que IMPULSIA prometió
//   5. Estrategia  · Pasos concretos y argumentos para responder
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Scale, AlertTriangle, FileSignature, RefreshCw, Layers, Target, ClipboardCheck, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CONTRACT_META, CLAUSULAS, HECHOS_A_PROBAR, ESTRATEGIA_RESPUESTA } from '@/lib/contract-clauses';

import ContractKPIs from '@/components/contrato/ContractKPIs';
import ClauseAccordion from '@/components/contrato/ClauseAccordion';
import EvidenceList from '@/components/contrato/EvidenceList';
import InfrastructureMap from '@/components/contrato/InfrastructureMap';
import ResponseStrategy from '@/components/contrato/ResponseStrategy';

export default function ContratoImpulsia() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('contractAnalysis', {});
      if (res?.data?.ok) setData(res.data);
      else setError(res?.data?.error || 'Error desconocido');
    } catch (e) {
      setError(e?.message || 'Error de red');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen p-5 md:p-8 space-y-6">
      {/* ─── Header ─── */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-jakarta font-extrabold text-white text-2xl tracking-tight leading-none">
              Contrato PEYU ↔ IMPULSIA
            </h1>
            <p className="text-sm text-white/55 font-inter mt-1.5 max-w-2xl">
              Análisis del contrato de regularización con IMPULSIA SPA (marca B2BYTES) cruzado con métricas reales de
              la plataforma para responder con datos duros.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={load}
          disabled={loading}
          className="h-9 text-white/60 hover:text-white hover:bg-white/5 gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-xs">Refrescar métricas</span>
        </Button>
      </header>

      {/* ─── Banda de alerta · pago vs entrega ─── */}
      <div className="bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-amber-500/5 border border-amber-400/25 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-bold text-amber-300 mb-1 font-jakarta">
            Estado actual · regularización en negociación
          </p>
          <p className="text-sm md:text-base text-white font-jakarta font-bold leading-snug mb-2">
            PEYU pagó <span className="text-amber-200">${CONTRACT_META.monto_pagado_clp.toLocaleString('es-CL')} CLP</span> a
            IMPULSIA SPA el {CONTRACT_META.fecha_pago}{data ? ` · ${data.cumplimiento_impulsia?.dias_desde_pago} días sin entrega` : ''}.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-white/60 font-inter flex-wrap">
            <span><strong className="text-white/80">Factura:</strong> {CONTRACT_META.factura}</span>
            <span>·</span>
            <span><strong className="text-white/80">Garante personal:</strong> Lya Mundaca</span>
            <span>·</span>
            <span><strong className="text-white/80">Web del proveedor:</strong> b2bytes.tech</span>
          </div>
        </div>
      </div>

      {/* ─── Loading / Error ─── */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando análisis del contrato y métricas reales…
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-400/25 rounded-xl p-4 text-rose-200 text-sm">
          ⚠️ No se pudo cargar el análisis: {error}
        </div>
      )}

      {/* ─── Contenido ─── */}
      {data && (
        <Tabs defaultValue="resumen" className="space-y-5">
          <TabsList className="bg-white/[0.04] border border-white/10 p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="resumen" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 text-white/60 gap-2">
              <FileSignature className="w-3.5 h-3.5" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="clausulas" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 text-white/60 gap-2">
              <Scale className="w-3.5 h-3.5" /> Cláusulas
            </TabsTrigger>
            <TabsTrigger value="evidencia" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 text-white/60 gap-2">
              <ClipboardCheck className="w-3.5 h-3.5" /> Evidencia
            </TabsTrigger>
            <TabsTrigger value="plataforma" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 text-white/60 gap-2">
              <Layers className="w-3.5 h-3.5" /> Plataforma
            </TabsTrigger>
            <TabsTrigger value="estrategia" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 text-white/60 gap-2">
              <Target className="w-3.5 h-3.5" /> Estrategia
            </TabsTrigger>
          </TabsList>

          {/* TAB 1 · RESUMEN */}
          <TabsContent value="resumen" className="space-y-5 mt-0">
            <ContractKPIs data={data} />

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                <h3 className="font-jakarta font-bold text-white text-sm tracking-tight mb-3">Identificación contractual</h3>
                <dl className="space-y-2 text-[13px] font-inter">
                  <Row k="Proveedor" v={`${data.contrato.proveedor} · RUT ${data.contrato.rut_proveedor}`} />
                  <Row k="Marca comercial" v={data.contrato.marca_comercial} />
                  <Row k="Cliente" v={`${data.contrato.cliente} · RUT ${data.contrato.rut_cliente}`} />
                  <Row k="Garante personal" v={`${data.contrato.garante_personal} (solidaria)`} />
                  <Row k="Factura emitida" v={CONTRACT_META.factura} />
                  <Row k="Descriptivo factura" v={`"${CONTRACT_META.descriptivo_factura}"`} />
                  <Row k="Monto neto" v={`$${CONTRACT_META.monto_neto_clp.toLocaleString('es-CL')} CLP`} />
                  <Row k="IVA (19%)" v={`$${CONTRACT_META.iva_clp.toLocaleString('es-CL')} CLP`} />
                  <Row k="Total pagado" v={`$${CONTRACT_META.monto_pagado_clp.toLocaleString('es-CL')} CLP`} highlight />
                </dl>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                <h3 className="font-jakarta font-bold text-white text-sm tracking-tight mb-3">Brecha entre lo prometido y lo entregado</h3>
                <ul className="space-y-2.5 text-[13px] font-inter">
                  <Brecha label="Agentes IA" prometido="17 agentes coordinados con métricas garantizadas" entregado={`${data.cumplimiento_impulsia.agentes_desplegados_por_peyu} agentes (construidos por PEYU)`} />
                  <Brecha label="Aplicación móvil" prometido="App iOS y/o Android nativa" entregado="No entregada · web responsive cubre uso móvil" />
                  <Brecha label="Código fuente" prometido="Repositorio Git documentado, propiedad PEYU" entregado="No entregado por IMPULSIA · código vive en Base44 (PEYU)" />
                  <Brecha label="Hosting / SSL / CDN" prometido="Infra dedicada con backups 30 días" entregado="Cubierto por Base44 (decisión técnica de PEYU)" />
                  <Brecha label="Handoff técnico" prometido="Documentación + credenciales + capacitación" entregado="No realizado" />
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2 · CLÁUSULAS */}
          <TabsContent value="clausulas" className="space-y-3 mt-0">
            <p className="text-[13px] text-white/60 font-inter">
              Resumen de las 12 cláusulas principales del contrato, con la postura de PEYU para cada una.
            </p>
            <ClauseAccordion clausulas={CLAUSULAS} />
          </TabsContent>

          {/* TAB 3 · EVIDENCIA */}
          <TabsContent value="evidencia" className="space-y-3 mt-0">
            <p className="text-[13px] text-white/60 font-inter">
              Hechos clave con fuente documental y métricas vivas de la plataforma como evidencia objetiva.
            </p>
            <EvidenceList hechos={HECHOS_A_PROBAR} data={data} />
          </TabsContent>

          {/* TAB 4 · PLATAFORMA */}
          <TabsContent value="plataforma" className="space-y-5 mt-0">
            <div className="bg-emerald-500/8 border border-emerald-400/20 rounded-2xl p-4">
              <p className="text-[13px] text-emerald-100/90 leading-relaxed font-inter">
                <strong className="text-emerald-200">Hallazgo clave:</strong> todo el sistema productivo actual (e-commerce
                B2C funcionando con pagos reales, panel B2B, {data.funciones_backend.total} funciones backend,{' '}
                {data.agentes_desplegados.length} agentes IA, 7 conectores Google y 5 integraciones críticas) fue
                construido por PEYU sobre la plataforma Base44 — <strong>sin entrega técnica de IMPULSIA</strong>. Esto
                refuerza el argumento de incumplimiento total del alcance comprometido.
              </p>
            </div>
            <InfrastructureMap data={data} />
          </TabsContent>

          {/* TAB 5 · ESTRATEGIA */}
          <TabsContent value="estrategia" className="mt-0">
            <ResponseStrategy estrategia={ESTRATEGIA_RESPUESTA} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────
function Row({ k, v, highlight }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <dt className="text-white/55">{k}</dt>
      <dd className={`text-right font-medium ${highlight ? 'text-amber-200 font-jakarta font-bold' : 'text-white/85'}`}>{v}</dd>
    </div>
  );
}

function Brecha({ label, prometido, entregado }) {
  return (
    <li>
      <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1 font-jakarta">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-rose-500/8 border border-rose-400/15 rounded-lg p-2">
          <p className="text-[9px] uppercase tracking-wider text-rose-300/80 mb-0.5 font-jakarta font-bold">Prometido</p>
          <p className="text-[11px] text-rose-100/90 leading-tight">{prometido}</p>
        </div>
        <div className="bg-amber-500/8 border border-amber-400/15 rounded-lg p-2">
          <p className="text-[9px] uppercase tracking-wider text-amber-300/80 mb-0.5 font-jakarta font-bold">Entregado</p>
          <p className="text-[11px] text-amber-100/90 leading-tight">{entregado}</p>
        </div>
      </div>
    </li>
  );
}