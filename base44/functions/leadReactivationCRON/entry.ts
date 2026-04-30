import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON · Cada miércoles 10:00 — Reactivación de leads B2B fríos.
 * Detecta B2BLead en estado "Contactado" o "Cotizando" cuya updated_date sea
 * de hace ≥14 días. IA genera plan de reactivación personalizado por lead
 * y crea Tarea para el equipo comercial.
 *
 * Solo procesa cada lead 1 vez por mes (marca con [REACTIVACION_MM]).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    const hace14 = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000);

    const leads = await base44.asServiceRole.entities.B2BLead.list('-updated_date', 200);

    const elegibles = leads.filter(l => {
      if (!['Contactado', 'Cotizando'].includes(l.status)) return false;
      if (!l.email && !l.phone) return false;
      const updated = new Date(l.updated_date || l.created_date);
      if (updated > hace14) return false;
      // No reprocesar este mes
      if (l.notes?.includes(`[REACTIVACION_${mesActual}]`)) return false;
      return true;
    });

    if (elegibles.length === 0) {
      return Response.json({ ok: true, message: 'Sin leads para reactivar esta semana' });
    }

    let procesados = 0;
    const detalles = [];

    for (const lead of elegibles) {
      try {
        const diasInactivo = Math.floor((ahora - new Date(lead.updated_date || lead.created_date)) / (1000 * 60 * 60 * 24));

        const ai = await base44.integrations.Core.InvokeLLM({
          prompt: `Eres el SDR de PEYU Chile (regalos corporativos sostenibles).

Lead B2B inactivo hace ${diasInactivo} días que requiere reactivación:

- Empresa: ${lead.company_name}
- Contacto: ${lead.contact_name || 'sin nombre'}
- Email: ${lead.email || 'sin email'}
- Tel: ${lead.phone || 'sin tel'}
- Origen: ${lead.source || 'desconocido'}
- Producto interés: ${lead.product_interest || 'no especificado'}
- Cantidad estimada: ${lead.qty_estimate || 'sin estimación'}
- Lead score: ${lead.lead_score || 'sin score'}/100
- Estado: ${lead.status}
- Fecha entrega solicitada: ${lead.delivery_date || 'no especificada'}
- Notas: ${(lead.notes || '').slice(0, 200)}

Genera plan de reactivación JSON:
- approach (string: "Email cálido" | "WhatsApp directo" | "Llamada prioridad" | "Descartar")
- razon (string máx 100 chars - por qué este approach)
- mensaje_sugerido (string máx 280 chars - texto listo para enviar al cliente, español formal Chile, sin emoji)
- accion_dias (number 1-7, en cuántos días contactar)
- gancho (string máx 80 chars - propuesta de valor concreta a mencionar: descuento, novedad, mockup gratis, etc.)`,
          response_json_schema: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              razon: { type: 'string' },
              mensaje_sugerido: { type: 'string' },
              accion_dias: { type: 'number' },
              gancho: { type: 'string' },
            },
          },
        });

        // Crear tarea solo si no es "Descartar"
        if (ai?.approach && ai.approach !== 'Descartar') {
          const fechaVenc = new Date(Date.now() + (ai.accion_dias || 2) * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

          await base44.asServiceRole.entities.Tarea.create({
            titulo: `🔄 Reactivar ${lead.company_name} (${diasInactivo}d inactivo)`,
            descripcion: `Approach: ${ai.approach}\nRazón: ${ai.razon}\nGancho: ${ai.gancho}\n\nMensaje sugerido:\n${ai.mensaje_sugerido}\n\n— —\nContacto: ${lead.contact_name || ''} · ${lead.email || ''} · ${lead.phone || ''}\nProducto interés: ${lead.product_interest || ''}\nCantidad: ${lead.qty_estimate || 'N/A'}`,
            tipo: 'Comercial',
            prioridad: ai.approach === 'Llamada prioridad' ? 'Alta' : 'Media',
            estado: 'Pendiente',
            asignado_a: 'ti@peyuchile.cl',
            fecha_vencimiento: fechaVenc,
          }).catch(() => {});
        }

        // Marcar lead como procesado este mes
        await base44.asServiceRole.entities.B2BLead.update(lead.id, {
          notes: `${lead.notes || ''}\n[REACTIVACION_${mesActual}] ${ai?.approach || 'analizado'} · ${ahora.toISOString().split('T')[0]}`.trim(),
        });

        detalles.push({
          empresa: lead.company_name,
          dias: diasInactivo,
          approach: ai?.approach,
          gancho: ai?.gancho,
        });
        procesados++;
      } catch (e) {
        console.error(`Error reactivando ${lead.company_name}:`, e.message);
      }
    }

    // Email consolidado al equipo
    if (procesados > 0) {
      const colorAppr = (a) => {
        if (a === 'Llamada prioridad') return '#dc2626';
        if (a === 'WhatsApp directo') return '#16a34a';
        if (a === 'Email cálido') return '#0F8B6C';
        return '#6b7280';
      };

      const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#7c3aed);padding:24px 28px">
    <p style="color:#ddd6fe;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">Lead Reactivation · IA</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">🔄 ${procesados} lead(s) listos para reactivar</h1>
    <p style="color:#ddd6fe;font-size:13px;margin:6px 0 0">Inactivos &gt;14 días · Plan IA generado</p>
  </div>

  <div style="padding:24px 28px">
    ${detalles.map(d => `
      <div style="background:#fff;border:1px solid #e5e7eb;border-left:4px solid ${colorAppr(d.approach)};border-radius:8px;padding:12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
          <p style="color:#0F172A;font-weight:700;font-size:13px;margin:0">${d.empresa}</p>
          <span style="background:${colorAppr(d.approach)}1a;color:${colorAppr(d.approach)};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${d.approach}</span>
        </div>
        <p style="color:#9ca3af;font-size:11px;margin:0 0 4px">Inactivo hace ${d.dias} días</p>
        <p style="color:#4B4F54;font-size:12px;margin:0">🎯 ${d.gancho}</p>
      </div>
    `).join('')}

    <div style="background:#f5f3ff;border-radius:8px;padding:12px;margin:20px 0 0;text-align:center">
      <p style="color:#5b21b6;font-size:12px;margin:0">
        ${procesados} tarea(s) creada(s) en <strong>/admin/plan</strong> · Mensajes pre-redactados listos para copiar
      </p>
    </div>
  </div>
</div></body></html>`;

      await base44.integrations.Core.SendEmail({
        from_name: 'PEYU Lead Reactivation',
        to: 'ti@peyuchile.cl',
        subject: `🔄 ${procesados} lead(s) B2B listos para reactivar`,
        body: html,
      });
    }

    return Response.json({
      ok: true,
      total_leads_revisados: leads.length,
      elegibles: elegibles.length,
      procesados,
      detalles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});