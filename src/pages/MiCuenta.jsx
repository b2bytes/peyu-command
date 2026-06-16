import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  User, Package, LogOut, Mail, Phone, ShoppingBag, Loader2, ListOrdered, Lock,
} from 'lucide-react';
import PublicSEO from '@/components/PublicSEO';
import PublicHero from '@/components/public/PublicHero';
import PedidoCard from '@/components/cuenta/PedidoCard';

// ════════════════════════════════════════════════════════════════════════
// /mi-cuenta — Perfil del cliente registrado. Inicia sesión con la cuenta de
// la plataforma (mismo login), ve sus datos y TODO su historial de compras
// (PedidoWeb por su email). La RLS de PedidoWeb ya permite leer pedidos
// propios por email. Página pública: si no hay sesión, ofrece iniciar sesión.
// ════════════════════════════════════════════════════════════════════════
export default function MiCuenta() {
  const [user, setUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setUser(me);
        if (me?.email) {
          setLoadingPedidos(true);
          // Compras del cliente por su email (RLS permite leer las propias).
          const propios = await base44.entities.PedidoWeb
            .filter({ cliente_email: me.email.toLowerCase() }, '-created_date', 100)
            .catch(() => []);
          if (!cancelled) setPedidos(propios || []);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) { setLoading(false); setLoadingPedidos(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const iniciarSesion = () => base44.auth.redirectToLogin(window.location.href);
  const cerrarSesion = () => base44.auth.logout(window.location.origin + '/mi-cuenta');

  if (loading) {
    return (
      <div className="ld-canvas flex-1 flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ld-action)' }} />
      </div>
    );
  }

  // ── No autenticado: invitación a iniciar sesión ──────────────────────
  if (!user?.email) {
    return (
      <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
        <PublicSEO pageKey="mi-cuenta" noindex />
        <PublicHero
          eyebrow="Mi cuenta"
          title={<>Tu <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>perfil.</span></>}
          subtitle="Inicia sesión para ver tus datos y el historial de todas tus compras."
        />
        <div className="max-w-md mx-auto px-4 pb-16">
          <div className="ld-card p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'var(--ld-action-soft)' }}>
              <Lock className="w-8 h-8" style={{ color: 'var(--ld-action)' }} />
            </div>
            <div>
              <h2 className="ld-display text-2xl text-ld-fg">Inicia sesión</h2>
              <p className="text-sm text-ld-fg-muted mt-1.5">
                Accede con tu correo para ver tus pedidos, su estado y seguimiento en un solo lugar.
              </p>
            </div>
            <Button onClick={iniciarSesion} className="ld-btn-primary w-full gap-2 rounded-full h-12 text-white font-semibold">
              <User className="w-4 h-4" /> Iniciar sesión / Registrarme
            </Button>
            <p className="text-xs text-ld-fg-muted">
              ¿Solo quieres rastrear un pedido?{' '}
              <Link to="/seguimiento" className="font-bold" style={{ color: 'var(--ld-action)' }}>Búscalo por su número</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Autenticado: perfil + historial de compras ──────────────────────
  const totalGastado = pedidos.reduce((s, p) => s + (p.total || 0), 0);

  return (
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <PublicSEO pageKey="mi-cuenta" noindex />

      <PublicHero
        eyebrow="Mi cuenta"
        title={<>Hola, <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>{(user.full_name || 'cliente').split(' ')[0]}.</span></>}
        subtitle="Aquí está tu perfil y el historial de todas tus compras."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-5 pb-12 space-y-5">
        {/* PERFIL */}
        <div className="ld-card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--ld-action)' }}>
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="ld-display text-xl text-ld-fg">{user.full_name || 'Cliente'}</h2>
                <p className="text-sm text-ld-fg-muted flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
              </div>
            </div>
            <Button onClick={cerrarSesion} size="sm" className="ld-btn-ghost rounded-full gap-1.5 text-ld-fg flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="ld-glass-soft rounded-xl p-3">
              <p className="text-ld-fg-muted text-xs mb-0.5 flex items-center gap-1"><ListOrdered className="w-3 h-3" /> Compras</p>
              <p className="font-bold text-ld-fg text-lg">{pedidos.length}</p>
            </div>
            <div className="ld-glass-soft rounded-xl p-3">
              <p className="text-ld-fg-muted text-xs mb-0.5">Total comprado</p>
              <p className="font-bold text-ld-fg text-lg">${totalGastado.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>

        {/* HISTORIAL DE COMPRAS */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Package className="w-5 h-5" style={{ color: 'var(--ld-action)' }} />
            <h3 className="ld-display text-xl text-ld-fg">Mis compras</h3>
          </div>

          {loadingPedidos ? (
            <div className="ld-card p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--ld-action)' }} />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="ld-card p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'var(--ld-bg-soft)' }}>
                <ShoppingBag className="w-8 h-8 text-ld-fg-muted" />
              </div>
              <div>
                <p className="font-semibold text-ld-fg">Aún no tienes compras</p>
                <p className="text-sm text-ld-fg-muted mt-1">Cuando compres con este correo, tus pedidos aparecerán aquí.</p>
              </div>
              <Link to="/CatalogoNuevo">
                <Button className="ld-btn-primary gap-2 rounded-full text-white">
                  <ShoppingBag className="w-4 h-4" /> Ir a la tienda
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((p) => <PedidoCard key={p.id} pedido={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}