import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Filter, ArrowRight } from 'lucide-react';
import CheckoutFunnelStep from './CheckoutFunnelStep';

/**
 * Embudo real del checkout B2C (últimos 30 días).
 * Fuentes de verdad:
 *  1) CarritoAbandonado → el cliente llegó al checkout y dejó su email.
 *  2) PedidoWeb         → completó el formulario y creó el pedido.
 *  3) payment_status    → el pago quedó confirmado.
 * Así se ve exactamente en qué paso se pierde la venta.
 */
const DIAS = 30;

export default function CheckoutFunnelPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const desde = new Date(Date.now() - DIAS * 86400000).toISOString();
    Promise.all([
      base44.entities.CarritoAbandonado.filter({ created_date: { $gte: desde } }, '-created_date', 500),
      base44.entities.PedidoWeb.filter({ created_date: { $gte: desde } }, '-created_date', 500),
    ])
      .then(([carritos, pedidos]) => {
        const pagados = pedidos.filter((p) => p.payment_status === 'paid');
        const esperando = pedidos.filter((p) =>
          ['pending_mp', 'pending_webpay', 'pending_transfer'].includes(p.payment_status)
        );
        const fallidos = pedidos.filter((p) => ['expired', 'failed'].includes(p.payment_status));
        setData({
          checkout: carritos.length,
          pedidos: pedidos.length,
          pagados: pagados.length,
          esperando: esperando.length,
          fallidos: fallidos.length,
          ingresos: pagados.reduce((s, p) => s + (p.total || 0), 0),
        });
      })
      .catch(() => setData({ error: true }));
  }, []);

  const conversion = data && data.checkout > 0 ? Math.round((data.pagados / data.checkout) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-poppins font-black text-white tracking-wide leading-none">EMBUDO DE CHECKOUT</h3>
            <p className="text-[10px] text-violet-300/50 mt-0.5">Últimos {DIAS} días · dónde se cae la venta</p>
          </div>
        </div>
        <span className="font-mono font-black text-emerald-300 text-lg leading-none">{conversion}%</span>
      </div>

      {!data && <div className="h-24 rounded-xl bg-white/5 animate-pulse" />}

      {data?.error && <p className="text-[11px] text-rose-300">No pudimos cargar el embudo ahora.</p>}

      {data && !data.error && (
        <>
          <div className="space-y-3.5">
            <CheckoutFunnelStep
              label="Llegaron al checkout"
              hint="Dejaron sus datos de contacto"
              valor={data.checkout}
              base={data.checkout}
              color="linear-gradient(90deg,#8b5cf6,#6366f1)"
            />
            <CheckoutFunnelStep
              label="Crearon el pedido"
              hint="Completaron envío y eligieron pago"
              valor={data.pedidos}
              base={data.checkout}
              previo={data.checkout}
              color="linear-gradient(90deg,#6366f1,#06b6d4)"
            />
            <CheckoutFunnelStep
              label="Pagaron"
              hint="Pago confirmado"
              valor={data.pagados}
              base={data.checkout}
              previo={data.pedidos}
              color="linear-gradient(90deg,#10b981,#34d399)"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
            {[
              { label: 'Esperando pago', valor: data.esperando, tono: 'text-amber-300' },
              { label: 'Pago fallido', valor: data.fallidos, tono: 'text-rose-300' },
              { label: 'Ingresos', valor: `$${(data.ingresos / 1000).toFixed(0)}k`, tono: 'text-emerald-300' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl bg-white/5 p-2 text-center">
                <p className={`font-mono font-black text-sm leading-none ${k.tono}`}>{k.valor}</p>
                <p className="text-[9px] text-violet-300/50 mt-1 leading-tight">{k.label}</p>
              </div>
            ))}
          </div>

          <Link
            to="/admin/pipeline-b2c"
            className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-violet-300/70 hover:text-violet-200 transition"
          >
            Ver carritos abandonados y recuperar <ArrowRight className="w-3 h-3" />
          </Link>
        </>
      )}
    </div>
  );
}