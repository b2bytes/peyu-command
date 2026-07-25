import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, X, Loader2, Check, RefreshCw } from 'lucide-react';

const CATEGORIAS = ['Bienvenida', 'Seguimiento', 'Cotización', 'Postventa', 'Promoción', 'Reactivación', 'Otro'];
const IDEAS = [
  'Recuperar clientes que no compran hace meses',
  'Avisar que el grabado láser es gratis desde 10 unidades',
  'Seguir una cotización de empresa que quedó sin respuesta',
  'Agradecer la compra y pedir una reseña',
];

// Genera plantillas de WhatsApp con IA y las guarda en la biblioteca.
export default function PlantillasIAModal({ onClose, onSaved }) {
  const [intencion, setIntencion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState(3);
  const [propuestas, setPropuestas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const generar = async () => {
    if (!intencion.trim()) return;
    setCargando(true); setError(''); setPropuestas([]);
    try {
      const r = await base44.functions.invoke('whatsappPlantillasIA', { intencion, categoria, cantidad });
      setPropuestas(r?.data?.plantillas || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudieron generar las plantillas.');
    }
    setCargando(false);
  };

  const guardar = async () => {
    setGuardando(true);
    await base44.entities.PlantillaWhatsApp.bulkCreate(
      propuestas.map((p) => ({ ...p, activo: true, usos: 0 }))
    ).catch(() => {});
    setGuardando(false);
    onSaved?.();
    onClose();
  };

  const editarMensaje = (i, valor) =>
    setPropuestas((prev) => prev.map((p, idx) => idx === i ? { ...p, mensaje: valor } : p));

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(2,6,23,.72)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: '#0B1224', border: '1px solid rgba(255,255,255,.10)' }}>

        <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none">Crear plantillas con IA</p>
            <p className="text-[10px] text-white/40 mt-0.5">Con el tono PEYU y variables listas</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">¿Para qué es el mensaje?</label>
            <textarea
              rows={2}
              value={intencion}
              onChange={(e) => setIntencion(e.target.value)}
              placeholder="Ej: recuperar clientes que pidieron cotización y no respondieron"
              className="mt-1.5 w-full rounded-2xl px-3.5 py-2.5 text-sm text-white resize-none outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {IDEAS.map((i) => (
                <button key={i} onClick={() => setIntencion(i)} className="text-[10px] px-2.5 py-1 rounded-full text-white/55 hover:text-white" style={{ background: 'rgba(255,255,255,.06)' }}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}>
              <option value="">Categoría automática</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-28 rounded-xl px-3 py-2 text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} variantes</option>)}
            </select>
          </div>

          <button onClick={generar} disabled={cargando || !intencion.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-40 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}>
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {cargando ? 'Escribiendo…' : propuestas.length ? 'Generar otras' : 'Generar plantillas'}
          </button>

          {error && <p className="text-[11px] text-red-300">{error}</p>}

          {propuestas.map((p, i) => (
            <div key={i} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white flex-1 truncate">{p.nombre}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#25D366]" style={{ background: 'rgba(37,211,102,.12)' }}>{p.categoria}</span>
              </div>
              <textarea
                rows={4}
                value={p.mensaje}
                onChange={(e) => editarMensaje(i, e.target.value)}
                className="mt-2 w-full rounded-xl px-3 py-2 text-xs text-white/80 resize-none outline-none"
                style={{ background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.08)' }}
              />
            </div>
          ))}
        </div>

        {propuestas.length > 0 && (
          <div className="flex-shrink-0 flex gap-2 p-3 pb-safe" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <button onClick={generar} disabled={cargando}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white/70 hover:text-white"
              style={{ background: 'rgba(255,255,255,.06)' }}>
              <RefreshCw className="w-3.5 h-3.5" /> Otra vuelta
            </button>
            <button onClick={guardar} disabled={guardando}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-50 hover:brightness-105"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar {propuestas.length} plantillas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}