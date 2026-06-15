import { useState, useEffect, useMemo, useCallback } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { base44 } from '@/api/base44Client';
import { MessageSquare, GripVertical, Loader2 } from 'lucide-react';
import ConvFilters from '@/components/centro-mensajes/ConvFilters';
import ConvRow from '@/components/centro-mensajes/ConvRow';
import ConvDetail from '@/components/centro-mensajes/ConvDetail';
// ════════════════════════════════════════════════════════════════════════
// /admin/mensajes — Centro de Mensajes Unificado PEYU
// Bandeja multi-canal profesional (tipo Intercom/Zendesk):
//   🔵 Web  · Chat del vendedor Peyu (ChatLeads)
//   🟢 WhatsApp · Agente whatsapp_peyu
//   🔴 Gmail · Bandeja de entrada (conector Gmail)
//   🩷 Instagram · (conector autorizado)
//   🔷 LinkedIn · (conector autorizado)
//
// Features:
//   · Paneles redimensionables (drag handle)
//   · Responder a cualquier canal
//   · Asistente IA para redactar respuestas
//   · Filtros multicanal + acciones rápidas
// ════════════════════════════════════════════════════════════════════════

export default function CentroMensajes() {
  const [channel, setChannel] = useState('todos');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [tipo, setTipo] = useState('Todos');

  const [chatLeads, setChatLeads] = useState([]);
  const [whatsappConvs, setWhatsappConvs] = useState([]);
  const [gmailThreads, setGmailThreads] = useState([]);
  const [loadingCL, setLoadingCL] = useState(true);
  const [loadingWA, setLoadingWA] = useState(true);
  const [loadingGM, setLoadingGM] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Carga de datos ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [cl, wa] = await Promise.all([
        base44.entities.ChatLead.list('-ultimo_mensaje_at', 200),
        base44.agents.listConversations({ agent_name: 'whatsapp_peyu' }),
      ]);
      setChatLeads(cl || []);
      setWhatsappConvs(wa || []);
    } catch {}
    setLoadingCL(false);
    setLoadingWA(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  useEffect(() => { loadGmail(); }, []); // eslint-disable-line

  // Auto-refresh cada 30s
  useEffect(() => {
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, [loadData]);

  // ── Unificar conversaciones ──────────────────────────────────────────
  const unified = useMemo(() => {
    const items = [];

    chatLeads.forEach(lead => {
      items.push({
        id: lead.id, _type: 'chatlead', channel: 'web', channelLabel: 'Web',
        nombre: lead.nombre || 'Visitante', email: lead.email || '',
        telefono: lead.telefono || '', empresa: lead.empresa || '',
        tipo: lead.tipo || 'Sin clasificar', estado: lead.estado || 'Activo',
        ultimoMensaje: lead.ultimo_mensaje_preview || '',
        ultimoAt: lead.ultimo_mensaje_at || '', mensajesCount: lead.mensajes_count || 0,
        score: lead.score || 0, conversation_id: lead.conversation_id, raw: lead,
      });
    });

    whatsappConvs.forEach(conv => {
      const meta = conv.metadata || {};
      const lastMsg = conv.messages?.[conv.messages.length - 1];
      items.push({
        id: conv.id, _type: 'whatsapp', channel: 'whatsapp', channelLabel: 'WhatsApp',
        nombre: meta.name || `Cliente ${conv.id?.slice(-6)}`,
        email: meta.email || '', telefono: meta.phone || '', empresa: '',
        tipo: 'Sin clasificar', estado: 'Activo',
        ultimoMensaje: lastMsg?.content?.slice(0, 140) || '',
        ultimoAt: lastMsg?.at || conv.updated_date || conv.created_date || '',
        mensajesCount: conv.messages?.length || 0, score: 0, raw: conv,
      });
    });

    gmailThreads.forEach(thread => {
      items.push({
        id: thread.id || thread.threadId || `gmail-${Math.random()}`,
        _type: 'gmail', channel: 'gmail', channelLabel: 'Gmail',
        nombre: thread.from_name || thread.from || 'Remitente',
        email: thread.from_email || thread.from || '', telefono: '', empresa: '',
        tipo: 'Sin clasificar',
        estado: thread.read ? 'Calificado' : 'Activo',
        ultimoMensaje: (thread.snippet || thread.subject || '').slice(0, 140),
        ultimoAt: thread.date || thread.at || new Date().toISOString(),
        mensajesCount: thread.messageCount || 1, score: 0, raw: thread,
        asunto: thread.subject || '',
      });
    });

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
    total: unified.length, web: unified.filter(c => c.channel === 'web').length,
    whatsapp: unified.filter(c => c.channel === 'whatsapp').length,
    gmail: unified.filter(c => c.channel === 'gmail').length,
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
      await loadData();
      setSelected(prev => prev?.id === item.id ? { ...item, ...data } : prev);
    } catch {}
    finally { setActionLoading(null); }
  };

  const loading = loadingCL || loadingWA;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* ── TOPBAR ── */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <MessageSquare className="w-[18px] h-[18px] text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 leading-tight">Centro de Mensajes</h1>
              <p className="text-xs text-slate-400">{stats.total} conversaciones · {stats.activos} activas{stats.noLeidos > 0 ? ` · ${stats.noLeidos} sin leer` : ''}</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-3 flex-wrap">
            <KPI label="Total" value={stats.total} />
            <KPI label="Web" value={stats.web} color="emerald" />
            <KPI label="WhatsApp" value={stats.whatsapp} color="green" />
            <KPI label="Gmail" value={stats.gmail} color="red" />
            <KPI label="B2B" value={stats.b2b} color="blue" />
          </div>
        </div>
      </header>

      {/* ── BODY: Paneles redimensionables ── */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" autoSaveId="centro-mensajes-layout">
          {/* Panel izquierdo: filtros + lista */}
          <Panel defaultSize={selected ? 38 : 60} minSize={28} maxSize={65}>
            <div className="flex flex-col h-full bg-slate-900/50 border-r border-slate-800">
              <ConvFilters
                channel={channel} setChannel={setChannel}
                search={search} setSearch={setSearch}
                tipo={tipo} setTipo={setTipo}
                estado={estado} setEstado={setEstado}
                loadingGM={loadingGM}
              />

              {/* Lista */}
              <div className="flex-1 overflow-y-auto peyu-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando conversaciones…
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No hay conversaciones con estos filtros.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-0.5">
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
          </Panel>

          {/* Drag handle */}
          <PanelResizeHandle className="w-1.5 bg-slate-800 hover:bg-emerald-600/50 active:bg-emerald-600 transition-colors flex items-center justify-center group">
            <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100" />
          </PanelResizeHandle>

          {/* Panel derecho: detalle */}
          <Panel defaultSize={selected ? 62 : 40} minSize={35}>
            {selected ? (
              <ConvDetail
                item={selected}
                onClose={() => setSelected(null)}
                onAction={handleLeadAction}
                actionLoading={actionLoading}
                onRefresh={loadData}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900/30">
                <div className="text-center max-w-xs">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">Centro de Mensajes PEYU</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Web · WhatsApp · Gmail · Instagram · LinkedIn.<br />
                    Todas tus conversaciones en un solo lugar.
                  </p>
                  <p className="text-xs text-slate-600 mt-3">
                    Selecciona una conversación para ver el detalle y responder.
                  </p>
                  {stats.noLeidos > 0 && (
                    <p className="text-xs text-red-400 font-bold mt-2">{stats.noLeidos} emails sin leer en Gmail</p>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

// ── Mini KPI ───────────────────────────────────────────────────────────
function KPI({ label, value, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-200',
    emerald: 'text-emerald-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
  };
  return (
    <div className="text-center">
      <p className={`text-lg font-bold leading-none ${colors[color]}`}>{value}</p>
      <p className="text-[9px] text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}