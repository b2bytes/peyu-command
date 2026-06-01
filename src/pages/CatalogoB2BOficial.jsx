// ============================================================================
// CatalogoB2BOficial · Vista de revisión del catálogo B2B oficial (PDF)
// ─────────────────────────────────────────────────────────────────────────────
// Muestra los 19 productos transcritos EXACTOS del PDF de Productos Corporativos:
// nombre, qué incluye, dimensiones, colores, tapitas y los 8 tramos de precio
// (sin IVA). Es la fuente de verdad B2B, separada del catálogo en vivo.
// Solo lectura — para validar contra el PDF antes de reemplazar el catálogo real.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileCheck2 } from 'lucide-react';
import B2BOficialCard from '@/components/conciliacion/B2BOficialCard';

const CATS = ['Cachos', 'Escritorio', 'Paletas', 'Hogar'];

export default function CatalogoB2BOficial() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filtroCat, setFiltroCat] = useState('Todas');

  useEffect(() => {
    base44.entities.CatalogoB2BOficial.list('orden', 100).then((data) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);

  const visibles = filtroCat === 'Todas' ? items : items.filter((i) => i.categoria === filtroCat);

  // Agrupar por categoría respetando el orden de CATS, para mostrar secciones.
  const grupos = CATS
    .map((cat) => ({ cat, productos: visibles.filter((i) => i.categoria === cat).sort((a, b) => (a.orden || 0) - (b.orden || 0)) }))
    .filter((g) => g.productos.length > 0);

  return (
    <div className="min-h-screen bg-[#fbfaf7] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <FileCheck2 className="w-5 h-5 text-[#0F8B6C]" />
          <h1 className="text-xl font-bold text-slate-800">Catálogo B2B Oficial</h1>
          <span className="text-xs font-semibold text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">{items.length} productos</span>
        </div>
        <p className="text-xs text-slate-500 mb-5">Transcrito exacto del PDF de Productos Corporativos · precios sin IVA · fuente de verdad</p>

        {/* Filtros */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {['Todas', ...CATS].map((c) => {
            const count = c === 'Todas' ? items.length : items.filter((i) => i.categoria === c).length;
            return (
              <button
                key={c}
                onClick={() => setFiltroCat(c)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  filtroCat === c ? 'bg-[#0F8B6C] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Cargando catálogo oficial…</span>
          </div>
        ) : grupos.length === 0 ? (
          <p className="text-sm text-slate-400 py-20 text-center">No hay productos en esta categoría.</p>
        ) : (
          <div className="space-y-8">
            {grupos.map(({ cat, productos }) => (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{cat}</h2>
                  <span className="text-[10px] font-semibold text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">{productos.length}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {productos.map((item) => <B2BOficialCard key={item.slug} item={item} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}