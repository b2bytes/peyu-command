// ============================================================================
// /admin/chat-leads — Captura progresiva de leads desde el chat de Peyu
// ----------------------------------------------------------------------------
// Muestra todos los ChatLead agrupados por tipo (B2B / B2C / Sin clasificar).
// Cada lead se enriquece turn a turn con cualquier dato que el visitante
// mencione en el chat. Click → drawer con la conversación completa.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Search, Loader2, TrendingUp } from 'lucide-react';
import ChatLeadRow from '@/components/chat-leads/ChatLeadRow';
import ChatLeadDrawer from '@/components/chat-leads/ChatLeadDrawer';

export default function ChatLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.ChatLead.list('-ultimo_mensaje_at', 200)
      .then(data => { if (alive) setLeads(data || []); })
      .catch(() => { if (alive) setLeads([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      [l.nombre, l.email, l.telefono, l.empresa, l.ultimo_mensaje_preview]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(q))
    );
  }, [leads, search]);

  const groups = useMemo(() => ({
    todos: filtered,
    b2b: filtered.filter(l => l.tipo === 'B2B'),
    b2c: filtered.filter(l => l.tipo === 'B2C'),
    sin: filtered.filter(l => l.tipo === 'Sin clasificar'),
  }), [filtered]);

  const stats = useMemo(() => ({
    total: leads.length,
    conDatos: leads.filter(l => l.email || l.telefono || l.nombre).length,
    b2b: leads.filter(l => l.tipo === 'B2B').length,
    b2c: leads.filter(l => l.tipo === 'B2C').length,
  }), [leads]);

  const openLead = (lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-600" />
          Leads del Chat Peyu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Captura progresiva: cada mensaje del visitante enriquece su lead automáticamente.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Conversaciones" value={stats.total} icon={MessageSquare} />
        <KpiCard label="Con datos" value={stats.conDatos} icon={TrendingUp} accent="emerald" />
        <KpiCard label="B2B" value={stats.b2b} accent="blue" />
        <KpiCard label="B2C" value={stats.b2c} accent="pink" />
      </div>

      {/* Buscador */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, email, empresa…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs por tipo */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todos ({groups.todos.length})</TabsTrigger>
          <TabsTrigger value="b2b">B2B ({groups.b2b.length})</TabsTrigger>
          <TabsTrigger value="b2c">B2C ({groups.b2c.length})</TabsTrigger>
          <TabsTrigger value="sin">Sin clasificar ({groups.sin.length})</TabsTrigger>
        </TabsList>

        {Object.entries(groups).map(([key, list]) => (
          <TabsContent key={key} value={key} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando leads…
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay conversaciones en este grupo.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {list.map(lead => (
                  <ChatLeadRow key={lead.id} lead={lead} onClick={openLead} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ChatLeadDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent = 'slate' }) {
  const colorMap = {
    slate: 'text-slate-700',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    pink: 'text-pink-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && <Icon className={`w-3.5 h-3.5 ${colorMap[accent]}`} />}
      </div>
      <p className={`text-2xl font-bold ${colorMap[accent]}`}>{value}</p>
    </div>
  );
}