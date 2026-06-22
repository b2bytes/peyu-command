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
import useAgentVoice from '@/hooks/useAgentVoice';

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
- updateProducto {id, precio_b2c?, stock_actual?, activo?, imagen_url?} (imagen_url: si el founder ADJUNTÓ una imagen y pide usarla como foto del producto, usa la URL exacta del adjunto)
- enviarEmail {to, asunto, cuerpo} (email libre vía Gmail PEYU)
- sincronizarTracking {} (refresca tracking de todos los envíos Bluex)
- generarImagenProducto {sku, efecto?, formato?: "cuadrado"|"historia"|"horizontal", red_social?} (crea una imagen publicitaria IA a partir de las FOTOS REALES del producto del catálogo, aplicando el efecto/estilo que pida el founder; queda como Borrador en Social Studio)
- generarVideoProducto {sku, efecto?, formato?: "historia"|"horizontal", duracion?: 4|6|8} (crea un video IA del producto basado en su foto real; tarda ~1 min y queda como Borrador en Social Studio)
Para imagen/video usa el [sku:XXX] exacto del CATÁLOGO en el detalle. Tienes capacidad total sobre la data del negocio: pedidos, leads, propuestas, stock, clientes, consultas, envíos y catálogo completo.
Cuando el founder pida "muéstrame los pedidos para confirmar pago" / "por pagar", la pantalla muestra una tarjeta SOLO con los pedidos POR CONFIRMAR PAGO (los que en el detalle dicen pago: POR CONFIRMAR), cada uno con su botón "Marcar pagado". Cuando pida "muéstrame los pedidos para crear etiqueta" / "para despachar", la tarjeta muestra SOLO los pedidos ya PAGADOS y sin OT, con botón "Generar etiqueta". En ambos casos NOMBRA los pedidos concretos del detalle (cliente + N° + monto) y di cuántos son; no inventes ninguno.
Cuando el founder quiera GESTIONAR pedidos de punta a punta ("pipeline", "gestionar pedidos", "flujo de pedidos", "cómo voy con los despachos", "confirmar pagos", "generar etiquetas en lote"), la pantalla muestra una TARJETA FLUJO DE PEDIDOS con el flujo secuencial completo de e-commerce (por confirmar pago → en producción → generar etiqueta → despachar → despachado), cada pedido con badge B2C/B2B y stepper de avance. En las etapas "por confirmar pago" y "generar etiqueta" el founder puede SELECCIONAR varios pedidos y confirmar pagos o generar etiquetas EN LOTE de una sola vez. Resume en 1-2 frases qué etapa tiene más pendientes y recuérdale que puede seleccionar varios para procesarlos juntos.
REGLAS: usa SOLO los ids exactos que aparecen en DETALLE CONCRETO como [id:XXX]. Si no tienes el id del registro, NO propongas acción — pide al founder que precise cuál. Máximo UNA acción por respuesta.

BÚSQUEDA DE REGISTROS: cuando el founder pida buscar/traer un cliente, pedido, cotización, propuesta o lead específico (por nombre, email, RUT, teléfono, o un código como "cot-2606-jaym" o "pedido 1042"), te paso el RESULTADO DE BÚSQUEDA en el detalle y la pantalla muestra una tarjeta con los registros encontrados — las fichas de CLIENTE son EDITABLES en el mismo chat (el founder puede tocar "Editar" y cambiar datos sin salir). NOMBRA el registro exacto encontrado (con su dato clave: email, monto, estado) y dile que puede tocarlo para ver/editar su ficha completa abajo. Si la búsqueda no encontró nada, dilo con honestidad y pide otro dato (email, RUT o número).

CONTACTO DE LEADS: cada lead B2B activo en el DETALLE incluye su email y teléfono reales. Cuando te pregunten por el contacto de un lead (ej: "¿dónde veo el contacto de Hilti?"), DALO directamente con su email/teléfono del detalle — NUNCA digas "no lo tengo a la vista" si el lead aparece en el detalle. Si un lead específico realmente trae "sin email"/"sin teléfono", dilo así y aclara que puede completarlo en el embudo. Además recuérdale que en la tarjeta de leads de abajo puede TOCAR cada lead para ver su contacto y ficha completa, cliente por cliente. Para buscar un lead, búscalo por nombre de empresa o contacto aunque el founder te dé un código o ID parcial.

REGLA DE ORO — NUNCA INVENTES DATOS: responde EXCLUSIVAMENTE con las cifras y registros que aparecen en "DATOS EN VIVO" y "DETALLE CONCRETO". Si te preguntan por algo que NO está en esos datos (un pedido, cliente o número que no ves), di con honestidad "no lo tengo a la vista ahora" o pide que precise — JAMÁS inventes montos, nombres, estados ni cantidades. Si los DATOS EN VIVO dicen 0 o vacío, repórtalo tal cual (ej: "hoy no hay ventas registradas aún"), no rellenes con suposiciones.

Responde SIEMPRE en el formato JSON pedido: "mensaje" (tu respuesta cálida), "action" (nombre exacto de la acción o "" si no hay), "payload" (objeto con los datos), "action_descripcion" (frase corta de lo que hará, ej: "Marcar pedido #1042 como pagado"). Si no se entiende la pregunta, pide aclaración y sugiere qué puedes hacer (ventas, pedidos, stock, cotizaciones, leads, consultas, clientes, emails, etiquetas).`;

// Whitelist de acciones que el front acepta del LLM (defensa en profundidad;
// el backend valida de nuevo y exige admin).
const ACTIONS_VALIDAS = new Set([
  'updatePedidoEstado', 'marcarPedidoPagado', 'generarEtiqueta', 'cancelarPedido',
  'marcarConsultaRespondida', 'responderConsulta', 'updateLeadEstado',
  'updatePropuestaEstado', 'enviarPropuesta', 'reenviarPropuesta', 'ajustarStock',
  'updateProducto', 'enviarEmail', 'sincronizarTracking', 'eliminarLead',
  'generarImagenProducto', 'generarVideoProducto',
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
  const [attachments, setAttachments] = useState([]); // [{name, url, type}]
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);   // admin que usa el agente
  const [convId, setConvId] = useState(null);         // hilo guardado actual
  const [threadsKey, setThreadsKey] = useState(0);    // refresca lista de hilos
  const bottomRef = useRef(null);
  const voice = useAgentVoice();

  useEffect(() => { base44.auth.me().then((u) => setUserEmail(u?.email || null)).catch(() => {}); }, []);

  // Guarda/actualiza el hilo en AgentOSConversation (por email del admin).
  const persistConversation = async (msgs) => {
    if (!userEmail || !msgs.length) return;
    const simple = msgs.map((m) => ({
      role: m.role,
      content: m.content || '',
      attachments: m.attachments || [],
      at: new Date().toISOString(),
    }));
    const data = {
      user_email: userEmail,
      titulo: (simple.find((m) => m.role === 'user')?.content || 'Conversación').slice(0, 60),
      mensajes: simple,
      mensajes_count: simple.length,
      ultimo_mensaje_at: new Date().toISOString(),
    };
    if (convId) {
      await base44.entities.AgentOSConversation.update(convId, data).catch(() => {});
    } else {
      const c = await base44.entities.AgentOSConversation.create(data).catch(() => null);
      if (c?.id) setConvId(c.id);
    }
    setThreadsKey((k) => k + 1);
  };

  // Limpiar chat: el hilo ya quedó guardado en cada respuesta → solo reinicia.
  const clearChat = () => {
    voice.stop();
    setMessages([]);
    setConvId(null);
  };

  // Retomar un hilo guardado.
  const loadThread = (conv) => {
    voice.stop();
    setMessages((conv.mensajes || []).map((m) => ({ role: m.role, content: m.content, attachments: m.attachments || [] })));
    setConvId(conv.id);
    setView('chat');
    setMobileDrawer(false);
  };

  // Adjuntar documentos/imágenes: se suben al instante y quedan listos para enviar.
  const handleAttach = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const subidos = await Promise.all(files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return { name: file.name, url: file_url, type: file.type };
    }));
    setAttachments((prev) => [...prev, ...subidos]);
    setUploading(false);
  };

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
    if ((!content && attachments.length === 0) || thinking) return;
    const adjuntos = [...attachments];
    const userMsg = { role: 'user', content: content || 'Te adjunto estos archivos', attachments: adjuntos };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setThinking(true);

    const cards = detectCards(content);

    // ── Búsqueda universal de un registro puntual ──────────────────────────
    // Si el founder pide buscar/traer un cliente/pedido/cotización específico
    // (por nombre, email, RUT, teléfono o código como "cot-2606-jaym"),
    // consultamos agentOSBuscar para encontrar el registro EXACTO sin depender
    // de las 12 listas top — y lo embebemos como tarjeta editable en el chat.
    const esBusqueda = /\b(busca|buscar|encuentra|tr[aá]e(?:me)?|mu[eé]strame a|cliente|pedido|cotizaci|propuesta|lead|cot-|ped-|rut|correo|email|tel[eé]fono|qui[eé]n es|ficha de|datos de|perfil de)\b/i.test(content)
      || /\b(cot|ped|prop)[-\s]?\d/i.test(content);
    let searchRes = null;
    if (esBusqueda) {
      const sr = await base44.functions.invoke('agentOSBuscar', { query: content }).catch(() => null);
      if (sr?.data?.ok && sr.data.total > 0) {
        searchRes = sr.data;
        cards.unshift({ type: 'search' });
      }
    }

    const history = [...messages, userMsg]
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Founder' : 'Peyu'}: ${m.content}`)
      .join('\n');

    // Refrescamos métricas + LISTAS reales en vivo (fuente de verdad).
    const brain = await base44.functions.invoke('peyuBrainOps', { query: content }).catch(() => null);
    const m = brain?.data?.metrics;
    const liveLists = brain?.data?.lists || {};
    // Adjuntamos los resultados de la búsqueda universal para que la tarjeta
    // SearchResultsCard los reciba vía lists.search.
    if (searchRes) liveLists.search = searchRes;
    if (m) setMetrics(m);
    if (brain?.data?.lists) setLists(liveLists);

    // Inyectamos los DATOS CONCRETOS de lo preguntado, no solo el número.
    // Así el agente puede nombrar las consultas/pedidos en su respuesta y NO
    // promete cosas que no tiene (causa raíz del bug reportado).
    const detalle = [];
    // Resultado de la búsqueda puntual: lo primero, para que el agente nombre el
    // registro EXACTO encontrado (cliente/pedido/cotización) sin inventar.
    if (searchRes?.resumen && searchRes.total > 0)
      detalle.push(`RESULTADO DE BÚSQUEDA para "${searchRes.query}" (${searchRes.total} encontrados — la tarjeta de abajo muestra los registros, los de cliente son EDITABLES en el chat):\n${searchRes.resumen}`);
    if (liveLists.consultas_pendientes?.length)
      detalle.push(`Consultas sin responder:\n${liveLists.consultas_pendientes.map(c => `• [id:${c.id}] ${c.nombre || 'Sin nombre'} (${c.canal || 'web'})${c.email ? ` ${c.email}` : ''}: "${(c.mensaje || '').slice(0, 80)}"`).join('\n')}`);
    if (liveLists.pedidos_pendientes?.length)
      detalle.push(`Pedidos en curso (estado operativo + estado de pago real):\n${liveLists.pedidos_pendientes.map(p => `• [id:${p.id}] ${p.numero_pedido || p.id?.slice(-6)} · ${p.cliente_nombre} · $${(p.total || 0).toLocaleString('es-CL')} · ${p.estado} · pago: ${p.payment_status === 'paid' ? 'PAGADO' : (['Confirmado','En Producción','Listo para Despacho','Despachado','Entregado'].includes(p.estado) ? 'PAGADO' : 'POR CONFIRMAR')}${p.tracking ? ` · OT ${p.tracking}` : ''}`).join('\n')}`);
    if (liveLists.leads_top?.length)
      detalle.push(`Leads B2B activos (incluyen su contacto real — úsalo, NO digas que no lo tienes):\n${liveLists.leads_top.map(l => `• [id:${l.id}] ${l.company_name} · ${l.contact_name || 's/contacto'} · ${l.email || 'sin email'} · ${l.phone || 'sin teléfono'} · ${l.product_interest || ''}${l.qty_estimate ? ` ${l.qty_estimate}u` : ''} · score ${l.lead_score || 0} · ${l.status}`).join('\n')}`);
    if (liveLists.stock_bajo_list?.length)
      detalle.push(`Stock bajo:\n${liveLists.stock_bajo_list.map(p => `• [id:${p.id}] ${p.sku} ${p.nombre}: ${p.stock_actual}u`).join('\n')}`);
    if (liveLists.clientes_nuevos?.length)
      detalle.push(`Clientes NUEVOS (últimos registrados, orden cronológico descendente):\n${liveLists.clientes_nuevos.slice(0, 8).map(c => `• [id:${c.id}] ${c.contacto || c.empresa || 'Sin nombre'}${c.empresa && c.contacto ? ` (${c.empresa})` : ''} · ${c.email || ''} · registrado ${c.created_date ? new Date(c.created_date).toLocaleDateString('es-CL') : ''}`).join('\n')}`);
    if (liveLists.clientes_top?.length)
      detalle.push(`Clientes TOP (mejores compradores históricos):\n${liveLists.clientes_top.slice(0, 5).map(c => `• [id:${c.id}] ${c.contacto || c.empresa || 'Sin nombre'} · $${(c.total_compras_clp || 0).toLocaleString('es-CL')} en ${c.num_pedidos || 0} pedidos`).join('\n')}`);
    // Catálogo completo: permite al agente ejecutar acciones de producto y
    // generación de imagen/video con el sku/id exacto sin pedir precisiones.
    if (crm.productos?.length)
      detalle.push(`CATÁLOGO (productos activos, para acciones de producto y generación de contenido):\n${crm.productos.slice(0, 50).map(p => `• [id:${p.id}] [sku:${p.sku}] ${p.nombre} · stock ${p.stock_actual ?? '–'}u · $${(p.precio_b2c || 0).toLocaleString('es-CL')}`).join('\n')}`);
    if (liveLists.envios_list?.length)
      detalle.push(`Envíos BlueExpress activos (para generarEtiqueta usa el [pedido:XXX] del envío):\n${liveLists.envios_list.map(e => `• [id:${e.id}]${e.pedido_id ? ` [pedido:${e.pedido_id}]` : ''} OT ${e.tracking_number || 'sin emitir'} · ${e.cliente_nombre || ''} · ${e.estado}${e.tiene_etiqueta ? ' · etiqueta lista' : ''}${e.tiene_excepcion ? ' ⚠ excepción' : ''}${e.comuna_destino ? ` · ${e.comuna_destino}` : ''}`).join('\n')}`);

    const liveOps = m ? `\n\nDATOS EN VIVO (${new Date().toLocaleString('es-CL')}):
Ventas hoy: $${(m.ingresos_hoy || 0).toLocaleString('es-CL')} en ${m.pedidos_hoy} pedidos · 7d: $${(m.ingresos_7d || 0).toLocaleString('es-CL')}
Pedidos en producción: ${m.pedidos_en_produccion} · listos para despacho: ${m.pedidos_listos}
Envíos en tránsito: ${m.envios_en_transito} · entregados hoy: ${m.envios_entregados_hoy}
Leads B2B hoy: ${m.leads_hoy} (calientes: ${m.leads_calientes}) · propuestas pendientes: ${m.propuestas_pendientes}
Stock bajo (<10u): ${m.stock_bajo} SKUs · consultas sin responder: ${m.consultas_sin_responder}${detalle.length ? `\n\nDETALLE CONCRETO (úsalo para nombrar registros, la tarjeta mostrará el resto):\n${detalle.join('\n\n')}` : ''}` : '';

    // Archivos adjuntos: el agente los ve (imágenes/PDFs) y conoce sus URLs
    // exactas para acciones como updateProducto {imagen_url}.
    const adjuntosCtx = adjuntos.length
      ? `\n\nARCHIVOS ADJUNTOS POR EL FOUNDER (puedes verlos; usa estas URLs exactas si propones una acción con ellos):\n${adjuntos.map((a) => `• ${a.name} → ${a.url}`).join('\n')}`
      : '';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${PEYU_OS_PROMPT}${liveOps}${adjuntosCtx}\n\nCONVERSACIÓN:\n${history}\n\nPeyu:`,
      model: 'claude_opus_4_8',
      ...(adjuntos.length ? { file_urls: adjuntos.map((a) => a.url) } : {}),
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

    const next = [...messages, userMsg, { role: 'assistant', content: mensaje, cards, lists: liveLists, proposal }];
    setMessages(next);
    // Modo conversación: Joaquín lee la respuesta en voz alta automáticamente.
    if (voice.voiceOn) voice.speak(next.length - 1, mensaje);
    // El hilo queda guardado automáticamente para este admin.
    persistConversation(next);
    setThinking(false);
  };

  return (
    // absolute inset-0: ancla la página al <main relative> del Layout. h-full
    // (porcentaje) no resolvía en Safari/iOS y la pantalla quedaba colapsada.
    <div className="ld-canvas absolute inset-0 flex overflow-hidden font-inter">
      <AgentSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onAsk={sendMessage}
        onNewThread={clearChat}
        userEmail={userEmail}
        activeThreadId={convId}
        threadsKey={threadsKey}
        onSelectThread={loadThread}
      />

      <AgentMobileDrawer
        open={mobileDrawer}
        onClose={() => setMobileDrawer(false)}
        onAsk={sendMessage}
        onNewThread={clearChat}
        userEmail={userEmail}
        activeThreadId={convId}
        threadsKey={threadsKey}
        onSelectThread={loadThread}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AgentHeader
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
          onMobileMenu={() => setMobileDrawer(true)}
          view={view}
          onView={setView}
          onClear={messages.length > 0 ? clearChat : null}
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
                    <MessageBubble message={msg} msgId={i} voice={voice} crm={crm} metrics={metrics} lists={lists} onAsk={sendMessage} onDone={() => loadData(true)} />
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
            attachments={attachments}
            onAttach={handleAttach}
            onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
            uploading={uploading}
            voice={voice}
          />
        )}
      </div>
    </div>
  );
}