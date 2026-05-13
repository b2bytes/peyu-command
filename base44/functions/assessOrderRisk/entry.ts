// ============================================================================
// assessOrderRisk — Evalúa el riesgo de un PedidoWeb recién creado.
// ----------------------------------------------------------------------------
// Calcula un score 0-100 y banderas (risk_flags) basados en heurísticas:
//   - Email de prueba interno (@peyuchile.cl, contiene "test"/"prueba")
//   - Volumen B2C anormal (>50u en canal individual)
//   - Monto desproporcionado (>$1M sin personalización)
//   - Teléfono duplicado en últimos 7 días
//   - Email duplicado con otro nombre/teléfono
//
// Si score > 70 → marca payment_status = "manual_review" y notifica admin.
// Si tiene flag email_test → marca como manual_review automáticamente.
//
// Llamada típica: tras crear PedidoWeb desde Carrito.jsx o vía entity automation.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ADMIN_EMAIL = 'hola@peyuchile.cl';
const TEST_EMAIL_DOMAINS = ['peyuchile.cl', 'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com'];
const TEST_NAME_PATTERNS = /\b(test|prueba|testing|demo|qa|fake)\b/i;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pedido_id } = await req.json();
    if (!pedido_id) {
      return Response.json({ error: 'pedido_id requerido' }, { status: 400 });
    }

    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) {
      return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const flags = [];
    let score = 0;

    // 1. Email de prueba interno o desechable
    const email = (pedido.cliente_email || '').toLowerCase().trim();
    const emailDomain = email.split('@')[1] || '';
    if (TEST_EMAIL_DOMAINS.includes(emailDomain)) {
      flags.push('email_test_interno');
      score += 80; // alto, pero no bloqueamos
    }
    if (TEST_NAME_PATTERNS.test(pedido.cliente_nombre || '')) {
      flags.push('nombre_test');
      score += 50;
    }

    // 2. Volumen B2C anormal (>50u en canal individual)
    if (pedido.tipo_cliente === 'B2C Individual' && (pedido.cantidad || 0) > 50) {
      flags.push('volumen_alto_b2c');
      score += 40;
    }

    // 3. Monto alto desproporcionado (>$1M sin personalización ni B2B)
    if ((pedido.total || 0) > 1_000_000 && !pedido.requiere_personalizacion && pedido.tipo_cliente === 'B2C Individual') {
      flags.push('monto_anomalo_b2c');
      score += 30;
    }

    // 4. Teléfono duplicado en los últimos 7 días con otro pedido
    if (pedido.cliente_telefono) {
      const hace7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const otros = await base44.asServiceRole.entities.PedidoWeb.filter({
        cliente_telefono: pedido.cliente_telefono,
      });
      const duplicadosRecientes = (otros || []).filter(o =>
        o.id !== pedido.id &&
        o.created_date >= hace7d &&
        o.cliente_email !== pedido.cliente_email
      );
      if (duplicadosRecientes.length >= 1) {
        flags.push('telefono_repetido_7d');
        score += 35;
      }
      if (duplicadosRecientes.length >= 3) {
        flags.push('telefono_spammer');
        score += 30;
      }
    }

    // 5. Email duplicado con NOMBRE diferente (intento de suplantación)
    if (email) {
      const mismoEmail = await base44.asServiceRole.entities.PedidoWeb.filter({
        cliente_email: pedido.cliente_email,
      });
      const otrosConOtroNombre = (mismoEmail || []).filter(o =>
        o.id !== pedido.id &&
        o.cliente_nombre &&
        pedido.cliente_nombre &&
        normalizarNombre(o.cliente_nombre) !== normalizarNombre(pedido.cliente_nombre)
      );
      if (otrosConOtroNombre.length >= 1) {
        flags.push('email_multinombre');
        score += 25;
      }
    }

    // 6. Direcciones genéricas / inválidas
    const direccion = (pedido.direccion_envio || '').toLowerCase().trim();
    if (direccion.length < 8 || /^(test|prueba|asd|xxx|aaa|123)/.test(direccion)) {
      flags.push('direccion_invalida');
      score += 20;
    }

    // Cap a 100
    score = Math.min(100, score);

    // Determinar payment_status
    let payment_status = pedido.payment_status || 'pending_mp';
    if (score >= 70 || flags.includes('email_test_interno') || flags.includes('telefono_spammer')) {
      payment_status = 'manual_review';
    }

    // Actualizar pedido
    await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
      risk_score: score,
      risk_flags: flags,
      payment_status,
      historial: [
        ...(pedido.historial || []),
        {
          at: new Date().toISOString(),
          type: 'risk_assessed',
          actor: 'system',
          channel: 'system',
          detail: `Score ${score}/100 · Flags: ${flags.join(', ') || 'ninguna'}`,
          meta: { score, flags },
        },
      ],
    });

    // Alerta admin si requiere revisión manual (y NO es test interno — esos los filtramos solos)
    if (payment_status === 'manual_review' && !flags.includes('email_test_interno')) {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        try {
          const html = `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
              <h2 style="color:#D97706;margin:0 0 12px">⚠️ Pedido marcado para revisión manual</h2>
              <p>Un pedido fue creado con score de riesgo <strong>${score}/100</strong>. Revísalo antes de procesar.</p>
              <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:0"><strong>N° Pedido:</strong> ${pedido.numero_pedido}</p>
                <p style="margin:6px 0 0"><strong>Cliente:</strong> ${pedido.cliente_nombre} · ${pedido.cliente_email}</p>
                <p style="margin:6px 0 0"><strong>Teléfono:</strong> ${pedido.cliente_telefono || 'sin teléfono'}</p>
                <p style="margin:6px 0 0"><strong>Total:</strong> $${Number(pedido.total).toLocaleString('es-CL')} · ${pedido.cantidad}u</p>
                <p style="margin:6px 0 0"><strong>Banderas:</strong> ${flags.join(', ')}</p>
              </div>
              <p>
                <a href="https://peyuchile.cl/admin/procesar-pedidos" style="background:#D97706;color:white;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Revisar pedido →</a>
              </p>
            </div>
          `;
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'PEYU Alertas <ti@peyuchile.cl>',
              to: [ADMIN_EMAIL],
              subject: `⚠️ Pedido sospechoso · ${pedido.numero_pedido} · Score ${score}`,
              html,
            }),
          });
        } catch (e) {
          console.warn('Alerta admin falló (no bloqueante):', e.message);
        }
      }
    }

    return Response.json({
      ok: true,
      pedido_id: pedido.id,
      score,
      flags,
      payment_status,
    });
  } catch (error) {
    console.error('assessOrderRisk error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});

function normalizarNombre(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}