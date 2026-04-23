import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileCode, Send, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export default function SitemapManager({ siteUrl, existingSitemaps, onSubmitted }) {
  const [sitemapUrl, setSitemapUrl] = useState(siteUrl ? `${siteUrl}sitemap.xml` : '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!siteUrl || !sitemapUrl) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('gscSubmitSitemap', { site_url: siteUrl, sitemap_url: sitemapUrl });
      setResult(res?.data);
      onSubmitted?.();
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileCode className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-sm text-slate-900">Sitemaps registrados</h3>
      </div>

      {existingSitemaps && existingSitemaps.length > 0 ? (
        <div className="space-y-2">
          {existingSitemaps.map((sm, i) => {
            const totalSubmitted = (sm.contents || []).reduce((a, c) => a + Number(c.submitted || 0), 0);
            const totalIndexed = (sm.contents || []).reduce((a, c) => a + Number(c.indexed || 0), 0);
            return (
              <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white text-xs">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <a href={sm.path} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 truncate">
                    {sm.path} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  {sm.is_pending ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Pending</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Processed</span>
                  )}
                </div>
                <div className="flex gap-4 text-slate-500">
                  <span>📤 Enviadas: <strong className="text-slate-900">{totalSubmitted}</strong></span>
                  <span>✓ Indexadas: <strong className="text-emerald-700">{totalIndexed}</strong></span>
                  {sm.errors > 0 && <span className="text-red-600">⚠ Errors: {sm.errors}</span>}
                </div>
                {sm.last_submitted && (
                  <p className="text-[10px] text-slate-400 mt-1">Último envío: {new Date(sm.last_submitted).toLocaleString('es-CL')}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">No hay sitemaps registrados para este site.</p>
      )}

      <div className="pt-3 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-700 mb-2">Enviar nuevo sitemap:</p>
        <div className="flex gap-2">
          <Input
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="https://peyuchile.cl/sitemap.xml"
            className="text-xs"
          />
          <Button onClick={handleSubmit} disabled={loading || !sitemapUrl} size="sm" className="gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar
          </Button>
        </div>
        {result && (
          <div className={`mt-2 p-2 rounded-lg text-xs flex items-start gap-2 ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {result.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{result.message || (result.success ? 'Sitemap enviado' : 'Error')}</span>
          </div>
        )}
      </div>
    </div>
  );
}