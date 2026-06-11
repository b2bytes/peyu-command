import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Search, Mail, Phone, Flame, Trash2 } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// OpsLeadsPanel — Gestión completa de Leads B2B dentro del Agent OS.
// Cambiar estado, contactar por email/WhatsApp y eliminar — sin salir.
// ════════════════════════════════════════════════════════════════════════

const ESTADOS = ['Nuevo', 'Contactado', 'En revisión', 'Propuesta enviada', 'Aceptado', 'Perdido'];

const ESTADO_DOT = {
  'Nuevo': '#F59E0B',
  'Contactado': '#60A5FA',
  'En revisión': '#A78BFA',
  'Propuesta enviada': '#34D399',
  'Aceptado': '#10B981',
  'Perdido': '#94A3B8',
};

export default function OpsLeadsPanel({ onRefreshAll }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('activos'); // activos | todos
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.B2BLead.list('-created_date', 100).catch(() => []);
    setLeads(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    let lista = leads;
    if (filtro === 'activos') lista = lista.filter((l) => !['Aceptado', 'Perdido'].includes(l.status));
    const q = search.trim().toLowerCase();
    if (q) lista = lista.filter((l) =>
      (l.company_name || '').toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    );
    return lista;
  }, [leads, filtro, search]);

  const cambiarEstado = async (lead, status) => {
    setBusyId(lead.id);
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status } : l));
    await base44.functions.invoke('agentOSAction', { action: 'updateLeadEstado', payload: { id: lead.id, status } }).catch(() => load());
    setBusyId(null);
    onRefreshAll?.();
  };

  const eliminar = async (lead) => {
    if (!confirm(`¿Eliminar el lead de ${lead.company_name}?`)) return;
    setBusyId(lead.id);
    await base44.functions.invoke('agentOSAction', { action: 'eliminarLead', payload: { id: lead.id } }).catch(() => {});
    await load();
    setBusyId(null);
    onRefreshAll?.();
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {[['activos', 'Activos'], ['todos', 'Todos']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filtro === id ? 'ld-btn-primary !border-transparent' : 'ld-btn-ghost text-ld-fg-soft'}`}>
            {label}
          </button>
        ))}
        <div className="flex-1 min-w-[160px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ld-fg-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Empresa, contacto o email…" className="ld-input w-full pl-8 pr-3 py-1.5 text-xs" />
        </div>
        <button onClick={load} className="ld-btn-ghost p-2 rounded-full" title="Refrescar">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-ld-fg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando leads…
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center py-10 text-sm text-ld-fg-muted">Sin leads en esta vista 🐢</p>
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => (
            <div key={l.id} className={`ld-card rounded-xl px-3 py-2.5 ${busyId === l.id ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[l.status] || '#94A3B8' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ld-fg truncate">
                    {l.company_name}
                    {(l.lead_score || 0) >= 70 && <Flame className="w-3 h-3 inline ml-1 text-amber-500" title={`Score ${l.lead_score}`} />}
                  </p>
                  <p className="text-[10px] text-ld-fg-muted truncate">
                    {l.contact_name}{l.qty_estimate ? ` · ${l.qty_estimate}u` : ''}{l.product_interest ? ` · ${l.product_interest}` : ''}
                  </p>
                </div>

                {/* Selector de estado */}
                <select
                  value={l.status || 'Nuevo'}
                  onChange={(e) => cambiarEstado(l, e.target.value)}
                  disabled={busyId === l.id}
                  className="ld-input !rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer"
                >
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>

                {/* Contacto rápido */}
                <div className="flex gap-0.5">
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="p-1.5 rounded-lg hover:bg-ld-action-soft" title={l.email}>
                      <Mail className="w-3.5 h-3.5 text-ld-fg-muted" />
                    </a>
                  )}
                  {l.phone && (
                    <a href={`https://wa.me/${String(l.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-ld-action-soft" title={l.phone}>
                      <Phone className="w-3.5 h-3.5 text-ld-fg-muted" />
                    </a>
                  )}
                  <button onClick={() => eliminar(l)} disabled={busyId === l.id} className="p-1.5 rounded-lg hover:bg-ld-highlight-soft" title="Eliminar lead">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--ld-highlight)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}