import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { TEAM_EMAILS, isTeamMember } from '@/lib/team-whitelist';

export default function AdminAccessDenied() {
  const { user, logout, navigateToLogin } = useAuth();
  const email = user?.email;
  const isTeam = isTeamMember(email);

  // Logout + relogin: limpia token y manda directo al login para elegir otra cuenta de Google.
  const handleSwitchAccount = () => {
    try {
      base44.auth.logout();
    } catch (e) { /* noop */ }
    setTimeout(() => navigateToLogin(), 50);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-full bg-red-50">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso restringido</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-5">
          Esta zona es exclusiva del equipo PEYU. Iniciá sesión con un correo autorizado{' '}
          (<span className="font-mono text-[11px]">@peyuchile.cl</span> o el del fundador).
        </p>

        <div className="bg-slate-50 rounded-lg px-4 py-3 mb-5 text-xs text-left space-y-2">
          <div className="text-slate-600">
            Sesión actual:{' '}
            <span className="font-semibold text-slate-900">{email || '— sin sesión —'}</span>
          </div>
          {email && (
            <div className={`text-[11px] font-medium ${isTeam ? 'text-emerald-700' : 'text-red-600'}`}>
              {isTeam ? '✓ Email autorizado' : '✗ Email NO está en la whitelist del equipo'}
            </div>
          )}
          <details className="text-[10px] text-slate-500">
            <summary className="cursor-pointer hover:text-slate-700">Ver whitelist autorizada</summary>
            <ul className="mt-1.5 space-y-0.5 font-mono">
              {TEAM_EMAILS.map(e => <li key={e}>· {e}</li>)}
            </ul>
          </details>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSwitchAccount}
            className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <LogIn className="w-4 h-4" /> Iniciar con otra cuenta de Google
          </Button>
          <Link to="/">
            <Button variant="outline" className="w-full gap-2 text-slate-600">
              <Home className="w-4 h-4" /> Volver al sitio
            </Button>
          </Link>
          {email && (
            <button
              onClick={() => logout(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 mt-1 inline-flex items-center justify-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}