// Formulario de conversión principal de /lanzamiento.
// Crea un Lead en la DB + Consulta, notifica via Gmail.
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

export default function LeadForm({ utm = {} }) {
  const [form, setForm] = useState({
    empresa: '', contacto: '', email: '', telefono: '',
    cantidad_estimada: '', notas: '',
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      // 🎯 Unificado: escribe en B2BLead (mismo pipeline que /b2b/contacto).
      // Ya no usamos la entidad Lead legacy para que el equipo comercial vea
      // todo en un solo panel /admin/pipeline.
      await base44.entities.B2BLead.create({
        company_name: form.empresa,
        contact_name: form.contacto,
        email: form.email,
        phone: form.telefono,
        qty_estimate: Number(form.cantidad_estimada) || 0,
        delivery_date: form.fecha_evento || '',
        source: 'Formulario Web',
        status: 'Nuevo',
        urgency: 'Normal',
        notes: `[Origen: /lanzamiento] ${utm.utm_campaign ? `Campaña: ${utm.utm_campaign}. ` : ''}${form.notas || ''}`,
        utm_source: utm.utm_source || 'google_ads_landing',
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Error enviando');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-emerald-900">¡Recibido!</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Un ejecutivo PEYU te contactará en menos de 4 horas hábiles al mail <strong>{form.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-emerald-900/5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Empresa *</Label>
          <Input required value={form.empresa} onChange={set('empresa')} placeholder="Ej: Falabella" />
        </div>
        <div>
          <Label>Tu nombre *</Label>
          <Input required value={form.contacto} onChange={set('contacto')} placeholder="Ej: Ana Pérez" />
        </div>
        <div>
          <Label>Email corporativo *</Label>
          <Input required type="email" value={form.email} onChange={set('email')} placeholder="ana@empresa.cl" />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.telefono} onChange={set('telefono')} placeholder="+56 9 ..." />
        </div>
        <div>
          <Label>Cantidad estimada (u)</Label>
          <Input type="number" value={form.cantidad_estimada} onChange={set('cantidad_estimada')} placeholder="Ej: 200" />
        </div>
        <div>
          <Label>Fecha requerida</Label>
          <Input value={form.fecha_evento || ''} onChange={e => setForm(s => ({...s, fecha_evento: e.target.value}))} placeholder="Ej: 15 junio 2026" />
        </div>
      </div>
      <div>
        <Label>Cuéntanos más (tipo de producto, uso, logo)</Label>
        <Textarea rows={3} value={form.notas} onChange={set('notas')} placeholder="Ej: Kit welcome para 150 colaboradores nuevos, con logo grabado." />
      </div>

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <Button type="submit" disabled={sending} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 h-13">
        {sending ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/>Enviando...</> : <><Send className="w-4 h-4 mr-2"/>Solicitar cotización en 4h</>}
      </Button>
      <p className="text-[11px] text-slate-400 text-center">
        Al enviar aceptas nuestra <a href="/privacidad" className="underline">política de privacidad</a>. No compartimos tus datos.
      </p>
    </form>
  );
}