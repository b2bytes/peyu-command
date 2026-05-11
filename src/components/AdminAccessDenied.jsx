import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function AdminAccessDenied() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-full bg-red-50">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso restringido</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Esta zona es exclusiva del equipo PEYU. Si necesitas acceso, escribe a{' '}
          <a href="mailto:ti@peyuchile.cl" className="text-emerald-700 font-semibold underline">
            ti@peyuchile.cl
          </a>.
        </p>

        {user?.email && (
          <div className="bg-slate-50 rounded-lg px-4 py-3 mb-6 text-xs text-slate-500">
            Sesión iniciada como <span className="font-semibold text-slate-700">{user.email}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link to="/">
            <Button className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Home className="w-4 h-4" /> Volver al sitio
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => logout(true)}
            className="w-full gap-2 text-slate-600"
          >
            <LogOut className="w-4 h-4" /> Cambiar de cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}