import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Brain, Send, X, Loader2, Sparkles, Minimize2, Maximize2, ChevronDown,
  TrendingUp, Package, Users, MessageSquare, Truck, FileText, Activity, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * PeyuCompanion — asistente flotante OMNIPRESENTE en el admin.
 *
 * Diseño:
 *  - Burbuja flotante (bottom-right) en TODAS las páginas del admin.
 *  - Conoce la página actual → ofrece atajos contextuales por pantalla.
 *  - 3 modos de pregunta:
 *      1) Ops (data viva): "leads hoy", "pedidos entregados"
 *      2) RAG (knowledge): FAQs, ESG, políticas, garantía
 *      3) Comandos (acciones backend): "auditar catálogo", "enviar briefing"
 *  - Memoria local de la conversación por pantalla.
 *
 * Dependencia: backend functions `peyuBrainOps`, `askPeyuBrain`,
 * y los CRONs/funciones invocables como comandos.
 */

// ── Mapa de contexto por ruta del admin ─────────────────────────────────
// Cada entrada da: título, sugerencias rápidas y comandos disponibles.
const PAGE_CONTEXT = {
  '/admin': {
    title: 'Centro de Comandos',
    icon: TrendingUp,
    suggestions: ['Resumen del día', '¿Qué necesita acción urgente?', 'Conversaciones con Peyu hoy'],
  },
  '/admin/pipeline': {
    title: 'Pipeline B2B',
    icon: Users,
    suggestions: ['Leads calientes (score ≥70)', '¿Qué leads no responden?', 'Cotizaciones por enviar'],
    commands: [
      { label: 'Reactivar leads fríos', fn: 'leadReactivationCRON', desc: 'Lanza secuencia de re-engagement' },
    ],
  },
  '/admin/pipeline-b2c': {
    title: 'Pipeline B2C',
    icon: Package,
    suggestions: ['Pedidos hoy', 'Carritos abandonados', 'Pedidos en producción'],
    commands: [
      { label: 'Enviar recordatorios carrito', fn: 'carritoAbandonadoCRON', desc: 'Email a carritos abandonados +1h' },
    ],
  },
  '/admin/propuestas': {
    title: 'Propuestas Corporativas',
    icon: FileText,
    suggestions: ['Propuestas pendientes', 'Aceptadas esta semana', '¿Cuáles vencen pronto?'],
    commands: [
      { label: 'Recordar propuestas', fn: 'recordarPropuestasPendientesCRON', desc: 'Reenvía propuestas sin respuesta' },
      { label: 'Detectar vencidas', fn: 'checkExpiringProposals', desc: 'Marca como Vencida las que pasaron validez' },
    ],
  },
  '/admin/procesar-pedidos': {
    title: 'Procesar Pedidos',
    icon: Package,
    suggestions: ['Listos para despachar', 'Pedidos confirmados', '¿Cuántos hoy?'],
  },
  '/admin/bluex': {
    title: 'Centro Logístico',
    icon: Truck,
    suggestions: ['Envíos en tránsito', 'Envíos con excepción', 'Entregados hoy'],
    commands: [
      { label: 'Refrescar tracking', fn: 'bluexTrackingPollerCRON', desc: 'Actualiza estado de todos los envíos' },
      { label: 'Análisis IA envíos', fn: 'bluexAnalyzeShipments', desc: 'Detecta atrasos y problemas' },
    ],
  },
  '/admin/marketing-hub': {
    title: 'Marketing Hub',
    icon: Sparkles,
    suggestions: ['Posts pendientes de publicar', 'Performance última campaña'],
  },
  '/admin/catalogo': {
    title: 'Catálogo',
    icon: Package,
    suggestions: ['SKUs con stock bajo', 'Productos sin imagen', 'Top vendidos'],
    commands: [
      { label: 'Auditar catálogo', fn: 'auditoriaCatalogoCRON', desc: 'Detecta productos incompletos' },
      { label: 'Optimizar SEO productos', fn: 'optimizeProductSEOCRON', desc: 'Re-genera meta tags con GSC + GA4' },
    ],
  },
  '/admin/admin-products': {
    title: 'Admin Productos',
    icon: Package,
    suggestions: ['Productos sin imagen', 'Productos sin SEO'],
  },
  '/admin/inventario': {
    title: 'Inventario',
    icon: Package,
    suggestions: ['Stock bajo', '¿Qué reabastecer?'],
    commands: [
      { label: 'Alerta stock bajo', fn: 'alertaStockBajoCRON', desc: 'Notifica SKUs <10u' },
    ],
  },
  '/admin/financiero': {
    title: 'Financiero',
    icon: TrendingUp,
    suggestions: ['Ingresos del mes', 'Pagos pendientes'],
  },
  '/admin/centro-costos': {
    title: 'Centro de Costos',
    icon: TrendingUp,
    suggestions: ['Costos fantasma del mes', 'Productos con margen bajo'],
    commands: [
      { label: 'Analizar costos reales', fn: 'analizarCostosReales', desc: 'Recalcula costos por SKU' },
      { label: 'Prorratear fantasmas', fn: 'prorratearCostosFantasma', desc: 'Distribuye costos indirectos' },
    ],
  },
  '/admin/clientes': {
    title: 'Clientes',
    icon: Users,
    suggestions: ['Clientes en riesgo', 'VIPs', 'Sin compra hace 90+ días'],
    commands: [
      { label: 'Recordatorio recompra', fn: 'recordatorioRecompraCRON', desc: 'Email a clientes con +60d sin compra' },
    ],
  },
  '/admin/soporte': {
    title: 'Soporte',
    icon: MessageSquare,
    suggestions: ['Consultas sin responder', 'Tickets urgentes'],
  },
  '/admin/monitoreo-ia': {
    title: 'Monitoreo IA',
    icon: Brain,
    suggestions: ['Errores recientes', 'Costos de tokens hoy', 'Conversaciones marcadas'],
  },
  '/admin/indexacion': {
    title: 'Indexación SEO',
    icon: Activity,
    suggestions: ['URLs sin indexar', 'Performance Search Console'],
    commands: [
      { label: 'Submit sitemap', fn: 'gscSubmitSitemap', desc: 'Notifica el sitemap a Google' },
      { label: 'IndexNow blast', fn: 'autoIndexNowBlast', desc: 'Pide indexación inmediata' },
    ],
  },
  '/admin/ads-command': {
    title: 'Ads Command',
    icon: Zap,
    suggestions: ['Performance campañas', '¿Qué keyword convierte mejor?'],
  },
  '/admin/launch-map': {
    title: 'Launch Map',
    icon: Activity,
    suggestions: ['Estado del lanzamiento', '¿Qué falta verificar?'],
    commands: [
      { label: 'Smoke test launch', fn: 'launchSmokeTest', desc: 'Verifica todo el sitio público' },
      { label: 'Health check', fn: 'healthCheck', desc: 'Estado de integraciones' },
    ],
  },
};

// Detectar contexto por path (con prefix matching)
const detectContext = (path) => {
  // Match exacto primero
  if (PAGE_CONTEXT[path]) return { path, ...PAGE_CONTEXT[path] };
  // Match por prefijo (ej: /admin/cliente-360/123 → /admin/clientes)
  const sorted = Object.keys(PAGE_CONTEXT).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (path.startsWith(key)) return { path: key, ...PAGE_CONTEXT[key] };
  }
  return { path: '/admin', ...PAGE_CONTEXT['/admin'] };
};

// Heurística: ¿la consulta es operacional (data viva) o de knowledge (RAG)?
const OPS_KEYWORDS = [
  'lead', 'leads', 'consulta', 'consultas', 'pedido', 'pedidos',
  'conversaci', 'agente', 'venta', 'ventas', 'entreg', 'envío', 'envio',
  'despach', 'tracking', 'propuesta', 'cotizaci', 'stock', 'inventario',
  'hoy', 'cuántos', 'cuantos', 'resumen', 'estado', 'kpi', 'b2b', 'b2c',
  'compra', 'cliente', 'urgente', 'pendiente', 'producci', 'critico'
];
const isOpsQuery = (q) => {
  const lower = q.toLowerCase();
  return OPS_KEYWORDS.some(k => lower.includes(k));
};

export default function PeyuCompanion() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runningCmd, setRunningCmd] = useState(null);
  const endRef = useRef(null);

  const ctx = detectContext(location.pathname);
  const Icon = ctx.icon || Brain;

  // Si estamos fuera del dashboard raíz, el FAB "Centro de Comando" está visible
  // abajo a la derecha → subimos a Peyu para que no se sobreponga.
  const isDashboardRoot = location.pathname === '/admin' || location.pathname === '/admin/';
  const bottomOffset = isDashboardRoot ? 'bottom-6' : 'bottom-24';

  // Auto-scroll al último mensaje
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Limpia mensajes al cambiar de pantalla — el contexto es per-page
  useEffect(() => {
    setMessages([]);
  }, [ctx.path]);

  const ask = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      if (isOpsQuery(q)) {
        const res = await base44.functions.invoke('peyuBrainOps', { query: q });
        const data = res?.data || {};
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer || '_Sin respuesta._',
          mode: 'ops',
        }]);
      } else {
        const res = await base44.functions.invoke('askPeyuBrain', { query: q, top_k: 4, format: 'json' });
        const hits = res?.data?.hits || [];
        if (hits.length === 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '_No encontré nada en la base de conocimiento. Si es data operacional, intenta con "hoy", "leads", "pedidos", "envíos"._',
            mode: 'rag',
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: hits[0].chunk_text || '_(sin contenido)_',
            sources: hits.slice(0, 3).map(h => ({ ns: h.namespace, sku: h.sku })),
            mode: 'rag',
          }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err?.response?.data?.error || err.message || 'no se pudo procesar'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async (cmd) => {
    if (runningCmd) return;
    setRunningCmd(cmd.fn);
    setMessages(prev => [...prev, {
      role: 'user',
      content: `▶ Ejecutar: ${cmd.label}`,
    }]);

    try {
      const res = await base44.functions.invoke(cmd.fn, {});
      const data = res?.data || {};
      const summary = data.message || data.summary || data.ok ? '✅ Comando ejecutado correctamente.' : '✅ Listo.';
      const detail = typeof data === 'object' ? JSON.stringify(data, null, 2).slice(0, 400) : String(data);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**${cmd.label}**\n\n${summary}\n\n\`\`\`json\n${detail}\n\`\`\``,
        mode: 'cmd',
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Falló \`${cmd.fn}\`: ${err?.response?.data?.error || err.message}`,
      }]);
    } finally {
      setRunningCmd(null);
    }
  };

  // ── Burbuja cerrada (FAB) ──────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        className={`fixed ${bottomOffset} right-6 z-[100] group flex items-center gap-2 px-3 py-3 rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white shadow-2xl shadow-indigo-500/40 border border-white/20 transition-all hover:scale-110`}
        title="Peyu Brain — pregúntame lo que sea"
      >
        <div className="relative">
          <Brain className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-700 animate-pulse" />
        </div>
        <span className="text-xs font-bold pr-1 hidden sm:inline">Peyu</span>
      </button>
    );
  }

  // ── Panel minimizado (pill) ─────────────────────────────────────────────
  if (minimized) {
    return (
      <div className={`fixed ${bottomOffset} right-6 z-[100] flex items-center gap-2 bg-gradient-to-br from-violet-700 to-indigo-800 text-white rounded-full px-3 py-2 shadow-2xl border border-white/20`}>
        <Brain className="w-4 h-4" />
        <span className="text-xs font-medium">Peyu · {ctx.title}</span>
        <button onClick={() => setMinimized(false)} className="ml-1 opacity-80 hover:opacity-100">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Panel abierto ──────────────────────────────────────────────────────
  return (
    <div className={`fixed ${bottomOffset} right-6 z-[100] w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-${isDashboardRoot ? '3rem' : '7rem'})] flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 via-violet-950/80 to-indigo-950/80 backdrop-blur-xl border border-violet-400/30 shadow-2xl shadow-indigo-500/30 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600/40 to-indigo-600/40 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Peyu Brain</p>
          <p className="text-violet-200/70 text-[10px] leading-tight flex items-center gap-1">
            <Icon className="w-2.5 h-2.5" /> {ctx.title}
          </p>
        </div>
        <button onClick={() => setMinimized(true)} className="text-white/60 hover:text-white p-1" title="Minimizar">
          <Minimize2 className="w-4 h-4" />
        </button>
        <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-1" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cuerpo: sugerencias + comandos + mensajes */}
      <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <>
            {/* Sugerencias contextuales */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-300/80 font-bold mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sugerencias para esta pantalla
              </p>
              <div className="space-y-1.5">
                {(ctx.suggestions || []).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => ask(s)}
                    className="w-full text-left text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/40 text-white/85 rounded-lg px-3 py-2 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Comandos disponibles */}
            {ctx.commands?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-300/80 font-bold mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Comandos · 1-click
                </p>
                <div className="space-y-1.5">
                  {ctx.commands.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => runCommand(cmd)}
                      disabled={runningCmd === cmd.fn}
                      className="w-full text-left text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 hover:border-amber-400/60 text-white rounded-lg px-3 py-2 transition disabled:opacity-50 flex items-start gap-2"
                    >
                      {runningCmd === cmd.fn
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin mt-0.5 text-amber-300" />
                        : <Zap className="w-3.5 h-3.5 mt-0.5 text-amber-300" />}
                      <div className="min-w-0">
                        <p className="font-bold text-amber-100">{cmd.label}</p>
                        <p className="text-[10px] text-amber-200/70 leading-tight">{cmd.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Atajos generales */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Globales
              </p>
              <div className="space-y-1.5">
                {[
                  '¿Qué necesita acción urgente?',
                  'Resumen del día',
                  'Stock crítico',
                  'Conversaciones con Peyu hoy',
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => ask(s)}
                    className="w-full text-left text-xs bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-white/85 rounded-lg px-3 py-2 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/admin"
              className="block text-center text-[11px] text-violet-300/70 hover:text-violet-200 underline pt-2"
            >
              Volver al Centro de Comandos →
            </Link>
          </>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs ${
                  m.role === 'user'
                    ? 'bg-violet-500/40 text-white border border-violet-400/30'
                    : m.mode === 'cmd'
                      ? 'bg-amber-500/15 text-amber-100 border border-amber-400/30'
                      : 'bg-white/10 text-white border border-white/10'
                }`}>
                  {m.role === 'assistant'
                    ? <div className="prose prose-invert prose-xs max-w-none [&>*]:my-1 [&_pre]:text-[9px] [&_pre]:bg-black/40 [&_pre]:p-1.5 [&_pre]:rounded">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    : <p>{m.content}</p>}
                  {m.sources?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                      {m.sources.map((s, j) => (
                        <span key={j} className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-violet-200 font-mono">
                          {s.ns}{s.sku ? `/${s.sku}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-white/70">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Peyu está pensando...
                </div>
              </div>
            )}
            <button
              onClick={() => setMessages([])}
              className="w-full text-[10px] text-white/40 hover:text-white/70 py-1 flex items-center justify-center gap-1"
            >
              <ChevronDown className="w-3 h-3" /> Limpiar conversación
            </button>
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/10 bg-slate-950/40">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Pregunta o comando..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          />
          <button
            onClick={() => ask()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white flex items-center justify-center disabled:opacity-50 transition shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[9px] text-white/40 mt-1.5 text-center">
          Pregunta data viva · knowledge · ejecuta comandos
        </p>
      </div>
    </div>
  );
}