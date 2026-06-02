import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Check, Loader2, Upload } from 'lucide-react';
import V2B2BPriceTable from '../V2B2BPriceTable';

// Card de cotización B2B dentro del río del chat: muestra tabla por volumen
// del producto (si hay) y captura empresa + cantidad + logo como B2BLead.
export default function CardB2BQuote({ data }) {
  const producto = data?.producto || null;
  const convId = data?.conversation_id || null;
  const sessId = data?.session_id || null;
  const [form, setForm] = useState({ empresa: '', contacto: '', email: '', telefono: '', cantidad: '' });
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
    } catch { /* noop */ }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.empresa || !form.contacto || !form.email) return;
    setSending(true);
    try {
      // Backend idempotente: crea/actualiza B2BLead y vincula el ChatLead del hilo.
      await base44.functions.invoke('captureB2BLeadV2', {
        conversation_id: convId,
        session_id: sessId,
        contact_name: form.contacto,
        company_name: form.empresa,
        email: form.email,
        phone: form.telefono || undefined,
        qty_estimate: form.cantidad ? Number(form.cantidad) : undefined,
        product_interest: producto?.nombre || 'Cotización /v2',
        logo_url: logoUrl || undefined,
      });
      setDone(true);
    } catch { /* noop */ }
    setSending(false);
  };

  if (done) {
    return (
      <div className="v2-card v2-fade-up p-4 w-full max-w-[320px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--v2-teal-soft)' }}>
            <Check className="w-4 h-4" style={{ color: 'var(--v2-teal)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>¡Cotización en camino! 🐢</p>
            <p className="text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>Nuestro equipo te contacta pronto.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-card v2-fade-up p-4 w-full max-w-[320px]">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4" style={{ color: 'var(--v2-teal)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Cotización por volumen</p>
      </div>

      {producto?.precio_b2b_tramos && (
        <div className="mb-3">
          {producto.imagen_url && (
            <p className="text-xs font-medium mb-1.5 line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{producto.nombre}</p>
          )}
          <V2B2BPriceTable tramos={producto.precio_b2b_tramos} />
          {producto.personalizacion_v2 && (
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--v2-fg-soft)' }}>✦ {producto.personalizacion_v2}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <input value={form.empresa} onChange={set('empresa')} placeholder="Empresa *" className="v2-input px-3 h-10 text-xs" style={{ color: 'var(--v2-fg)' }} />
        <input value={form.contacto} onChange={set('contacto')} placeholder="Tu nombre *" className="v2-input px-3 h-10 text-xs" style={{ color: 'var(--v2-fg)' }} />
        <input value={form.email} onChange={set('email')} type="email" placeholder="Email *" className="v2-input px-3 h-10 text-xs" style={{ color: 'var(--v2-fg)' }} />
        <input value={form.telefono} onChange={set('telefono')} type="tel" placeholder="Teléfono (opcional)" className="v2-input px-3 h-10 text-xs" style={{ color: 'var(--v2-fg)' }} />
        <input value={form.cantidad} onChange={set('cantidad')} type="number" placeholder="Cantidad estimada" className="v2-input px-3 h-10 text-xs" style={{ color: 'var(--v2-fg)' }} />

        <label className="v2-btn-ghost h-10 flex items-center justify-center gap-2 text-xs cursor-pointer">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {logoUrl ? 'Logo cargado ✓' : 'Subir mi logo (opcional)'}
          <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
        </label>

        <button
          onClick={submit}
          disabled={sending || !form.empresa || !form.contacto || !form.email}
          className="v2-btn-gold h-12 sm:h-11 flex items-center justify-center gap-2 text-sm font-semibold mt-1.5 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pedir mi cotización'}
        </button>
        <p className="text-[10px] text-center" style={{ color: 'var(--v2-fg-subtle)' }}>Precios por unidad · Excluyen IVA · Logo láser gratis desde 10u</p>
      </div>
    </div>
  );
}