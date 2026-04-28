import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Copy, Check, RefreshCw, ExternalLink, Package, BookOpen, FileText } from 'lucide-react';

/**
 * Tarjeta de control del sitemap.xml dinámico.
 * Muestra el endpoint live, lo testea y reporta conteos por sección.
 */
export default function SitemapLiveCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Endpoint base de la función Deno (Base44 expone una URL pública por función).
  // El usuario puede copiarla y configurar un redirect 301 desde /sitemap.xml.
  const endpoint = `${window.location.origin}/api/serveSitemap`;

  const runStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('generateSitemap', {});
      setStats(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyEndpoint = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Map className="w-4 h-4 text-emerald-600" />
          Sitemap dinámico (live)
        </CardTitle>
        <p className="text-xs text-slate-500">
          Endpoint público que sirve <code className="bg-slate-100 px-1 rounded">application/xml</code> en tiempo real con productos + blog + estáticas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Endpoints públicos */}
        <div className="space-y-2">
          {[
            { label: 'Sitemap completo', url: '/api/serveSitemap', icon: FileText },
            { label: 'Solo productos', url: '/api/serveSitemap?type=products', icon: Package },
            { label: 'Solo blog', url: '/api/serveSitemap?type=blog', icon: BookOpen },
            { label: 'Sitemap index', url: '/api/serveSitemap?type=index', icon: Map },
          ].map((s) => {
            const Icon = s.icon;
            const fullUrl = `${window.location.origin}${s.url}`;
            return (
              <div key={s.url} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{fullUrl}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={() => copyEndpoint(fullUrl)}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <Button
          onClick={runStats}
          disabled={loading}
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Calculando...' : 'Generar snapshot y contar URLs'}
        </Button>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {stats?.success && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-700">{stats.total_urls}</p>
              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">URLs total</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-700">{stats.products}</p>
              <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Productos</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-700">{stats.static_routes}</p>
              <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Estáticas</p>
            </div>
          </div>
        )}

        {/* Tip de configuración */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900 font-semibold mb-1">📌 Configuración en Search Console</p>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Envía <code className="bg-white px-1 rounded">{window.location.origin}/api/serveSitemap</code> como sitemap principal.
            El endpoint se actualiza cada vez que creas/editas un producto o post (cache HTTP de 1h).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}