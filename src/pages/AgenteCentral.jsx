// ============================================================================
// AgenteCentral · "PEYU OS" — Interfaz conversacional agéntica (solo admin)
// ─────────────────────────────────────────────────────────────────────────────
// El chat ES la pantalla. CRM + ERP + analítica en una sola superficie:
// el usuario habla y la pantalla se arma sola con bloques hidratados (KPIs,
// cotizaciones, alertas, ficha de producto, carga de producción) que traen
// acciones reales (WhatsApp, generar/enviar propuesta, archivar).
//
// Estética: minimal cálido fiel a Peyu — papel #fbfaf7, verde tierra #0F8B6C,
// terracota #D96B4D para lo urgente, arena #f6f1ea. Sin neón, sin glow.
//
// Mantiene: InvokeLLM con contexto del CRM, lectura de B2BLead/CorporateProposal/
// PedidoWeb/Producto, y las integraciones reales ya existentes.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, MessageSquare, Columns3, Volume2, VolumeX } from 'lucide-react';
import useVoz from '@/components/agente/os/useVoz';
import useGrabacion from '@/components/agente/os/useGrabacion';
import { PEYU_ADN } from '@/components/agente/os/peyu-brain';
import AgenteErrorBoundary from '@/components/agente/os/AgenteErrorBoundary.jsx';
import AgentRail from '@/components/agente/os/AgentRail';
import MobileAgentBar from '@/components/agente/os/MobileAgentBar';
import MemoryPanel from '@/components/agente/os/MemoryPanel';
import LeadKanban from '@/components/agente/os/kanban/LeadKanban';
import Composer from '@/components/agente/os/Composer';
import MessageStream from '@/components/agente/os/MessageStream';
import QuickActionBar from '@/components/agente/os/QuickActionBar';
import DailyBriefing from '@/components/agente/os/DailyBriefing';
import VoiceCommandBar from '@/components/agente/os/VoiceCommandBar';
import { detectIntent } from '@/components/agente/os/intent';
import { fmtCLP, diasParaVencer, TEAM_PHONES } from '@/components/agente/os/helpers';

const SUGERENCIAS = [
  'Muéstrame las cotizaciones',
  '¿Cómo vamos esta semana?',
  '¿Qué vence pronto?',
  'Estado de producción',
];

export default function AgenteCentral() {
  // Envolvemos toda la pantalla en un boundary local: si algo del chat/canvas
  // lanza durante el render (típico solo-en-móvil), mostramos un fallback usable
  // en vez de pantalla negra. NUNCA bloquea el resto del admin.
  return (
    <AgenteErrorBoundary>
      <AgenteCentralInner />
    </AgenteErrorBoundary>
  );
}

function AgenteCentralInner() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [crm, setCrm] = useState({ leads: [], cotizaciones: [], pedidos: [], productos: [], clientes: [], consultas: [], envios: [] });
  const [activos, setActivos] = useState(['ventas', 'datos']); // sub-agentes activos
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [vista, setVista] = useState('chat'); // 'chat' | 'pipeline'
  const [autoVoz, setAutoVoz] = useState(false); // lectura automática de respuestas
  const [memoryOpen, setMemoryOpen] = useState(false); // panel de memoria (Pinecone)
  const voz = useVoz();
  const bottomRef = useRef(null);
  // Marca que el último turno entró por voz → forzamos respuesta hablada
  // aunque el modo auto-voz global esté apagado (conversación voz-a-voz).
  const vozTurnoRef = useRef(false);

  // Grabación de audio → transcripción → enviar como mensaje (voz-a-voz).
  const { grabando, procesando, iniciar: iniciarGrab, detener: detenerGrab } = useGrabacion({
    onTranscrito: (texto) => { vozTurnoRef.current = true; sendMessage(texto); },
  });

  // ── Carga de datos del CRM ────────────────────────────────────────────
  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    // Cada entidad con su propio catch: si una falla (red lenta en móvil,
    // permisos, timeout), la pantalla NO queda colgada — carga con lo que tenga.
    const [leads, cotizaciones, pedidos, productos, clientes, consultas, envios] = await Promise.all([
      base44.entities.B2BLead.list('-created_date', 100).catch(() => []),
      base44.entities.CorporateProposal.list('-created_date', 50).catch(() => []),
      base44.entities.PedidoWeb.list('-created_date', 50).catch(() => []),
      base44.entities.Producto.filter({ activo: true }, '-updated_date', 120).catch(() => []),
      base44.entities.Cliente.list('-updated_date', 80).catch(() => []),
      base44.entities.Consulta.list('-created_date', 40).catch(() => []),
      base44.entities.Envio.list('-created_date', 40).catch(() => []),
    ]);
    setCrm({
      leads: leads || [], cotizaciones: cotizaciones || [], pedidos: pedidos || [], productos: productos || [],
      clientes: clientes || [], consultas: consultas || [], envios: envios || [],
    });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Lectura automática: cuando termina de pensar y la última respuesta es del
  // agente, reproducimos su voz si el modo auto-voz está activo.
  useEffect(() => {
    if (thinking) return;
    const last = messages[messages.length - 1];
    if (last?.role !== 'assistant' || !last.content?.trim()) return;
    // Habla si: el modo auto-voz está activo, O el último turno entró por voz
    // (conversación voz-a-voz fluida aunque el toggle global esté apagado).
    const debeHablar = autoVoz || vozTurnoRef.current;
    vozTurnoRef.current = false;
    if (debeHablar) voz.hablar(messages.length - 1, last.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, thinking]);

  // ── KPIs reales ───────────────────────────────────────────────────────
  const cotActivas = crm.cotizaciones.filter((c) => !['Aceptada', 'Rechazada'].includes(c.status));
  const cotEnviadas = crm.cotizaciones.filter((c) => c.status === 'Enviada');
  const porVencer = crm.cotizaciones.filter((c) => {
    const d = diasParaVencer(c.fecha_vencimiento);
    return d != null && d >= 0 && d <= 3 && !['Aceptada', 'Rechazada'].includes(c.status);
  }).length;
  const totalCot = cotActivas.reduce((s, c) => s + (c.total || 0), 0);
  const kpis = {
    pipelineB2B: crm.leads.filter((l) => !['Aceptado', 'Perdido'].includes(l.status)).length,
    cotizaciones: cotEnviadas.length,
    ticketPromedio: cotActivas.length ? Math.round(totalCot / cotActivas.length) : 0,
    porVencer,
  };

  // ── Contexto para el LLM ──────────────────────────────────────────────
  const buildContext = () => {
    const leadsHot = crm.leads.filter((l) => l.urgencia === 'Alta' || l.lead_score >= 70);
    return `${PEYU_ADN}

Eres Peyu — el MISMO Superagent que opera el negocio de PEYU Chile (marca artesanal sustentable: "Hasta que el plástico deje de ser basura"), con la misma memoria, personalidad y criterio que en el resto del sistema. No eres un asistente distinto: eres el agente interno de comando que ya conoce el negocio. Hablas en español, cálido pero directo, breve. Cuando recibas la sección "DATOS OPERATIVOS EN VIVO", trátala como la fuente de verdad por sobre cualquier otra cifra. Datos REALES de hoy ${new Date().toLocaleDateString('es-CL')}:

LEADS B2B activos: ${kpis.pipelineB2B} (calientes: ${leadsHot.length})
LEADS B2B (top, usa el id exacto): ${crm.leads.slice(0, 12).map((l) => `${l.company_name} [${l.id}] · ${l.status}${l.email ? ` · ${l.email}` : ''}`).join(' | ') || 'sin datos'}
COTIZACIONES enviadas abiertas: ${kpis.cotizaciones} · por vencer ≤3d: ${porVencer} · ticket promedio: ${fmtCLP(kpis.ticketPromedio)}
COTIZACIONES recientes (usa el id exacto): ${crm.cotizaciones.slice(0, 10).map((c) => `${c.empresa} [${c.id}] · ${fmtCLP(c.total)} · ${c.status}`).join(' | ') || 'sin datos'}
PEDIDOS activos: ${crm.pedidos.filter((p) => !['Entregado', 'Cancelado'].includes(p.estado)).length}
PEDIDOS recientes (usa el id exacto): ${crm.pedidos.slice(0, 12).map((p) => `${p.numero_pedido || ''} [${p.id}] · ${p.cliente_nombre} · ${fmtCLP(p.total)} · ${p.estado} · pago:${p.payment_status || '?'}`).join(' | ') || 'sin datos'}

Cotizaciones que vencen pronto:
${crm.cotizaciones.filter((c) => { const d = diasParaVencer(c.fecha_vencimiento); return d != null && d >= 0 && d <= 5; }).slice(0, 5).map((c) => `• ${c.empresa} [${c.id}] · ${fmtCLP(c.total)} · vence en ${diasParaVencer(c.fecha_vencimiento)}d`).join('\n') || '• ninguna'}

CLIENTES (${crm.clientes.length}): ${crm.clientes.slice(0, 8).map((c) => `${c.empresa || c.contacto} [${c.id}] · ${c.estado || ''}`).join(' | ') || 'sin datos'}
CONSULTAS sin responder: ${crm.consultas.filter((c) => c.estado === 'Sin responder').length} de ${crm.consultas.length}
ENVÍOS recientes: ${crm.envios.slice(0, 6).map((e) => `${e.numero_pedido || e.id} → ${e.estado}`).join(' | ') || 'sin datos'}

CATÁLOGO (sample, usa el SKU exacto): ${crm.productos.slice(0, 25).map((p) => `${p.sku}=${p.nombre}`).join(' | ')}

Cuando el usuario pida datos, responde con UNA o DOS frases cálidas (la pantalla mostrará los bloques de datos automáticamente, NO los listes en texto largo). Si pregunta algo general, sé útil y conciso. SIEMPRE devuelve un "mensaje" con texto, aunque también declares acciones (di qué vas a hacer en una frase).

=== ACCIONES REALES (crear / modificar / eliminar) — GESTIÓN TOTAL ===
Puedes proponer CUALQUIER operación real en la base. El usuario debe confirmar con un botón. Cada acción usa IDs REALES del contexto (jamás inventes un id). Estructura:
{ "operacion": "update" | "create" | "delete", "entidad": "Lead" | "Cotizacion" | "Pedido" | "Producto" | "Cliente" | "Consulta" | "OrdenProduccion", "registro_id": "<id real, para update/delete>", "cambios": { campo: valor }, "etiqueta": "texto corto del botón", "detalle": "qué hará en una frase" }
- update: requiere registro_id real. Campos válidos: Lead → status (Nuevo, Contactado, En revisión, Propuesta enviada, Aceptado, Perdido), notes, urgency; Cotizacion → status (Borrador, Enviada, Aceptada, Rechazada, Vencida); Pedido → estado (Nuevo, Confirmado, En Producción, Listo para Despacho, Despachado, Entregado, Cancelado), payment_status (paid, pending_transfer, refunded), tracking, notas; Producto → stock_actual, activo, precio_b2c, nombre, descripcion; Cliente → estado, notas; Consulta → estado (Respondida); OrdenProduccion → estado, prioridad.
- create: puedes CREAR registros nuevos cuando el usuario lo pida:
  · Pedido (PedidoWeb manual): cambios mínimos { fecha: "YYYY-MM-DD", canal: "WhatsApp"|"Instagram"|"Web Propia"|"Tienda Física Web", cliente_nombre, total, estado: "Nuevo", cliente_email?, cliente_telefono?, descripcion_items?, cantidad?, medio_pago?, ciudad?, direccion_envio? }
  · Lead (B2BLead): { contact_name, company_name, source: "WhatsApp"|"Formulario Web"|"Email"|"Instagram"|"LinkedIn"|"Referido"|"Otro", status: "Nuevo", email?, phone?, product_interest?, qty_estimate? }
  · Cliente: { empresa o contacto, email?, telefono? }
  · OrdenProduccion: { empresa, sku, cantidad, prioridad, estado: "Pendiente" }
  · Producto: al menos { sku, nombre, categoria, material, canal }. categoria ∈ (Escritorio, Hogar, Entretenimiento, Corporativo, Carcasas B2C); material ∈ (Plástico 100% Reciclado, Fibra de Trigo (Compostable)); canal ∈ (B2B + B2C, B2C Exclusivo, B2B Exclusivo).
  Pide al usuario los datos mínimos que falten antes de declarar el create.
- delete: requiere registro_id real. Úsalo solo si el usuario pide explícitamente eliminar/borrar. Describe claramente qué se eliminará en "detalle".
Si falta info o el id no es seguro, NO declares la acción: pregunta. Si no hay acciones, devuelve "acciones": [].

=== EJECUTAR HERRAMIENTAS BACKEND ===
Puedes proponer ejecutar tareas del sistema declarándolas en el campo "herramientas". Cada una:
{ "fn": "<nombre exacto>", "payload": { ...datos si la herramienta los requiere... }, "etiqueta": "texto del botón", "detalle": "qué hace" }
Herramientas permitidas: auditoriaCatalogoCRON (audita catálogo), alertaStockBajoCRON (alerta stock <10u), analizarCostosReales (recalcula costos por SKU), bluexTrackingPollerCRON (refresca tracking de envíos), bluexSyncAllShipments (sincroniza TODOS los envíos Bluex), bluexAnalyzeShipments (analiza envíos), mpReconcilePending (reconcilia pagos MercadoPago pendientes), cleanupTestAndExpiredOrders (limpia pedidos test/expirados), carritoAbandonadoCRON (recordatorios de carrito), recordarPropuestasPendientesCRON (reenvía propuestas), checkExpiringProposals (marca propuestas vencidas), leadReactivationCRON (reactiva leads fríos), dailyBriefingCRON (briefing del día), generateWeeklyContentPlan (genera plan de contenido semanal de redes), insightsSemanalesIA (insights semanales del negocio), reporteSemanalB2B (reporte semanal B2B), oportunidadesSEOCRON (detecta oportunidades SEO), optimizeProductSEOCRON (optimiza meta tags de productos), prediccionDemandaCRON (predice demanda y stock), solicitarResenaCRON (pide reseñas a clientes), generarFAQsDesdeConsultas (genera FAQs desde consultas), autoQuoteHotB2BLeads (cotiza automáticamente leads B2B calientes).
Herramientas CON payload obligatorio:
- agentOSAction · payload { "action": "marcarPedidoPagado"|"generarEtiqueta"|"cancelarPedido"|"reenviarPropuesta"|"sincronizarTracking", "payload": { "id": "<id pedido>" } o { "proposalId": "<id propuesta>" } } — para marcar un pedido como pagado, generar su etiqueta BlueExpress, cancelarlo o reenviar una propuesta.
- generateProposalPDF · payload { "proposalId": "<id>" } — genera el PDF de una cotización.
- sendProposalEmail · payload { "proposalId": "<id>" } — envía la cotización por email al cliente.
Solo declara una herramienta si el usuario pide explícitamente esa tarea. Si no, devuelve "herramientas": [].

=== MENSAJES AL CLIENTE ===
Cuando el usuario pida escribirle o contactar a un cliente, redacta el mensaje y declálalo en el campo "mensajes". Cada mensaje:
{ "canal": "whatsapp" | "email", "destino": "<teléfono con código país para whatsapp, o email>", "asunto": "<solo para email>", "cuerpo": "<texto del mensaje, cálido y al grano>", "etiqueta": "texto corto del botón" }
Usa datos REALES del contexto (email/teléfono del lead o cotización). Si no tienes el dato de contacto, no declares el mensaje: pídeselo al usuario. Si no hay mensajes, devuelve "mensajes": [].

=== EMAILS LIBRES ===
Puedes escribir un email a CUALQUIER destinatario (no solo del CRM). Para email usa el canal "email" en el campo "mensajes": redacta asunto y cuerpo (puedes usar HTML simple). El email se envía REALMENTE desde ti@peyuchile.cl vía Gmail, tras confirmación del usuario con el botón. Pide siempre el correo destino si no lo tienes.

=== MARKETING DE CONTENIDO / REDES SOCIALES (orquestación del agente de marketing) ===
Cuando el usuario pida crear contenido, posteos, campañas de redes, Instagram, LinkedIn, o "publicar algo", actúas como orquestador e invocas al agente de marketing dentro de este chat declarando el contenido en el campo "contenido". Cada item:
{ "red_social": "Instagram" | "LinkedIn" | "Facebook" | "TikTok", "tipo_post": "Post Imagen" | "Reel" | "Carrusel" | "Story", "pilar": "Producto" | "Sostenibilidad/ESG" | "Educativo" | "Detrás de escena" | "Testimonios" | "Promoción" | "Comunidad" | "Branding", "objetivo": "Awareness" | "Engagement" | "Tráfico web" | "Leads B2B" | "Conversión B2C" | "Fidelización", "tema": "<idea concreta del posteo>", "producto_sku": "<sku si aplica, opcional>", "fecha_publicacion": "<YYYY-MM-DD si quiere programarlo, opcional>", "etiqueta": "<texto corto del bloque>" }
El bloque generará el borrador (texto + imagen IA), lo guardará como borrador y dará un botón para publicar directo a Instagram/LinkedIn. SIEMPRE acompaña con una frase cálida en "mensaje" diciendo qué vas a crear. Si el usuario no especifica red o pilar, elige lo más razonable según el tema. Si no hay contenido que crear, devuelve "contenido": [].`;
  };

  // ── Enviar mensaje ────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    const userMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const intent = detectIntent(content, crm.productos);
    const history = [...messages, userMsg].map((m) => `${m.role === 'user' ? 'Usuario' : 'Peyu'}: ${m.content}`).join('\n\n');

    // Datos operativos EN VIVO desde el cerebro operacional (fuente de verdad).
    // Lo lanzamos EN PARALELO con el LLM para no sumar latencia: primero
    // disparamos ambas promesas y luego esperamos el brain solo para inyectar
    // contexto. No rompe el flujo si falla: el LLM igual responde con CRM.
    const brainPromise = base44.functions.invoke('peyuBrainOps', { query: content }).catch(() => null);

    let liveOps = '';
    const brain = await brainPromise;
    const m = brain?.data?.metrics;
    if (m) {
      liveOps = `\n\n=== DATOS OPERATIVOS EN VIVO (fuente de verdad, ${new Date().toLocaleString('es-CL')}) ===
Pedidos hoy: ${m.pedidos_hoy} · pagados: ${m.pedidos_pagados_hoy} · en producción: ${m.pedidos_en_produccion} · listos despacho: ${m.pedidos_listos}
Ingresos hoy: ${fmtCLP(m.ingresos_hoy)} · últimos 7d: ${fmtCLP(m.ingresos_7d)}
Leads B2B hoy: ${m.leads_hoy} · calientes: ${m.leads_calientes} · activos: ${m.leads_activos}
Propuestas pendientes: ${m.propuestas_pendientes} · aceptadas hoy: ${m.propuestas_aceptadas_hoy}
Consultas hoy: ${m.consultas_hoy} · sin responder: ${m.consultas_sin_responder}
Conversaciones con Peyu hoy: ${m.conversaciones_hoy}
Envíos en tránsito: ${m.envios_en_transito} · con excepción: ${m.envios_con_excepcion} · entregados hoy: ${m.envios_entregados_hoy}
Stock bajo (<10u): ${m.stock_bajo} SKUs`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${buildContext()}${liveOps}\n\n=== CONVERSACIÓN ===\n${history}\n\nPeyu:`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          mensaje: { type: 'string', description: 'Respuesta cálida y breve para el usuario' },
          acciones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                operacion: { type: 'string', enum: ['update', 'create', 'delete'] },
                entidad: { type: 'string', enum: ['Lead', 'Cotizacion', 'Pedido', 'Producto', 'Cliente', 'Consulta', 'OrdenProduccion'] },
                registro_id: { type: 'string' },
                cambios: { type: 'object', additionalProperties: true },
                etiqueta: { type: 'string' },
                detalle: { type: 'string' },
              },
              required: ['entidad', 'cambios'],
            },
          },
          herramientas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fn: { type: 'string' },
                payload: { type: 'object', additionalProperties: true },
                etiqueta: { type: 'string' },
                detalle: { type: 'string' },
              },
              required: ['fn'],
            },
          },
          mensajes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                canal: { type: 'string', enum: ['whatsapp', 'email'] },
                destino: { type: 'string' },
                asunto: { type: 'string' },
                cuerpo: { type: 'string' },
                etiqueta: { type: 'string' },
              },
              required: ['canal', 'destino', 'cuerpo'],
            },
          },
          contenido: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                red_social: { type: 'string' },
                tipo_post: { type: 'string' },
                pilar: { type: 'string' },
                objetivo: { type: 'string' },
                tema: { type: 'string' },
                producto_sku: { type: 'string' },
                fecha_publicacion: { type: 'string' },
                etiqueta: { type: 'string' },
              },
              required: ['tema'],
            },
          },
        },
        required: ['mensaje'],
      },
    });

    let mensaje = typeof response === 'string' ? response : (response?.mensaje || '');
    const acciones = (typeof response === 'object' && Array.isArray(response?.acciones)) ? response.acciones : [];
    const mensajes = (typeof response === 'object' && Array.isArray(response?.mensajes)) ? response.mensajes : [];
    const herramientas = (typeof response === 'object' && Array.isArray(response?.herramientas)) ? response.herramientas : [];
    const contenido = (typeof response === 'object' && Array.isArray(response?.contenido)) ? response.contenido : [];

    // Nunca dejar al usuario con una respuesta totalmente vacía.
    if (!mensaje.trim()) {
      mensaje = (acciones.length || mensajes.length || herramientas.length || contenido.length)
        ? 'Listo, dejé las acciones abajo para que confirmes 👇'
        : '¿Me das un poco más de detalle para ayudarte mejor? 🐢';
    }

    // Adjuntar bloques hidratados según intención + bloques de acción/mensaje/herramienta declarados por el LLM
    const blocks = intent.blocks.map((type) => ({ type, product: type === 'product' ? intent.product : undefined }));
    acciones.forEach((accion) => blocks.push({ type: 'accion', accion }));
    mensajes.forEach((msg) => blocks.push({ type: 'mensaje', mensaje: msg }));
    herramientas.forEach((herramienta) => blocks.push({ type: 'herramienta', herramienta }));
    contenido.forEach((c) => blocks.push({ type: 'contenido', contenido: c }));

    setMessages((prev) => [...prev, { role: 'assistant', content: mensaje, blocks }]);
    setThinking(false);
  };

  // ── Ejecutar acción real declarada por el LLM ─────────────────────────
  const ENTIDAD_MAP = {
    Lead: 'B2BLead',
    Cotizacion: 'CorporateProposal',
    Pedido: 'PedidoWeb',
    Producto: 'Producto',
    Cliente: 'Cliente',
    Consulta: 'Consulta',
    OrdenProduccion: 'OrdenProduccion',
  };
  const ejecutarAccion = async (accion) => {
    const entityName = ENTIDAD_MAP[accion.entidad];
    if (!entityName) throw new Error(`Entidad no soportada: ${accion.entidad}`);
    if (accion.operacion === 'create') {
      await base44.entities[entityName].create(accion.cambios);
    } else if (accion.operacion === 'delete') {
      if (!accion.registro_id) throw new Error('Falta el id del registro');
      await base44.entities[entityName].delete(accion.registro_id);
    } else {
      if (!accion.registro_id) throw new Error('Falta el id del registro');
      await base44.entities[entityName].update(accion.registro_id, accion.cambios);
    }
    await loadData(true);
  };

  // ── Ejecutar herramienta backend declarada por el LLM ─────────────────
  const HERRAMIENTAS_OK = new Set([
    'auditoriaCatalogoCRON', 'alertaStockBajoCRON', 'analizarCostosReales',
    'bluexTrackingPollerCRON', 'bluexAnalyzeShipments', 'carritoAbandonadoCRON',
    'recordarPropuestasPendientesCRON', 'checkExpiringProposals',
    'leadReactivationCRON', 'dailyBriefingCRON',
    'generateWeeklyContentPlan', 'insightsSemanalesIA', 'reporteSemanalB2B',
    'oportunidadesSEOCRON', 'optimizeProductSEOCRON', 'prediccionDemandaCRON',
    'solicitarResenaCRON', 'generarFAQsDesdeConsultas', 'autoQuoteHotB2BLeads',
    'bluexSyncAllShipments', 'mpReconcilePending', 'cleanupTestAndExpiredOrders',
    'agentOSAction', 'generateProposalPDF', 'sendProposalEmail',
  ]);
  const ejecutarHerramienta = async (herramienta) => {
    if (!HERRAMIENTAS_OK.has(herramienta.fn)) throw new Error(`Herramienta no permitida: ${herramienta.fn}`);
    await base44.functions.invoke(herramienta.fn, herramienta.payload || {});
    await loadData(true);
  };

  // ── Enviar mensaje real al cliente (WhatsApp / Email) ─────────────────
  const enviarMensaje = async (msg) => {
    if (msg.canal === 'whatsapp') {
      const tel = String(msg.destino || '').replace(/[^\d]/g, '');
      if (!tel) throw new Error('Teléfono inválido');
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg.cuerpo)}`, '_blank');
      return;
    }
    if (msg.canal === 'email') {
      // Email real desde ti@peyuchile.cl vía Gmail. Si Gmail falla, caemos
      // al envío básico de la plataforma para no dejar al usuario sin enviar.
      const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#22302c;white-space:pre-wrap">${msg.cuerpo}</div>`;
      try {
        const res = await base44.functions.invoke('sendGmailEmail', {
          to: msg.destino,
          subject: msg.asunto || 'Mensaje de PEYU',
          html,
        });
        if (!res?.data?.ok) throw new Error(res?.data?.error || 'Gmail no confirmó el envío');
      } catch (_) {
        await base44.integrations.Core.SendEmail({
          to: msg.destino,
          subject: msg.asunto || 'Mensaje de PEYU',
          body: msg.cuerpo,
        });
      }
      return;
    }
    throw new Error(`Canal no soportado: ${msg.canal}`);
  };

  // ── Acciones reales sobre cotizaciones ────────────────────────────────
  const handleAction = async (action, cot) => {
    if (action === 'whatsapp') {
      const tel = (cot.email && TEAM_PHONES.joaquin) || TEAM_PHONES.joaquin;
      const msg = encodeURIComponent(
        `Hola ${cot.contacto || cot.empresa}, te escribo desde PEYU sobre tu cotización ${cot.numero || ''} por ${fmtCLP(cot.total)}. ¿Conversamos para avanzar?`
      );
      window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
      return;
    }

    if (action === 'archivar') {
      setBusyId(cot.id);
      await base44.entities.CorporateProposal.update(cot.id, { status: 'Vencida' });
      await loadData(true);
      setBusyId(null);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Listo, archivé la cotización de **${cot.empresa}** como vencida.` }]);
      return;
    }

    if (action === 'propuesta') {
      setBusyId(cot.id);
      // Reusar funciones reales existentes: generar PDF + enviar por email.
      // El PDF siempre se genera; el envío de email puede fallar (p. ej. el
      // correo del cliente está fuera de la app) sin romper toda la acción.
      let emailOk = false;
      let emailMsg = '';
      try {
        await base44.functions.invoke('generateProposalPDF', { proposalId: cot.id });
        if (cot.email) {
          await base44.functions.invoke('sendProposalEmail', { proposalId: cot.id });
          emailOk = true;
        }
      } catch (e) {
        emailMsg = e?.response?.data?.error || e?.message || 'no se pudo enviar el email';
      }
      await loadData(true);
      setBusyId(null);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: !cot.email
          ? `Generé la propuesta de **${cot.empresa}**. No tiene email registrado, así que quedó lista para descargar.`
          : emailOk
            ? `Generé la propuesta de **${cot.empresa}** y la envié a ${cot.email}. ✅`
            : `Generé la propuesta de **${cot.empresa}**, pero el envío por email no salió (${emailMsg}). Quedó lista para descargar o enviar por WhatsApp.`,
      }]);
      return;
    }
  };

  // ── Acciones rápidas: cotización y orden de producción (1 clic) ───────
  const handleCreateQuote = async ({ empresa, contacto, email, sku, cantidad }) => {
    const producto = crm.productos.find((p) => p.sku === sku);
    const res = await base44.functions.invoke('createSelfServiceProposal', {
      company_name: empresa,
      contact_name: contacto || empresa,
      email: email || '',
      items: [{
        sku,
        nombre: producto?.nombre || sku,
        qty: cantidad,
        cantidad,
        precio_b2c: producto?.precio_b2c,
        precio_base_b2b: producto?.precio_base_b2b,
        precio_50_199: producto?.precio_50_199,
        precio_200_499: producto?.precio_200_499,
        precio_500_mas: producto?.precio_500_mas,
        imagen_url: producto?.imagen_url || '',
        categoria: producto?.categoria,
        personalizacion: false,
      }],
    });
    await loadData(true);
    const numero = res?.data?.numero ? ` (${res.data.numero})` : '';
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: `Generé la cotización para **${empresa}**${numero}: ${cantidad} u de ${producto?.nombre || sku}${res?.data?.total ? ` por ${fmtCLP(res.data.total)}` : ''}. ✅`,
    }]);
  };

  const handleCreateOP = async ({ empresa, sku, cantidad, prioridad }) => {
    const producto = crm.productos.find((p) => p.sku === sku);
    await base44.entities.OrdenProduccion.create({
      empresa,
      sku,
      cantidad,
      prioridad,
      estado: 'Pendiente',
      personalizacion: false,
    });
    await loadData(true);
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: `Creé la orden de producción para **${empresa}**: ${cantidad} u de ${producto?.nombre || sku} · prioridad ${prioridad}. 🏭`,
    }]);
  };

  const toggleAgente = (id) =>
    setActivos((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  return (
    <div
      className="flex h-[100dvh] w-full max-w-full text-[#eaf5f0] font-inter overflow-hidden"
      style={{ background: 'radial-gradient(130% 100% at 0% 0%, #11352b 0%, #0a1813 45%, #081210 100%)' }}
    >
      {/* Riel izquierdo */}
      <AgentRail activos={activos} onToggle={toggleAgente} onOpenMemory={() => setMemoryOpen(true)} />

      {/* Panel de memoria (cerebro Pinecone) */}
      <MemoryPanel open={memoryOpen} onClose={() => setMemoryOpen(false)} />

      {/* Canvas central */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex-shrink-0 border-b border-[#1f3a31] bg-[#0a1813]/80 backdrop-blur-xl">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-poppins font-bold text-[#eaf5f0] leading-none">PEYU OS</h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#3dd9b0] bg-[#0F8B6C]/15 border border-[#0F8B6C]/25 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3dd9b0] animate-pulse" />
                  {activos.length} agentes operativos
                </span>
              </div>
              <p className="text-[11px] text-[#7fa295] mt-0.5 truncate italic">Hasta que el plástico deje de ser basura</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-0.5 bg-[#10231d] border border-[#2a4a40] rounded-xl p-0.5">
                <button
                  onClick={() => setVista('chat')}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    vista === 'chat' ? 'bg-[#0F8B6C] text-white' : 'text-[#7fa295] hover:text-[#eaf5f0]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  onClick={() => setVista('pipeline')}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    vista === 'pipeline' ? 'bg-[#0F8B6C] text-white' : 'text-[#7fa295] hover:text-[#eaf5f0]'
                  }`}
                >
                  <Columns3 className="w-3.5 h-3.5" /> Pipeline
                </button>
              </div>
              <button
                onClick={() => { setAutoVoz((v) => { if (v) voz.detener(); return !v; }); }}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-colors ${
                  autoVoz
                    ? 'bg-[#0F8B6C] text-white border-[#0F8B6C]'
                    : 'bg-[#10231d] text-[#7fa295] border-[#2a4a40] hover:text-[#eaf5f0]'
                }`}
                title={autoVoz ? 'Voz automática activada' : 'Activar voz automática'}
              >
                {autoVoz ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Voz</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#f0a085] bg-[#D96B4D]/15 border border-[#D96B4D]/25 px-2.5 py-1 rounded-full">
                🔒 Admin
              </span>
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/50 flex items-center justify-center text-[#7fa295] hover:text-[#eaf5f0] transition disabled:opacity-50"
                aria-label="Refrescar"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {vista === 'pipeline' ? (
          loading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-[#7fa295]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando pipeline…</span>
            </div>
          ) : (
            <LeadKanban leads={crm.leads} onRefresh={() => loadData(true)} />
          )
        ) : (
        <>
        {/* Barra de acciones rápidas */}
        {!loading && (
          <QuickActionBar
            productos={crm.productos}
            pedidos={crm.pedidos}
            onCreateQuote={handleCreateQuote}
            onCreateOP={handleCreateOP}
            onPedidosRefresh={() => loadData(true)}
          />
        )}

        {/* Conversación */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-[#7fa295]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tu negocio…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto peyu-scrollbar flex flex-col items-center justify-center px-6 text-center py-8">
            {/* Orbe luminoso */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-5 shadow-[0_0_60px_-10px_rgba(15,139,108,0.6)]"
              style={{ background: 'radial-gradient(circle at 35% 30%, #3dd9b0 0%, #0F8B6C 45%, #0a4a3a 100%)' }}
            >
              🐢
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3dd9b0] bg-[#0F8B6C]/15 border border-[#0F8B6C]/25 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3dd9b0] animate-pulse" /> AI Native · Agéntico
            </span>
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-[#eaf5f0]">
              Hola equipo <span className="text-[#3dd9b0]">PEYU</span> 👋
            </h2>
            <p className="text-sm text-[#7fa295] mt-3 max-w-md leading-relaxed">
              Tu negocio, conversando. Pregúntame por las cotizaciones, qué vence pronto, cómo va la producción
              o un producto del catálogo — la pantalla se arma sola con los datos reales.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-lg">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-sm px-3.5 py-2 rounded-full bg-[#10231d] border border-[#2a4a40] text-[#9fc7b8] hover:text-[#eaf5f0] hover:border-[#0F8B6C]/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Comandos rápidos por voz: dictan una instrucción al agente y
                fuerzan respuesta hablada para ese turno. */}
            <VoiceCommandBar onCommand={(q) => { vozTurnoRef.current = true; sendMessage(q); }} />

            {/* Briefing del día: resumen en vivo con métricas clickeables */}
            <DailyBriefing onAsk={(q) => sendMessage(q)} />
          </div>
        ) : (
          <MessageStream
            messages={messages}
            crm={crm}
            kpis={kpis}
            onAction={handleAction}
            busyId={busyId}
            loading={thinking}
            bottomRef={bottomRef}
            onEjecutarAccion={ejecutarAccion}
            onEnviarMensaje={enviarMensaje}
            onEjecutarHerramienta={ejecutarHerramienta}
            voz={voz}
          />
        )}

        {/* Composer flotante */}
        <Composer
          value={input}
          onChange={setInput}
          onSend={() => sendMessage()}
          loading={thinking}
          grabando={grabando}
          procesando={procesando}
          onMicStart={() => { voz.detener(); iniciarGrab(); }}
          onMicStop={detenerGrab}
        />
        </>
        )}

        {/* Barra inferior móvil: sub-agentes + memoria/ajustes (el AgentRail
            lateral está oculto en celular). Solo visible en móvil. */}
        <MobileAgentBar activos={activos} onToggle={toggleAgente} onOpenMemory={() => setMemoryOpen(true)} />
      </div>
    </div>
  );
}