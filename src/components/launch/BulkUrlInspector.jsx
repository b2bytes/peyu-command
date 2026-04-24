// ============================================================================
// BulkUrlInspector — Inspecciona masivamente URLs prioritarias en GSC
// ----------------------------------------------------------------------------
// Permite al usuario pegar/editar una lista de URLs y corre gscInspectUrl en
// cadena (1 request cada 400ms para no gatillar rate-limit de GSC).
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileSearch, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
} from 'lucide-react';

// URLs prioritarias default — 80/20 de conversión del sitio
const DEFAULT_URLS_BY_SITE = {
  'https://peyuchile.cl/': [
    'https://peyuchile.cl/',
    'https://peyuchile.cl/shop',
    'https://peyuchile.cl/b2b/contacto',
    'https://peyuchile.cl/catalogo-visual',
    'https://peyuchile.cl/personalizar',
    'https://peyuchile.cl/blog',
    'https://peyuchile.cl/nosotros',
    'https://peyuchile.cl/faq',
  ],
  'https://peyuchile.lat/': [
    'https://peyuchile.lat/',
    'https://peyuchile.lat/tienda/',
    'https://peyuchile.lat/contacto/',
  ],
};

const VERDICT_STYLE = {
  PASS: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Indexada' },
  PARTIAL: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Parcial' },
  FAIL: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'No indexada' },
  NEUTRAL: { icon: AlertTriangle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Sin veredicto' },
};

export default function BulkUrlInspector({ site_url }) {
  const defaults = DEFAULT_URLS_BY_SITE[site_url] || [site_url];
  const [urlsText, setUrlsText] = useState(defaults.join('\n'));
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [running, setRunning] = useState(false);

  const runBulk = async () => {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return;

    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: urls.length });

    const out = [];
    for (let i = 0; i < urls.length; i++) {
      const target_url = urls[i];
      try {
        const res = await base44.functions.invoke('gscInspectUrl', { site_url, target_url });
        out.push({ target_url, ...res.data });
      } catch (e) {
        out.push({ target_url, error: e?.message || 'error' });
      }
      setResults([...out]);
      setProgress({ done: i + 1, total: urls.length });
      // Pequeño delay para no saturar GSC
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 400));
    }
    setRunning(false);
  };

  const stats = results.reduce((acc, r) => {
    if (r.error) acc.error++;
    else if (r.verdict === 'PASS') acc.pass++;
    else if (r.verdict === 'PARTIAL') acc.partial++;
    else if (r.verdict === 'FAIL') acc.fail++;
    else acc.neutral++;
    return acc;
  }, { pass: 0, partial: 0, fail: 0, neutral: 0, error: 0 });

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-indigo-600" />
          Inspección masiva · {site_url}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1.5">URLs a inspeccionar (una por línea)</p>
          <Textarea
            value={urlsText}
            onChange={e => setUrlsText(e.target.value)}
            rows={6}
            className="text-xs font-mono"
            disabled={running}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={runBulk} disabled={running} size="sm" className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {running ? `Inspeccionando ${progress.done}/${progress.total}...` : 'Inspeccionar todas'}
          </Button>
          {results.length > 0 && !running && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                ✓ {stats.pass} indexadas
              </span>
              {stats.partial > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
                  ⚠ {stats.partial} parcial
                </span>
              )}
              {stats.fail > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                  ✗ {stats.fail} no indexadas
                </span>
              )}
              {stats.error > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                  {stats.error} error
                </span>
              )}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const verdict = r.error ? 'NEUTRAL' : (VERDICT_STYLE[r.verdict] ? r.verdict : 'NEUTRAL');
              const style = VERDICT_STYLE[verdict];
              const Icon = style.icon;
              return (
                <div key={i} className={`flex items-start gap-2 p-2 rounded border ${style.bg} ${style.border}`}>
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${style.color}`} />
                  <div className="flex-1 min-w-0 text-xs">
                    <a href={r.target_url} target="_blank" rel="noreferrer" className="font-mono text-slate-800 hover:underline truncate block">
                      {r.target_url.replace(site_url, '/')}
                    </a>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {r.error ? (
                        <span className="text-red-600">{r.error.slice(0, 120)}</span>
                      ) : (
                        <>
                          <span className={`font-semibold ${style.color}`}>{style.label}</span>
                          {r.coverage_state && <span> · {r.coverage_state}</span>}
                          {r.last_crawl && <span> · Último crawl: {new Date(r.last_crawl).toLocaleDateString('es-CL')}</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}