import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Star, Send, FileText, MessageCircle, Eye, RefreshCw, TrendingUp, Clock, Plus, Trash2, Zap, Copy, Check, ExternalLink } from 'lucide-react';

const LEAD_STATUS = ['Nuevo', 'Contactado', 'En revisión', 'Propuesta enviada', 'Aceptado', 'Perdido'];
const LEAD_COLORS = {
  'Nuevo': 'bg-blue-100 text-blue-700',
  'Contactado': 'bg-yellow-100 text-yellow-700',
  'En revisión': 'bg-orange-100 text-orange-700',
  'Propuesta enviada': 'bg-purple-100 text-purple-700',
  'Aceptado': 'bg-green-100 text-green-700',
  'Perdido': 'bg-red-100 text-red-700',
};

const PROP_COLORS = {
  'Borrador': 'bg-gray-100 text-gray-700',
  'Enviada': 'bg-blue-100 text-blue-700',
  'Aceptada': 'bg-green-100 text-green-700',
  'Rechazada': 'bg-red-100 text-red-700',
  'Vencida': 'bg-orange-100 text-orange-700',
};

function ScorePill({ score }) {
  const s = score || 0;
  const bg = s >= 70 ? 'bg-green-500' : s >= 40 ? 'bg-yellow-500' : 'bg-gray-400';
  return <span className={`${bg} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{s}pts</span>;
}

const DEFAULT_ITEM = { nombre: '', qty: 50, precio_base: 9990, personalizacion: true };

function GenerarPropuestaModal({ lead, onClose, onDone }) {
  const [items, setItems] = useState([
    { nombre: lead.product_interest || 'Kit Escritorio Pro', qty: lead.qty_estimate || 50, precio_base: 19990, personalizacion: lead.personalization_needs !== false },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const addItem = () => setItems(prev => [...prev, { ...DEFAULT_ITEM }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const generar = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('createCorporateProposal', {
      leadId: lead.id,
      items: items.map(it => ({ ...it, qty: Number(it.qty), precio_base: Number(it.precio_base) })),
    });
    setResult(res.data);
    setLoading(false);
    onDone();
  };

  const proposalUrl = result ? `${window.location.origin}/b2b/propuesta?id=${result.proposal_id}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(proposalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold font-poppins">Generar Propuesta IA</h2>
            <p className="text-sm text-muted-foreground">{lead.company_name} · {lead.contact_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {result ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                  <Check className="w-5 h-5" /> Propuesta #{result.numero} generada
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Total:</span> <span className="font-bold text-[#006D5B]">${result.total?.toLocaleString('es-CL')}</span></div>
                  <div><span className="text-muted-foreground">Lead time:</span> <span className="font-bold">{result.lead_time_dias} días</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link para compartir con el cliente</label>
                <div className="flex gap-2">
                  <input readOnly value={proposalUrl} className="flex-1 text-xs border border-input rounded-md px-3 py-2 bg-muted" />
                  <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
                <a href={proposalUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3 h-3" /> Vista previa del cliente
                  </Button>
                </a>
              </div>
              {lead.email && (
                <Button
                  className="w-full gap-2"
                  style={{ backgroundColor: '#006D5B' }}
                  onClick={async () => {
                    await base44.functions.invoke('sendProposalEmail', { proposalId: result.proposal_id });
                    alert('\u2713 Email enviado a ' + lead.email);
                  }}
                >
                  <Send className="w-4 h-4" /> Enviar por email a {lead.email}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Productos / Ítems</label>
                  <Button size="sm" variant="outline" onClick={addItem} className="gap-1.5 text-xs">
                    <Plus className="w-3 h-3" /> Agregar
                  </Button>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="bg-muted rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nombre producto"
                        value={item.nombre}
                        onChange={e => updateItem(i, 'nombre', e.target.value)}
                        className="flex-1 text-sm h-8"
                      />
                      {items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Cantidad</div>
                        <Input type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Precio base (CLP)</div>
                        <Input type="number" min="1000" step="500" value={item.precio_base} onChange={e => updateItem(i, 'precio_base', e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="checkbox" checked={item.personalizacion} onChange={e => updateItem(i, 'personalizacion', e.target.checked)} className="accent-[#006D5B]" />
                          Con láser
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={generar}
                disabled={loading || items.some(i => !i.nombre)}
                className="w-full gap-2 font-semibold"
                style={{ backgroundColor: '#006D5B' }}
                size="lg"
              >
                <Zap className="w-4 h-4" />
                {loading ? 'Generando con IA...' : 'Generar propuesta automática'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPropuestas() {
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('leads');
  const [updating, setUpdating] = useState(null);
  const [generatingMockup, setGeneratingMockup] = useState(null);
  const [propuestaModal, setPropuestaModal] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([
        base44.entities.B2BLead.list('-created_date', 100),
        base44.entities.CorporateProposal.list('-created_date', 100),
      ]);
      setLeads(l);
      setProposals(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const updateLead = async (id, data) => {
    setUpdating(id);
    await base44.entities.B2BLead.update(id, data);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    setUpdating(null);
  };

  const scoreLead = async (lead) => {
    setUpdating(lead.id);
    const res = await base44.functions.invoke('scoreLead', { leadId: lead.id });
    if (res.data?.lead_score !== undefined) {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_score: res.data.lead_score, urgency: res.data.urgency } : l));
    }
    setUpdating(null);
  };

  const openWhatsApp = (lead) => {
    const phone = (lead.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(`Hola ${lead.contact_name}, soy Carlos de Peyu Chile 🌿\n\nRecibimos tu solicitud de cotización para ${lead.product_interest || 'nuestros productos corporativos'}. ¿Tienes disponibilidad para conversarlo y mostrarte algunas opciones con tu logo?`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const generarMockup = async (lead) => {
    if (!lead.logo_url) {
      alert('Este lead no tiene logo subido. Pide el logo primero.');
      return;
    }
    setGeneratingMockup(lead.id);
    try {
      const res = await base44.functions.invoke('generateMockup', {
        productName: lead.product_interest || 'Kit Escritorio Corporativo',
        logoUrl: lead.logo_url,
      });
      if (res.data?.mockup_url) {
        const currentUrls = lead.mockup_urls || [];
        await updateLead(lead.id, {
          mockup_urls: [...currentUrls, res.data.mockup_url],
          status: 'En revisión',
        });
        alert('✓ Mockup generado exitosamente');
      }
    } catch {
      alert('Error generando mockup. Inténtalo de nuevo.');
    } finally {
      setGeneratingMockup(null);
    }
  };

  // KPIs
  const kpis = [
    { label: 'Leads nuevos', value: leads.filter(l => l.status === 'Nuevo').length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Leads calientes (≥70pts)', value: leads.filter(l => (l.lead_score || 0) >= 70).length, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Propuestas enviadas', value: proposals.filter(p => p.status === 'Enviada').length, icon: Send, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Propuestas aceptadas', value: proposals.filter(p => p.status === 'Aceptada').length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Pipeline B2B</h1>
          <p className="text-muted-foreground text-sm">Leads corporativos y propuestas Peyu</p>
        </div>
        <Button onClick={cargar} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className="text-2xl font-bold font-poppins">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {[
          { id: 'leads', label: `Leads (${leads.length})` },
          { id: 'proposals', label: `Propuestas (${proposals.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.id ? 'border-[#006D5B] text-[#006D5B]' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando pipeline...</div>
      ) : tab === 'leads' ? (
        <div className="space-y-3">
          {leads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin leads B2B aún</p>
              <p className="text-sm mt-1">Los leads del formulario web y WhatsApp aparecerán aquí.</p>
            </div>
          ) : (
            leads.map(lead => (
              <div key={lead.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{lead.company_name}</span>
                      <ScorePill score={lead.lead_score} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAD_COLORS[lead.status] || 'bg-gray-100'}`}>
                        {lead.status}
                      </span>
                      {lead.urgency === 'Alta' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Urgente
                        </span>
                      )}
                    </div>
                    {/* Contacto */}
                    <div className="text-sm text-muted-foreground">
                      {lead.contact_name} · {lead.email}
                      {lead.phone && ` · ${lead.phone}`}
                      {lead.rut && ` · RUT: ${lead.rut}`}
                    </div>
                    {/* Pedido */}
                    {(lead.product_interest || lead.qty_estimate) && (
                      <div className="text-sm mt-1.5">
                        {lead.product_interest && <span className="font-medium">{lead.product_interest}</span>}
                        {lead.qty_estimate ? ` — ${lead.qty_estimate} unidades` : ''}
                        {lead.delivery_date ? ` · Fecha: ${lead.delivery_date}` : ''}
                      </div>
                    )}
                    {/* Flags */}
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {lead.personalization_needs && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✨ Con personalización</span>
                      )}
                      {lead.has_plastic && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">♻️ Tiene plástico</span>
                      )}
                      {lead.logo_url && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">🖼️ Logo subido</span>
                      )}
                    </div>
                    {lead.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">"{lead.notes}"</div>
                    )}
                    {/* Mockups */}
                    {lead.mockup_urls && lead.mockup_urls.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {lead.mockup_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Mockup ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-border hover:opacity-80 transition" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {lead.phone && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openWhatsApp(lead)}>
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs border-[#006D5B] text-[#006D5B] hover:bg-green-50"
                      onClick={() => setPropuestaModal(lead)}
                    >
                      <Zap className="w-3 h-3" /> Propuesta IA
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => scoreLead(lead)} disabled={updating === lead.id}>
                      <RefreshCw className="w-3 h-3" /> Re-score
                    </Button>
                    {lead.logo_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => generarMockup(lead)}
                        disabled={generatingMockup === lead.id}
                      >
                        {generatingMockup === lead.id ? '...' : '🎨 Mockup'}
                      </Button>
                    )}
                    {lead.logo_url && (
                      <a href={lead.logo_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="gap-1.5 text-xs w-full">
                          <Eye className="w-3 h-3" /> Logo
                        </Button>
                      </a>
                    )}
                    <select
                      value={lead.status}
                      onChange={e => updateLead(lead.id, { status: e.target.value })}
                      disabled={updating === lead.id}
                      className="text-xs border border-input rounded-md px-2 py-1.5 bg-background cursor-pointer"
                    >
                      {LEAD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin propuestas aún</p>
              <p className="text-sm mt-1">Las propuestas corporativas creadas aparecerán aquí.</p>
            </div>
          ) : (
            proposals.map(prop => (
              <div key={prop.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {prop.numero && <span className="text-xs text-muted-foreground font-mono">#{prop.numero}</span>}
                      <span className="font-semibold">{prop.empresa}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROP_COLORS[prop.status] || 'bg-gray-100'}`}>
                        {prop.status}
                      </span>
                      {prop.auto_generated && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">🤖 IA</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {prop.contacto}{prop.email && ` · ${prop.email}`}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-sm">
                      {prop.total && (
                        <span className="font-semibold text-[#006D5B]">
                          ${prop.total?.toLocaleString('es-CL')} CLP
                        </span>
                      )}
                      {prop.lead_time_dias && (
                        <span className="text-muted-foreground">{prop.lead_time_dias} días hábiles</span>
                      )}
                      {prop.validity_days && (
                        <span className="text-muted-foreground">Validez: {prop.validity_days} días</span>
                      )}
                    </div>
                    {/* Mockups */}
                    {prop.mockup_urls && prop.mockup_urls.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {prop.mockup_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Mockup ${i + 1}`} className="w-14 h-14 object-cover rounded-lg border border-border hover:opacity-80 transition" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a href={`/b2b/propuesta?id=${prop.id}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full">
                        <ExternalLink className="w-3 h-3" /> Ver propuesta
                      </Button>
                    </a>
                    {prop.pdf_url && (
                      <a href={prop.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <FileText className="w-3 h-3" /> PDF
                        </Button>
                      </a>
                    )}
                    <select
                      value={prop.status}
                      onChange={async e => {
                        await base44.entities.CorporateProposal.update(prop.id, { status: e.target.value });
                        setProposals(prev => prev.map(p => p.id === prop.id ? { ...p, status: e.target.value } : p));
                      }}
                      className="text-xs border border-input rounded-md px-2 py-1.5 bg-background cursor-pointer"
                    >
                      {['Borrador', 'Enviada', 'Aceptada', 'Rechazada', 'Vencida'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {propuestaModal && (
        <GenerarPropuestaModal
          lead={propuestaModal}
          onClose={() => setPropuestaModal(null)}
          onDone={() => { cargar(); }}
        />
      )}
    </div>
  );
}