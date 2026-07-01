import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Palette, Plus, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import DisenoCard from '@/components/disenos/DisenoCard';
import DisenoFormModal from '@/components/disenos/DisenoFormModal';

// ════════════════════════════════════════════════════════════════════════
// /admin/disenos — Galería de Diseños PEYU (grabado láser) editable por los
// founders: subir nuevos diseños, cambiar imagen/nombre/categoría, activar,
// reordenar y eliminar. Al subir/cambiar una imagen se regenera la versión
// grabado (engraveDisenosPeyu) automáticamente.
// ════════════════════════════════════════════════════════════════════════
export default function DisenosPeyu() {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | diseño a editar
  const [engraving, setEngraving] = useState(false);

  const load = async () => {
    const rows = await base44.entities.DisenoPeyu.list('orden', 200).catch(() => []);
    setDisenos(rows || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Regenera las versiones "grabado láser" pendientes (diseños sin imagen_grabado_url)
  const regenerarGrabados = async () => {
    setEngraving(true);
    await base44.functions.invoke('engraveDisenosPeyu', {}).catch(() => null);
    await load();
    setEngraving(false);
  };

  const categorias = [...new Set(disenos.map((d) => d.categoria || 'Otro'))];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl bg-ld-action-soft flex items-center justify-center">
          <Palette className="w-5 h-5 text-ld-action" />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-ld-fg leading-tight">Diseños PEYU</h1>
          <p className="text-xs text-ld-fg-muted">
            Galería del personalizador · {disenos.filter((d) => d.activo).length} activos de {disenos.length}
          </p>
        </div>
        <button
          onClick={regenerarGrabados}
          disabled={engraving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ld-btn-ghost"
          title="Genera la versión grabado láser de los diseños que no la tienen"
        >
          {engraving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          Regenerar grabados
        </button>
        <button
          onClick={() => setModal('new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white ld-btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo diseño
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ld-fg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando diseños…
        </div>
      ) : disenos.length === 0 ? (
        <div className="text-center py-20">
          <Palette className="w-10 h-10 mx-auto mb-3 text-ld-fg-subtle" />
          <p className="font-bold text-ld-fg text-sm">Aún no hay diseños</p>
          <p className="text-xs text-ld-fg-muted mt-1">Sube el primero con "Nuevo diseño".</p>
        </div>
      ) : (
        categorias.map((cat) => (
          <div key={cat} className="mb-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ld-fg-muted mb-2.5">
              {cat} · {disenos.filter((d) => (d.categoria || 'Otro') === cat).length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {disenos
                .filter((d) => (d.categoria || 'Otro') === cat)
                .map((d) => (
                  <DisenoCard key={d.id} diseno={d} onEdit={() => setModal(d)} onChanged={load} />
                ))}
            </div>
          </div>
        ))
      )}

      {modal && (
        <DisenoFormModal
          diseno={modal === 'new' ? null : modal}
          categorias={categorias}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}