import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsPerformance · Trae el rendimiento real de las campañas de Meta Ads
// (Facebook + Instagram) vía Graph API usando el System User token + Ad Account.
// Devuelve estado de conexión, KPIs agregados y una fila por campaña.
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

// Clasifica el error de Meta en un diagnóstico claro y accionable para el equipo.
function diagnoseMetaError(err) {
  const code = err?.code;
  const sub = err?.error_subcode;
  const msg = err?.message || 'Error desconocido de Meta.';

  // Token inválido / malformado / expirado
  if (code === 190) {
    return {
      reason: 'token_invalido',
      error: 'El token de Meta es inválido o expiró. Genera un token nuevo del Usuario del Sistema (con scopes ads_read + ads_management) y actualiza el secreto META_SYSTEM_USER_TOKEN.',
      detail: msg,
    };
  }
  // Falta de permisos sobre la cuenta publicitaria
  if (code === 200 || code === 10 || code === 272) {
    return {
      reason: 'sin_permiso',
      error: 'El Usuario del Sistema no tiene permiso ads_read / ads_management sobre la cuenta publicitaria. Asigna la cuenta al System User con "Administrar campañas" en Meta Business Settings y regenera el token.',
      detail: msg,
    };
  }
  // Cuenta inexistente / ID mal escrito / sin acceso
  if (code === 100) {
    return {
      reason: 'cuenta_no_encontrada',
      error: 'No se encuentra la cuenta publicitaria. Revisa que META_AD_ACCOUNT_ID sea correcto (solo el número, sin act_) y que esté asignada al Usuario del Sistema.',
      detail: msg,
    };
  }
  // Rate limit
  if (code === 17 || code === 4 || code === 80004) {
    return { reason: 'rate_limit', error: 'Meta está limitando las consultas temporalmente. Intenta de nuevo en unos minutos.', detail: msg };
  }
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
      return Response.json({ connected: false, error: 'Faltan credenciales de Meta (token o Ad Account ID).' });
    }

    const body = await req.json().catch(() => ({}));
    const datePreset = body.date_preset || 'last_30d'; // last_7d, last_30d, this_month, etc.

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    // 1) Datos de la cuenta (nombre, moneda, estado)
    const acctRes = await fetch(`${base}/${accountId}?fields=name,currency,account_status,amount_spent&access_token=${encodeURIComponent(token)}`);
    const acct = await acctRes.json();
    if (acct.error) {
      return Response.json({ connected: false, ...diagnoseMetaError(acct.error) });
    }

    // 2) Campañas con sus insights del periodo
    const fields = [
      'campaign_name', 'campaign_id',
      'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm',
      'reach', 'frequency', 'actions', 'cost_per_action_type',
      'action_values', 'purchase_roas',
    ].join(',');
    const insightsUrl = `${base}/${accountId}/insights?level=campaign&date_preset=${datePreset}&fields=${fields}&limit=200&access_token=${encodeURIComponent(token)}`;
    const insRes = await fetch(insightsUrl);
    const ins = await insRes.json();
    if (ins.error) {
      return Response.json({ connected: false, ...diagnoseMetaError(ins.error) });
    }

    const rows = (ins.data || []).map((d) => {
      const conv = (d.actions || []).find(a =>
        ['purchase', 'offsite_conversion.fb_pixel_purchase', 'lead', 'omni_purchase'].includes(a.action_type)
      );
      const conversions = conv ? Number(conv.value) : 0;
      const spend = Number(d.spend || 0);
      const cpa = conversions > 0 ? spend / conversions : 0;
      // Valor de conversión real (revenue) y ROAS desde Meta
      const valObj = (d.action_values || []).find(a =>
        ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'].includes(a.action_type)
      );
      const conversion_value = valObj ? Number(valObj.value) : 0;
      const roasObj = (d.purchase_roas || [])[0];
      const roas = roasObj ? Number(roasObj.value) : (spend > 0 && conversion_value > 0 ? conversion_value / spend : 0);
      return {
        campaign_id: d.campaign_id,
        campaign_name: d.campaign_name,
        spend,
        impressions: Number(d.impressions || 0),
        clicks: Number(d.clicks || 0),
        ctr: Number(d.ctr || 0),
        cpc: Number(d.cpc || 0),
        cpm: Number(d.cpm || 0),
        reach: Number(d.reach || 0),
        frequency: Number(d.frequency || 0),
        conversions,
        conversion_value,
        roas,
        cpa,
      };
    });

    // 3) KPIs agregados del periodo
    const totals = rows.reduce((t, r) => {
      t.spend += r.spend; t.impressions += r.impressions; t.clicks += r.clicks;
      t.conversions += r.conversions; t.conversion_value += r.conversion_value;
      return t;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value: 0 });
    const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const totalCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const totalCpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
    const totalRoas = totals.spend > 0 && totals.conversion_value > 0 ? totals.conversion_value / totals.spend : 0;

    return Response.json({
      connected: true,
      account: {
        id: accountId,
        name: acct.name,
        currency: acct.currency,
        account_status: acct.account_status,
      },
      date_preset: datePreset,
      totals: { ...totals, ctr: totalCtr, cpc: totalCpc, cpa: totalCpa, roas: totalRoas },
      campaigns: rows.sort((a, b) => b.spend - a.spend),
    });
  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});