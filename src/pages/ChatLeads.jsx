// ============================================================================
// /admin/chat-leads — Vista unificada: lista + detalle en paneles paralelos
// Lista de leads a la izquierda, detalle con estado/notas/chat a la derecha.
// ============================================================================
import { useEffect, useMemo, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import {
  MessageSquare, Search, Loader2, TrendingUp, Users, Star, Filter,
} from 'lucide-react';
import ChatLeadRow from '@/components/chat-leads/ChatLeadRow';
import LeadDetailPanel from '@/components/chat-leads/LeadDetailPanel';

const TIPO_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'B2B', label: 'B2B' },
  { key: 'B2C', label: 'B2C' },
  { key: 'Sin clasificar', label: 'Sin clasificar' },
];

const ESTADO_FILTERS = ['Todos', 'Activo', 'Calificado', 'Convertido', 'Abandonado', 'Descartado'];

export default function ChatLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoTab, setTipoTab] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.entities.ChatLead.list('-ultimo_mensaje_at', 200)
      .then(data => { if (alive) setLeads(data || []); })
      .catch(() => { if (alive) setLeads([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = leads;
    if (tipoTab !== 'todos') list = list.filter(l => l.tipo === tipoTab);
    if (estadoFilter !== 'Todos') list = list.filter(l => l.estado === estadoFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        [l.nombre, l.email, l.telefono, l.empresa, l.ultimo_mensaje_preview]
          .filter(Boolean).some(v => v.toLowerCase().includes(q))
      );
    }
    return list;
  }, [leads, tipoTab, estadoFilter, search]);

  const stats = useMemo(() => ({
    total: leads.length,
    conDatos: leads.filter(l => l.email || l.telefono || l.nombre).length,
    b2b: leads.filter(l => l.tipo === 'B2B').length,
    calificados: leads.filter(l => l.estado === 'Calificado' || l.estado === 'Convertido').length,
  }), [leads]);

  const handleLeadChange = useCallback((updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLead(updated);
  }, []);

  const counts = useMemo(() => {
    const map = { todos: leads.length };
    ['B2B', 'B2C', 'Sin clasificar'].forEach(t => {
      map[t] = leads.filter(l => l.tipo === t).length;
    });
    return map;
  }, [leads]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ── TOPBAR ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Leads del Chat</h1>
              <p className="text-xs text-slate-500">Captura progresiva desde Peyu · {leads.length} conversaciones</p>
            </div>
          </div>

          {/* KPIs inline */}
          <div className="flex items-center gap-4">
            <KpiInline icon={Users} label="Total" value={stats.total} />
            <KpiInline icon={TrendingUp} label="Con datos" value={stats.conDatos} color="emerald" />
            <KpiInline icon={Star} label="B2B" value={stats.b2b} color="blue" />
            <KpiInline icon={Filter} label="Calificados" value={stats.calificados} color="amber" />
          </div>
        </div>
      </div>

      {/* ── LAYOUT PRINCIPAL: lista | detalle ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── PANEL IZQUIERDO: filtros + lista ── */}
        <div className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
          selectedLead ? 'w-80 lg:w-96 flex-shrink-0' : 'flex-1 max-w-2xl mx-auto'
        }`}>
          {/* Filtros */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, email, empresa…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>

            {/* Tipo tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {TIPO_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTipoTab(t.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    tipoTab === t.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label} {counts[t.key] !== undefined ? `(${counts[t.key]})` : ''}
                </button>
              ))}
            </div>

            {/* Estado filter */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {ESTADO_FILTERS.map(e => (
                <button
                  key={e}
                  onClick={() => setEstadoFilter(e)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    estadoFilter === e
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando leads…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay leads con estos filtros.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filtered.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`cursor-pointer rounded-2xl transition-all ${
                      selectedLead?.id === lead.id
                        ? 'ring-2 ring-emerald-400 ring-offset-1'
                        : ''
                    }`}
                  >
                    <ChatLeadRow lead={lead} onClick={() => setSelectedLead(lead)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL DERECHO: detalle ── */}
        {selectedLead ? (
          <div className="flex-1 min-w-0 overflow-hidden">
            <LeadDetailPanel
              key={selectedLead.id}
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onLeadChange={handleLeadChange}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">Selecciona un lead para ver el detalle</p>
              <p className="text-xs text-slate-300 mt-1">Estado, notas y conversación completa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiInline({ icon: Icon, label, value, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-700',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="text-center hidden sm:block">
      <p className={`text-xl font-bold leading-none ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}