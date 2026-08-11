// ════════════════════════════════════════════════════════════════════════
// clientePropuestas — todas las propuestas de un cliente (cotizaciones del
// chat/WhatsApp + propuestas B2B) con su PDF y su link para compartir.
// Pensada para dos consumidores: la ficha 360° del cliente (humanos) y los
// agentes (WhatsApp / vendedor web) cuando el cliente pide "reenvíame mi
// cotización".
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const APP_URL = 'https://peyuchile.cl';

// Propuestas antiguas guardaban el link del PDF dentro de notas.
const pdfDe = (r: any) =>
  r.pdf_url || (String(r.notas || '').match(/PDF:\s*(https?:\/\/\S+)/)?.[1] || '');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { email, empresa } = (await req.json().catch(() => ({}))) || {};

  if (!email && !empresa) {
    return Response.json({ error: 'Falta email o empresa del cliente.' }, { status: 400 });
  }

  const svc = base44.asServiceRole.entities;
  const [cotsEmail, cotsEmpresa, propsEmail, propsEmpresa] = await Promise.all([
    email ? svc.Cotizacion.filter({ email }, '-created_date', 50).catch(() => []) : [],
    empresa ? svc.Cotizacion.filter({ empresa }, '-created_date', 50).catch(() => []) : [],
    email ? svc.CorporateProposal.filter({ email }, '-created_date', 50).catch(() => []) : [],
    empresa ? svc.CorporateProposal.filter({ empresa }, '-created_date', 50).catch(() => []) : [],
  ]);

  const porId = new Map<string, any>();

  for (const c of [...cotsEmail, ...cotsEmpresa]) {
    porId.set(c.id, {
      id: c.id,
      origen: 'Cotización',
      numero: c.numero,
      estado: c.estado,
      fecha: c.fecha_envio || String(c.created_date || '').slice(0, 10),
      total: c.total,
      pdf_url: pdfDe(c),
      share_url: `${APP_URL}/propuesta?cot=${c.id}`,
      _t: new Date(c.created_date || 0).getTime(),
    });
  }
  for (const p of [...propsEmail, ...propsEmpresa]) {
    porId.set(p.id, {
      id: p.id,
      origen: 'Propuesta B2B',
      numero: p.numero,
      estado: p.status,
      fecha: p.fecha_envio || String(p.created_date || '').slice(0, 10),
      total: p.total,
      pdf_url: p.pdf_url || '',
      share_url: p.pdf_url || '',
      _t: new Date(p.created_date || 0).getTime(),
    });
  }

  const propuestas = [...porId.values()].sort((a, b) => b._t - a._t);
  return Response.json({ ok: true, total: propuestas.length, propuestas });
});