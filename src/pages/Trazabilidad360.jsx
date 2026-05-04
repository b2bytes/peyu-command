// ============================================================================
// Trazabilidad 360° · Dashboard admin del journey público end-to-end
// ----------------------------------------------------------------------------
// Lee la entidad ActivityLog y permite al equipo PEYU ver qué hace cada
// visitante en el sitio público, cruzando sesión anónima con email cuando
// el usuario completa un formulario.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Radar } from 'lucide-react';
import ActivityFilters from '@/components/trazabilidad/ActivityFilters';
import ActivityKPIs from '@/components/trazabilidad/ActivityKPIs';
import ActivityTable from '@/components/trazabilidad/ActivityTable';
import SessionJourneyDrawer from '@/components/trazabilidad/SessionJourneyDrawer';

const RANGE_MS = { '1d': 86400000, '7d': 7 * 86400000, '30d': 30 * 86400000 };

export default function Trazabilidad360() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'Todas', event_type: '', range: '7d' });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    setLoading(true);
    base44.entities.ActivityLog.list('-created_date', 500)
      .then((data) => setLogs(data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const search = (filters.search || '').toLowerCase().trim();
    const cutoff = filters.range !== 'all' ? Date.now() - (RANGE_MS[filters.range] || RANGE_MS['7d']) : 0;

    return logs.filter((l) => {
      if (filters.category && filters.category !== 'Todas' && l.category !== filters.category) return false;
      if (filters.event_type && l.event_type !== filters.event_type) return false;
      if (cutoff && new Date(l.created_date).getTime() < cutoff) return false;
      if (search) {
        const hay = `${l.user_email || ''} ${l.session_id || ''} ${l.page_path || ''} ${l.user_name || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [logs, filters]);

  return (
    <div className="p-6 space-y-5 min-h-screen">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-poppins font-black text-white flex items-center gap-3">
            <Radar className="w-7 h-7 text-teal-300" />
            Trazabilidad 360°
          </h1>
          <p className="text-teal-300/70 text-sm mt-1">
            Journey end-to-end de cada visitante. Cruza sesión anónima con email cuando entrega datos.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
          <Activity className="w-3.5 h-3.5 text-teal-300" />
          {loading ? 'Cargando…' : `${logs.length} eventos en BD · ${filtered.length} en vista`}
        </div>
      </div>

      <ActivityKPIs logs={filtered} />
      <ActivityFilters filters={filters} onChange={setFilters} />
      <ActivityTable logs={filtered} onSelectSession={setSelectedLog} />

      <SessionJourneyDrawer seedLog={selectedLog} onClose={() => setSelectedLog(null)} />

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/50">
        💡 <strong className="text-white/70">Cómo funciona:</strong> Cada acción en el sitio público
        (ver producto, agregar al carrito, enviar formulario B2B, completar checkout, ver propuesta,
        comprar gift card) genera un evento en <code className="text-teal-300">ActivityLog</code>.
        Cuando el visitante completa un email, todos sus eventos previos de esa sesión quedan
        identificados, formando un journey 360° navegable desde aquí o desde el panel de cada
        cliente / lead / propuesta.
      </div>
    </div>
  );
}