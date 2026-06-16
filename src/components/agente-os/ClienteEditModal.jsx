import { useState } from 'react';
import { X, Loader2, Save, Trash2, AlertTriangle, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TIPOS = ['B2B Corporativo', 'B2B Pyme', 'B2C Recurrente', 'Tienda Física'];
const ESTADOS = ['Activo', 'Inactivo', 'En Riesgo', 'VIP', 'Bloqueado'];

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide">{label}</span>
    {children}
  </label>
);

const inputCls = 'mt-1 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-emerald-500 focus:bg-white';

// ════════════════════════════════════════════════════════════════════════
// ClienteEditModal — Editar / eliminar la ficha de un cliente DESDE el chat.
// Mejora datos básicos (nombre, contacto, email, teléfono, RUT, tipo, estado,
// notas) sin salir del Agent OS. La eliminación pide confirmación explícita.
// ════════════════════════════════════════════════════════════════════════
export default function ClienteEditModal({ cliente, onClose, onSaved }) {
  const [form, setForm] = useState({
    empresa: cliente.empresa || '',
    contacto: cliente.contacto || '',
    email: cliente.email || '',
    telefono: cliente.telefono || '',
    rut: cliente.rut || '',
    tipo: cliente.tipo || 'B2C Recurrente',
    estado: cliente.estado || 'Activo',
    notas: cliente.notas || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const guardar = async () => {
    if (!form.empresa.trim()) { setError('El nombre / empresa es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      await base44.entities.Cliente.update(cliente.id, form);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Error al guardar');
      setSaving(false);
    }
  };

  const eliminar = async () => {
    setDeleting(true); setError('');
    try {
      await base44.entities.Cliente.delete(cliente.id);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Error al eliminar');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f1f5f9] flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0f172a] leading-tight">Editar cliente</p>
            <p className="text-[11px] text-[#64748b] truncate">{cliente.contacto || cliente.empresa}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto peyu-scrollbar px-4 py-4 space-y-3">
          <Field label="Empresa / Nombre">
            <input className={inputCls} value={form.empresa} onChange={set('empresa')} />
          </Field>
          <Field label="Contacto">
            <input className={inputCls} value={form.contacto} onChange={set('contacto')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={set('email')} type="email" />
            </Field>
            <Field label="Teléfono">
              <input className={inputCls} value={form.telefono} onChange={set('telefono')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RUT">
              <input className={inputCls} value={form.rut} onChange={set('rut')} />
            </Field>
            <Field label="Tipo">
              <select className={inputCls} value={form.tipo} onChange={set('tipo')}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Estado">
            <select className={inputCls} value={form.estado} onChange={set('estado')}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Notas">
            <textarea className={`${inputCls} min-h-[72px] peyu-scrollbar`} value={form.notas} onChange={set('notas')} />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#f1f5f9] flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-[#f1f5f9] text-[#475569] text-sm font-bold">Cancelar</button>
            <button onClick={guardar} disabled={saving} className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
            </button>
          </div>
          {confirmDel ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-red-700 flex-1">¿Eliminar este cliente?</span>
              <button onClick={() => setConfirmDel(false)} className="text-xs font-bold text-[#64748b] px-2 py-1">No</button>
              <button onClick={eliminar} disabled={deleting} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 flex items-center gap-1 disabled:opacity-60">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Eliminar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="w-full h-9 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}