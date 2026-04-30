import { useEffect, useState, useRef } from 'react';
import { Truck, Zap, Rocket, Loader2, MapPin, Package, AlertCircle, Check } from 'lucide-react';
import { cotizarEnvioCarrito } from '@/lib/bluex-shipping';

/**
 * Selector de envío Bluex con cotización REAL por comuna y peso del carrito.
 * La comuna llega desde el formulario de envío (props.comuna), no se ingresa
 * manualmente. Cada vez que cambia, recotiza automáticamente.
 *
 * Props:
 *  - items: array del carrito ({ productoId, cantidad, nombre })
 *  - comuna: string (proviene de cliente.ciudad del form de envío)
 *  - region: string (informativo)
 *  - subtotal: number (para evaluar envío gratis sobre umbral)
 *  - umbralEnvioGratis: number (default 40000)
 *  - onSelect: callback({ servicio, costo, costo_real, lead_time_dias, comuna, peso_kg, envio_gratis_aplicado })
 *  - variant: 'dark' | 'light'
 */
export default function ShippingSelector({
  items = [],
  comuna = '',
  region = '',
  subtotal = 0,
  umbralEnvioGratis = 40000,
  onSelect,
  variant = 'light',
}) {
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState('express');
  const lastQuotedRef = useRef('');

  const isDark = variant === 'dark';
  const styles = isDark ? {
    container: 'bg-white/5 border-white/15 backdrop-blur-sm',
    title: 'text-white',
    helper: 'text-white/50',
    helperMuted: 'text-white/40',
    accent: 'text-teal-400',
  } : {
    container: 'bg-white border-gray-100 shadow-sm',
    title: 'text-gray-900',
    helper: 'text-gray-500',
    helperMuted: 'text-gray-400',
    accent: 'text-teal-600',
  };

  const envioGratisAplica = subtotal >= umbralEnvioGratis;

  // Auto-cotizar cada vez que cambia la comuna del formulario.
  useEffect(() => {
    const c = (comuna || '').trim();
    if (!c) {
      setCotizacion(null);
      setError(null);
      return;
    }
    // Evitar recotizar si es la misma comuna que ya cotizamos
    const key = `${c}|${items.map(i => `${i.productoId}x${i.cantidad}`).join(',')}`;
    if (key === lastQuotedRef.current) return;
    lastQuotedRef.current = key;

    let cancelled = false;
    setLoading(true);
    setError(null);
    cotizarEnvioCarrito({ comuna: c, items })
      .then(res => {
        if (cancelled) return;
        if (!res || (!res.express && !res.priority)) {
          setError(`No encontramos tarifa Bluex para "${c}". Te contactaremos para cotizar manualmente.`);
          setCotizacion(null);
        } else {
          setCotizacion(res);
        }
      })
      .catch(e => { if (!cancelled) setError(e.message || 'Error al cotizar envío'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [comuna, items]);

  // Notificar opción seleccionada al padre
  useEffect(() => {
    if (!cotizacion || !onSelect) return;
    const opcion = selectedKey === 'priority' ? cotizacion.priority : cotizacion.express;
    if (!opcion) return;
    onSelect({
      servicio: opcion.servicio,
      costo: envioGratisAplica && selectedKey === 'express' ? 0 : opcion.costo,
      costo_real: opcion.costo,
      lead_time_dias: opcion.lead_time_dias,
      comuna: opcion.comuna,
      region: opcion.region,
      peso_kg: cotizacion.peso_total_kg,
      envio_gratis_aplicado: envioGratisAplica && selectedKey === 'express',
    });
  }, [cotizacion, selectedKey, envioGratisAplica, onSelect]);

  return (
    <div className={`border rounded-2xl p-5 space-y-4 ${styles.container}`}>
      <div className="flex items-center gap-2">
        <Truck className={`w-4 h-4 ${styles.accent}`} />
        <h3 className={`font-bold text-sm ${styles.title}`}>Costo de envío</h3>
        <span className={`text-[10px] font-bold ml-auto px-2 py-0.5 rounded-full border ${isDark ? 'text-blue-300 bg-blue-500/20 border-blue-400/25' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>
          BlueExpress
        </span>
      </div>

      {/* Sin comuna seleccionada */}
      {!comuna && (
        <div className={`text-[12px] flex items-center gap-2 ${styles.helper}`}>
          <MapPin className="w-3.5 h-3.5" />
          Selecciona tu región y comuna arriba para ver el costo real.
        </div>
      )}

      {/* Cotizando */}
      {loading && (
        <div className={`flex items-center gap-2 text-sm ${styles.helper}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Calculando envío para {comuna}...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={`border rounded-xl p-3 flex items-start gap-2 text-xs ${isDark ? 'bg-amber-500/15 border-amber-400/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="mt-1 opacity-80">Aplicaremos tarifa estándar de $5.990. Coordinaremos con BlueExpress al confirmar tu pedido.</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {cotizacion && !loading && (
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-[11px] px-1 ${styles.helper}`}>
            <span className="flex items-center gap-1.5">
              <Package className="w-3 h-3" />
              {cotizacion.peso_total_kg} kg · {items.reduce((s, i) => s + (i.cantidad || 1), 0)} u.
            </span>
            <span className={styles.accent}>
              {cotizacion.express?.comuna || cotizacion.priority?.comuna} · {cotizacion.express?.region || cotizacion.priority?.region}
            </span>
          </div>

          {cotizacion.express && (
            <ShippingOption
              icon={Zap}
              title="EXPRESS"
              subtitle={`Estándar · ${cotizacion.express.lead_time_dias > 0 ? `${cotizacion.express.lead_time_dias} días hábiles` : '24-72 hrs'}`}
              costo={cotizacion.express.costo}
              costoFinal={envioGratisAplica ? 0 : cotizacion.express.costo}
              gratis={envioGratisAplica}
              selected={selectedKey === 'express'}
              onClick={() => setSelectedKey('express')}
              color="teal"
              isDark={isDark}
            />
          )}

          {cotizacion.priority && (
            <ShippingOption
              icon={Rocket}
              title="PRIORITY"
              subtitle={`Entrega rápida · ${cotizacion.priority.lead_time_dias > 0 ? `${cotizacion.priority.lead_time_dias} día hábil` : '24h'}`}
              costo={cotizacion.priority.costo}
              costoFinal={cotizacion.priority.costo}
              gratis={false}
              selected={selectedKey === 'priority'}
              onClick={() => setSelectedKey('priority')}
              color="purple"
              isDark={isDark}
            />
          )}

          {envioGratisAplica && (
            <p className={`text-[11px] text-center pt-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
              🎉 Envío EXPRESS gratis por compra superior a ${umbralEnvioGratis.toLocaleString('es-CL')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ShippingOption({ icon: Icon, title, subtitle, costo, costoFinal, gratis, selected, onClick, color, isDark }) {
  const tonesDark = {
    teal: selected ? 'border-teal-400 bg-teal-500/15' : 'border-white/15 hover:border-teal-400/40',
    purple: selected ? 'border-purple-400 bg-purple-500/15' : 'border-white/15 hover:border-purple-400/40',
  };
  const tonesLight = {
    teal: selected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300',
    purple: selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
  };
  const iconTonesDark = { teal: 'bg-white/10 text-teal-300', purple: 'bg-white/10 text-purple-300' };
  const iconTonesLight = { teal: 'bg-teal-100 text-teal-600', purple: 'bg-purple-100 text-purple-600' };
  const tones = isDark ? tonesDark : tonesLight;
  const iconTones = isDark ? iconTonesDark : iconTonesLight;
  const titleColor = isDark ? 'text-white' : 'text-gray-900';
  const subColor = isDark ? 'text-white/50' : 'text-gray-500';
  const strikeColor = isDark ? 'text-white/40' : 'text-gray-400';
  const gratisColor = isDark ? 'text-green-400' : 'text-green-600';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-all text-left ${tones[color]}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTones[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm ${titleColor}`}>{title}</p>
          {selected && <Check className={`w-3.5 h-3.5 ${gratisColor}`} />}
        </div>
        <p className={`text-[11px] ${subColor}`}>{subtitle}</p>
      </div>
      <div className="text-right">
        {gratis ? (
          <>
            <p className={`text-[10px] line-through ${strikeColor}`}>${costo.toLocaleString('es-CL')}</p>
            <p className={`font-bold text-sm ${gratisColor}`}>GRATIS</p>
          </>
        ) : (
          <p className={`font-bold text-sm ${titleColor}`}>${costoFinal.toLocaleString('es-CL')}</p>
        )}
      </div>
    </button>
  );
}