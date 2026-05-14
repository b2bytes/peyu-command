// ============================================================================
// adsExportEditor — Exporta un AdCampaignDraft a CSV compatible con
//                   Google Ads Editor (subida masiva 1-click).
// ----------------------------------------------------------------------------
// Payload: { draft_id }
// Retorna: { file_url, csv_text, rows }
// Sube el CSV a filestorage público y devuelve la URL.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CSV export siguiendo las columnas estándar de Google Ads Editor.
// Ref: https://support.google.com/google-ads/editor/answer/52370
const ESCAPE = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { draft_id } = await req.json();
    if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

    const drafts = await base44.asServiceRole.entities.AdCampaignDraft.filter({ id: draft_id });
    const draft = drafts[0];
    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });

    const cname = draft.campaign_name;
    const utm = draft.utm_params || {};
    const utmSuffix = [utm.utm_source && `utm_source=${utm.utm_source}`,
                       utm.utm_medium && `utm_medium=${utm.utm_medium}`,
                       utm.utm_campaign && `utm_campaign=${utm.utm_campaign}`]
                      .filter(Boolean).join('&');

    const rows = [];
    const header = [
      'Campaign', 'Campaign type', 'Status', 'Budget', 'Bid strategy type',
      'Target CPA', 'Networks', 'Languages', 'Location', 'Ad group', 'Ad group status',
      'Keyword', 'Criterion Type', 'Match type', 'Headline 1', 'Headline 2', 'Headline 3',
      'Headline 4', 'Headline 5', 'Headline 6', 'Headline 7', 'Headline 8', 'Headline 9',
      'Headline 10', 'Headline 11', 'Headline 12', 'Headline 13', 'Headline 14', 'Headline 15',
      'Description 1', 'Description 2', 'Description 3', 'Description 4',
      'Path 1', 'Path 2', 'Final URL', 'Final URL suffix', 'Ad type',
      'Sitelink text', 'Sitelink description 1', 'Sitelink description 2', 'Sitelink final URL',
      'Callout text', 'Snippet header', 'Snippet values'
    ];
    rows.push(header);

    const daily = draft.daily_budget_clp || 0;
    const locs = (draft.locations || ['Chile']).join(';');
    const langs = (draft.languages || ['Spanish']).join(';');

    // Row 1: Campaign itself
    rows.push([cname, draft.campaign_type || 'Search', 'Paused', daily,
      draft.bid_strategy || 'Maximize Conversions', draft.target_cpa_clp || '',
      'Google search', langs, locs, '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);

    // Ad groups + keywords + ads
    for (const rsa of (draft.responsive_search_ads || [])) {
      const ag = rsa.ad_group;
      const headlines = rsa.headlines || [];
      const descriptions = rsa.descriptions || [];
      const hArr = Array.from({ length: 15 }, (_, i) => headlines[i] || '');
      const dArr = Array.from({ length: 4 }, (_, i) => descriptions[i] || '');

      // Ad group row
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', ag, 'Enabled',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

      // Keywords for this ad group
      const kwsForGroup = (draft.ad_groups || []).find(a => a.name === ag)?.keywords || [];
      const draftKwMeta = draft.keywords || [];
      for (const kwText of kwsForGroup) {
        const meta = draftKwMeta.find(k => k.text === kwText);
        rows.push([cname, '', 'Paused', '', '', '', '', '', '', ag, '',
          kwText, 'Keyword', meta?.match_type || 'Phrase',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      }

      // Responsive Search Ad row
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', ag, '',
        '', '', '',
        ...hArr,
        ...dArr,
        rsa.path1 || '', rsa.path2 || '', rsa.final_url || '', utmSuffix,
        'Responsive search ad', '', '', '', '', '', '', '']);
    }

    // Negative keywords (campaign-level)
    for (const nk of (draft.negative_keywords || [])) {
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', '', '',
        nk, 'Negative keyword', 'Broad',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    }

    // Asset Groups (Performance Max + Demand Gen)
    // Google Ads Editor importa asset groups con su set de assets en filas separadas.
    for (const ag of (draft.asset_groups || [])) {
      const agName = ag.name;
      // Fila del asset group
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', agName, 'Enabled',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

      // Headlines como assets de texto
      for (const h of (ag.headlines || [])) {
        rows.push([cname, '', 'Paused', '', '', '', '', '', '', agName, '',
          '', '', '', h, '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', 'Headline asset', '', '', '', '', '', '', '']);
      }
      // Long headlines
      for (const lh of (ag.long_headlines || [])) {
        rows.push([cname, '', 'Paused', '', '', '', '', '', '', agName, '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          lh, '', '', '', '', '', '', 'Long headline asset', '', '', '', '', '', '', '']);
      }
      // Descriptions
      for (const d of (ag.descriptions || [])) {
        rows.push([cname, '', 'Paused', '', '', '', '', '', '', agName, '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          d, '', '', '', '', '', '', 'Description asset', '', '', '', '', '', '', '']);
      }
      // Image URLs (Google Ads Editor importa por URL externa)
      for (const img of (ag.image_urls || [])) {
        rows.push([cname, '', 'Paused', '', '', '', '', '', '', agName, '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', img, utmSuffix, 'Image asset', '', '', '', '', '', '', '']);
      }
      // Business name + CTA como callout-like
      if (ag.business_name) {
        rows.push([cname, '', 'Paused', '', '', '', '', '', '', agName, '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', 'Business name', '', '', '', '', ag.business_name, '', '']);
      }
    }

    // Sitelinks
    for (const sl of (draft.sitelinks || [])) {
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', 'Sitelink',
        sl.text || '', sl.description1 || '', sl.description2 || '', sl.url || '', '', '', '']);
    }

    // Callouts
    for (const co of (draft.callouts || [])) {
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', 'Callout',
        '', '', '', '', co, '', '']);
    }

    // Structured snippets
    for (const sn of (draft.structured_snippets || [])) {
      rows.push([cname, '', 'Paused', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', 'Structured snippet',
        '', '', '', '', '', sn.header || '', (sn.values || []).join(';')]);
    }

    const csvText = rows.map(r => r.map(ESCAPE).join(',')).join('\n');

    // Subir CSV como archivo
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
    const file = new File([blob], `${draft.codename || 'campaign'}_ads_editor.csv`, { type: 'text/csv' });
    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    await base44.asServiceRole.entities.AdCampaignDraft.update(draft_id, {
      status: 'Exportada CSV',
      exported_csv_url: upload.file_url,
    });

    return Response.json({
      success: true,
      file_url: upload.file_url,
      rows_count: rows.length,
      filename: file.name,
      instructions: 'Abre Google Ads Editor → File → Import → From file → selecciona este CSV. Las campañas quedan en Paused (lo defines antes de publicar).',
    });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});