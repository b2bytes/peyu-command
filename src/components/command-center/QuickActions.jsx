import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import {
  RefreshCw, Search, Send, Megaphone, FileText, Mail,
  Sparkles, Zap, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';

/**
 * Botones 1-click para invocar funciones backend desde el Centro de Comandos.
 * Cada acción muestra estado loading/success/error y un toast con el resultado.
 *
 * IMPORTANTE: solo invoca funciones backend que YA existen — no inventa endpoints.
 */
const ACTIONS = [
  {
    id: 'sync-woo',
    label: 'Sincronizar WooCommerce',
    desc: 'Importa catálogo desde Woo',
    icon: RefreshCw,
    color: 'from-violet-500/30 to-purple-600/30',
    border: 'border-violet-400/40',
    fn: 'syncWooCatalogo',
    payload: {},
  },
  {
    id: 'optimize-seo',
    label: 'Optimizar SEO productos',
    desc: 'IA · GSC + GA4 → meta tags',
    icon: Search,
    color: 'from-emerald-500/30 to-teal-600/30',
    border: 'border-emerald-400/40',
    fn: 'optimizeProductSEOCRON',
    payload: { limit: 5 },
  },
  {
    id: 'gen-sitemap',
    label: 'Regenerar Sitemap',
    desc: 'Refrescar XML público',
    icon: FileText,
    color: 'from-cyan-500/30 to-blue-600/30',
    border: 'border-cyan-400/40',
    fn: 'generateSitemap',
    payload: {},
  },
  {
    id: 'index-blast',
    label: 'IndexNow Blast',
    desc: 'Pingear Google/Bing',
    icon: Zap,
    color: 'from-yellow-500/30 to-orange-600/30',
    border: 'border-yellow-400/40',
    fn: 'autoIndexNowBlast',
    payload: {},
  },
  {
    id: 'briefing',
    label: 'Briefing diario',
    desc: 'Email ejecutivo del día',
    icon: Mail,
    color: 'from-pink-500/30 to-rose-600/30',
    border: 'border-pink-400/40',
    fn: 'dailyBriefingCRON',
    payload: {},
  },
  {
    id: 'check-proposals',
    label: 'Recordar propuestas',
    desc: 'Recordatorios B2B',
    icon: Send,
    color: 'from-teal-500/30 to-emerald-600/30',
    border: 'border-teal-400/40',
    fn: 'recordarPropuestasPendientesCRON',
    payload: {},
  },
  {
    id: 'health',
    label: 'Health Check',
    desc: 'Diagnóstico del sistema',
    icon: Sparkles,
    color: 'from-blue-500/30 to-indigo-600/30',
    border: 'border-blue-400/40',
    fn: 'healthCheck',
    payload: {},
  },
  {
    id: 'audit-cat',
    label: 'Auditar catálogo',
    desc: 'IA · revisa productos',
    icon: Megaphone,
    color: 'from-orange-500/30 to-red-600/30',
    border: 'border-orange-400/40',
    fn: 'auditoriaCatalogoCRON',
    payload: {},
  },
];

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
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-yellow-300" />
        <h3 className="font-poppins font-semibold text-white text-sm">Acciones rápidas · 1-click</h3>
        <span className="text-[10px] text-teal-300/60 ml-auto">Funciones backend ejecutables</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const state = running[a.id];
          return (
            <button
              key={a.id}
              onClick={() => run(a)}
              disabled={state === 'loading'}
              className={`text-left bg-gradient-to-br ${a.color} border ${a.border} rounded-xl p-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed group`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <Icon className="w-4 h-4 text-white" />
                {state === 'loading' && <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />}
                {state === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                {state === 'error' && <XCircle className="w-3.5 h-3.5 text-red-300" />}
              </div>
              <div className="text-xs font-bold text-white leading-tight">{a.label}</div>
              <div className="text-[10px] text-white/70 leading-tight mt-0.5">{a.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}