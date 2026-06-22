// ============================================================================
// AdminAppHome · /admin/inicio-app — Home de la PWA de fundadores (Fase 3)
// ----------------------------------------------------------------------------
// Pantalla de inicio tipo app 2027: header del founder con ventas en vivo,
// tarjeta-CTA grande al chat del Agente, KPIs del día y grilla de módulos
// táctil. Estética Warm Dusk (tokens --ld-*), consistente con el Agente.
// Reutiliza cockpitMobileSnapshot (métricas en vivo). Full responsive: en
// desktop centra el contenido; en móvil suma bottom tab bar + sheet "Más".
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  MessageCircle, Package, GitBranch, Sparkles, Users, Boxes, Megaphone,
  TrendingUp, AlertTriangle, ChevronRight, Loader2, Briefcase, ShoppingBag,
} from 'lucide-react';
import AdminMobileHeader from '@/components/agente-os/mobile/AdminMobileHeader';
import AdminBottomTabBar from '@/components/agente-os/mobile/AdminBottomTabBar';
import AdminMoreSheet from '@/components/agente-os/mobile/AdminMoreSheet';

const fmtCompact = (n) => {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
};

const MODULOS = [
  { to: '/admin/procesar-pedidos', label: 'Pedidos', icon: Package, color: 'from-blue-500 to-indigo-600' },
  { to: '/admin/pipeline', label: 'Pipeline B2B', icon: GitBranch, color: 'from-violet-500 to-purple-600' },
  { to: '/admin/social-studio', label: 'Social Studio', icon: Sparkles, color: 'from-fuchsia-500 to-pink-600' },
  { to: '/admin/marketing-hub', label: 'Marketing', icon: Megaphone, color: 'from-orange-500 to-red-600' },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, color: 'from-pink-500 to-rose-600' },
  { to: '/admin/catalogo', label: 'Catálogo', icon: Boxes, color: 'from-green-500 to-emerald-600' },
];

function KpiPill({ icon: Icon, label, value, sub }) {
  return (
    <div className="ld-card rounded-2xl p-3.5">
      <Icon className="w-4.5 h-4.5 text-ld-action mb-2" />
      <p className="text-[10px] uppercase tracking-widest text-ld-fg-muted font-semibold">{label}</p>
      <p className="text-xl font-bold text-ld-fg mt-0.5 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-ld-fg-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminAppHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const res = await base44.functions.invoke('cockpitMobileSnapshot', {}).catch(() => null);
    if (res?.data?.ok) setData(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const ventas = data?.ventas;
  const leads = data?.leads;
  const alertas = data?.alertas;

  return (
    <div className="ld-canvas absolute inset-0 overflow-y-auto peyu-scrollbar font-inter">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 md:pb-10">
        <AdminMobileHeader
          ventasHoy={ventas?.total_clp}
          pedidosHoy={ventas?.pedidos}
          onRefresh={() => fetchData()}
          refreshing={refreshing}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-ld-fg-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Cargando tu negocio…</span>
          </div>
        ) : (
          <>
            {/* CTA principal: hablar con el Agente */}
            <Link
              to="/admin/agente"
              className="relative block rounded-3xl overflow-hidden mb-5 active:scale-[0.99] transition-transform"
              style={{ background: 'var(--ld-grad-action)' }}
            >
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative p-5 flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl flex-shrink-0">🐢</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-lg leading-tight">Habla con el Agente</p>
                  <p className="text-white/85 text-sm leading-snug mt-0.5">Opera todo el negocio por chat: pedidos, ventas, pipeline, social y más.</p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/80 flex-shrink-0" />
              </div>
            </Link>

            {/* KPIs del día */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <KpiPill
                icon={TrendingUp}
                label="Ventas hoy"
                value={fmtCompact(ventas?.total_clp)}
                sub={`${ventas?.pedidos || 0} pedidos`}
              />
              <KpiPill
                icon={ShoppingBag}
                label="B2C"
                value={fmtCompact(ventas?.b2c_clp)}
                sub={`${ventas?.pagados || 0} pagados`}
              />
              <KpiPill
                icon={Briefcase}
                label="B2B"
                value={fmtCompact(ventas?.b2b_clp)}
                sub={`${ventas?.pendientes || 0} pendientes`}
              />
              <KpiPill
                icon={Users}
                label="Leads 24h"
                value={leads?.total_24h ?? 0}
                sub={leads?.calientes > 0 ? `🔥 ${leads.calientes} calientes` : `${leads?.b2b_24h || 0} B2B · ${leads?.chat_24h || 0} chat`}
              />
            </div>

            {/* Alerta crítica (la primera, si hay) */}
            {alertas?.items?.length > 0 && (
              <Link
                to={alertas.items[0].action_url || '/admin/agente'}
                className="ld-card rounded-2xl p-3.5 flex items-center gap-3 mb-5 border-l-4 border-l-ld-highlight active:scale-[0.99] transition-transform"
              >
                <span className="w-9 h-9 rounded-xl bg-ld-highlight-soft flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-ld-highlight" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ld-fg truncate">{alertas.items[0].title}</p>
                  <p className="text-xs text-ld-fg-muted line-clamp-1">{alertas.items[0].detail}</p>
                </div>
                <span className="text-[11px] font-bold text-ld-highlight uppercase">{alertas.total} activas</span>
              </Link>
            )}

            {/* Grilla de módulos */}
            <p className="text-[11px] font-bold text-ld-fg-subtle uppercase tracking-wider px-1 mb-2">Módulos</p>
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {MODULOS.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.to}
                    to={m.to}
                    className="ld-card rounded-2xl p-3 flex flex-col items-center gap-2 text-center active:scale-95 transition-transform"
                  >
                    <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </span>
                    <span className="text-[11px] font-semibold text-ld-fg-soft leading-tight">{m.label}</span>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => setMoreOpen(true)}
              className="md:hidden w-full ld-glass-soft border border-ld-border rounded-2xl py-3 text-sm font-semibold text-ld-fg-soft flex items-center justify-center gap-2 active:scale-[0.99] transition"
            >
              <Boxes className="w-4 h-4" /> Ver todos los módulos
            </button>
          </>
        )}
      </div>

      {/* Navegación móvil */}
      <AdminBottomTabBar onMore={() => setMoreOpen(true)} />
      <AdminMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}