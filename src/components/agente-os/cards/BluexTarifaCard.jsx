import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, Search, Loader2, AlertCircle } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_CLP, FLAT_SHIPPING_CLP } from '@/lib/delivery-promise';

const fmt = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

// Cotizador BlueExpress en vivo, dentro de la conversación.
// Responde "¿cuánto cuesta enviar X kg a tal comuna?" con la tarifa real del
// contrato PEYU–Bluex, y la contrasta con la tarifa plana que cobramos al cliente.
export default function BluexTarifaCard({ comunaInicial = '', pesoInicial = 0.5 }) {
  const [comuna, setComuna] = useState(comunaInicial);
  const [peso, setPeso] = useState(pesoInicial);
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);

  const cotizar = async () => {
    if (!comuna.trim()) { setError('Escribe la comuna de destino.'); return; }
    setCargando(true); setError(null); setRes(null);
    try {
      const r = await base44.functions.invoke('bluexCotizarTarifa', {
        comuna: comuna.trim(),
        peso_kg: Number(peso) || 0.5,
      });
      const d = r?.data || {};
      if (!d.ok) {
        setError(
          d.error === 'comuna_no_encontrada' ? `BlueExpress no reconoce "${comuna}". Revisa el nombre de la comuna.`
          : d.error === 'pricing_no_disponible' ? 'BlueExpress no está devolviendo tarifas ahora (el módulo de pricing de la cuenta responde con error).'
          : d.error || 'No se pudo cotizar.'
        );
      } else {
        setRes(d);
      }
    } catch (e) {
      setError(e?.message || 'Falló la conexión con BlueExpress.');
    }
    setCargando(false);
  };

  const opciones = res ? [res.express, res.priority].filter(Boolean) : [];

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg-elevated)' }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'var(--ld-border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ld-action-soft)' }}>
          <Truck className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--ld-fg)' }}>Cotizar envío BlueExpress</p>
          <p className="text-[11px] leading-tight" style={{ color: 'var(--ld-fg-muted)' }}>Tarifa real del contrato PEYU · en vivo</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cotizar()}
            placeholder="Comuna de destino (ej. Temuco)"
            className="flex-1 min-w-0 h-11 px-3 rounded-xl text-sm border outline-none"
            style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg)', color: 'var(--ld-fg)' }}
          />
          <div className="flex items-center gap-2">
            <input
              type="number" step="0.1" min="0.1" max="60"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cotizar()}
              className="w-24 h-11 px-3 rounded-xl text-sm border outline-none"
              style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg)', color: 'var(--ld-fg)' }}
            />
            <span className="text-xs font-semibold" style={{ color: 'var(--ld-fg-muted)' }}>kg</span>
            <button
              onClick={cotizar}
              disabled={cargando}
              className="h-11 px-4 rounded-xl text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: 'var(--ld-action)' }}
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cotizar
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl p-3 text-xs font-semibold"
            style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {opciones.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ld-fg-muted)' }}>
              {res.distrito?.name}{res.distrito?.region ? ` · ${res.distrito.region}` : ''} · {res.peso_cotizado_kg} kg
            </p>
            {opciones.map((o) => {
              const margen = FLAT_SHIPPING_CLP - o.costo;
              return (
                <div key={o.servicio} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: 'var(--ld-border)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--ld-fg)' }}>BlueExpress {o.servicio}</p>
                    <p className="text-[11px]" style={{ color: 'var(--ld-fg-muted)' }}>
                      {o.fecha_estimada_entrega ? `Entrega estimada ${o.fecha_estimada_entrega}` : o.lead_time_dias ? `${o.lead_time_dias} días hábiles` : 'Plazo según destino'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ld-fg)' }}>{fmt(o.costo)}</p>
                    <p className="text-[10px] font-semibold" style={{ color: margen >= 0 ? 'var(--ld-action)' : 'var(--ld-highlight)' }}>
                      {margen >= 0 ? `+${fmt(margen)} vs tarifa plana` : `${fmt(Math.abs(margen))} bajo la tarifa plana`}
                    </p>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px]" style={{ color: 'var(--ld-fg-subtle)' }}>
              Al cliente le cobramos {fmt(FLAT_SHIPPING_CLP)} plano · gratis sobre {fmt(FREE_SHIPPING_THRESHOLD_CLP)} (solo B2C).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}