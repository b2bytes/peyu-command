// ============================================================================
// Indexacion — War Room de indexación de lanzamiento
// ----------------------------------------------------------------------------
// Audita GSC de peyuchile.cl y peyuchile.lat, envía sitemaps, dispara IndexNow,
// y muestra el log histórico de acciones.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, Rocket, FileSearch, History as HistoryIcon, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import SiteAuditCard from '@/components/launch/SiteAuditCard';
import IndexNowCard from '@/components/launch/IndexNowCard';

const SITES = [
  { url: 'https://peyuchile.cl/', label: 'peyuchile.cl (principal · Base44)' },
  { url: 'https://peyuchile.lat/', label: 'peyuchile.lat (tienda WooCommerce)' },
];

export default function Indexacion() {
  const [logs, setLogs] = useState([]);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.IndexationLog.list('-created_date', 20);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLogs();
    const t = setInterval(loadLogs, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
          <Radar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">War Room · Indexación</h1>
          <p className="text-sm text-slate-500">Lanzamiento PEYU · 7-day blitz · Multi-canal (Google + Bing + Yandex)</p>
        </div>
      </div>

      {/* Playbook táctico */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="w-4 h-4 text-red-600" />
            Playbook de 24h — Orden de operaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-xs space-y-1.5 text-slate-700">
            <li><strong>1.</strong> Verificar ambos dominios en Search Console (peyuchile.cl y peyuchile.lat) con DNS TXT o meta-tag.</li>
            <li><strong>2.</strong> Enviar <code>sitemap.xml</code> de cada dominio (botón "Enviar" abajo).</li>
            <li><strong>3.</strong> Generar key IndexNow y alojar archivo <code>{'{key}.txt'}</code> en la raíz.</li>
            <li><strong>4.</strong> Disparar IndexNow con las URLs principales (llega a Bing, Yandex, Seznam en minutos).</li>
            <li><strong>5.</strong> Crear 301-redirects si hay URLs viejas de peyuchile.lat que deban consolidarse a peyuchile.cl.</li>
            <li><strong>6.</strong> Auditar cada 4h las primeras 48h y revisar queries nuevas apareciendo.</li>
          </ol>
        </CardContent>
      </Card>

      {/* Auditorías por dominio */}
      <div className="grid lg:grid-cols-2 gap-4">
        {SITES.map(s => (
          <SiteAuditCard key={s.url} site_url={s.url} defaultSitemap={`${s.url}sitemap.xml`} />
        ))}
      </div>

      {/* IndexNow */}
      <IndexNowCard />

      {/* Log histórico */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-slate-500" />
            Log de acciones (últimas 20)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Sin acciones registradas todavía.</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {logs.map(l => (
                <div key={l.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                  {l.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    : l.status === 'error' ? <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{l.action_type}</span>
                      <span className="text-slate-400">{l.site_url || l.target_url}</span>
                    </div>
                    <div className="text-slate-600 truncate">{l.response_summary}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{new Date(l.created_date).toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}