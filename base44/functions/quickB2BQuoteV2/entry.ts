import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// quickB2BQuoteV2 — Cotización rápida por volumen para clientes corporativos,
// desde la plataforma nueva (Shop v2). ADITIVO: crea (o actualiza) un B2BLead
// con los productos y cantidades solicitadas, calcula el precio por volumen
// usando precio_b2b_tramos del catálogo y devuelve el desglose para mostrar
// al cliente. Idempotente por email. Nunca borra nada. No toca B2C.
// ════════════════════════════════════════════════════════════════════════

const TRAMOS_B2B = [
  { min: 2000, key: 't2000_mas',  label: '2000+ u' },
  { min: 1000, key: 't1000_1999', label: '1000–1999 u' },
  { min: 500,  key: 't500_999',   label: '500–999 u' },
  { min: 250,  key: 't250_499',   label: '250–499 u' },
  { min: 100,  key: 't100_249',   label: '100–249 u' },
  { min: 50,   key: 't50_99',     label: '50–99 u' },
  { min: 10,   key: 't10_49',     label: '10–49 u' },
  { min: 1,    key: 'unitario',   label: '1–9 u' },
];

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

function unitBase(p) {
  return num(p?.precio_unitario_oficial_clp) ?? num(p?.precio_b2c) ?? 0;
}

// Precio unitario B2B para una cantidad (escala por volumen real del catálogo).
function priceForQty(producto, qty) {
  const tramos = producto?.precio_b2b_tramos;
  const base = (tramos && num(tramos.unitario)) || unitBase(producto);
  if (!tramos || typeof tramos !== 'object') {
    return { precio: base, label: '1–9 u', ahorroPct: 0 };
  }
  const idx = TRAMOS_B2B.findIndex((t) => qty >= t.min);
  if (idx < 0) return { precio: base, label: '1–9 u', ahorroPct: 0 };
  for (let i = idx; i < TRAMOS_B2B.length; i++) {
    const precio = num(tramos[TRAMOS_B2B[i].key]);
    if (precio) {
      const ahorroPct = base ? Math.round((1 - precio / base) * 100) : 0;
      return { precio, label: TRAMOS_B2B[i].label, ahorroPct };
    }
  }
  return { precio: base, label: '1–9 u', ahorroPct: 0 };
}

function scoreLead(company, qtyTotal) {
  let s = 50;
  if (company) s += 20;
  if (qtyTotal >= 100) s += 25;
  else if (qtyTotal >= 10) s += 15;
  return Math.min(s, 100);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const contact_name = (body.contact_name || '').toString().slice(0, 200).trim();
    const company_name = (body.company_name || '').toString().slice(0, 200).trim();
    const email = (body.email || '').toString().slice(0, 200).trim();
    const phone = (body.phone || '').toString().slice(0, 60).trim() || undefined;
    const delivery_date = (body.delivery_date || '').toString().slice(0, 60) || undefined;
    const personalization_needs = !!body.personalization_needs;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!contact_name || !company_name || !email) {
      return Response.json({ error: 'Faltan datos: nombre, empresa y email son obligatorios.' }, { status: 400 });
    }
    if (!items.length) {
      return Response.json({ error: 'Agrega al menos un producto a cotizar.' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // ─── Resolver precios reales por volumen desde el catálogo ───
    const lineas = [];
    let totalNeto = 0;
    let qtyTotal = 0;

    for (const it of items) {
      const sku = (it.sku || '').toString();
      const qty = Math.max(1, Math.floor(Number(it.qty) || 0));
      if (!sku || qty < 1) continue;

      let producto = null;
      try {
        const found = await svc.entities.Producto.filter({ sku }, '-updated_date', 1);
        producto = found && found[0];
      } catch { /* noop */ }
      if (!producto) continue;

      const { precio, label, ahorroPct } = priceForQty(producto, qty);
      const subtotal = precio * qty;
      totalNeto += subtotal;
      qtyTotal += qty;

      lineas.push({
        sku,
        nombre: producto.nombre,
        cantidad: qty,
        precio_unitario: precio,
        tramo: label,
        ahorro_pct: ahorroPct,
        subtotal,
      });
    }

    if (!lineas.length) {
      return Response.json({ error: 'No se encontraron productos válidos para cotizar.' }, { status: 400 });
    }

    const iva = Math.round(totalNeto * 0.19);
    const totalConIva = totalNeto + iva;
    const lead_score = scoreLead(company_name, qtyTotal);
    const nowIso = new Date().toISOString();

    const resumenItems = lineas
      .map((l) => `${l.cantidad}× ${l.nombre} @ $${l.precio_unitario.toLocaleString('es-CL')} (${l.tramo})`)
      .join(' · ');
    const notes = `Cotización rápida por volumen desde plataforma nueva (Shop v2). ` +
      `${resumenItems}. Total neto: $${totalNeto.toLocaleString('es-CL')} (sin IVA). ` +
      `Fecha requerida: ${delivery_date || 'N/D'}.`;

    const histEntry = {
      at: nowIso,
      type: 'created',
      actor: contact_name || email,
      channel: 'web',
      detail: 'Cotización rápida por volumen (Shop v2)',
      meta: { lead_score, qty_total: qtyTotal, total_neto: totalNeto },
    };

    // ─── IDEMPOTENCIA: B2BLead previo por email ───
    let existing = null;
    try {
      const found = await svc.entities.B2BLead.filter({ email }, '-created_date', 5);
      existing = (found || []).find((l) => (l.notes || '').includes('Shop v2')) || (found || [])[0] || null;
    } catch { /* noop */ }

    let leadId;
    const productInterest = lineas.map((l) => l.nombre).slice(0, 3).join(', ').slice(0, 200);

    if (existing) {
      const prevHist = Array.isArray(existing.historial) ? existing.historial : [];
      const updated = await svc.entities.B2BLead.update(existing.id, {
        contact_name,
        company_name,
        phone: phone ?? existing.phone,
        qty_estimate: qtyTotal,
        product_interest: productInterest || existing.product_interest,
        delivery_date: delivery_date ?? existing.delivery_date,
        personalization_needs,
        lead_score,
        notes,
        historial: [...prevHist, { ...histEntry, type: 'note', detail: 'Re-cotización rápida (Shop v2)' }],
      });
      leadId = updated?.id || existing.id;
    } else {
      const created = await svc.entities.B2BLead.create({
        source: 'Formulario Web',
        contact_name,
        company_name,
        email,
        phone,
        qty_estimate: qtyTotal,
        product_interest: productInterest,
        delivery_date,
        personalization_needs,
        lead_score,
        status: 'Nuevo',
        urgency: 'Normal',
        notes,
        historial: [histEntry],
      });
      leadId = created?.id;
    }

    return Response.json({
      ok: true,
      lead_id: leadId,
      lead_score,
      lineas,
      qty_total: qtyTotal,
      total_neto: totalNeto,
      iva,
      total_con_iva: totalConIva,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});