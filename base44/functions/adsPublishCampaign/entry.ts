// ============================================================================
// adsPublishCampaign — Publicación híbrida de campañas Google Ads v23.1 (2026)
// ----------------------------------------------------------------------------
// FLUJO HÍBRIDO:
//   1. Verifica si tenemos las 5 credenciales Google Ads en env:
//      - GOOGLE_ADS_DEVELOPER_TOKEN
//      - GOOGLE_ADS_CLIENT_ID
//      - GOOGLE_ADS_CLIENT_SECRET
//      - GOOGLE_ADS_REFRESH_TOKEN
//      - GOOGLE_ADS_CUSTOMER_ID
//   2. Si TODAS están presentes → intenta publicar vía Google Ads REST API v23.1
//   3. Si FALTA alguna o falla la publicación → cae automáticamente a CSV export
//   4. Retorna { mode: 'api' | 'csv_fallback', ... } para que la UI sepa qué pasó
//
// CUANDO TENGAS LAS CREDENCIALES:
//   - Pídelas en el dashboard de Base44 (Secrets) sin tocar código.
//   - Esta función las detectará automáticamente en el próximo invoke.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GOOGLE_ADS_API_VERSION = 'v23';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCreds() {
  const developer_token  = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  const client_id        = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const client_secret    = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
  const refresh_token    = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
  const customer_id      = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
  const login_customer_id= Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID'); // opcional (MCC)

  const missing = [];
  if (!developer_token) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!client_id) missing.push('GOOGLE_ADS_CLIENT_ID');
  if (!client_secret) missing.push('GOOGLE_ADS_CLIENT_SECRET');
  if (!refresh_token) missing.push('GOOGLE_ADS_REFRESH_TOKEN');
  if (!customer_id) missing.push('GOOGLE_ADS_CUSTOMER_ID');

  return {
    ok: missing.length === 0,
    missing,
    creds: { developer_token, client_id, client_secret, refresh_token, customer_id, login_customer_id }
  };
}

// Intercambia refresh_token por access_token vía OAuth2 de Google
async function getAccessToken({ client_id, client_secret, refresh_token }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth refresh failed: ${res.status} — ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

// Helper para hacer requests a la Google Ads REST API
async function adsApiCall(path, { method = 'POST', body, creds, accessToken }) {
  const url = `${GOOGLE_ADS_API_BASE}${path}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': creds.developer_token,
    'Content-Type': 'application/json',
  };
  if (creds.login_customer_id) {
    headers['login-customer-id'] = creds.login_customer_id;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  if (!res.ok) {
    throw new Error(`Google Ads API ${res.status}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
  }
  return parsed;
}

// ── Publicación real de campaña vía Google Ads API v23.1 ────────────────────
// Estrategia: hacemos un mutate compuesto con campaign budget + campaign + (ad_groups | asset_groups)
async function publishToGoogleAds({ draft, creds }) {
  const accessToken = await getAccessToken(creds);
  const customerId = creds.customer_id.replace(/-/g, '');

  // 1. Crear Campaign Budget
  const budgetTempId = '-1';
  const campaignTempId = '-2';
  const dailyBudgetClp = draft.daily_budget_clp || 25000;
  // Google Ads usa micros (1 CLP = 1_000_000 micros para CLP)
  const budgetMicros = String(Math.round(dailyBudgetClp * 1_000_000));

  // Mapping de campaign_type → Google Ads channel + sub_type
  const typeMap = {
    'Search':           { channel_type: 'SEARCH' },
    'Performance Max':  { channel_type: 'PERFORMANCE_MAX' },
    'Demand Gen':       { channel_type: 'DEMAND_GEN' },
    'Shopping':         { channel_type: 'SHOPPING' },
    'Display':          { channel_type: 'DISPLAY' },
    'Video':            { channel_type: 'VIDEO' },
  };
  const channelConfig = typeMap[draft.campaign_type] || typeMap['Search'];

  // Mapping de bid_strategy
  const bidStrategyMap = {
    'Maximize Conversions':        { maximize_conversions: {} },
    'Maximize Conversion Value':   { maximize_conversion_value: {} },
    'Target CPA':                  { target_cpa: { target_cpa_micros: String((draft.target_cpa_clp || 5000) * 1_000_000) } },
    'Target ROAS':                 { target_roas: { target_roas: (draft.target_roas_pct || 400) / 100 } },
    'Maximize Clicks':             { target_spend: {} },
    'Manual CPC':                  { manual_cpc: { enhanced_cpc_enabled: true } },
  };
  const bidStrategy = bidStrategyMap[draft.bid_strategy] || bidStrategyMap['Maximize Conversions'];

  const operations = [
    // Budget
    {
      campaign_budget_operation: {
        create: {
          resource_name: `customers/${customerId}/campaignBudgets/${budgetTempId}`,
          name: `${draft.campaign_name} - Budget`,
          amount_micros: budgetMicros,
          delivery_method: 'STANDARD',
          explicit_shared: false,
        }
      }
    },
    // Campaign
    {
      campaign_operation: {
        create: {
          resource_name: `customers/${customerId}/campaigns/${campaignTempId}`,
          name: draft.campaign_name,
          status: 'PAUSED', // SIEMPRE pausada al crear — el usuario la activa manualmente
          advertising_channel_type: channelConfig.channel_type,
          campaign_budget: `customers/${customerId}/campaignBudgets/${budgetTempId}`,
          ...bidStrategy,
        }
      }
    },
  ];

  // El endpoint googleAds:mutate permite operaciones cross-resource en una sola llamada
  const result = await adsApiCall(`/customers/${customerId}/googleAds:mutate`, {
    body: { mutate_operations: operations },
    creds,
    accessToken,
  });

  // Extraer resource_name de la campaña creada
  const campaignResult = result.mutate_operation_responses?.find(r => r.campaign_result);
  const campaignResourceName = campaignResult?.campaign_result?.resource_name;
  // resource_name = "customers/{cid}/campaigns/{campaign_id}"
  const campaignId = campaignResourceName?.split('/').pop();

  return {
    campaign_id: campaignId,
    resource_name: campaignResourceName,
    api_version: GOOGLE_ADS_API_VERSION,
    note: 'Campaña creada en estado PAUSED. Revisa en ads.google.com y actívala manualmente.',
    warning: 'Solo se publicó la campaña base + budget. Ad groups, keywords y asset groups deben crearse en pasos siguientes (no implementados aún en MVP) o vía CSV import.',
  };
}

// ── Handler principal ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo admin puede publicar a Google Ads' }, { status: 403 });
    }

    const { draft_id, force_csv = false } = await req.json();
    if (!draft_id) {
      return Response.json({ error: 'draft_id requerido' }, { status: 400 });
    }

    const draft = await base44.asServiceRole.entities.AdCampaignDraft.get(draft_id);
    if (!draft) {
      return Response.json({ error: 'Draft no encontrado' }, { status: 404 });
    }

    // ── Modo 1: usuario forzó CSV o faltan credenciales → CSV fallback
    const credCheck = getCreds();
    if (force_csv || !credCheck.ok) {
      const csvRes = await base44.functions.invoke('adsExportEditor', { draft_id });
      return Response.json({
        success: true,
        mode: 'csv_fallback',
        reason: force_csv
          ? 'Usuario solicitó modo CSV'
          : `Faltan credenciales Google Ads: ${credCheck.missing.join(', ')}. Configúralas en Secrets para publicación directa.`,
        missing_secrets: credCheck.missing,
        file_url: csvRes.data?.file_url,
        instructions: 'Descarga el CSV y súbelo a Google Ads Editor (File → Import → From file).',
      });
    }

    // ── Modo 2: tenemos credenciales → intentar publicación real
    try {
      const apiResult = await publishToGoogleAds({ draft, creds: credCheck.creds });

      // Persistir resultado en el draft
      await base44.asServiceRole.entities.AdCampaignDraft.update(draft_id, {
        status: 'Subida a Ads',
        google_ads_campaign_id: apiResult.campaign_id,
        google_ads_resource_name: apiResult.resource_name,
        api_version_used: apiResult.api_version,
        launched_at: new Date().toISOString(),
      });

      return Response.json({
        success: true,
        mode: 'api',
        ...apiResult,
        manage_url: `https://ads.google.com/aw/campaigns?campaignId=${apiResult.campaign_id}`,
      });
    } catch (apiError) {
      console.error('[adsPublishCampaign] API failed, falling back to CSV:', apiError.message);
      // Fallback automático si la API falla
      const csvRes = await base44.functions.invoke('adsExportEditor', { draft_id });
      return Response.json({
        success: true,
        mode: 'csv_fallback',
        reason: `Google Ads API falló: ${apiError.message}. Generamos CSV como fallback.`,
        api_error: apiError.message,
        file_url: csvRes.data?.file_url,
      });
    }
  } catch (error) {
    console.error('[adsPublishCampaign] fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});