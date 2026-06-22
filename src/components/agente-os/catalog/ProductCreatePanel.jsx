import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, X } from 'lucide-react';
import ProductImageUploader from './ProductImageUploader';

const CATEGORIAS = ['Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];
const MATERIALES = ['Plástico 100% Reciclado', 'Fibra de Trigo (Compostable)'];
const CANALES = ['B2B + B2C', 'B2C Exclusivo', 'B2B Exclusivo'];

// Panel para crear un producto nuevo desde el chat (carcasa u otro).
export default function ProductCreatePanel({ onCreated, onClose }) {
  const [form, setForm] = useState({
    sku: '', nombre: '', categoria: 'Carcasas B2C',
    material: MATERIALES[0], canal: 'B2B + B2C',
    precio_b2c: '', stock_actual: '',
  });
  const [imagenUrl, setImagenUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const crear = async () => {
    if (!form.sku || !form.nombre) { setMsg('SKU y nombre son obligatorios'); return; }
    setSaving(true);
    setMsg('');
    try {
      const campos = { ...form };
      if (form.precio_b2c !== '') campos.precio_b2c = Number(form.precio_b2c);
      if (form.stock_actual !== '') campos.stock_actual = Number(form.stock_actual);
      await base44.functions.invoke('catalogManager', { action: 'create', payload: { campos, imagen_url: imagenUrl } });
      onCreated?.();
      onClose?.();
    } catch (e) {
      setMsg(e?.response?.data?.error || e.message || 'Error creando producto');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-ld-bg-soft/60 border border-ld-border rounded-lg px-2.5 py-1.5 text-sm text-ld-fg focus:outline-none focus:border-ld-action';
  const Field = ({ label, children }) => (
    <div><label className="block text-[11px] font-semibold text-ld-fg-muted mb-1">{label}</label>{children}</div>
  );

  return (
    <div className="mt-3 rounded-xl border border-ld-action/30 bg-ld-action-soft/30 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ld-fg">Nuevo producto</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted"><X className="w-4 h-4" /></button>
      </div>
      <ProductImageUploader current={imagenUrl} onUploaded={setImagenUrl} label="Subir foto" />
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="SKU *"><input className={inputCls} value={form.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
        <Field label="Nombre *"><input className={inputCls} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
        <Field label="Precio B2C (CLP)"><input type="number" className={inputCls} value={form.precio_b2c} onChange={(e) => set('precio_b2c', e.target.value)} /></Field>
        <Field label="Stock (u)"><input type="number" className={inputCls} value={form.stock_actual} onChange={(e) => set('stock_actual', e.target.value)} /></Field>
        <Field label="Categoría">
          <select className={inputCls} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Canal">
          <select className={inputCls} value={form.canal} onChange={(e) => set('canal', e.target.value)}>
            {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Material">
        <select className={inputCls} value={form.material} onChange={(e) => set('material', e.target.value)}>
          {MATERIALES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>
      <div className="flex items-center gap-2">
        <button onClick={crear} disabled={saving} className="ld-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Crear producto
        </button>
        {msg && <span className="text-xs text-red-400 font-semibold">{msg}</span>}
      </div>
    </div>
  );
}