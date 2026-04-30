// ============================================================================
// IndexNowBlastCard — Dispara el blast masivo IndexNow desde el War Room
// ----------------------------------------------------------------------------
// El día del lanzamiento, este botón notifica a Bing/Yandex/Seznam de TODAS
// las URLs públicas (estáticas + productos + blog) en lotes de 100.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const DEFAULT_HOST = 'peyuchile.cl';

export default function IndexNowBlastCard() {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fire = async () => {
    if (!key.trim()) { setError('Falta la IndexNow key'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('autoIndexNowBlast', {
        host: host.trim(),
        key: key.trim(),
      });
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Error en el blast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-600" />
          IndexNow Blast (día D)
        </CardTitle>
        <p className="text-xs text-slate-600">
          Notifica a <strong>Bing · Yandex · Seznam · DuckDuckGo</strong> todas las URLs públicas en un solo click.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Host</Label>
            <Input
              value={host}
              onChange={e => setHost(e.target.value)}
              placeholder="peyuchile.cl"
              className="text-xs h-9"
            />
          </div>
          <div>
            <Label className="text-xs">IndexNow key</Label>
            <Input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="abc123…"
              className="text-xs h-9 font-mono"
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 italic">
          La key debe estar accesible en <code>https://{host || 'peyuchile.cl'}/{'{key}'}.txt</code>
        </p>

        <Button
          onClick={fire}
          disabled={loading || !key.trim()}
          className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disparando blast…</>
            : <><Zap className="w-3.5 h-3.5" /> Disparar IndexNow Blast</>}
        </Button>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result && result.success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {result.message}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div><span className="text-emerald-700">Estáticas:</span> <strong>{result.breakdown.static}</strong></div>
              <div><span className="text-emerald-700">Productos:</span> <strong>{result.breakdown.products}</strong></div>
              <div><span className="text-emerald-700">Blog:</span> <strong>{result.breakdown.blog}</strong></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}