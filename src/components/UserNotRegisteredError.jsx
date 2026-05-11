// ============================================================================
// UserNotRegisteredError — Pantalla que se muestra cuando un usuario inició
// sesión con Google pero su email NO fue invitado a la app en Base44.
//
// Detecta automáticamente si el usuario pertenece al dominio @peyuchile.cl
// y le muestra un mensaje específico y profesional. También permite al admin
// (logueado con su sesión) invitar a todo el equipo de un click.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Mail, RefreshCw, LogOut, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TEAM_DOMAIN = '@peyuchile.cl';
const TEAM_EMAILS = [
  'jnilo@peyuchile.cl',
  'cmoscoso@peyuchile.cl',
  'ventas@peyuchile.cl',
  'corporativos@peyuchile.cl',
  'jsanchez@peyuchile.cl',
  'ti@peyuchile.cl',
];

const UserNotRegisteredError = () => {
  // Recuperamos el email intentado desde el SDK (best effort)
  const [attemptedEmail, setAttemptedEmail] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // base44.auth.me() falla acá, pero a veces el token tiene el email
        const me = await base44.auth.me();
        if (me?.email) setAttemptedEmail(me.email);
      } catch {}
    })();
  }, []);

  const isPeyuTeam = attemptedEmail?.toLowerCase().endsWith(TEAM_DOMAIN);

  const handleInviteTeam = async () => {
    setInviting(true);
    setInviteResult(null);
    let invitados = 0, ya_existentes = 0, errores = 0;
    const errorList = [];
    for (const email of TEAM_EMAILS) {
      try {
        await base44.users.inviteUser(email, 'admin');
        invitados++;
      } catch (err) {
        const msg = String(err?.message || err);
        if (/already|exist|registered|invited/i.test(msg)) {
          ya_existentes++;
        } else {
          errores++;
          errorList.push(`${email}: ${msg}`);
        }
      }
    }
    setInviteResult({ invitados, ya_existentes, errores, errorList });
    setInviting(false);
  };

  const handleLogout = () => {
    try { base44.auth.logout(window.location.origin); }
    catch { window.location.href = '/'; }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/40 px-6 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isPeyuTeam ? 'bg-emerald-50' : 'bg-amber-50'
          }`}>
            {isPeyuTeam
              ? <ShieldCheck className="w-8 h-8 text-emerald-600" />
              : <Mail className="w-8 h-8 text-amber-600" />}
          </div>
        </div>

        {isPeyuTeam ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              Detectamos que sos del equipo PEYU
            </h1>
            <p className="text-slate-600 text-sm text-center mb-5 leading-relaxed">
              Tu cuenta <strong className="text-slate-900">{attemptedEmail}</strong> aún
              no fue habilitada en esta app. Si sos administrador, podés invitar a todo
              el equipo ahora mismo:
            </p>

            <Button
              onClick={handleInviteTeam}
              disabled={inviting}
              className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800 text-white h-11"
            >
              {inviting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Invitando al equipo…</>
                : <><ShieldCheck className="w-4 h-4" /> Invitar a todo el equipo PEYU</>}
            </Button>

            {inviteResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
                inviteResult.error
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {inviteResult.error
                  ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  {inviteResult.error ? (
                    <p>{inviteResult.error}</p>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">¡Listo!</p>
                      <p className="text-xs">
                        {inviteResult.invitados} invitados nuevos · {inviteResult.ya_existentes} ya existían
                        {inviteResult.errores ? ` · ${inviteResult.errores} con error` : ''}.
                      </p>
                      <p className="text-xs mt-1.5">
                        Pediles que recarguen esta página o que vuelvan a iniciar sesión con Google.
                      </p>
                      {inviteResult.errorList?.length > 0 && (
                        <details className="mt-2 text-[11px] opacity-80">
                          <summary className="cursor-pointer">Ver errores</summary>
                          <ul className="mt-1 space-y-0.5">
                            {inviteResult.errorList.map((e, i) => <li key={i}>· {e}</li>)}
                          </ul>
                        </details>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800 mb-1">¿No sos administrador?</p>
              Pediles a un admin de PEYU que abra esta página con su cuenta y haga click
              en el botón verde. Tu cuenta queda lista automáticamente.
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1 gap-2 text-slate-700"
              >
                <RefreshCw className="w-4 h-4" /> Recargar
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1 gap-2 text-slate-700"
              >
                <LogOut className="w-4 h-4" /> Cambiar cuenta
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              Acceso restringido
            </h1>
            <p className="text-slate-600 text-sm text-center mb-5 leading-relaxed">
              {attemptedEmail
                ? <>Tu cuenta <strong className="text-slate-900">{attemptedEmail}</strong> no está habilitada para usar esta aplicación.</>
                : 'Tu cuenta no está habilitada para usar esta aplicación.'}
            </p>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-900 mb-5">
              <p className="font-semibold mb-1">¿Pertenecés al equipo PEYU?</p>
              <p className="text-xs leading-relaxed">
                Escribinos a <a href="mailto:ti@peyuchile.cl" className="underline font-semibold">ti@peyuchile.cl</a> y
                te habilitamos en minutos.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1 gap-2 text-slate-700"
              >
                <RefreshCw className="w-4 h-4" /> Recargar
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1 gap-2 text-slate-700"
              >
                <LogOut className="w-4 h-4" /> Cambiar cuenta
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserNotRegisteredError;