// Formulario express de propuesta B2B — captura mínima, máxima conversión.
// Cantidad EXACTA (stepper), lugar de entrega obligatorio, logo opcional.
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, Send, Building2, Zap, Plus, Minus, Upload, X, MapPin } from 'lucide-react';
import { trackGenerateLead } from '@/lib/analytics-peyu';

const C = {
  border: '#D4C4B0', fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070',
  action: '#0F8B6C', actionGrad: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', terra: '#D96B4D',
};

const NECESIDADES = ['Regalos corporativos', 'Kits de bienvenida', 'Merch con mi logo', 'Evento / fin de año', 'Otro'];

const inputStyle = { border: `1.5px solid ${C.border}`, background: '#F8F3ED', color: C.fg };

export default function PropuestaRapidaForm() {
  const [form, setForm] = useState({
    empresa: '', nombre: '', email: '', telefono: '',
    necesidad: 'Regalos corporativos', qty: 100, lugar: '', fecha: '', mensaje: '',
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoName, setLogoName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setQty = (v) => setForm((f) => ({ ...f, qty: Math.max(1, v) }));

  const handleLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      setLogoName(file.name.length > 22 ? `${file.name.slice(0, 14)}…${file.name.slice(-6)}` : file.name);
    } catch {
      setError('No se pudo subir el logo. Prueba con PNG o JPG.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.empresa.trim() || !form.nombre.trim() || !/\S+@\S+\.\S+/.test(form.email.trim())) {
      setError('Completa empresa, nombre y un email válido.');
      return;
    }
    if (!form.lugar.trim()) {
      setError('Indícanos el lugar de entrega (comuna / dirección).');
      return;
    }
    setError('');
    setSending(true);
    try {
      await base44.functions.invoke('captureB2BLeadV2', {
        origen: 'propuesta_rapida',
        contact_name: form.nombre.trim(),
        company_name: form.empresa.trim(),
        email: form.email.trim(),
        phone: form.telefono.trim() || undefined,
        qty_estimate: Number(form.qty) || undefined,
        product_interest: `⚡ Propuesta rápida · ${form.necesidad}`,
        delivery_date: form.fecha || undefined,
        delivery_place: form.lugar.trim(),
        extra_notes: form.mensaje.trim() || undefined,
        logo_url: logoUrl || undefined,
      });
      trackGenerateLead({ content_name: `Propuesta rápida · ${form.necesidad} · ${form.qty}u` });
      setSent(true);
    } catch {
      setError('No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center gap-3 p-8 rounded-3xl" style={{ background: 'white', border: `1.5px solid ${C.action}40`, boxShadow: '0 12px 40px rgba(15,139,108,.12)' }}>
        <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#0F8B6C15' }}>
          <Check className="w-7 h-7" style={{ color: C.action }} />
        </span>
        <p className="font-fraunces text-2xl font-bold" style={{ color: C.fg }}>¡Solicitud recibida! 🐢</p>
        <p className="text-sm max-w-xs" style={{ color: C.fgSoft }}>
          Nuestro equipo B2B te enviará tu <strong>propuesta formal en menos de 24h hábiles</strong> a {form.email}.
        </p>
        <a
          href={`https://wa.me/56979471933?text=${encodeURIComponent(`Hola PEYU, acabo de solicitar una propuesta rápida para ${form.empresa}. Quiero adelantar detalles 🐢`)}`}
          target="_blank" rel="noopener noreferrer"
          className="mt-1 h-11 px-6 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: C.actionGrad, boxShadow: '0 6px 20px rgba(15,139,108,.28)' }}>
          Adelantar por WhatsApp →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-4 sm:p-5 space-y-3.5" style={{ background: 'white', border: `1.5px solid ${C.border}`, boxShadow: '0 16px 50px rgba(44,24,16,.10)' }}>
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.actionGrad }}>
          <Zap className="w-4 h-4 text-white" />
        </span>
        <div>
          <p className="font-bold text-base leading-tight" style={{ color: C.fg }}>Solicita tu propuesta rápida</p>
          <p className="text-[11px] font-semibold" style={{ color: C.action }}>60 segundos · respuesta en 24h hábiles</p>
        </div>
      </div>

      {/* ¿Qué necesitas? */}
      <div>
        <p className="text-xs font-bold mb-1.5" style={{ color: C.fgSoft }}>¿Qué necesitas?</p>
        <div className="flex flex-wrap gap-1.5">
          {NECESIDADES.map((n) => (
            <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, necesidad: n }))}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 peyu-tap-sm"
              style={{
                background: form.necesidad === n ? C.action : 'white',
                color: form.necesidad === n ? 'white' : C.fgSoft,
                border: `1.5px solid ${form.necesidad === n ? C.action : C.border}`,
              }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Cantidad EXACTA */}
      <div>
        <p className="text-xs font-bold mb-1.5" style={{ color: C.fgSoft }}>
          ¿Cuántas unidades necesitas? <span className="font-semibold" style={{ color: C.fgMuted }}>(logo láser gratis desde 10u)</span>
        </p>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: 'white' }}>
            <button type="button" onClick={() => setQty(Number(form.qty) - 10)} className="w-11 h-11 flex items-center justify-center transition-colors hover:bg-[#F2ECE2] active:bg-[#EDE3D6]">
              <Minus className="w-4 h-4" style={{ color: C.fgSoft }} />
            </button>
            <input
              type="number" min="1" inputMode="numeric"
              value={form.qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
              className="w-20 h-11 text-center text-base font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: C.fg }}
            />
            <button type="button" onClick={() => setQty(Number(form.qty) + 10)} className="w-11 h-11 flex items-center justify-center transition-colors hover:bg-[#F2ECE2] active:bg-[#EDE3D6]">
              <Plus className="w-4 h-4" style={{ color: C.fgSoft }} />
            </button>
          </div>
          <span className="text-xs font-semibold" style={{ color: C.fgMuted }}>unidades exactas</span>
        </div>
      </div>

      {/* Datos de contacto + entrega */}
      <div className="space-y-2">
        <input value={form.empresa} onChange={set('empresa')} placeholder="Empresa *"
          className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0F8B6C40]" style={inputStyle} />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre *"
            className="h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0F8B6C40] min-w-0" style={inputStyle} />
          <input value={form.telefono} onChange={set('telefono')} placeholder="Teléfono" type="tel"
            className="h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0F8B6C40] min-w-0" style={inputStyle} />
        </div>
        <input value={form.email} onChange={set('email')} placeholder="Email corporativo *" type="email"
          className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0F8B6C40]" style={inputStyle} />

        {/* Lugar de entrega (obligatorio) */}
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.fgMuted }} />
          <input value={form.lugar} onChange={set('lugar')} placeholder="Lugar de entrega: comuna y dirección *"
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0F8B6C40]" style={inputStyle} />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold flex-shrink-0" style={{ color: C.fgSoft }}>¿Para cuándo?</label>
          <input value={form.fecha} onChange={set('fecha')} type="date"
            className="flex-1 h-10 px-3 rounded-xl text-sm focus:outline-none min-w-0" style={inputStyle} />
        </div>

        {/* Logo opcional */}
        {logoUrl ? (
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 min-w-0 overflow-hidden" style={{ border: `1.5px solid ${C.action}50`, background: '#0F8B6C08' }}>
            <span className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'white', border: `1px solid ${C.border}` }}>
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: C.fg }}>{logoName || 'Logo subido'}</p>
              <p className="text-[10px] font-semibold" style={{ color: C.action }}>✓ Lo usaremos en el mockup de tu propuesta</p>
            </div>
            <button type="button" onClick={() => { setLogoUrl(null); setLogoName(''); }}
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
              <X className="w-3.5 h-3.5" style={{ color: C.fgSoft }} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-[#F8F3ED]"
            style={{ border: `1.5px dashed ${C.border}`, color: C.fgSoft, background: 'white' }}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" style={{ color: C.action }} />}
            {uploading ? 'Subiendo logo…' : 'Sube tu logo (opcional) — lo verás grabado en tu propuesta'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
          onChange={(e) => handleLogo(e.target.files?.[0])} />

        <textarea value={form.mensaje} onChange={set('mensaje')} placeholder="Cuéntanos más (opcional): productos, colores, evento…" rows={2}
          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0F8B6C40] resize-none" style={inputStyle} />
      </div>

      {error && <p className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: '#D96B4D15', color: C.terra }}>{error}</p>}

      <button onClick={submit} disabled={sending || uploading}
        className="w-full h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
        style={{ background: C.actionGrad, boxShadow: '0 8px 26px rgba(15,139,108,.3)' }}>
        {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando…</> : <>Recibir mi propuesta en 24h <Send className="w-4 h-4" /></>}
      </button>
      <p className="text-[10px] text-center flex items-center justify-center gap-1" style={{ color: C.fgMuted }}>
        <Building2 className="w-3 h-3" /> Sin compromiso · Factura empresa · Precios netos por volumen
      </p>
    </div>
  );
}