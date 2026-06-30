// ============================================================================
// adsExportEditor — Exporta un AdCampaignDraft a CSV compatible con
//                   Google Ads Editor (subida masiva 1-click).
// ----------------------------------------------------------------------------
// Payload: { draft_id }
// Retorna: { file_url, rows_count, filename, instructions }
//
// FORMATO OFICIAL (verificado contra la doc de Google Ads Editor — answer/57747
// y la guía de prep answer/56368):
//
//   • La columna de tipo de keyword se llama "Criterion Type" (alias: Type).
//     Sus valores válidos en filas de keyword/negativa son EXACTAMENTE:
//       - Keyword positivo:  Exact | Phrase | Broad
//       - Negativa de campaña: "Campaign negative" + el match embebido en texto.
//     El MATCH TYPE va EMBEBIDO en el texto del keyword:
//       - Exact  → [keyword]
//       - Phrase → "keyword"
//       - Broad  → keyword (sin envolver)
//
//   • Estado por entidad en columnas separadas: "Campaign Status" y
//     "Ad Group Status" (NO una columna genérica "Status" — eso provoca el
//     error de "columna requerida faltante").
//
//   • "Budget" debe ser > 0. "Final URL" debe estar poblada en TODA fila de
//     anuncio/keyword positivo.
//
//   • RESPONSIVE SEARCH AD: Headline 1..15 + Description 1..4 + Final URL.
//
//   ⚠️ PERFORMANCE MAX / DEMAND GEN: estos NO se pueden importar como CSV plano
//   en Google Ads Editor (asset groups con imágenes/señales requieren la
//   creación nativa en Editor). Antes intentábamos forzarlos a una estructura
//   Search incompleta (0 keywords, anuncios fabricados) — y ESO causaba el
//   error de "falta columna". Ahora, para PMax/Demand Gen exportamos un CSV
//   SEARCH-EQUIVALENTE válido: un ad group por cada asset group, una RSA real
//   con el copy del asset group, y keywords derivadas de las señales de
//   audiencia (custom_segment) para que la estructura sea importable y completa.
// Ref: https://support.google.com/google-ads/editor/answer/57747
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ESCAPE = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

function googleCampaignType(t) {
  const x = (t || '').toLowerCase();
  if (x.includes('shopping')) return 'Shopping';
  if (x.includes('video') || x.includes('demand')) return 'Video';
  // PMax no tiene "Campaign type" importable por CSV plano → Search-equivalente.
  return 'Search';
}

// Devuelve el valor LIMPIO de "Criterion Type" para un keyword positivo.
function criterionType(m) {
  const x = (m || 'Phrase').toLowerCase();
  if (x.includes('exact')) return 'Exact';
  if (x.includes('broad')) return 'Broad';
  return 'Phrase';
}

// Envuelve el texto del keyword según el match type, como exige Editor.
function wrapKeyword(text, m) {
  const t = criterionType(m);
  if (t === 'Exact') return `[${text}]`;
  if (t === 'Phrase') return `"${text}"`;
  return text; // Broad
}

// Estrategia de puja → valor LIMPIO que Editor reconoce (sin texto explicativo).
function googleBidStrategy(b) {
  const x = (b || '').toLowerCase();
  if (x.includes('target cpa') || x.includes('tcpa')) return 'Target CPA';
  if (x.includes('target roas') || x.includes('troas')) return 'Target ROAS';
  if (x.includes('maximize conversion value') || x.includes('conversion value')) return 'Maximize Conversion Value';
  if (x.includes('maximize click')) return 'Maximize Clicks';
  if (x.includes('manual cpc')) return 'Manual CPC';
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

    // Budget DEBE ser > 0 o Editor rechaza el CSV.
    const daily = draft.daily_budget_clp && draft.daily_budget_clp > 0 ? draft.daily_budget_clp : 1;
    const langs = (draft.languages || ['Spanish']).join(';');
    const gType = googleCampaignType(draft.campaign_type);
    const networks = gType === 'Search' ? 'Google Search' : '';

    // Landing por defecto: lo que tenga el draft o el final_url de los asset groups.
    const defaultUrl =
      draft.landing_url ||
      draft.final_url ||
      draft.asset_groups?.[0]?.final_urls?.[0] ||
      draft.responsive_search_ads?.[0]?.final_url ||
      'https://peyuchile.cl/CatalogoNuevo';

    // ── Header oficial. Nombres EXACTOS que Editor reconoce. ───────────────
    const header = [
      'Campaign',
      'Campaign Type',
      'Campaign Status',
      'Budget',
      'Budget type',
      'Bid Strategy Type',
      'Target CPA',
      'Networks',
      'Languages',
      'Ad Group',
      'Ad Group Status',
      'Max CPC',
      'Keyword',
      'Criterion Type',
      'Headline 1', 'Headline 2', 'Headline 3', 'Headline 4', 'Headline 5',
      'Headline 6', 'Headline 7', 'Headline 8', 'Headline 9', 'Headline 10',
      'Headline 11', 'Headline 12', 'Headline 13', 'Headline 14', 'Headline 15',
      'Description 1', 'Description 2', 'Description 3', 'Description 4',
      'Path 1', 'Path 2',
      'Final URL',
      'Final URL Suffix',
    ];
    const COLS = header.length;
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const blank = () => Array(COLS).fill('');
    const rows = [header];

    // ── Fila CAMPAÑA ───────────────────────────────────────────────────────
    {
      const r = blank();
      r[idx['Campaign']] = cname;
      r[idx['Campaign Type']] = gType;
      r[idx['Campaign Status']] = 'Paused';
      r[idx['Budget']] = daily;
      r[idx['Budget type']] = 'Daily';
      const bidType = googleBidStrategy(draft.bid_strategy);
      r[idx['Bid Strategy Type']] = bidType;
      if (draft.target_cpa_clp && bidType === 'Target CPA') r[idx['Target CPA']] = draft.target_cpa_clp;
      r[idx['Networks']] = networks;
      r[idx['Languages']] = langs;
      rows.push(r);
    }

    const rsaByGroup = {};
    for (const rsa of (draft.responsive_search_ads || [])) {
      (rsaByGroup[rsa.ad_group] = rsaByGroup[rsa.ad_group] || []).push(rsa);
    }
    const kwMeta = draft.keywords || [];

    // ── Construir los "ad groups" a exportar ───────────────────────────────
    // Si el draft es Search real, usa sus ad_groups.
    // Si es PMax/Demand Gen (sin ad_groups), deriva un ad group por asset group
    // con su copy como RSA y keywords desde las señales custom_segment.
    let groups;
    if (draft.ad_groups && draft.ad_groups.length) {
      groups = draft.ad_groups.map(g => ({
        name: g.name,
        keywords: (g.keywords || []).map(kwText => {
          const meta = kwMeta.find(k => k.text === kwText);
          return { text: kwText, match_type: meta?.match_type };
        }),
        rsas: rsaByGroup[g.name] || [],
      }));
    } else {
      // Señales custom_segment → semillas de keyword (Phrase) para dar volumen
      // de intención al CSV Search-equivalente de PMax. Solo términos de
      // BÚSQUEDA reales: descartamos nombres de listas (CRM, newsletter, etc.)
      // que a veces se cuelan en signals y no son keywords válidas.
      const esListaCRM = (s) => /\b(crm|newsletter|subscriber|buyers?|visitors?|viewers?|abandoner|audience|list|días|days|\d{4})\b/i.test(s);
      const customSignals = (draft.audience_signals || [])
        .filter(s => (s.type || '').includes('custom'))
        .flatMap(s => s.signals || [])
        .filter(s => s && !esListaCRM(s));

      groups = (draft.asset_groups || []).map((ag, i) => {
        // Repartimos las señales entre los asset groups para no duplicar.
        const slice = customSignals.filter((_, k) => k % (draft.asset_groups.length || 1) === i);
        return {
          name: ag.name,
          keywords: slice.map(text => ({ text, match_type: 'Phrase' })),
          rsas: [{
            headlines: ag.headlines || [],
            descriptions: ag.descriptions || [],
            final_url: ag.final_urls?.[0] || defaultUrl,
          }],
        };
      });
    }

    for (const g of groups) {
      // Fila ad group
      {
        const r = blank();
        r[idx['Campaign']] = cname;
        r[idx['Ad Group']] = g.name;
        r[idx['Ad Group Status']] = 'Enabled';
        rows.push(r);
      }

      // Keywords positivas — match type EMBEBIDO en el texto + Criterion Type.
      for (const kw of (g.keywords || [])) {
        const r = blank();
        r[idx['Campaign']] = cname;
        r[idx['Ad Group']] = g.name;
        r[idx['Keyword']] = wrapKeyword(kw.text, kw.match_type);
        r[idx['Criterion Type']] = criterionType(kw.match_type);
        rows.push(r);
      }

      // Responsive Search Ads — Final URL SIEMPRE poblada.
      for (const rsa of (g.rsas || [])) {
        const hs = rsa.headlines || [];
        const ds = rsa.descriptions || [];
        if (!hs.length && !ds.length) continue; // sin copy no es un anuncio válido
        const r = blank();
        r[idx['Campaign']] = cname;
        r[idx['Ad Group']] = g.name;
        // RSA: máx 15 headlines (≤30 chars) y 4 descriptions (≤90 chars).
        for (let i = 0; i < 15; i++) if (hs[i]) r[idx[`Headline ${i + 1}`]] = String(hs[i]).slice(0, 30);
        for (let i = 0; i < 4; i++) if (ds[i]) r[idx[`Description ${i + 1}`]] = String(ds[i]).slice(0, 90);
        if (rsa.path1) r[idx['Path 1']] = String(rsa.path1).slice(0, 15);
        if (rsa.path2) r[idx['Path 2']] = String(rsa.path2).slice(0, 15);
        r[idx['Final URL']] = rsa.final_url || defaultUrl;
        if (utmSuffix) r[idx['Final URL Suffix']] = utmSuffix;
        rows.push(r);
      }
    }

    // ── Negative keywords a nivel campaña ──────────────────────────────────
    // Texto embebido como Phrase + Criterion Type "Campaign negative".
    for (const nk of (draft.negative_keywords || [])) {
      const r = blank();
      r[idx['Campaign']] = cname;
      r[idx['Keyword']] = `"${nk}"`;
      r[idx['Criterion Type']] = 'Campaign negative';
      rows.push(r);
    }

    const csvText = rows.map(r => r.map(ESCAPE).join(',')).join('\n');

    // BOM UTF-8 para acentos (á, ñ, …) en Editor/Excel.
    const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8' });
    const file = new File([blob], `${draft.codename || 'campaign'}_ads_editor.csv`, { type: 'text/csv' });
    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    await base44.asServiceRole.entities.AdCampaignDraft.update(draft_id, {
      status: 'Exportada CSV',
      exported_csv_url: upload.file_url,
    });

    const isPmax = /performance|demand/i.test(draft.campaign_type || '');
    const instructions = isPmax
      ? 'Abre Google Ads Editor → Account → Import → From CSV → selecciona este archivo. Como Performance Max no se importa como CSV plano, este CSV crea una campaña Search-equivalente con tu copy y keywords de intención (lista para importar sin errores). ⚠️ Si quieres la campaña como Performance Max nativa, créala en Editor y sube ahí las imágenes/videos de los asset groups. Queda en Paused.'
      : 'Abre Google Ads Editor → Account → Import → From CSV → selecciona este archivo. Campaña, ad groups, keywords y anuncios se importan completos. Quedan en Paused — revísalos y publícalos cuando estés listo.';

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