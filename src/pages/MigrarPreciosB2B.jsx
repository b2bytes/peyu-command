// ============================================================================
// MigrarPreciosB2B · Aplicar precios B2B oficiales (PDF) al catálogo en vivo
// ─────────────────────────────────────────────────────────────────────────────
// Muestra el PLAN de mapeo (19 oficiales → productos en vivo) con los precios
// exactos del PDF. Permite revisar cada match (por SKU o por nombre) antes de
// aplicar. El botón "Aplicar" escribe los precios B2B reales en la entidad
// Producto. Solo admin.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

const fmt = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('es-CL')}`);

export default function MigrarPreciosB2B() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  const cargarPlan = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('aplicarPreciosB2BOficial', {});
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => { cargarPlan(); }, []);

  const aplicar = async () => {
    setApplying(true);
    const res = await base44.functions.invoke('aplicarPreciosB2BOficial', { apply: true });
    setData(res.data);
    setApplying(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#0F8B6C]" />
          <h1 className="text-xl font-bold text-slate-800">Migrar precios B2B oficiales</h1>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Aplica los 8 tramos de precio (sin IVA) del catálogo oficial a los productos en vivo.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Calculando plan…</span>
          </div>
        ) : data ? (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Stat label="Oficiales" value={data.total_oficiales} />
              <Stat label="Con match" value={data.con_match} accent="green" />
              <Stat label="Sin match" value={data.sin_match} accent={data.sin_match > 0 ? 'amber' : undefined} />
            </div>

            {/* Acción */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-500">
                {done ? `✅ ${data.actualizados} productos actualizados con precios oficiales.` : 'Revisa el plan y aplica cuando esté correcto.'}
              </p>
              <button
                onClick={aplicar}
                disabled={applying || done || data.con_match === 0}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0F8B6C] text-white hover:bg-[#0b6e55] transition-colors disabled:opacity-40"
              >
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {done ? 'Aplicado' : `Aplicar a ${data.con_match} productos`}
              </button>
            </div>

            {/* Plan */}
            <div className="space-y-2">
              {data.plan.map((p) => (
                <div key={p.slug} className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{p.oficial}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-xs text-slate-500">{p.producto_en_vivo}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${p.via === 'sku' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                      {p.via === 'sku' ? `SKU ${p.sku}` : `↪ por nombre (${p.sku})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-slate-400">B2B base:</span>
                    <span className="text-slate-400 line-through">{fmt(p.b2b_antes)}</span>
                    <ArrowRight className="w-3 h-3 text-[#0F8B6C]" />
                    <span className="font-semibold text-[#0F8B6C]">{fmt(p.b2b_despues)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sin match */}
            {data.sin_match_detalle?.length > 0 && (
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Sin producto en vivo (falta crear)</span>
                </div>
                {data.sin_match_detalle.map((s) => (
                  <p key={s.slug} className="text-xs text-amber-700">• {s.nombre} — {s.motivo}</p>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  const color = accent === 'green' ? 'text-[#0F8B6C]' : accent === 'amber' ? 'text-amber-600' : 'text-slate-800';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
    </div>
  );
}