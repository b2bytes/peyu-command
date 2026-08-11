import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, UserPlus } from 'lucide-react';

// Modal para crear un cliente directo desde WhatsApp Studio.
// Campos mínimos para poder escribirle: nombre/empresa + teléfono.
export default function ClienteCreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ empresa: '', contacto: '', telefono: '', email: '', tipo: 'B2C Recurrente' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async () => {
    setError('');
    if (!form.empresa.trim()) { setError('Ingresa el nombre o empresa.'); return; }
    if ((form.telefono || '').replace(/\D/g, '').length < 8) { setError('Ingresa un teléfono válido (ej: +56 9 1234 5678).'); return; }
    setSaving(true);
    try {
      const nuevo = await base44.entities.Cliente.create({
        empresa: form.empresa.trim(),
        contacto: form.contacto.trim() || form.empresa.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
        tipo: form.tipo,
        estado: 'Activo',
        canal_preferido: 'WhatsApp',
      });
      onCreated?.(nuevo);
      onClose();
    } catch {
      setError('No se pudo crear el cliente. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full h-11 px-3 rounded-xl text-sm text-white bg-white/[0.06] outline-none focus:bg-white/[0.10] placeholder:text-white/30';
  const inputStyle = { border: '1px solid rgba(255,255,255,.10)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl p-6 space-y-3"
        style={{ background: '#0B1224', border: '1px solid rgba(255,255,255,.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Nuevo cliente</p>
              <p className="text-[10px] text-white/40 mt-0.5">Queda disponible para escribirle por WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white" style={{ background: 'rgba(255,255,255,.06)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <input className={inputCls} style={inputStyle} placeholder="Nombre o empresa *" value={form.empresa} onChange={set('empresa')} />
        <input className={inputCls} style={inputStyle} placeholder="Persona de contacto" value={form.contacto} onChange={set('contacto')} />
        <input className={inputCls} style={inputStyle} placeholder="Teléfono / WhatsApp * (ej: +56 9 1234 5678)" value={form.telefono} onChange={set('telefono')} />
        <input className={inputCls} style={inputStyle} type="email" placeholder="Email (opcional)" value={form.email} onChange={set('email')} />
        <select className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} value={form.tipo} onChange={set('tipo')}>
          <option value="B2C Recurrente">Persona (B2C)</option>
          <option value="B2B Pyme">Empresa Pyme (B2B)</option>
          <option value="B2B Corporativo">Empresa Corporativa (B2B)</option>
          <option value="Tienda Física">Tienda Física</option>
        </select>

        {error && <p className="text-xs font-semibold" style={{ color: '#F08560' }}>{error}</p>}

        <button
          onClick={guardar}
          disabled={saving}
          className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Crear cliente'}
        </button>
      </div>
    </div>
  );
}