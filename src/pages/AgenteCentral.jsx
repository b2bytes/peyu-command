// ============================================================================
// AgenteCentral · Centro de Comando Admin — PEYU Chile
// ─────────────────────────────────────────────────────────────────────────────
// SOLO para administradores internos del equipo PEYU (Joaquín, Carlos, equipo).
// Incluye:
//   • Strip de 6 KPIs en tiempo real
//   • 5 tabs: Agente IA | Leads | Cotizaciones | Pedidos | Acciones
//   • Chat IA con contexto completo de CRM via InvokeLLM
//   • Acciones directas: WhatsApp, email, alertas
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  RefreshCw, Send, MessageSquare, Users, FileText, Package,
  Zap, TrendingUp, DollarSign, ShoppingCart, Target, Percent,
  AlertTriangle, CheckCircle, Clock, Phone, Mail, ExternalLink,
  X, ChevronRight, Loader2, Bot, User as UserIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtCLP = (n) => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—';
const fmtNum = (n) => n != null ? Number(n).toLocaleString('es-CL') : '0';

// ─── Componente KPI Card ─────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color = 'teal', loading }) {
  const colors = {
    teal:   'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-300',
    green:  'from-green-500/20 to-green-600/10 border-green-500/30 text-green-300',
    blue:   'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300',
    amber:  'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300',
    red:    'from-red-500/20 to-red-600/10 border-red-500/30 text-red-300',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 flex flex-col gap-1 min-w-0`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50 font-medium uppercase tracking-wide truncate">{label}</span>
        {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${colors[color].split(' ')[3]}`} />}
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-white/10 rounded animate-pulse mt-1" />
      ) : (
        <span className="text-2xl font-bold text-white leading-none">{value}</span>
      )}
      {sub && <span className="text-xs text-white/40 truncate">{sub}</span>}
    </div>
  );
}

// ─── Mensaje del chat ────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-teal-600' : 'bg-slate-700'
      }`}>
        {isUser ? <UserIcon className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-teal-300" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
        isUser
          ? 'bg-teal-600/30 text-white rounded-tr-sm'
          : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
      }`}>
        {isUser ? (
          <p className="leading-relaxed">{msg.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="text-teal-300">{children}</strong>,
              code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/10 text-xs">{children}</code>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ─── Tab Agente IA ───────────────────────────────────────────────────────────
function TabAgente({ crm }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hola equipo PEYU. Soy tu agente de comando con acceso completo al CRM.\n\nTengo visibilidad de:\n- **${crm.leads?.length || 0} leads B2B** activos\n- **${crm.cotizaciones?.length || 0} cotizaciones** en curso\n- **${crm.pedidos?.length || 0} pedidos** recientes\n- Productos, clientes, y KPIs en tiempo real\n\n¿En qué te ayudo hoy?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const leadsHot = (crm.leads || []).filter(l => l.urgencia === 'Alta' || l.calidad_lead === 'Caliente' || l.lead_score >= 70);
    const cotPendientes = (crm.cotizaciones || []).filter(c => c.status === 'Enviada' || c.status === 'Borrador');
    const pedidosActivos = (crm.pedidos || []).filter(p => !['Entregado','Cancelado','Reembolsado'].includes(p.estado));
    return `CONTEXTO COMPLETO DEL CRM PEYU CHILE (${new Date().toLocaleDateString('es-CL')}):

=== LEADS B2B (${crm.leads?.length || 0} total) ===
Leads calientes/alta urgencia: ${leadsHot.length}
${leadsHot.slice(0,5).map(l => `• ${l.company_name} | ${l.contact_name} | ${l.status} | Score: ${l.lead_score || '-'} | ${l.email || ''}`).join('\n')}

=== COTIZACIONES (${crm.cotizaciones?.length || 0} total) ===
Pendientes de respuesta: ${cotPendientes.length}
${cotPendientes.slice(0,5).map(c => `• ${c.empresa} | ${c.status} | Total: ${fmtCLP(c.total)} | Vence: ${c.fecha_vencimiento || 'sin fecha'}`).join('\n')}

=== PEDIDOS ACTIVOS (${pedidosActivos.length}) ===
${pedidosActivos.slice(0,5).map(p => `• #${p.numero_pedido || p.id?.slice(-6)} | ${p.cliente_nombre} | ${p.estado} | ${fmtCLP(p.total)}`).join('\n')}

=== KPIs ===
Pipeline leads activos: ${crm.leads?.filter(l => !['Aceptado','Perdido'].includes(l.status))?.length || 0}
Cotizaciones abiertas: ${cotPendientes.length}
Pedidos en curso: ${pedidosActivos.length}

Eres un agente de comando interno del equipo PEYU Chile. Responde en español, sé directo y útil. Usa datos reales del contexto cuando sea relevante.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = [...messages, userMsg]
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`)
      .join('\n\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${buildContext()}\n\n=== HISTORIAL DE CONVERSACIÓN ===\n${history}\n\nAgente:`,
      model: 'claude_sonnet_4_6',
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 peyu-scrollbar">
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-teal-300" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pregunta al agente sobre leads, cotizaciones, pedidos..."
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-teal-500/50"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-teal-600 hover:bg-teal-500 px-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-white/25 mt-1.5 text-center">Modelo: Claude Sonnet · Contexto CRM completo · Solo admin</p>
      </div>
    </div>
  );
}

// ─── Tab Leads ───────────────────────────────────────────────────────────────
function TabLeads({ leads, onSelectLead }) {
  const [filter, setFilter] = useState('all');

  const filtered = leads.filter(l => {
    if (filter === 'hot') return l.urgencia === 'Alta' || l.lead_score >= 70;
    if (filter === 'sin_seguimiento') return l.status === 'Nuevo';
    return true;
  });

  const statusColor = {
    'Nuevo': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Contactado': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'En revisión': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Propuesta enviada': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Aceptado': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Perdido': 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filtros */}
      <div className="flex gap-2 p-4 border-b border-white/10 flex-wrap">
        {[['all','Todos'], ['hot','🔥 Calientes'], ['sin_seguimiento','⏰ Sin seguimiento']].map(([k,l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === k ? 'bg-teal-600 border-teal-500 text-white' : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
            }`}
          >
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/30 self-center">{filtered.length} leads</span>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar divide-y divide-white/5">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">No hay leads con ese filtro</div>
        )}
        {filtered.map(lead => (
          <div
            key={lead.id}
            onClick={() => onSelectLead(lead)}
            className="flex items-center gap-3 p-4 hover:bg-white/[0.03] cursor-pointer transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-teal-300">
                {(lead.company_name || lead.contact_name || '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{lead.company_name || lead.contact_name}</span>
                {lead.urgencia === 'Alta' && <span className="text-xs">🔥</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-white/40 truncate">{lead.contact_name}</span>
                {lead.lead_score && <span className="text-xs text-amber-400">Score {lead.lead_score}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[lead.status] || 'bg-white/10 text-white/50 border-white/20'}`}>
                {lead.status}
              </span>
              {lead.qty_estimate && <span className="text-xs text-white/30">{fmtNum(lead.qty_estimate)} u</span>}
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Cotizaciones ────────────────────────────────────────────────────────
function TabCotizaciones({ cotizaciones }) {
  const statusColor = {
    'Borrador': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'Enviada': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Aceptada': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Rechazada': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Vencida': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const today = new Date();
  const isUrgent = (c) => {
    if (!c.fecha_vencimiento) return false;
    const diff = (new Date(c.fecha_vencimiento) - today) / 86400000;
    return diff >= 0 && diff <= 3;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm text-white/50">{cotizaciones.length} cotizaciones</span>
        {cotizaciones.filter(isUrgent).length > 0 && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            {cotizaciones.filter(isUrgent).length} vencen pronto
          </Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto peyu-scrollbar divide-y divide-white/5">
        {cotizaciones.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Sin cotizaciones</div>
        )}
        {cotizaciones.map(c => (
          <div key={c.id} className="p-4 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isUrgent(c) && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                  <span className="text-sm font-medium text-white truncate">{c.empresa}</span>
                </div>
                <div className="text-xs text-white/40 mt-0.5 truncate">{c.contacto} · {c.numero || c.id?.slice(-6)}</div>
                {c.fecha_vencimiento && (
                  <div className="text-xs text-white/30 mt-0.5">
                    Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[c.status] || 'bg-white/10 text-white/50 border-white/20'}`}>
                  {c.status}
                </span>
                <span className="text-sm font-semibold text-teal-300">{fmtCLP(c.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Pedidos ─────────────────────────────────────────────────────────────
function TabPedidos({ pedidos }) {
  const estadoColor = {
    'Nuevo': 'bg-blue-500/20 text-blue-300',
    'Confirmado': 'bg-teal-500/20 text-teal-300',
    'En Producción': 'bg-purple-500/20 text-purple-300',
    'Listo para Despacho': 'bg-amber-500/20 text-amber-300',
    'Despachado': 'bg-cyan-500/20 text-cyan-300',
    'Entregado': 'bg-green-500/20 text-green-300',
    'Cancelado': 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <span className="text-sm text-white/50">{pedidos.length} pedidos recientes</span>
      </div>
      <div className="flex-1 overflow-y-auto peyu-scrollbar divide-y divide-white/5">
        {pedidos.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Sin pedidos</div>
        )}
        {pedidos.map(p => (
          <div key={p.id} className="p-4 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{p.cliente_nombre}</span>
                  <span className="text-xs text-white/30">#{p.numero_pedido || p.id?.slice(-6)}</span>
                </div>
                <div className="text-xs text-white/40 mt-0.5 truncate">{p.descripcion_items || p.sku || '—'}</div>
                <div className="text-xs text-white/30 mt-0.5">{p.fecha ? new Date(p.fecha).toLocaleDateString('es-CL') : '—'}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor[p.estado] || 'bg-white/10 text-white/50'}`}>
                  {p.estado}
                </span>
                <span className="text-sm font-semibold text-teal-300">{fmtCLP(p.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Acciones ────────────────────────────────────────────────────────────
function TabAcciones({ crm }) {
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const leadsUrgentesSinSeguimiento = (crm.leads || []).filter(l => l.status === 'Nuevo');
  const cotPorVencer = (crm.cotizaciones || []).filter(c => {
    if (!c.fecha_vencimiento) return false;
    const diff = (new Date(c.fecha_vencimiento) - new Date()) / 86400000;
    return diff >= 0 && diff <= 5;
  });

  const sendWA = (to) => {
    const msg = encodeURIComponent(`Hola ${to}, te escribo desde el Centro de Comando PEYU. Hay ${leadsUrgentesSinSeguimiento.length} leads nuevos y ${cotPorVencer.length} cotizaciones por vencer esta semana.`);
    const phones = { joaquin: '56935040242', carlos: '56935040242' };
    window.open(`https://wa.me/${phones[to]}?text=${msg}`, '_blank');
  };

  const sendEmail = async () => {
    if (!emailTo || !emailMsg) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: `[PEYU Admin] Mensaje desde Centro de Comando`,
      body: emailMsg,
    });
    setSent(true);
    setSending(false);
    setTimeout(() => setSent(false), 3000);
    setEmailTo('');
    setEmailMsg('');
  };

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto peyu-scrollbar h-full">
      {/* Alertas */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Alertas del Sistema</h3>
        <div className="space-y-2">
          {leadsUrgentesSinSeguimiento.length > 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-200 font-medium">{leadsUrgentesSinSeguimiento.length} leads sin contactar</p>
                <p className="text-xs text-amber-300/60">
                  {leadsUrgentesSinSeguimiento.slice(0, 2).map(l => l.company_name || l.contact_name).join(', ')}
                  {leadsUrgentesSinSeguimiento.length > 2 ? ` y ${leadsUrgentesSinSeguimiento.length - 2} más` : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-200">Sin leads nuevos sin contactar</p>
            </div>
          )}
          {cotPorVencer.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <Clock className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-200 font-medium">{cotPorVencer.length} cotizaciones vencen en ≤5 días</p>
                <p className="text-xs text-red-300/60">{cotPorVencer.slice(0,2).map(c => c.empresa).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WhatsApp rápido */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">WhatsApp Directo al Equipo</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => sendWA('joaquin')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-green-600/15 border border-green-500/25 hover:bg-green-600/25 transition-colors text-left"
          >
            <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Joaquín</p>
              <p className="text-xs text-white/40">Abrir WhatsApp</p>
            </div>
            <ExternalLink className="w-3 h-3 text-white/20 ml-auto" />
          </button>
          <button
            onClick={() => sendWA('carlos')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-green-600/15 border border-green-500/25 hover:bg-green-600/25 transition-colors text-left"
          >
            <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Carlos</p>
              <p className="text-xs text-white/40">Abrir WhatsApp</p>
            </div>
            <ExternalLink className="w-3 h-3 text-white/20 ml-auto" />
          </button>
        </div>
      </section>

      {/* Email rápido */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Enviar Email Interno</h3>
        <div className="space-y-2">
          <Input
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
            placeholder="destinatario@peyuchile.cl"
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
          />
          <Textarea
            value={emailMsg}
            onChange={e => setEmailMsg(e.target.value)}
            placeholder="Mensaje..."
            rows={3}
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30 resize-none"
          />
          <Button
            onClick={sendEmail}
            disabled={!emailTo || !emailMsg || sending}
            className="w-full bg-teal-600 hover:bg-teal-500"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            {sent ? '¡Enviado!' : 'Enviar Email'}
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── Modal detalle Lead ──────────────────────────────────────────────────────
function LeadModal({ lead, onClose }) {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">{lead.company_name || lead.contact_name}</h3>
            <p className="text-xs text-white/40 mt-0.5">{lead.source} · {lead.status}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {[
            ['Contacto', lead.contact_name],
            ['Email', lead.email],
            ['Teléfono', lead.phone],
            ['Producto', lead.product_interest],
            ['Cantidad', lead.qty_estimate ? `${fmtNum(lead.qty_estimate)} u` : null],
            ['Fecha requerida', lead.delivery_date],
            ['Lead Score', lead.lead_score ? `${lead.lead_score}/100` : null],
            ['Notas', lead.notes],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <span className="text-xs text-white/40 flex-shrink-0">{k}</span>
              <span className="text-xs text-white/80 text-right">{v}</span>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-white/10 flex gap-2">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex-1">
              <Button variant="outline" className="w-full border-white/15 text-white/70 hover:text-white text-xs">
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
              </Button>
            </a>
          )}
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-500 text-xs">
                <Phone className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
              </Button>
            </a>
          )}
          <Button onClick={onClose} variant="ghost" className="text-white/40 hover:text-white px-3">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function AgenteCentral() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [crm, setCrm] = useState({ leads: [], cotizaciones: [], pedidos: [], productos: [] });
  const [activeTab, setActiveTab] = useState('agente');
  const [selectedLead, setSelectedLead] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [leads, cotizaciones, pedidos, productos] = await Promise.all([
      base44.entities.B2BLead.list('-created_date', 100),
      base44.entities.CorporateProposal.list('-created_date', 50),
      base44.entities.PedidoWeb.list('-created_date', 50),
      base44.entities.Producto.filter({ activo: true }, '-updated_date', 50),
    ]);

    setCrm({ leads: leads || [], cotizaciones: cotizaciones || [], pedidos: pedidos || [], productos: productos || [] });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  // KPIs calculados
  const leadsActivos = crm.leads.filter(l => !['Aceptado','Perdido'].includes(l.status)).length;
  const cotAbiertas = crm.cotizaciones.filter(c => c.status === 'Enviada').length;
  const pedidosEnCurso = crm.pedidos.filter(p => !['Entregado','Cancelado'].includes(p.estado)).length;
  const leadsNuevos = crm.leads.filter(l => l.status === 'Nuevo').length;
  const ventasMes = crm.pedidos
    .filter(p => {
      const f = new Date(p.fecha || p.created_date);
      return f.getMonth() === new Date().getMonth() && f.getFullYear() === new Date().getFullYear();
    })
    .reduce((s, p) => s + (p.total || 0), 0);
  const tasaCierre = crm.leads.length > 0
    ? Math.round((crm.leads.filter(l => l.status === 'Aceptado').length / crm.leads.length) * 100)
    : 0;

  const TABS = [
    { id: 'agente', label: '🐢 Agente', icon: Bot },
    { id: 'leads', label: '🎯 Leads', badge: leadsNuevos || null },
    { id: 'cotizaciones', label: '📄 Cotizaciones', badge: cotAbiertas || null },
    { id: 'pedidos', label: '📦 Pedidos', badge: pedidosEnCurso || null },
    { id: 'acciones', label: '⚡ Acciones' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900/60 to-slate-900 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xl">
              🐢
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-jakarta">Centro de Comando Admin</h1>
              <p className="text-xs text-white/40">Agente IA · CRM en tiempo real · Acciones directas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">🔒 Admin Only</Badge>
            <Button
              onClick={() => loadData(true)}
              variant="ghost"
              size="icon"
              className="text-white/40 hover:text-white w-8 h-8"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 px-6 py-4 border-b border-white/10 bg-slate-900/40">
        <KPICard label="Pipeline B2B" value={fmtNum(leadsActivos)} sub="leads activos" icon={Users} color="teal" loading={loading} />
        <KPICard label="Cotizaciones" value={fmtNum(cotAbiertas)} sub="enviadas abiertas" icon={FileText} color="purple" loading={loading} />
        <KPICard label="Pedidos" value={fmtNum(pedidosEnCurso)} sub="en curso" icon={Package} color="blue" loading={loading} />
        <KPICard label="Leads nuevos" value={fmtNum(leadsNuevos)} sub="sin contactar" icon={Target} color={leadsNuevos > 0 ? 'amber' : 'green'} loading={loading} />
        <KPICard label="Ventas mes" value={fmtCLP(ventasMes)} sub={new Date().toLocaleString('es-CL', { month: 'long' })} icon={DollarSign} color="green" loading={loading} />
        <KPICard label="Tasa cierre" value={`${tasaCierre}%`} sub="B2B histórico" icon={Percent} color="teal" loading={loading} />
      </div>

      {/* Tabs nav */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-white/10 bg-slate-900/20 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-teal-600/20 border border-teal-500/30 text-teal-300'
                : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full gap-3 text-white/30">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando datos del CRM...</span>
          </div>
        ) : (
          <>
            {activeTab === 'agente' && <TabAgente crm={crm} />}
            {activeTab === 'leads' && <TabLeads leads={crm.leads} onSelectLead={setSelectedLead} />}
            {activeTab === 'cotizaciones' && <TabCotizaciones cotizaciones={crm.cotizaciones} />}
            {activeTab === 'pedidos' && <TabPedidos pedidos={crm.pedidos} />}
            {activeTab === 'acciones' && <TabAcciones crm={crm} />}
          </>
        )}
      </div>

      {/* Modal detalle lead */}
      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}