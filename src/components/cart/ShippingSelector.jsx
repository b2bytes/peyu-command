import { useEffect, useState, useCallback } from 'react';
import { Truck, Zap, Rocket, Loader2, MapPin, Package, AlertCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cotizarEnvioCarrito } from '@/lib/bluex-shipping';

/**
 * Selector de envío Bluex con cotización real por comuna y peso del carrito.
 *
 * Props:
 *  - items: array de items del carrito ({ productoId, cantidad, nombre })
 *  - comunaInicial: string (opcional, para preselect)
 *  - onSelect: callback({ servicio, costo, lead_time_dias, comuna, peso_kg })
 *  - umbralEnvioGratis: number (default 40000 → si subtotal supera, marca gratis)
 *  - subtotal: number (para evaluar envío gratis)
 */
export default function ShippingSelector({
  items = [],
  comunaInicial = '',
  onSelect,
  umbralEnvioGratis = 40000,
  subtotal = 0,
  variant = 'dark', // 'dark' o 'light'
}) {
  const isDark = variant === 'dark';
  const styles = isDark ? {
    container: 'bg-white/5 border-white/15 backdrop-blur-sm',
    title: 'text-white',
    label: 'text-white/70',
    input: 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-teal-400/30',
    helper: 'text-white/50',
    helperMuted: 'text-white/40',
    accent: 'text-teal-400',
  } : {
    container: 'bg-white border-gray-100 shadow-sm',
    title: 'text-gray-900',
    label: 'text-gray-700',
    input: 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-teal-500/30',
    helper: 'text-gray-500',
    helperMuted: 'text-gray-400',
    accent: 'text-teal-600',
  };

  const [comuna, setComuna] = useState(comunaInicial);
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState('express');

  const envioGratisAplica = subtotal >= umbralEnvioGratis;

  const cotizar = useCallback(async () => {
    if (!comuna || comuna.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await cotizarEnvioCarrito({ comuna: comuna.trim(), items });
      if (!res || (!res.express && !res.priority)) {
        setError('No tenemos tarifa Bluex para esa comuna. Contáctanos por WhatsApp.');
        setCotizacion(null);
      } else {
        setCotizacion(res);
      }
    } catch (e) {
      setError(e.message || 'Error al cotizar envío');
    } finally {
      setLoading(false);
    }
  }, [comuna, items]);

  // Auto-cotizar al montar si tenemos comuna inicial
  useEffect(() => {
    if (comunaInicial && !cotizacion) cotizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comunaInicial]);

  // Notificar la opción seleccionada al padre
  useEffect(() => {
    if (!cotizacion || !onSelect) return;
    const opcion = selectedKey === 'priority' ? cotizacion.priority : cotizacion.express;
    if (opcion) {
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
    }
  }, [cotizacion, selectedKey, envioGratisAplica, onSelect]);

  return (
    <div className={`border rounded-2xl p-5 space-y-4 ${styles.container}`}>
      <div className="flex items-center gap-2">
        <Truck className={`w-4 h-4 ${styles.accent}`} />
        <h3 className={`font-bold text-sm ${styles.title}`}>Calcular envío</h3>
        <span className={`text-[10px] font-bold ml-auto px-2 py-0.5 rounded-full border ${isDark ? 'text-blue-300 bg-blue-500/20 border-blue-400/25' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>
          BlueExpress
        </span>
      </div>

      {/* Input comuna */}
      <div>
        <label className={`text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${styles.label}`}>
          <MapPin className="w-3 h-3" /> Comuna de despacho
        </label>
        <div className="flex gap-2">
          <Input
            value={comuna}
            onChange={e => setComuna(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') cotizar(); }}
            placeholder="Ej: Las Condes, Viña del Mar, Concepción..."
            className={`rounded-xl h-10 text-sm ${styles.input}`}
          />
          <Button
            onClick={cotizar}
            disabled={loading || !comuna.trim()}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-10 px-4 rounded-xl border-0 text-sm font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cotizar'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`border rounded-xl p-3 flex items-start gap-2 text-xs ${isDark ? 'bg-red-500/15 border-red-400/30 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultados */}
      {cotizacion && (
        <div className="space-y-2">
          {/* Peso del paquete */}
          <div className={`flex items-center justify-between text-[11px] px-1 ${styles.helper}`}>
            <span className="flex items-center gap-1.5">
              <Package className="w-3 h-3" />
              Paquete: {cotizacion.peso_total_kg} kg ({items.reduce((s, i) => s + (i.cantidad || 1), 0)} u.)
            </span>
            <span className={styles.accent}>{cotizacion.express?.region || cotizacion.priority?.region}</span>
          </div>

          {/* Express */}
          {cotizacion.express && (
            <ShippingOption
              icon={Zap}
              title="EXPRESS"
              subtitle="Estándar · 24-72 hrs"
              costo={cotizacion.express.costo}
              costoFinal={envioGratisAplica ? 0 : cotizacion.express.costo}
              gratis={envioGratisAplica}
              selected={selectedKey === 'express'}
              onClick={() => setSelectedKey('express')}
              color="teal"
              isDark={isDark}
            />
          )}

          {/* Priority */}
          {cotizacion.priority && (
            <ShippingOption
              icon={Rocket}
              title="PRIORITY"
              subtitle="Entrega rápida · 24h"
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
              🎉 Envío EXPRESS gratis aplicado por compra superior a ${umbralEnvioGratis.toLocaleString('es-CL')}
            </p>
          )}
        </div>
      )}

      {!cotizacion && !loading && !error && (
        <p className={`text-[11px] text-center py-2 ${styles.helperMuted}`}>
          Ingresa tu comuna para ver costo y plazo de envío reales
        </p>
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