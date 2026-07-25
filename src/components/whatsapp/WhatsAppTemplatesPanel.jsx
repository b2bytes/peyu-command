import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Loader2, FileText, Copy, Check } from 'lucide-react';
import PlantillaFormModal from './PlantillaFormModal';

// Biblioteca de plantillas de WhatsApp del equipo.
export default function WhatsAppTemplatesPanel() {
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [abrirForm, setAbrirForm] = useState(false);
  const [copiada, setCopiada] = useState('');

  const cargar = async () => {
    const l = await base44.entities.PlantillaWhatsApp.list('-updated_date', 200).catch(() => []);
    setPlantillas(l || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const borrar = async (p) => {
    await base44.entities.PlantillaWhatsApp.delete(p.id);
    cargar();
  };

  const copiar = async (p) => {
    await navigator.clipboard.writeText(p.mensaje).catch(() => {});
    setCopiada(p.id);
    setTimeout(() => setCopiada(''), 1500);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">Plantillas</p>
          <p className="text-[10px] text-white/40 mt-0.5">{plantillas.length} mensajes guardados</p>
        </div>
        <button
          onClick={() => { setEditando(null); setAbrirForm(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white hover:brightness-110"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
        >
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-3">
        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-12 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        ) : plantillas.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 mx-auto text-white/15" />
            <p className="text-sm text-white/60 mt-3 font-semibold">Aún no hay plantillas</p>
            <p className="text-xs text-white/35 mt-1">Crea mensajes que el equipo reutilice al escribirle a clientes.</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {plantillas.map((p) => (
              <div key={p.id} className="rounded-2xl p-3.5 flex flex-col" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{p.nombre}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#25D366]" style={{ background: 'rgba(37,211,102,.12)' }}>
                      {p.categoria || 'Otro'}
                    </span>
                    {p.activo === false && <span className="ml-1.5 text-[10px] text-white/35">inactiva</span>}
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => copiar(p)} title="Copiar" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10">
                      {copiada === p.id ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => { setEditando(p); setAbrirForm(true); }} title="Editar" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => borrar(p)} title="Eliminar" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-red-300 hover:bg-white/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/55 mt-2.5 leading-relaxed whitespace-pre-wrap line-clamp-5">{p.mensaje}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {abrirForm && (
        <PlantillaFormModal plantilla={editando} onClose={() => setAbrirForm(false)} onSaved={cargar} />
      )}
    </div>
  );
}