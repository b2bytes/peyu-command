import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, KeyRound, Loader2, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';

export default function PanelAuthForm({ onAuthenticated }) {
  const [stage, setStage] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState('');

  const requestCode = async () => {
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('b2bPanelAccess', { action: 'request', email: email.trim() });
      if (res?.data?.error) throw new Error(res.data.error);
      setCompany(res?.data?.masked_company || '');
      setStage('code');
    } catch (e) {
      setError(e.message || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) { setError('Ingresa los 6 dígitos'); return; }
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('b2bPanelAccess', { action: 'verify', email: email.trim(), code });
      if (res?.data?.error) throw new Error(res.data.error);
      onAuthenticated(res.data);
    } catch (e) {
      setError(e.message || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/5 border border-white/15 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-poppins font-bold text-white text-center">Mi cuenta corporativa</h1>
        <p className="text-white/60 text-sm text-center mt-1">
          {stage === 'email'
            ? 'Ingresa el email con el que cotizaste. Te enviaremos un código.'
            : 'Ingresa el código de 6 dígitos que enviamos a tu correo.'}
        </p>

        <div className="mt-6 space-y-3">
          {stage === 'email' ? (
            <>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && requestCode()}
                  placeholder="correo@empresa.cl"
                  className="h-12 pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <Button onClick={requestCode} disabled={loading || !email.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2 shadow-lg">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <>Enviar código <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </>
          ) : (
            <>
              {company && (
                <div className="bg-teal-500/10 border border-teal-400/30 rounded-xl px-3 py-2 text-xs text-teal-200 text-center">
                  Cuenta: <span className="font-bold">{company}</span>
                </div>
              )}
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block">Código de 6 dígitos</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && !loading && verifyCode()}
                  placeholder="123456"
                  inputMode="numeric"
                  className="h-12 pl-10 rounded-xl bg-white/10 border-white/20 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-white/20"
                />
              </div>
              <Button onClick={verifyCode} disabled={loading || code.length !== 6}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2 shadow-lg">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
              </Button>
              <button onClick={() => { setStage('email'); setCode(''); setError(''); }}
                className="w-full text-white/50 hover:text-white/80 text-xs flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Usar otro email
              </button>
            </>
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/40 text-red-300 px-3 py-2 rounded-xl text-xs">{error}</div>
          )}
        </div>

        <p className="text-[10px] text-white/30 text-center mt-6">
          ¿Primera vez? Cotiza primero en{' '}
          <a href="/b2b/self-service" className="text-teal-300 underline">propuesta self-service</a> o{' '}
          <a href="/b2b/contacto" className="text-teal-300 underline">contáctanos</a>.
        </p>
      </div>
    </div>
  );
}