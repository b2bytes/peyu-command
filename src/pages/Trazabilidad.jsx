import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, AlertTriangle, Factory, Package, Truck } from "lucide-react";

const estadoLeadColor = {
  Nuevo: "bg-blue-100 text-blue-700", Contactado: "bg-purple-100 text-purple-700",
  Cotizado: "bg-amber-100 text-amber-700", "Muestra Enviada": "bg-orange-100 text-orange-700",
  Negociación: "bg-indigo-100 text-indigo-700", Ganado: "bg-green-100 text-green-700",
  Perdido: "bg-red-100 text-red-700",
};

const estadoOPColor = {
  "Pendiente": "bg-gray-100 text-gray-600", "En Cola": "bg-blue-100 text-blue-700",
  "En Producción": "bg-amber-100 text-amber-700", "Control Calidad": "bg-purple-100 text-purple-700",
  "Personalización Láser": "bg-indigo-100 text-indigo-700", "Packaging": "bg-orange-100 text-orange-700",
  "Listo para Despacho": "bg-green-100 text-green-700", "Despachado": "bg-emerald-100 text-emerald-700",
};

const ETAPAS = [
  { key: 'lead', label: 'Lead', icon: '🎯', color: '#4B4F54' },
  { key: 'cotizacion', label: 'Cotización', icon: '📋', color: '#0F8B6C' },
  { key: 'orden', label: 'Producción', icon: '🏭', color: '#D96B4D' },
  { key: 'despacho', label: 'Despacho', icon: '🚚', color: '#0F8B6C' },
];

function TraceRow({ lead, cots, ordenes }) {
  const cotRel = cots.filter(c => c.empresa?.toLowerCase() === lead.empresa?.toLowerCase());
  const opRel = ordenes.filter(o => o.empresa?.toLowerCase() === lead.empresa?.toLowerCase());
  const despachadas = opRel.filter(o => o.estado === 'Despachado');
  const enTransito = opRel.filter(o => o.estado === 'Listo para Despacho');
  const enProd = opRel.filter(o => !['Despachado', 'Listo para Despacho'].includes(o.estado));
  const cotAceptada = cotRel.find(c => c.estado === 'Aceptada');
  const totalCot = cotRel.reduce((s, c) => s + (c.total || 0), 0);

  const etapaActual = lead.estado === 'Ganado' && despachadas.length > 0 ? 3
    : lead.estado === 'Ganado' && opRel.length > 0 ? 2
    : cotAceptada ? 2
    : cotRel.length > 0 ? 1 : 0;

  const isCompleto = despachadas.length > 0 && lead.estado === 'Ganado';

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm ${isCompleto ? 'border-green-200' : 'border-border'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-poppins font-semibold text-foreground">{lead.empresa}</p>
            {isCompleto && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{lead.contacto} · {lead.canal}</p>
        </div>
        <div className="text-right">
          {totalCot > 0 && <p className="font-poppins font-bold text-sm" style={{ color: '#0F8B6C' }}>${totalCot.toLocaleString('es-CL')} CLP</p>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoLeadColor[lead.estado] || 'bg-gray-100 text-gray-600'}`}>{lead.estado}</span>
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="flex items-center gap-1 mb-4">
        {ETAPAS.map((etapa, i) => {
          const activa = i <= etapaActual;
          return (
            <div key={etapa.key} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activa ? 'text-white' : 'bg-muted text-muted-foreground'
              }`} style={activa ? { background: etapa.color } : {}}>
                <span>{etapa.icon}</span>
                <span className="hidden sm:inline">{etapa.label}</span>
              </div>
              {i < ETAPAS.length - 1 && (
                <ArrowRight className={`w-3 h-3 flex-shrink-0 ${i < etapaActual ? 'text-green-500' : 'text-muted-foreground/40'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Detail rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Cotizaciones */}
        <div className="space-y-1">
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Cotizaciones ({cotRel.length})</p>
          {cotRel.length === 0 ? (
            <p className="text-muted-foreground italic">Sin cotizaciones</p>
          ) : cotRel.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-2 py-1">
              <span className="truncate">{c.sku} · {(c.cantidad||0).toLocaleString()}u</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-1 flex-shrink-0 ${
                c.estado === 'Aceptada' ? 'bg-green-100 text-green-700' :
                c.estado === 'Enviada' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>{c.estado}</span>
            </div>
          ))}
        </div>

        {/* Órdenes de Producción */}
        <div className="space-y-1">
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Producción ({opRel.length})</p>
          {opRel.length === 0 ? (
            <p className="text-muted-foreground italic">Sin órdenes de producción</p>
          ) : opRel.map(op => (
            <div key={op.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-2 py-1">
              <span className="truncate">{op.sku} · {(op.cantidad||0).toLocaleString()}u</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-1 flex-shrink-0 ${estadoOPColor[op.estado] || 'bg-gray-100 text-gray-600'}`}>{op.estado}</span>
            </div>
          ))}
        </div>

        {/* Despacho */}
        <div className="space-y-1">
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Despacho</p>
          {despachadas.length > 0 ? (
            despachadas.map(op => (
              <div key={op.id} className="flex items-center gap-1.5 bg-green-50 rounded-lg px-2 py-1">
                <Truck className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-medium">{op.tracking_envio || 'Sin tracking'}</span>
              </div>
            ))
          ) : enTransito.length > 0 ? (
            <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2 py-1">
              <Package className="w-3 h-3 text-amber-600" />
              <span className="text-amber-700">Listo para despacho</span>
            </div>
          ) : (
            <p className="text-muted-foreground italic">Pendiente</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Trazabilidad() {
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('activos');

  const loadData = async () => {
    setLoading(true);
    const [l, c, o] = await Promise.all([
      base44.entities.Lead.list('-created_date', 200),
      base44.entities.Cotizacion.list('-created_date', 200),
      base44.entities.OrdenProduccion.list('-created_date', 200),
    ]);
    setLeads(l);
    setCotizaciones(c);
    setOrdenes(o);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredLeads = leads.filter(l => {
    if (filtro === 'activos') return !['Perdido'].includes(l.estado);
    if (filtro === 'ganados') return l.estado === 'Ganado';
    if (filtro === 'perdidos') return l.estado === 'Perdido';
    return true;
  });

  // Stats
  const totalLeads = leads.length;
  const ganados = leads.filter(l => l.estado === 'Ganado').length;
  const conOP = leads.filter(l => ordenes.some(o => o.empresa?.toLowerCase() === l.empresa?.toLowerCase())).length;
  const despachados = leads.filter(l => ordenes.some(o => o.empresa?.toLowerCase() === l.empresa?.toLowerCase() && o.estado === 'Despachado')).length;
  const trazabilidadCompleta = totalLeads > 0 ? Math.round(despachados / Math.max(ganados, 1) * 100) : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Trazabilidad Operacional</h1>
          <p className="text-muted-foreground text-sm mt-1">Cadena completa: Lead → Cotización → Producción → Despacho</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pipeline" className="text-xs font-medium px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
            → Pipeline B2B
          </Link>
          <Link to="/operaciones" className="text-xs font-medium px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
            → Operaciones
          </Link>
        </div>
      </div>

      {/* KPIs de trazabilidad */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Leads Totales', value: totalLeads, color: '#4B4F54', bg: '#f5f5f5' },
          { label: 'Leads Ganados', value: ganados, color: '#0F8B6C', bg: '#f0faf7' },
          { label: 'Con Orden de Prod.', value: conOP, color: '#0F8B6C', bg: '#f0faf7' },
          { label: 'Despachados', value: despachados, color: despachados > 0 ? '#0F8B6C' : '#4B4F54', bg: despachados > 0 ? '#f0faf7' : '#f5f5f5' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-poppins font-bold text-2xl mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel visual */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-poppins font-semibold text-sm mb-4">Funnel Operacional</h3>
        <div className="flex items-end gap-2 h-24">
          {[
            { label: 'Leads', value: totalLeads, color: '#4B4F54' },
            { label: 'Ganados', value: ganados, color: '#0F8B6C' },
            { label: 'En Prod.', value: conOP, color: '#D96B4D' },
            { label: 'Despachados', value: despachados, color: '#0F8B6C' },
          ].map((s, i) => {
            const pct = totalLeads > 0 ? Math.max(8, Math.round(s.value / totalLeads * 100)) : 8;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-bold font-poppins" style={{ color: s.color }}>{s.value}</p>
                <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}%`, background: s.color, minHeight: 8 }} />
                <p className="text-xs text-muted-foreground text-center leading-tight">{s.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Tasa lead→despacho: <span className="font-semibold text-foreground">{totalLeads > 0 ? Math.round(despachados / totalLeads * 100) : 0}%</span></span>
          <span>Conversión lead→ganado: <span className="font-semibold text-foreground">{totalLeads > 0 ? Math.round(ganados / totalLeads * 100) : 0}%</span></span>
          <span>Ganado→despacho: <span className="font-semibold text-foreground">{trazabilidadCompleta}%</span></span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'activos', label: 'Activos' },
          { key: 'ganados', label: 'Ganados' },
          { key: 'todos', label: 'Todos' },
          { key: 'perdidos', label: 'Perdidos' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${filtro === f.key ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            style={filtro === f.key ? { background: '#0F8B6C' } : {}}>
            {f.label}
          </button>
        ))}
        <span className="text-sm text-muted-foreground self-center ml-2">{filteredLeads.length} registros</span>
      </div>

      {/* Trace rows */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando trazabilidad...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay registros para este filtro.</p>
          <Link to="/pipeline" className="mt-3 inline-block text-sm font-medium" style={{ color: '#0F8B6C' }}>Ir al Pipeline B2B →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <TraceRow key={lead.id} lead={lead} cots={cotizaciones} ordenes={ordenes} />
          ))}
        </div>
      )}
    </div>
  );
}