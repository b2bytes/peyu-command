import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CRON semanal: resume el pipeline B2B y métricas de la semana
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const ahora = new Date();
    const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace7str = hace7dias.toISOString().split('T')[0];

    // Datos de la semana
    const [leads, propuestas, pedidos, b2bLeads] = await Promise.all([
      base44.asServiceRole.entities.Lead.list('-created_date', 200),
      base44.asServiceRole.entities.CorporateProposal.list('-created_date', 200),
      base44.asServiceRole.entities.PedidoWeb.list('-created_date', 200),
      base44.asServiceRole.entities.B2BLead.list('-created_date', 200),
    ]);

    // Filtrar semana
    const leadsNuevos = leads.filter(l => l.created_date >= hace7str);
    const propuestasEnviadas = propuestas.filter(p => p.fecha_envio >= hace7str);
    const propuestasAceptadas = propuestas.filter(p => p.status === 'Aceptada' && p.fecha_envio >= hace7str);
    const pedidosWeb = pedidos.filter(p => p.fecha >= hace7str);
    const b2bLeadsNuevos = b2bLeads.filter(l => l.created_date >= hace7str);

    // Propuestas pendientes (sin respuesta >48h)
    const hace48h = new Date(ahora.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
    const propuestasPendientes = propuestas.filter(p => p.status === 'Enviada' && p.fecha_envio <= hace48h);

    // Leads calientes sin propuesta
    const leadsCalientes = leads.filter(l => (l.calidad_lead === 'Caliente' || (l.lead_score || 0) >= 70) && l.estado === 'Contactado');

    const totalVentasWeb = pedidosWeb.reduce((s, p) => s + (p.total || 0), 0);
    const valorPropuestas = propuestasEnviadas.reduce((s, p) => s + (p.total || 0), 0);
    const tasaConversion = propuestasEnviadas.length > 0
      ? Math.round((propuestasAceptadas.length / propuestasEnviadas.length) * 100) : 0;

    const resumen = `
═══════════════════════════════════════════
📊 REPORTE SEMANAL PEYU — ${ahora.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
═══════════════════════════════════════════

🏢 PIPELINE B2B
• Leads nuevos esta semana: ${leadsNuevos.length}
• B2BLeads (WhatsApp/form): ${b2bLeadsNuevos.length}
• Propuestas enviadas: ${propuestasEnviadas.length} (${valorPropuestas > 0 ? '$' + valorPropuestas.toLocaleString('es-CL') + ' en cartera' : 'sin monto'})
• Propuestas aceptadas: ${propuestasAceptadas.length} (${tasaConversion}% conversión)

⚠️ ATENCIÓN REQUERIDA
• Propuestas sin respuesta +48h: ${propuestasPendientes.length}
${propuestasPendientes.slice(0, 3).map(p => `  - ${p.empresa || 'Empresa'}: $${(p.total || 0).toLocaleString('es-CL')} → seguimiento urgente`).join('\n')}
• Leads calientes sin propuesta: ${leadsCalientes.length}
${leadsCalientes.slice(0, 3).map(l => `  - ${l.empresa}: ${l.contacto}`).join('\n')}

🛒 TIENDA WEB (últimos 7 días)
• Pedidos nuevos: ${pedidosWeb.length}
• Ventas web: $${totalVentasWeb.toLocaleString('es-CL')} CLP
• Pedidos con personalización: ${pedidosWeb.filter(p => p.requiere_personalizacion).length}

📋 ACCIONES RECOMENDADAS
1. Seguir propuestas pendientes sin respuesta
2. Convertir leads calientes a propuesta esta semana
3. Revisar pedidos web en estado "Nuevo"

─────────────────────────────────────────
Peyu Chile · ventas@peyuchile.cl · +56 9 3504 0242
Generado automáticamente cada lunes
═══════════════════════════════════════════
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'ventas@peyuchile.cl',
      from_name: 'Sistema Peyu — Reporte Semanal',
      subject: `📊 Reporte Semanal Peyu — ${leadsNuevos.length} leads · ${propuestasEnviadas.length} propuestas · $${(totalVentasWeb / 1000).toFixed(0)}K web`,
      body: resumen,
    });

    return Response.json({
      ok: true,
      semana: { desde: hace7str, hasta: ahora.toISOString().split('T')[0] },
      resumen: {
        leads_nuevos: leadsNuevos.length,
        propuestas_enviadas: propuestasEnviadas.length,
        propuestas_aceptadas: propuestasAceptadas.length,
        pedidos_web: pedidosWeb.length,
        ventas_web: totalVentasWeb,
        pendientes_seguimiento: propuestasPendientes.length,
      }
    });
  } catch (error) {
    console.error('reporteSemanalB2B error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});