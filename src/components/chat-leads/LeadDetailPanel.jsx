// Panel de detalle completo de un ChatLead — datos, estado, notas, conversación
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Mail, Phone, Building2, User, Package, Calendar, FileText,
  MessageSquare, Loader2, X, ExternalLink, Tag,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LeadStatusBadge from './LeadStatusBadge';
import LeadNotasRapidas from './LeadNotasRapidas';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPO_STYLES = {
  'B2B': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'B2C': { bg: '#FDF2F8', color: '#BE185D', border: '#F9A8D4' },
  'Sin clasificar': { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
};

const CAMPOS = [
  { key: 'nombre', label: 'Nombre', icon: User },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'telefono', label: 'Teléfono', icon: Phone },
  { key: 'empresa', label: 'Empresa', icon: Building2 },
  { key: 'rut', label: 'RUT', icon: FileText },
  { key: 'cantidad_estimada', label: 'Cantidad', icon: Package },
  { key: 'fecha_requerida', label: 'Fecha req.', icon: Calendar },
  { key: 'producto_interes_nombre', label: 'Producto', icon: Tag },
];

const TABS = [
  { id: 'datos', label: 'Datos' },
  { id: 'notas', label: 'Notas' },
  { id: 'chat', label: 'Conversación' },
];

export default function LeadDetailPanel({ lead, onClose, onLeadChange }) {
  const [tab, setTab] = useState('datos');
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  const tipoStyle = TIPO_STYLES[lead?.tipo] || TIPO_STYLES['Sin clasificar'];
  const lastAt = lead?.ultimo_mensaje_at
    ? formatDistanceToNow(new Date(lead.ultimo_mensaje_at), { locale: es, addSuffix: true })
    : null;

  useEffect(() => {
    if (tab !== 'chat' || !lead?.conversation_id) return;
    setLoadingChat(true);
    base44.functions
      .invoke('getChatConversation', { conversation_id: lead.conversation_id })
      .then(res => setMessages(res?.data?.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingChat(false));
  }, [tab, lead?.conversation_id]);

  const handleEstadoChange = async (nuevoEstado) => {
    setUpdatingEstado(true);
    await base44.entities.ChatLead.update(lead.id, { estado: nuevoEstado });
    onLeadChange({ ...lead, estado: nuevoEstado });
    setUpdatingEstado(false);
  };

  if (!lead) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ background: tipoStyle.bg, color: tipoStyle.color, borderColor: tipoStyle.border }}>
              {lead.tipo}
            </span>
            <LeadStatusBadge
              estado={lead.estado}
              onChange={handleEstadoChange}
            />
            {updatingEstado && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Nombre principal + score */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {lead.nombre || lead.empresa || 'Visitante anónimo'}
            </h2>
            {lead.empresa && lead.nombre && (
              <p className="text-sm text-slate-500">{lead.empresa}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-emerald-600">{lead.score || 0}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">score</div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          )}
          {lead.telefono && (
            <a href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
              <Phone className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
          {lastAt && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
              <MessageSquare className="w-3 h-3" />
              {lead.mensajes_count || 0} msgs · {lastAt}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-slate-100 px-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* TAB: Datos */}
        {tab === 'datos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {CAMPOS.map(c => (
                <div key={c.key} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <c.icon className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{c.label}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lead[c.key] || <span className="text-slate-300 font-normal">—</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Datos capturados progresivamente */}
            {Array.isArray(lead.datos_capturados) && lead.datos_capturados.filter(d => d.campo !== '_nota').length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Log de captura</p>
                <div className="space-y-1.5">
                  {lead.datos_capturados.filter(d => d.campo !== '_nota').map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-600 w-20 flex-shrink-0">{d.campo}</span>
                      <span className="text-slate-800 truncate flex-1">{d.valor}</span>
                      {d.at && (
                        <span className="text-slate-400 flex-shrink-0 text-[10px]">
                          {formatDistanceToNow(new Date(d.at), { locale: es, addSuffix: true })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lead.page_origen && (
              <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Origen: <span className="font-mono text-slate-700">{lead.page_origen}</span></span>
              </div>
            )}
          </div>
        )}

        {/* TAB: Notas */}
        {tab === 'notas' && (
          <LeadNotasRapidas lead={lead} onUpdate={onLeadChange} />
        )}

        {/* TAB: Conversación */}
        {tab === 'chat' && (
          <div>
            {loadingChat ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando conversación…
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10 italic">No hay mensajes disponibles.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-slate-100 border border-slate-200 ml-4'
                      : 'bg-emerald-50 border border-emerald-100 mr-4'
                  }`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-slate-500">
                      {m.role === 'user' ? '👤 Cliente' : '🐢 Peyu'}
                    </p>
                    <div className="prose prose-sm max-w-none prose-p:my-0.5 text-slate-800">
                      <ReactMarkdown>{m.content || ''}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}