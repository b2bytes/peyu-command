// ============================================================================
// IndexNowCard — Dispara pings a IndexNow (Bing/Yandex/Seznam)
// Requiere que el usuario genere una key y aloje {key}.txt en la raíz.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';

const DEFAULT_URLS = `https://peyuchile.cl/
https://peyuchile.cl/shop
https://peyuchile.cl/b2b/catalogo
https://peyuchile.cl/b2b/contacto
https://peyuchile.cl/catalogo-visual
https://peyuchile.cl/personalizar
https://peyuchile.cl/blog
https://peyuchile.cl/nosotros`;

export default function IndexNowCard() {
  const [host, setHost] = useState('peyuchile.cl');
  const [key, setKey] = useState('');
  const [urls, setUrls] = useState(DEFAULT_URLS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateKey = () => {
    // IndexNow key: 8-128 chars alfanuméricos
    const k = Array.from({ length: 32 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    setKey(k);
  };

  const send = async () => {
    setLoading(true);
    setResult(null);
    try {
      const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
      const res = await base44.functions.invoke('indexNowPing', { host, key, urls: urlList });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          IndexNow — Ping instantáneo (Bing · Yandex · Seznam)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex gap-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Pasos:</strong> 1) Genera key → 2) Sube <code className="bg-white px-1 rounded">{'{key}'}.txt</code> a la raíz del dominio con el contenido = la misma key → 3) Envía URLs.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Host</Label>
            <Input value={host} onChange={e => setHost(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Key (32 chars)</Label>
            <div className="flex gap-1">
              <Input value={key} onChange={e => setKey(e.target.value)} className="h-8 text-sm font-mono" />
              <Button size="sm" variant="outline" onClick={generateKey} className="h-8 text-xs whitespace-nowrap">Generar</Button>
            </div>
          </div>
        </div>

        {key && (
          <div className="p-2 bg-white border border-amber-300 rounded text-xs text-slate-700">
            <strong>Acción manual requerida:</strong> sube un archivo llamado{' '}
            <code className="bg-amber-100 px-1 rounded">{key}.txt</code> a{' '}
            <code className="bg-amber-100 px-1 rounded">https://{host}/{key}.txt</code>{' '}
            cuyo contenido sea exactamente: <code className="bg-amber-100 px-1 rounded break-all">{key}</code>
          </div>
        )}

        <div>
          <Label className="text-xs">URLs (una por línea)</Label>
          <Textarea value={urls} onChange={e => setUrls(e.target.value)} rows={6} className="text-xs font-mono" />
        </div>

        <Button onClick={send} disabled={loading || !key || !host} className="gap-2 bg-amber-600 hover:bg-amber-700 w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Disparar IndexNow
        </Button>

        {result && (
          <div className={`p-2.5 rounded text-xs flex items-start gap-2 ${result.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {result.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{result.message || result.error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}