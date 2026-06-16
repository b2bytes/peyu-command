import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Search, Mail, Phone, Flame, Trash2, FileText, Eye } from 'lucide-react';
import PropuestaViewerModal from './PropuestaViewerModal';

// ════════════════════════════════════════════════════════════════════════
// OpsLeadsPanel — Gestión completa de Leads B2B dentro del Agent OS.
// Los leads se ORDENAN por etapa del embudo (orden lógico de principio a fin):
// Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado / Perdido.
// Desde acá se genera la propuesta, se ve el PDF, se cambia estado, se contacta
// y se elimina — sin salir del chat.
// ════════════════════════════════════════════════════════════════════════

const ESTADOS = ['Nuevo', 'Contactado', 'En revisión', 'Propuesta enviada', 'Aceptado', 'Perdido'];
// Orden canónico del embudo B2B (índice = posición en el flujo).
const ETAPA_ORDEN = { 'Nuevo': 0, 'Contactado': 1, 'En revisión': 2, 'Propuesta enviada': 3, 'Aceptado': 4, 'Perdido': 5 };

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
  const [verPropuesta, setVerPropuesta] = useState(null); // { id, titulo }

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.B2BLead.list('-created_date', 100).catch(() => []);
    setLeads(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Filtra + ORDENA por etapa del embudo (y dentro de etapa, score arriba).
  const filtrados = useMemo(() => {
    let lista = leads;
    if (filtro === 'activos') lista = lista.filter((l) => !['Aceptado', 'Perdido'].includes(l.status));
    const q = search.trim().toLowerCase();
    if (q) lista = lista.filter((l) =>
      (l.company_name || '').toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    );
    return [...lista].sort((a, b) => {
      const ea = ETAPA_ORDEN[a.status] ?? 9;
      const eb = ETAPA_ORDEN[b.status] ?? 9;
      if (ea !== eb) return ea - eb;
      return (b.lead_score || 0) - (a.lead_score || 0);
    });
  }, [leads, filtro, search]);

  const cambiarEstado = async (lead, status) => {
    setBusyId(lead.id);
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status } : l));
    await base44.functions.invoke('agentOSAction', { action: 'updateLeadEstado', payload: { id: lead.id, status } }).catch(() => load());
    setBusyId(null);
    onRefreshAll?.();
  };

  // Genera la propuesta corporativa del lead (autoCotizarLead) y refresca.
  const generarPropuesta = async (lead) => {
    setBusyId(lead.id);
    const res = await base44.functions.invoke('agentOSAction', { action: 'autoCotizarLead', payload: { id: lead.id } })
      .catch((e) => ({ data: { error: e?.response?.data?.error || e?.message || 'Error' } }));
    if (res?.data?.error) alert(res.data.error);
    await load();
    setBusyId(null);
    onRefreshAll?.();
  };

  // Abre el PDF de la propuesta vinculada al lead (b2b_lead_id).
  const verPropuestaLead = async (lead) => {
    setBusyId(lead.id);
    const props = await base44.entities.CorporateProposal.filter({ b2b_lead_id: lead.id }, '-created_date', 1).catch(() => []);
    const prop = props?.[0];
    setBusyId(null);
    if (prop?.id) setVerPropuesta({ id: prop.id, titulo: `${lead.company_name || ''}${prop.numero ? ` · ${prop.numero}` : ''}` });
    else alert('Este lead aún no tiene una propuesta generada.');
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

      {/* Guía del orden del embudo */}
      <p className="text-[10px] text-ld-fg-subtle px-1">
        Orden del embudo: Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado
      </p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-ld-fg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando leads…
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center py-10 text-sm text-ld-fg-muted">Sin leads en esta vista 🐢</p>
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => {
            const etapa = ETAPA_ORDEN[l.status] ?? 0;
            const tienePropuesta = etapa >= 3; // Propuesta enviada o más
            return (
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

                {/* ── Acción de propuesta CONTEXTUAL según etapa ──────────────── */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {tienePropuesta ? (
                    <button onClick={() => verPropuestaLead(l)} disabled={busyId === l.id}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg ld-btn-ghost text-ld-fg-soft disabled:opacity-60">
                      <Eye className="w-3.5 h-3.5" /> Ver propuesta
                    </button>
                  ) : (
                    <button onClick={() => generarPropuesta(l)} disabled={busyId === l.id}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg ld-btn-primary text-white disabled:opacity-60">
                      {busyId === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Generar propuesta
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {verPropuesta && (
        <PropuestaViewerModal
          proposalId={verPropuesta.id}
          titulo={verPropuesta.titulo}
          onClose={() => setVerPropuesta(null)}
        />
      )}
    </div>
  );
}