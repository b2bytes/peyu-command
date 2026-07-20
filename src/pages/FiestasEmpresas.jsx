// ============================================================================
// /fiestas-patrias/empresas — Landing B2B campaña Fiestas Patrias.
// Gancho: "Regala con identidad — kits corporativos para tu empresa".
// Captura lead vía captureB2BLeadV2 (reutilizado). Deadline 5 sept = entrega 18.
// ============================================================================
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, Truck, FileText, Award, ArrowRight, Check, Clock, Sparkles, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import CountdownDieciocho from '@/components/fiestas/CountdownDieciocho';
import { base44 } from '@/api/base44Client';

const VENTAJAS = [
  { icon: Award, t: 'Identidad de marca', d: 'Grabado láser con el logo de tu empresa en cada producto.' },
  { icon: FileText, t: 'Factura y boleta', d: 'Documentación tributaria completa para tu contabilidad.' },
  { icon: Truck, t: 'Despacho a oficina', d: 'Entregamos directo a tu empresa, en una o varias direcciones.' },
  { icon: Building2, t: 'Desde 20 unidades', d: 'Kit corporativo desde $25.000 por unidad. Más volumen, mejor precio.' },
];

export default function FiestasEmpresas() {
  const formRef = useRef(null);
  const [form, setForm] = useState({ contact_name: '', company_name: '', email: '', phone: '', qty_estimate: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { base44.analytics.track({ eventName: 'fiestas_landing_view', properties: { variante: 'empresas_b2b' } }); } catch {}
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.contact_name.trim() || !form.company_name.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setError('Completa nombre, empresa y un email válido.');
      return;
    }
    setSending(true);
    try {
      await base44.entities.B2BLead.create({
        source: 'Formulario Web',
        contact_name: form.contact_name.trim(),
        company_name: form.company_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        qty_estimate: Number(form.qty_estimate) || 0,
        product_interest: 'Kit Corporativo Fiestas Patrias',
        status: 'Nuevo',
        urgency: 'Alta',
        tags: ['fiestas-patrias', 'kit-corporativo'],
        notes: 'Lead desde landing Fiestas Patrias B2B. Deadline pedido: 5 sept para entrega 18S.',
      });
      try { base44.analytics.track({ eventName: 'fiestas_b2b_lead', properties: { empresa: form.company_name } }); } catch {}
      setDone(true);
    } catch (err) {
      setError('No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos a ti@peyuchile.cl');
    } finally {
      setSending(false);
    }
  };

  const inputCls = 'w-full h-12 px-4 rounded-xl text-sm outline-none transition-all';
  const inputStyle = { background: '#F8F3ED', border: '1.5px solid #D4C4B0', color: '#2C1810' };

  return (
    <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEO
        title="Kits Corporativos Fiestas Patrias — Regala con identidad · PEYU"
        description="Kits corporativos chilenos con tu marca para Fiestas Patrias. Grabado láser con tu logo, factura y despacho a oficina. Pedidos antes del 5 de septiembre = entrega garantizada el 18."
        canonical="https://peyuchile.cl/fiestas-patrias/empresas"
      />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#2C1810' }}>
        <div className="absolute top-0 inset-x-0 h-1.5 flex">
          <div className="flex-1" style={{ background: '#0F3D91' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#D52B1E' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-5 pt-14 pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(255,255,255,.1)', color: '#F2D9C9' }}>
            <Briefcase className="w-3.5 h-3.5" /> Programa Corporativo · Fiestas Patrias
          </span>
          <h1 className="font-fraunces text-4xl sm:text-5xl leading-[1.05] mb-4 text-white">
            Regala con <span style={{ color: '#E89B6C' }}>identidad</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ color: '#D4C4B0' }}>
            Kits corporativos 100% chilenos con la marca de tu empresa. Factura, despacho a oficina
            y entrega garantizada para el 18.
          </p>
          <div className="mb-9 flex justify-center"><CountdownDieciocho label="Cierre de pedidos B2B" /></div>
          <button onClick={scrollToForm}
            className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl text-white font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
            Cotizar mi kit corporativo <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── DEADLINE BANNER ─────────────────────────────────────────── */}
      <section className="px-5 -mt-6 relative z-10">
        <div className="max-w-3xl mx-auto rounded-2xl p-4 flex items-center gap-3" style={{ background: '#A8443A', boxShadow: '0 10px 28px rgba(168,68,58,.3)' }}>
          <Clock className="w-6 h-6 text-white flex-shrink-0" />
          <p className="text-sm font-semibold text-white">
            Pedidos antes del <strong>5 de septiembre</strong> tienen despacho garantizado para el <strong>18</strong>.
          </p>
        </div>
      </section>

      {/* ── VENTAJAS ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <h2 className="font-fraunces text-2xl sm:text-3xl text-center mb-8">El kit corporativo Peyu</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {VENTAJAS.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl p-5 flex gap-4" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,120,92,.12)' }}>
                <Icon className="w-5 h-5" style={{ color: '#C0785C' }} />
              </div>
              <div>
                <p className="font-bold mb-1">{t}</p>
                <p className="text-sm" style={{ color: '#7A6050' }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM LEAD B2B ───────────────────────────────────────────── */}
      <section ref={formRef} className="px-5 pb-20">
        <div className="max-w-xl mx-auto rounded-3xl p-7" style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 12px 32px rgba(44,24,16,.08)' }}>
          {done ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
                <Check className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-fraunces text-2xl mb-2">¡Solicitud recibida!</h3>
              <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
                Te contactaremos dentro de 4 horas hábiles con tu propuesta personalizada de kits corporativos.
              </p>
              <Link to="/fiestas-patrias" className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: '#A8443A' }}>
                Volver a la campaña <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: '#C0785C' }} />
                <h2 className="font-fraunces text-2xl">Cotiza tu kit en minutos</h2>
              </div>
              <p className="text-sm mb-6" style={{ color: '#7A6050' }}>Respuesta en 4 horas hábiles. Sin costo ni compromiso.</p>
              <form onSubmit={submit} className="space-y-3">
                <input className={inputCls} style={inputStyle} placeholder="Tu nombre *"
                  value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                <input className={inputCls} style={inputStyle} placeholder="Empresa *"
                  value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                <input className={inputCls} style={inputStyle} type="email" placeholder="Email corporativo *"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className={inputCls} style={inputStyle} placeholder="Teléfono / WhatsApp"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className={inputCls} style={inputStyle} type="number" placeholder="¿Cuántos kits necesitas? (mínimo 20)"
                  value={form.qty_estimate} onChange={(e) => setForm({ ...form, qty_estimate: e.target.value })} />
                {error && <p className="text-xs font-semibold" style={{ color: '#A8443A' }}>{error}</p>}
                <button type="submit" disabled={sending}
                  className="w-full h-13 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</> : <><Briefcase className="w-5 h-5" /> Solicitar cotización</>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}