import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, Trash2, Power } from 'lucide-react';
import ProductImageUploader from './ProductImageUploader';

// Categorías válidas del schema Producto (evita guardar valores fuera del enum
// que dejarían el producto invisible en los filtros por categoría).
const CATEGORIAS = ['Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];

// Panel de edición de un producto del catálogo, embebido en el chat del Agente.
// Permite editar campos clave, cambiar imagen principal, administrar galería e
// imágenes por color, activar/desactivar y eliminar. Todo vía catalogManager.
export default function ProductEditPanel({ producto, onSaved, onClose }) {
  const [form, setForm] = useState({
    nombre: producto.nombre || '',
    sku: producto.sku || '',
    precio_b2c: producto.precio_b2c ?? '',
    stock_actual: producto.stock_actual ?? '',
    categoria: producto.categoria || '',
    descripcion: producto.descripcion || '',
  });
  const [imagenUrl, setImagenUrl] = useState(producto.imagen_url || '');
  const [galeria, setGaleria] = useState(Array.isArray(producto.galeria_urls) ? producto.galeria_urls : []);
  const [activo, setActivo] = useState(producto.activo !== false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const call = (action, payload) => base44.functions.invoke('catalogManager', { action, payload });

  const guardar = async () => {
    setSaving(true);
    setMsg('');
    try {
      const campos = {
        nombre: form.nombre,
        sku: form.sku,
        categoria: form.categoria,
        descripcion: form.descripcion,
        activo,
      };
      if (form.precio_b2c !== '') campos.precio_b2c = Number(form.precio_b2c);
      if (form.stock_actual !== '') campos.stock_actual = Number(form.stock_actual);
      await call('update', { id: producto.id, campos });
      setMsg('Guardado ✓');
      onSaved?.();
    } catch (e) {
      setMsg(e?.response?.data?.error || e.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  // Las acciones de imagen persisten al instante y refrescan SOLO el estado
  // local del panel (no recargan los 300 productos de la grilla, que colapsaría
  // el panel abierto). El cambio se ve igual al reabrir gracias a la persistencia.
  const cambiarImagen = async (url) => {
    setImagenUrl(url);
    await call('setImage', { id: producto.id, imagen_url: url });
  };

  const quitarImagen = async () => {
    setImagenUrl('');
    await call('removeImage', { id: producto.id });
  };

  const agregarGaleria = async (url) => {
    const res = await call('addGallery', { id: producto.id, imagen_url: url });
    setGaleria(res?.data?.galeria_urls || [...galeria, url]);
  };

  const quitarGaleria = async (url) => {
    const res = await call('removeGallery', { id: producto.id, imagen_url: url });
    setGaleria(res?.data?.galeria_urls || galeria.filter((u) => u !== url));
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar "${producto.nombre}" del catálogo? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      await call('delete', { id: producto.id });
      onSaved?.();
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-[11px] font-semibold text-ld-fg-muted mb-1">{label}</label>
      {children}
    </div>
  );
  const inputCls = 'w-full bg-ld-bg-soft/60 border border-ld-border rounded-lg px-2.5 py-1.5 text-sm text-ld-fg focus:outline-none focus:border-ld-action';

  return (
    <div className="mt-2 rounded-xl border border-ld-border bg-ld-bg-soft/40 p-3.5 space-y-3.5">
      {/* Imagen principal — cambiar o quitar directo en el chat */}
      <Field label="Imagen principal">
        <ProductImageUploader
          current={imagenUrl}
          onUploaded={cambiarImagen}
          onRemove={imagenUrl ? quitarImagen : undefined}
          label={imagenUrl ? 'Cambiar foto' : 'Subir foto'}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Nombre"><input className={inputCls} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
        <Field label="SKU"><input className={inputCls} value={form.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
        <Field label="Precio B2C (CLP)"><input type="number" className={inputCls} value={form.precio_b2c} onChange={(e) => set('precio_b2c', e.target.value)} /></Field>
        <Field label="Stock (u)"><input type="number" className={inputCls} value={form.stock_actual} onChange={(e) => set('stock_actual', e.target.value)} /></Field>
      </div>
      <Field label="Categoría">
        <select className={inputCls} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
          {/* Conserva el valor actual aunque no esté en el enum, para no perderlo */}
          {!CATEGORIAS.includes(form.categoria) && form.categoria && <option value={form.categoria}>{form.categoria}</option>}
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Descripción">
        <textarea rows={2} className={inputCls} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      </Field>

      {/* Galería */}
      <Field label={`Galería (${galeria.length})`}>
        <div className="flex flex-wrap items-center gap-2">
          {galeria.map((url) => (
            <div key={url} className="relative group">
              <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-ld-border" />
              <button
                onClick={() => quitarGaleria(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <ProductImageUploader onUploaded={agregarGaleria} label="Agregar" size="sm" />
        </div>
      </Field>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={guardar}
            disabled={saving}
            className="ld-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Guardar cambios
          </button>
          <button
            onClick={() => { setActivo((v) => !v); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${activo ? 'text-ld-action border-ld-action/40' : 'text-ld-fg-muted border-ld-border'}`}
          >
            <Power className="w-3.5 h-3.5" /> {activo ? 'Activo' : 'Inactivo'}
          </button>
        </div>
        <button onClick={eliminar} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
      {msg && <p className="text-xs text-ld-action font-semibold">{msg}</p>}
    </div>
  );
}