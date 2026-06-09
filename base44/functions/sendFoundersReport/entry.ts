import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reporte / presentación del sistema a los fundadores PEYU.
// Envía directamente desde la cuenta Gmail conectada (sin Resend).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const TO = ['jnilo@peyuchile.cl', 'cmoscoso@peyuchile.cl'];
    const CC = ['admin@lyalab.tech'];
    const REPLY_TO = 'ventas@b2business.lat';

    const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.6">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0F8B6C,#0B6E55);padding:32px 36px;border-radius:16px 16px 0 0">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">🐢 PEYU × B2Business · Presentación del Sistema</h1>
    <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">Junio 2026 · Resumen ejecutivo para los fundadores</p>
  </div>

  <div style="border:1px solid #e5e7eb;border-top:0;padding:32px 36px;border-radius:0 0 16px 16px">

    <p style="font-size:16px">Hola Diego y Joaquín,</p>
    <p>Este correo es para presentarles formalmente el sistema que hemos construido juntos para PEYU, explicarles <strong>qué es, qué puede hacer, y cuál es el rol de cada parte</strong> en la relación que tenemos.</p>

    <!-- BLOQUE 1: QUÉ ES EL SISTEMA -->
    <div style="background:#f0fdf8;border-left:4px solid #0F8B6C;padding:18px 20px;border-radius:0 12px 12px 0;margin:24px 0">
      <p style="margin:0 0 8px;font-weight:700;font-size:16px;color:#0B6E55">🤖 ¿Qué es este sistema?</p>
      <p style="margin:0;font-size:14px;color:#1f2937">Es un <strong>programa inteligente personalizado para PEYU</strong> — no una plataforma genérica. Vive dentro de su tienda, maneja ventas B2C y B2B, genera mockups con IA, administra propuestas corporativas, hace seguimiento de envíos BlueExpress, captura leads del chat, optimiza el SEO y mucho más. Todo conectado y hablándose entre sí.</p>
    </div>

    <!-- BLOQUE 2: CAPACIDADES -->
    <p style="font-weight:700;font-size:15px;margin-bottom:12px">⚡ ¿Qué puede hacer hoy?</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tbody>
        <tr style="background:#f9fafb"><td style="padding:10px 12px;border:1px solid #e5e7eb">🛒 Tienda B2C completa</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Catálogo, ficha de producto, carrito, checkout con MercadoPago, comprobantes automáticos</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e5e7eb">🏢 Flujo B2B corporativo</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Cotizador por volumen, propuestas PDF, seguimiento y firma digital</td></tr>
        <tr style="background:#f9fafb"><td style="padding:10px 12px;border:1px solid #e5e7eb">✨ Personalizador láser</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Mockup fotorrealista con IA, grabado sobre el producto, adjunto al pedido de producción</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e5e7eb">🚚 Logística BlueExpress</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Generación de etiquetas, tracking en tiempo real, notificaciones automáticas al cliente</td></tr>
        <tr style="background:#f9fafb"><td style="padding:10px 12px;border:1px solid #e5e7eb">💬 Chat con IA (Peyu)</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Asistente conversacional que vende, cotiza, captura leads B2B/B2C y responde dudas</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e5e7eb">📊 Panel admin completo</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Ventas, pipeline, inventario, clientes 360°, finanzas, OKRs, SEO, marketing y más</td></tr>
        <tr style="background:#f9fafb"><td style="padding:10px 12px;border:1px solid #e5e7eb">📧 Emails automáticos</td><td style="padding:10px 12px;border:1px solid #e5e7eb">Confirmación de compra, despacho, entrega, recompra, carrito abandonado y secuencias B2B</td></tr>
      </tbody>
    </table>

    <!-- BLOQUE 3: HABLAR DIRECTO CON EL PROGRAMA -->
    <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:20px 22px;margin:24px 0">
      <p style="margin:0 0 10px;font-weight:700;font-size:16px;color:#1d4ed8">💬 Ustedes pueden hablar directo con su programa</p>
      <p style="margin:0 0 10px;font-size:14px;color:#1e3a8a">Una de las ventajas más importantes del sistema es que <strong>ustedes, como fundadores, pueden pedirle cambios al programa directamente</strong>, igual que lo hace Diego hoy. Simplemente describen en lenguaje normal lo que quieren cambiar, agregar o mejorar, y el sistema lo entiende y propone cómo hacerlo.</p>
      <p style="margin:0;font-size:14px;color:#1e3a8a">Ejemplos de cosas que pueden pedirle:</p>
      <ul style="font-size:14px;color:#1e3a8a;margin:8px 0 0;padding-left:20px">
        <li>«Quiero agregar un banner de descuento en la tienda»</li>
        <li>«Muéstrame las ventas de esta semana en el panel»</li>
        <li>«Agrega un nuevo producto al catálogo con sus fotos y precio»</li>
        <li>«Cambia el texto del botón de cotización en la página de empresas»</li>
        <li>«Envíame un reporte de los leads de este mes»</li>
      </ul>
    </div>

    <!-- BLOQUE 4: CÓMO FUNCIONA EL PROCESO DE CAMBIOS -->
    <p style="font-weight:700;font-size:15px;margin-bottom:12px">🔄 ¿Cómo funciona cuando piden un cambio?</p>
    <div style="display:flex;flex-direction:column;gap:0">
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px 12px 0 0">
        <span style="font-size:22px">1️⃣</span>
        <div><strong>Ustedes describen el cambio</strong> en lenguaje natural — no necesitan saber programar. El sistema entiende perfectamente.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;border:1px solid #e5e7eb;border-top:0">
        <span style="font-size:22px">2️⃣</span>
        <div>El programa <strong>propone la solución</strong>, explica qué va a hacer y lo ejecuta — todo en minutos.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-top:0">
        <span style="font-size:22px">3️⃣</span>
        <div><strong>Diego revisa y valida</strong> los cambios antes de que queden publicados en producción. Él actúa como el filtro de calidad.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
        <span style="font-size:22px">4️⃣</span>
        <div>El tiempo total es de <strong>1 a 24 horas</strong> dependiendo de la complejidad — cambios simples en minutos, cambios grandes en horas.</div>
      </div>
    </div>

    <!-- BLOQUE 5: PENDIENTE TÉCNICO -->
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;margin:28px 0 20px">
      <p style="margin:0 0 6px;font-weight:600;color:#9a3412">⚠️ Pendiente técnico — acción de Diego</p>
      <p style="margin:0;font-size:14px;color:#7c2d12">Para que los correos automáticos a clientes lleguen desde <strong>@peyuchile.cl</strong> (y no desde sandbox), hay que verificar el dominio en resend.com/domains (agregar 2-3 registros DNS). Diego puede hacerlo en 10 minutos. Mientras tanto todo funciona, los correos salen pero desde dirección sandbox.</p>
    </div>

    <p style="font-size:15px">El sistema está completamente operativo. Estamos disponibles para cualquier pregunta o demostración en vivo.</p>

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">
      <p style="margin:0"><strong style="color:#1f2937">Equipo B2Business · LyaLab</strong></p>
      <p style="margin:4px 0 0">ventas@b2business.lat · lyalab.tech</p>
    </div>
  </div>
</div>`;

    const subject = 'PEYU · Presentación del sistema — Qué puede hacer y cómo funciona 🚀';
    const subjectEncoded = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

    const mime = [
      `From: B2Business LyaLab <me>`,
      `To: ${TO.join(', ')}`,
      `Cc: ${CC.join(', ')}`,
      `Subject: ${subjectEncoded}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(html))),
    ].join('\r\n');

    const raw = btoa(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });

    const result = await r.json();
    if (!r.ok) {
      return Response.json({ error: `Gmail API ${r.status}`, detail: result }, { status: r.status });
    }

    return Response.json({ success: true, id: result.id, to: TO, cc: CC });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});