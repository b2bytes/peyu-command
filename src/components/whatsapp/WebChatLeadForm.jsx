import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2 } from 'lucide-react';

// Ficha editable del visitante: permite ponerle nombre y completar sus datos
// a mano cuando la conversación no los dejó claros.
const CAMPOS = [
  { k: 'nombre', label: 'Nombre', ph: 'Ej: Nancy Pérez' },
  { k: 'email', label: 'Email', ph: 'correo@empresa.cl' },
  { k: 'telefono', label: 'WhatsApp', ph: '+56 9 1234 5678' },
  { k: 'empresa', label: 'Empresa', ph: 'Nombre de la empresa' },
];

export default function WebChatLeadForm({ lead, onSaved }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(CAMPOS.map((c) => [c.k, lead[c.k] || ''])));
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    setSaving(true);
    await base44.entities.ChatLead.update(lead.id, form);
    setSaving(false);
    setOk(true);
    setTimeout(() => setOk(false), 1800);
    onSaved?.({ ...lead, ...form });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {CAMPOS.map((c) => (
        <label key={c.k} className="block">
          <span className="text-[9px] font-bold uppercase tracking-wider text-ld-fg-subtle">{c.label}</span>
          <input
            value={form[c.k]}
            onChange={(e) => setForm({ ...form, [c.k]: e.target.value })}
            placeholder={c.ph}
            className="w-full mt-0.5 px-2.5 h-8 rounded-lg text-[12px] text-ld-fg bg-transparent outline-none focus:border-ld-action"
            style={{ border: '1px solid var(--ld-border)' }}
          />
        </label>
      ))}
      <button
        onClick={guardar}
        disabled={saving}
        className="col-span-2 h-8 rounded-lg text-[11px] font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
        style={{ background: ok ? '#10B981' : '#8B5CF6' }}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        {ok ? 'Datos guardados' : 'Guardar datos del cliente'}
      </button>
    </div>
  );
}