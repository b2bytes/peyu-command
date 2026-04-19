import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, FileText, Package, TrendingUp, MessageSquare, Zap, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const ETAPAS = [
  { key: 'leads_total', label: 'Leads Totales', icon: Users, color: 'bg-blue-500', desc: 'Contactos que llegan por web, WhatsApp, formulario B2B o agente IA' },
  { key: 'leads_contactados', label: 'Contactados', icon: MessageSquare, color: 'bg-indigo-500', desc: 'Se les respondió dentro de las 2 hrs hábiles (SLA)' },
  { key: 'cotizados', label: 'Cotizados', icon: FileText, color: 'bg-amber-500', desc: 'Recibieron propuesta o cotización formal con precios y lead time' },
  { key: 'negociacion', label: 'En Negociación', icon: Zap, color: 'bg-orange-500', desc: 'Están evaluando la propuesta, se enviaron muestras o hay seguimiento activo' },
  { key: 'ganados', label: 'Cerrados (Ganados)', icon: CheckCircle2, color: 'bg-emerald-500', desc: 'Anticipo del 50% pagado, se crea Orden de Producción' },
];

function FunnelBar({ stage, count, maxCount, tasa, link }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const Icon = stage.icon;
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${stage.color} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-poppins font-bold text-white text-sm">{stage.label}</p>
            <p className="text-xs text-white/60">{stage.desc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black font-poppins text-white">{count}</p>
          {tasa !== undefined && (
            <p className="text-xs text-teal-300">Conv: {tasa}%</p>
          )}
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${stage.color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {link && (
        <Link to={link} className="mt-3 flex items-center gap-1 text-xs text-teal-300 hover:text-teal-200 transition-colors">
          Ver detalle <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function EmbudoVentas() {
  const [leads, setLeads] = useState([]);
  const [b2bLeads, setB2bLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 200),
      base44.entities.B2BLead.list('-created_date', 200),
      base44.entities.Cotizacion.list('-created_date', 200),
      base44.entities.OrdenProduccion.list('-created_date', 200),
      base44.entities.CorporateProposal.list('-created_date', 200),
    ]).then(([l, bl, c, o, p]) => {
      setLeads(l); setB2bLeads(bl); setCotizaciones(c); setOrdenes(o); setProposals(p);
      setLoading(false);
    });
  }, []);

  // ---- EMBUDO B2B CLÁSICO (leads del equipo de ventas) ----
  const totalLeadsB2B = leads.length + b2bLeads.length;
  const contactados = leads.filter(l => !['Nuevo'].includes(l.estado)).length + b2bLeads.filter(l => l.status !== 'Nuevo').length;
  const cotizados = cotizaciones.length + proposals.length;
  const negociacion = leads.filter(l => l.estado === 'Negociación').length + proposals.filter(p => p.status === 'Enviada').length;
  const ganados = leads.filter(l => l.estado === 'Ganado').length + proposals.filter(p => p.status === 'Aceptada').length;

  const tasa1 = totalLeadsB2B > 0 ? ((contactados / totalLeadsB2B) * 100).toFixed(0) : 0;
  const tasa2 = contactados > 0 ? ((cotizados / contactados) * 100).toFixed(0) : 0;
  const tasa3 = cotizados > 0 ? ((negociacion / cotizados) * 100).toFixed(0) : 0;
  const tasa4 = negociacion > 0 ? ((ganados / negociacion) * 100).toFixed(0) : 0;
  const tasaTotal = totalLeadsB2B > 0 ? ((ganados / totalLeadsB2B) * 100).toFixed(1) : 0;

  const funnelData = [
    { ...ETAPAS[0], count: totalLeadsB2B, link: '/admin/pipeline' },
    { ...ETAPAS[1], count: contactados, tasa: tasa1, link: '/admin/pipeline' },
    { ...ETAPAS[2], count: cotizados, tasa: tasa2, link: '/admin/propuestas' },
    { ...ETAPAS[3], count: negociacion, tasa: tasa3, link: '/admin/propuestas' },
    { ...ETAPAS[4], count: ganados, tasa: tasa4, link: '/admin/operaciones' },
  ];

  // ---- SLA Alerts ----
  const slaVencidos = leads.filter(l => {
    if (['Ganado','Perdido'].includes(l.estado)) return false;
    const sla = { Nuevo: 1, Contactado: 2, Cotizado: 3, 'Muestra Enviada': 5, 'Negociación': 7 }[l.estado];
    if (!sla) return false;
    const dias = Math.floor((Date.now() - new Date(l.updated_date || l.created_date).getTime()) / 86400000);
    return dias > sla;
  });

  const leadsCalientes = b2bLeads.filter(l => (l.lead_score || 0) >= 70 && l.status === 'Nuevo');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-poppins font-black text-white">Embudo de Conversión</h1>
        <p className="text-teal-300/70 text-sm mt-1">Visibilidad completa del pipeline B2B — desde lead hasta orden de producción</p>
      </div>

      {/* Alertas activas */}
      {(slaVencidos.length > 0 || leadsCalientes.length > 0) && (
        <div className="space-y-2">
          {slaVencidos.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 text-red-200 border border-red-500/40 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {slaVencidos.length} leads con SLA vencido — {slaVencidos.map(l => l.empresa).join(', ')}
            </div>
          )}
          {leadsCalientes.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 text-sm font-medium">
              <Zap className="w-4 h-4 shrink-0" />
              {leadsCalientes.length} leads web calientes (score ≥70) sin contacto → <Link to="/admin/propuestas" className="underline ml-1">Gestionar ahora</Link>
            </div>
          )}
        </div>
      )}

      {/* Tasa de conversión global */}
      <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-teal-400/30 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-teal-300/80 font-medium uppercase tracking-wide">Tasa de Conversión Global</p>
            <p className="text-5xl font-black font-poppins text-white mt-1">{tasaTotal}%</p>
            <p className="text-sm text-white/60 mt-1">Lead → Venta cerrada · Meta: 7%</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black font-poppins ${parseFloat(tasaTotal) >= 7 ? 'text-emerald-400' : parseFloat(tasaTotal) >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
              {parseFloat(tasaTotal) >= 7 ? '✓ En meta' : parseFloat(tasaTotal) >= 4 ? '⚠ Cerca' : '✗ Bajo meta'}
            </div>
            <p className="text-xs text-white/50 mt-1">{ganados} ventas de {totalLeadsB2B} leads</p>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${parseFloat(tasaTotal) >= 7 ? 'bg-emerald-400' : parseFloat(tasaTotal) >= 4 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${Math.min(100, parseFloat(tasaTotal) * 10)}%` }}
          />
        </div>
      </div>

      {/* Embudo */}
      <div>
        <h2 className="text-lg font-poppins font-semibold text-white mb-3">Etapas del Embudo</h2>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-white/50">Cargando datos...</div>
          ) : (
            funnelData.map((stage, i) => (
              <FunnelBar
                key={i}
                stage={stage}
                count={stage.count}
                maxCount={totalLeadsB2B}
                tasa={stage.tasa}
                link={stage.link}
              />
            ))
          )}
        </div>
      </div>

      {/* Tabla de acciones por etapa */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
        <h2 className="font-poppins font-bold text-white mb-4">Protocolo de Atención por Etapa</h2>
        <div className="space-y-3">
          {[
            { etapa: 'Lead Nuevo (web/WhatsApp)', sla: '< 2 hrs hábiles', accion: 'Responder por WhatsApp + score automático. Si score ≥70: propuesta IA en 24hrs', link: '/admin/propuestas' },
            { etapa: 'Lead Contactado', sla: '< 48 hrs', accion: 'Enviar catálogo + preguntar fecha y cantidad exacta. Si >100u: mockup gratis', link: '/admin/pipeline' },
            { etapa: 'Cotizado / Propuesta enviada', sla: '< 72 hrs', accion: 'Follow-up por WhatsApp. Ofrecer muestra física si el pedido es >200u', link: '/admin/propuestas' },
            { etapa: 'En Negociación', sla: '< 7 días', accion: 'Cierre: pedir anticipo 50%, confirmar datos factura, crear Orden de Producción', link: '/admin/operaciones' },
            { etapa: 'Ganado / OP creada', sla: 'Según lead time', accion: 'Confirmación por email + fecha de entrega + seguimiento de producción', link: '/admin/operaciones' },
          ].map((row, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{row.etapa}</p>
                <p className="text-xs text-white/60 mt-0.5">{row.accion}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/20 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />{row.sla}
                </div>
                <Link to={row.link} className="mt-1 text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1 justify-end">
                  Ir <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lógica del agente IA */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
        <h2 className="font-poppins font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-lg">🐢</span> Agente Peyu — Cómo funciona
        </h2>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          {[
            { paso: '1. Captura la necesidad', desc: 'Pregunta por ocasión, cantidad y si es para empresa o personal' },
            { paso: '2. Consulta el catálogo', desc: 'Busca en tiempo real en la entidad Producto los artículos activos disponibles' },
            { paso: '3. Calcula precio', desc: 'Aplica la tabla de precios por volumen (B2C, 50-199u, 200-499u, 500+u)' },
            { paso: '4. Captura datos', desc: 'Si el cliente quiere cotización formal, crea un B2BLead automáticamente' },
            { paso: '5. Deriva al equipo', desc: 'Para B2B: indica que ejecutivo contactará en <2 hrs. Para B2C: lleva a /shop' },
            { paso: '6. WhatsApp fallback', desc: 'Siempre ofrece el número +56 9 3376 6573 para atención urgente' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/30 border border-teal-400/40 flex items-center justify-center text-teal-300 text-xs font-bold shrink-0">{i + 1}</div>
              <div>
                <p className="text-sm font-semibold text-white">{item.paso}</p>
                <p className="text-xs text-white/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30">
          <p className="text-xs text-amber-200 font-medium">⚠ Si el agente no responde: Verifica que el agente "asistente_compras" esté activo en el panel de agentes. El agente necesita productos en la base de datos para hacer recomendaciones correctas.</p>
        </div>
      </div>
    </div>
  );
}