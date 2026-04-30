import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Gift, Check, Loader2, Mail, ArrowLeft, ArrowRight, Recycle, Sparkles,
  Shield, Clock, Calendar
} from 'lucide-react';
import SEO from '@/components/SEO';
import GiftCardVisual from '@/components/giftcard/GiftCardVisual';
import AmountSelector, { MIN_CUSTOM, MAX_CUSTOM } from '@/components/giftcard/AmountSelector';
import RecipientForm, { isValidEmail } from '@/components/giftcard/RecipientForm';
import SuccessActions from '@/components/giftcard/SuccessActions';

const STEPS = [
  { n: 1, label: 'Monto' },
  { n: 2, label: 'Destinatario' },
  { n: 3, label: 'Confirmar' },
];

export default function RegalarGiftCard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [monto, setMonto] = useState({ v: 20000, label: '$20.000', tag: 'Más popular' });
  const [form, setForm] = useState({
    comprador_nombre: '', comprador_email: '',
    destinatario_nombre: '', destinatario_email: '',
    mensaje: '',
  });
  const [fechaEnvio, setFechaEnvio] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const montoValido = monto.v >= MIN_CUSTOM && monto.v <= MAX_CUSTOM;
  const datosValidos = useMemo(() => (
    form.destinatario_nombre.trim() &&
    isValidEmail(form.destinatario_email) &&
    form.comprador_nombre.trim() &&
    isValidEmail(form.comprador_email)
  ), [form]);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await base44.functions.invoke('enviarGiftCard', {
        monto: monto.v,
        ...form,
        fecha_envio_programada: fechaEnvio || null,
      });
      if (res.data?.ok) {
        setResultado(res.data);
        setStep(4);
        // Scroll suave al inicio para ver la confirmación completa
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.data?.error || 'No se pudo emitir la Gift Card');
      }
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setStep(1);
    setResultado(null);
    setForm({ comprador_nombre: '', comprador_email: '', destinatario_nombre: '', destinatario_email: '', mensaje: '' });
    setFechaEnvio('');
    setError('');
  };

  return (
    <>
      <SEO
        title="Regala una Gift Card PEYU · Regalo Sostenible 100% Reciclado"
        description="Regala sostenibilidad con una Gift Card PEYU. Entrega digital inmediata por email, válida 12 meses en toda la tienda. Desde $5.000 CLP."
        canonical="https://peyuchile.cl/regalar-giftcard"
      />
      <div className="flex-1 overflow-auto py-10 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D96B4D] to-[#0F8B6C] items-center justify-center mb-4 shadow-2xl shadow-emerald-500/20">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-white mb-2">Regala una Gift Card PEYU</h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm sm:text-base">El regalo perfecto: sostenible, único y entregado al instante por email.</p>
          </div>

          {/* Trust badges */}
          {step < 4 && (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-[11px] text-white/50">
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-400" /> Entrega por email</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Vigencia 12 meses</span>
              <span className="inline-flex items-center gap-1.5"><Recycle className="w-3.5 h-3.5 text-emerald-400" /> 100% digital, 0 plástico</span>
              <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Código único</span>
            </div>
          )}

          {/* Stepper */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {STEPS.map((s, idx) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s.n ? 'bg-emerald-500 text-white' :
                      step === s.n ? 'bg-emerald-400 text-slate-900 ring-4 ring-emerald-400/20 scale-110' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${step >= s.n ? 'text-white/80' : 'text-white/30'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 transition-all -mt-4 ${step > s.n ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CONTENIDO PRINCIPAL — Grid con preview persistente en desktop */}
          {step < 4 ? (
            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
              {/* Columna izquierda: pasos */}
              <div className="space-y-5 order-2 lg:order-1">

                {/* STEP 1 — Monto */}
                {step === 1 && (
                  <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white mb-1">Elige el monto</h2>
                      <p className="text-sm text-white/50">Verás cómo cambia el diseño de la tarjeta en tiempo real →</p>
                    </div>
                    <AmountSelector monto={monto} onChange={setMonto} />
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!montoValido}
                      className="w-full mt-6 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* STEP 2 — Destinatario */}
                {step === 2 && (
                  <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white mb-1">¿Para quién es?</h2>
                      <p className="text-sm text-white/50">Le enviaremos el código al email indicado</p>
                    </div>
                    <RecipientForm
                      form={form}
                      setForm={setForm}
                      fechaEnvio={fechaEnvio}
                      setFechaEnvio={setFechaEnvio}
                    />
                    <div className="flex gap-2 pt-5 mt-5 border-t border-white/10">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                        <ArrowLeft className="w-4 h-4" /> Atrás
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!datosValidos}
                        className="flex-[2] h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                      >
                        Revisar regalo <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Confirmar */}
                {step === 3 && (
                  <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white mb-1">Confirmar regalo</h2>
                      <p className="text-sm text-white/50">Revisa los detalles antes de emitir</p>
                    </div>

                    <div className="bg-black/25 rounded-2xl p-4 space-y-2.5 text-sm">
                      <Row label="Monto" value={<strong className="text-white text-lg">{monto.label}</strong>} />
                      <Divider />
                      <Row label="Para" value={<><strong className="text-white">{form.destinatario_nombre}</strong><br/><span className="text-xs text-white/50">{form.destinatario_email}</span></>} />
                      <Row label="De" value={<><strong className="text-white">{form.comprador_nombre}</strong><br/><span className="text-xs text-white/50">{form.comprador_email}</span></>} />
                      {fechaEnvio && (
                        <>
                          <Divider />
                          <Row label="Entrega" value={<span className="inline-flex items-center gap-1.5 text-white"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {new Date(fechaEnvio).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>} />
                        </>
                      )}
                      {form.mensaje && (
                        <>
                          <Divider />
                          <div>
                            <p className="text-white/50 text-xs mb-1">Tu mensaje</p>
                            <p className="italic text-white/80 text-sm bg-white/5 rounded-lg p-2.5">"{form.mensaje}"</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Al confirmar generamos el código único y enviamos el email a{' '}
                        <strong>{form.destinatario_email}</strong>. Tú recibirás una copia en{' '}
                        <strong>{form.comprador_email}</strong>.
                      </p>
                    </div>

                    {error && (
                      <p className="text-sm text-red-300 bg-red-500/15 border border-red-400/30 rounded-xl p-3">{error}</p>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                        <ArrowLeft className="w-4 h-4" /> Atrás
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] h-12 bg-gradient-to-r from-[#D96B4D] to-[#0F8B6C] hover:opacity-90 text-white font-bold rounded-xl gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando regalo...</>
                          : <><Gift className="w-4 h-4" /> Regalar ahora</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha: PREVIEW PERSISTENTE */}
              <aside className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-6 space-y-4">
                  <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Vista previa en vivo
                  </p>
                  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40 transition-all duration-500">
                    <GiftCardVisual
                      monto={monto.v}
                      destinatario={form.destinatario_nombre || 'Destinatario'}
                      remitente={form.comprador_nombre || 'Tú'}
                    />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white/55 leading-relaxed space-y-1.5">
                    <p className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> Diseño Kraft natural exclusivo PEYU</p>
                    <p className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> Código alfanumérico único de 8 dígitos</p>
                    <p className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> Acumulable con descuentos del sitio</p>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            // ── STEP 4 — ÉXITO ────────────────────────────────────
            resultado && (
              <div className="max-w-2xl mx-auto bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
                <div className="inline-flex w-20 h-20 rounded-full bg-emerald-500/25 items-center justify-center ring-4 ring-emerald-400/20">
                  <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">¡Regalo enviado! 🎉</h2>
                  <p className="text-white/60 text-sm">
                    {resultado.email_enviado
                      ? <>Le enviamos un email a <strong className="text-white">{form.destinatario_email}</strong> con el código y el diseño de la tarjeta.</>
                      : <>Tu Gift Card fue creada exitosamente. Hubo un retraso en el email — pero el código abajo es válido y ya puedes compartirlo.</>}
                  </p>
                  {resultado.email_enviado && resultado.email_copia_comprador && (
                    <p className="text-emerald-300 text-xs mt-2">
                      ✓ Copia enviada a tu email ({form.comprador_email})
                    </p>
                  )}
                </div>

                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <GiftCardVisual
                    monto={monto.v}
                    destinatario={form.destinatario_nombre}
                    remitente={form.comprador_nombre}
                    codigo={resultado.codigo}
                    showCode
                  />
                </div>

                <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold mb-1">Código emitido</p>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-widest">{resultado.codigo}</p>
                  <p className="text-xs text-white/60 mt-2">
                    Saldo: <strong className="text-white">${new Intl.NumberFormat('es-CL').format(resultado.monto_clp)} CLP</strong>
                    <span className="text-white/40 mx-2">·</span>
                    Vigente hasta {new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <SuccessActions
                  codigo={resultado.codigo}
                  monto={resultado.monto_clp}
                  destinatario={form.destinatario_nombre}
                  comprador={form.comprador_nombre}
                />

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <Button onClick={() => navigate('/')} variant="outline" className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">
                    Volver al inicio
                  </Button>
                  <Button onClick={reset} className="h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2">
                    <Gift className="w-4 h-4" /> Regalar otra
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

// Pequeños helpers visuales — sub-componentes inline livianos
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-white/50 text-xs uppercase tracking-wider flex-shrink-0">{label}</span>
      <div className="text-right text-sm">{value}</div>
    </div>
  );
}
function Divider() {
  return <div className="border-t border-white/10" />;
}