import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Mail, Package, Wallet, Sparkles, AlertCircle } from 'lucide-react';

const fmt = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');

// ════════════════════════════════════════════════════════════════════════
// WhatsAppClienteFicha — Ficha de cliente PRO dentro del contexto del chat.
// Usa el mismo reconocimiento que el agente (whatsappBuscarCliente): compras,
// gasto total, productos favoritos, link de pago pendiente y últimos pedidos.
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppClienteFicha({ telefono }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!telefono) { setData(null); return; }
    setLoading(true);
    base44.functions.invoke('whatsappBuscarCliente', { telefono })
      .then((r) => setData(r?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [telefono]);

  if (!telefono) return null;

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5 flex items-center gap-2 text-[11px] text-white/40">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando ficha del cliente…
      </div>
    );
  }
  if (!data) return null;

  if (data.es_nuevo) {
    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5">
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Ficha del cliente</p>
        <p className="text-xs text-white/60 leading-relaxed">Cliente nuevo — sin compras previas registradas.</p>
      </div>
    );
  }

  const pref = data.preferencias || {};
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5 space-y-3">
      <p className="text-[9px] text-white/30 uppercase tracking-wider">Ficha del cliente</p>

      {data.email && (
        <p className="flex items-center gap-1.5 text-[11px] text-white/55 truncate">
          <Mail className="w-3 h-3 flex-shrink-0" /> {data.email}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-base font-bold text-white leading-none flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-white/40" />{data.total_pedidos || 0}
          </p>
          <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wide">pedidos</p>
        </div>
        <div>
          <p className="text-base font-bold text-white leading-none flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-white/40" />{fmt(data.total_gastado_clp)}
          </p>
          <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wide">gastado</p>
        </div>
      </div>

      {data.link_pago_pendiente && (
        <div className="rounded-xl p-2.5 flex gap-2" style={{ background: 'rgba(249,115,22,.12)', border: '1px solid rgba(249,115,22,.28)' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FB923C' }} />
          <p className="text-[10px] leading-snug" style={{ color: '#FDBA74' }}>
            Link de pago pendiente · {data.link_pago_pendiente.numero} · {fmt(data.link_pago_pendiente.total)}
          </p>
        </div>
      )}

      {(pref.productos_frecuentes?.length > 0 || pref.colores_preferidos?.length > 0) && (
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Preferencias
          </p>
          <div className="flex flex-wrap gap-1">
            {(pref.productos_frecuentes || []).map((p) => (
              <span key={p.sku} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60">{p.sku} ×{p.veces}</span>
            ))}
            {(pref.colores_preferidos || []).map((c) => (
              <span key={c.color} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">{c.color}</span>
            ))}
          </div>
        </div>
      )}

      {data.historial_reciente?.length > 0 && (
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Últimos pedidos</p>
          <ul className="space-y-1.5">
            {data.historial_reciente.map((p) => (
              <li key={p.numero} className="text-[10px] leading-snug">
                <span className="font-bold text-white/80">{p.numero}</span>
                <span className="text-white/40"> · {fmt(p.total)} · {p.estado}</span>
                {p.items && <p className="text-white/35 truncate">{p.items}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}