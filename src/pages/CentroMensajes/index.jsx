import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  MessageSquare, Search, Loader2, Star,
  Phone, Globe, ArrowRight, Clock, X,
  Instagram, Linkedin, CheckCheck, Archive, Mail, ShoppingCart,
  UserCheck, Send, Reply, Eye, Trash2,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /admin/mensajes — Centro de Mensajes Unificado PEYU
// Agrupa TODAS las conversaciones en una sola bandeja:
//   🔵 Web  · Chat del vendedor Peyu (ChatLeads)
//   🟢 WhatsApp · Agente whatsapp_peyu
//   🔴 Gmail · Bandeja de entrada (conector Gmail autorizado)
//   🩷 Instagram · DM (conector autorizado, próximamente)
//   🔷 LinkedIn · Mensajes (conector autorizado, próximamente)
//
// Acciones rápidas: archivar, marcar como leído, responder, ver pedidos.
// ════════════════════════════════════════════════════════════════════════

const CHANNELS = [
  { key: 'todos',      label: 'Todos',       icon: Globe,          color: 'slate' },
  { key: 'web',        label: 'Web',         icon: MessageSquare,  color: 'emerald' },
  { key: 'whatsapp',   label: 'WhatsApp',    icon: Phone,          color: 'green' },
  { key: 'gmail',      label: 'Gmail',       icon: Mail,           color: 'red' },
  { key: 'instagram',  label: 'Instagram',   icon: Instagram,      color: 'pink' },
  { key: 'linkedin',   label: 'LinkedIn',    icon: Linkedin,       color: 'blue' },
];

const ESTADO_FILTERS = ['Todos', 'Activo', 'Calificado', 'Convertido', 'Abandonado', 'Descartado'];
const TIPO_FILTERS = ['Todos', 'B2B', 'B2C', 'Sin clasificar'];

export default function CentroMensajes() {
  const [channel, setChannel] = useState('todos');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [tipo, setTipo] = useState('Todos');

  // ── Datos de cada canal ──────────────────────────────────────────────
  const [chatLeads, setChatLeads] = useState([]);
  const [whatsappConvs, setWhatsappConvs] = useState([]);
  const [gmailThreads, setGmailThreads] = useState([]);
  const [loadingCL, setLoadingCL] = useState(true);
  const [loadingWA, setLoadingWA] = useState(true);
  const [loadingGM, setLoadingGM] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Cargar ChatLeads (web)
  useEffect(() => {
    base44.entities.ChatLead.list('-ultimo_mensaje_at', 200)
      .then(d => setChatLeads(d || []))
      .catch(() => setChatLeads([]))
      .finally(() => setLoadingCL(false));
  }, []);

  // Cargar WhatsApp
  useEffect(() => {
    base44.agents.listConversations({ agent_name: 'whatsapp_peyu' })
      .then(d => setWhatsappConvs(d || []))
      .catch(() => setWhatsappConvs([]))
      .finally(() => setLoadingWA(false));
  }, []);

  // Cargar Gmail (recientes)
  const loadGmail = useCallback(async () => {
    if (loadingGM) return;
    setLoadingGM(true);
    try {
      const res = await base44.functions.invoke('ingestGmailInquiry', { max: 30 });
      const threads = res?.data?.threads || res?.data || [];
      setGmailThreads(Array.isArray(threads) ? threads : []);
    } catch { setGmailThreads([]); }
    finally { setLoadingGM(false); }
  }, [loadingGM]);

  useEffect(() => { loadGmail(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresco automático cada 30s
  useEffect(() => {
    const t = setInterval(() => {
      base44.entities.ChatLead.list('-ultimo_mensaje_at', 200)
        .then(d => setChatLeads(d || []))
        .catch(() => {});
      base44.agents.listConversations({ agent_name: 'whatsapp_peyu' })
        .then(d => setWhatsappConvs(d || []))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // ── Unificar conversaciones ──────────────────────────────────────────
  const unified = useMemo(() => {
    const items = [];

    // ChatLeads → formato unificado
    chatLeads.forEach(lead => {
      items.push({
        id: lead.id,
        _type: 'chatlead',
        channel: 'web',
        channelLabel: 'Web',
        channelColor: 'emerald',
        nombre: lead.nombre || 'Visitante',
        email: lead.email || '',
        telefono: lead.telefono || '',
        empresa: lead.empresa || '',
        tipo: lead.tipo || 'Sin clasificar',
        estado: lead.estado || 'Activo',
        ultimoMensaje: lead.ultimo_mensaje_preview || '',
        ultimoAt: lead.ultimo_mensaje_at || '',
        mensajesCount: lead.mensajes_count || 0,
        score: lead.score || 0,
        conversation_id: lead.conversation_id,
        raw: lead,
      });
    });

    // WhatsApp → formato unificado
    whatsappConvs.forEach(conv => {
      const meta = conv.metadata || {};
      const lastMsg = conv.messages?.[conv.messages.length - 1];
      items.push({
        id: conv.id,
        _type: 'whatsapp',
        channel: 'whatsapp',
        channelLabel: 'WhatsApp',
        channelColor: 'green',
        nombre: meta.name || `Cliente ${conv.id?.slice(-6)}`,
        email: meta.email || '',
        telefono: meta.phone || '',
        empresa: '',
        tipo: 'Sin clasificar',
        estado: 'Activo',
        ultimoMensaje: lastMsg?.content?.slice(0, 140) || '',
        ultimoAt: lastMsg?.at || conv.updated_date || conv.created_date || '',
        mensajesCount: conv.messages?.length || 0,
        score: 0,
        raw: conv,
      });
    });

    // Gmail → formato unificado
    gmailThreads.forEach(thread => {
      items.push({
        id: thread.id || thread.threadId || `gmail-${Math.random()}`,
        _type: 'gmail',
        channel: 'gmail',
        channelLabel: 'Gmail',
        channelColor: 'red',
        nombre: thread.from_name || thread.from || 'Remitente',
        email: thread.from_email || thread.from || '',
        telefono: '',
        empresa: '',
        tipo: 'Sin clasificar',
        estado: thread.read ? 'Leído' : 'Activo',
        ultimoMensaje: (thread.snippet || thread.subject || '').slice(0, 140),
        ultimoAt: thread.date || thread.at || new Date().toISOString(),
        mensajesCount: thread.messageCount || 1,
        score: 0,
        raw: thread,
        asunto: thread.subject || '',
      });
    });

    // Ordenar por más reciente
    items.sort((a, b) => new Date(b.ultimoAt || 0) - new Date(a.ultimoAt || 0));
    return items;
  }, [chatLeads, whatsappConvs, gmailThreads]);

  // ── Filtros ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = unified;
    if (channel !== 'todos') list = list.filter(c => c.channel === channel);
    if (estado !== 'Todos') list = list.filter(c => c.estado === estado);
    if (tipo !== 'Todos') list = list.filter(c => c.tipo === tipo);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        [c.nombre, c.email, c.telefono, c.empresa, c.ultimoMensaje, c.asunto]
          .filter(Boolean).some(v => v.toLowerCase().includes(q))
      );
    }
    return list;
  }, [unified, channel, estado, tipo, search]);

  const stats = useMemo(() => ({
    total: unified.length,
    web: unified.filter(c => c.channel === 'web').length,
    whatsapp: unified.filter(c => c.channel === 'whatsapp').length,
    gmail: unified.filter(c => c.channel === 'gmail').length,
    conNombre: unified.filter(c => c.nombre && c.nombre !== 'Visitante').length,
    b2b: unified.filter(c => c.tipo === 'B2B').length,
    activos: unified.filter(c => c.estado === 'Activo').length,
    noLeidos: gmailThreads.filter(t => !t.read).length,
  }), [unified, gmailThreads]);

  const handleSelect = async (item) => {
    if (item._type === 'whatsapp') {
      const full = await base44.agents.getConversation(item.id).catch(() => item.raw);
      setSelected({ ...item, raw: full || item.raw });
    } else {
      setSelected(item);
    }
  };

  // Acciones rápidas sobre ChatLeads
  const handleLeadAction = async (item, accion) => {
    if (item._type !== 'chatlead' || !item.id) return;
    setActionLoading(`${item.id}-${accion}`);
    const updates = {
      calificar: { estado: 'Calificado' },
      archivar: { estado: 'Abandonado' },
      descartar: { estado: 'Descartado' },
      convertir_b2b: { tipo: 'B2B' },
      convertir_b2c: { tipo: 'B2C', estado: 'Convertido' },
    };
    try {
      const data = updates[accion];
      if (data) await base44.entities.ChatLead.update(item.id, data);
      // Refrescar lista
      const refreshed = await base44.entities.ChatLead.list('-ultimo_mensaje_at', 200);
      setChatLeads(refreshed || []);
      setSelected(prev => prev?.id === item.id ? { ...item, ...data } : prev);
    } catch {}
    finally { setActionLoading(null); }
  };

  const loading = loadingCL || loadingWA;
  const hasActions = selected?._type === 'chatlead';

  return (
    <div className="flex flex-col h-screen bg-ld-bg">
      {/* ── TOPBAR ── */}
      <div className="flex-shrink-0 bg-ld-bg-elevated border-b border-ld-border px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <MessageSquare className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ld-fg leading-tight">Centro de Mensajes</h1>
              <p className="text-xs text-ld-fg-muted">{stats.total} conversaciones · {stats.activos} activas</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <MiniKPI icon={Globe} label="Total" value={stats.total} />
            <MiniKPI icon={MessageSquare} label="Web" value={stats.web} color="emerald" />
            <MiniKPI icon={Phone} label="WhatsApp" value={stats.whatsapp} color="green" />
            <MiniKPI icon={Mail} label="Gmail" value={stats.gmail} color="red" />
            <MiniKPI icon={Star} label="B2B" value={stats.b2b} color="blue" />
          </div>
        </div>
      </div>

      {/* ── BODY: lista | detalle ── */}
      <div className="flex flex-1 min-h-0">
        {/* Panel izquierdo: filtros + lista */}
        <div className={`flex flex-col border-r border-ld-border bg-ld-bg-elevated transition-all duration-200 ${
          selected ? 'w-80 lg:w-96 flex-shrink-0' : 'flex-1 max-w-2xl mx-auto'
        }`}>
          {/* Filtros */}
          <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-b border-ld-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ld-fg-muted" />
              <input
                placeholder="Buscar por nombre, email, empresa…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-ld-bg border border-ld-border text-ld-fg placeholder:text-ld-fg-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Canales — scroll horizontal */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {CHANNELS.map(ch => (
                <button
                  key={ch.key}
                  onClick={() => setChannel(ch.key)}
                  className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    channel === ch.key
                      ? 'bg-ld-fg text-ld-bg'
                      : 'bg-ld-bg border border-ld-border text-ld-fg-muted hover:bg-ld-bg-soft'
                  }`}
                >
                  <ch.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{ch.label}</span>
                </button>
              ))}
            </div>

            {/* Tipo + Estado */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {TIPO_FILTERS.map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    tipo === t ? 'bg-emerald-600 text-white' : 'bg-ld-bg border border-ld-border text-ld-fg-muted hover:bg-ld-bg-soft'
                  }`}
                >{t}</button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {ESTADO_FILTERS.map(e => (
                <button
                  key={e}
                  onClick={() => setEstado(e)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    estado === e ? 'bg-amber-600 text-white' : 'bg-ld-bg border border-ld-border text-ld-fg-muted hover:bg-ld-bg-soft'
                  }`}
                >{e}</button>
              ))}
            </div>

            {loadingGM && (
              <div className="flex items-center gap-2 text-[10px] text-ld-fg-muted">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando Gmail…
              </div>
            )}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto peyu-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-ld-fg-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando conversaciones…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="w-10 h-10 text-ld-fg-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-ld-fg-muted">No hay conversaciones con estos filtros.</p>
              </div>
            ) : (
              <div className="p-2 sm:p-3 space-y-1">
                {filtered.map(item => (
                  <ConvRow
                    key={item.id}
                    item={item}
                    isSelected={selected?.id === item.id}
                    onClick={() => handleSelect(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: detalle */}
        {selected ? (
          <div className="flex-1 min-w-0 overflow-hidden bg-ld-bg flex flex-col">
            <DetailPanel
              item={selected}
              onClose={() => setSelected(null)}
              onAction={hasActions ? handleLeadAction : undefined}
              actionLoading={actionLoading}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-ld-bg-soft">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-ld-bg-elevated border border-ld-border flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-ld-fg-muted" />
              </div>
              <p className="text-sm font-bold text-ld-fg">Centro de Mensajes PEYU</p>
              <p className="text-xs text-ld-fg-muted mt-1 max-w-sm">
                Web · WhatsApp · Gmail · Instagram · LinkedIn. Todas tus conversaciones en un solo lugar.
              </p>
              {stats.noLeidos > 0 && (
                <p className="text-xs text-red-500 font-bold mt-2">{stats.noLeidos} emails sin leer en Gmail</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fila de conversación ──────────────────────────────────────────────
const CANAL_STYLES = {
  web:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  whatsapp:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  gmail:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  linkedin:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const CANAL_AVATAR_BG = {
  web:       '#0F8B6C15',
  whatsapp:  '#25D36620',
  gmail:     '#EA433520',
  instagram: '#E1306C15',
  linkedin:  '#0A66C215',
};
const CANAL_AVATAR_FG = {
  web:       '#0F8B6C',
  whatsapp:  '#128C7E',
  gmail:     '#EA4335',
  instagram: '#E1306C',
  linkedin:  '#0A66C2',
};

function ConvRow({ item, isSelected, onClick }) {
  const canalColor = CANAL_STYLES[item.channel] || CANAL_STYLES.web;
  const badge = item.channel === 'gmail' && item.asunto
    ? item.asunto
    : item.channelLabel;

  const tipoBadge = item.tipo === 'B2B'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : item.tipo === 'B2C'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  const dateStr = item.ultimoAt
    ? new Date(item.ultimoAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-2.5 sm:p-3 transition-all ${
        isSelected
          ? 'ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900'
          : 'hover:bg-ld-bg-soft'
      }`}
      style={{ background: isSelected ? 'var(--ld-bg-soft)' : 'transparent' }}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar con inicial */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{ background: CANAL_AVATAR_BG[item.channel] || '#0F8B6C15', color: CANAL_AVATAR_FG[item.channel] || '#0F8B6C' }}>
          {(item.nombre || '?')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-bold text-ld-fg truncate">{item.nombre || 'Sin nombre'}</span>
            {item.empresa && <span className="text-[10px] text-ld-fg-muted truncate">· {item.empresa}</span>}
            {item.score > 0 && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {item.score}
              </span>
            )}
          </div>
          <p className="text-[11px] text-ld-fg-muted truncate leading-relaxed">
            {item.ultimoMensaje || 'Sin mensajes'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${canalColor}`}>
              {badge}
            </span>
            {item.tipo !== 'Sin clasificar' && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${tipoBadge}`}>
                {item.tipo}
              </span>
            )}
            <span className="text-[9px] text-ld-fg-muted ml-auto flex-shrink-0">{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panel de detalle ──────────────────────────────────────────────────
function DetailPanel({ item, onClose, onAction, actionLoading }) {
  const [conversation, setConversation] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    if (item._type === 'chatlead' && item.conversation_id) {
      base44.functions.invoke('getChatConversation', { conversation_id: item.conversation_id })
        .then(res => setConversation(res?.data))
        .catch(() => setConversation(null))
        .finally(() => setLoadingDetail(false));
    } else if (item._type === 'whatsapp') {
      setConversation(item.raw);
      setLoadingDetail(false);
    } else {
      setLoadingDetail(false);
    }
  }, [item]);

  const messages = conversation?.messages || [];
  const showActions = !!onAction;

  // Gmail: mostrar vista tipo email
  const isGmail = item._type === 'gmail';

  return (
    <div className="flex flex-col h-full">
      {/* Header detalle */}
      <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-ld-border bg-ld-bg-elevated flex items-center gap-3 flex-wrap">
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-ld-bg-soft transition-colors lg:hidden">
          <X className="w-4 h-4 text-ld-fg-muted" />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: CANAL_AVATAR_BG[item.channel] || '#0F8B6C15', color: CANAL_AVATAR_FG[item.channel] || '#0F8B6C' }}>
          {(item.nombre || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-ld-fg text-sm truncate">{item.nombre || 'Sin nombre'}</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${CANAL_STYLES[item.channel] || CANAL_STYLES.web}`}>
              {item.channelLabel}
            </span>
            {item.asunto && (
              <span className="text-[10px] text-ld-fg-muted truncate hidden sm:inline">· {item.asunto}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-ld-fg-muted mt-0.5 flex-wrap">
            {item.email && <span className="truncate">{item.email}</span>}
            {item.telefono && <span className="truncate">{item.telefono}</span>}
            {item.empresa && <span className="font-semibold truncate">{item.empresa}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {item.tipo === 'B2B' && <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">B2B</span>}
          {item.tipo === 'B2C' && <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">B2C</span>}
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.estado}</span>
          {item.mensajesCount > 0 && (
            <span className="text-[10px] text-ld-fg-muted">{item.mensajesCount} msgs</span>
          )}
        </div>
      </div>

      {/* Barra de acciones rápidas (solo ChatLeads) */}
      {showActions && item._type === 'chatlead' && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-ld-border bg-ld-bg-soft flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <ActionBtn icon={CheckCheck} label="Calificar" loading={actionLoading === `${item.id}-calificar`} onClick={() => onAction(item, 'calificar')} color="emerald" />
          <ActionBtn icon={UserCheck} label="B2B" loading={actionLoading === `${item.id}-convertir_b2b`} onClick={() => onAction(item, 'convertir_b2b')} color="blue" />
          <ActionBtn icon={ShoppingCart} label="B2C" loading={actionLoading === `${item.id}-convertir_b2c`} onClick={() => onAction(item, 'convertir_b2c')} color="amber" />
          <div className="w-px h-5 bg-ld-border mx-1" />
          <ActionBtn icon={Archive} label="Archivar" loading={actionLoading === `${item.id}-archivar`} onClick={() => onAction(item, 'archivar')} color="slate" />
          <ActionBtn icon={Trash2} label="Descartar" loading={actionLoading === `${item.id}-descartar`} onClick={() => onAction(item, 'descartar')} color="red" />
        </div>
      )}

      {/* Cuerpo: conversación */}
      {loadingDetail ? (
        <div className="flex-1 flex items-center justify-center text-ld-fg-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando conversación…
        </div>
      ) : isGmail ? (
        <div className="flex-1 overflow-y-auto peyu-scrollbar px-5 py-4">
          <div className="bg-ld-bg-elevated border border-ld-border rounded-2xl p-5">
            <h3 className="font-bold text-ld-fg mb-1">{item.asunto || '(sin asunto)'}</h3>
            <p className="text-xs text-ld-fg-muted mb-3">
              {item.email} · {item.ultimoAt ? new Date(item.ultimoAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
            <p className="text-sm text-ld-fg-soft whitespace-pre-wrap leading-relaxed">
              {item.ultimoMensaje || '(sin contenido)'}
            </p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Clock className="w-10 h-10 text-ld-fg-muted mb-3 opacity-40" />
          <p className="text-sm font-bold text-ld-fg">Sin mensajes aún</p>
          <p className="text-xs text-ld-fg-muted mt-1">La conversación está vacía o no se pudo cargar.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto peyu-scrollbar px-4 sm:px-5 py-4 space-y-3">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-ld-bg-elevated border border-ld-border text-ld-fg rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content || '(sin contenido)'}</p>
                  {msg.at && (
                    <p className={`text-[9px] mt-1 ${isUser ? 'text-white/60' : 'text-ld-fg-muted'}`}>
                      {new Date(msg.at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Botón de acción rápida ────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, onClick, loading, color = 'emerald' }) {
  const colors = {
    emerald: 'hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400',
    blue: 'hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400',
    amber: 'hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400',
    slate: 'hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400',
    red: 'hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors border border-transparent ${colors[color]} text-ld-fg-muted disabled:opacity-50`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── KPI inline ────────────────────────────────────────────────────────
function MiniKPI({ icon: Icon, label, value, color = 'slate' }) {
  const colors = {
    slate: 'text-ld-fg',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    pink: 'text-pink-600 dark:text-pink-400',
  };
  return (
    <div className="text-center hidden sm:block">
      <p className={`text-xl font-bold leading-none ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-ld-fg-muted uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}