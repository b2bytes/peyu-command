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
import AgentRail from '@/components/agente/os/AgentRail';
import LeadKanban from '@/components/agente/os/kanban/LeadKanban';
import Composer from '@/components/agente/os/Composer';
import MessageStream from '@/components/agente/os/MessageStream';
import QuickActionBar from '@/components/agente/os/QuickActionBar';
import { detectIntent } from '@/components/agente/os/intent';
import { fmtCLP, diasParaVencer, TEAM_PHONES } from '@/components/agente/os/helpers';

const SUGERENCIAS = [
  'Muéstrame las cotizaciones',
  '¿Cómo vamos esta semana?',
  '¿Qué vence pronto?',
  'Estado de producción',
];

export default function AgenteCentral() {
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
  const voz = useVoz();
  const bottomRef = useRef(null);

  // ── Carga de datos del CRM ────────────────────────────────────────────
  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const [leads, cotizaciones, pedidos, productos, clientes, consultas, envios] = await Promise.all([
      base44.entities.B2BLead.list('-created_date', 100),
      base44.entities.CorporateProposal.list('-created_date', 50),
      base44.entities.PedidoWeb.list('-created_date', 50),
      base44.entities.Producto.filter({ activo: true }, '-updated_date', 120),
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
    if (!autoVoz || thinking) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content?.trim()) {
      voz.hablar(messages.length - 1, last.content);
    }
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
    return `Eres Peyu — el MISMO Superagent que opera el negocio de PEYU Chile (marca artesanal sustentable: "Hasta que el plástico deje de ser basura"), con la misma memoria, personalidad y criterio que en el resto del sistema. No eres un asistente distinto: eres el agente interno de comando que ya conoce el negocio. Hablas en español, cálido pero directo, breve. Cuando recibas la sección "DATOS OPERATIVOS EN VIVO", trátala como la fuente de verdad por sobre cualquier otra cifra. Datos REALES de hoy ${new Date().toLocaleDateString('es-CL')}:

LEADS B2B activos: ${kpis.pipelineB2B} (calientes: ${leadsHot.length})
COTIZACIONES enviadas abiertas: ${kpis.cotizaciones} · por vencer ≤3d: ${porVencer} · ticket promedio: ${fmtCLP(kpis.ticketPromedio)}
PEDIDOS activos: ${crm.pedidos.filter((p) => !['Entregado', 'Cancelado'].includes(p.estado)).length}

Cotizaciones que vencen pronto:
${crm.cotizaciones.filter((c) => { const d = diasParaVencer(c.fecha_vencimiento); return d != null && d >= 0 && d <= 5; }).slice(0, 5).map((c) => `• ${c.empresa} · ${fmtCLP(c.total)} · vence en ${diasParaVencer(c.fecha_vencimiento)}d`).join('\n') || '• ninguna'}

CLIENTES (${crm.clientes.length}): ${crm.clientes.slice(0, 8).map((c) => `${c.empresa || c.contacto} [${c.id}] · ${c.estado || ''}`).join(' | ') || 'sin datos'}
CONSULTAS sin responder: ${crm.consultas.filter((c) => c.estado === 'Sin responder').length} de ${crm.consultas.length}
ENVÍOS recientes: ${crm.envios.slice(0, 6).map((e) => `${e.numero_pedido || e.id} → ${e.estado}`).join(' | ') || 'sin datos'}

CATÁLOGO (sample, usa el SKU exacto): ${crm.productos.slice(0, 25).map((p) => `${p.sku}=${p.nombre}`).join(' | ')}

Cuando el usuario pida datos, responde con UNA o DOS frases cálidas (la pantalla mostrará los bloques de datos automáticamente, NO los listes en texto largo). Si pregunta algo general, sé útil y conciso. SIEMPRE devuelve un "mensaje" con texto, aunque también declares acciones (di qué vas a hacer en una frase).

=== ACCIONES REALES (modificar / crear) ===
Puedes proponer cambios reales en la base. El usuario debe confirmar con un botón. Cada acción usa IDs REALES del contexto (jamás inventes un id). Estructura:
{ "operacion": "update" | "create", "entidad": "Lead" | "Cotizacion" | "Pedido" | "Producto" | "Cliente", "registro_id": "<id real, solo para update>", "cambios": { campo: valor }, "etiqueta": "texto corto del botón", "detalle": "qué hará en una frase" }
- update: requiere registro_id real. Campos válidos: Lead → status (Nuevo, Contactado, En revisión, Propuesta enviada, Aceptado, Perdido); Cotizacion → status (Borrador, Enviada, Aceptada, Rechazada, Vencida); Pedido → estado (Nuevo, Confirmado, En Producción, Listo para Despacho, Despachado, Entregado, Cancelado); Producto → stock_actual, activo, precio_b2c; Cliente → estado, notas.
- create: para AGREGAR un producto nuevo al catálogo cuando el usuario lo pida, usa entidad "Producto" con cambios que incluyan al menos { sku, nombre, categoria, material, canal }. categoria ∈ (Escritorio, Hogar, Entretenimiento, Corporativo, Carcasas B2C); material ∈ (Plástico 100% Reciclado, Fibra de Trigo (Compostable)); canal ∈ (B2B + B2C, B2C Exclusivo, B2B Exclusivo). Pide al usuario los datos que falten antes de declarar el create.
Si falta info o el id no es seguro, NO declares la acción: pregunta. Si no hay acciones, devuelve "acciones": [].

=== EJECUTAR HERRAMIENTAS BACKEND ===
Puedes proponer ejecutar tareas del sistema declarándolas en el campo "herramientas". Cada una:
{ "fn": "<nombre exacto>", "etiqueta": "texto del botón", "detalle": "qué hace" }
Herramientas permitidas: auditoriaCatalogoCRON (audita catálogo), alertaStockBajoCRON (alerta stock <10u), analizarCostosReales (recalcula costos por SKU), bluexTrackingPollerCRON (refresca tracking de envíos), bluexAnalyzeShipments (analiza envíos), carritoAbandonadoCRON (recordatorios de carrito), recordarPropuestasPendientesCRON (reenvía propuestas), checkExpiringProposals (marca propuestas vencidas), leadReactivationCRON (reactiva leads fríos), dailyBriefingCRON (briefing del día). Solo declara una herramienta si el usuario pide explícitamente esa tarea. Si no, devuelve "herramientas": [].

=== MENSAJES AL CLIENTE ===
Cuando el usuario pida escribirle o contactar a un cliente, redacta el mensaje y declálalo en el campo "mensajes". Cada mensaje:
{ "canal": "whatsapp" | "email", "destino": "<teléfono con código país para whatsapp, o email>", "asunto": "<solo para email>", "cuerpo": "<texto del mensaje, cálido y al grano>", "etiqueta": "texto corto del botón" }
Usa datos REALES del contexto (email/teléfono del lead o cotización). Si no tienes el dato de contacto, no declares el mensaje: pídeselo al usuario. Si no hay mensajes, devuelve "mensajes": [].`;
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
    // No rompe el flujo si falla: el LLM igual responde con el contexto CRM.
    let liveOps = '';
    try {
      const brain = await base44.functions.invoke('peyuBrainOps', { query: content });
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
    } catch (_) { /* sin datos en vivo, seguimos con contexto CRM */ }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${buildContext()}${liveOps}\n\n=== CONVERSACIÓN ===\n${history}\n\nPeyu:`,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          mensaje: { type: 'string', description: 'Respuesta cálida y breve para el usuario' },
          acciones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                operacion: { type: 'string', enum: ['update', 'create'] },
                entidad: { type: 'string', enum: ['Lead', 'Cotizacion', 'Pedido', 'Producto', 'Cliente'] },
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
        },
        required: ['mensaje'],
      },
    });

    let mensaje = typeof response === 'string' ? response : (response?.mensaje || '');
    const acciones = (typeof response === 'object' && Array.isArray(response?.acciones)) ? response.acciones : [];
    const mensajes = (typeof response === 'object' && Array.isArray(response?.mensajes)) ? response.mensajes : [];
    const herramientas = (typeof response === 'object' && Array.isArray(response?.herramientas)) ? response.herramientas : [];

    // Nunca dejar al usuario con una respuesta totalmente vacía.
    if (!mensaje.trim()) {
      mensaje = (acciones.length || mensajes.length || herramientas.length)
        ? 'Listo, dejé las acciones abajo para que confirmes 👇'
        : '¿Me das un poco más de detalle para ayudarte mejor? 🐢';
    }

    // Adjuntar bloques hidratados según intención + bloques de acción/mensaje/herramienta declarados por el LLM
    const blocks = intent.blocks.map((type) => ({ type, product: type === 'product' ? intent.product : undefined }));
    acciones.forEach((accion) => blocks.push({ type: 'accion', accion }));
    mensajes.forEach((msg) => blocks.push({ type: 'mensaje', mensaje: msg }));
    herramientas.forEach((herramienta) => blocks.push({ type: 'herramienta', herramienta }));

    setMessages((prev) => [...prev, { role: 'assistant', content: mensaje, blocks }]);
    setThinking(false);
  };

  // ── Ejecutar acción real declarada por el LLM ─────────────────────────
  const ENTIDAD_MAP = {
    Lead: 'B2BLead',
    Cotizacion: 'CorporateProposal',
    Pedido: 'PedidoWeb',
    Producto: 'Producto',
  };
  const ejecutarAccion = async (accion) => {
    const entityName = ENTIDAD_MAP[accion.entidad];
    if (!entityName) throw new Error(`Entidad no soportada: ${accion.entidad}`);
    if (accion.operacion === 'create') {
      await base44.entities[entityName].create(accion.cambios);
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
  ]);
  const ejecutarHerramienta = async (herramienta) => {
    if (!HERRAMIENTAS_OK.has(herramienta.fn)) throw new Error(`Herramienta no permitida: ${herramienta.fn}`);
    await base44.functions.invoke(herramienta.fn, {});
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
      await base44.integrations.Core.SendEmail({
        to: msg.destino,
        subject: msg.asunto || 'Mensaje de PEYU',
        body: msg.cuerpo,
      });
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
    <div className="flex h-screen bg-[#fbfaf7] text-[#22302c] font-inter overflow-hidden">
      {/* Riel izquierdo */}
      <AgentRail activos={activos} onToggle={toggleAgente} />

      {/* Canvas central */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex-shrink-0 border-b border-[#ece4d8] bg-[#fbfaf7]/90 backdrop-blur-sm">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-poppins font-bold text-[#22302c] leading-none">PEYU OS</h1>
                <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">
                  {activos.length} agentes
                </span>
              </div>
              <p className="text-[11px] text-[#6f7d77] mt-0.5 truncate italic">Hasta que el plástico deje de ser basura</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-0.5 bg-white border border-[#ece4d8] rounded-xl p-0.5">
                <button
                  onClick={() => setVista('chat')}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    vista === 'chat' ? 'bg-[#0F8B6C] text-white' : 'text-[#6f7d77] hover:text-[#22302c]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  onClick={() => setVista('pipeline')}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    vista === 'pipeline' ? 'bg-[#0F8B6C] text-white' : 'text-[#6f7d77] hover:text-[#22302c]'
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
                    : 'bg-white text-[#6f7d77] border-[#ece4d8] hover:text-[#22302c]'
                }`}
                title={autoVoz ? 'Voz automática activada' : 'Activar voz automática'}
              >
                {autoVoz ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Voz</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#D96B4D] bg-[#D96B4D]/10 px-2.5 py-1 rounded-full">
                🔒 Admin
              </span>
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-[#ece4d8] hover:border-[#0F8B6C]/40 flex items-center justify-center text-[#6f7d77] hover:text-[#22302c] transition disabled:opacity-50"
                aria-label="Refrescar"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {vista === 'pipeline' ? (
          loading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-[#9aa6a0]">
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
            onCreateQuote={handleCreateQuote}
            onCreateOP={handleCreateOP}
          />
        )}

        {/* Conversación */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-[#9aa6a0]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tu negocio…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white border border-[#e7d8c6] flex items-center justify-center text-3xl shadow-sm mb-4">
              🐢
            </div>
            <h2 className="text-2xl font-poppins font-bold text-[#22302c]">Hola equipo PEYU 👋</h2>
            <p className="text-sm text-[#6f7d77] mt-2 max-w-md leading-relaxed">
              Soy Peyu. Pregúntame por las cotizaciones, qué vence pronto, cómo va la producción o un producto del catálogo.
              La pantalla se arma sola con los datos reales.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-lg">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-sm px-3.5 py-2 rounded-full bg-white border border-[#e7d8c6] text-[#6f7d77] hover:text-[#22302c] hover:border-[#0F8B6C]/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
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
        <Composer value={input} onChange={setInput} onSend={() => sendMessage()} loading={thinking} />
        </>
        )}
      </div>
    </div>
  );
}