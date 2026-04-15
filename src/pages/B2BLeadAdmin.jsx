import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, Search, Phone, Mail, Building2, Calendar, Package, Clock,
  TrendingUp, AlertCircle, CheckCircle2, XCircle, MessageSquare, FileText,
  ChevronRight, MoreVertical, Sparkles, Filter, ArrowUpRight, RefreshCw,
  Zap, Target, DollarSign
} from 'lucide-react';

const STATUS_CONFIG = {
  'Nuevo': { color: '#3B82F6', bg: '#EFF6FF', icon: Zap },
  'Contactado': { color: '#8B5CF6', bg: '#F5F3FF', icon: Phone },
  'En revision': { color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  'Propuesta enviada': { color: '#0F8B6C', bg: '#ECFDF5', icon: FileText },
  'Aceptado': { color: '#10B981', bg: '#D1FAE5', icon: CheckCircle2 },
  'Perdido': { color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

const URGENCY_CONFIG = {
  'Alta': { color: '#EF4444', label: 'Urgente' },
  'Normal': { color: '#F59E0B', label: 'Normal' },
  'Baja': { color: '#6B7280', label: 'Baja' },
};

function ScoreBadge({ score }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#6B7280';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>
        {score || 0}
      </div>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score || 0}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function LeadCard({ lead, onSelect, onQuickAction }) {
  const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG['Nuevo'];
  const urgency = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG['Normal'];
  const StatusIcon = status.icon;

  return (
    <div
      onClick={() => onSelect(lead)}
      className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: status.color }}>
            {lead.company_name?.charAt(0) || 'E'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{lead.company_name}</h3>
            <p className="text-xs text-gray-400">{lead.contact_name}</p>
          </div>
        </div>
        <ScoreBadge score={lead.lead_score} />
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Package className="w-3.5 h-3.5" />
          <span className="truncate">{lead.product_interest || 'Sin especificar'}</span>
          {lead.qty_estimate && (
            <span className="font-semibold text-gray-700">x{lead.qty_estimate}</span>
          )}
        </div>
        {lead.delivery_date && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(lead.delivery_date).toLocaleDateString('es-CL')}</span>
          </div>
        )}
        {lead.deal_value > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-700 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${lead.deal_value?.toLocaleString('es-CL')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
            {lead.status}
          </span>
          {lead.urgency === 'Alta' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-500">
              Urgente
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(lead, 'whatsapp'); }}
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-green-600" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(lead, 'email'); }}
            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(lead, 'proposal'); }}
            className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
          </button>
        </div>
      </div>

      {lead.ai_recommendation && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-amber-50 rounded-xl p-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{lead.ai_recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadDetailModal({ lead, onClose, onUpdate }) {
  const [editedLead, setEditedLead] = useState(lead);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [runningAI, setRunningAI] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.B2BLead.update(lead.id, editedLead);
    onUpdate();
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const history = editedLead.contact_history || [];
    history.push({
      date: new Date().toISOString(),
      channel: 'Manual',
      note: newNote,
      by: 'Admin',
    });
    setEditedLead(prev => ({
      ...prev,
      contact_history: history,
      last_contact_date: new Date().toISOString(),
    }));
    setNewNote('');
  };

  const handleRunAI = async () => {
    setRunningAI(true);
    try {
      const result = await base44.functions.invoke('scoreLead', { leadId: lead.id });
      if (result) {
        setEditedLead(prev => ({
          ...prev,
          lead_score: result.lead_score,
          urgency: result.urgency,
          ai_recommendation: result.next_action,
        }));
      }
    } catch (err) {
      console.error('Error running AI:', err);
    }
    setRunningAI(false);
  };

  const handleCreateProposal = async () => {
    window.location.href = `/admin/propuestas?leadId=${lead.id}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: STATUS_CONFIG[editedLead.status]?.color || '#3B82F6' }}>
              {editedLead.company_name?.charAt(0) || 'E'}
            </div>
            <div>
              <h2 className="font-poppins font-bold text-xl text-gray-900">{editedLead.company_name}</h2>
              <p className="text-sm text-gray-400">{editedLead.contact_name} · {editedLead.source}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge score={editedLead.lead_score} />
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleRunAI}
              disabled={runningAI}
              className="gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {runningAI ? 'Analizando...' : 'Analizar con IA'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateProposal}
              className="gap-1.5 rounded-xl"
            >
              <FileText className="w-3.5 h-3.5" />
              Crear Propuesta
            </Button>
            <a
              href={`https://wa.me/${editedLead.phone?.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(editedLead.contact_name)}%2C%20soy%20Carlos%20de%20Peyu`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </Button>
            </a>
            <a href={`mailto:${editedLead.email}`}>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl">
                <Mail className="w-3.5 h-3.5" />
                Email
              </Button>
            </a>
          </div>

          {/* AI Recommendation */}
          {editedLead.ai_recommendation && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
                <Sparkles className="w-4 h-4" />
                Recomendacion IA
              </div>
              <p className="text-sm text-amber-800">{editedLead.ai_recommendation}</p>
            </div>
          )}

          {/* Status & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Estado</label>
              <select
                value={editedLead.status}
                onChange={e => setEditedLead(prev => ({ ...prev, status: e.target.value }))}
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm"
              >
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Urgencia</label>
              <select
                value={editedLead.urgency}
                onChange={e => setEditedLead(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm"
              >
                {Object.keys(URGENCY_CONFIG).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Email</label>
              <Input value={editedLead.email || ''} readOnly className="h-10 rounded-xl bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Telefono</label>
              <Input value={editedLead.phone || ''} readOnly className="h-10 rounded-xl bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">RUT</label>
              <Input value={editedLead.rut || ''} readOnly className="h-10 rounded-xl bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Valor Estimado ($)</label>
              <Input
                type="number"
                value={editedLead.deal_value || ''}
                onChange={e => setEditedLead(prev => ({ ...prev, deal_value: Number(e.target.value) }))}
                className="h-10 rounded-xl"
                placeholder="Ej: 500000"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Producto</label>
              <Input value={editedLead.product_interest || ''} readOnly className="h-10 rounded-xl bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Cantidad</label>
              <Input value={editedLead.qty_estimate || ''} readOnly className="h-10 rounded-xl bg-gray-50" />
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Asignado a</label>
            <select
              value={editedLead.assigned_to || ''}
              onChange={e => setEditedLead(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm"
            >
              <option value="">Sin asignar</option>
              <option value="Carlos">Carlos</option>
              <option value="Equipo Ventas">Equipo Ventas</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Notas del lead</label>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 whitespace-pre-wrap min-h-[60px]">
              {editedLead.notes || 'Sin notas'}
            </div>
          </div>

          {/* Contact History */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-400">Historial de contacto</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(editedLead.contact_history || []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin historial de contacto</p>
              ) : (
                editedLead.contact_history.map((h, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-700">{h.channel}</span>
                      <span className="text-xs text-gray-400">{new Date(h.date).toLocaleString('es-CL')}</span>
                    </div>
                    <p className="text-gray-600">{h.note}</p>
                    <p className="text-xs text-gray-400 mt-1">Por: {h.by}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Agregar nota de contacto..."
                className="h-10 rounded-xl flex-1"
              />
              <Button onClick={handleAddNote} size="sm" className="rounded-xl">Agregar</Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-1.5">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function B2BLeadAdmin() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'list'

  const fetchLeads = async () => {
    setLoading(true);
    const data = await base44.entities.B2BLead.list('-created_date');
    setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search ||
        l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      const matchUrgency = filterUrgency === 'all' || l.urgency === filterUrgency;
      return matchSearch && matchStatus && matchUrgency;
    });
  }, [leads, search, filterStatus, filterUrgency]);

  const pipelineData = useMemo(() => {
    const stages = ['Nuevo', 'Contactado', 'En revision', 'Propuesta enviada', 'Aceptado', 'Perdido'];
    return stages.map(status => ({
      status,
      leads: filteredLeads.filter(l => l.status === status),
      config: STATUS_CONFIG[status],
    }));
  }, [filteredLeads]);

  const stats = useMemo(() => ({
    total: leads.length,
    qualified: leads.filter(l => (l.lead_score || 0) >= 70).length,
    urgent: leads.filter(l => l.urgency === 'Alta').length,
    pipeline_value: leads.reduce((sum, l) => sum + (l.deal_value || 0), 0),
  }), [leads]);

  const handleQuickAction = (lead, action) => {
    if (action === 'whatsapp') {
      const phone = lead.phone?.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=Hola%20${encodeURIComponent(lead.contact_name)}%2C%20soy%20Carlos%20de%20Peyu`, '_blank');
    } else if (action === 'email') {
      window.open(`mailto:${lead.email}`, '_blank');
    } else if (action === 'proposal') {
      window.location.href = `/admin/propuestas?leadId=${lead.id}`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-gray-900">Pipeline B2B</h1>
          <p className="text-sm text-gray-400">Gestion de leads corporativos con scoring IA</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLeads} className="gap-1.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: '#3B82F6' },
          { label: 'Calificados (70+)', value: stats.qualified, icon: Target, color: '#10B981' },
          { label: 'Urgentes', value: stats.urgent, icon: AlertCircle, color: '#EF4444' },
          { label: 'Valor Pipeline', value: `$${(stats.pipeline_value / 1000000).toFixed(1)}M`, icon: DollarSign, color: '#8B5CF6' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
              <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa, contacto, email..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm"
        >
          <option value="all">Todos los estados</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterUrgency}
          onChange={e => setFilterUrgency(e.target.value)}
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm"
        >
          <option value="all">Todas las urgencias</option>
          {Object.keys(URGENCY_CONFIG).map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'pipeline' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineData.map((stage) => (
            <div key={stage.status} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: stage.config.bg }}>
                  <stage.config.icon className="w-3.5 h-3.5" style={{ color: stage.config.color }} />
                </div>
                <span className="font-semibold text-sm text-gray-700">{stage.status}</span>
                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {stage.leads.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px] bg-gray-50/50 rounded-2xl p-2">
                {stage.leads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelect={setSelectedLead}
                    onQuickAction={handleQuickAction}
                  />
                ))}
                {stage.leads.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    Sin leads en esta etapa
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onSelect={setSelectedLead}
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            fetchLeads();
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
}
