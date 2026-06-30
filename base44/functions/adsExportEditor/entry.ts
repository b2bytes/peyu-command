// ============================================================================
// adsExportEditor — Exporta un AdCampaignDraft a CSV compatible con
//                   Google Ads Editor (subida masiva 1-click).
// ----------------------------------------------------------------------------
// Payload: { draft_id }
// Retorna: { file_url, csv_text, rows_count }
//
// FORMATO CORRECTO (confirmado contra la doc oficial de Google Ads Editor):
//   • Cada fila describe UNA sola entidad (campaña / ad group / keyword / ad).
//   • Los headers deben ser los NOMBRES OFICIALES en inglés. En particular:
//       - NO existe la columna "Status" a secas. Google exige columnas de
//         estado SEPARADAS por entidad: "Campaign Status", "Ad Group Status".
//         (Este era el bug del "falta una columna" — Editor no reconocía
//          "Status" y abortaba la importación.)
//       - El tipo de keyword/negativa va en UNA sola columna "Type"
//         (no "Criterion Type" + "Match type" por separado).
//       - Responsive Search Ad usa "Headline 1..15" + "Description 1..4".
//   • Performance Max / Demand Gen NO se importan vía este CSV de Editor
//     (los asset groups con imágenes requieren la subida nativa de Editor).
//     Para esos tipos generamos un CSV de Search-equivalente con el copy de
//     texto, y avisamos al usuario que los visuales se cargan en Editor.
// Ref: https://support.google.com/google-ads/editor/answer/57747
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ESCAPE = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

// Mapea el tipo de campaña interno al valor oficial que Editor reconoce.
function googleCampaignType(t) {
  const x = (t || '').toLowerCase();
  if (x.includes('shopping')) return 'Shopping';
  if (x.includes('video') || x.includes('demand')) return 'Video';
  // PMax no tiene valor de "Campaign type" importable por CSV plano →
  // lo tratamos como Search para que el copy de texto se importe igual.
  return 'Search';
}

function googleMatchType(m) {
  const x = (m || 'Phrase').toLowerCase();
  if (x.includes('exact')) return 'Exact';
  if (x.includes('broad')) return 'Broad';
  return 'Phrase';
}

// Normaliza la estrategia de puja al valor LIMPIO que Editor reconoce.
// El draft a veces trae texto explicativo entre paréntesis ("Maximize
// Conversions (Smart Bidding con Exploration…)") que Editor rechaza.
function googleBidStrategy(b) {
  const x = (b || '').toLowerCase();
  if (x.includes('target cpa') || x.includes('tcpa')) return 'Target CPA';
  if (x.includes('target roas') || x.includes('troas')) return 'Target ROAS';
  if (x.includes('maximize conversion value') || x.includes('conversion value')) return 'Maximize Conversion Value';
  if (x.includes('maximize click')) return 'Maximize Clicks';
  if (x.includes('manual cpc')) return 'Manual CPC';
  // Por defecto (y para cualquier variante de "maximize conversions").
  return 'Maximize Conversions';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { draft_id } = await req.json();
    if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

    const draft = await base44.asServiceRole.entities.AdCampaignDraft.get(draft_id);
    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });

    const cname = draft.campaign_name;
    const utm = draft.utm_params || {};
    const utmSuffix = [utm.utm_source && `utm_source=${utm.utm_source}`,
                       utm.utm_medium && `utm_medium=${utm.utm_medium}`,
                       utm.utm_campaign && `utm_campaign=${utm.utm_campaign}`]
                      .filter(Boolean).join('&');

    const daily = draft.daily_budget_clp || 0;
    const langs = (draft.languages || ['Spanish']).join(';');
    const networks = googleCampaignType(draft.campaign_type) === 'Search'
      ? 'Google Search' : '';

    // ── Header oficial. Nombres EXACTOS reconocidos por Google Ads Editor.
    //    Cada entidad usa su propia columna de estado (Campaign/Ad Group),
    //    y "Type" unifica match type + negativas. ─────────────────────────
    const header = [
      'Campaign',
      'Campaign Type',
      'Campaign Status',
      'Campaign Daily Budget',
      'Bid Strategy Type',
      'Target CPA',
      'Networks',
      'Languages',
      'Ad Group',
      'Ad Group Status',
      'Max CPC',
      'Keyword',
      'Type',
      'Headline 1', 'Headline 2', 'Headline 3', 'Headline 4', 'Headline 5',
      'Headline 6', 'Headline 7', 'Headline 8', 'Headline 9', 'Headline 10',
      'Headline 11', 'Headline 12', 'Headline 13', 'Headline 14', 'Headline 15',
      'Description 1', 'Description 2', 'Description 3', 'Description 4',
      'Path 1', 'Path 2',
      'Final URL',
      'Final URL Suffix',
    ];
    const COLS = header.length;

    // Crea una fila vacía y rellena por nombre de columna (robusto a cambios).
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const blank = () => Array(COLS).fill('');
    const rows = [header];

    // ── Fila 1: la CAMPAÑA ─────────────────────────────────────────────────
    {
      const r = blank();
      r[idx['Campaign']] = cname;
      r[idx['Campaign Type']] = googleCampaignType(draft.campaign_type);
      r[idx['Campaign Status']] = 'Paused';
      r[idx['Campaign Daily Budget']] = daily;
      const bidType = googleBidStrategy(draft.bid_strategy);
      r[idx['Bid Strategy Type']] = bidType;
      // Target CPA solo aplica con estrategia Target CPA.
      if (draft.target_cpa_clp && bidType === 'Target CPA') r[idx['Target CPA']] = draft.target_cpa_clp;
      r[idx['Networks']] = networks;
      r[idx['Languages']] = langs;
      rows.push(r);
    }

    // ── Ad groups: la fuente de verdad es draft.ad_groups; sus RSAs y
    //    keywords se enganchan por nombre del ad group. ─────────────────────
    const rsaByGroup = {};
    for (const rsa of (draft.responsive_search_ads || [])) {
      (rsaByGroup[rsa.ad_group] = rsaByGroup[rsa.ad_group] || []).push(rsa);
    }
    const kwMeta = draft.keywords || [];

    // Para PMax/Demand Gen no hay ad_groups con keywords: usamos asset_groups
    // como "ad groups" para volcar el copy de texto (headlines/descriptions).
    const groups = (draft.ad_groups && draft.ad_groups.length)
      ? draft.ad_groups
      : (draft.asset_groups || []).map(ag => ({
          name: ag.name,
          keywords: [],
          _assetHeadlines: ag.headlines || [],
          _assetDescriptions: ag.descriptions || [],
        }));

    for (const g of groups) {
      const agName = g.name;

      // Fila del ad group
      {
        const r = blank();
        r[idx['Campaign']] = cname;
        r[idx['Ad Group']] = agName;
        r[idx['Ad Group Status']] = 'Enabled';
        rows.push(r);
      }

      // Keywords del ad group
      for (const kwText of (g.keywords || [])) {
        const meta = kwMeta.find(k => k.text === kwText);
        const r = blank();
        r[idx['Campaign']] = cname;
        r[idx['Ad Group']] = agName;
        r[idx['Keyword']] = kwText;
        r[idx['Type']] = googleMatchType(meta?.match_type);
        rows.push(r);
      }

      // Responsive Search Ads del grupo
      const rsas = rsaByGroup[agName] || [];
      // Si no hay RSA explícito pero el asset group trae copy, fabricamos uno.
      if (!rsas.length && (g._assetHeadlines?.length || g._assetDescriptions?.length)) {
        rsas.push({
          headlines: g._assetHeadlines,
          descriptions: g._assetDescriptions,
          final_url: draft.landing_url || draft.final_url,
        });
      }
      for (const rsa of rsas) {
        const r = blank();
        r[idx['Campaign']] = cname;
        r[idx['Ad Group']] = agName;
        const hs = rsa.headlines || [];
        const ds = rsa.descriptions || [];
        for (let i = 0; i < 15; i++) if (hs[i]) r[idx[`Headline ${i + 1}`]] = hs[i];
        for (let i = 0; i < 4; i++) if (ds[i]) r[idx[`Description ${i + 1}`]] = ds[i];
        if (rsa.path1) r[idx['Path 1']] = rsa.path1;
        if (rsa.path2) r[idx['Path 2']] = rsa.path2;
        r[idx['Final URL']] = rsa.final_url || draft.landing_url || draft.final_url || '';
        if (utmSuffix) r[idx['Final URL Suffix']] = utmSuffix;
        rows.push(r);
      }
    }

    // ── Negative keywords a nivel campaña ──────────────────────────────────
    for (const nk of (draft.negative_keywords || [])) {
      const r = blank();
      r[idx['Campaign']] = cname;
      r[idx['Keyword']] = nk;
      r[idx['Type']] = 'Campaign negative';
      rows.push(r);
    }

    const csvText = rows.map(r => r.map(ESCAPE).join(',')).join('\n');

    // BOM UTF-8 para que Editor/Excel lean bien los acentos (á, ñ, …).
    const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8' });
    const file = new File([blob], `${draft.codename || 'campaign'}_ads_editor.csv`, { type: 'text/csv' });
    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    await base44.asServiceRole.entities.AdCampaignDraft.update(draft_id, {
      status: 'Exportada CSV',
      exported_csv_url: upload.file_url,
    });

    const isPmax = /performance|demand/i.test(draft.campaign_type || '');
    const instructions = isPmax
      ? 'Abre Google Ads Editor → File → Import → From file → selecciona este CSV. Importa la estructura y el copy de texto. ⚠️ Performance Max / Demand Gen: las imágenes y videos del asset group se suben directo en Editor (no viajan por CSV). Las campañas quedan en Paused.'
      : 'Abre Google Ads Editor → File → Import → From file → selecciona este CSV. La campaña, ad groups, keywords y anuncios se importan completos. Quedan en Paused — revísalos y publícalos cuando estés listo.';

    return Response.json({
      success: true,
      file_url: upload.file_url,
      rows_count: rows.length,
      filename: file.name,
      instructions,
    });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});