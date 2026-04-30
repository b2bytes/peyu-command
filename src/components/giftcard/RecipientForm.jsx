import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Mail, User, Calendar, Sparkles } from 'lucide-react';

const PLANTILLAS = [
  '¡Feliz cumpleaños! Que disfrutes este regalo sostenible 🌿',
  '¡Felicitaciones! Te lo mereces. Con cariño,',
  'Gracias por todo. Espero que te guste 💚',
  'Para que te regales algo lindo y eco-friendly',
];

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

export default function RecipientForm({ form, setForm, fechaEnvio, setFechaEnvio }) {
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const destEmailOk = !form.destinatario_email || isValidEmail(form.destinatario_email);
  const compEmailOk = !form.comprador_email || isValidEmail(form.comprador_email);

  return (
    <div className="space-y-5">
      {/* Destinatario */}
      <div className="bg-pink-500/8 border border-pink-400/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-pink-300">
          <Heart className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Destinatario</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-white/70 mb-1 block flex items-center gap-1">
              <User className="w-3 h-3" /> Nombre *
            </label>
            <Input
              value={form.destinatario_nombre}
              onChange={update('destinatario_nombre')}
              placeholder="Ana López"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/70 mb-1 block flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email *
            </label>
            <Input
              type="email"
              value={form.destinatario_email}
              onChange={update('destinatario_email')}
              placeholder="ana@email.com"
              className={`bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400/60 ${
                !destEmailOk ? 'border-red-400/60' : ''
              }`}
            />
            {!destEmailOk && (
              <p className="text-[11px] text-red-300 mt-1">Email inválido</p>
            )}
          </div>
        </div>
      </div>

      {/* Comprador */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-white/70">
          <User className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Tus datos</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-white/70 mb-1 block">Tu nombre *</label>
            <Input
              value={form.comprador_nombre}
              onChange={update('comprador_nombre')}
              placeholder="Juan Pérez"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/70 mb-1 block">Tu email *</label>
            <Input
              type="email"
              value={form.comprador_email}
              onChange={update('comprador_email')}
              placeholder="juan@email.com"
              className={`bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400/60 ${
                !compEmailOk ? 'border-red-400/60' : ''
              }`}
            />
            {!compEmailOk && (
              <p className="text-[11px] text-red-300 mt-1">Email inválido</p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-white/40 leading-relaxed">
          📩 Te enviaremos una copia de la gift card a tu email para guardarla.
        </p>
      </div>

      {/* Mensaje */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">Mensaje personal</h3>
          <span className="text-[10px] text-white/40 ml-auto">Opcional</span>
        </div>
        <Textarea
          value={form.mensaje}
          onChange={e => setForm({ ...form, mensaje: e.target.value.slice(0, 200) })}
          placeholder="Escribe algo lindo... o usa una plantilla 👇"
          rows={3}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none focus:border-emerald-400/60"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {PLANTILLAS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setForm({ ...form, mensaje: p })}
                className="text-[10px] bg-white/8 hover:bg-white/15 text-white/70 hover:text-white px-2 py-1 rounded-full border border-white/10 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-yellow-400" /> Plantilla {i + 1}
              </button>
            ))}
          </div>
          <span className={`text-[10px] flex-shrink-0 ${form.mensaje.length >= 180 ? 'text-amber-300' : 'text-white/40'}`}>
            {form.mensaje.length}/200
          </span>
        </div>
      </div>

      {/* Fecha programada (opcional) */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
        <label className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Programar entrega <span className="text-[10px] text-white/40 normal-case font-normal">(opcional)</span>
        </label>
        <Input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={fechaEnvio}
          onChange={e => setFechaEnvio(e.target.value)}
          className="bg-white/10 border-white/20 text-white focus:border-emerald-400/60"
        />
        <p className="text-[11px] text-white/40 mt-2">
          {fechaEnvio
            ? `📬 El email se enviará el ${new Date(fechaEnvio).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`
            : 'Si no eliges fecha, se envía inmediatamente.'}
        </p>
      </div>
    </div>
  );
}

export { isValidEmail };