import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsManage · Acciones de ESCRITURA sobre Meta Ads (Graph API).
// Permite al agente ejecutar cambios reales: pausar/activar campañas, ad sets
// y ads; cambiar presupuesto diario; y listar campañas con estado + presupuesto.
// Requiere System User token con ads_management sobre la cuenta publicitaria.
//
// Payload:
//   { action: 'list_campaigns' }
//   { action: 'pause' | 'activate', entity_type: 'campaign'|'adset'|'ad', id: '123' }
//   { action: 'set_daily_budget', entity_type: 'campaign'|'adset', id: '123', daily_budget_clp: 25000 }
//
// Nota presupuesto: la Graph API recibe el monto en la unidad mínima de la
// moneda. CLP no tiene decimales, por lo que daily_budget = monto * 1 (sin x100).
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = err?.message || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'El token de Meta es inválido o expiró. Regenera el token del Usuario del Sistema con ads_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El Usuario del Sistema no tiene permiso ads_management para modificar esta campaña. Asigna "Administrar campañas" en Meta Business Settings.', detail: msg };
  if (code === 100) return { reason: 'no_encontrado', error: 'No se encuentra la campaña/ad set/anuncio indicado. Verifica el ID.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando las consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) {
      return Response.json({ ok: false, error: 'Faltan credenciales de Meta (token o Ad Account ID).' });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // ── Listar campañas con su estado y presupuesto ─────────────────────────
    if (action === 'list_campaigns') {
      const fields = 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time';
      const res = await fetch(`${base}/${accountId}/campaigns?fields=${fields}&limit=200&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const campaigns = (data.data || []).map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,                    // ACTIVE | PAUSED
        effective_status: c.effective_status,
        objective: c.objective,
        daily_budget_clp: c.daily_budget ? Number(c.daily_budget) : null,
        lifetime_budget_clp: c.lifetime_budget ? Number(c.lifetime_budget) : null,
      }));
      return Response.json({ ok: true, count: campaigns.length, campaigns });
    }

    // Las demás acciones operan sobre un objeto concreto
    const entityType = body.entity_type;   // campaign | adset | ad
    const id = body.id;
    if (!id) return Response.json({ ok: false, error: 'Falta el ID del objeto a modificar.' });
    if (!['campaign', 'adset', 'ad'].includes(entityType)) {
      return Response.json({ ok: false, error: "entity_type debe ser 'campaign', 'adset' o 'ad'." });
    }

    // ── Pausar / Activar ────────────────────────────────────────────────────
    if (action === 'pause' || action === 'activate') {
      const newStatus = action === 'pause' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch(`${base}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, access_token: token }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, entity_type: entityType, id, new_status: newStatus });
    }

    // ── Cambiar presupuesto diario (solo campaign o adset) ──────────────────
    if (action === 'set_daily_budget') {
      if (entityType === 'ad') {
        return Response.json({ ok: false, error: 'El presupuesto se ajusta a nivel de campaña o ad set, no de anuncio individual.' });
      }
      const clp = Math.round(Number(body.daily_budget_clp || 0));
      if (!clp || clp < 1000) {
        return Response.json({ ok: false, error: 'daily_budget_clp inválido. Indica un monto en CLP (mínimo ~$1.000).' });
      }
      // CLP no tiene decimales → la unidad mínima es el peso entero.
      const res = await fetch(`${base}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: String(clp), access_token: token }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, entity_type: entityType, id, daily_budget_clp: clp });
    }

    return Response.json({ ok: false, error: `Acción no soportada: ${action}` });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});