// ============================================================================
// cleanupTestAndExpiredOrders — Limpieza one-shot + recurrente
// ----------------------------------------------------------------------------
// Para correr una vez al implementar el sistema, y luego como CRON diario.
// Acciones:
//   1. Marca como "Cancelado" + payment_status="expired" todos los pedidos
//      en estado "Nuevo" con más de 5 días sin pagar (sin mp_payment_id).
//   2. Marca como "Cancelado" + payment_status="manual_review" los pedidos
//      claramente de prueba (email @peyuchile.cl o nombre con "prueba/test").
//   3. Devuelve resumen con conteo y lista de pedidos afectados.
//
// Acceso: requiere usuario admin (para correr manualmente desde panel).
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXPIRATION_DAYS = 5;
const TEST_EMAIL_DOMAINS = ['peyuchile.cl', 'mailinator.com', 'tempmail.com'];
const TEST_NAME_PATTERNS = /\b(test|prueba|testing|demo|qa|fake)\b/i;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Permite ejecución por admin o por CRON (sin auth user, base44 lo permite si lo invocas como service)
    // Pero si hay user, debe ser admin.
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { dry_run = false } = await req.json().catch(() => ({}));

    const ahora = new Date();
    const limite = new Date(ahora.getTime() - EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Cargar todos los pedidos en "Nuevo"
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500);
    const pendientes = pedidos.filter(p => p.estado === 'Nuevo');

    const expirados = [];
    const tests = [];

    for (const p of pendientes) {
      const email = (p.cliente_email || '').toLowerCase().trim();
      const emailDomain = email.split('@')[1] || '';
      const esEmailTest = TEST_EMAIL_DOMAINS.includes(emailDomain);
      const esNombreTest = TEST_NAME_PATTERNS.test(p.cliente_nombre || '');

      // 1. Test interno → cancelar inmediato sin importar fecha
      if (esEmailTest || esNombreTest) {
        tests.push(p);
        continue;
      }

      // 2. Expirado (>5 días sin pagar y sin mp_payment_id)
      if (p.created_date < limite && !p.mp_payment_id) {
        expirados.push(p);
      }
    }

    let actualizados = 0;
    const detalles = { expirados: [], tests: [] };

    if (!dry_run) {
      // Expirar pedidos viejos
      for (const p of expirados) {
        await base44.asServiceRole.entities.PedidoWeb.update(p.id, {
          estado: 'Cancelado',
          payment_status: 'expired',
          notas: `${p.notas || ''} | Cancelado automático: sin pago tras ${EXPIRATION_DAYS} días`.slice(0, 1000),
          historial: [
            ...(p.historial || []),
            {
              at: ahora.toISOString(),
              type: 'expired',
              actor: 'cleanupTestAndExpiredOrders',
              channel: 'system',
              detail: `Auto-cancelado por expiración (>${EXPIRATION_DAYS}d sin pago)`,
            },
          ],
        });
        actualizados++;
        detalles.expirados.push({
          numero: p.numero_pedido,
          cliente: p.cliente_nombre,
          email: p.cliente_email,
          total: p.total,
          dias: Math.floor((ahora - new Date(p.created_date)) / (1000 * 60 * 60 * 24)),
        });
      }

      // Marcar tests
      for (const p of tests) {
        await base44.asServiceRole.entities.PedidoWeb.update(p.id, {
          estado: 'Cancelado',
          payment_status: 'manual_review',
          risk_flags: [...(p.risk_flags || []), 'test_interno'],
          notas: `${p.notas || ''} | Test interno detectado y cancelado`.slice(0, 1000),
          historial: [
            ...(p.historial || []),
            {
              at: ahora.toISOString(),
              type: 'cancelled',
              actor: 'cleanupTestAndExpiredOrders',
              channel: 'system',
              detail: 'Pedido de prueba interno detectado',
            },
          ],
        });
        actualizados++;
        detalles.tests.push({
          numero: p.numero_pedido,
          cliente: p.cliente_nombre,
          email: p.cliente_email,
        });
      }
    } else {
      // Dry run: solo listar
      detalles.expirados = expirados.map(p => ({
        numero: p.numero_pedido, cliente: p.cliente_nombre, email: p.cliente_email, total: p.total,
      }));
      detalles.tests = tests.map(p => ({
        numero: p.numero_pedido, cliente: p.cliente_nombre, email: p.cliente_email,
      }));
    }

    return Response.json({
      ok: true,
      dry_run,
      total_pendientes_revisados: pendientes.length,
      expirados_count: expirados.length,
      tests_count: tests.length,
      actualizados,
      detalles,
    });
  } catch (error) {
    console.error('cleanupTestAndExpiredOrders error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});