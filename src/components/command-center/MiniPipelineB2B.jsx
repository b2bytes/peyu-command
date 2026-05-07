import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Briefcase, ArrowRight, Loader2, Flame, FileText, CheckCircle2, Send, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Mini pipeline B2B para el Centro de Comando.
 * Cruza B2BLead + CorporateProposal en vivo. Muestra el funnel de un toque:
 * Nuevos → Contactados → Propuesta enviada → Aceptados.
 */

const ESTADOS_LEAD = [
  { key: 'Nuevo', label: 'Nuevos', icon: Clock, color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
  { key: 'Contactado', label: 'Contactados', icon: Send, color: 'text-blue-300', bg: 'bg-blue-500/15' },
  { key: 'En revisión', label: 'En revisión', icon: FileText, color: 'text-purple-300', bg: 'bg-purple-500/15' },
  { key: 'Propuesta enviada', label: 'Prop. enviada', icon: FileText, color: 'text-yellow-300', bg: 'bg-yellow-500/15' },
  { key: 'Aceptado', label: 'Aceptados', icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
];

const ago = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export default function MiniPipelineB2B() {
  const [leads, setLeads] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const [l, p] = await Promise.all([
        base44.entities.B2BLead.list('-created_date', 30),
        base44.entities.CorporateProposal.list('-created_date', 30),
      ]);
      setLeads(l || []);
      setPropuestas(p || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (e) {
      console.warn('MiniPipelineB2B error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Conteo por estado
  const counts = {};
  for (const e of ESTADOS_LEAD) counts[e.key] = leads.filter(l => l.status === e.key).length;

  // Métricas extra
  const calientes = leads.filter(l => (l.lead_score || 0) >= 70 && !['Aceptado', 'Perdido'].includes(l.status)).length;
  const propuestasPendientes = propuestas.filter(p => p.status === 'Enviada').length;

  // Últimos leads
  const recent = leads.slice(0, 4);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-semibold text-white text-sm">Pipeline B2B · En vivo</h3>
            <p className="text-[10px] text-emerald-300/70">
              {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando…'}
            </p>
          </div>
        </div>
        <Link to="/admin/pipeline" className="text-[11px] text-emerald-300 hover:text-emerald-200 flex items-center gap-1">
          Ver completo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Banner de alertas calientes */}
      {(calientes > 0 || propuestasPendientes > 0) && (
        <div className="flex gap-2 mb-3">
          {calientes > 0 && (
            <Link to="/admin/pipeline" className="flex-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-orange-400/30 rounded-lg px-2 py-1.5 hover:from-red-500/30 hover:to-orange-500/30 transition flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span className="text-[10px] text-orange-200 font-semibold">{calientes} calientes</span>
            </Link>
          )}
          {propuestasPendientes > 0 && (
            <Link to="/admin/propuestas" className="flex-1 bg-yellow-500/15 border border-yellow-400/30 rounded-lg px-2 py-1.5 hover:bg-yellow-500/25 transition flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[10px] text-yellow-200 font-semibold">{propuestasPendientes} prop. pendientes</span>
            </Link>
          )}
        </div>
      )}

      {/* Flow de estados */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {ESTADOS_LEAD.map((e, i) => {
          const Icon = e.icon;
          return (
            <div key={i} className={`${e.bg} border border-white/10 rounded-lg p-2 text-center hover:bg-white/15 transition`}>
              <Icon className={`w-3.5 h-3.5 ${e.color} mx-auto mb-0.5`} />
              <div className={`text-base font-bold font-poppins ${e.color}`}>
                {loading ? '…' : counts[e.key]}
              </div>
              <div className="text-[9px] text-white/60 leading-tight">{e.label}</div>
            </div>
          );
        })}
      </div>

      {/* Feed de últimos leads */}
      <div className="border-t border-white/10 pt-3">
        <p className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-2">Últimos leads</p>
        {loading ? (
          <div className="flex items-center justify-center py-3 text-white/50 text-xs">
            <Loader2 className="w-3 h-3 animate-spin mr-2" /> Cargando…
          </div>
        ) : recent.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-3">Sin leads aún</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map(l => (
              <Link
                key={l.id}
                to={`/admin/pipeline`}
                className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      (l.lead_score || 0) >= 70 ? 'bg-emerald-400' :
                      (l.lead_score || 0) >= 40 ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs font-medium text-white truncate">{l.company_name || 'Sin empresa'}</span>
                    <span className="text-[9px] text-white/40">·</span>
                    <span className="text-[10px] text-white/50">{ago(l.created_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-emerald-300">{l.contact_name || '-'}</span>
                    {l.qty_estimate > 0 && <span className="text-[10px] text-white/40">{l.qty_estimate}u</span>}
                    {l.lead_score > 0 && <span className="text-[10px] text-cyan-300 font-semibold">{l.lead_score}pts</span>}
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-white/10 text-white/70">
                  {l.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}