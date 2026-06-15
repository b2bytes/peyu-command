import { useState, useEffect, useRef } from 'react';
import { Truck, Loader2, MapPin, Zap } from 'lucide-react';
import { cotizarEnvioAmbos, calcularPesoFacturable } from '@/lib/bluex-shipping';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// ShippingEstimatorV2 — Cotizador de envío BlueExpress EN VIVO en la ficha
// de producto. El cliente escribe su comuna y ve costo + días hábiles reales
// (tarifario oficial TarifaBluex, peso facturable del producto × cantidad).
// La comuna queda persistida y se comparte con el resto del funnel.
// ════════════════════════════════════════════════════════════════════════
const W = {
  border: '#D4C4B0', fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070',
  action: '#C0785C', green: '#8BAD8A',
};
const KEY = 'peyu_envio_comuna_v1';

export default function ShippingEstimatorV2({ producto, cantidad = 1 }) {
  const [comuna, setComuna] = useState(() => {
    try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
  });
  const [cotizando, setCotizando] = useState(false);
  const [tarifa, setTarifa] = useState(null);
  const [sinTarifa, setSinTarifa] = useState(false);
  const reqRef = useRef(0);

  const cotizar = async (c = comuna) => {
    const valor = String(c || '').trim();
    if (!valor) return;
    const reqId = ++reqRef.current;
    setCotizando(true);
    setSinTarifa(false);
    try { localStorage.setItem(KEY, valor); } catch { /* noop */ }
    const pesoKg = Math.max(0.5, calcularPesoFacturable(producto, cantidad));
    let res = null;
    try {
      // Probamos AMBOS servicios (EXPRESS + PRIORITY): "la reina", "padre hurtado" y
      // otras comunas solo tienen tarifa PRIORITY en el contrato Bluex. EXPRESS es
      // preferido; PRIORITY es fallback automático si EXPRESS no existe.
      const ambos = await cotizarEnvioAmbos({ comuna: valor, pesoKg });
      res = ambos?.express || ambos?.priority || null;
    } catch { res = null; }
    if (reqId !== reqRef.current) return; // respuesta vieja: descartar
    setTarifa(res);
    setSinTarifa(!res);
    setCotizando(false);
  };

  // Comuna persistida → cotiza sola al entrar y se recalcula al cambiar cantidad.
  useEffect(() => {
    if (comuna.trim() && producto) cotizar();
  }, [cantidad, producto?.id]); // eslint-disable-line

  return (
    <div className="rounded-2xl p-3.5 space-y-2.5 bg-white" style={{ border: `1.5px solid ${W.border}` }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: W.fg }}>
          <Truck className="w-4 h-4" style={{ color: W.action }} /> Envío BlueExpress
        </p>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{ background: 'rgba(192,120,92,.10)', color: W.action }}>
          <Zap className="w-2.5 h-2.5" /> En vivo
        </span>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); cotizar(); }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: W.fgMuted }} />
          <input
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            placeholder="Tu comuna (ej: Providencia)"
            className="w-full h-10 pl-8 pr-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#F8F3ED', border: `1.5px solid ${W.border}`, color: W.fg }}
          />
        </div>
        <button
          type="submit"
          disabled={cotizando || !comuna.trim()}
          className="h-10 px-4 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
        >
          {cotizando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Calcular'}
        </button>
      </form>

      {tarifa && !cotizando && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(139,173,138,.10)', border: '1px solid rgba(139,173,138,.35)' }}>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: W.fg }}>
              {tarifa.comuna || comuna}{tarifa.region ? ` · ${tarifa.region}` : ''}
            </p>
            <p className="text-[11px] font-semibold" style={{ color: '#5B7D5A' }}>
              Llega en {tarifa.lead_time_dias} {tarifa.lead_time_dias === 1 ? 'día hábil' : 'días hábiles'}
              {tarifa.es_estimado ? ' · estimado' : ''}
            </p>
          </div>
          <span className="font-poppins font-bold text-base flex-shrink-0 ml-2" style={{ color: '#5B7D5A' }}>
            {fmtCLP(tarifa.costo)}
          </span>
        </div>
      )}
      {sinTarifa && !cotizando && (
        <p className="text-[11px] font-semibold" style={{ color: W.fgMuted }}>
          No encontramos esa comuna — revisa la escritura o calcula el envío exacto en el checkout.
        </p>
      )}
    </div>
  );
}