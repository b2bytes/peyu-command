import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsDeepDive · Análisis PROFUNDO de Meta Ads para el agente estratega.
// Va más allá del rendimiento por campaña: baja a nivel de AD SET y ANUNCIO,
// y entrega BREAKDOWNS (edad, género, ubicación, plataforma, dispositivo) para
// que el agente analice TODO desde aquí, sin que el founder entre a Meta.
//
// Payload:
//   {
//     scope: 'adsets' | 'ads' | 'breakdown',
//     date_preset?: 'last_30d',
//     campaign_id?: '123',            // filtra a una campaña (opcional)
//     breakdown?: 'age' | 'gender' | 'age,gender' | 'country' | 'region'
//               | 'publisher_platform' | 'platform_position' | 'impression_device',
//     level?: 'account' | 'campaign'  // nivel del breakdown (default account)
//   }
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
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado. Regenera el token del System User con ads_read + ads_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso ads_read sobre la cuenta. Asigna la cuenta en Meta Business Settings.', detail: msg };
  if (code === 100) return { reason: 'no_encontrado', error: 'Recurso no encontrado. Revisa el campaign_id o META_AD_ACCOUNT_ID.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

// Extrae conversiones + valor (revenue) de los arrays actions/action_values.
const PURCHASE_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'];
const CONV_TYPES = [...PURCHASE_TYPES, 'lead', 'offsite_conversion.fb_pixel_lead'];

function parseInsightRow(d) {
  const conv = (d.actions || []).find(a => CONV_TYPES.includes(a.action_type));
  const conversions = conv ? Number(conv.value) : 0;
  const valObj = (d.action_values || []).find(a => PURCHASE_TYPES.includes(a.action_type));
  const conversion_value = valObj ? Number(valObj.value) : 0;
  const spend = Number(d.spend || 0);
  const roasObj = (d.purchase_roas || [])[0];
  const roas = roasObj ? Number(roasObj.value) : (spend > 0 && conversion_value > 0 ? conversion_value / spend : 0);
  return {
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
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) return Response.json({ ok: false, error: 'Faltan credenciales de Meta.' });

    const body = await req.json().catch(() => ({}));
    const scope = body.scope || 'adsets';
    const datePreset = body.date_preset || 'last_30d';
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    const baseFields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas';

    // ── Insights por AD SET ───────────────────────────────────────────────
    if (scope === 'adsets') {
      const parent = body.campaign_id || accountId;
      const fields = `adset_name,adset_id,campaign_name,${baseFields}`;
      const url = `${base}/${parent}/insights?level=adset&date_preset=${datePreset}&fields=${fields}&limit=200&access_token=${t}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const adsets = (data.data || []).map(d => ({
        adset_id: d.adset_id, adset_name: d.adset_name, campaign_name: d.campaign_name, ...parseInsightRow(d),
      })).sort((a, b) => b.spend - a.spend);
      return Response.json({ ok: true, scope, date_preset: datePreset, count: adsets.length, adsets });
    }

    // ── Insights por ANUNCIO (creativo individual) ────────────────────────
    if (scope === 'ads') {
      const parent = body.campaign_id || accountId;
      const fields = `ad_name,ad_id,adset_name,campaign_name,${baseFields}`;
      const url = `${base}/${parent}/insights?level=ad&date_preset=${datePreset}&fields=${fields}&limit=300&access_token=${t}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const ads = (data.data || []).map(d => ({
        ad_id: d.ad_id, ad_name: d.ad_name, adset_name: d.adset_name, campaign_name: d.campaign_name, ...parseInsightRow(d),
      })).sort((a, b) => b.spend - a.spend);
      // Mejor y peor creativo por ROAS (con gasto significativo)
      const conGasto = ads.filter(a => a.spend > 1000);
      const mejor = [...conGasto].sort((a, b) => b.roas - a.roas)[0] || null;
      const peor = [...conGasto].sort((a, b) => a.roas - b.roas)[0] || null;
      return Response.json({ ok: true, scope, date_preset: datePreset, count: ads.length, ads, mejor_creativo: mejor, peor_creativo: peor });
    }

    // ── Breakdown demográfico / plataforma / dispositivo ──────────────────
    if (scope === 'breakdown') {
      const breakdown = body.breakdown || 'age,gender';
      const level = body.level === 'campaign' ? 'campaign' : 'account';
      const parent = (level === 'campaign' && body.campaign_id) ? body.campaign_id : accountId;
      const insLevel = level === 'campaign' ? 'campaign' : 'account';
      const url = `${base}/${parent}/insights?level=${insLevel}&date_preset=${datePreset}&breakdowns=${encodeURIComponent(breakdown)}&fields=${baseFields}&limit=500&access_token=${t}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const segments = (data.data || []).map(d => {
        const seg = {};
        breakdown.split(',').forEach(b => { seg[b] = d[b] ?? null; });
        return { ...seg, ...parseInsightRow(d) };
      }).sort((a, b) => b.spend - a.spend);
      return Response.json({ ok: true, scope, breakdown, date_preset: datePreset, count: segments.length, segments });
    }

    return Response.json({ ok: false, error: `scope no soportado: ${scope}. Usa 'adsets', 'ads' o 'breakdown'.` });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});