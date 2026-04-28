import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Check, X, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'peyu_giftcard_active';

/**
 * Caja de canje de Gift Card en el carrito.
 * Persiste el código aplicado en localStorage para que sobreviva al refresh y
 * se pueda usar desde otras páginas (ej: /canjear → /shop → /cart).
 *
 * Props:
 *   onChange(applied) → notifica al padre cuando hay/no hay GC aplicada.
 *      applied = { codigo, saldo_clp } | null
 */
export default function GiftCardRedeemBox({ onChange }) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  });

  // Notificar estado inicial al padre
  useEffect(() => { onChange?.(applied); /* eslint-disable-next-line */ }, []);

  const apply = async () => {
    const c = codigo.trim().toUpperCase();
    if (!c) return setError('Ingresa tu código');
    setError(''); setLoading(true);
    try {
      const res = await base44.functions.invoke('canjearGiftCard', { action: 'check', codigo: c });
      const data = res.data;
      if (!data.ok || !data.valid) {
        setError(data.reason || 'Código inválido');
      } else {
        const a = { codigo: data.codigo, saldo_clp: data.saldo_clp };
        setApplied(a);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
        onChange?.(a);
        setCodigo('');
      }
    } catch {
      setError('Error de conexión');
    } finally { setLoading(false); }
  };

  const remove = () => {
    setApplied(null);
    localStorage.removeItem(STORAGE_KEY);
    onChange?.(null);
  };

  if (applied) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-900 font-mono truncate">{applied.codigo}</p>
            <p className="text-[10px] text-emerald-700">Saldo: ${applied.saldo_clp.toLocaleString('es-CL')}</p>
          </div>
        </div>
        <button onClick={remove} className="w-7 h-7 rounded-lg hover:bg-emerald-100 flex items-center justify-center flex-shrink-0" title="Quitar">
          <X className="w-3.5 h-3.5 text-emerald-700" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-4 h-4 text-amber-700" />
        <p className="text-xs font-bold text-gray-900">¿Tienes una Gift Card?</p>
      </div>
      <div className="flex gap-2">
        <Input
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="PEYU-XXXX-XXXX"
          className="h-10 text-xs font-mono tracking-wider bg-white border-amber-200"
          disabled={loading}
        />
        <Button
          onClick={apply}
          disabled={loading || !codigo.trim()}
          size="sm"
          className="h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 text-xs font-bold flex-shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}