import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, Check, Loader2 } from 'lucide-react';

/**
 * Caja para aplicar cupón de descuento. Persiste en localStorage para no perderlo
 * al navegar. Calcula el descuento en función de subtotal + envío.
 *
 * Props:
 *   subtotal: number (CLP, sin envío)
 *   envio:   number (CLP)
 *   email:   string (para validar uso único)
 *   onChange(cupon|null): callback con { codigo, descuento_clp, libera_envio, tipo, valor }
 */
const STORAGE_KEY = 'peyu_cupon_active';

export default function CuponBox({ subtotal, envio, email, onChange }) {
  const [codigo, setCodigo] = useState('');
  const [cupon, setCupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recupera cupón guardado al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const c = JSON.parse(saved);
        if (c?.codigo) {
          setCodigo(c.codigo);
          aplicar(c.codigo, true);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalcula descuento si cambia subtotal/envío
  useEffect(() => {
    if (cupon) {
      const recomputed = calcularDescuento(cupon, subtotal, envio);
      onChange?.({ ...cupon, ...recomputed });
    } else {
      onChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, envio, cupon]);

  const calcularDescuento = (c, sub, env) => {
    let descuento_clp = 0;
    let libera_envio = false;
    if (c.tipo === 'envio_gratis') {
      libera_envio = true;
      descuento_clp = env;
    } else if (c.tipo === 'porcentaje') {
      descuento_clp = Math.floor(sub * (c.valor / 100));
      if (c.max_descuento_clp) descuento_clp = Math.min(descuento_clp, c.max_descuento_clp);
    } else if (c.tipo === 'monto_fijo') {
      descuento_clp = Math.min(c.valor, sub);
    }
    return { descuento_clp, libera_envio };
  };

  const aplicar = async (forzarCodigo, silent = false) => {
    const codeRaw = (forzarCodigo || codigo || '').trim().toUpperCase();
    if (!codeRaw) return;
    setError('');
    setLoading(true);
    try {
      const list = await base44.entities.Cupon.filter({ codigo: codeRaw });
      const c = list?.[0];
      if (!c) throw new Error('Cupón no encontrado');
      if (!c.activo) throw new Error('Cupón inactivo');

      const hoy = new Date().toISOString().slice(0, 10);
      if (c.fecha_inicio && hoy < c.fecha_inicio) throw new Error('Cupón aún no vigente');
      if (c.fecha_expiracion && hoy > c.fecha_expiracion) throw new Error('Cupón expirado');
      if (c.usos_max && c.usos_actuales >= c.usos_max) throw new Error('Cupón agotado');
      if (c.minimo_compra_clp && subtotal < c.minimo_compra_clp) {
        throw new Error(`Compra mínima: $${c.minimo_compra_clp.toLocaleString('es-CL')}`);
      }

      setCupon(c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ codigo: c.codigo }));
    } catch (e) {
      if (!silent) setError(e.message || 'Cupón inválido');
      localStorage.removeItem(STORAGE_KEY);
      setCupon(null);
    } finally {
      setLoading(false);
    }
  };

  const quitar = () => {
    setCupon(null);
    setCodigo('');
    setError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  if (cupon) {
    const { descuento_clp, libera_envio } = calcularDescuento(cupon, subtotal, envio);
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-emerald-900 text-sm truncate">{cupon.codigo}</p>
              <p className="text-xs text-emerald-700">
                {libera_envio
                  ? 'Envío gratis aplicado'
                  : `−$${descuento_clp.toLocaleString('es-CL')} de descuento`}
              </p>
            </div>
          </div>
          <button onClick={quitar} className="w-7 h-7 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100">
            <X className="w-3.5 h-3.5 text-emerald-700" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
        <Tag className="w-3.5 h-3.5 text-gray-400" /> Cupón de descuento
      </label>
      <div className="flex gap-2">
        <Input
          value={codigo}
          onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError(''); }}
          placeholder="BIENVENIDA10"
          className="h-10 text-sm rounded-xl uppercase tracking-wide font-mono"
          onKeyDown={(e) => e.key === 'Enter' && aplicar()}
        />
        <Button
          onClick={() => aplicar()}
          disabled={loading || !codigo.trim()}
          className="rounded-xl h-10 px-4 bg-gray-900 hover:bg-gray-800 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
    </div>
  );
}