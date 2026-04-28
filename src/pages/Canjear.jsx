import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Check, AlertCircle, Loader2, ShoppingBag, Copy } from 'lucide-react';
import SEO from '@/components/SEO';

export default function Canjear() {
  const [params] = useSearchParams();
  const [codigo, setCodigo] = useState(params.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-validar si viene con ?code= en URL
  useEffect(() => {
    if (params.get('code')) handleValidate(params.get('code'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async (codeOverride) => {
    const c = (codeOverride || codigo).trim().toUpperCase();
    if (!c) return setError('Ingresa tu código');
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await base44.functions.invoke('canjearGiftCard', { action: 'check', codigo: c });
      const data = res.data;
      if (!data.ok || !data.valid) {
        setError(data.reason || 'Código inválido');
      } else {
        setResult(data);
      }
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAndShop = () => {
    // Persistir en localStorage para que el carrito lo aplique al checkout
    localStorage.setItem('peyu_giftcard_active', JSON.stringify({
      codigo: result.codigo,
      saldo_clp: result.saldo_clp,
    }));
    window.location.href = '/shop';
  };

  return (
    <>
      <SEO
        title="Canjear Gift Card PEYU · Tu regalo sostenible"
        description="Ingresa el código de tu Gift Card PEYU para validar saldo y aplicar en tu compra."
        canonical="https://peyuchile.cl/canjear"
        noindex={true}
      />
      <div className="flex-1 overflow-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 items-center justify-center mb-4 shadow-xl">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-white mb-2">Canjear Gift Card</h1>
            <p className="text-white/60">Ingresa tu código y descubre tu saldo disponible</p>
          </div>

          {/* Formulario */}
          <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <label className="block text-sm font-semibold text-white/80 mb-2">Código Gift Card</label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleValidate()}
                placeholder="PEYU-XXXX-XXXX"
                className="flex-1 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono tracking-widest text-center sm:text-left"
                disabled={loading}
              />
              <Button
                onClick={() => handleValidate()}
                disabled={loading || !codigo.trim()}
                className="h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl px-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/15 border border-red-400/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300 text-sm">{error}</p>
                  <p className="text-xs text-red-300/70 mt-1">Verifica el código en el email que recibiste o contáctanos.</p>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/15 border border-emerald-400/40 rounded-2xl p-6 text-center">
                  <div className="inline-flex w-12 h-12 rounded-full bg-emerald-500/30 items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold mb-1">Tarjeta válida</p>
                  <p className="font-mono text-2xl font-bold text-white tracking-widest mb-3">{result.codigo}</p>
                  <div className="bg-black/20 rounded-xl p-4 inline-block">
                    <p className="text-xs text-white/50 mb-1">Saldo disponible</p>
                    <p className="text-4xl font-poppins font-bold text-emerald-300">
                      ${new Intl.NumberFormat('es-CL').format(result.saldo_clp)}
                    </p>
                    <p className="text-[11px] text-white/40 mt-1">CLP</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2 rounded-xl"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar código'}
                  </Button>
                  <Button
                    onClick={handleApplyAndShop}
                    className="h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold gap-2 rounded-xl"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Comprar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Cómo funciona */}
          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-center">
            {[
              { n: 1, t: 'Valida tu código', d: 'Verificamos saldo y vigencia' },
              { n: 2, t: 'Compra en la tienda', d: 'Elige los productos que quieras' },
              { n: 3, t: 'Aplica al checkout', d: 'Descuento automático del total' },
            ].map(s => (
              <div key={s.n} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center justify-center mx-auto mb-2">{s.n}</div>
                <p className="font-bold text-white text-sm">{s.t}</p>
                <p className="text-xs text-white/50 mt-1">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link to="/shop" className="text-sm text-white/60 hover:text-white">¿No tienes una? <span className="text-emerald-300 font-semibold underline">Regalar una Gift Card →</span></Link>
          </div>
        </div>
      </div>
    </>
  );
}