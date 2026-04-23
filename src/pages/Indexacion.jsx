// ============================================================================
// /admin/indexacion — Command Center de indexación SEO (lanzamiento blitz)
// ============================================================================
// Permite:
//  • Ver todos los sites verificados en Search Console (peyuchile.cl + .lat)
//  • Auditar cobertura, top queries y pages de los últimos 28 días
//  • Gestionar sitemaps (ver estado + enviar nuevos)
//  • Inspeccionar URLs en vivo
// ----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Rocket, Loader2, Radar } from 'lucide-react';
import SiteSelector from '@/components/indexacion/SiteSelector';
import SitemapManager from '@/components/indexacion/SitemapManager';
import PerformanceOverview from '@/components/indexacion/PerformanceOverview';
import UrlInspector from '@/components/indexacion/UrlInspector';

export default function Indexacion() {
  const [sites, setSites] = useState([]);
  const [sitemapsPerSite, setSitemapsPerSite] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteData, setSiteData] = useState(null);
  const [loadingSite, setLoadingSite] = useState(false);

  // Cargar sites al montar
  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const res = await base44.functions.invoke('gscAuditSite', {});
      const d = res?.data;
      setSites(d?.sites || []);
      setSitemapsPerSite(d?.sitemapsPerSite || []);
      // Auto-seleccionar peyuchile.cl si existe
      const peyu = (d?.sites || []).find(s => s.site_url.includes('peyuchile.cl'));
      if (peyu) setSelectedSite(peyu.site_url);
      else if (d?.sites?.[0]) setSelectedSite(d.sites[0].site_url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => { loadSites(); }, []);

  // Cuando cambia el site seleccionado, cargar su performance
  useEffect(() => {
    if (!selectedSite) return;
    const load = async () => {
      setLoadingSite(true);
      try {
        const res = await base44.functions.invoke('gscAuditSite', { site_url: selectedSite });
        setSiteData(res?.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSite(false);
      }
    };
    load();
  }, [selectedSite]);

  const sitemapsForSelected = sitemapsPerSite.find(s => s.site === selectedSite)?.sitemaps || siteData?.sitemaps || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Radar className="w-7 h-7 text-teal-600" />
            Indexación Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lanzamiento blitz 7 días · peyuchile.cl + peyuchile.lat · Sitemaps + GSC + inspección en vivo
          </p>
        </div>
        <Button onClick={loadSites} disabled={loadingSites} variant="outline" size="sm" className="gap-1.5">
          {loadingSites ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refrescar
        </Button>
      </div>

      {/* Banner táctico */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border border-amber-200">
        <div className="flex items-start gap-3">
          <Rocket className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-orange-900">Blitz de lanzamiento — próximas 24h</p>
            <ul className="text-orange-800 text-xs mt-1 space-y-0.5 list-disc pl-4">
              <li>Envía <code className="px-1 bg-white rounded">sitemap.xml</code> de <strong>peyuchile.cl</strong> y <strong>peyuchile.lat</strong> (abajo)</li>
              <li>Inspecciona las 5 URLs clave: <code>/</code>, <code>/shop</code>, <code>/b2b/contacto</code>, <code>/nosotros</code>, <code>/catalogo-visual</code></li>
              <li>El envío dispara pings automáticos a Google + Bing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Site selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sites verificados en Search Console</CardTitle>
        </CardHeader>
        <CardContent>
          <SiteSelector
            sites={sites}
            selected={selectedSite}
            onSelect={setSelectedSite}
            loading={loadingSites}
          />
        </CardContent>
      </Card>

      {/* Site performance + sitemaps + inspector */}
      {selectedSite && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Performance 28 días</CardTitle>
              {loadingSite && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </CardHeader>
            <CardContent>
              <PerformanceOverview
                totals={siteData?.totals_28d}
                topQueries={siteData?.top_queries}
                topPages={siteData?.top_pages}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <SitemapManager
                  siteUrl={selectedSite}
                  existingSitemaps={sitemapsForSelected}
                  onSubmitted={() => loadSites()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <UrlInspector siteUrl={selectedSite} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}