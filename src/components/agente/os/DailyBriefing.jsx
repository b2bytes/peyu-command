// ============================================================================
// PEYU OS · Briefing del día
// ─────────────────────────────────────────────────────────────────────────────
// Resumen inteligente que se muestra en la pantalla de bienvenida del chat.
// Reutiliza peyuBrainOps (métricas en vivo) para mostrar lo más importante de
// hoy: ventas, pipeline, conversaciones, logística + alertas accionables.
// Cada métrica clave es clickeable y dispara una pregunta al agente.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ShoppingBag, Target, MessageCircle, Truck, AlertTriangle, FileText } from 'lucide-react';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '$0');

function StatTile({ icon: Icon, label, value, sub, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl bg-white border border-[#ece4d8] p-3.5 hover:border-[#0F8B6C]/40 hover:shadow-sm transition group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-7 h-7 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-[11px] font-medium text-[#6f7d77] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-poppins font-bold text-[#22302c] leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#9aa6a0] mt-1">{sub}</p>}
    </button>
  );
}

export default function DailyBriefing({ onAsk }) {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('peyuBrainOps', { query: 'resumen del día' });
        if (alive) setM(res?.data?.metrics || null);
      } catch (_) { /* silencioso: la bienvenida sigue funcionando sin briefing */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-[#9aa6a0] py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Preparando el resumen del día…</span>
      </div>
    );
  }

  if (!m) return null;

  const alertas = [];
  if (m.consultas_sin_responder > 0) alertas.push(`${m.consultas_sin_responder} consultas sin responder`);
  if (m.envios_con_excepcion > 0) alertas.push(`${m.envios_con_excepcion} envíos con problema`);
  if (m.stock_bajo > 0) alertas.push(`${m.stock_bajo} SKUs con stock bajo`);
  if (m.propuestas_pendientes > 0) alertas.push(`${m.propuestas_pendientes} propuestas esperando respuesta`);

  return (
    <div className="w-full max-w-lg mx-auto mt-6 space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile
          icon={ShoppingBag} label="Ventas hoy" value={m.pedidos_hoy}
          sub={fmtCLP(m.ingresos_hoy)} accent="bg-[#0F8B6C]/10 text-[#0F8B6C]"
          onClick={() => onAsk('¿Cómo van los pedidos de hoy?')}
        />
        <StatTile
          icon={Target} label="Leads B2B" value={m.leads_hoy}
          sub={`${m.leads_calientes} calientes`} accent="bg-[#D96B4D]/10 text-[#D96B4D]"
          onClick={() => onAsk('Muéstrame los leads B2B')}
        />
        <StatTile
          icon={MessageCircle} label="Conversaciones" value={m.conversaciones_hoy}
          sub={`${m.consultas_hoy} consultas`} accent="bg-[#0F8B6C]/10 text-[#0F8B6C]"
          onClick={() => onAsk('¿Cuántas conversaciones hubo hoy?')}
        />
        <StatTile
          icon={Truck} label="Envíos" value={m.envios_en_transito}
          sub={`${m.envios_entregados_hoy} entregados hoy`} accent="bg-[#D96B4D]/10 text-[#D96B4D]"
          onClick={() => onAsk('Estado de los envíos')}
        />
      </div>

      {alertas.length > 0 && (
        <button
          onClick={() => onAsk('¿Qué necesita mi atención hoy?')}
          className="w-full text-left rounded-2xl bg-[#fbe9e1] border border-[#f0c9bd] p-3.5 hover:border-[#D96B4D]/50 transition"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-[#D96B4D]" />
            <span className="text-xs font-semibold text-[#a8492f] uppercase tracking-wide">Requiere atención</span>
          </div>
          <p className="text-sm text-[#7a3a26] leading-relaxed">{alertas.join(' · ')}</p>
        </button>
      )}
    </div>
  );
}