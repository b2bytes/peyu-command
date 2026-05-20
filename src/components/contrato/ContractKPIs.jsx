// ============================================================================
// ContractKPIs · KPIs ejecutivos del contrato vs entrega real
// ============================================================================
import { AlertTriangle, CheckCircle2, DollarSign, Calendar, Bot, Code2, ShoppingCart, Brain } from 'lucide-react';

const fmtCLP = n => '$' + (n || 0).toLocaleString('es-CL');

export default function ContractKPIs({ data }) {
  if (!data) return null;
  const c = data.cumplimiento_impulsia || {};
  const m = data.metricas_plataforma || {};

  const cards = [
    {
      label: 'Pagado a IMPULSIA',
      value: fmtCLP(c.pago_efectuado_clp),
      sub: `Factura N°${c.factura_n} · ${c.fecha_pago}`,
      icon: DollarSign,
      tone: 'amber',
    },
    {
      label: 'Días desde el pago',
      value: c.dias_desde_pago,
      sub: 'sin entrega de IMPULSIA',
      icon: Calendar,
      tone: 'rose',
    },
    {
      label: 'Agentes IA entregados',
      value: `${c.agentes_desplegados_por_peyu} / ${c.agentes_comprometidos_por_impulsia}`,
      sub: `${c.brecha_agentes} agentes faltantes vs contrato`,
      icon: Bot,
      tone: c.brecha_agentes > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Funciones backend',
      value: data.funciones_backend?.total || 0,
      sub: 'construidas por PEYU en Base44',
      icon: Code2,
      tone: 'teal',
    },
    {
      label: 'Pedidos B2C reales',
      value: m.pedidos_total || 0,
      sub: `${m.pedidos_pagados || 0} pagados · ${fmtCLP(m.total_vendido_clp)}`,
      icon: ShoppingCart,
      tone: 'cyan',
    },
    {
      label: 'Conversaciones IA',
      value: m.conversaciones_chat || 0,
      sub: `${m.ai_calls_total || 0} llamadas · ${(m.tokens_consumidos || 0).toLocaleString()} tokens`,
      icon: Brain,
      tone: 'violet',
    },
  ];

  const TONE = {
    amber: 'from-amber-500/15 to-amber-500/5 border-amber-400/20 text-amber-200',
    rose: 'from-rose-500/15 to-rose-500/5 border-rose-400/20 text-rose-200',
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-400/20 text-emerald-200',
    teal: 'from-teal-500/15 to-teal-500/5 border-teal-400/20 text-teal-200',
    cyan: 'from-cyan-500/15 to-cyan-500/5 border-cyan-400/20 text-cyan-200',
    violet: 'from-violet-500/15 to-violet-500/5 border-violet-400/20 text-violet-200',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`bg-gradient-to-br border rounded-2xl p-4 ${TONE[c.tone]}`}>
            <Icon className="w-4 h-4 opacity-80 mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">{c.label}</p>
            <p className="font-jakarta font-extrabold text-2xl tracking-tight leading-none mb-1">{c.value}</p>
            <p className="text-[11px] opacity-60 leading-tight">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}