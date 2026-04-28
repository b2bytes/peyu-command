// ============================================================================
// canjearGiftCard — Valida código y aplica saldo. Soporta 2 modos:
//   action='check'  → valida código y devuelve saldo (no descuenta)
//   action='redeem' → descuenta `monto` del saldo (suma o total)
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action = 'check', codigo, monto, pedido_id } = await req.json();

    if (!codigo) {
      return Response.json({ error: 'Falta código' }, { status: 400 });
    }

    const codigoUp = String(codigo).trim().toUpperCase();
    const matches = await base44.asServiceRole.entities.GiftCard.filter({ codigo: codigoUp });
    const gc = matches?.[0];

    if (!gc) {
      return Response.json({ ok: false, valid: false, reason: 'Código no encontrado' }, { status: 404 });
    }

    // Validaciones
    if (gc.estado !== 'Activa' && gc.estado !== 'Canjeada') {
      return Response.json({ ok: false, valid: false, reason: `Tarjeta ${gc.estado.toLowerCase()}` });
    }
    if (gc.fecha_expiracion && new Date(gc.fecha_expiracion) < new Date()) {
      await base44.asServiceRole.entities.GiftCard.update(gc.id, { estado: 'Expirada' });
      return Response.json({ ok: false, valid: false, reason: 'Tarjeta expirada' });
    }
    if (gc.saldo_clp <= 0) {
      return Response.json({ ok: false, valid: false, reason: 'Sin saldo disponible' });
    }

    if (action === 'check') {
      return Response.json({
        ok: true,
        valid: true,
        codigo: gc.codigo,
        saldo_clp: gc.saldo_clp,
        monto_clp: gc.monto_clp,
        estado: gc.estado,
      });
    }

    if (action === 'redeem') {
      const m = Math.min(Number(monto) || 0, gc.saldo_clp);
      if (m <= 0) {
        return Response.json({ ok: false, reason: 'Monto inválido' }, { status: 400 });
      }
      const nuevoSaldo = gc.saldo_clp - m;
      const nuevoEstado = nuevoSaldo === 0 ? 'Canjeada' : 'Activa';
      const updates = {
        saldo_clp: nuevoSaldo,
        estado: nuevoEstado,
      };
      if (nuevoSaldo === 0) {
        updates.fecha_canje = new Date().toISOString();
        if (pedido_id) updates.pedido_canje_id = pedido_id;
      }
      await base44.asServiceRole.entities.GiftCard.update(gc.id, updates);

      return Response.json({
        ok: true,
        codigo: gc.codigo,
        descontado_clp: m,
        saldo_restante_clp: nuevoSaldo,
        estado: nuevoEstado,
      });
    }

    return Response.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});