import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Save } from 'lucide-react';

const CATEGORIAS = ['Bienvenida', 'Seguimiento', 'Cotización', 'Postventa', 'Promoción', 'Reactivación', 'Otro'];

// Crear / editar una plantilla de WhatsApp.
export default function PlantillaFormModal({ plantilla, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: plantilla?.nombre || '',
    categoria: plantilla?.categoria || 'Otro',
    mensaje: plantilla?.mensaje || '',
    activo: plantilla?.activo ?? true,
  });
  const [guardando, setGuardando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim() || !form.mensaje.trim()) return;
    setGuardando(true);
    if (plantilla?.id) await base44.entities.PlantillaWhatsApp.update(plantilla.id, form);
    else await base44.entities.PlantillaWhatsApp.create(form);
    setGuardando(false);
    onSaved?.();
    onClose();
  };

  const insertar = (tag) => set('mensaje', `${form.mensaje}${tag}`);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: '#0B1224', border: '1px solid rgba(255,255,255,.10)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <h2 className="flex-1 text-sm font-bold text-white">{plantilla ? 'Editar plantilla' : 'Nueva plantilla'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej. Seguimiento de cotización"
              className="mt-1 w-full h-11 px-3 rounded-xl text-sm text-white bg-white/[0.06] outline-none focus:bg-white/[0.10]"
              style={{ border: '1px solid rgba(255,255,255,.12)' }}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase">Categoría</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  onClick={() => set('categoria', c)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${form.categoria === c ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                  style={form.categoria === c
                    ? { background: 'linear-gradient(135deg,#25D366,#128C7E)' }
                    : { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white/50 uppercase">Mensaje</label>
              <div className="flex gap-1.5">
                <button onClick={() => insertar('{{nombre}}')} className="px-2 py-1 rounded-md text-[10px] font-bold text-[#25D366]" style={{ background: 'rgba(37,211,102,.12)' }}>+ nombre</button>
                <button onClick={() => insertar('{{empresa}}')} className="px-2 py-1 rounded-md text-[10px] font-bold text-[#25D366]" style={{ background: 'rgba(37,211,102,.12)' }}>+ empresa</button>
              </div>
            </div>
            <textarea
              value={form.mensaje}
              onChange={(e) => set('mensaje', e.target.value)}
              rows={6}
              placeholder="Hola {{nombre}} 👋 Te escribo de PEYU…"
              className="mt-1 w-full p-3 rounded-xl text-sm text-white bg-white/[0.06] outline-none focus:bg-white/[0.10] resize-none leading-relaxed"
              style={{ border: '1px solid rgba(255,255,255,.12)' }}
            />
            <p className="text-[10px] text-white/35 mt-1">Las variables se reemplazan con los datos de cada cliente al enviar.</p>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} className="w-4 h-4 accent-[#25D366]" />
            <span className="text-xs text-white/70">Plantilla activa (visible al escribir)</span>
          </label>

          <button
            onClick={guardar}
            disabled={guardando || !form.nombre.trim() || !form.mensaje.trim()}
            className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar plantilla
          </button>
        </div>
      </div>
    </div>
  );
}