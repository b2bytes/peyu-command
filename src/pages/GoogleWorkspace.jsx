// ============================================================================
// GoogleWorkspace — Centro de control de integraciones Google para PEYU
// ============================================================================
// Dashboard admin que consolida el estado de los 7 conectores Google y sirve
// de hub para acceder a las sub-funcionalidades (Gmail, Calendar, Drive,
// Docs, Sheets, Analytics, Search Console).
// ----------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, Loader2, RefreshCw, Mail, Calendar, HardDrive,
  FileText, Table2, BarChart3, Search, ExternalLink, Zap, ShieldCheck, Send, CalendarPlus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GmailTester from '@/components/google/GmailTester';
import CalendarTester from '@/components/google/CalendarTester';

const SERVICES = [
  { key: 'gmail', name: 'Gmail', icon: Mail, color: 'bg-red-100 text-red-700 border-red-200', desc: 'Enviar propuestas B2B, leer consultas' },
  { key: 'calendar', name: 'Calendar', icon: Calendar, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Agendar reuniones con leads' },
  { key: 'drive', name: 'Drive', icon: HardDrive, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: 'Guardar mockups y propuestas' },
  { key: 'docs', name: 'Docs', icon: FileText, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'Generar propuestas automáticas' },
  { key: 'sheets', name: 'Sheets', icon: Table2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Reportes masivos, import/export' },
  { key: 'analytics', name: 'Analytics', icon: BarChart3, color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Tráfico y conversiones peyuchile.cl' },
  { key: 'search_console', name: 'Search Console', icon: Search, color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'SEO orgánico, queries, CTR' },
];

export default function GoogleWorkspace() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('googleHealthCheck', {});
      setHealth(res?.data || null);
    } catch (e) {
      setError(e.message || 'Error ejecutando health-check');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getProbe = (key) => health?.probes?.find((p) => p.service === key);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
              <path d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Workspace
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Centro de control para las 7 integraciones Google conectadas a{' '}
            <span className="font-semibold text-slate-700">ti@peyuchile.cl</span>
          </p>
        </div>
        <Button onClick={runHealthCheck} disabled={loading} variant="outline" className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Verificar conexiones
        </Button>
      </div>

      {/* Summary Card */}
      {health?.summary && (
        <Card className="border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  health.summary.all_healthy
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {health.summary.all_healthy
                    ? <ShieldCheck className="w-6 h-6" />
                    : <Zap className="w-6 h-6" />
                  }
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {health.summary.connected} / {health.summary.total}
                  </p>
                  <p className="text-xs text-slate-500">servicios operativos</p>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-200" />

              <div>
                <p className="text-2xl font-bold text-slate-900">{health.summary.avg_latency_ms}ms</p>
                <p className="text-xs text-slate-500">latencia promedio</p>
              </div>

              <div className="h-10 w-px bg-slate-200" />

              <div>
                <p className="text-sm font-medium text-slate-700">
                  {health.summary.all_healthy ? '✅ Todo operativo' : '⚠️ Revisar detalles'}
                </p>
                <p className="text-xs text-slate-500">
                  Verificado: {new Date(health.checked_at).toLocaleTimeString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            ❌ {error}
          </CardContent>
        </Card>
      )}

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SERVICES.map((svc) => {
          const Icon = svc.icon;
          const probe = getProbe(svc.key);
          const isHealthy = probe?.ok === true;
          const isChecking = loading && !health;

          return (
            <Card key={svc.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${svc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : isHealthy ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : probe ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
                <CardTitle className="text-base mt-2">{svc.name}</CardTitle>
                <p className="text-xs text-slate-500 leading-snug">{svc.desc}</p>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {probe && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Latencia</span>
                      <span className="font-mono text-slate-700">{probe.latency_ms}ms</span>
                    </div>
                    {probe.email && (
                      <div className="text-xs">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {probe.email}
                        </Badge>
                      </div>
                    )}
                    {probe.messages_total !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Mensajes</span>
                        <span className="font-semibold">{probe.messages_total?.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    {probe.calendars_count !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Calendarios</span>
                        <span className="font-semibold">{probe.calendars_count}</span>
                      </div>
                    )}
                    {probe.storage_used_gb && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Storage</span>
                        <span className="font-semibold">{probe.storage_used_gb} GB</span>
                      </div>
                    )}
                    {probe.accounts_count !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Cuentas GA</span>
                        <span className="font-semibold">{probe.accounts_count}</span>
                      </div>
                    )}
                    {probe.sites_count !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Sitios</span>
                        <span className="font-semibold">{probe.sites_count}</span>
                      </div>
                    )}
                    {!isHealthy && probe.detail && (
                      <p className="text-[10px] text-red-600 mt-2 line-clamp-2" title={probe.detail}>
                        {probe.detail}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Playground Fase 2 — Gmail + Calendar */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-teal-600" />
            Playground Fase 2 — Gmail & Calendar
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Prueba las integraciones en vivo. Los emails se envían desde <strong>ti@peyuchile.cl</strong>.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gmail" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="gmail" className="gap-2">
                <Mail className="w-4 h-4" /> Gmail
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarPlus className="w-4 h-4" /> Calendar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gmail" className="mt-4">
              <GmailTester />
            </TabsContent>
            <TabsContent value="calendar" className="mt-4">
              <CalendarTester />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Automatización activa */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-900">
              ✓ Automatización activa: Gmail → Auto-crear Consultas
            </p>
            <p className="text-emerald-700 text-xs mt-1">
              Cada email nuevo en <strong>ti@peyuchile.cl</strong> genera automáticamente una Consulta en el CRM
              con clasificación inteligente (cotización, personalización, pedido, etc.)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap de fases */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Roadmap de integración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
              <div>
                <p className="font-semibold text-slate-900">Fase 1 — Infraestructura base (completado)</p>
                <p className="text-slate-500 text-xs">OAuth de 7 conectores + health-check centralizado</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
              <div>
                <p className="font-semibold text-slate-900">Fase 2 — Comunicación (Gmail + Calendar) — completado</p>
                <p className="text-slate-500 text-xs">✓ Envío MIME UTF-8 · ✓ Calendar + Meet · ✓ Webhook ingesta → Consultas</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-semibold text-slate-700">Fase 3 — Documentación (Drive + Docs + Slides)</p>
                <p className="text-slate-500 text-xs">Propuestas PDF en Drive corporativo, Docs dinámicos</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-semibold text-slate-700">Fase 4 — Analítica (Analytics + Search Console)</p>
                <p className="text-slate-500 text-xs">Dashboard ejecutivo con métricas reales de peyuchile.cl</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">5</span>
              <div>
                <p className="font-semibold text-slate-700">Fase 5 — Data warehouse (Sheets + BigQuery)</p>
                <p className="text-slate-500 text-xs">Sync masivo y análisis avanzado</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Nota info */}
      <div className="text-xs text-slate-500 flex items-center gap-2">
        <ExternalLink className="w-3 h-3" />
        Conexiones OAuth gestionadas por Base44. Los tokens se renuevan automáticamente.
      </div>
    </div>
  );
}