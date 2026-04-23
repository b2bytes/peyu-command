import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function UrlInspector({ siteUrl }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const inspect = async () => {
    if (!url || !siteUrl) return;
    setLoading(true);
    setData(null);
    try {
      const res = await base44.functions.invoke('gscInspectUrl', { site_url: siteUrl, inspect_url: url });
      setData(res?.data);
    } catch (e) {
      setData({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const verdict = data?.data?.inspectionResult?.indexStatusResult?.verdict;
  const coverageState = data?.data?.inspectionResult?.indexStatusResult?.coverageState;
  const lastCrawl = data?.data?.inspectionResult?.indexStatusResult?.lastCrawlTime;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-purple-600" />
        <h3 className="font-semibold text-sm text-slate-900">Inspeccionar URL específica</h3>
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://peyuchile.cl/shop"
          className="text-xs"
        />
        <Button onClick={inspect} disabled={loading || !url} size="sm" className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Inspeccionar
        </Button>
      </div>

      {data && (
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
          {data.error ? (
            <div className="text-red-700 flex items-start gap-2"><XCircle className="w-4 h-4 flex-shrink-0" /> {data.error}</div>
          ) : verdict ? (
            <>
              <div className="flex items-center gap-2">
                {verdict === 'PASS' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <strong className={verdict === 'PASS' ? 'text-emerald-700' : 'text-red-700'}>{verdict}</strong>
              </div>
              <p><span className="text-slate-500">Cobertura:</span> <strong className="text-slate-900">{coverageState || '—'}</strong></p>
              {lastCrawl && <p><span className="text-slate-500">Último crawl:</span> {new Date(lastCrawl).toLocaleString('es-CL')}</p>}
            </>
          ) : (
            <pre className="text-[10px] overflow-auto max-h-40">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}