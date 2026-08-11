// ════════════════════════════════════════════════════════════════════════
// getPropuestaPublica — datos mínimos de una cotización para la página
// pública /propuesta?cot=<id>. Pública (el cliente no tiene cuenta), lee con
// service role y devuelve SOLO campos no sensibles + el link del PDF.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { cotizacion_id, numero } = (await req.json().catch(() => ({}))) || {};

  if (!cotizacion_id && !numero) {
    return Response.json({ error: 'Falta el identificador de la propuesta.' }, { status: 400 });
  }

  let cot = null;
  if (cotizacion_id) {
    cot = await base44.asServiceRole.entities.Cotizacion.get(cotizacion_id).catch(() => null);
  }
  if (!cot && numero) {
    const list = await base44.asServiceRole.entities.Cotizacion.filter({ numero }, '-created_date', 1).catch(() => []);
    cot = list?.[0] || null;
  }
  if (!cot) return Response.json({ error: 'No encontramos esa propuesta.' }, { status: 404 });

  // Retrocompatibilidad: propuestas antiguas guardaban el PDF dentro de notas.
  const pdfUrl = cot.pdf_url || (String(cot.notas || '').match(/PDF:\s*(https?:\/\/\S+)/)?.[1] || '');

  const producto = cot.sku
    ? (await base44.asServiceRole.entities.Producto.filter({ sku: cot.sku }, '-created_date', 1).catch(() => []))?.[0]
    : null;

  return Response.json({
    ok: true,
    id: cot.id,
    numero: cot.numero,
    empresa: cot.empresa,
    contacto: cot.contacto,
    sku: cot.sku,
    producto_nombre: producto?.nombre || cot.sku,
    producto_imagen: producto?.imagen_url || '',
    cantidad: cot.cantidad,
    precio_unitario: cot.precio_unitario,
    total: cot.total,
    personalizacion_tipo: cot.personalizacion_tipo,
    lead_time_dias: cot.lead_time_dias,
    fecha_vencimiento: cot.fecha_vencimiento,
    estado: cot.estado,
    mockup_url: cot.mockup_url || '',
    pdf_url: pdfUrl,
  });
});