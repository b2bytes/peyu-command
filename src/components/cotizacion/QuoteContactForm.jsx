import { Building2, User, Mail, Phone, Calendar, Sparkles } from 'lucide-react';

// Formulario de datos del cliente corporativo para la cotización rápida.
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

export default function QuoteContactForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-3">
      <Field icon={Building2} placeholder="Nombre de la empresa *" value={form.company_name} onChange={set('company_name')} />
      <Field icon={User} placeholder="Tu nombre *" value={form.contact_name} onChange={set('contact_name')} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field icon={Mail} type="email" placeholder="Email *" value={form.email} onChange={set('email')} />
        <Field icon={Phone} type="tel" placeholder="Teléfono" value={form.phone} onChange={set('phone')} />
      </div>
      <Field icon={Calendar} placeholder="¿Fecha que lo necesitas? (opcional)" value={form.delivery_date} onChange={set('delivery_date')} />

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
    </div>
  );
}