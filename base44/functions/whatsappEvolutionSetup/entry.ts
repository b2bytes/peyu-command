// ════════════════════════════════════════════════════════════════════════
// whatsappEvolutionSetup — Panel de control del middleware WhatsApp.
// Desde /admin/whatsapp permite: ver estado, crear la instancia, obtener el
// QR para vincular el número real de la tienda, registrar el webhook, y
// desvincular. Solo admins.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { evoFetch, getEvoConfig, evoConfigurado } from '../../shared/evolution.ts';

const EVENTOS_WEBHOOK = [
  'MESSAGES_UPSERT',
  'CONNECTION_UPDATE',
  'QRCODE_UPDATED',
];

function urlWebhookPorDefecto() {
  const appId = Deno.env.get('BASE44_APP_ID');
  return `https://base44.app/api/apps/${appId}/functions/whatsappEvolutionWebhook`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    if (!evoConfigurado()) {
      return Response.json({
        ok: false,
        configurado: false,
        mensaje: 'El servidor Evolution API aún no está configurado. Carga EVOLUTION_API_URL, EVOLUTION_API_KEY y EVOLUTION_WEBHOOK_SECRET en Settings → Environment variables.',
      });
    }

    const cfg = getEvoConfig();
    const webhookUrl = `${body.webhook_url || urlWebhookPorDefecto()}?secret=${encodeURIComponent(cfg.webhookSecret)}`;

    // ── Estado de la conexión ──────────────────────────────────────────
    if (action === 'status') {
      const estado = await evoFetch(`/instance/connectionState/${cfg.instance}`);
      const wh = await evoFetch(`/webhook/find/${cfg.instance}`);
      const state = estado.data?.instance?.state || estado.data?.state || 'unknown';
      return Response.json({
        ok: true,
        configurado: true,
        instancia: cfg.instance,
        servidor: cfg.url,
        existe: estado.status !== 404,
        state,                                   // open = vinculado · close/connecting = no
        conectado: state === 'open',
        webhook_registrado: !!wh.data?.enabled,
        webhook_url_esperada: webhookUrl,
      });
    }

    // ── Crear instancia + obtener QR ───────────────────────────────────
    if (action === 'connect') {
      const estado = await evoFetch(`/instance/connectionState/${cfg.instance}`);
      const existe = estado.status !== 404;

      if (!existe) {
        const creada = await evoFetch('/instance/create', {
          method: 'POST',
          body: {
            instanceName: cfg.instance,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
            rejectCall: false,
            groupsIgnore: true,
            alwaysOnline: true,
            readMessages: true,
            readStatus: false,
            syncFullHistory: false,
            webhook: {
              url: webhookUrl,
              byEvents: false,
              base64: false,
              events: EVENTOS_WEBHOOK,
            },
          },
        });
        if (!creada.ok) {
          return Response.json({
            ok: false,
            error: `Evolution API rechazó la creación de la instancia (${creada.status}).`,
            detalle: creada.data,
          }, { status: 502 });
        }
        const qr = creada.data?.qrcode?.base64 || creada.data?.base64 || '';
        return Response.json({
          ok: true,
          creada: true,
          qr_base64: qr,
          pairing_code: creada.data?.qrcode?.pairingCode || '',
          webhook_url: webhookUrl,
        });
      }

      const state = estado.data?.instance?.state || estado.data?.state || '';
      if (state === 'open') {
        return Response.json({ ok: true, conectado: true, mensaje: 'El número ya está vinculado.' });
      }

      // Instancia existente pero desconectada → pedir QR nuevo
      const conn = await evoFetch(`/instance/connect/${cfg.instance}`);
      return Response.json({
        ok: conn.ok,
        creada: false,
        qr_base64: conn.data?.base64 || conn.data?.qrcode?.base64 || '',
        pairing_code: conn.data?.pairingCode || '',
        webhook_url: webhookUrl,
        detalle: conn.ok ? undefined : conn.data,
      });
    }

    // ── Registrar / re-registrar el webhook ────────────────────────────
    if (action === 'set_webhook') {
      const r = await evoFetch(`/webhook/set/${cfg.instance}`, {
        method: 'POST',
        body: {
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: EVENTOS_WEBHOOK,
          },
        },
      });
      return Response.json({ ok: r.ok, webhook_url: webhookUrl, detalle: r.data }, { status: r.ok ? 200 : 502 });
    }

    // ── Desvincular el teléfono ────────────────────────────────────────
    if (action === 'logout') {
      const r = await evoFetch(`/instance/logout/${cfg.instance}`, { method: 'DELETE' });
      return Response.json({ ok: r.ok, detalle: r.data });
    }

    // ── Reiniciar la sesión (cuando se cae sin cerrar) ─────────────────
    if (action === 'restart') {
      const r = await evoFetch(`/instance/restart/${cfg.instance}`, { method: 'POST' });
      return Response.json({ ok: r.ok, detalle: r.data });
    }

    return Response.json({ error: `Acción no reconocida: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});