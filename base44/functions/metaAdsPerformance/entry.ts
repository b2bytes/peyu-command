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
      return Response.json({ connected: false, error: acct.error.message || 'Token inválido o sin acceso a la cuenta.' });
    }

    // 2) Campañas con sus insights del periodo
    const fields = [
      'campaign_name', 'campaign_id',
      'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm',
      'reach', 'frequency', 'actions', 'cost_per_action_type',
    ].join(',');
    const insightsUrl = `${base}/${accountId}/insights?level=campaign&date_preset=${datePreset}&fields=${fields}&limit=200&access_token=${encodeURIComponent(token)}`;
    const insRes = await fetch(insightsUrl);
    const ins = await insRes.json();
    if (ins.error) {
      return Response.json({ connected: false, error: ins.error.message || 'Error al consultar insights.' });
    }

    const rows = (ins.data || []).map((d) => {
      const conv = (d.actions || []).find(a =>
        ['purchase', 'offsite_conversion.fb_pixel_purchase', 'lead', 'omni_purchase'].includes(a.action_type)
      );
      const conversions = conv ? Number(conv.value) : 0;
      const spend = Number(d.spend || 0);
      const cpa = conversions > 0 ? spend / conversions : 0;
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
        cpa,
      };
    });

    // 3) KPIs agregados del periodo
    const totals = rows.reduce((t, r) => {
      t.spend += r.spend; t.impressions += r.impressions; t.clicks += r.clicks; t.conversions += r.conversions;
      return t;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
    const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const totalCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const totalCpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

    return Response.json({
      connected: true,
      account: {
        id: accountId,
        name: acct.name,
        currency: acct.currency,
        account_status: acct.account_status,
      },
      date_preset: datePreset,
      totals: { ...totals, ctr: totalCtr, cpc: totalCpc, cpa: totalCpa },
      campaigns: rows.sort((a, b) => b.spend - a.spend),
    });
  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});