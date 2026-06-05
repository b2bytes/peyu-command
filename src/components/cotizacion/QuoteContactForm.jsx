import { Building2, User, Mail, Phone, Calendar, Sparkles, FileText, Briefcase, IdCard, MapPin, Map, Zap, MessageSquare } from 'lucide-react';

// Formulario de datos del cliente corporativo para la cotización rápida B2B.
// Organizado por secciones para capturar TODO lo necesario para cerrar negocio:
// empresa (facturación), contacto, despacho y detalles del proyecto.
// Controlado por el padre vía `form` y `setForm`.

const Field = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78B6F]" />
    <input
      {...props}
      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#EBE3D6] text-sm text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15"
    />
  </div>
);

const Section = ({ icon: Icon, title, hint, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-2.5">
      <span className="w-7 h-7 rounded-lg bg-[#0F8B6C]/8 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#0F8B6C]" />
      </span>
      <div>
        <p className="text-sm font-bold text-[#2A2420] leading-tight">{title}</p>
        {hint && <p className="text-[11px] text-[#A78B6F] leading-tight">{hint}</p>}
      </div>
    </div>
    <div className="space-y-3 pl-1">{children}</div>
  </div>
);

const URGENCIAS = [
  { v: 'Alta', label: 'Urgente', emoji: '🔥' },
  { v: 'Normal', label: 'Normal', emoji: '📅' },
  { v: 'Baja', label: 'Sin apuro', emoji: '🌱' },
];

export default function QuoteContactForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      {/* Empresa / Facturación */}
      <Section icon={Building2} title="Datos de la empresa" hint="Para tu factura formal">
        <Field icon={Building2} placeholder="Razón social / Nombre empresa *" value={form.company_name} onChange={set('company_name')} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field icon={IdCard} placeholder="RUT empresa *" value={form.rut} onChange={set('rut')} />
          <Field icon={Briefcase} placeholder="Giro (opcional)" value={form.giro} onChange={set('giro')} />
        </div>
      </Section>

      {/* Contacto */}
      <Section icon={User} title="¿Con quién hablamos?">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field icon={User} placeholder="Tu nombre *" value={form.contact_name} onChange={set('contact_name')} />
          <Field icon={Briefcase} placeholder="Tu cargo (opcional)" value={form.cargo} onChange={set('cargo')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field icon={Mail} type="email" placeholder="Email corporativo *" value={form.email} onChange={set('email')} />
          <Field icon={Phone} type="tel" placeholder="Teléfono / WhatsApp *" value={form.phone} onChange={set('phone')} />
        </div>
      </Section>

      {/* Despacho */}
      <Section icon={MapPin} title="¿Dónde lo entregamos?" hint="Para calcular el despacho">
        <Field icon={MapPin} placeholder="Dirección de despacho (opcional)" value={form.direccion} onChange={set('direccion')} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field icon={Map} placeholder="Comuna (opcional)" value={form.comuna} onChange={set('comuna')} />
          <Field icon={Calendar} placeholder="¿Para qué fecha? (opcional)" value={form.delivery_date} onChange={set('delivery_date')} />
        </div>
      </Section>

      {/* Proyecto */}
      <Section icon={MessageSquare} title="Sobre tu pedido">
        {/* Urgencia */}
        <div>
          <p className="text-xs font-semibold text-[#4B4F54] mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#D96B4D]" /> ¿Qué tan urgente es?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {URGENCIAS.map((u) => (
              <button
                key={u.v}
                type="button"
                onClick={() => setForm({ ...form, urgency: u.v })}
                className={`h-11 rounded-xl border text-sm font-bold transition-all ${
                  form.urgency === u.v
                    ? 'bg-[#0F8B6C] border-[#0F8B6C] text-white'
                    : 'bg-white border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40'
                }`}
              >
                <span className="mr-1">{u.emoji}</span>{u.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 bg-white border border-[#EBE3D6] rounded-xl px-3.5 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.personalization_needs}
            onChange={(e) => setForm({ ...form, personalization_needs: e.target.checked })}
            className="w-4 h-4 accent-[#0F8B6C]"
          />
          <Sparkles className="w-4 h-4 text-[#D96B4D]" />
          <span className="text-sm font-semibold text-[#2A2420]">Quiero personalización con mi logo (grabado láser)</span>
        </label>

        <div className="relative">
          <FileText className="absolute left-3 top-3.5 w-4 h-4 text-[#A78B6F]" />
          <textarea
            rows={3}
            placeholder="¿Algo más que debamos saber? (uso, evento, colores, plazos...)"
            value={form.notes}
            onChange={set('notes')}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#EBE3D6] text-sm text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15 resize-none"
          />
        </div>
      </Section>
    </div>
  );
}