// Guard de acceso para la página /propuesta-valor-peyu.
// Solo Diego Díaz (alfonsovambe@gmail.com) puede ver el contenido.
// Cualquier otro usuario (autenticado o no) ve un bloqueo de acceso.
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OWNER_EMAIL = 'alfonsovambe@gmail.com';

export default function PrivateGuard({ children }) {
  const [status, setStatus] = useState('checking'); // checking | granted | denied | anonymous

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (cancelled) return;
        if (!authed) {
          setStatus('anonymous');
          return;
        }
        const me = await base44.auth.me();
        if (cancelled) return;
        const email = String(me?.email || '').trim().toLowerCase();
        setStatus(email === OWNER_EMAIL ? 'granted' : 'denied');
      } catch {
        if (!cancelled) setStatus('anonymous');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status === 'granted') return children;

  return (
    <div
      data-liquid-mode="night"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#020617', color: '#F1F5F9' }}
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 text-center">
        {status === 'checking' ? (
          <>
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-inter">Verificando acceso…</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-rose-300" />
            </div>
            <h1 className="font-fraunces text-2xl md:text-3xl font-medium text-slate-50 tracking-tight mb-3">
              Documento privado
            </h1>
            <p className="text-slate-400 font-inter text-[14px] leading-relaxed mb-6">
              Esta página es un documento confidencial de trabajo interno. El acceso está restringido
              al propietario del proyecto.
            </p>
            {status === 'anonymous' && (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold font-jakarta"
              >
                Iniciar sesión
              </Button>
            )}
            {status === 'denied' && (
              <Button
                variant="outline"
                onClick={() => base44.auth.logout('/')}
                className="border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Cerrar sesión
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}