// ============================================================================
// email-previews.js — Catálogo de TODOS los correos que recibe el cliente.
// ----------------------------------------------------------------------------
// Reproduce fielmente el HTML que generan las backend functions de envío, con
// datos de ejemplo, para poder revisarlos visualmente en /admin/correos.
// IMPORTANTE: es solo para PREVIEW. La fuente de verdad sigue siendo cada
// backend function. Si cambias un correo real, actualiza también su plantilla
// aquí para que el catálogo siga reflejando la realidad.
// ============================================================================

const clp = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

// ── Datos de ejemplo compartidos ──────────────────────────────────────────
const PEDIDO_DEMO = {
  numero_pedido: 'PEY-2026-0481',
  cliente_nombre: 'María José Fuentes',
  subtotal: 38900,
  fee_personalizacion: 0,
  costo_envio: 4990,
  descuento: 0,
  total: 43890,
  direccion_envio: 'Av. Providencia 1234, Depto 56',
  ciudad: 'Providencia, Santiago',
  courier: 'BlueExpress',
  tracking: '990012345678',
  descripcion_items: 'Kit Escritorio Pro × 1\nMacetero Cacho × 2',
  requiere_personalizacion: true,
  texto_personalizacion: 'Equipo Innova 2026',
  items_detalle: [
    { nombre: 'Kit Escritorio Pro', cantidad: 1, color: 'Verde Bosque', personalizacion: 'Equipo Innova 2026', tipo_personalizacion: 'frase', fee_personalizacion: 0 },
    { nombre: 'Macetero Cacho', cantidad: 2, color: 'Terracota' },
  ],
};

// ════════════════════════════════════════════════════════════════════════
// 1) CONFIRMACIÓN DE PEDIDO (enviarConfirmacionPedido) — Warm Dusk crema 🐢
//    Dos variantes: MercadoPago y Transferencia (con datos bancarios).
// ════════════════════════════════════════════════════════════════════════
function buildItemsWarmDusk(pedido) {
  return (pedido.items_detalle || []).map((it) => {
    const partes = [];
    if (it.color) partes.push(`Color: <strong>${it.color}</strong>`);
    if (it.personalizacion) partes.push(`Grabado: "${it.personalizacion}"`);
    const sub = partes.length ? `<div style="font-size:12px;color:#6B7280;margin-top:2px">${partes.join(' · ')}</div>` : '';
    return `<div style="padding:10px 0;border-bottom:1px solid #EAE3D9"><span style="font-weight:600;color:#1f2937">${it.nombre} × ${it.cantidad}</span>${sub}</div>`;
  }).join('');
}

function buildTransferenciaBlock(pedido) {
  return `<div style="background:#FBF6F0;border:1px solid #EAE3D9;border-radius:12px;padding:18px;margin:18px 0">
    <p style="margin:0 0 10px;font-weight:700;color:#0B6E55;font-size:14px">🏦 Datos para tu transferencia</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#3a3026">
      <tr><td style="padding:3px 0;color:#6B7280">Titular</td><td style="padding:3px 0;text-align:right;font-weight:600">Peyu Chile SpA</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">RUT</td><td style="padding:3px 0;text-align:right;font-weight:600">77.069.974-6</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">Banco</td><td style="padding:3px 0;text-align:right;font-weight:600">Banco Santander</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">N° de cuenta</td><td style="padding:3px 0;text-align:right;font-weight:700;font-size:16px;color:#0B6E55">94151872</td></tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;color:#6B7280;line-height:1.5">En el detalle indica el N° de pedido <strong style="color:#3a3026">${pedido.numero_pedido}</strong> y envía el comprobante a <strong>ventas@peyuchile.cl</strong>.</p>
  </div>`;
}

function confirmacionPedido(pedido, esTransferencia) {
  const itemsHtml = buildItemsWarmDusk(pedido);
  const titulo = esTransferencia ? '¡Pedido recibido!' : '¡Pedido confirmado!';
  const intro = esTransferencia
    ? 'recibimos tu pedido. Para confirmarlo, realiza la transferencia con los datos de abajo.'
    : 'recibimos tu pedido. Te confirmaremos el pago en breve y comenzaremos a prepararlo.';
  const envio = pedido.costo_envio ? `<tr><td style="padding:4px 0;color:#6B7280">Envío</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.costo_envio)}</td></tr>` : '';
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#FBF6F0;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0F8B6C 0%,#0B6E55 100%);padding:28px 24px;text-align:center">
      <div style="font-size:34px;line-height:1">🐢</div>
      <h1 style="color:#fff;margin:8px 0 2px;font-size:22px;letter-spacing:-0.5px">${titulo}</h1>
      <p style="color:#A7D9C9;margin:0;font-size:13px">PEYU · Productos sostenibles hechos en Chile</p>
    </div>
    <div style="padding:24px;color:#3a3026">
      <p style="margin:0 0 14px">Hola <strong>${pedido.cliente_nombre}</strong>, ${intro}</p>
      <div style="background:#fff;border:1px solid #EAE3D9;border-radius:12px;padding:16px;margin:0 0 18px">
        <p style="margin:0;font-size:13px;color:#6B7280">N° de Pedido</p>
        <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#0F8B6C">${pedido.numero_pedido}</p>
      </div>
      <p style="font-weight:700;margin:0 0 6px;color:#3a3026">Tu pedido</p>
      <div style="background:#fff;border:1px solid #EAE3D9;border-radius:12px;padding:4px 16px;margin:0 0 18px">${itemsHtml}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 6px">
        <tr><td style="padding:4px 0;color:#6B7280">Subtotal</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.subtotal)}</td></tr>
        ${envio}
        <tr><td style="padding:10px 0 0;font-weight:700;font-size:16px;color:#3a3026;border-top:2px solid #EAE3D9">Total ${esTransferencia ? 'a transferir' : ''}</td><td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;color:#0F8B6C;border-top:2px solid #EAE3D9">${clp(pedido.total)}</td></tr>
      </table>
      ${esTransferencia ? buildTransferenciaBlock(pedido) : ''}
      <div style="margin:16px 0"><p style="font-weight:700;margin:0 0 4px;color:#3a3026">📦 Dirección de envío</p><p style="margin:0;color:#6B7280;font-size:13px">${pedido.direccion_envio}, ${pedido.ciudad}</p></div>
      <p style="text-align:center;margin:22px 0 8px"><a href="#" style="background:#0F8B6C;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Seguir mi pedido →</a></p>
      <p style="color:#9A8C7A;font-size:11px;text-align:center;margin:18px 0 0">Cada PEYU saca plástico del vertedero. Garantía 10 años. 🌿<br/>PEYU Chile · ti@peyuchile.cl</p>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════════════
// 2) COMPROBANTE DE PAGO (enviarComprobantePedido) — Warm Dusk crema 🐢
// ════════════════════════════════════════════════════════════════════════
function comprobantePago(pedido) {
  const itemsHtml = buildItemsWarmDusk(pedido);
  const envio = pedido.costo_envio ? `<tr><td style="padding:4px 0;color:#6B7280">Envío</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.costo_envio)}</td></tr>` : '';
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#FBF6F0;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0F8B6C 0%,#0B6E55 100%);padding:28px 24px;text-align:center">
      <div style="font-size:34px;line-height:1">🐢</div>
      <h1 style="color:#fff;margin:8px 0 2px;font-size:22px;letter-spacing:-0.5px">¡Compra confirmada!</h1>
      <p style="color:#A7D9C9;margin:0;font-size:13px">PEYU · Productos sostenibles hechos en Chile</p>
    </div>
    <div style="padding:24px;color:#3a3026">
      <p style="margin:0 0 14px">Hola <strong>${pedido.cliente_nombre}</strong>, recibimos tu pago. ¡Gracias por elegir PEYU! 🌎</p>
      <div style="background:#fff;border:1px solid #EAE3D9;border-radius:12px;padding:16px;margin:0 0 18px">
        <p style="margin:0;font-size:13px;color:#6B7280">N° de Pedido</p>
        <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#0F8B6C">${pedido.numero_pedido}</p>
      </div>
      <p style="font-weight:700;margin:0 0 6px;color:#3a3026">Tu pedido</p>
      <div style="background:#fff;border:1px solid #EAE3D9;border-radius:12px;padding:4px 16px;margin:0 0 18px">${itemsHtml}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 6px">
        <tr><td style="padding:4px 0;color:#6B7280">Subtotal</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.subtotal)}</td></tr>
        ${envio}
        <tr><td style="padding:10px 0 0;font-weight:700;font-size:16px;color:#3a3026;border-top:2px solid #EAE3D9">Total pagado</td><td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;color:#0F8B6C;border-top:2px solid #EAE3D9">${clp(pedido.total)}</td></tr>
      </table>
      <div style="background:#E6F4EF;border:1px solid #A7D9C9;border-radius:12px;padding:14px;margin:18px 0"><p style="margin:0;font-size:13px;color:#0B6E55">🚚 Tiempo estimado de despacho: 2-5 días hábiles. Te enviaremos el código de tracking al despachar.</p></div>
      <p style="text-align:center;margin:22px 0 8px"><a href="#" style="background:#0F8B6C;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Seguir mi pedido →</a></p>
      <p style="color:#9A8C7A;font-size:11px;text-align:center;margin:18px 0 0">Cada PEYU saca plástico del vertedero. Garantía 10 años. 🌿<br/>PEYU Chile · ti@peyuchile.cl</p>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════════════
// 3) CAMBIO DE ESTADO (onPedidoWebStatusChange) — Verde slate, hero por estado
// ════════════════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  'Confirmado': { emoji: '✅', gradient: 'linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%)', color: '#0F8B6C', title: 'Pedido confirmado', intro: 'Confirmamos tu pedido y ya está en cola de producción.', eta: 'Estará listo en 3–5 días hábiles.' },
  'En Producción': { emoji: '🏭', gradient: 'linear-gradient(135deg,#D96B4D 0%,#B85638 100%)', color: '#D96B4D', title: 'En producción', intro: 'Estamos fabricando tu pedido en nuestro taller en Santiago.', eta: 'Quedan 2–4 días hábiles para que esté listo.' },
  'Listo para Despacho': { emoji: '📦', gradient: 'linear-gradient(135deg,#0F8B6C 0%,#06947A 100%)', color: '#0F8B6C', title: 'Listo para despacho', intro: 'Tu pedido fue empaquetado y está esperando al courier.', eta: 'Saldrá despachado hoy o mañana.' },
  'Despachado': { emoji: '🚚', gradient: 'linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%)', color: '#0F8B6C', title: '¡Tu pedido está en camino!', intro: 'Salió de nuestro taller y ya viaja hacia ti.', eta: 'Tiempo estimado: 2–5 días hábiles.' },
  'Entregado': { emoji: '🎉', gradient: 'linear-gradient(135deg,#0F8B6C 0%,#06947A 100%)', color: '#0F8B6C', title: '¡Pedido entregado!', intro: 'Esperamos que te encante. Cada producto cuenta una historia: el plástico que renace.', eta: '' },
};

function cambioEstado(pedido, status) {
  const cfg = STATUS_CONFIG[status];
  const isDelivered = status === 'Entregado';
  const trackingBlock = (status === 'Despachado' && pedido.tracking) ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;color:#3B82F6;text-transform:uppercase;">N° Tracking ${pedido.courier}</p>
        <p style="margin:0 0 14px;font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;color:#1E40AF;">${pedido.tracking}</p>
        <a href="#" style="display:inline-block;background:#1E40AF;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">Rastrear envío →</a>
      </td></tr>
    </table>` : '';
  return `<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">
      <tr><td style="background:${cfg.gradient};padding:44px 40px 36px;color:#fff;text-align:center;">
        <div style="font-size:56px;line-height:1;margin-bottom:12px;">${cfg.emoji}</div>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${cfg.title}</h1>
        <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:600;letter-spacing:1px;">PEDIDO ${pedido.numero_pedido}</p>
      </td></tr>
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${pedido.cliente_nombre},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#475569;">${cfg.intro}</p>
        ${cfg.eta ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0FAF7;border:1px solid #C8E6DA;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:14px 18px;font-size:14px;color:#0A6B54;"><strong>⏱ Tiempo estimado:</strong> ${cfg.eta}</td></tr></table>` : ''}
        ${trackingBlock}
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Detalle del pedido</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;border-radius:12px;margin-bottom:28px;"><tr><td style="padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:14px;color:#0F172A;line-height:1.5;">${pedido.descripcion_items.replace(/\n/g, '<br/>')}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #E5E0D6;padding-top:12px;"><tr>
            <td style="padding:6px 0;font-size:13px;color:#64748B;">Total</td>
            <td style="padding:6px 0;text-align:right;font-size:18px;font-weight:800;color:${cfg.color};">${clp(pedido.total)}</td>
          </tr></table>
        </td></tr></table>
        ${isDelivered ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%);border:1px solid #FBBF24;border-radius:16px;margin-bottom:24px;"><tr><td style="padding:28px 24px;text-align:center;">
          <div style="font-size:32px;letter-spacing:6px;margin-bottom:10px;">⭐⭐⭐⭐⭐</div>
          <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#78350F;">¿Cómo fue tu experiencia?</h3>
          <p style="margin:0 0 18px;font-size:14px;color:#78350F;">Tu opinión nos ayuda a mejorar.</p>
          <a href="#" style="display:inline-block;background:#78350F;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">Calificar mi pedido →</a>
        </td></tr></table>` : `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center">
          <a href="#" style="display:inline-block;background:${cfg.color};color:#fff;padding:16px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:15px;">Ver seguimiento detallado →</a>
        </td></tr></table>`}
      </td></tr>
      <tr><td style="background:#0F172A;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#fff;font-weight:700;">PEYU Chile · Plástico que renace 🐢</p>
        <p style="margin:0;font-size:11px;"><a href="#" style="color:#A7D9C9;text-decoration:none;">peyuchile.cl</a></p>
      </td></tr>
    </table>
  </td></tr></table></body>`;
}

// ════════════════════════════════════════════════════════════════════════
// 4) ENTREGA + RESEÑA + CUPÓN (entregaSecuenciaPostVenta) — Verde sólido
// ════════════════════════════════════════════════════════════════════════
function entregaResena(pedido) {
  const nombre = pedido.cliente_nombre.split(' ')[0];
  return `<body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#06947A);padding:32px 28px;text-align:center">
    <div style="font-size:48px;line-height:1;margin-bottom:8px">🎉</div>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">¡Tu pedido llegó, ${nombre}!</h1>
    <p style="margin:8px 0 0;color:#A7D9C9;font-size:13px;font-weight:600">PEDIDO ${pedido.numero_pedido}</p>
  </div>
  <div style="padding:28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">BlueExpress nos confirmó que tu pedido fue entregado. Esperamos que te encante 💚</p>
    <p style="margin:0 0 22px">Cada producto PEYU es plástico que rescatamos y volvió a nacer. Si tienes 1 minuto, <strong>cuéntanos qué te pareció</strong> — y de regalo te dejamos un cupón <strong style="color:#0F8B6C">10% OFF</strong>.</p>
    <div style="text-align:center;margin:24px 0"><a href="#" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px">Calificar mi pedido ⭐ →</a></div>
    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:20px 0;text-align:center">
      <p style="margin:0;font-size:11px;color:#006D5B;font-weight:700;letter-spacing:1px">CUPÓN POST-ENTREGA</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0F8B6C;font-family:monospace">GRACIAS10</p>
      <p style="margin:6px 0 0;font-size:11px;color:#4B4F54">Válido 30 días · Mínimo $20.000</p>
    </div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="margin:0;color:#6b7280;font-size:11px;text-align:center">Peyu Chile SPA · Plástico que renace 🐢 · ventas@peyuchile.cl</p>
  </div>
</div></body>`;
}

// ════════════════════════════════════════════════════════════════════════
// 5) TRÁNSITO BLUEEXPRESS (bluexTrackingPush) — TEXTO PLANO (sin diseño)
//    Estos correos hoy salen como texto plano. Los mostramos tal cual para
//    evidenciar que necesitan rediseño.
// ════════════════════════════════════════════════════════════════════════
function transitoTextoPlano(estado) {
  const nombre = 'María José';
  const trackingUrl = 'https://www.bluex.cl/seguimiento?n=990012345678';
  const T = {
    'Retirado por Courier': `Hola ${nombre},\n\nTu pedido va en camino. BlueExpress acaba de retirarlo de nuestra bodega.\n\n📍 Sigue el viaje en vivo: ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    'En Reparto': `Hola ${nombre},\n\n¡Hoy es el día! Tu pedido entró en ruta de reparto.\n\n💡 Tip: asegúrate de tener alguien en la dirección durante el día.\n\n📍 Tracking: ${trackingUrl}\n\n— Equipo Peyu 🐢`,
    'No Entregado': `Hola ${nombre},\n\nEl courier intentó entregar tu pedido pero no encontró a nadie en la dirección.\n\n📍 Reagenda directamente con BlueExpress: ${trackingUrl}\n\nO llámanos al WhatsApp +56 9 3504 0242.\n\n— Equipo Peyu 🐢`,
  };
  const texto = T[estado] || T['Retirado por Courier'];
  return `<body style="margin:0;padding:24px;background:#fff;font-family:-apple-system,Arial,sans-serif">
    <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:-apple-system,Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.7;margin:0">${texto}</pre>
  </body>`;
}

// ════════════════════════════════════════════════════════════════════════
// 6) RECOMPRA / RE-ENGAGEMENT (recordatorioRecompraCRON) — Verde
// ════════════════════════════════════════════════════════════════════════
function recompra() {
  return `<body style="font-family:Inter,Arial,sans-serif;background:#F7F7F5;margin:0;padding:20px">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#006D5B);padding:28px 32px">
    <p style="color:#A7D9C9;font-size:11px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">¡Te extrañamos, Constructora Aurora! 🌱</h1>
  </div>
  <div style="padding:28px">
    <p style="color:#4B4F54;font-size:14px;line-height:1.6;margin:0 0 16px">Hace 6 meses que no compras con nosotros. Mientras tanto, nuestra fábrica sigue convirtiendo plástico reciclado en regalos corporativos hermosos.</p>
    <div style="background:#f0faf7;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center">
      <p style="color:#006D5B;font-weight:700;font-size:13px;margin:0 0 8px;letter-spacing:1px">REGALO DE BIENVENIDA</p>
      <p style="color:#0F8B6C;font-size:36px;font-weight:900;margin:0">15% OFF</p>
      <p style="color:#4B4F54;font-size:13px;margin:8px 0 0">en tu próximo pedido B2B · usa el código <strong>VUELTA15</strong></p>
    </div>
    <div style="text-align:center"><a href="#" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">Ver catálogo B2B →</a></div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">Peyu Chile SPA · Plástico 100% reciclado · ventas@peyuchile.cl</p>
  </div>
</div></body>`;
}

// ════════════════════════════════════════════════════════════════════════
// 7) CARRITO ABANDONADO (enviarRecordatorioCarrito) — Slate oscuro
// ════════════════════════════════════════════════════════════════════════
function carritoAbandonado() {
  const items = [
    { nombre: 'Kit Escritorio Pro', cantidad: 1, precio: 24900, personalizacion: 'Equipo Innova' },
    { nombre: 'Macetero Cacho', cantidad: 2, precio: 6990 },
  ];
  const total = 38880;
  const itemRows = items.map((i) => `<tr>
    <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:14px;">
      <div style="font-weight:600;">${i.nombre}</div>
      ${i.personalizacion ? `<div style="font-size:12px;color:#7c3aed;margin-top:2px;">✨ "${i.personalizacion}"</div>` : ''}
      <div style="font-size:12px;color:#64748b;margin-top:2px;">x${i.cantidad}</div>
    </td>
    <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#0f172a;font-size:14px;">${clp(i.precio * i.cantidad)}</td>
  </tr>`).join('');
  return `<body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
    <tr><td style="background:linear-gradient(135deg,#0f8b6c,#0891b2);padding:32px 28px;text-align:center;color:#fff;">
      <div style="font-size:28px;font-weight:700;">PEYU Chile</div>
      <div style="margin-top:8px;font-size:14px;opacity:0.85;">Sostenibilidad hecha en Chile 🇨🇱</div>
    </td></tr>
    <tr><td style="padding:32px 28px;color:#0f172a;">
      <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;">¡Hola María! 👋</h1>
      <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">Notamos que dejaste algunos productos en tu carrito. ¡No queremos que se te escapen!</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">${itemRows}</table>
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px;padding:16px;margin:20px 0;text-align:center;">
        <div style="font-size:13px;color:#0f766e;font-weight:600;">Total estimado</div>
        <div style="font-size:28px;font-weight:700;color:#0f172a;margin-top:4px;">${clp(total)}</div>
      </div>
      <div style="text-align:center;margin:28px 0;"><a href="#" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:600;font-size:15px;">Finalizar mi compra →</a></div>
      <div style="border-top:1px solid #e2e8f0;padding-top:20px;font-size:13px;color:#64748b;line-height:1.6;">
        <strong style="color:#0f172a;">¿Por qué PEYU?</strong><br/>♻️ 100% plástico reciclado<br/>🇨🇱 Hecho en Chile<br/>🚚 Envío gratis sobre $40.000<br/>🛡️ Garantía 10 años
      </div>
    </td></tr>
  </table></body>`;
}

// ════════════════════════════════════════════════════════════════════════
// 8) GIFT CARD (enviarGiftCard) — Premium oscuro con tarjeta visual
// ════════════════════════════════════════════════════════════════════════
function giftCard() {
  const codigo = 'PEYU-K8MX-7QR4';
  const montoFmt = '20.000';
  const v = { from: '#0f766e', to: '#155e75', accent: '#5EEAD4', tag: 'POPULAR' };
  const logoUrl = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png';
  const mensaje = '¡Feliz cumpleaños! Que disfrutes eligiendo algo lindo y sostenible 💚';
  return `<body style="margin:0;padding:0;background:#f6f3ee;font-family:-apple-system,'Segoe UI',Inter,sans-serif;color:#3a3a3a;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:13px;color:#7a7a7a;letter-spacing:2px;text-transform:uppercase;margin:0;">Has recibido un regalo</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;color:#0F8B6C;margin:8px 0 4px;">¡Hola Camila!</h1>
      <p style="font-size:15px;color:#5a5a5a;margin:0;">Rodrigo te regaló una Gift Card PEYU</p>
    </div>
    <div style="background:linear-gradient(135deg, ${v.from} 0%, ${v.to} 100%);border-radius:20px;padding:32px 28px;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);">
      <div style="border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:22px;position:relative;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
          <td align="left" valign="top"><img src="${logoUrl}" alt="PEYU" style="height:32px;filter:invert(1) brightness(1.15);" /></td>
          <td align="right" valign="top"><span style="font-size:9px;font-weight:bold;letter-spacing:3px;color:#fff;background:${v.accent}30;border:1px solid rgba(255,255,255,.3);padding:5px 10px;border-radius:999px;">${v.tag}</span></td>
        </tr></table>
        <div style="text-align:center;margin:12px 0 16px;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,.5);">Valor</p>
          <p style="margin:0;font-size:48px;font-weight:bold;color:#fff;line-height:1;">$${montoFmt}</p>
          <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,.6);">CLP · Saldo disponible</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>
          <td align="left"><p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);">Para</p><p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#fff;">Camila</p><p style="margin:0;font-size:11px;color:rgba(255,255,255,.6);">De: Rodrigo</p></td>
          <td align="right"><p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);">Código</p><p style="margin:2px 0 0;font-family:monospace;font-size:13px;font-weight:bold;letter-spacing:2px;color:${v.accent};">${codigo}</p></td>
        </tr></table>
      </div>
    </div>
    <div style="background:#fffaf2;border-left:4px solid #D96B4D;padding:16px 20px;border-radius:8px;margin-bottom:24px;"><p style="margin:0;font-style:italic;color:#5a5a5a;font-size:15px;line-height:1.6;">"${mensaje}"</p><p style="margin:8px 0 0;font-size:12px;color:#9a9a9a;">— Rodrigo</p></div>
    <div style="background:#E7D8C6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#5a4a3a;letter-spacing:2px;text-transform:uppercase;">Tu código de canje</p>
      <p style="margin:0;font-family:monospace;font-size:28px;font-weight:bold;color:#0F8B6C;letter-spacing:3px;">${codigo}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#7a6a5a;">Saldo: <strong>$${montoFmt} CLP</strong></p>
    </div>
    <div style="text-align:center;margin-bottom:32px;"><a href="#" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;font-size:15px;">🎁 Canjear ahora en peyuchile.cl</a></div>
    <div style="text-align:center;padding-top:24px;border-top:1px solid #e0d8cc;"><p style="margin:0;font-size:12px;color:#a0a0a0;">PEYU Chile · Regalos sostenibles 100% reciclados</p></div>
  </div></body>`;
}

// ── EXPORT: catálogo completo agrupado ──────────────────────────────────
export const EMAIL_PREVIEWS = [
  {
    grupo: 'Compra',
    correos: [
      { id: 'conf_mp', nombre: 'Pedido confirmado (MercadoPago)', funcion: 'enviarConfirmacionPedido', estetica: 'Warm Dusk 🐢', cuando: 'Al crear el pedido (pago online)', html: confirmacionPedido(PEDIDO_DEMO, false) },
      { id: 'conf_transf', nombre: 'Pedido recibido (Transferencia)', funcion: 'enviarConfirmacionPedido', estetica: 'Warm Dusk 🐢', cuando: 'Al crear el pedido por transferencia (incluye datos bancarios)', html: confirmacionPedido(PEDIDO_DEMO, true) },
      { id: 'comprobante', nombre: 'Compra confirmada (comprobante de pago)', funcion: 'enviarComprobantePedido', estetica: 'Warm Dusk 🐢', cuando: 'Cuando MercadoPago confirma el pago', html: comprobantePago(PEDIDO_DEMO) },
    ],
  },
  {
    grupo: 'Estados del pedido',
    correos: [
      { id: 'est_confirmado', nombre: 'Confirmado', funcion: 'onPedidoWebStatusChange', estetica: 'Verde slate', cuando: 'Pedido pasa a Confirmado', html: cambioEstado(PEDIDO_DEMO, 'Confirmado') },
      { id: 'est_produccion', nombre: 'En Producción', funcion: 'onPedidoWebStatusChange', estetica: 'Terracota', cuando: 'Pedido pasa a En Producción', html: cambioEstado(PEDIDO_DEMO, 'En Producción') },
      { id: 'est_listo', nombre: 'Listo para Despacho', funcion: 'onPedidoWebStatusChange', estetica: 'Verde slate', cuando: 'Pedido empaquetado', html: cambioEstado(PEDIDO_DEMO, 'Listo para Despacho') },
      { id: 'est_despachado', nombre: 'Despachado (con tracking)', funcion: 'onPedidoWebStatusChange', estetica: 'Verde slate', cuando: 'Pedido sale a despacho', html: cambioEstado(PEDIDO_DEMO, 'Despachado') },
      { id: 'est_entregado', nombre: 'Entregado + reseña', funcion: 'entregaSecuenciaPostVenta', estetica: 'Verde sólido', cuando: 'BlueExpress confirma la entrega', html: entregaResena(PEDIDO_DEMO) },
    ],
  },
  {
    grupo: 'Tránsito BlueExpress (⚠ texto plano)',
    correos: [
      { id: 'bx_retirado', nombre: 'Retirado por courier', funcion: 'bluexTrackingPush', estetica: '⚠ Texto plano', cuando: 'BlueExpress retira el paquete', html: transitoTextoPlano('Retirado por Courier') },
      { id: 'bx_reparto', nombre: 'En reparto hoy', funcion: 'bluexTrackingPush', estetica: '⚠ Texto plano', cuando: 'Paquete sale a reparto', html: transitoTextoPlano('En Reparto') },
      { id: 'bx_fallido', nombre: 'Intento fallido', funcion: 'bluexTrackingPush', estetica: '⚠ Texto plano', cuando: 'No había nadie para recibir', html: transitoTextoPlano('No Entregado') },
    ],
  },
  {
    grupo: 'Marketing / retención',
    correos: [
      { id: 'carrito', nombre: 'Carrito abandonado', funcion: 'enviarRecordatorioCarrito', estetica: 'Slate oscuro', cuando: '1 h después de abandonar el carrito', html: carritoAbandonado() },
      { id: 'recompra', nombre: 'Recompra / te extrañamos', funcion: 'recordatorioRecompraCRON', estetica: 'Verde', cuando: 'Cliente B2B inactivo >180 días', html: recompra() },
      { id: 'giftcard', nombre: 'Gift Card', funcion: 'enviarGiftCard', estetica: 'Premium oscuro', cuando: 'Compra/regalo de Gift Card', html: giftCard() },
    ],
  },
];