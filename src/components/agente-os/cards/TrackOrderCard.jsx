import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Search, Loader2, AlertCircle, CheckCircle2, Truck, ExternalLink } from 'lucide-react';
import { fmtRelativo, fmtFechaHora } from '@/lib/fecha-relativa';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ESTADO_TONE = {
  'Entregado': 'var(--ld-action)',
  'No Entregado': 'var(--ld-highlight)',
  'Excepción': 'var(--ld-highlight)',
  'Devuelto': 'var(--ld-highlight)',
};

// Rastreo de UN pedido puntual en la conversación: "¿dónde va el pedido de Matías?"
// Busca el pedido, consulta BlueExpress en vivo y muestra el recorrido real.
export default function TrackOrderCard({ pedidos = [], queryInicial = '' }) {
  const [q, setQ] = useState(queryInicial);
  const [cargando, setCargando] = useState(false);
  const [envio, setEnvio] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);

  const candidatos = q.trim().length >= 2
    ? pedidos.filter((p) => {
        const t = norm(q);
        return norm(p.cliente_nombre).includes(t)
          || norm(p.numero_pedido).includes(t)
          || norm(p.tracking).includes(t);
      }).slice(0, 5)
    : [];

  const rastrear = async (p) => {
    setError(null); setEnvio(null); setPedido(p); setCargando(true);
    try {
      const ot = String(p.tracking || '').trim();
      if (!ot) {
        setError('Este pedido todavía no tiene etiqueta BlueExpress emitida.');
      } else {
        await base44.functions.invoke('bluexTrackShipment', { tracking_number: ot }).catch(() => null);
        const envios = await base44.entities.Envio.filter({ tracking_number: ot }, undefined, 1);
        if (!envios?.length) setError(`No hay envío registrado con la OT ${ot}.`);
        else setEnvio(envios[0]);
      }
    } catch (e) {
      setError(e?.message || 'No se pudo consultar BlueExpress.');
    }
    setCargando(false);
  };

  const eventos = (envio?.eventos || []).slice(0, 6);
  const tone = ESTADO_TONE[envio?.estado] || 'var(--ld-fg)';

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg-elevated)' }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'var(--ld-border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ld-action-soft)' }}>
          <MapPin className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--ld-fg)' }}>Rastrear un pedido</p>
          <p className="text-[11px] leading-tight" style={{ color: 'var(--ld-fg-muted)' }}>Cliente, N° de pedido u OT · BlueExpress en vivo</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ld-fg-subtle)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. Matías, WEB-1786… u OT"
            className="w-full h-11 pl-9 pr-3 rounded-xl text-sm border outline-none"
            style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg)', color: 'var(--ld-fg)' }}
          />
        </div>

        {!pedido && candidatos.map((p) => (
          <button key={p.id} onClick={() => rastrear(p)}
            className="w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left hover:opacity-80"
            style={{ borderColor: 'var(--ld-border)' }}>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--ld-fg)' }}>{p.cliente_nombre || 'Cliente'}</p>
              <p className="text-[10.5px] font-mono" style={{ color: 'var(--ld-fg-muted)' }}>
                {p.numero_pedido} · {p.tracking ? `OT ${p.tracking}` : 'sin etiqueta'}
              </p>
            </div>
            <Truck className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ld-action)' }} />
          </button>
        ))}

        {q.trim().length >= 2 && !candidatos.length && !pedido && (
          <p className="text-xs" style={{ color: 'var(--ld-fg-muted)' }}>Ningún pedido calza con “{q}”.</p>
        )}

        {cargando && (
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--ld-fg-muted)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Consultando BlueExpress…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl p-3 text-xs font-semibold"
            style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {envio && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--ld-bg-soft)' }}>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: tone }}>{envio.estado}</p>
                <p className="text-[10.5px]" style={{ color: 'var(--ld-fg-muted)' }}>
                  {pedido?.cliente_nombre} · {envio.comuna_destino || pedido?.ciudad || 'destino'}
                  {envio.dias_en_transito ? ` · ${envio.dias_en_transito} d en tránsito` : ''}
                  {envio.atrasado ? ' · atrasado' : ''}
                </p>
              </div>
              <a href={`https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`} target="_blank" rel="noreferrer"
                className="text-[10.5px] font-bold flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--ld-action)' }}>
                OT <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {eventos.length ? (
              <div className="space-y-1.5">
                {eventos.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: i === 0 ? 'var(--ld-action)' : 'var(--ld-border-strong)' }} />
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-semibold leading-tight" style={{ color: 'var(--ld-fg)' }}>
                        {ev.descripcion || ev.estado}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--ld-fg-muted)' }} title={fmtFechaHora(ev.at) || ''}>
                        {fmtRelativo(ev.at)}{ev.ubicacion ? ` · ${ev.ubicacion}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ld-fg-muted)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> OT emitida, BlueExpress aún no registra eventos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}