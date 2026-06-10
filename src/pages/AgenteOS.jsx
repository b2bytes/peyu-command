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
import AgentMobileDrawer from '@/components/agente-os/AgentMobileDrawer';
import { detectCards } from '@/components/agente-os/intent';
import OpsCenter from '@/components/agente-os/OpsCenter';
import ActionProposalCard from '@/components/agente-os/ActionProposalCard';

const PEYU_OS_PROMPT = `Eres Peyu, el Agent OS interno de PEYU Chile (marca sustentable: "Hasta que el plástico deje de ser basura"). Hablas en español, cálido pero directo y breve. El founder te habla para administrar TODO el negocio desde este chat. Cuando te pregunten por una métrica o registros, responde con UNA o DOS frases cálidas que resuman lo clave y NOMBRA los registros concretos si los tienes en "DETALLE CONCRETO" — la pantalla mostrará automáticamente una TARJETA RICA debajo de tu mensaje con la lista completa y BOTONES DE ACCIÓN. Nunca digas "te las muestro" sin nombrarlas: usa el detalle que te paso.

ACCIONES EJECUTABLES — cuando el founder te PIDE HACER algo (no solo preguntar), además del mensaje propone la acción correspondiente. La pantalla mostrará un botón de confirmación, así que propónla con confianza cuando la intención sea clara:
- updatePedidoEstado {id, estado: "Nuevo"|"Confirmado"|"En Producción"|"Listo para Despacho"|"Despachado"|"Entregado"}
- marcarPedidoPagado {id}
- generarEtiqueta {id} (etiqueta BlueExpress, requiere pedido pagado)
- cancelarPedido {id, motivo}
- marcarConsultaRespondida {id}
- responderConsulta {id, email, asunto, cuerpo} (redacta tú el cuerpo, cálido y útil)
- updateLeadEstado {id, status: "Nuevo"|"Contactado"|"En revisión"|"Propuesta enviada"|"Aceptado"|"Perdido"}
- updatePropuestaEstado {id, status: "Borrador"|"Enviada"|"Aceptada"|"Rechazada"|"Vencida"}
- reenviarPropuesta {proposalId}
- ajustarStock {id, stock_actual}
- updateProducto {id, precio_b2c?, stock_actual?, activo?}
- enviarEmail {to, asunto, cuerpo} (email libre vía Gmail PEYU)
- sincronizarTracking {} (refresca tracking de todos los envíos Bluex)
REGLAS: usa SOLO los ids exactos que aparecen en DETALLE CONCRETO como [id:XXX]. Si no tienes el id del registro, NO propongas acción — pide al founder que precise cuál. Máximo UNA acción por respuesta.

Responde SIEMPRE en el formato JSON pedido: "mensaje" (tu respuesta cálida), "action" (nombre exacto de la acción o "" si no hay), "payload" (objeto con los datos), "action_descripcion" (frase corta de lo que hará, ej: "Marcar pedido #1042 como pagado"). Si no se entiende la pregunta, pide aclaración y sugiere qué puedes hacer (ventas, pedidos, stock, cotizaciones, leads, consultas, clientes, emails, etiquetas).`;

// Whitelist de acciones que el front acepta del LLM (defensa en profundidad;
// el backend valida de nuevo y exige admin).
const ACTIONS_VALIDAS = new Set([
  'updatePedidoEstado', 'marcarPedidoPagado', 'generarEtiqueta', 'cancelarPedido',
  'marcarConsultaRespondida', 'responderConsulta', 'updateLeadEstado',
  'updatePropuestaEstado', 'enviarPropuesta', 'reenviarPropuesta', 'ajustarStock',
  'updateProducto', 'enviarEmail', 'sincronizarTracking', 'eliminarLead',
]);

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
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'ops'
  const bottomRef = useRef(null);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const [pedidos, productos, clientes, cotizaciones, leads, consultas, brain] = await Promise.all([
      base44.entities.PedidoWeb.list('-created_date', 60).catch(() => []),
      base44.entities.Producto.filter({ activo: true }, '-updated_date', 200).catch(() => []),
      base44.entities.Cliente.list('-created_date', 40).catch(() => []),
      base44.entities.CorporateProposal.list('-created_date', 40).catch(() => []),
      base44.entities.B2BLead.list('-created_date', 60).catch(() => []),
      base44.entities.Consulta.list('-created_date', 300).catch(() => []),
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
      detalle.push(`Consultas sin responder:\n${liveLists.consultas_pendientes.map(c => `• [id:${c.id}] ${c.nombre || 'Sin nombre'} (${c.canal || 'web'})${c.email ? ` ${c.email}` : ''}: "${(c.mensaje || '').slice(0, 80)}"`).join('\n')}`);
    if (liveLists.pedidos_pendientes?.length)
      detalle.push(`Pedidos pendientes:\n${liveLists.pedidos_pendientes.map(p => `• [id:${p.id}] ${p.numero_pedido || p.id?.slice(-6)} · ${p.cliente_nombre} · $${(p.total || 0).toLocaleString('es-CL')} · ${p.estado}`).join('\n')}`);
    if (liveLists.leads_top?.length)
      detalle.push(`Leads B2B activos:\n${liveLists.leads_top.map(l => `• [id:${l.id}] ${l.company_name} · ${l.contact_name || ''} · score ${l.lead_score || 0} · ${l.status}`).join('\n')}`);
    if (liveLists.stock_bajo_list?.length)
      detalle.push(`Stock bajo:\n${liveLists.stock_bajo_list.map(p => `• [id:${p.id}] ${p.sku} ${p.nombre}: ${p.stock_actual}u`).join('\n')}`);

    const liveOps = m ? `\n\nDATOS EN VIVO (${new Date().toLocaleString('es-CL')}):
Ventas hoy: $${(m.ingresos_hoy || 0).toLocaleString('es-CL')} en ${m.pedidos_hoy} pedidos · 7d: $${(m.ingresos_7d || 0).toLocaleString('es-CL')}
Pedidos en producción: ${m.pedidos_en_produccion} · listos para despacho: ${m.pedidos_listos}
Envíos en tránsito: ${m.envios_en_transito} · entregados hoy: ${m.envios_entregados_hoy}
Leads B2B hoy: ${m.leads_hoy} (calientes: ${m.leads_calientes}) · propuestas pendientes: ${m.propuestas_pendientes}
Stock bajo (<10u): ${m.stock_bajo} SKUs · consultas sin responder: ${m.consultas_sin_responder}${detalle.length ? `\n\nDETALLE CONCRETO (úsalo para nombrar registros, la tarjeta mostrará el resto):\n${detalle.join('\n\n')}` : ''}` : '';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${PEYU_OS_PROMPT}${liveOps}\n\nCONVERSACIÓN:\n${history}\n\nPeyu:`,
      model: 'claude_opus_4_8',
      response_json_schema: {
        type: 'object',
        properties: {
          mensaje: { type: 'string', description: 'Respuesta cálida y breve al founder' },
          action: { type: 'string', description: 'Nombre exacto de la acción a proponer, o "" si no hay' },
          payload: { type: 'object', additionalProperties: true, description: 'Datos de la acción (ids exactos del detalle)' },
          action_descripcion: { type: 'string', description: 'Frase corta de lo que hará la acción' },
        },
        required: ['mensaje'],
      },
    });

    const mensaje = (response?.mensaje || '').trim() || 'Cuéntame un poco más para ayudarte mejor 🐢';
    const proposal = response?.action && ACTIONS_VALIDAS.has(response.action)
      ? { action: response.action, payload: response.payload || {}, descripcion: response.action_descripcion || '' }
      : null;

    setMessages((prev) => [...prev, { role: 'assistant', content: mensaje, cards, lists: liveLists, proposal }]);
    setThinking(false);
  };

  return (
    <div className="ld-canvas flex h-full w-full overflow-hidden font-inter">
      <AgentSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onAsk={sendMessage}
        onNewThread={() => setMessages([])}
      />

      <AgentMobileDrawer
        open={mobileDrawer}
        onClose={() => setMobileDrawer(false)}
        onAsk={sendMessage}
        onNewThread={() => setMessages([])}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AgentHeader
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
          onMobileMenu={() => setMobileDrawer(true)}
          view={view}
          onView={setView}
        />

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-ld-fg-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tu negocio…</span>
          </div>
        ) : view === 'ops' ? (
          <OpsCenter onRefreshAll={() => loadData(true)} />
        ) : (
          <div className="flex-1 overflow-y-auto peyu-scrollbar px-3 sm:px-4 py-5 sm:py-6">
            <div className="max-w-[820px] mx-auto w-full space-y-6">
              {messages.length === 0 ? (
                <WelcomeScreen metrics={metrics} onAsk={sendMessage} />
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="space-y-2">
                    <MessageBubble message={msg} crm={crm} metrics={metrics} lists={lists} onAsk={sendMessage} onDone={() => loadData(true)} />
                    {msg.proposal && (
                      <ActionProposalCard proposal={msg.proposal} onDone={() => loadData(true)} />
                    )}
                  </div>
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

        {view === 'chat' && (
          <CommandBar
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            onChip={sendMessage}
            loading={thinking}
          />
        )}
      </div>
    </div>
  );
}