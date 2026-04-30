import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Check, Loader2, Mail, ArrowLeft, Heart, Recycle, Sparkles } from 'lucide-react';
import SEO from '@/components/SEO';
import GiftCardVisual from '@/components/giftcard/GiftCardVisual';

const MONTOS = [
  { v: 10000, label: '$10.000', tag: 'Detalle' },
  { v: 20000, label: '$20.000', tag: 'Más popular' },
  { v: 50000, label: '$50.000', tag: 'Premium' },
  { v: 100000, label: '$100.000', tag: 'Corporativo' },
];

export default function RegalarGiftCard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=monto, 2=destinatario, 3=resumen, 4=confirmación
  const [monto, setMonto] = useState(MONTOS[1]);
  const [form, setForm] = useState({
    comprador_nombre: '', comprador_email: '',
    destinatario_nombre: '', destinatario_email: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await base44.functions.invoke('enviarGiftCard', {
        monto: monto.v,
        ...form,
      });
      if (res.data?.ok) {
        setResultado(res.data);
        setStep(4);
      } else {
        setError(res.data?.error || 'No se pudo emitir la Gift Card');
      }
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <SEO
        title="Regala una Gift Card PEYU · Regalo Sostenible 100% Reciclado"
        description="Regala sostenibilidad con una Gift Card PEYU. Entrega digital inmediata por email, válida en toda la tienda. Desde $10.000 CLP."
        canonical="https://peyuchile.cl/regalar-giftcard"
      />
      <div className="flex-1 overflow-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D96B4D] to-[#0F8B6C] items-center justify-center mb-4 shadow-2xl">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-white mb-2">Regala una Gift Card PEYU</h1>
            <p className="text-white/60 max-w-lg mx-auto">El regalo perfecto: sostenible, único y entregado al instante por email.</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step >= n ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
                }`}>{step > n ? <Check className="w-3.5 h-3.5" /> : n}</div>
                {n < 3 && <div className={`w-12 h-0.5 transition ${step > n ? 'bg-emerald-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Monto */}
          {step === 1 && (
            <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h2 className="text-xl font-poppins font-bold text-white mb-1">1. Elige el monto</h2>
              <p className="text-sm text-white/50 mb-6">Selecciona el valor de tu Gift Card</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {MONTOS.map(m => (
                  <button
                    key={m.v}
                    onClick={() => setMonto(m)}
                    className={`group relative text-left rounded-2xl transition-all overflow-hidden ${
                      monto.v === m.v
                        ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-slate-900 scale-[1.02]'
                        : 'opacity-75 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    <GiftCardVisual monto={m.v} />
                    {monto.v === m.v && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-slate-900" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full mt-6 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl">Continuar →</Button>
            </div>
          )}

          {/* STEP 2 — Destinatario */}
          {step === 2 && (
            <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <h2 className="text-xl font-poppins font-bold text-white mb-1">2. ¿Para quién es?</h2>
              <p className="text-sm text-white/50 mb-4">Le enviaremos el código por email</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1 block">Nombre destinatario *</label>
                  <Input value={form.destinatario_nombre} onChange={e => setForm({...form, destinatario_nombre: e.target.value})}
                    placeholder="Ana López" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1 block">Email destinatario *</label>
                  <Input type="email" value={form.destinatario_email} onChange={e => setForm({...form, destinatario_email: e.target.value})}
                    placeholder="ana@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Tus datos</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1 block">Tu nombre *</label>
                    <Input value={form.comprador_nombre} onChange={e => setForm({...form, comprador_nombre: e.target.value})}
                      placeholder="Juan Pérez" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1 block">Tu email *</label>
                    <Input type="email" value={form.comprador_email} onChange={e => setForm({...form, comprador_email: e.target.value})}
                      placeholder="juan@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-pink-400" /> Mensaje personal (opcional)
                </label>
                <Textarea value={form.mensaje} onChange={e => setForm({...form, mensaje: e.target.value.slice(0, 200)})}
                  placeholder="¡Feliz cumpleaños! Disfruta este regalo sostenible..."
                  rows={3} className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none" />
                <p className="text-[10px] text-white/40 text-right mt-1">{form.mensaje.length}/200</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10">← Atrás</Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!form.destinatario_nombre || !form.destinatario_email || !form.comprador_nombre || !form.comprador_email}
                  className="flex-1 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl"
                >Revisar →</Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Resumen */}
          {step === 3 && (
            <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <h2 className="text-xl font-poppins font-bold text-white">3. Confirmar regalo</h2>

              <div className="rounded-2xl overflow-hidden">
                <GiftCardVisual
                  monto={monto.v}
                  destinatario={form.destinatario_nombre}
                  remitente={form.comprador_nombre}
                />
              </div>

              <div className="space-y-2 text-sm bg-black/20 rounded-2xl p-4">
                <div className="flex justify-between"><span className="text-white/50">Monto</span><strong className="text-white">{monto.label}</strong></div>
                <div className="flex justify-between"><span className="text-white/50">Para</span><strong className="text-white">{form.destinatario_nombre}</strong></div>
                <div className="flex justify-between"><span className="text-white/50">Email</span><strong className="text-white text-xs">{form.destinatario_email}</strong></div>
                <div className="flex justify-between"><span className="text-white/50">De</span><strong className="text-white">{form.comprador_nombre}</strong></div>
                {form.mensaje && (
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <p className="text-white/50 text-xs mb-1">Mensaje</p>
                    <p className="italic text-white/80 text-xs">"{form.mensaje}"</p>
                  </div>
                )}
              </div>

              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Al confirmar, generamos el código y enviamos el email a <strong>{form.destinatario_email}</strong> con el diseño Kraft, tu mensaje y el código de canje.</p>
              </div>

              {error && <p className="text-sm text-red-300 bg-red-500/15 border border-red-400/30 rounded-xl p-3">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10">← Atrás</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-[#D96B4D] to-[#0F8B6C] text-white font-bold rounded-xl gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Gift className="w-4 h-4" /> Regalar ahora</>}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 — Éxito */}
          {step === 4 && resultado && (
            <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-8 shadow-2xl text-center space-y-5">
              <div className="inline-flex w-20 h-20 rounded-full bg-emerald-500/25 items-center justify-center">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-poppins font-bold text-white">¡Regalo enviado! 🎉</h2>
              <p className="text-white/60">
                {resultado.email_enviado
                  ? <>Le enviamos un email a <strong className="text-white">{form.destinatario_email}</strong> con el código y el diseño de la tarjeta.</>
                  : <>Tu Gift Card fue creada. Hubo un retraso en el email — pero el código abajo es válido.</>}
              </p>
              <div className="rounded-2xl overflow-hidden">
                <GiftCardVisual
                  monto={monto.v}
                  destinatario={form.destinatario_nombre}
                  remitente={form.comprador_nombre}
                  codigo={resultado.codigo}
                  showCode
                />
              </div>
              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 text-center">
                <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold mb-1">Código emitido</p>
                <p className="font-mono text-2xl font-bold text-white tracking-widest">{resultado.codigo}</p>
                <p className="text-xs text-white/60 mt-2">Saldo: <strong className="text-white">${new Intl.NumberFormat('es-CL').format(resultado.monto_clp)} CLP</strong></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => navigate('/')} variant="outline" className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl">Volver al inicio</Button>
                <Button onClick={() => { setStep(1); setResultado(null); setForm({comprador_nombre: '', comprador_email: '', destinatario_nombre: '', destinatario_email: '', mensaje: ''}); }}
                  className="h-12 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl">Regalar otra</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}