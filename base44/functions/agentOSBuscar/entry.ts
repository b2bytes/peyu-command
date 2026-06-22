import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// agentOSBuscar · Búsqueda universal de registros para el Agente OS.
// ----------------------------------------------------------------------------
// El founder pide "tráeme a Jaime", "busca cot-2606-jaym", "el pedido 1042",
// "Hilti" — y el agente debe encontrar el registro EXACTO sin errores, aunque
// dé un nombre parcial, un email, un RUT, un teléfono o un número/código.
//
// Busca en paralelo sobre Cliente, PedidoWeb, B2BLead, Cotizacion y
// CorporateProposal, normalizando texto (sin tildes/espacios/guiones) para que
// "cot-2606-jaym" matchee aunque esté guardado distinto. Devuelve resultados
// agrupados por tipo, ya enriquecidos para hidratar las tarjetas del chat.
//
// Payload: { query }  → texto libre del founder.
// Devuelve: { ok, query, total, clientes[], pedidos[], leads[], cotizaciones[],
//             propuestas[] }
// ============================================================================

// Normaliza para matching robusto: minúsculas, sin tildes, sin espacios ni
// signos. Así "COT-2606-JAYM", "cot 2606 jaym" y "cot2606jaym" son iguales.
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[\s\-_./]+/g, '');
// Versión que conserva separación por palabras (para match por término suelto).
const normSoft = (s) => (s || '').toString().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').trim();

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query = '' } = await req.json().catch(() => ({}));
    const raw = query.trim();
    if (raw.length < 2) {
      return Response.json({ ok: true, query: raw, total: 0, clientes: [], pedidos: [], leads: [], cotizaciones: [], propuestas: [] });
    }

    const qNorm = norm(raw);
    // Términos sueltos (>=2 chars) para match parcial por palabra.
    const terms = normSoft(raw).split(/[\s\-_./]+/).filter((t) => t.length >= 2);
    // Un campo matchea si: su versión normalizada incluye la query completa
    // normalizada, O incluye alguno de los términos sueltos.
    const hit = (...fields) => {
      const blobNorm = norm(fields.join(' '));
      const blobSoft = normSoft(fields.join(' '));
      if (qNorm.length >= 3 && blobNorm.includes(qNorm)) return true;
      return terms.length > 0 && terms.every((t) => blobSoft.includes(t) || blobNorm.includes(t));
    };

    // Cargamos un universo amplio en paralelo (no solo 12) para poder encontrar
    // cualquier registro puntual.
    const [clientes, pedidos, leads, cotizaciones, propuestas] = await Promise.all([
      base44.asServiceRole.entities.Cliente.list('-created_date', 600).catch(() => []),
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 600).catch(() => []),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 400).catch(() => []),
      base44.asServiceRole.entities.Cotizacion.list('-created_date', 400).catch(() => []),
      base44.asServiceRole.entities.CorporateProposal.list('-created_date', 400).catch(() => []),
    ]);

    // Índice de pedidos por email para enriquecer la vCard del cliente.
    const pedidosPorEmail = {};
    for (const p of pedidos) {
      const em = (p.cliente_email || '').toLowerCase().trim();
      if (!em) continue;
      (pedidosPorEmail[em] = pedidosPorEmail[em] || []).push(p);
    }

    const clientesHit = clientes
      .filter((c) => hit(c.empresa, c.contacto, c.email, c.telefono, c.rut, c.id, c.sku_favorito, c.notas))
      .slice(0, 12)
      .map((c) => {
        const ps = pedidosPorEmail[(c.email || '').toLowerCase().trim()] || [];
        const validos = ps.filter((p) => !['Cancelado', 'Reembolsado'].includes(p.estado));
        const totalReal = validos.reduce((s, p) => s + (p.total || 0), 0);
        const ult = ps[0];
        const numPedidos = Math.max(c.num_pedidos || 0, validos.length);
        const totalCompras = Math.max(c.total_compras_clp || 0, totalReal);
        return {
          id: c.id, empresa: c.empresa, contacto: c.contacto, email: c.email,
          telefono: c.telefono, rut: c.rut, tipo: c.tipo, estado: c.estado,
          total_compras_clp: totalCompras, num_pedidos: numPedidos,
          ticket_promedio: c.ticket_promedio || (numPedidos ? Math.round(totalCompras / numPedidos) : null),
          nps_score: c.nps_score, sku_favorito: c.sku_favorito, canal_preferido: c.canal_preferido,
          pagos_al_dia: c.pagos_al_dia, fecha_ultima_compra: c.fecha_ultima_compra,
          notas: c.notas, created_date: c.created_date,
          ultimo_pedido: ult ? { id: ult.id, numero: ult.numero_pedido, estado: ult.estado, total: ult.total, items: (ult.descripcion_items || '').slice(0, 80) } : null,
        };
      });

    const pedidosHit = pedidos
      .filter((p) => hit(p.numero_pedido, p.cliente_nombre, p.cliente_email, p.cliente_telefono, p.id, p.razon_social, p.rut_empresa, p.sku))
      .slice(0, 12)
      .map((p) => ({
        id: p.id, numero_pedido: p.numero_pedido, cliente_nombre: p.cliente_nombre,
        cliente_email: p.cliente_email, total: p.total, estado: p.estado,
        medio_pago: p.medio_pago, tracking: p.tracking, ciudad: p.ciudad,
        payment_status: p.payment_status || '', fecha: p.fecha || (p.created_date || '').slice(0, 10),
        created_date: p.created_date, updated_date: p.updated_date,
      }));

    const leadsHit = leads
      .filter((l) => hit(l.company_name, l.contact_name, l.email, l.phone, l.rut, l.id, l.product_interest))
      .slice(0, 12)
      .map((l) => ({
        id: l.id, company_name: l.company_name, contact_name: l.contact_name,
        email: l.email, phone: l.phone, lead_score: l.lead_score, status: l.status,
        product_interest: l.product_interest, qty_estimate: l.qty_estimate,
        created_date: l.created_date, updated_date: l.updated_date, source: l.source,
      }));

    const cotizacionesHit = cotizaciones
      .filter((c) => hit(c.numero, c.empresa, c.contacto, c.email, c.sku, c.id))
      .slice(0, 12)
      .map((c) => ({
        id: c.id, numero: c.numero, empresa: c.empresa, contacto: c.contacto,
        email: c.email, sku: c.sku, cantidad: c.cantidad, total: c.total,
        estado: c.estado, created_date: c.created_date,
      }));

    const propuestasHit = propuestas
      .filter((p) => hit(p.numero, p.empresa, p.contacto, p.email, p.id))
      .slice(0, 12)
      .map((p) => ({
        id: p.id, numero: p.numero, empresa: p.empresa, contacto: p.contacto,
        email: p.email, total: p.total, status: p.status,
        created_date: p.created_date, fecha_envio: p.fecha_envio, fecha_vencimiento: p.fecha_vencimiento,
      }));

    const total = clientesHit.length + pedidosHit.length + leadsHit.length + cotizacionesHit.length + propuestasHit.length;

    // Resumen textual conciso para que el agente nombre lo encontrado sin inventar.
    const resumen = [];
    if (clientesHit.length) resumen.push(`Clientes (${clientesHit.length}):\n${clientesHit.map((c) => `• [cliente_id:${c.id}] ${c.contacto || c.empresa || 'Sin nombre'}${c.empresa && c.contacto ? ` (${c.empresa})` : ''} · ${c.email || 'sin email'} · ${c.telefono || 'sin tel'} · ${fmtCLP(c.total_compras_clp)} en ${c.num_pedidos || 0} pedidos`).join('\n')}`);
    if (pedidosHit.length) resumen.push(`Pedidos (${pedidosHit.length}):\n${pedidosHit.map((p) => `• [id:${p.id}] ${p.numero_pedido || p.id?.slice(-6)} · ${p.cliente_nombre} · ${fmtCLP(p.total)} · ${p.estado}`).join('\n')}`);
    if (leadsHit.length) resumen.push(`Leads B2B (${leadsHit.length}):\n${leadsHit.map((l) => `• [id:${l.id}] ${l.company_name} · ${l.contact_name || 's/contacto'} · ${l.email || 'sin email'} · ${l.phone || 'sin tel'} · score ${l.lead_score || 0} · ${l.status}`).join('\n')}`);
    if (cotizacionesHit.length) resumen.push(`Cotizaciones (${cotizacionesHit.length}):\n${cotizacionesHit.map((c) => `• [id:${c.id}] ${c.numero || c.id?.slice(-6)} · ${c.empresa} · ${c.sku || ''} ${c.cantidad || ''}u · ${fmtCLP(c.total)} · ${c.estado}`).join('\n')}`);
    if (propuestasHit.length) resumen.push(`Propuestas (${propuestasHit.length}):\n${propuestasHit.map((p) => `• [id:${p.id}] ${p.numero || p.id?.slice(-6)} · ${p.empresa} · ${fmtCLP(p.total)} · ${p.status}`).join('\n')}`);

    return Response.json({
      ok: true, query: raw, total,
      clientes: clientesHit, pedidos: pedidosHit, leads: leadsHit,
      cotizaciones: cotizacionesHit, propuestas: propuestasHit,
      resumen: resumen.join('\n\n') || 'Sin coincidencias.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});