// ============================================================================
// optimizeProductSEOCRON — Optimización diaria de SEO de páginas de producto
// ----------------------------------------------------------------------------
// Pipeline:
//   1. Lee productos activos del catálogo
//   2. Cruza con Google Search Console (clicks, impresiones, CTR, posición, queries)
//   3. Cruza con Google Analytics 4 (sessions, engagement)
//   4. Calcula un score SEO compuesto
//   5. Detecta páginas underperforming (alta impresión + bajo CTR / baja posición)
//   6. Genera meta-title y meta-description optimizados con IA
//   7. Guarda en la entidad Producto (campos seo_*)
//
// Triggered: CRON diario · también invocable manual con { force: true } para
// regenerar todos los productos sin filtro.
//
// Payload (manual):
//   { site_url?: "https://peyuchile.cl/", limit?: 30, force?: false }
//
// Solo admin puede invocar manualmente. El CRON usa service role.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_SITE = 'https://peyuchile.cl/';
const BATCH_LIMIT_DEFAULT = 30; // máx productos optimizados por corrida (control de costo IA)
const DAYS_LOOKBACK = 28;

// Heurística de salud SEO según posición + CTR + sessions
function classifyHealth({ position, ctr_pct, sessions }) {
  if (!position || position === 0) return 'no_data';
  if (position <= 3 && ctr_pct >= 5) return 'excellent';
  if (position <= 10 && ctr_pct >= 2) return 'good';
  if (position <= 20) return 'needs_work';
  return 'underperforming';
}

// Score 0-100. Penaliza posiciones bajas, premia CTR y sessions.
function computeScore({ position, ctr_pct, sessions, impressions }) {
  if (!impressions || impressions < 10) return 0;
  const posScore = position > 0 ? Math.max(0, 50 - (position - 1) * 2) : 0; // 50 en pos 1
  const ctrScore = Math.min(30, (ctr_pct || 0) * 3); // 30 si CTR≥10%
  const sesScore = Math.min(20, Math.log10((sessions || 0) + 1) * 7); // log
  return Math.round(posScore + ctrScore + sesScore);
}

// Decide si vale la pena re-generar meta tags hoy:
//   - force=true → siempre
//   - sin meta_title aún → sí
//   - underperforming + no se optimizó hace ≥7d → sí
//   - excellent → solo cada 30d
function shouldOptimize({ producto, health, force }) {
  if (force) return true;
  if (!producto.seo_meta_title) return true;
  const lastAt = producto.seo_optimized_at ? new Date(producto.seo_optimized_at) : null;
  const daysSince = lastAt ? (Date.now() - lastAt.getTime()) / (1000 * 60 * 60 * 24) : 999;
  if (health === 'underperforming' && daysSince >= 7) return true;
  if (health === 'needs_work' && daysSince >= 14) return true;
  if (health === 'good' && daysSince >= 30) return true;
  if (health === 'excellent' && daysSince >= 60) return true;
  return false;
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Si viene por trigger CRON, no hay user → permitido (auto-ejecución).
    // Si viene de un humano, exigimos rol admin.
    let isCronInvocation = !!body?.event?.type;
    if (!isCronInvocation) {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
      }
    }

    const siteUrl = body.site_url || DEFAULT_SITE;
    const limit = Number(body.limit) || BATCH_LIMIT_DEFAULT;
    const force = !!body.force;

    // ── 1. Productos activos ────────────────────────────────────────
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 500);
    if (!productos.length) {
      return Response.json({ ok: true, message: 'No active products' });
    }

    // ── 2. GSC: páginas con queries (28d) ───────────────────────────
    const { accessToken: gscToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const today = new Date();
    const start = new Date(today.getTime() - DAYS_LOOKBACK * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const siteEnc = encodeURIComponent(siteUrl);

    // Páginas top con clicks/impresiones
    const pagesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gscToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(today),
        dimensions: ['page'],
        rowLimit: 500,
      }),
    });
    const pagesData = pagesRes.ok ? await pagesRes.json() : { rows: [] };
    const pageMetrics = new Map(); // page → metrics
    for (const r of (pagesData.rows || [])) {
      pageMetrics.set(r.keys[0], {
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr_pct: Number((r.ctr * 100).toFixed(2)),
        position: Number(r.position.toFixed(1)),
      });
    }

    // Queries por página (page+query)
    const queriesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gscToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(today),
        dimensions: ['page', 'query'],
        rowLimit: 5000,
      }),
    });
    const queriesData = queriesRes.ok ? await queriesRes.json() : { rows: [] };
    const queriesByPage = new Map(); // page → top queries
    for (const r of (queriesData.rows || [])) {
      const [page, query] = r.keys;
      if (!queriesByPage.has(page)) queriesByPage.set(page, []);
      queriesByPage.get(page).push({
        query,
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr_pct: Number((r.ctr * 100).toFixed(2)),
        position: Number(r.position.toFixed(1)),
      });
    }

    // ── 3. GA4: sessions por landing page (7d) ──────────────────────
    let gaSessions = new Map();
    try {
      const propertyId = Deno.env.get('GA4_PROPERTY_ID') || body.property_id;
      if (propertyId) {
        const { accessToken: gaToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
        const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${gaToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'sessions' }, { name: 'engagementRate' }],
            limit: 500,
          }),
        });
        if (gaRes.ok) {
          const gaData = await gaRes.json();
          for (const r of (gaData.rows || [])) {
            gaSessions.set(r.dimensionValues[0].value, {
              sessions: Number(r.metricValues[0].value),
              engagement_rate: Number(r.metricValues[1].value),
            });
          }
        }
      }
    } catch (e) {
      console.warn('GA4 fetch failed (continuamos solo con GSC):', e.message);
    }

    // ── 4. Recorrer productos · calcular métricas · decidir optimizar ──
    const candidates = [];
    for (const p of productos) {
      const pagePath = `/producto/${p.id}`;
      const fullUrl = `https://peyuchile.cl${pagePath}`;
      // GSC indexa con/sin trailing slash y con dominios variantes; probamos ambos
      const gsc = pageMetrics.get(fullUrl)
        || pageMetrics.get(`${fullUrl}/`)
        || pageMetrics.get(pagePath)
        || { clicks: 0, impressions: 0, ctr_pct: 0, position: 0 };
      const ga = gaSessions.get(pagePath) || { sessions: 0, engagement_rate: 0 };
      const topQueries = (queriesByPage.get(fullUrl) || queriesByPage.get(`${fullUrl}/`) || queriesByPage.get(pagePath) || [])
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      const metrics = {
        ...gsc,
        sessions: ga.sessions,
        engagement_rate: ga.engagement_rate,
      };
      const score = computeScore({ ...gsc, sessions: ga.sessions });
      const health = classifyHealth({ ...gsc, sessions: ga.sessions });

      candidates.push({ producto: p, metrics, score, health, topQueries });
    }

    // Ordenar: primero los que más necesitan optimización (alta impresión + bajo CTR/posición)
    candidates.sort((a, b) => {
      // Prioridad: tiene datos GSC + es underperforming/needs_work
      const priorityA = (a.metrics.impressions || 0) * (a.health === 'underperforming' ? 3 : a.health === 'needs_work' ? 2 : 1);
      const priorityB = (b.metrics.impressions || 0) * (b.health === 'underperforming' ? 3 : b.health === 'needs_work' ? 2 : 1);
      return priorityB - priorityA;
    });

    // Filtrar a los que toca optimizar HOY
    const toOptimize = candidates.filter(c => shouldOptimize({ producto: c.producto, health: c.health, force })).slice(0, limit);

    // ── 5. Para cada uno: generar meta-title + meta-description con IA ──
    const results = [];
    for (const c of toOptimize) {
      const { producto, metrics, score, health, topQueries } = c;
      const focusKeyword = topQueries[0]?.query || producto.nombre;

      try {
        const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Eres especialista SEO chileno e-commerce. Genera meta-title y meta-description para esta página de producto, optimizada para Google Chile.

PRODUCTO:
- Nombre: ${producto.nombre}
- SKU: ${producto.sku}
- Categoría: ${producto.categoria}
- Material: ${producto.material}
- Precio B2C: $${(producto.precio_b2c || 0).toLocaleString('es-CL')} CLP
- Descripción: ${(producto.descripcion || '').slice(0, 300)}

DATOS REALES DE BÚSQUEDA (Google Search Console, últimos 28 días):
- Clicks: ${metrics.clicks} | Impresiones: ${metrics.impressions}
- CTR: ${metrics.ctr_pct}% | Posición promedio: ${metrics.position}
- Sessions GA4: ${metrics.sessions}
- Estado: ${health}

TOP QUERIES por las que ya aparece (USAR ESTAS, no inventar):
${topQueries.slice(0, 5).map(q => `- "${q.query}" (${q.impressions} impresiones, pos ${q.position})`).join('\n') || '(sin datos aún)'}

KEYWORD PRINCIPAL: "${focusKeyword}"

REGLAS ESTRICTAS:
1. meta_title: 50-60 caracteres exactos. Incluir keyword principal al inicio. Marca "PEYU" al final.
2. meta_description: 150-160 caracteres. Incluir keyword + beneficio + CTA.
3. Tono: claro, directo, chileno (sin "vosotros"). Sin emojis.
4. Si CTR<2% y posición<10 → meta-description debe ser MÁS atractiva (problema = baja seducción del snippet).
5. Si posición>20 → meta-title debe forzar la keyword exacta (problema = relevancia).
6. Mencionar "100% Reciclado" o "Sustentable" si aplica al material.
7. focus_keyword: la keyword principal exacta usada.
8. reason: 1 frase explicando QUÉ se optimizó y por qué (basado en métricas).`,
          response_json_schema: {
            type: 'object',
            properties: {
              meta_title: { type: 'string', maxLength: 65 },
              meta_description: { type: 'string', maxLength: 165 },
              focus_keyword: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['meta_title', 'meta_description', 'focus_keyword', 'reason'],
          },
        });

        // Construir nuevo historial (cap 10 últimos)
        const prevHistory = Array.isArray(producto.seo_history) ? producto.seo_history : [];
        const newEntry = {
          at: new Date().toISOString(),
          meta_title: aiRes.meta_title,
          meta_description: aiRes.meta_description,
          focus_keyword: aiRes.focus_keyword,
          score,
          reason: aiRes.reason,
        };
        const newHistory = [newEntry, ...prevHistory].slice(0, 10);

        await base44.asServiceRole.entities.Producto.update(producto.id, {
          seo_meta_title: aiRes.meta_title,
          seo_meta_description: aiRes.meta_description,
          seo_focus_keyword: aiRes.focus_keyword,
          seo_top_queries: topQueries,
          seo_metrics: metrics,
          seo_score: score,
          seo_health: health,
          seo_optimized_at: new Date().toISOString(),
          seo_history: newHistory,
        });

        results.push({
          sku: producto.sku,
          nombre: producto.nombre,
          health,
          score,
          impressions: metrics.impressions,
          new_title: aiRes.meta_title,
          reason: aiRes.reason,
          status: 'optimized',
        });
      } catch (aiErr) {
        console.error(`Error optimizando ${producto.sku}:`, aiErr.message);
        results.push({
          sku: producto.sku,
          status: 'error',
          error: aiErr.message,
        });
      }
    }

    // Productos que solo refrescaron métricas (sin re-generar texto)
    const onlyMetricsRefresh = candidates.filter(c => !toOptimize.includes(c)).slice(0, 100);
    for (const c of onlyMetricsRefresh) {
      try {
        await base44.asServiceRole.entities.Producto.update(c.producto.id, {
          seo_top_queries: c.topQueries,
          seo_metrics: c.metrics,
          seo_score: c.score,
          seo_health: c.health,
        });
      } catch {}
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    return Response.json({
      ok: true,
      site_url: siteUrl,
      stats: {
        total_active_products: productos.length,
        with_gsc_data: candidates.filter(c => c.metrics.impressions > 0).length,
        underperforming: candidates.filter(c => c.health === 'underperforming').length,
        needs_work: candidates.filter(c => c.health === 'needs_work').length,
        optimized_now: results.filter(r => r.status === 'optimized').length,
        only_metrics_refreshed: onlyMetricsRefresh.length,
        errors: results.filter(r => r.status === 'error').length,
        elapsed_seconds: Number(elapsed),
      },
      results,
    });
  } catch (err) {
    console.error('optimizeProductSEOCRON error:', err);
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});