// ============================================================================
// carritoAbandonadoCRON — Secuencia de recuperación de 3 toques
// ----------------------------------------------------------------------------
// Cada hora revisa pedidos B2C "Nuevo" sin pago y envía hasta 3 emails:
//   • Toque 1 (3-22h)    : recordatorio amable, sin descuento
//   • Toque 2 (22-50h)   : "tu carrito sigue ahí" + cupón SORPRESA (sin monto)
//   • Toque 3 (50-110h)  : última oportunidad + cupón aún vigente
//
// Reglas duras:
//   • Excluye B2B (los lleva el equipo comercial, no spam con cupones)
//   • Excluye payment_status: paid, expired, manual_review, failed
//   • Excluye risk_flags con email_test_interno o telefono_spammer
//   • Cada toque solo se envía una vez (tracked en recovery_secuencia)
//   • Si el cliente ya pagó entre toques, se detiene automáticamente
//
// El cupón no se menciona en monto en el email — el cliente solo ve que existe
// un código aplicable. Esto evita inflar expectativas y permite ajustar % luego.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API = 'https://api.resend.com/emails';
// ⚠️ Hasta verificar peyuchile.cl en Resend, usamos el sender de prueba.
// Cuando el dominio esté verificado, cambiar a 'PEYU Chile <ti@peyuchile.cl>'.
const FROM = 'PEYU Chile <onboarding@resend.dev>';

// Ventanas en horas desde created_date
const T1_MIN = 3, T1_MAX = 22;
const T2_MIN = 22, T2_MAX = 50;
const T3_MIN = 50, T3_MAX = 110;

const CUPON_PCT = 10; // % descuento del cupón sorpresa
const CUPON_VIGENCIA_DIAS = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return Response.json({ ok: false, error: 'RESEND_API_KEY no configurado' }, { status: 500 });
    }

    const ahora = Date.now();
    const horasDesde = (createdDate) => (ahora - new Date(createdDate).getTime()) / 3_600_000;

    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 400);

    const elegibles = pedidos.filter(p => {
      if (p.estado !== 'Nuevo') return false;
      if (!p.cliente_email) return false;
      if (p.tipo_cliente && p.tipo_cliente !== 'B2C Individual') return false;
      const ps = p.payment_status;
      if (['paid', 'expired', 'manual_review', 'failed', 'refunded'].includes(ps)) return false;
      const flags = p.risk_flags || [];
      if (flags.includes('email_test_interno') || flags.includes('telefono_spammer') || flags.includes('nombre_test')) return false;
      const h = horasDesde(p.created_date);
      return h >= T1_MIN && h <= T3_MAX;
    });

    const stats = { revisados: pedidos.length, elegibles: elegibles.length, t1: 0, t2: 0, t3: 0, errores: 0 };

    for (const pedido of elegibles) {
      const h = horasDesde(pedido.created_date);
      const seq = pedido.recovery_secuencia || {};
      let toque = null;

      if (h >= T3_MIN && h < T3_MAX && !seq.toque_3_enviado_at) toque = 3;
      else if (h >= T2_MIN && h < T2_MAX && !seq.toque_2_enviado_at) toque = 2;
      else if (h >= T1_MIN && h < T1_MAX && !seq.toque_1_enviado_at) toque = 1;

      if (!toque) continue;

      try {
        let cuponCodigo = seq.cupon_emitido || null;

        // En toque 2, si aún no tiene cupón emitido, lo creamos
        if (toque === 2 && !cuponCodigo) {
          cuponCodigo = `VOLVE${Math.floor(Math.random() * 9000 + 1000)}`;
          const expira = new Date(ahora + CUPON_VIGENCIA_DIAS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await base44.asServiceRole.entities.Cupon.create({
            codigo: cuponCodigo,
            descripcion: `Recovery T2 · pedido ${pedido.numero_pedido} · ${pedido.cliente_email}`,
            tipo: 'porcentaje',
            valor: CUPON_PCT,
            minimo_compra_clp: 0,
            usos_max: 1,
            uso_unico_por_email: true,
            fecha_expiracion: expira,
            activo: true,
          });
        }

        const { subject, html } = buildEmail(toque, pedido, cuponCodigo);
        const res = await fetch(RESEND_API, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM, to: [pedido.cliente_email], subject, html }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.warn(`Resend falló T${toque} ${pedido.numero_pedido}:`, err);
          stats.errores++;
          continue;
        }

        const patch = {
          recovery_secuencia: {
            ...seq,
            [`toque_${toque}_enviado_at`]: new Date(ahora).toISOString(),
            ...(cuponCodigo ? { cupon_emitido: cuponCodigo } : {}),
          },
          historial: [
            ...(pedido.historial || []),
            {
              at: new Date(ahora).toISOString(),
              type: 'recovery_sent',
              actor: 'carritoAbandonadoCRON',
              channel: 'email',
              detail: `Toque ${toque}${cuponCodigo ? ` · cupón ${cuponCodigo}` : ''}`,
              meta: { toque, cupon: cuponCodigo },
            },
          ],
        };
        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, patch);
        stats[`t${toque}`]++;
      } catch (e) {
        console.warn(`Recovery falló para ${pedido.numero_pedido}:`, e.message);
        stats.errores++;
      }
    }

    return Response.json({ ok: true, stats, timestamp: new Date(ahora).toISOString() });
  } catch (error) {
    console.error('carritoAbandonadoCRON error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES — Sin mencionar % de descuento, tono PEYU (cálido, sostenible)
// ─────────────────────────────────────────────────────────────────────────
function buildEmail(toque, pedido, cuponCodigo) {
  const nombre = (pedido.cliente_nombre || '').split(' ')[0] || 'Hola';
  const numero = pedido.numero_pedido;
  const total = Number(pedido.total || 0).toLocaleString('es-CL');
  const linkReanudar = `https://peyuchile.cl/cart?retry=${encodeURIComponent(numero)}`;

  const wrap = (titulo, cuerpo, ctaTexto = 'Completar mi pedido →', extraStyle = '') => `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1f2937;${extraStyle}">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;font-size:32px">🐢</div>
        <h1 style="color:#0F8B6C;font-size:22px;margin:8px 0 0;font-weight:700">${titulo}</h1>
      </div>
      ${cuerpo}
      <div style="background:#F0FDF8;border:1px solid #BBF7D0;border-radius:14px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#475569"><strong>Pedido</strong> · ${numero}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#475569"><strong>Total</strong> · $${total} CLP</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="${linkReanudar}" style="background:#0F8B6C;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">${ctaTexto}</a>
      </div>
      <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0">
      <p style="color:#94A3B8;font-size:11px;text-align:center;margin:0">
        PEYU Chile · Productos sostenibles con garantía de 10 años<br>
        ¿Dudas? <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none">WhatsApp +56 9 3504 0242</a>
      </p>
    </div>
  `;

  if (toque === 1) {
    return {
      subject: `${nombre}, ¿se te quedó algo en el carrito? 🐢`,
      html: wrap(
        '¿Algo se quedó pendiente?',
        `<p style="font-size:15px;line-height:1.5">Hola ${nombre},</p>
         <p style="font-size:15px;line-height:1.5">Vimos que empezaste un pedido en PEYU y no llegaste a completarlo. Tu carrito todavía te espera 🌱</p>
         <p style="font-size:15px;line-height:1.5">Si tuviste algún problema o tienes dudas sobre el producto, estamos por <a href="https://wa.me/56935040242" style="color:#0F8B6C">WhatsApp</a> o respondiendo este email.</p>`
      ),
    };
  }

  if (toque === 2) {
    return {
      subject: `🎁 ${nombre}, te dejamos una sorpresa para retomar tu pedido`,
      html: wrap(
        'Una sorpresa para vos',
        `<p style="font-size:15px;line-height:1.5">Hola ${nombre},</p>
         <p style="font-size:15px;line-height:1.5">Sabemos que a veces el día se complica. Por eso te dejamos un <strong>código de descuento sorpresa</strong> para terminar tu pedido cuando quieras:</p>
         <div style="background:linear-gradient(135deg,#FBE9E1 0%,#F0FDF8 100%);border:2px dashed #D96B4D;border-radius:14px;padding:20px;margin:20px 0;text-align:center">
           <p style="margin:0;font-size:11px;color:#64748B;letter-spacing:1.5px;font-weight:600">TU CÓDIGO</p>
           <p style="margin:8px 0 0;font-family:'SF Mono',monospace;font-size:26px;font-weight:700;color:#D96B4D;letter-spacing:3px">${cuponCodigo}</p>
           <p style="margin:8px 0 0;font-size:12px;color:#64748B">Aplicalo en el checkout · Vigente ${CUPON_VIGENCIA_DIAS} días</p>
         </div>
         <p style="font-size:14px;line-height:1.5;color:#475569">Si tu carrito te parece justo así, igual entrá y completalo — el envío es gratis sobre $40.000 y cada producto saca plástico del vertedero ♻️</p>`,
        'Aplicar mi descuento →'
      ),
    };
  }

  // Toque 3 — última oportunidad
  return {
    subject: `⏰ ${nombre}, tu pedido caduca en 48h`,
    html: wrap(
      'Último aviso · tu carrito caduca pronto',
      `<p style="font-size:15px;line-height:1.5">Hola ${nombre},</p>
       <p style="font-size:15px;line-height:1.5">Tu pedido en PEYU está por <strong>caducar</strong>. Si no lo retomas en los próximos días, se cancela automáticamente.</p>
       ${cuponCodigo ? `
         <div style="background:#FEF3C7;border:2px solid #FCD34D;border-radius:14px;padding:18px;margin:20px 0;text-align:center">
           <p style="margin:0;font-size:13px;color:#78350F;font-weight:600">Tu código de descuento sigue activo:</p>
           <p style="margin:8px 0 0;font-family:'SF Mono',monospace;font-size:22px;font-weight:700;color:#D97706;letter-spacing:2px">${cuponCodigo}</p>
         </div>
       ` : ''}
       <p style="font-size:14px;line-height:1.5;color:#475569">Si cambiaste de opinión o algo no encajó, no hay problema. Si quieres contarnos qué pasó, respondé este email y lo mejoramos 🙏</p>`,
      'Retomar mi pedido →'
    ),
  };
}