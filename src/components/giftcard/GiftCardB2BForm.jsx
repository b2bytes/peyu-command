import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import GiftCardVisual from '@/components/giftcard/GiftCardVisual';
import {
  Building2, CheckCircle, Loader2, MessageCircle, Send, Users,
  TrendingDown, Gift, Sparkles, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MONTOS = [10000, 20000, 50000, 100000];

function calcularDescuento(cantidad) {
  if (cantidad >= 200) return { pct: 15, label: '200+ Gift Cards' };
  if (cantidad >= 100) return { pct: 12, label: '100–199 Gift Cards' };
  if (cantidad >= 50)  return { pct: 8,  label: '50–99 Gift Cards' };
  if (cantidad >= 20)  return { pct: 5,  label: '20–49 Gift Cards' };
  return { pct: 0, label: '< 20 Gift Cards' };
}

const fmt = (n) => `$${new Intl.NumberFormat('es-CL').format(n)}`;
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

export default function GiftCardB2BForm() {
  const [montoUnitario, setMontoUnitario] = useState(20000);
  const [cantidad, setCantidad] = useState(50);
  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '', rut: '',
    delivery_date: '',
    branded_email: false,
    custom_design: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const subtotal = montoUnitario * cantidad;
  const descuento = calcularDescuento(cantidad);
  const ahorro = Math.round(subtotal * descuento.pct / 100);
  const total = subtotal - ahorro;

  const formValido = useMemo(() => (
    form.contact_name.trim() &&
    form.company_name.trim() &&
    isValidEmail(form.email) &&
    form.phone.trim() &&
    cantidad >= 5 &&
    montoUnitario >= 5000
  ), [form, cantidad, montoUnitario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValido) {
      setError('Completa los campos obligatorios y verifica el email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const lead = await base44.entities.B2BLead.create({
        contact_name: form.contact_name,
        company_name: form.company_name,
        email: form.email,
        phone: form.phone,
        rut: form.rut,
        product_interest: `Gift Cards Corporativas (${cantidad}× ${fmt(montoUnitario)})`,
        qty_estimate: cantidad,
        delivery_date: form.delivery_date || null,
        personalization_needs: form.branded_email || form.custom_design,
        notes: [
          `Gift Card Corporativa`,
          `Cantidad: ${cantidad} unidades`,
          `Monto unitario: ${fmt(montoUnitario)}`,
          `Total estimado: ${fmt(total)} (descuento ${descuento.pct}%)`,
          form.branded_email ? '✓ Quiere email branded con logo de la empresa' : null,
          form.custom_design ? '✓ Quiere diseño de tarjeta personalizado' : null,
          form.notes ? `\nNotas: ${form.notes}` : null,
        ].filter(Boolean).join('\n'),
        source: 'GiftCard B2B Web',
        status: 'Nuevo',
        urgency: cantidad >= 100 ? 'Alta' : 'Normal',
        lead_score: cantidad >= 200 ? 90 : cantidad >= 100 ? 75 : cantidad >= 50 ? 60 : 40,
      });

      if (lead?.id) {
        base44.functions.invoke('scoreLead', { leadId: lead.id }).catch(() => {});
      }
      setEnviado(true);
    } catch {
      setError('No se pudo enviar la solicitud. Intenta de nuevo o usa WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-8 shadow-2xl text-center space-y-5 max-w-2xl mx-auto">
        <div className="inline-flex w-20 h-20 rounded-full bg-emerald-500/25 items-center justify-center ring-4 ring-emerald-400/20">
          <CheckCircle className="w-10 h-10 text-emerald-400" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">¡Solicitud enviada! 🎉</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Recibimos tu solicitud de <strong className="text-white">{cantidad} Gift Cards de {fmt(montoUnitario)}</strong>.<br/>
            Carlos del equipo PEYU te contactará en <strong className="text-emerald-300">menos de 24 horas</strong> con la propuesta corporativa, contrato y plazos de entrega.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 text-left text-sm space-y-2">
          <p className="text-emerald-200 font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4" /> Próximos pasos
          </p>
          <ol className="text-white/70 space-y-1 text-xs ml-6 list-decimal">
            <li>Revisamos tu solicitud y preparamos propuesta personalizada (24h)</li>
            <li>Te enviamos PDF con precios finales, packaging y opciones de pago</li>
            <li>Aprobación, anticipo y emisión de gift cards en tu plataforma corporativa</li>
            <li>Distribución masiva por email a tu equipo / clientes</li>
          </ol>
        </div>
        <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, acabo de enviar solicitud de ${cantidad} Gift Cards corporativas de ${fmt(montoUnitario)}. Quería confirmar la recepción.`)}`}
          target="_blank" rel="noopener noreferrer">
          <Button className="w-full gap-2 rounded-xl font-semibold text-white h-12" style={{ backgroundColor: '#25D366' }}>
            <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
          </Button>
        </a>
        <Link to="/shop" className="block">
          <Button variant="outline" className="w-full rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10">
            Volver a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      <div className="space-y-5 order-2 lg:order-1">

        <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-blue-400/40 flex items-center justify-center">
              <Gift className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-lg text-white">Configura tu pedido</h2>
              <p className="text-white/50 text-xs">Cantidad + monto unitario por Gift Card</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2 block">
              Monto por Gift Card
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MONTOS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMontoUnitario(m)}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    montoUnitario === m
                      ? 'border-blue-400 bg-blue-500/20 text-white scale-105 shadow-lg'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {fmt(m)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 bg-slate-900/40 border border-white/15 rounded-xl overflow-hidden focus-within:border-blue-400/60">
              <span className="px-3 text-white/40 text-xs uppercase tracking-wider">Otro monto</span>
              <span className="text-white/40 font-bold">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={MONTOS.includes(montoUnitario) ? '' : Number(montoUnitario).toLocaleString('es-CL')}
                onChange={e => {
                  const num = parseInt(e.target.value.replace(/[^\d]/g, '')) || 0;
                  if (num > 0) setMontoUnitario(num);
                }}
                placeholder="Ej: 25.000"
                className="flex-1 bg-transparent border-0 outline-none py-2.5 text-white text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Cantidad de Gift Cards
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="5"
                value={cantidad}
                onChange={e => setCantidad(Math.max(5, parseInt(e.target.value) || 0))}
                className="h-14 text-2xl font-bold text-center bg-white/10 border-white/20 text-white focus:border-blue-400/60"
              />
              <div className="flex flex-col gap-1">
                {[20, 50, 100, 200].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setCantidad(q)}
                    className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-all ${
                      cantidad === q
                        ? 'bg-blue-500/30 text-white border border-blue-400/40'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-1.5">Mínimo 5 Gift Cards · Volumen recomendado: 50+</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-400/30 rounded-2xl p-5 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Subtotal ({cantidad} × {fmt(montoUnitario)})</span>
              <span className="text-white font-semibold">{fmt(subtotal)}</span>
            </div>
            {descuento.pct > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Descuento volumen ({descuento.label})
                </span>
                <span className="text-emerald-300 font-semibold">−{fmt(ahorro)} ({descuento.pct}%)</span>
              </div>
            ) : (
              <p className="text-[11px] text-amber-300/80">💡 Llega a 20+ Gift Cards y obtén 5% de descuento</p>
            )}
            <div className="border-t border-white/10 pt-2.5 flex justify-between items-center">
              <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Total estimado</span>
              <span className="text-2xl font-poppins font-bold text-white">{fmt(total)}</span>
            </div>
            <p className="text-[10px] text-white/40">Precio referencial. La propuesta final puede incluir packaging branded, fee de personalización o ajustes según condiciones de pago.</p>
          </div>
        </div>

        <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-blue-400/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-lg text-white">Datos de tu empresa</h2>
              <p className="text-white/50 text-xs">Te contactamos en menos de 24 horas</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'contact_name', label: 'Nombre contacto *', placeholder: 'Tu nombre' },
                { key: 'company_name', label: 'Empresa *', placeholder: 'Razón social' },
                { key: 'email', label: 'Email corporativo *', placeholder: 'tu@empresa.cl', type: 'email' },
                { key: 'phone', label: 'Teléfono / WhatsApp *', placeholder: '+56 9 xxxx xxxx' },
                { key: 'rut', label: 'RUT empresa', placeholder: '76.123.456-7' },
                { key: 'delivery_date', label: 'Fecha objetivo', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1 block">{f.label}</label>
                  <Input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    min={f.type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-blue-400/60 [color-scheme:dark]"
                  />
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'branded_email', icon: '✉️', title: 'Email branded', sub: 'Con logo de mi empresa' },
                { key: 'custom_design', icon: '🎨', title: 'Diseño tarjeta custom', sub: 'Colores y branding propio' },
              ].map(cb => (
                <label key={cb.key}
                  className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                    form[cb.key]
                      ? 'border-blue-400/60 bg-blue-500/15'
                      : 'border-white/15 bg-white/5 hover:border-white/30'
                  }`}>
                  <input type="checkbox" checked={form[cb.key]} onChange={e => update(cb.key, e.target.checked)} className="mt-0.5 accent-blue-400 w-4 h-4" />
                  <div>
                    <div className="font-semibold text-sm text-white">{cb.icon} {cb.title}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{cb.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1 block">Notas (opcional)</label>
              <Textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Detalles, ocasión, packaging, plazos especiales..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none focus:border-blue-400/60"
              />
            </div>

            {error && (
              <p className="text-sm text-red-300 bg-red-500/15 border border-red-400/30 rounded-xl p-3">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !formValido}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl gap-2 text-base shadow-2xl shadow-blue-500/30 disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando solicitud...</>
                : <><Send className="w-4 h-4" /> Solicitar propuesta corporativa — &lt;24h</>}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-white/40 mb-1">¿Prefieres conversarlo primero?</p>
              <a
                href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, me interesan ${cantidad} Gift Cards corporativas de ${fmt(montoUnitario)} para mi empresa.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-300 font-semibold hover:text-blue-200"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp +56 9 3504 0242
              </a>
            </div>
          </form>
        </div>
      </div>

      <aside className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-6 space-y-4">
          <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-400" /> Tu Gift Card corporativa
          </p>
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <GiftCardVisual
              monto={montoUnitario}
              destinatario="Tu equipo"
              remitente={form.company_name || 'Tu empresa'}
            />
          </div>
          <div className="bg-blue-500/10 border border-blue-400/25 rounded-2xl p-4 text-xs text-white/70 space-y-2.5">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-300" /> Beneficios B2B
            </p>
            <ul className="space-y-1.5">
              {[
                'Descuentos por volumen (hasta 15%)',
                'Email branded con logo de tu empresa',
                'Distribución masiva centralizada',
                'Factura electrónica con crédito 30 días',
                'Reportes de canje en tiempo real',
                'Vigencia extendida 12 meses',
              ].map(b => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-white/55 space-y-2">
            <p className="font-bold text-white text-xs uppercase tracking-widest">Casos de uso</p>
            <p>🎁 Regalos de fin de año a colaboradores</p>
            <p>🏆 Reconocimiento por desempeño / KPIs</p>
            <p>🤝 Incentivos a clientes y partners</p>
            <p>🎂 Cumpleaños / aniversarios laborales</p>
          </div>
        </div>
      </aside>
    </div>
  );
}