// ============================================================================
// gscTopKeywords · Top queries reales de peyuchile.cl según Google Search Console
// ----------------------------------------------------------------------------
// Pide a GSC las queries con más impresiones de los últimos N días (default 28)
// y devuelve métricas + clasificación por posición:
//   - TOP 3      → palabras donde estamos campeón
//   - TOP 4-10   → ya en primera página
//   - TOP 11-20  → segunda página (mover a 1ra es ganancia rápida)
//   - TOP 21-50  → con potencial, requieren trabajo SEO
//   - +50        → fondo, ignorar salvo alto volumen
//
// Reusable: el frontend manda { days, limit, country }.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const days = Math.min(Math.max(parseInt(body.days || 28, 10), 1), 90);
    const limit = Math.min(Math.max(parseInt(body.limit || 50, 10), 5), 500);
    const country = (body.country || 'chl').toLowerCase(); // ISO-3166 alpha-3
    const site = body.site || 'sc-domain:peyuchile.cl';

    // Ventana de fechas (formato YYYY-MM-DD que pide GSC)
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 3600 * 1000);
    const fmt = d => d.toISOString().slice(0, 10);

    // Obtener token de GSC (shared connector)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    // Llamada a Search Analytics API
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
    const queryBody = {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['query'],
      rowLimit: limit,
      dataState: 'all',
    };
    if (country && country !== 'all') {
      queryBody.dimensionFilterGroups = [{
        filters: [{ dimension: 'country', operator: 'equals', expression: country }],
      }];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('GSC error', res.status, errText);
      return Response.json({ error: `GSC API ${res.status}: ${errText}` }, { status: 500 });
    }

    const gscData = await res.json();
    const rows = gscData.rows || [];

    // Normalizar + clasificar por posición
    const keywords = rows.map(r => {
      const query = r.keys?.[0] || '';
      const position = r.position || 999;
      let bucket = 'fondo';
      if (position <= 3) bucket = 'top3';
      else if (position <= 10) bucket = 'top10';
      else if (position <= 20) bucket = 'top20';
      else if (position <= 50) bucket = 'top50';
      return {
        query,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position,
        bucket,
      };
    });

    // Resumen por bucket
    const summary = {
      top3:   keywords.filter(k => k.bucket === 'top3').length,
      top10:  keywords.filter(k => k.bucket === 'top10').length,
      top20:  keywords.filter(k => k.bucket === 'top20').length,
      top50:  keywords.filter(k => k.bucket === 'top50').length,
      fondo:  keywords.filter(k => k.bucket === 'fondo').length,
    };
    const totals = {
      clicks: keywords.reduce((s, k) => s + k.clicks, 0),
      impressions: keywords.reduce((s, k) => s + k.impressions, 0),
      avg_position: keywords.length
        ? keywords.reduce((s, k) => s + k.position, 0) / keywords.length
        : 0,
    };

    return Response.json({
      ok: true,
      site,
      country,
      window_days: days,
      start_date: fmt(startDate),
      end_date: fmt(endDate),
      total_queries: keywords.length,
      summary,
      totals,
      keywords,
    });
  } catch (error) {
    console.error('gscTopKeywords error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});