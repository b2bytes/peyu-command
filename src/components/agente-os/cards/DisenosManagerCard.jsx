import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Palette, Plus, Loader2, Wand2, Search } from 'lucide-react';
import DisenoCard from '@/components/disenos/DisenoCard';
import DisenoFormModal from '@/components/disenos/DisenoFormModal';

// Gestor de Diseños PEYU embebido en la conversación del Agente OS.
// Tarjeta autónoma: subir nuevos diseños, cambiar la imagen de uno existente
// (ej. la ranita), activar/ocultar, eliminar y regenerar los grabados láser —
// sin salir del chat. Reutiliza los mismos componentes del panel /admin/disenos.
export default function DisenosManagerCard() {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | diseño a editar
  const [engraving, setEngraving] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todas');

  const load = async () => {
    const rows = await base44.entities.DisenoPeyu.list('orden', 200).catch(() => []);
    setDisenos(rows || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const regenerarGrabados = async () => {
    setEngraving(true);
    await base44.functions.invoke('engraveDisenosPeyu', {}).catch(() => null);
    await load();
    setEngraving(false);
  };

  const categorias = [...new Set(disenos.map((d) => d.categoria || 'Otro'))];
  const filtrados = disenos.filter((d) => {
    if (cat !== 'Todas' && (d.categoria || 'Otro') !== cat) return false;
    if (q.trim() && !d.nombre?.toLowerCase().includes(q.toLowerCase().trim())) return false;
    return true;
  });

  return (
    <div className="ld-card rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-ld-action-soft flex items-center justify-center flex-shrink-0">
          <Palette className="w-4 h-4 text-ld-action" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ld-fg leading-tight">Diseños del personalizador</p>
          <p className="text-[11px] text-ld-fg-muted">{disenos.filter((d) => d.activo).length} activos de {disenos.length}</p>
        </div>
        <button
          onClick={regenerarGrabados}
          disabled={engraving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ld-btn-ghost"
          title="Genera la versión grabado láser de los diseños pendientes"
        >
          {engraving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          Regenerar grabados
        </button>
        <button
          onClick={() => setModal('new')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white ld-btn-primary"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo diseño
        </button>
      </div>

      {/* Buscador + filtro de categoría */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar diseño…"
            className="w-full h-8 pl-8 pr-3 rounded-xl ld-input text-xs"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {['Todas', ...categorias].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                cat === c ? 'ld-btn-primary text-white' : 'ld-btn-ghost'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ld-fg-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando diseños…
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-xs text-ld-fg-muted text-center py-8">
          {disenos.length === 0 ? 'Aún no hay diseños. Sube el primero con "Nuevo diseño".' : 'Sin resultados para este filtro.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[440px] overflow-y-auto peyu-scrollbar pr-1">
          {filtrados.map((d) => (
            <DisenoCard key={d.id} diseno={d} onEdit={() => setModal(d)} onChanged={load} />
          ))}
        </div>
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