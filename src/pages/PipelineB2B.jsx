import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Plus, Search, Edit2, Trash2, MessageSquare, FileText, Users, Clock,
  AlertTriangle, TrendingUp, DollarSign, Zap, Loader2, Sparkles,
  Phone, Mail, Package, ChevronRight, Flame, Thermometer, Snowflake,
  CheckCircle2, XCircle, BarChart3, RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

function getDiasEnEtapa(lead) {
  const ref = lead.updated_date || lead.created_date;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
}

const SLA_LIMITS = { Nuevo: 1, Contactado: 2, Cotizado: 3, 'Muestra Enviada': 5, 'Negociación': 7 };
const ESTADOS_LEAD = ["Nuevo", "Contactado", "Cotizado", "Muestra Enviada", "Negociación", "Ganado", "Perdido"];
const ESTADOS_COT = ["Borrador", "Enviada", "Aceptada", "Rechazada", "Vencida"];

const estadoBadge = {
  Nuevo:            "bg-blue-100 text-blue-800 border-blue-200",
  Contactado:       "bg-purple-100 text-purple-800 border-purple-200",
  Cotizado:         "bg-amber-100 text-amber-800 border-amber-200",
  "Muestra Enviada":"bg-orange-100 text-orange-800 border-orange-200",
  Negociación:      "bg-indigo-100 text-indigo-800 border-indigo-200",
  Ganado:           "bg-emerald-100 text-emerald-800 border-emerald-200",
  Perdido:          "bg-red-100 text-red-800 border-red-200",
  Borrador:         "bg-gray-100 text-gray-700 border-gray-200",
  Enviada:          "bg-blue-100 text-blue-800 border-blue-200",
  Aceptada:         "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rechazada:        "bg-red-100 text-red-800 border-red-200",
  Vencida:          "bg-gray-100 text-gray-600 border-gray-200",
};

const calidadConfig = {
  Caliente:       { cls: "bg-red-100 text-red-800 border-red-200",     icon: Flame },
  Tibio:          { cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Thermometer },
  Frío:           { cls: "bg-sky-100 text-sky-800 border-sky-200",      icon: Snowflake },
  "No Comercial": { cls: "bg-gray-100 text-gray-600 border-gray-200",   icon: XCircle },
};

function ScoreBar({ score }) {
  if (!score) return null;
  const color = score >= 70 ? '#0F8B6C' : score >= 40 ? '#D97706' : '#64748B';
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-gray-500 font-medium">Score</span>
        <span className="text-[10px] font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function LeadCard({ lead, onEdit, onDelete, onAutoCotizar, generating }) {
  const dias = getDiasEnEtapa(lead);
  const slaLimit = SLA_LIMITS[lead.estado];
  const slaVencido = slaLimit && dias > slaLimit;
  const slaProximo = slaLimit && dias === slaLimit;
  const isGenerating = generating === lead.id;
  const cal = calidadConfig[lead.calidad_lead];
  const CalIcon = cal?.icon;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col ${
      slaVencido ? 'border-red-300' : slaProximo ? 'border-amber-300' : 'border-gray-200'
    }`}>
      {/* Header card */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base leading-tight truncate">{lead.empresa}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{lead.contacto || 'Sin contacto'}</p>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            <button onClick={() => onEdit(lead)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button onClick={() => onDelete(lead.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${estadoBadge[lead.estado]}`}>
            {lead.estado}
          </span>
          {lead.es_rapida && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-teal-50 text-teal-800 border-teal-300 flex items-center gap-1">
              <Zap className="w-3 h-3" />Rápida
            </span>
          )}
          {cal && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${cal.cls}`}>
              <CalIcon className="w-3 h-3" />{lead.calidad_lead}
            </span>
          )}
          {slaVencido && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{dias}d SLA
            </span>
          )}
          {slaProximo && !slaVencido && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />Vence hoy
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1.5 text-xs text-gray-600">
          {lead.canal && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span>{lead.canal}</span>
            </div>
          )}
          {lead.cantidad_estimada && (
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span>{lead.cantidad_estimada.toLocaleString()} unidades</span>
            </div>
          )}
          {lead.producto_interes && (
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{lead.producto_interes}</span>
            </div>
          )}
          {lead.presupuesto_estimado > 0 && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="font-bold text-emerald-700">${lead.presupuesto_estimado.toLocaleString('es-CL')}</span>
            </div>
          )}
        </div>

        {/* Score */}
        <ScoreBar score={lead.lead_score} />

        {/* Next action */}
        {lead.next_action && (
          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-start gap-1.5 text-xs">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-tight">{lead.next_action}</span>
            </div>
            {lead.next_action_date && (
              <p className="text-[10px] text-gray-400 mt-0.5 ml-5">{lead.next_action_date}</p>
            )}
          </div>
        )}
      </div>

      {/* CTA generar propuesta */}
      {!['Ganado','Perdido'].includes(lead.estado) && (
        <div className="px-4 pb-4 mt-auto">
          <button
            onClick={() => onAutoCotizar(lead)}
            disabled={isGenerating}
            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando propuesta…</>
            ) : (
              <><Zap className="w-4 h-4" /> Generar cotización automática</>
            )}
          </button>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">IA arma técnica + comercial · PDF listo en {'<'} 30s</p>
        </div>
      )}
    </div>
  );
}

function CotizacionRow({ cot, onEdit, onDelete, onCrearOP }) {
  const total = cot.total || (cot.cantidad * cot.precio_unitario * (1 - (cot.descuento_pct || 0) / 100) + (cot.fee_personalizacion || 0) + (cot.fee_packaging || 0));
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{cot.empresa}</p>
          <p className="text-xs text-gray-500 truncate">{cot.sku} · {(cot.cantidad || 0).toLocaleString()} u · {cot.lead_time_dias || '?'}d</p>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${estadoBadge[cot.estado] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{cot.estado}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="font-bold text-emerald-700 text-sm">${total.toLocaleString('es-CL')}</p>
          <p className="text-[11px] text-gray-400">CLP</p>
        </div>
        <div className="flex gap-1">
          {cot.estado === 'Aceptada' && (
            <button onClick={() => onCrearOP(cot)} title="Crear Orden de Producción"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition">
              + OP
            </button>
          )}
          <button onClick={() => onEdit(cot)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={() => onDelete(cot.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

const LEAD_DEFAULTS = { empresa: '', contacto: '', email: '', telefono: '', canal: 'WhatsApp', estado: 'Nuevo', tipo: 'B2B Corporativo', calidad_lead: 'Tibio', logo_recibido: false, personalizacion: true };
const COT_DEFAULTS = { empresa: '', sku: '', cantidad: 0, precio_unitario: 0, descuento_pct: 0, fee_personalizacion: 0, fee_packaging: 0, estado: 'Borrador', personalizacion_tipo: 'Láser UV', packaging: 'Estándar (stock)', lead_time_dias: 7 };

const KANBAN_COLS = ['Nuevo', 'Contactado', 'Cotizado', 'Muestra Enviada', 'Negociación'];

const COL_COLORS = {
  Nuevo:            { header: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500' },
  Contactado:       { header: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  Cotizado:         { header: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500' },
  'Muestra Enviada':{ header: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  Negociación:      { header: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
};

export default function PipelineB2B() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(LEAD_DEFAULTS);
  const [generatingId, setGeneratingId] = useState(null);

  const mapB2BLead = (l) => ({
    id: l.id,
    empresa: l.company_name,
    contacto: l.contact_name,
    email: l.email,
    telefono: l.phone,
    canal: l.source,
    estado: ({ 'Nuevo':'Nuevo','Contactado':'Contactado','En revisión':'Cotizado','Propuesta enviada':'Negociación','Aceptado':'Ganado','Perdido':'Perdido' })[l.status] || 'Nuevo',
    tipo: 'B2B Corporativo',
    calidad_lead: (l.lead_score || 0) >= 70 ? 'Caliente' : (l.lead_score || 0) >= 40 ? 'Tibio' : 'Frío',
    cantidad_estimada: l.qty_estimate,
    presupuesto_estimado: null,
    producto_interes: l.product_interest,
    next_action: (l.notes || '').split('📋 Acción IA:')[1]?.trim()?.slice(0, 80) || null,
    next_action_date: l.delivery_date,
    notas: l.notes,
    logo_recibido: !!l.logo_url,
    personalizacion: l.personalization_needs,
    es_rapida: Array.isArray(l.tags) && l.tags.includes('Propuesta rápida'),
    created_date: l.created_date,
    updated_date: l.updated_date,
    lead_score: l.lead_score,
  });

  const loadData = async () => {
    setLoading(true);
    const b2b = await base44.entities.B2BLead.list('-created_date', 100);
    const c = await base44.entities.Cotizacion.list('-created_date', 100);
    setLeads(b2b.map(mapB2BLead));
    setCotizaciones(c);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(activeTab === 'leads' ? LEAD_DEFAULTS : COT_DEFAULTS); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setShowModal(true); };

  const handleSave = async () => {
    if (activeTab === 'leads') {
      const b2bData = {
        company_name: form.empresa, contact_name: form.contacto, email: form.email,
        phone: form.telefono,
        source: form.canal === 'WhatsApp' ? 'WhatsApp' : form.canal === 'Email' ? 'Email' : form.canal === 'LinkedIn' ? 'LinkedIn' : form.canal === 'Instagram' ? 'Instagram' : 'Formulario Web',
        status: ({ 'Nuevo':'Nuevo','Contactado':'Contactado','Cotizado':'En revisión','Muestra Enviada':'En revisión','Negociación':'Propuesta enviada','Ganado':'Aceptado','Perdido':'Perdido' })[form.estado] || 'Nuevo',
        product_interest: form.producto_interes, qty_estimate: form.cantidad_estimada,
        personalization_needs: form.personalizacion, notes: form.notas,
      };
      if (editing) await base44.entities.B2BLead.update(editing.id, b2bData);
      else await base44.entities.B2BLead.create(b2bData);
    } else {
      const total = (form.cantidad || 0) * (form.precio_unitario || 0) * (1 - (form.descuento_pct || 0) / 100) + (form.fee_personalizacion || 0) + (form.fee_packaging || 0);
      if (editing) await base44.entities.Cotizacion.update(editing.id, { ...form, total });
      else await base44.entities.Cotizacion.create({ ...form, total });
    }
    setShowModal(false); loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    if (activeTab === 'leads') await base44.entities.B2BLead.delete(id);
    else await base44.entities.Cotizacion.delete(id);
    loadData();
  };

  const handleCrearOP = async (cot) => {
    await base44.entities.OrdenProduccion.create({
      empresa: cot.empresa, sku: cot.sku, cantidad: cot.cantidad, estado: 'Pendiente', prioridad: 'Normal',
      inyectora: 'Sin asignar', laser: cot.personalizacion_tipo && cot.personalizacion_tipo !== 'Sin personalización' ? 'Láser 1' : 'No requiere',
      personalizacion: cot.personalizacion_tipo !== 'Sin personalización', anticipo_pagado: false,
      notas_produccion: `Generado automáticamente desde Cotización ${cot.numero || cot.id?.slice(0,8)}`,
    });
    toast({ title: `✅ OP creada para ${cot.empresa}` });
  };

  // Busca el producto REAL del catálogo que matchea el interés del lead, para
  // pasar su tabla B2B oficial (precio_b2b_tramos). Sin esto, createCorporateProposal
  // rechaza con 422 "precio_a_consultar" porque no hay tarifa oficial.
  const matchProductoCatalogo = async (lead) => {
    const productos = await base44.entities.Producto.filter({ activo: true }, '-updated_date', 300);
    const conTramos = productos.filter(p => {
      const t = p.precio_b2b_tramos;
      return t && typeof t === 'object' &&
        ['unitario','t10_49','t50_99','t100_249','t250_499','t500_999','t1000_1999','t2000_mas']
          .some(k => Number(t[k]) > 0);
    });
    if (!conTramos.length) return null;

    const interes = (lead.producto_interes || '').toLowerCase();
    // 1) Match exacto por SKU si el interés contiene un SKU del catálogo
    const porSku = conTramos.find(p => p.sku && interes.includes(p.sku.toLowerCase()));
    if (porSku) return porSku;
    // 2) Match por palabras del nombre
    const palabras = interes.split(/[\s—|·-]+/).filter(w => w.length > 2);
    const scored = conTramos.map(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const score = palabras.reduce((s, w) => s + (nombre.includes(w) ? 1 : 0), 0);
      return { p, score };
    }).sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].p : conTramos[0];
  };

  const handleAutoCotizar = async (lead) => {
    if (generatingId) return;
    setGeneratingId(lead.id);
    try {
      const producto = await matchProductoCatalogo(lead);
      if (!producto) {
        throw new Error('Ningún producto del catálogo tiene tarifa B2B oficial cargada. Carga los precios B2B primero.');
      }
      const resp = await base44.functions.invoke('createCorporateProposal', {
        leadId: lead.id,
        items: [{
          sku: producto.sku,
          nombre: producto.nombre,
          qty: lead.cantidad_estimada || 50,
          precio_b2b_tramos: producto.precio_b2b_tramos,
          precio_b2c: producto.precio_b2c,
          personalizacion: !!(lead.personalizacion || lead.logo_recibido),
        }],
        notes: lead.notas || '',
      });
      const data = resp?.data || resp;
      if (data?.error) throw new Error(data.message || data.error);
      toast({ title: '✨ Propuesta generada', description: `${data.numero} · ${lead.empresa} · $${(data.total || 0).toLocaleString('es-CL')} CLP · ${data.lead_time_dias}d` });
      await loadData();
      if (data?.proposal_url) window.open(data.proposal_url, '_blank', 'noopener');
    } catch (err) {
      toast({ title: 'No se pudo generar la propuesta', description: err?.message || 'Revisa los datos del lead.', variant: 'destructive' });
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredLeads = leads.filter(l =>
    (filterEstado === 'todos' || l.estado === filterEstado) &&
    (l.empresa?.toLowerCase().includes(search.toLowerCase()) || l.contacto?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredCots = cotizaciones.filter(c =>
    (filterEstado === 'todos' || c.estado === filterEstado) &&
    (c.empresa?.toLowerCase().includes(search.toLowerCase()) || c.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const isLead = activeTab === 'leads';
  const leadsActivos = leads.filter(l => !['Ganado','Perdido'].includes(l.estado));
  const valorPipeline = leadsActivos.reduce((s, l) => s + (l.presupuesto_estimado || 0), 0);
  const slaVencidos = leadsActivos.filter(l => { const d = getDiasEnEtapa(l); return SLA_LIMITS[l.estado] && d > SLA_LIMITS[l.estado]; }).length;
  const tasaConversion = leads.length > 0 ? ((leads.filter(l => l.estado === 'Ganado').length / leads.length) * 100).toFixed(1) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-poppins font-extrabold text-gray-900 tracking-tight">Pipeline B2B</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} leads · {cotizaciones.length} cotizaciones</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 hover:bg-gray-200 rounded-xl transition" title="Actualizar">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl font-bold shadow-sm">
            <Plus className="w-4 h-4" />
            {isLead ? 'Nuevo Lead' : 'Nueva Cotización'}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Leads activos',   value: leadsActivos.length,  sub: `${leads.filter(l=>l.calidad_lead==='Caliente').length} calientes`,           icon: Users,         color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
          { label: 'Valor pipeline',  value: valorPipeline > 0 ? `$${(valorPipeline/1000000).toFixed(1)}M` : '$—', sub: 'CLP estimado',              icon: DollarSign,    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'SLA vencidos',    value: slaVencidos,          sub: 'requieren acción hoy',                                                      icon: AlertTriangle, color: slaVencidos > 0 ? 'text-red-700' : 'text-gray-500', bg: slaVencidos > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200' },
          { label: 'Conversión',      value: `${tasaConversion}%`, sub: `Meta: 7% · ${leads.filter(l=>l.estado==='Ganado').length} ganados`,         icon: TrendingUp,    color: parseFloat(tasaConversion) >= 7 ? 'text-emerald-700' : 'text-amber-700', bg: parseFloat(tasaConversion) >= 7 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white border rounded-2xl p-4 shadow-sm ${kpi.bg.split(' ')[1]}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{kpi.label}</p>
                  <p className={`font-poppins font-extrabold text-2xl mt-1 ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="leads" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Leads ({leads.length})
                </TabsTrigger>
                <TabsTrigger value="cotizaciones" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Cotizaciones ({cotizaciones.length})
                </TabsTrigger>
                <TabsTrigger value="kanban" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Kanban
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2 ml-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                    className="pl-9 h-9 w-44 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400" />
                </div>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="h-9 w-40 bg-gray-50 border-gray-200 text-gray-900">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {(isLead ? ESTADOS_LEAD : ESTADOS_COT).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Tab: Leads ── */}
            <TabsContent value="leads" className="mt-4 px-0">
              {loading ? (
                <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando leads…
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 pt-0">
                  {filteredLeads.map(l => (
                    <LeadCard key={l.id} lead={l} onEdit={openEdit} onDelete={handleDelete} onAutoCotizar={handleAutoCotizar} generating={generatingId} />
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-25" />
                      <p className="font-medium">No hay leads. Agrega el primero.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Cotizaciones ── */}
            <TabsContent value="cotizaciones" className="mt-4 space-y-2.5 p-4 pt-0">
              {loading ? (
                <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                </div>
              ) : (
                <>
                  {filteredCots.map(c => <CotizacionRow key={c.id} cot={c} onEdit={openEdit} onDelete={handleDelete} onCrearOP={handleCrearOP} />)}
                  {filteredCots.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-25" />
                      <p className="font-medium">No hay cotizaciones. Genera una desde un lead activo.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Tab: Kanban ── */}
            <TabsContent value="kanban" className="mt-4 p-4 pt-0">
              {slaVencidos > 0 && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-800 border border-red-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {slaVencidos} lead{slaVencidos > 1 ? 's' : ''} con SLA vencido — actuar ahora
                </div>
              )}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {KANBAN_COLS.map(estado => {
                  const items = leads.filter(l => l.estado === estado);
                  const vencidos = items.filter(l => getDiasEnEtapa(l) > (SLA_LIMITS[estado] || 99)).length;
                  const col = COL_COLORS[estado] || {};
                  return (
                    <div key={estado} className="flex-shrink-0 w-56">
                      <div className={`flex items-center justify-between mb-2.5 px-3 py-2 rounded-xl border ${col.header}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                          <div>
                            <p className="font-bold text-xs text-gray-800">{estado}</p>
                            {SLA_LIMITS[estado] && <p className="text-[10px] text-gray-500">SLA {'<'}{SLA_LIMITS[estado]}d</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {vencidos > 0 && <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-full font-bold">{vencidos}⚠</span>}
                          <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded-full text-gray-600 font-semibold">{items.length}</span>
                        </div>
                      </div>

                      <div className="space-y-2 min-h-12">
                        {items.map(l => {
                          const dias = getDiasEnEtapa(l);
                          const slaV = SLA_LIMITS[estado] && dias > SLA_LIMITS[estado];
                          const cal = calidadConfig[l.calidad_lead];
                          return (
                            <div key={l.id} onClick={() => { setActiveTab('leads'); openEdit(l); }}
                              className={`bg-white rounded-xl border shadow-sm p-3 cursor-pointer hover:shadow-md transition-all ${slaV ? 'border-red-300' : 'border-gray-200'}`}>
                              <p className="font-bold text-gray-900 text-xs leading-tight truncate">{l.es_rapida && '⚡ '}{l.empresa}</p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{l.contacto}</p>
                              <div className="flex items-center justify-between mt-2 gap-1">
                                {cal && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border flex items-center gap-0.5 ${cal.cls}`}>
                                    <cal.icon className="w-2.5 h-2.5" />{l.calidad_lead}
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold flex items-center gap-1 ml-auto ${slaV ? 'text-red-700' : 'text-gray-400'}`}>
                                  {slaV ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {dias}d
                                </span>
                              </div>
                              {l.lead_score > 0 && (
                                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${l.lead_score}%`, background: l.lead_score >= 70 ? '#0F8B6C' : l.lead_score >= 40 ? '#D97706' : '#94A3B8' }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {items.length === 0 && (
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">Sin leads</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Ganado / Perdido */}
                {['Ganado','Perdido'].map(estado => {
                  const items = leads.filter(l => l.estado === estado);
                  const isWon = estado === 'Ganado';
                  return (
                    <div key={estado} className="flex-shrink-0 w-44">
                      <div className={`flex items-center justify-between mb-2.5 px-3 py-2 rounded-xl border ${isWon ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {isWon ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          <p className={`font-bold text-xs ${isWon ? 'text-emerald-800' : 'text-red-700'}`}>{estado}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${isWon ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {items.map(l => (
                          <div key={l.id} className={`rounded-xl border p-2.5 text-xs ${isWon ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="font-semibold text-gray-800 truncate">{l.empresa}</p>
                            {l.presupuesto_estimado > 0 && <p className={`mt-0.5 font-bold ${isWon ? 'text-emerald-700' : 'text-red-600'}`}>${(l.presupuesto_estimado/1000).toFixed(0)}K</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold text-gray-900">
              {editing ? 'Editar' : 'Nuevo'} {isLead ? 'Lead B2B' : 'Cotización'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {isLead ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Empresa *"><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} /></Field>
                  <Field label="Contacto *"><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email"><Input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} /></Field>
                  <Field label="Teléfono"><Input value={form.telefono||''} onChange={e=>setForm({...form,telefono:e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Canal">
                    <Select value={form.canal||''} onValueChange={v=>setForm({...form,canal:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["WhatsApp","Instagram","Email","LinkedIn","Referido","Web","Otro"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Estado">
                    <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ESTADOS_LEAD.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Calidad Lead">
                    <Select value={form.calidad_lead||''} onValueChange={v=>setForm({...form,calidad_lead:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Frío","Tibio","Caliente","No Comercial"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Cantidad Estimada (u)"><Input type="number" value={form.cantidad_estimada||''} onChange={e=>setForm({...form,cantidad_estimada:+e.target.value})} /></Field>
                </div>
                <Field label="Producto de Interés"><Input value={form.producto_interes||''} onChange={e=>setForm({...form,producto_interes:e.target.value})} /></Field>
                <Field label="Próxima Acción"><Input value={form.next_action||''} onChange={e=>setForm({...form,next_action:e.target.value})} /></Field>
                <Field label="Notas"><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" /></Field>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Empresa *"><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} /></Field>
                  <Field label="Contacto"><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} /></Field>
                </div>
                <Field label="Producto / SKU *"><Input value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Cantidad"><Input type="number" value={form.cantidad||''} onChange={e=>setForm({...form,cantidad:+e.target.value})} /></Field>
                  <Field label="Precio Unitario"><Input type="number" value={form.precio_unitario||''} onChange={e=>setForm({...form,precio_unitario:+e.target.value})} /></Field>
                  <Field label="Descuento %"><Input type="number" value={form.descuento_pct||''} onChange={e=>setForm({...form,descuento_pct:+e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fee Personalización"><Input type="number" value={form.fee_personalizacion||''} onChange={e=>setForm({...form,fee_personalizacion:+e.target.value})} /></Field>
                  <Field label="Fee Packaging"><Input type="number" value={form.fee_packaging||''} onChange={e=>setForm({...form,fee_packaging:+e.target.value})} /></Field>
                </div>
                <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-sm text-emerald-800">
                  Total estimado: ${((form.cantidad||0)*(form.precio_unitario||0)*(1-(form.descuento_pct||0)/100)+(form.fee_personalizacion||0)+(form.fee_packaging||0)).toLocaleString('es-CL')} CLP
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Personalización">
                    <Select value={form.personalizacion_tipo||''} onValueChange={v=>setForm({...form,personalizacion_tipo:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Láser UV","Serigrafía","Sin personalización"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Lead Time (días)"><Input type="number" value={form.lead_time_dias||''} onChange={e=>setForm({...form,lead_time_dias:+e.target.value})} /></Field>
                </div>
                <Field label="Estado">
                  <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS_COT.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-gray-300 text-gray-700">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}