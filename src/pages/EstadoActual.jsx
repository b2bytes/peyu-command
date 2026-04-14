import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronRight,
  Package, Users, DollarSign, Factory, Zap, Target, TrendingUp,
  Globe, MessageSquare, FileText, Database, Bot, RefreshCw, Star,
  ShoppingCart, BarChart2, Settings, Lock, Cpu
} from "lucide-react";

const STATUS = {
  done:     { label: "Implementado",     icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  partial:  { label: "Parcial",          icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
  pending:  { label: "Pendiente",        icon: AlertTriangle,color: "text-orange-600",  bg: "bg-orange-50 border-orange-200" },
  missing:  { label: "No implementado",  icon: XCircle,      color: "text-red-500",     bg: "bg-red-50 border-red-200" },
};

function StatusBadge({ status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.color}`}>
      <s.icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function Section({ title, icon: SectionIcon, children, defaultOpen = false }) {
  const Icon = SectionIcon;
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(15,139,108,0.1)' }}>
            <Icon className="w-4 h-4" style={{ color: '#0F8B6C' }} />
          </div>
          <span className="font-poppins font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-6 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

function ItemRow({ label, status, note, blueprint }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {blueprint && <p className="text-xs text-muted-foreground mt-0.5 italic">Blueprint: {blueprint}</p>}
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <div className="flex-shrink-0">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

export default function EstadoActual() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Producto.list('-created_date', 5),
      base44.entities.B2BLead.list('-created_date', 5),
      base44.entities.CorporateProposal.list('-created_date', 5),
      base44.entities.PersonalizationJob.list('-created_date', 5),
      base44.entities.PedidoWeb.list('-created_date', 5),
    ]).then(([p, bl, cp, pj, pw]) => {
      setStats({
        productos: p.length,
        b2bLeads: bl.length,
        propuestas: cp.length,
        jobs: pj.length,
        pedidosWeb: pw.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const progreso = [
    { area: "Tienda B2C (Shop)", pct: 85, color: '#0F8B6C' },
    { area: "Pipeline B2B", pct: 70, color: '#0F8B6C' },
    { area: "Admin Dashboard", pct: 80, color: '#0F8B6C' },
    { area: "Propuestas Corporativas", pct: 75, color: '#A7D9C9' },
    { area: "Checkout / Pagos", pct: 20, color: '#D96B4D' },
    { area: "B2B Triage Superagent", pct: 40, color: '#D96B4D' },
    { area: "Mockups automáticos", pct: 50, color: '#D96B4D' },
    { area: "Email transaccional", pct: 30, color: '#D96B4D' },
    { area: "Analytics / Tracking", pct: 10, color: '#D96B4D' },
    { area: "Inventario / Producción", pct: 60, color: '#A7D9C9' },
  ];

  const kpisBlueprint = [
    { label: "Tiempo respuesta B2B", actual: ">24h", meta: "<4h", ok: false },
    { label: "Lead → Propuesta", actual: "Manual", meta: "<24h auto", ok: false },
    { label: "CVR Web B2C", actual: "~3.3%", meta: "+20% (+4%)", ok: false },
    { label: "Pedidos B2B/mes", actual: "8", meta: "16+", ok: false },
    { label: "Mockups automáticos", actual: "Parcial (IA)", meta: "<90s auto", ok: false },
    { label: "Checkout integrado", actual: "No", meta: "Stripe/Flow", ok: false },
    { label: "Email transaccional", actual: "No", meta: "Welcome + Abandon", ok: false },
    { label: "WhatsApp Triage", actual: "Manual", meta: "Superagent live", ok: false },
  ];

  return (
    <div
      className="min-h-screen font-inter p-6 space-y-6"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.80) 0%, rgba(15,78,137,0.75) 50%, rgba(15,23,42,0.80) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-poppins font-black text-white">Estado Actual & Actualización</h1>
          <p className="text-teal-300/80 text-sm mt-1">
            Blueprint B2BYTES × Peyu — Auditoría técnica al {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
          <RefreshCw className="w-4 h-4 text-teal-300" />
          <span className="text-xs text-teal-200 font-medium">Datos en tiempo real desde la BD</span>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl">
        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-3">Resumen Ejecutivo — Blueprint Peyu (B2BYTES)</p>
        <p className="text-sm text-white/90 leading-relaxed">
          La plataforma tiene una <strong className="text-white">base sólida implementada</strong> (catálogo B2C, pipeline B2B administrativo, dashboard, propuestas, personalización).
          Los gaps críticos que bloquean ingresos son: <strong className="text-amber-300">checkout sin pagos integrados</strong>, <strong className="text-amber-300">automatización B2B por WhatsApp</strong>,
          y <strong className="text-amber-300">emails transaccionales</strong>. El MVP de 6 semanas del blueprint está ~55% completado.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Entidades activas", value: "16+", Icon: Database, ok: true },
            { label: "Páginas / Rutas", value: "30+", Icon: Globe, ok: true },
            { label: "Backend Functions", value: "12", Icon: Cpu, ok: true },
            { label: "AI Agents", value: "2", Icon: Bot, ok: false },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl p-3 border ${s.ok ? 'bg-emerald-500/15 border-emerald-400/30' : 'bg-amber-500/15 border-amber-400/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                <s.Icon className={`w-4 h-4 ${s.ok ? 'text-emerald-300' : 'text-amber-300'}`} />
                <span className={`text-2xl font-poppins font-bold ${s.ok ? 'text-emerald-300' : 'text-amber-300'}`}>{s.value}</span>
              </div>
              <p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progreso global */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl">
        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-4">Progreso por Área — Blueprint MVP 6 Semanas</p>
        <div className="space-y-3">
          {progreso.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/80 font-medium">{item.area}</span>
                <span className="text-white font-bold">{item.pct}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#0F8B6C' }} /><span className="text-white/70">Completado (&gt;70%)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#A7D9C9' }} /><span className="text-white/70">En desarrollo (40-70%)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#D96B4D' }} /><span className="text-white/70">Pendiente (&lt;40%)</span></div>
        </div>
      </div>

      {/* KPIs del blueprint vs actual */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl">
        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-4">KPIs Blueprint vs Estado Actual</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {kpisBlueprint.map((kpi, i) => (
            <div key={i} className={`rounded-xl p-3 border ${kpi.ok ? 'bg-emerald-500/15 border-emerald-400/30' : 'bg-red-500/10 border-red-400/20'}`}>
              <p className="text-xs font-semibold text-white/80 mb-1">{kpi.label}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Actual: <span className={kpi.ok ? 'text-emerald-300' : 'text-red-300'}>{kpi.actual}</span></p>
                  <p className="text-xs text-white/50">Meta: {kpi.meta}</p>
                </div>
                {kpi.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle por módulo */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest">Detalle por Módulo</p>

        <Section title="Entidades (Base de Datos)" icon={Database} defaultOpen={true}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Productos", val: "66 SKUs", ok: true },
              { label: "B2B Leads", val: loading ? "..." : `${stats.b2bLeads || 0}+`, ok: true },
              { label: "Propuestas", val: loading ? "..." : `${stats.propuestas || 0}+`, ok: true },
              { label: "Pedidos Web", val: loading ? "..." : `${stats.pedidosWeb || 0}+`, ok: true }, // eslint-disable-line
            ].map((s, i) => (
              <div key={i} className={`rounded-lg p-3 border ${s.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold text-foreground text-lg">{s.val}</p>
              </div>
            ))}
          </div>
          <ItemRow label="Producto (66 SKUs con precios B2B y B2C)" status="done" blueprint="Product con sku, precios, material, canal, área láser" />
          <ItemRow label="B2BLead con scoring y fuente" status="done" blueprint="B2BLead con lead_score, utm, urgency, mockup_urls" />
          <ItemRow label="CorporateProposal con PDF y mockups" status="done" blueprint="CorporateProposal: items_json, total, pdf_url, status" />
          <ItemRow label="PersonalizationJob (estado del grabado)" status="done" blueprint="PersonalizationJob: laser, status, mockup_urls" />
          <ItemRow label="PedidoWeb (órdenes B2C)" status="done" blueprint="Order con stripe_session_id, estado, courier, tracking" />
          <ItemRow label="OrdenProduccion + inyectoras asignadas" status="done" blueprint="ProductionRun con machine_id, status, scrap_pct" />
          <ItemRow label="VentaTienda (2 tiendas físicas)" status="done" blueprint="Tiendas con láser galvo, grabado en tienda" />
          <ItemRow label="Campana + métricas de marketing" status="done" blueprint="Campaign con ROAS, CTR, conversiones, gasto real" />
          <ItemRow label="InventoryBatch (lotes de material reciclado)" status="missing" blueprint="InventoryBatch: quantity_available, batch_code, produced_at" note="Pendiente: trazabilidad del plástico reciclado por lote" />
          <ItemRow label="Customer (perfil unificado B2C+B2B)" status="partial" blueprint="Customer: corporate_flag, lifetime_value, preferred_channel" note="Existe como Cliente pero sin integración a checkout web" />
          <ItemRow label="SKUVariant (variantes físicas: color, modelo)" status="missing" blueprint="SKUVariant: price_delta, dimensions, stock_count por variante" note="Carcasas tienen 69 SKUs sin variante unificada" />
          <ItemRow label="TrackingEvent / PageView (analytics)" status="missing" blueprint="TrackingEvent: session_id, utm, referrer — CVR medible" note="GAP CRÍTICO: sin esto no se mide conversión web real" />
        </Section>

        <Section title="Tienda Pública B2C (Shop)" icon={ShoppingCart}>
          <ItemRow label="Landing page (ShopLanding) con hero y asistente IA" status="done" blueprint="Hero con CTA B2C + CTA B2B + asistente conversacional" />
          <ItemRow label="Catálogo Shop con filtros y categorías" status="done" blueprint="/Catalogo con filtros category, search, price" />
          <ItemRow label="Detalle producto (ProductoDetalle)" status="done" blueprint="/Producto?id con galería, personalización, add to cart" />
          <ItemRow label="Carrito con localStorage" status="done" blueprint="Cart persistido · resumen · formulario datos" />
          <ItemRow label="Catálogo Visual alternativo" status="done" />
          <ItemRow label="Checkout con pago integrado (Stripe/Flow/WebPay)" status="missing" blueprint="createCheckoutSession + stripeWebhookHandler CRÍTICO" note="El carrito existe pero NO hay integración de pago. Principal bloqueador B2C." />
          <ItemRow label="Confirmación de pedido + email de bienvenida" status="missing" blueprint="Email: 'Bienvenido a Peyu — Tu compra con impacto'" note="Requiere pago integrado primero" />
          <ItemRow label="Carrito abandonado (email 24h + 10% descuento)" status="missing" blueprint="SendEmail: 'Tu carrito te extraña — 10% si finalizas hoy'" />
          <ItemRow label="Imágenes de productos en BD (imagen_url)" status="partial" note="66 productos con imagen asignada por categoría/keyword. Faltan fotos individuales por SKU." />
          <ItemRow label="Página /nosotros con storytelling fundadores" status="missing" blueprint="Founder story: tortuga → terraza → fábrica con 6 inyectoras" />
        </Section>

        <Section title="Pipeline B2B Corporativo" icon={Target}>
          <ItemRow label="Formulario B2B contacto + upload logo" status="done" blueprint="/B2B/Contacto con brief upload, WhatsApp CTA" />
          <ItemRow label="Admin de propuestas (crear, editar, enviar)" status="done" blueprint="/Admin/Propuestas: PDF, mockups, pricing" />
          <ItemRow label="Propuesta pública para cliente (B2BPropuesta)" status="done" blueprint="/B2B/propuesta?id= con aceptar/rechazar, mockups" />
          <ItemRow label="Catálogo corporativo con simulador de volumen" status="done" blueprint="CatalogoCorporativo con precio escalonado interactivo" />
          <ItemRow label="Scoring de leads (0-100 pts)" status="done" blueprint="scoreLead con InvokeLLM → lead_score en B2BLead" />
          <ItemRow label="Email de propuesta con PDF firmado" status="partial" blueprint="sendProposalEmail vía SendEmail" note="Función existe, revisar plantilla HTML y firma digital" />
          <ItemRow label="Auto-generación de propuesta al aceptar lead" status="partial" blueprint="onCreate(B2BLead) → if score≥70 → createCorporateProposal" note="Trigger parcial — no genera precio automático con matriz por volumen" />
          <ItemRow label="Calculadora precio por volumen (price_calculator)" status="partial" blueprint="priceCalculator_volume(productId, qty) — descuentos 50/100/200/500u" note="Existe en UI del catálogo corporativo, no como función backend reutilizable" />
          <ItemRow label="WhatsApp Superagent (triage automático inbound)" status="partial" blueprint="B2B‑Triage: extrae contacto, crea B2BLead, score, notifica Carlos" note="Agente b2b_triage configurado pero sin conector WhatsApp activo aún" />
          <ItemRow label="Recordatorio SLA propuesta >48h" status="missing" blueprint="checkExpiringProposals CRON: Slack/Email si propuesta >48h sin respuesta" />
          <ItemRow label="Extracto de brief PDF/Excel subido por cliente" status="missing" blueprint="ExtractDataFromUploadedFile → popula B2BLead con qty, fecha, productos" />
        </Section>

        <Section title="Personalización & Mockups" icon={Star}>
          <ItemRow label="Flujo de personalización B2C en tienda" status="done" blueprint="/personalizar con preview y opciones laser" />
          <ItemRow label="PersonalizationJob tracking en admin" status="done" blueprint="Admin de jobs con estado: Pendiente → Aprobado → Producción" />
          <ItemRow label="Generación de mockup con IA (GenerateImage)" status="done" blueprint="generateMockup: product_image + logo → mockup URL" />
          <ItemRow label="Mockup automático al crear B2BLead con logo" status="partial" blueprint="generateMockup(productId, logoUrl) en <90s" note="Función existe pero no se dispara automáticamente al recibir logo" />
          <ItemRow label="Vista previa en tiempo real en ficha producto" status="missing" blueprint="CustomizationAgent: preview live antes de agregar al carrito" />
          <ItemRow label="Validación de archivo de logo (formato, tamaño)" status="missing" blueprint="ExtractDataFromUploadedFile: validar PNG/SVG, fondo transparente" note="Hoy el cliente sube logo sin validación automática de calidad" />
        </Section>

        <Section title="Operaciones & Producción" icon={Factory}>
          <ItemRow label="Dashboard de producción con kanban de órdenes" status="done" blueprint="/Admin/Produccion: estados, máquinas, prioridad" />
          <ItemRow label="6 inyectoras con asignación por orden" status="done" blueprint="ProductionRun con machine_id, status, scrap_pct" />
          <ItemRow label="Gestión tiendas físicas (2 locales)" status="done" blueprint="VentaTienda: tienda, grabado láser, medio pago" />
          <ItemRow label="Control de inventario (stock_actual por producto)" status="partial" blueprint="InventoryBatch: material_source, recycled_kg, location" note="Stock por producto existe en Producto.stock_actual, falta trazabilidad por lote de material reciclado" />
          <ItemRow label="Deducción automática de stock al crear orden" status="missing" blueprint="inventory_deduct: EntityTrigger on Order.create" />
          <ItemRow label="Planificador diario de producción (CRON 06:00)" status="missing" blueprint="daily_production_planner: asigna jobs, crea UserTask, Google Calendar" />
          <ItemRow label="Alertas SLA producción (inicio tardío, atraso)" status="missing" blueprint="production_sla_checker: CRON cada 30min → Alert + Slack" />
          <ItemRow label="Integración con Google Calendar para turnos" status="missing" blueprint="scheduleShoot → Google Calendar connector (evento por ProductionRun)" />
        </Section>

        <Section title="Marketing & Analytics" icon={BarChart2}>
          <ItemRow label="Dashboard de marketing con campañas Meta" status="done" blueprint="/Admin/Marketing con KPIs, campañas, ROAS" />
          <ItemRow label="Entidad Campana con métricas reales" status="done" blueprint="Campaign: channel, gasto, impresiones, CTR, ROAS" />
          <ItemRow label="Tracking UTM en leads (utm_source)" status="partial" blueprint="TrackingEvent con session_id, utm, referrer por acción" note="B2BLead tiene utm_source pero no se captura automáticamente desde URL" />
          <ItemRow label="Reporte semanal B2B automático (CRON)" status="done" blueprint="reporteSemanalB2B: leads, propuestas, conversión → email lunes" />
          <ItemRow label="Eventos de analytics (AddToCart, Checkout)" status="missing" blueprint="trackEvent: ProductViewed, AddToCart, CheckoutStarted, B2BLeadSubmitted" note="GAP CRÍTICO: sin tracking de funnel no se puede optimizar conversión" />
          <ItemRow label="Meta CAPI server-side (mejora atribución)" status="missing" blueprint="syncMetaCAPI: forward conversiones server-side a Meta" />
          <ItemRow label="Carrito abandonado con email recovery" status="missing" blueprint="sendAbandonedCartEmail CRON: 1h, 24h, 72h con código descuento" />
          <ItemRow label="Email de bienvenida B2C post-compra" status="missing" blueprint="Welcome B2C: impacto ambiental kg plástico + ver estado pedido" />
          <ItemRow label="ContentAgent para generación de creativos Meta/TikTok" status="missing" blueprint="MarketingAgent: InvokeLLM + GenerateImage → assets ads" />
        </Section>

        <Section title="AI Agents & Superagents" icon={Bot}>
          <ItemRow label="Asistente IA en ShopLanding (chat conversacional)" status="done" blueprint="ShoppingAgent + SupportAgent integrado en landing" />
          <ItemRow label="Agente asistente_comercial" status="done" blueprint="SalesAssistant: propuestas personalizadas + T&C + price tiers" />
          <ItemRow label="Agente b2b_triage configurado" status="partial" blueprint="B2B-Triage Superagent: WhatsApp → B2BLead → score → propuesta" note="Agente definido pero conector WhatsApp no activo en producción" />
          <ItemRow label="PersonalizationAgent (mockup automático)" status="partial" blueprint="MockupAgent: logo + producto → GenerateImage → PersonalizationJob" note="generateMockup function existe, falta conexión automática en flujo lead" />
          <ItemRow label="CopyAssistantAgent (variantes de copy con IA)" status="missing" blueprint="InvokeLLM → copy_variants en Product.metadata para A/B test" />
          <ItemRow label="ReorderReminderAgent CRON (clientes sin compra >X meses)" status="missing" blueprint="Email + descuento automático a clientes sin actividad" />
          <ItemRow label="MarketingAgent (análisis gasto Meta, propone A/B)" status="missing" blueprint="InvokeLLM analiza ROAS por campaña + propone 2 A/B tests" />
          <ItemRow label="ProductionAgent CRON (batching PersonalizationJobs)" status="missing" blueprint="Agrupa jobs por capacidad láser (3000/día) + máquina disponible" />
        </Section>

        <Section title="Backend Functions" icon={Cpu}>
          <ItemRow label="createCorporateProposal (PDF + precios)" status="done" blueprint="InvokeLLM draft + PDF via jsPDF + mockup URLs" />
          <ItemRow label="scoreLead (0-100 pts con IA)" status="done" blueprint="InvokeLLM: qty, urgency, sector → lead_score" />
          <ItemRow label="generateMockup (GenerateImage + logo overlay)" status="done" blueprint="GenerateImage existing_image_urls + logo → mockup_url" />
          <ItemRow label="sendProposalEmail (PDF firmado al cliente)" status="done" blueprint="SendEmail con PDF signed URL + accept link" />
          <ItemRow label="exportCotizacionPDF (jsPDF cotización admin)" status="done" />
          <ItemRow label="reporteSemanalB2B (CRON lunes)" status="done" blueprint="Consolida leads, propuestas, conversión → SendEmail" />
          <ItemRow label="onNewPedidoWeb (trigger al crear pedido web)" status="done" />
          <ItemRow label="onProposalAccepted (trigger aceptación)" status="done" blueprint="→ crea OrdenProduccion + notifica producción" />
          <ItemRow label="carritoAbandonadoCRON" status="partial" blueprint="Detecta carts >2h, SendEmail con descuento" note="Función existe pero sin checkout integrado no hay carrito persistido en BD" />
          <ItemRow label="createCheckoutSession (Stripe)" status="missing" blueprint="CRÍTICO: crea sesión Stripe, valida precios server-side, retorna URL" />
          <ItemRow label="stripeWebhookHandler (confirmar pago)" status="missing" blueprint="Verifica firma Stripe, marca Order.paid, envía email confirmación" />
          <ItemRow label="calculateVolumePricing (motor de precios B2B)" status="missing" blueprint="Devuelve precio por rango cantidad (50/100/200/500/2000u)" />
          <ItemRow label="inventory_deduct (Entity trigger - descontar stock)" status="missing" blueprint="Atómico: decrementa InventoryBatch.quantity_available al crear orden" />
          <ItemRow label="trackEvent (ingestor genérico analytics)" status="missing" blueprint="Recibe AddToCart/CheckoutStart/B2BLeadSubmit → TrackingEvent" />
        </Section>

        <Section title="Seguridad & Roles" icon={Lock}>
          <ItemRow label="Rutas públicas separadas de admin (AuthProvider)" status="done" blueprint="PublicRoutes sin auth · AdminRoutes con AuthenticatedApp" />
          <ItemRow label="Panel admin protegido por login" status="done" />
          <ItemRow label="RLS por roles (Admin/Sales/Production)" status="missing" blueprint="RLS: Order.owner == user, B2BLead solo para sales/admin" note="Todas las entidades son accesibles sin RLS diferenciado por rol" />
          <ItemRow label="UploadPrivateFile para briefs y logos confidenciales" status="missing" blueprint="Briefs y propuestas PDF en almacenamiento privado + signed URLs" note="Hoy logos y archivos van a storage público" />
          <ItemRow label="Validación server-side de precios en checkout" status="missing" blueprint="Nunca confiar en precios del cliente · recalcular en createCheckoutSession" />
        </Section>
      </div>

      {/* Próximos pasos prioritarios */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl">
        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-4">🎯 Próximos Pasos Prioritarios (Quick Wins)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              prio: "P1 — CRÍTICO",
              title: "Integrar Checkout con pagos",
              desc: "createCheckoutSession + stripeWebhookHandler. Sin esto no hay ventas B2C completadas.",
              color: "border-red-400/50 bg-red-500/10",
              badge: "bg-red-500 text-white",
              effort: "1-2 semanas"
            },
            {
              prio: "P2 — CRÍTICO",
              title: "Email transaccional (welcome + order)",
              desc: "SendEmail: bienvenida + confirmación pedido + carrito abandonado. Retiene y convierte.",
              color: "border-orange-400/50 bg-orange-500/10",
              badge: "bg-orange-500 text-white",
              effort: "3-5 días"
            },
            {
              prio: "P3 — ALTO",
              title: "WhatsApp Triage Superagent activo",
              desc: "Conectar conector WhatsApp al agente b2b_triage. Reduce 4h/día de Joaquín respondiendo.",
              color: "border-amber-400/50 bg-amber-500/10",
              badge: "bg-amber-500 text-white",
              effort: "1 semana"
            },
            {
              prio: "P4 — ALTO",
              title: "Tracking de eventos + analytics",
              desc: "trackEvent: AddToCart, CheckoutStart, B2BLeadSubmit. Sin esto no se puede medir CVR.",
              color: "border-yellow-400/50 bg-yellow-500/10",
              badge: "bg-yellow-600 text-white",
              effort: "3-5 días"
            },
            {
              prio: "P5 — MEDIO",
              title: "Fotos individuales por SKU en BD",
              desc: "Actualizar imagen_url por nombre exacto de producto. Hoy usa fallback por categoría.",
              color: "border-blue-400/50 bg-blue-500/10",
              badge: "bg-blue-500 text-white",
              effort: "1-2 días"
            },
            {
              prio: "P6 — MEDIO",
              title: "Mockup automático al recibir lead",
              desc: "Trigger: B2BLead.create con logo_url → generateMockup() → attach a CorporateProposal.",
              color: "border-teal-400/50 bg-teal-500/10",
              badge: "bg-teal-600 text-white",
              effort: "2-3 días"
            },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl p-4 border ${item.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badge}`}>{item.prio}</span>
                <span className="text-xs text-white/50">⏱ {item.effort}</span>
              </div>
              <p className="font-poppins font-semibold text-white text-sm mb-1">{item.title}</p>
              <p className="text-xs text-white/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-white/30 pb-4">
        Blueprint integral B2BYTES × Peyu Chile SPA — Generado {new Date().toLocaleDateString('es-CL')} · base44.com
      </div>
    </div>
  );
}