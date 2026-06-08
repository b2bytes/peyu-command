import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Notifica al equipo cuando una propuesta requiere atención urgente
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ ok: true });
    }

    const propuestaData = data;
    const empresa = propuestaData.empresa || 'Empresa desconocida';
    const numero = propuestaData.numero || 'S/N';
    const status = propuestaData.status || 'Desconocido';
    const email = propuestaData.email || 'Sin email';
    const total = propuestaData.total || 0;

    // Detectar cambios urgentes
    const statusUrgentes = ['Rechazada', 'Vencida', 'Expirada'];
    const cambioUrgente = old_data && 
      (statusUrgentes.includes(status) || 
       (status === 'Enviada' && old_data.status !== 'Enviada'));

    // No notificar si no hay cambio urgente
    if (event.type === 'update' && !cambioUrgente) {
      return Response.json({ ok: true });
    }

    // Determinar emoji y prioridad
    let emoji = '📋';
    let prioridad = 'NORMAL';
    let accion = 'Revisar propuesta';

    if (status === 'Rechazada') {
      emoji = '❌';
      prioridad = 'URGENTE';
      accion = 'Seguimiento y recuperación';
    } else if (status === 'Vencida' || status === 'Expirada') {
      emoji = '⏰';
      prioridad = 'URGENTE';
      accion = 'Contactar cliente para extender validez';
    } else if (status === 'Enviada') {
      emoji = '✉️';
      prioridad = 'MEDIA';
      accion = 'Cliente debería revisar en 24h';
    } else if (status === 'Aceptada') {
      emoji = '✅';
      prioridad = 'NORMAL';
      accion = 'Coordinar producción y entrega';
    }

    const emailBody = `
<h2>${emoji} Propuesta requiere atención</h2>
<p><strong>Prioridad:</strong> <span style="color: ${prioridad === 'URGENTE' ? 'red' : 'orange'}">${prioridad}</span></p>
<hr />
<h3>Propuesta #${numero}</h3>
<ul>
  <li><strong>Empresa:</strong> ${empresa}</li>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Estado:</strong> ${status}</li>
  <li><strong>Total:</strong> $${total.toLocaleString('es-CL')}</li>
</ul>
<hr />
<p><strong>Acción recomendada:</strong> ${accion}</p>
<p><strong>Acceso rápido:</strong> Ingresa a Admin → Propuestas para gestionar.</p>
    `;

    // Enviar notificación
    await base44.integrations.Core.SendEmail({
      to: 'operaciones@peyuchile.cl',
      cc: 'ventas@peyuchile.cl',
      subject: `${emoji} Propuesta ${prioridad}: ${empresa} (${numero})`,
      html: emailBody,
      from: 'notificaciones@peyuchile.cl',
    });

    console.log(`Notificación enviada para propuesta: ${numero}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Error notificando propuesta:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});