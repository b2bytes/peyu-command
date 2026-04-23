// ============================================================================
// GmailTester — Playground para enviar emails de prueba vía Gmail API
// ============================================================================

import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function GmailTester() {
  const [to, setTo] = useState('ti@peyuchile.cl');
  const [subject, setSubject] = useState('Prueba desde PEYU');
  const [html, setHtml] = useState(
    '<h2 style="color:#0F8B6C">Hola 🐢</h2><p>Este es un email de prueba enviado desde el sistema PEYU.</p>'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('sendGmailEmail', {
        to, subject, html, from_name: 'PEYU Chile',
      });
      setResult({ ok: true, data: res?.data });
    } catch (e) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Para</Label>
        <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="cliente@empresa.cl" />
      </div>
      <div>
        <Label className="text-xs">Asunto</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Cuerpo (HTML)</Label>
        <Textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={6}
          className="font-mono text-xs"
        />
      </div>
      <Button onClick={handleSend} disabled={loading || !to || !subject} className="gap-2 w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Enviar email desde ti@peyuchile.cl
      </Button>

      {result && (
        <div className={`p-3 rounded-lg border text-xs ${
          result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {result.ok ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Email enviado ✓</p>
                <p className="font-mono mt-1">ID: {result.data?.message_id}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}