// ============================================================================
// ConciliarCatalogo · Conciliación del Catálogo Maestro (PDF) vs Productos reales
// ─────────────────────────────────────────────────────────────────────────────
// Muestra los 19 productos oficiales del PDF, su producto real enlazado (foto +
// precio) y los posibles duplicados. Permite, CON CONFIRMACIÓN:
//   · archivar un duplicado (lo desactiva, NO lo borra)
//   · fijar el precio B2C exacto del PDF en el producto real
// No hace cambios automáticos. Solo admin.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, FileCheck2, AlertTriangle, Layers } from 'lucide-react';
import MaestroMatchCard from '@/components/conciliacion/MaestroMatchCard';

const CATS = ['Cachos', 'Escritorio', 'Paletas', 'Hogar'];

export default function ConciliarCatalogo() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filtroCat, setFiltroCat] = useState('Todas');

  const cargar = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('conciliarCatalogoMaestro', {});
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const archivarDuplicado = async (dup) => {
    if (!window.confirm(`¿Archivar "${dup.nombre}" (${dup.sku})?\n\nSe DESACTIVA del catálogo (no se borra). Podrás reactivarlo después si fue un error.`)) return;
    setBusy(true);
    await base44.entities.Producto.update(dup.id, { activo: false });
    await cargar();
    setBusy(false);
  };

  const fijarPrecio = async (item) => {
    const nuevo = item.precio_unitario_clp;
    if (!window.confirm(`¿Fijar precio B2C de "${item.match.nombre}" a $${Number(nuevo).toLocaleString('es-CL')} (precio unitario del PDF, sin IVA)?\n\nActual: $${Number(item.match.precio_b2c || 0).toLocaleString('es-CL')}`)) return;
    setBusy(true);
    await base44.entities.Producto.update(item.match.id, { precio_b2c: nuevo });
    await cargar();
    setBusy(false);
  };

  const items = data?.items || [];
  const visibles = filtroCat === 'Todas' ? items : items.filter((i) => i.categoria === filtroCat);

  return (
    <div className="min-h-screen bg-[#fbfaf7] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#0F8B6C]" />
              <h1 className="text-xl font-bold text-slate-800">Conciliar Catálogo</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">19 productos del PDF oficial vs tu catálogo real · sin cambios automáticos</p>
          </div>
          <button
            onClick={cargar}
            disabled={loading || busy}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#0F8B6C]"><Layers className="w-3.5 h-3.5" /><span className="text-[10px] font-semibold uppercase">Maestro</span></div>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{data.total_maestro}</p>
              <p className="text-[10px] text-slate-400">{data.total_productos} productos reales</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#D96B4D]"><AlertTriangle className="w-3.5 h-3.5" /><span className="text-[10px] font-semibold uppercase">Con dups</span></div>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{data.con_duplicados}</p>
              <p className="text-[10px] text-slate-400">tienen posibles duplicados</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /><span className="text-[10px] font-semibold uppercase">Sin match</span></div>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{data.sin_match}</p>
              <p className="text-[10px] text-slate-400">faltan crear</p>
            </div>
          </div>
        )}

        {/* Filtros categoría */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {['Todas', ...CATS].map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCat(c)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filtroCat === c ? 'bg-[#0F8B6C] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Conciliando catálogo…</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {visibles.map((item) => (
              <MaestroMatchCard
                key={item.slug}
                item={item}
                busy={busy}
                onArchive={archivarDuplicado}
                onFixPrice={fijarPrecio}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}