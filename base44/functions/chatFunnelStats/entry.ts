// ============================================================================
// chatFunnelStats — Funnel real del chat Peyu → compra
// ----------------------------------------------------------------------------
// Cruza ChatLead × CarritoAbandonado × PedidoWeb por email/teléfono para
// responder: "¿el chat lleva a la compra final?"
//
// Solo admin. Devuelve métricas agregadas + lista de conversaciones que SÍ
// terminaron en venta (para que se puedan ver casos concretos).
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DAYS_DEFAULT = 7;

function normEmail(s) {
  return s ? String(s).trim().toLowerCase() : null;
}
function normPhone(s) {
  if (!s) return null;
  return String(s).replace(/[^0-9]/g, '').slice(-9); // últimos 9 dígitos (estándar CL)
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { days } = await req.json().catch(() => ({}));
    const sinceDays = Number(days) > 0 ? Number(days) : DAYS_DEFAULT;
    const sinceDate = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);
    const sinceIso = sinceDate.toISOString();

    // 1. Cargar datos del período (admin/service role)
    const [chatLeads, carritos, pedidos] = await Promise.all([
      base44.asServiceRole.entities.ChatLead.list('-created_date', 500),
      base44.asServiceRole.entities.CarritoAbandonado.list('-created_date', 500),
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500),
    ]);

    // 2. Filtrar al período
    const leadsPeriodo = chatLeads.filter(l => new Date(l.created_date) >= sinceDate);
    const carritosPeriodo = carritos.filter(c => new Date(c.created_date) >= sinceDate);
    const pedidosPeriodo = pedidos.filter(p => new Date(p.created_date) >= sinceDate);

    // 3. Construir índices de carritos/pedidos por email y teléfono
    const carritoByEmail = new Map();
    const carritoByPhone = new Map();
    for (const c of carritosPeriodo) {
      const em = normEmail(c.email);
      const ph = normPhone(c.telefono);
      if (em) carritoByEmail.set(em, c);
      if (ph) carritoByPhone.set(ph, c);
    }
    const pedidoByEmail = new Map();
    const pedidoByPhone = new Map();
    for (const p of pedidosPeriodo) {
      const em = normEmail(p.cliente_email);
      const ph = normPhone(p.cliente_telefono);
      if (em) pedidoByEmail.set(em, p);
      if (ph) pedidoByPhone.set(ph, p);
    }

    // 4. Métricas del funnel
    let visitantes_que_abrieron = leadsPeriodo.length;
    let escribieron_mensaje_real = 0;
    let entregaron_dato = 0;
    let llegaron_a_carrito = 0;
    let compraron = 0;
    let revenue_atribuido_clp = 0;

    const conversionesConcretas = []; // casos donde chat → pedido

    for (const lead of leadsPeriodo) {
      // a) Escribió mensaje real (preview no es solo [CONTEXTO])
      const preview = String(lead.ultimo_mensaje_preview || '');
      const isOnlyContext = preview.startsWith('[CONTEXTO]') || !preview.trim();
      if (!isOnlyContext) escribieron_mensaje_real++;

      // b) Entregó algún dato (nombre/email/teléfono/empresa/cantidad)
      const hasData = !!(lead.nombre || lead.email || lead.telefono || lead.empresa || lead.cantidad_estimada);
      if (hasData) entregaron_dato++;

      // c) Cruzar con carrito (por email o teléfono)
      const em = normEmail(lead.email);
      const ph = normPhone(lead.telefono);
      const carrito = (em && carritoByEmail.get(em)) || (ph && carritoByPhone.get(ph));
      if (carrito) llegaron_a_carrito++;

      // d) Cruzar con pedido
      const pedido = (em && pedidoByEmail.get(em)) || (ph && pedidoByPhone.get(ph));
      if (pedido) {
        compraron++;
        revenue_atribuido_clp += Number(pedido.total || 0);
        conversionesConcretas.push({
          chat_lead_id: lead.id,
          conversation_id: lead.conversation_id,
          nombre: lead.nombre || pedido.cliente_nombre,
          email: lead.email || pedido.cliente_email,
          telefono: lead.telefono || pedido.cliente_telefono,
          tipo_chat: lead.tipo,
          mensajes: lead.mensajes_count,
          pedido_id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          pedido_total: pedido.total,
          pedido_estado: pedido.estado,
          pedido_fecha: pedido.fecha,
        });
      }
    }

    // 5. Top productos mencionados en el chat (extraídos de producto_interes)
    const productosInteres = {};
    for (const lead of leadsPeriodo) {
      if (lead.producto_interes_nombre) {
        productosInteres[lead.producto_interes_nombre] = (productosInteres[lead.producto_interes_nombre] || 0) + 1;
      }
    }
    const topProductos = Object.entries(productosInteres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, count]) => ({ nombre, count }));

    // 6. Distribución tipo
    const tipos = { B2C: 0, B2B: 0, Sin_clasificar: 0 };
    for (const lead of leadsPeriodo) {
      if (lead.tipo === 'B2C') tipos.B2C++;
      else if (lead.tipo === 'B2B') tipos.B2B++;
      else tipos.Sin_clasificar++;
    }

    // 7. Tasas
    const rate = (n, d) => d > 0 ? Math.round((n / d) * 1000) / 10 : 0; // 1 decimal

    return Response.json({
      ok: true,
      window_days: sinceDays,
      since: sinceIso,
      funnel: {
        visitantes_que_abrieron,
        escribieron_mensaje_real,
        entregaron_dato,
        llegaron_a_carrito,
        compraron,
      },
      tasas: {
        engagement_pct:   rate(escribieron_mensaje_real, visitantes_que_abrieron),
        captura_pct:      rate(entregaron_dato, visitantes_que_abrieron),
        carrito_pct:      rate(llegaron_a_carrito, visitantes_que_abrieron),
        conversion_pct:   rate(compraron, visitantes_que_abrieron),
        cierre_post_dato: rate(compraron, entregaron_dato),
      },
      revenue_atribuido_clp,
      tipo_distribucion: tipos,
      top_productos_mencionados: topProductos,
      conversiones_concretas: conversionesConcretas,
      diagnostico: {
        chat_activo: visitantes_que_abrieron > 0,
        cliente_engagement: escribieron_mensaje_real > 0,
        captura_datos_funcionando: entregaron_dato > 0,
        chat_lleva_a_compra: compraron > 0,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});