// ============================================================================
// /admin/launch-map — War Room consolidado del blitz PEYU
// ----------------------------------------------------------------------------
// Muestra el diagrama de flujo + estado de cada pieza + shortcuts a sub-centros.
// Es el "cockpit" único donde el comandante ve todo el dispositivo.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon, Radar, Target, BarChart3, ExternalLink, ArrowRight,
  Users, Mail, Rocket, FileSearch,
} from 'lucide-react';
import LaunchFlowDiagram from '@/components/launch/LaunchFlowDiagram';

const SHORTCUTS = [
  { to: '/admin/ads-command', title: 'Ads Command', desc: 'Generar campañas y exportar a Google Ads Editor', icon: Target, color: 'from-orange-500 to-red-500' },
  { to: '/admin/indexacion', title: 'Indexación', desc: 'GSC audit, sitemaps, IndexNow', icon: Radar, color: 'from-red-500 to-pink-500' },
  { to: '/admin/ga-realtime', title: 'GA4 Realtime', desc: 'Tráfico en vivo, conversiones por canal', icon: BarChart3, color: 'from-amber-500 to-orange-500' },
  { to: '/lanzamiento', title: 'Ver /lanzamiento', desc: 'Previsualizar la landing pública', icon: Rocket, color: 'from-emerald-500 to-teal-500', external: true },
];

export default function LaunchMap() {
  const [stats, setStats] = useState({ leads: 0, drafts: 0, logs: 0, campaigns_active: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [leads, drafts, logs] = await Promise.all([
          base44.entities.Lead.filter({}, '-created_date', 200),
          base44.entities.AdCampaignDraft.list('-created_date', 50),
          base44.entities.IndexationLog.list('-created_date', 50),
        ]);
        setStats({
          leads: leads.length,
          drafts: drafts.length,
          logs: logs.length,
          campaigns_active: drafts.filter(d => d.status === 'Activa' || d.status === 'Subida a Ads').length,
        });
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 via-emerald-700 to-orange-600 flex items-center justify-center text-white shadow-lg">
          <MapIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">War Room · Launch Map</h1>
          <p className="text-sm text-slate-500">Diagrama táctico del blitz · Atribución end-to-end · Feedback loop Scientist</p>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Leads captados', value: stats.leads, icon: Users, color: 'text-blue-600' },
          { label: 'Campañas generadas', value: stats.drafts, icon: Target, color: 'text-orange-600' },
          { label: 'Campañas activas', value: stats.campaigns_active, icon: Rocket, color: 'text-emerald-600' },
          { label: 'Acciones indexación', value: stats.logs, icon: FileSearch, color: 'text-red-600' },
        ].map((k, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`w-8 h-8 ${k.color}`} />
              <div>
                <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diagrama de flujo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-emerald-600" />
            Arquitectura del blitz — Cómo se conectan todas las piezas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LaunchFlowDiagram />
          <p className="mt-3 text-xs text-slate-500">
            Lee el diagrama de izquierda a derecha. Cada lead capturado en <code>/lanzamiento</code> alimenta el Pinecone Brain
            (contexto 360°) y GA4 (atribución). El Scientist usa GA4 para optimizar Ads en loop continuo.
          </p>
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">Centros de comando</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SHORTCUTS.map((s) => {
            const Inner = (
              <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full overflow-hidden group">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${s.color} p-4 text-white`}>
                    <s.icon className="w-7 h-7" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{s.title}</p>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
            return s.external ? (
              <a key={s.to} href={s.to} target="_blank" rel="noopener noreferrer">{Inner}</a>
            ) : (
              <Link key={s.to} to={s.to}>{Inner}</Link>
            );
          })}
        </div>
      </div>

      {/* Checklist táctico de lanzamiento */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-600" />
            Checklist de 24h antes del blitz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-xs space-y-1.5 text-slate-700">
            <li>✅ <strong>Landing /lanzamiento</strong> deployada con Schema.org + FAQs</li>
            <li>⏳ <strong>Verificar peyuchile.cl</strong> en Search Console (DNS TXT o meta-tag)</li>
            <li>⏳ <strong>Enviar sitemap.xml</strong> desde /admin/indexacion a ambos dominios</li>
            <li>⏳ <strong>Generar key IndexNow</strong> y subir <code>{'{key}.txt'}</code> a la raíz</li>
            <li>⏳ <strong>Revisar campaña OP_TEST_01</strong> → importar CSV a Google Ads Editor → Published</li>
            <li>⏳ <strong>Conectar GA4 Property ID</strong> para ver tráfico en /admin/ga-realtime</li>
            <li>⏳ <strong>Primer lead</strong> llega a /lanzamiento → aparece aquí arriba</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}