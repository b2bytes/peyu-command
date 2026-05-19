// ============================================================================
// gscCleanLegacySitemaps — Elimina sitemaps obsoletos de Search Console
// ----------------------------------------------------------------------------
// Lista todos los sitemaps registrados en sc-domain:peyuchile.cl y elimina los
// que apuntan a URLs legacy (http, www, /post-sitemap, /page-sitemap, etc.)
// dejando solo el sitemap actual generado por la app (peyuchile.cl/sitemap.xml).
//
// Payload opcional: { dry_run: true } para preview sin borrar.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'sc-domain:peyuchile.cl';
const KEEP = ['https://peyuchile.cl/sitemap.xml'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { dry_run = false } = await req.json().catch(() => ({}));

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const auth = { Authorization: `Bearer ${accessToken}` };
    const siteEnc = encodeURIComponent(SITE_URL);

    // Listar
    const listRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps`, { headers: auth });
    if (!listRes.ok) {
      return Response.json({ error: `GSC list ${listRes.status}: ${await listRes.text()}` }, { status: 500 });
    }
    const listData = await listRes.json();
    const all = (listData.sitemap || []).map(s => s.path);

    const toDelete = all.filter(p => !KEEP.includes(p));
    const toKeep = all.filter(p => KEEP.includes(p));

    if (dry_run) {
      return Response.json({ ok: true, dry_run: true, total: all.length, would_delete: toDelete, would_keep: toKeep });
    }

    const results = [];
    for (const path of toDelete) {
      const enc = encodeURIComponent(path);
      const delRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${enc}`, {
        method: 'DELETE', headers: auth,
      });
      results.push({ path, ok: delRes.ok, http: delRes.status });
    }

    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'sitemap_cleanup',
      site_url: SITE_URL,
      status: 'success',
      response_summary: `Eliminados ${results.filter(r => r.ok).length} de ${toDelete.length} sitemaps legacy`,
    });

    return Response.json({
      ok: true,
      deleted_count: results.filter(r => r.ok).length,
      kept: toKeep,
      results,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});