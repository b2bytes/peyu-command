import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger entity al ACTUALIZAR CorporateProposal con status = "Rechazada".
 * IA analiza el contexto, infiere el motivo más probable y arma una
 * contraoferta personalizada (descuento, ajuste plazos, alternativa SKU).
 * Crea Tarea para el equipo con el guion de re-engagement.
 *
 * Solo se ejecuta UNA vez por propuesta (marca con [RECUPERACION_INTENTADA]).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const event = body?.event;
    if (!event || event.type !== 'update') {
      return Response.json({ ok: true, skipped: 'not update event' });
    }

    const data = body?.data;
    const oldData = body?.old_data;

    // Solo si el cambio fue → "Rechazada"
    if (data?.status !== 'Rechazada' || oldData?.status === 'Rechazada') {
      return Response.json({ ok: true, skipped: 'no transition to Rechazada' });
    }

    const propId = event.entity_id;
    const prop = data;

    if (prop.production_notes?.includes('[RECUPERACION_INTENTADA]')) {
      return Response.json({ ok: true, skipped: 'ya procesada' });
    }

    // Histórico del cliente (si existe)
    const clienteHist = await base44.asServiceRole.entities.Cliente.filter({
      empresa: prop.empresa,
    }).catch(() => []);
    const cliente = clienteHist?.[0];

    // Productos para sugerencias alternativas
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true });

    const fmt = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

    const ai = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres el agente de recuperación comercial de PEYU Chile (regalos corporativos sostenibles, plástico 100% reciclado, fabricación local en Quinta Normal).

Una propuesta B2B fue RECHAZADA. Analiza y genera una estrategia de recuperación.

PROPUESTA RECHAZADA:
- N°: ${prop.numero || prop.id}
- Empresa: ${prop.empresa}
- Contacto: ${prop.contacto}
- Total: ${fmt(prop.total)} (subtotal ${fmt(prop.subtotal)} + descuento ${prop.descuento_pct || 0}%)
- Lead time: ${prop.lead_time_dias || 'N/A'} días
- Items: ${prop.items_json || 'N/A'}
- Notas internas: ${prop.production_notes || 'sin notas'}

CONTEXTO CLIENTE:
- Tipo: ${cliente?.tipo || 'desconocido'}
- Total histórico: ${fmt(cliente?.total_compras_clp || 0)} en ${cliente?.num_pedidos || 0} pedidos
- Estado: ${cliente?.estado || 'nuevo'}
- Notas: ${cliente?.notas || 'ninguna'}

CATÁLOGO ALTERNATIVO (algunos SKUs económicos):
${productos.filter(p => p.canal !== 'B2B Exclusivo').slice(0, 5).map(p => `- ${p.sku}: ${p.nombre} (B2B desde ${fmt(p.precio_base_b2b || p.precio_b2c)})`).join('\n')}

Genera JSON con:
- motivo_probable (string, máx 80 caracteres — qué crees que motivó el rechazo: precio/plazos/personalización/competencia/timing)
- estrategia (string, 1 línea con el approach recomendado)
- contraoferta_descuento_pct (number 0-15, sugerencia de descuento adicional. 0 si no aplica)
- contraoferta_ajuste (string, máx 120 caracteres — ajuste no monetario: alternativa SKU, plazos, packaging gratis)
- mensaje_recuperacion (string, máx 280 caracteres — texto profesional, cálido, en español formal Chile, listo para enviar al cliente. NO uses emoji)
- prioridad (string: "Alta" si cliente VIP o ticket alto, "Normal" caso contrario)`,
      response_json_schema: {
        type: 'object',
        properties: {
          motivo_probable: { type: 'string' },
          estrategia: { type: 'string' },
          contraoferta_descuento_pct: { type: 'number' },
          contraoferta_ajuste: { type: 'string' },
          mensaje_recuperacion: { type: 'string' },
          prioridad: { type: 'string' },
        },
      },
    });

    // Guardar análisis en propuesta
    await base44.asServiceRole.entities.CorporateProposal.update(propId, {
      production_notes: `${prop.production_notes || ''}\n[RECUPERACION_INTENTADA] ${new Date().toISOString().split('T')[0]}\nMotivo IA: ${ai?.motivo_probable || ''}\nEstrategia: ${ai?.estrategia || ''}`.trim(),
    });

    // Crear tarea para el equipo
    await base44.asServiceRole.entities.Tarea.create({
      titulo: `🔄 Recuperar ${prop.empresa} · ${prop.numero || ''}`,
      descripcion: `Motivo IA: ${ai?.motivo_probable}\n\nEstrategia: ${ai?.estrategia}\n\nContraoferta: ${ai?.contraoferta_descuento_pct || 0}% adicional + ${ai?.contraoferta_ajuste || ''}\n\nMensaje sugerido:\n${ai?.mensaje_recuperacion || ''}`,
      tipo: 'Comercial',
      prioridad: ai?.prioridad === 'Alta' ? 'Alta' : 'Media',
      estado: 'Pendiente',
      asignado_a: 'ti@peyuchile.cl',
      fecha_vencimiento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }).catch((e) => console.error('Error creando tarea:', e.message));

    // Email interno con guion completo
    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#fff8f1">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #f59e0b;padding:24px">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
    <span style="font-size:24px">🔄</span>
    <h2 style="color:#92400e;margin:0;font-size:18px">Propuesta rechazada · plan de recuperación</h2>
  </div>
  <table style="width:100%;font-size:13px;color:#4B4F54;line-height:1.7;margin-bottom:16px">
    <tr><td><strong>Empresa:</strong></td><td>${prop.empresa} · ${prop.contacto}</td></tr>
    <tr><td><strong>Propuesta:</strong></td><td>${prop.numero || prop.id} · ${fmt(prop.total)}</td></tr>
    <tr><td><strong>Cliente histórico:</strong></td><td>${cliente ? `${fmt(cliente.total_compras_clp || 0)} en ${cliente.num_pedidos || 0} pedidos` : 'Lead nuevo'}</td></tr>
  </table>

  <div style="background:#fef9e7;padding:14px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#92400e;font-weight:700;margin:0 0 6px;text-transform:uppercase">Motivo probable (IA)</p>
    <p style="font-size:14px;color:#0F172A;margin:0;font-weight:600">${ai?.motivo_probable || 'No determinado'}</p>
  </div>

  <div style="background:#f0faf7;padding:14px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#006D5B;font-weight:700;margin:0 0 6px;text-transform:uppercase">Estrategia recomendada</p>
    <p style="font-size:13px;color:#4B4F54;margin:0">${ai?.estrategia || ''}</p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0">
    <div style="background:#eff6ff;padding:12px;border-radius:8px">
      <p style="font-size:10px;color:#1e40af;font-weight:700;margin:0;text-transform:uppercase">Descuento adicional</p>
      <p style="font-size:22px;color:#1e40af;font-weight:900;margin:4px 0 0">${ai?.contraoferta_descuento_pct || 0}%</p>
    </div>
    <div style="background:#f3e8ff;padding:12px;border-radius:8px">
      <p style="font-size:10px;color:#6d28d9;font-weight:700;margin:0;text-transform:uppercase">Prioridad</p>
      <p style="font-size:22px;color:#6d28d9;font-weight:900;margin:4px 0 0">${ai?.prioridad || 'Normal'}</p>
    </div>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;padding:14px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#6b7280;font-weight:700;margin:0 0 6px;text-transform:uppercase">📝 Ajuste no-monetario sugerido</p>
    <p style="font-size:13px;color:#0F172A;margin:0">${ai?.contraoferta_ajuste || '—'}</p>
  </div>

  <div style="background:#0F172A;color:#fff;padding:16px;border-radius:8px;margin:16px 0">
    <p style="font-size:11px;color:#A7D9C9;font-weight:700;margin:0 0 8px;text-transform:uppercase">💬 Mensaje listo para enviar</p>
    <p style="font-size:13px;margin:0;line-height:1.7;color:#e5e7eb">${ai?.mensaje_recuperacion || ''}</p>
  </div>

  <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0">Tarea creada en /admin/plan · Llamar dentro de 48h</p>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU Recovery',
      to: 'ti@peyuchile.cl',
      subject: `🔄 ${ai?.prioridad === 'Alta' ? '[ALTA] ' : ''}Recuperar ${prop.empresa} · ${ai?.motivo_probable?.slice(0, 50) || ''}`,
      body: html,
    });

    return Response.json({
      ok: true,
      propuesta: prop.numero,
      motivo: ai?.motivo_probable,
      descuento_propuesto: ai?.contraoferta_descuento_pct,
      prioridad: ai?.prioridad,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});