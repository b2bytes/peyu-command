import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import {
  RefreshCw, Search, Send, Megaphone, FileText, Mail,
  Sparkles, Zap, Loader2, CheckCircle2, XCircle, ChevronRight,
  ShoppingBag, Globe, Activity, Image as ImageIcon, Wand2, FolderSearch,
} from 'lucide-react';

/**
 * Acciones rápidas · rediseño limpio agrupado por categoría.
 * - Lista densa en 2 columnas con icono coloreado a la izquierda
 * - Estado loading/success/error sin distorsionar el layout
 * - Tooltip con descripción al hover (no satura)
 * - Solo invoca funciones backend que YA existen
 */
const GROUPS = [
  {
    label: 'Catálogo',
    icon: ShoppingBag,
    accent: 'text-violet-300',
    actions: [
      { id: 'sync-woo',    label: 'Sync WooCommerce',  desc: 'Importar productos',     icon: RefreshCw,  fn: 'syncWooCatalogo',      payload: {} },
      { id: 'audit-cat',   label: 'Auditar catálogo',  desc: 'IA revisa productos',    icon: Megaphone,  fn: 'auditoriaCatalogoCRON', payload: {} },
    ],
  },
  {
    label: 'Imágenes de productos',
    icon: ImageIcon,
    accent: 'text-pink-300',
    actions: [
      { id: 'admin-products',  label: 'Editor de productos', desc: 'Subir, generar IA, editar', icon: Wand2,        to: '/admin/admin-products' },
      { id: 'galeria-maestra', label: 'Galería maestra',     desc: 'Ver todas las imágenes',    icon: ImageIcon,    to: '/admin/imagenes' },
      { id: 'auditoria-img',   label: 'Auditoría Drive',     desc: 'Match 1:1 desde Drive',     icon: FolderSearch, to: '/admin/auditoria-imagenes' },
    ],
  },
  {
    label: 'SEO & Indexación',
    icon: Globe,
    accent: 'text-emerald-300',
    actions: [
      { id: 'optimize-seo', label: 'Optimizar SEO',     desc: 'Meta tags vía IA',       icon: Search,     fn: 'optimizeProductSEOCRON', payload: { limit: 5 } },
      { id: 'gen-sitemap',  label: 'Sitemap',           desc: 'Regenerar XML',          icon: FileText,   fn: 'generateSitemap',        payload: {} },
      { id: 'index-blast',  label: 'IndexNow',          desc: 'Pingear Google/Bing',    icon: Zap,        fn: 'autoIndexNowBlast',      payload: {} },
    ],
  },
  {
    label: 'Comercial',
    icon: Send,
    accent: 'text-cyan-300',
    actions: [
      { id: 'check-proposals', label: 'Recordar propuestas', desc: 'Email a clientes B2B', icon: Send, fn: 'recordarPropuestasPendientesCRON', payload: {} },
      { id: 'briefing',        label: 'Briefing diario',     desc: 'Email ejecutivo',      icon: Mail, fn: 'dailyBriefingCRON',                payload: {} },
    ],
  },
  {
    label: 'Sistema',
    icon: Activity,
    accent: 'text-blue-300',
    actions: [
      { id: 'health',  label: 'Health Check', desc: 'Diagnóstico general', icon: Sparkles, fn: 'healthCheck', payload: {} },
    ],
  },
];

const STATE_STYLE = {
  loading: { icon: Loader2,       cls: 'text-white/80 animate-spin' },
  success: { icon: CheckCircle2,  cls: 'text-emerald-400' },
  error:   { icon: XCircle,       cls: 'text-red-400' },
};

export default function QuickActions() {
  const { toast } = useToast();
  const [running, setRunning] = useState({});

  const run = async (action) => {
    setRunning(prev => ({ ...prev, [action.id]: 'loading' }));
    try {
      const res = await base44.functions.invoke(action.fn, action.payload);
      const ok = !res?.data?.error && res?.status !== 500;
      setRunning(prev => ({ ...prev, [action.id]: ok ? 'success' : 'error' }));
      toast({
        title: ok ? `✓ ${action.label}` : `✗ ${action.label}`,
        description: ok
          ? (typeof res?.data === 'object'
              ? `Listo · ${JSON.stringify(res.data).slice(0, 100)}`
              : 'Ejecutado correctamente')
          : (res?.data?.error || 'Error desconocido'),
        variant: ok ? 'default' : 'destructive',
      });
      setTimeout(() => setRunning(prev => ({ ...prev, [action.id]: null })), 3000);
    } catch (err) {
      setRunning(prev => ({ ...prev, [action.id]: 'error' }));
      toast({
        title: `✗ ${action.label}`,
        description: err.message || 'Error al invocar la función',
        variant: 'destructive',
      });
      setTimeout(() => setRunning(prev => ({ ...prev, [action.id]: null })), 3000);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-semibold text-white text-sm">Acciones rápidas</h3>
            <p className="text-[10px] text-yellow-200/70">Funciones backend · 1-click</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {GROUPS.map(group => {
          const GroupIcon = group.icon;
          return (
            <div key={group.label}>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <GroupIcon className={`w-3 h-3 ${group.accent}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${group.accent}/80`}>
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-white/5 ml-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.actions.map(a => {
                  const Icon = a.icon;
                  const state = running[a.id];
                  const StateCfg = state && STATE_STYLE[state];
                  const StateIcon = StateCfg?.icon;
                  const isNav = !!a.to;
                  const commonClass = "flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left";

                  const inner = (
                    <>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                        state === 'success' ? 'bg-emerald-500/20'
                        : state === 'error' ? 'bg-red-500/20'
                        : 'bg-white/[0.06] group-hover:bg-white/[0.12]'
                      }`}>
                        {StateIcon
                          ? <StateIcon className={`w-3.5 h-3.5 ${StateCfg.cls}`} />
                          : <Icon className="w-3.5 h-3.5 text-white/80" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{a.label}</div>
                        <div className="text-[10px] text-white/45 truncate">{a.desc}</div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition shrink-0" />
                    </>
                  );

                  if (isNav) {
                    return (
                      <Link key={a.id} to={a.to} title={a.desc} className={commonClass}>
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={a.id}
                      onClick={() => run(a)}
                      disabled={state === 'loading'}
                      title={a.desc}
                      className={commonClass}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}