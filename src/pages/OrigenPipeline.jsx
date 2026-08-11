import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';
import OrigenPipelineRow from '@/components/embudo/OrigenPipelineRow';
import { agruparPorOrigen, origenMasProblematico } from '@/lib/origen-pipeline';

// ════════════════════════════════════════════════════════════════════════
// /admin/origen-pipeline — Cruce ORIGEN del lead × ETAPA del pipeline.
// Revela qué fuentes de tráfico generan leads que se quedan estancados.
// ════════════════════════════════════════════════════════════════════════
const UMBRALES = [3, 7, 14];

export default function OrigenPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diasEstancado, setDiasEstancado] = useState(7);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    base44.entities.B2BLead.list('-created_date', 1000)
      .then((r) => setLeads(r || []))
      .finally(() => setLoading(false));
  }, []);

  const grupos = useMemo(() => agruparPorOrigen(leads, { diasEstancado }), [leads, diasEstancado]);
  const peor = useMemo(() => origenMasProblematico(grupos), [grupos]);
  const totalEstancados = grupos.reduce((s, g) => s + g.estancados, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-poppins font-bold text-2xl text-gray-900">Origen del lead × etapa del pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Qué fuentes de tráfico traen leads que avanzan… y cuáles traen leads que se quedan detenidos antes de cerrar.
        </p>
      </div>

      {/* Umbral de estancamiento */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Considerar estancado tras:</span>
        {UMBRALES.map((u) => (
          <button
            key={u}
            onClick={() => setDiasEstancado(u)}
            className={`px-3 h-9 rounded-xl text-xs font-bold transition-all ${
              diasEstancado === u ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {u} días
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Leads', valor: leads.length },
          { label: 'Fuentes', valor: grupos.length },
          { label: 'Estancados', valor: totalEstancados },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <p className="font-poppins font-bold text-xl text-gray-900">{k.valor}</p>
            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {peor && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-amber-900">Fuente con más leads detenidos: {peor.origen}</p>
            <p className="text-xs text-amber-800 mt-0.5">
              {peor.estancados} de {peor.total} leads ({peor.estancadoPct}%) llevan {diasEstancado}+ días sin
              movimiento y solo cierra el {peor.cierrePct}%.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {grupos.map((g) => (
          <OrigenPipelineRow
            key={g.origen}
            grupo={g}
            abierto={abierto === g.origen}
            onToggle={() => setAbierto(abierto === g.origen ? null : g.origen)}
            peor={peor?.origen === g.origen}
          />
        ))}
        {grupos.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">Aún no hay leads registrados.</p>
        )}
      </div>
    </div>
  );
}