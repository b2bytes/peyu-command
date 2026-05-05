// ============================================================================
// LaunchBlastCard — Botón único de lanzamiento SEO
// ----------------------------------------------------------------------------
// Orquesta sitemap → GSC → ping Google/Bing → IndexNow en una sola acción.
// Pensado para el día D del lanzamiento.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function LaunchBlastCard() {
  const [indexnowKey, setIndexnowKey] = useState('');
  const [alsoLat, setAlsoLat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateKey = () => {
    const k = Array.from({ length: 32 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    setIndexnowKey(k);
  };

  const launch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('seoLaunchBlast', {
        indexnow_key: indexnowKey || undefined,
        also_lat: alsoLat,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          🚀 LAUNCH BLAST · Indexación 1-click
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-slate-700 bg-white/60 border border-orange-200 rounded p-2.5">
          <strong>Esta acción dispara TODO en paralelo:</strong>
          <ul className="mt-1 space-y-0.5 ml-4 list-disc">
            <li>Genera sitemap fresco con todos los productos + páginas + blog</li>
            <li>Submit a Google Search Console (peyuchile.cl{alsoLat ? ' + peyuchile.lat' : ''})</li>
            <li>Ping a Google y Bing webmaster tools</li>
            {indexnowKey && <li>IndexNow blast a Bing, Yandex y Seznam</li>}
          </ul>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">IndexNow key (opcional · para Bing/Yandex/Seznam)</Label>
          <div className="flex gap-1">
            <Input
              value={indexnowKey}
              onChange={e => setIndexnowKey(e.target.value)}
              placeholder="Sin key = solo Google"
              className="h-8 text-xs font-mono"
            />
            <Button size="sm" variant="outline" onClick={generateKey} className="h-8 text-xs whitespace-nowrap">
              Generar
            </Button>
          </div>
          {indexnowKey && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5">
              ⚠️ Sube <code className="bg-white px-1 rounded">{indexnowKey}.txt</code> a la raíz de peyuchile.cl con el contenido = la key, antes de disparar.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={alsoLat}
            onChange={e => setAlsoLat(e.target.checked)}
            className="w-3.5 h-3.5"
          />
          Incluir también peyuchile.lat (WooCommerce)
        </label>

        <Button
          onClick={launch}
          disabled={loading}
          className="w-full gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold h-11"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Lanzando blast...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Disparar LAUNCH BLAST</>
          )}
        </Button>

        {result && (
          <div className={`p-3 rounded-lg text-xs ${result.success ? 'bg-emerald-50 border border-emerald-300' : 'bg-red-50 border border-red-300'}`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${result.success ? 'text-emerald-900' : 'text-red-800'}`}>
                  {result.message || result.error}
                </p>
                {result.success && result.breakdown && (
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    <div className="bg-white rounded px-1.5 py-1 text-center">
                      <div className="font-bold text-emerald-700">{result.breakdown.static}</div>
                      <div className="text-[9px] text-slate-500">páginas</div>
                    </div>
                    <div className="bg-white rounded px-1.5 py-1 text-center">
                      <div className="font-bold text-emerald-700">{result.breakdown.products}</div>
                      <div className="text-[9px] text-slate-500">productos</div>
                    </div>
                    <div className="bg-white rounded px-1.5 py-1 text-center">
                      <div className="font-bold text-emerald-700">{result.breakdown.blog}</div>
                      <div className="text-[9px] text-slate-500">posts blog</div>
                    </div>
                  </div>
                )}
                {result.success && result.operations && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-700">
                      Ver detalle por operación
                    </summary>
                    <pre className="mt-1 text-[9px] bg-white p-1.5 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.operations, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}