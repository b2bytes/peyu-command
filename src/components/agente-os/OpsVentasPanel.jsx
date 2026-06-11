import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Search, Send, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// OpsVentasPanel — Gestión de ventas B2B (propuestas corporativas) dentro
// del Agent OS: cambiar estado, reenviar al cliente y abrir el PDF.
// ════════════════════════════════════════════════════════════════════════

const ESTADOS = ['Borrador', 'Enviada', 'Aceptada', 'Rechazada', 'Vencida'];

const ESTADO_DOT = {
  'Borrador': '#94A3B8',
  'Enviada': '#60A5FA',
  'Aceptada': '#10B981',
  'Rechazada': '#F87171',
  'Vencida': '#F59E0B',
};

const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

export default function OpsVentasPanel({ onRefreshAll }) {
  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('abiertas'); // abiertas | todas
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CorporateProposal.list('-created_date', 80).catch(() => []);
    setPropuestas(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtradas = useMemo(() => {
    let lista = propuestas;
    if (filtro === 'abiertas') lista = lista.filter((p) => ['Borrador', 'Enviada'].includes(p.status));
    const q = search.trim().toLowerCase();
    if (q) lista = lista.filter((p) =>
      (p.empresa || '').toLowerCase().includes(q) ||
      (p.contacto || '').toLowerCase().includes(q) ||
      (p.numero || '').toLowerCase().includes(q)
    );
    return lista;
  }, [propuestas, filtro, search]);

  const cambiarEstado = async (prop, status) => {
    setBusyId(prop.id);
    setPropuestas((prev) => prev.map((p) => p.id === prop.id ? { ...p, status } : p));
    await base44.functions.invoke('agentOSAction', { action: 'updatePropuestaEstado', payload: { id: prop.id, status } }).catch(() => load());
    setBusyId(null);
    onRefreshAll?.();
  };

  const reenviar = async (prop) => {
    setBusyId(prop.id);
    setFeedback(null);
    try {
      const res = await base44.functions.invoke('agentOSAction', { action: 'reenviarPropuesta', payload: { proposalId: prop.id } });
      setFeedback({ ok: true, message: res?.data?.message || `Propuesta reenviada a ${prop.email} ✓` });
      await load();
      onRefreshAll?.();
    } catch (err) {
      setFeedback({ ok: false, message: err?.response?.data?.error || err.message });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <div className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2 text-sm font-semibold ${feedback.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {feedback.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1">{feedback.message}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {[['abiertas', 'Abiertas'], ['todas', 'Todas']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filtro === id ? 'ld-btn-primary !border-transparent' : 'ld-btn-ghost text-ld-fg-soft'}`}>
            {label}
          </button>
        ))}
        <div className="flex-1 min-w-[160px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ld-fg-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Empresa, contacto o N°…" className="ld-input w-full pl-8 pr-3 py-1.5 text-xs" />
        </div>
        <button onClick={load} className="ld-btn-ghost p-2 rounded-full" title="Refrescar">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-ld-fg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando propuestas…
        </div>
      ) : filtradas.length === 0 ? (
        <p className="text-center py-10 text-sm text-ld-fg-muted">Sin propuestas en esta vista 🐢</p>
      ) : (
        <div className="space-y-2">
          {filtradas.map((p) => (
            <div key={p.id} className={`ld-card rounded-xl px-3 py-2.5 ${busyId === p.id ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[p.status] || '#94A3B8' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ld-fg truncate">
                    {p.numero ? `${p.numero} · ` : ''}{p.empresa}
                  </p>
                  <p className="text-[10px] text-ld-fg-muted truncate">
                    {p.contacto}{p.total ? ` · ${fmt(p.total)}` : ''}{p.fecha_vencimiento ? ` · vence ${p.fecha_vencimiento}` : ''}
                  </p>
                </div>

                {/* Selector de estado */}
                <select
                  value={p.status || 'Borrador'}
                  onChange={(e) => cambiarEstado(p, e.target.value)}
                  disabled={busyId === p.id}
                  className="ld-input !rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer"
                >
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>

                {/* Acciones */}
                <div className="flex gap-0.5">
                  {p.pdf_url && (
                    <a href={p.pdf_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-ld-action-soft" title="Abrir PDF">
                      <FileText className="w-3.5 h-3.5 text-ld-fg-muted" />
                    </a>
                  )}
                  {p.email && (
                    <button onClick={() => reenviar(p)} disabled={busyId === p.id} className="p-1.5 rounded-lg hover:bg-ld-action-soft" title={`Reenviar a ${p.email}`}>
                      {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-ld-fg-muted" /> : <Send className="w-3.5 h-3.5" style={{ color: 'var(--ld-action)' }} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}