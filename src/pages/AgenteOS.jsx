// ============================================================================
// AgenteOS · "Peyu · Agent OS" — Commerce OS conversacional (solo founders/admin)
// ----------------------------------------------------------------------------
// El río de conversación es el lienzo central e infinito. El founder le habla a
// Peyu en lenguaje natural y opera el negocio desde acá: ventas, pedidos, stock,
// cotizaciones B2B, clientes. El agente responde con texto + tarjetas ricas
// embebidas en la misma conversación.
//
// Estética: Warm Dusk (variables CSS --ld-*), oscuro por defecto con toggle.
// Reutiliza peyuBrainOps (métricas en vivo) + InvokeLLM (respuesta natural).
// El gating de admin lo provee la ruta /admin (AuthenticatedApp en App.jsx).
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import AgentSidebar from '@/components/agente-os/AgentSidebar';
import AgentHeader from '@/components/agente-os/AgentHeader';
import CommandBar from '@/components/agente-os/CommandBar';
import WelcomeScreen from '@/components/agente-os/WelcomeScreen';
import MessageBubble from '@/components/agente-os/MessageBubble';
import { detectCards } from '@/components/agente-os/intent';

const PEYU_OS_PROMPT = `Eres Peyu, el Agent OS interno de PEYU Chile (marca sustentable: "Hasta que el plástico deje de ser basura"). Hablas en español, cálido pero directo y breve. El founder te habla para administrar TODO el negocio desde este chat. Cuando te pregunten por una métrica o registros, responde con UNA o DOS frases cálidas que resuman lo clave y NOMBRA los registros concretos si los tienes en "DETALLE CONCRETO" — la pantalla mostrará automáticamente una TARJETA RICA debajo de tu mensaje con la lista completa y BOTONES DE ACCIÓN (responder consulta, avanzar pedido, marcar lead, reponer stock, reenviar propuesta). Nunca digas "te las muestro" sin nombrarlas: usa el detalle que te paso. Si no se entiende la pregunta, pide aclaración y sugiere qué puedes hacer (ventas, pedidos, stock, cotizaciones, leads, consultas, clientes).`;

export default function AgenteOS() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [crm, setCrm] = useState({ pedidos: [], productos: [], clientes: [], cotizaciones: [], leads: [], consultas: [] });
  const [metrics, setMetrics] = useState({});
  const [lists, setLists] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const [pedidos, productos, clientes, cotizaciones, leads, consultas, brain] = await Promise.all([
      base44.entities.PedidoWeb.list('-created_date', 60).catch(() => []),
      base44.entities.Producto.filter({ activo: true }, '-updated_date', 200).catch(() => []),
      base44.entities.Cliente.list('-created_date', 40).catch(() => []),
      base44.entities.CorporateProposal.list('-created_date', 40).catch(() => []),
      base44.entities.B2BLead.list('-created_date', 60).catch(() => []),
      base44.entities.Consulta.list('-created_date', 60).catch(() => []),
      base44.functions.invoke('peyuBrainOps', { query: 'resumen del día' }).catch(() => null),
    ]);
    setCrm({
      pedidos: pedidos || [], productos: productos || [], clientes: clientes || [],
      cotizaciones: cotizaciones || [], leads: leads || [], consultas: consultas || [],
    });
    if (brain?.data?.metrics) setMetrics(brain.data.metrics);
    if (brain?.data?.lists) setLists(brain.data.lists);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    const userMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const cards = detectCards(content);
    const history = [...messages, userMsg]
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Founder' : 'Peyu'}: ${m.content}`)
      .join('\n');

    // Refrescamos métricas + LISTAS reales en vivo (fuente de verdad).
    const brain = await base44.functions.invoke('peyuBrainOps', { query: content }).catch(() => null);
    const m = brain?.data?.metrics;
    const liveLists = brain?.data?.lists || {};
    if (m) setMetrics(m);
    if (brain?.data?.lists) setLists(liveLists);

    // Inyectamos los DATOS CONCRETOS de lo preguntado, no solo el número.
    // Así el agente puede nombrar las consultas/pedidos en su respuesta y NO
    // promete cosas que no tiene (causa raíz del bug reportado).
    const detalle = [];
    if (liveLists.consultas_pendientes?.length)
      detalle.push(`Consultas sin responder:\n${liveLists.consultas_pendientes.map(c => `• ${c.nombre || 'Sin nombre'} (${c.canal || 'web'})${c.email ? ` ${c.email}` : ''}: "${(c.mensaje || '').slice(0, 80)}"`).join('\n')}`);
    if (liveLists.pedidos_pendientes?.length)
      detalle.push(`Pedidos pendientes:\n${liveLists.pedidos_pendientes.map(p => `• ${p.numero_pedido || p.id?.slice(-6)} · ${p.cliente_nombre} · $${(p.total || 0).toLocaleString('es-CL')} · ${p.estado}`).join('\n')}`);
    if (liveLists.leads_top?.length)
      detalle.push(`Leads B2B activos:\n${liveLists.leads_top.map(l => `• ${l.company_name} · ${l.contact_name || ''} · score ${l.lead_score || 0} · ${l.status}`).join('\n')}`);
    if (liveLists.stock_bajo_list?.length)
      detalle.push(`Stock bajo:\n${liveLists.stock_bajo_list.map(p => `• ${p.sku} ${p.nombre}: ${p.stock_actual}u`).join('\n')}`);

    const liveOps = m ? `\n\nDATOS EN VIVO (${new Date().toLocaleString('es-CL')}):
Ventas hoy: $${(m.ingresos_hoy || 0).toLocaleString('es-CL')} en ${m.pedidos_hoy} pedidos · 7d: $${(m.ingresos_7d || 0).toLocaleString('es-CL')}
Pedidos en producción: ${m.pedidos_en_produccion} · listos para despacho: ${m.pedidos_listos}
Envíos en tránsito: ${m.envios_en_transito} · entregados hoy: ${m.envios_entregados_hoy}
Leads B2B hoy: ${m.leads_hoy} (calientes: ${m.leads_calientes}) · propuestas pendientes: ${m.propuestas_pendientes}
Stock bajo (<10u): ${m.stock_bajo} SKUs · consultas sin responder: ${m.consultas_sin_responder}${detalle.length ? `\n\nDETALLE CONCRETO (úsalo para nombrar registros, la tarjeta mostrará el resto):\n${detalle.join('\n\n')}` : ''}` : '';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${PEYU_OS_PROMPT}${liveOps}\n\nCONVERSACIÓN:\n${history}\n\nPeyu:`,
      model: 'gemini_3_flash',
    });

    const mensaje = (typeof response === 'string' ? response : response?.toString?.() || '').trim()
      || 'Cuéntame un poco más para ayudarte mejor 🐢';

    setMessages((prev) => [...prev, { role: 'assistant', content: mensaje, cards, lists: liveLists }]);
    setThinking(false);
  };

  return (
    <div className="ld-canvas flex h-[100dvh] w-full overflow-hidden font-inter">
      <AgentSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onAsk={sendMessage}
        onNewThread={() => setMessages([])}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AgentHeader
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
          onMobileMenu={() => sendMessage('Resumen del día')}
        />

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-ld-fg-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tu negocio…</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto peyu-scrollbar px-4 py-6">
            <div className="max-w-[820px] mx-auto space-y-6">
              {messages.length === 0 ? (
                <WelcomeScreen metrics={metrics} onAsk={sendMessage} />
              ) : (
                messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} crm={crm} metrics={metrics} lists={lists} onAsk={sendMessage} onDone={() => loadData(true)} />
                ))
              )}
              {thinking && (
                <div className="flex gap-3 max-w-[820px] mx-auto">
                  <div className="w-9 h-9 rounded-full bg-ld-action-soft flex items-center justify-center text-lg flex-shrink-0">🐢</div>
                  <div className="ld-card rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ld-fg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-ld-fg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-ld-fg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <CommandBar
          value={input}
          onChange={setInput}
          onSend={() => sendMessage()}
          onChip={sendMessage}
          loading={thinking}
        />
      </div>
    </div>
  );
}