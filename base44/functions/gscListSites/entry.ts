// ============================================================================
// gscListSites — Lista los sitios verificados del usuario en Search Console
// ----------------------------------------------------------------------------
// Sin payload. Devuelve qué dominios están verificados con esta cuenta Google.
// Útil para saber con qué siteUrl llamar a gscAuditSite / gscSubmitSitemap.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const res = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      return Response.json({ error: `GSC ${res.status}: ${await res.text()}` }, { status: 500 });
    }
    const data = await res.json();
    const sites = (data.siteEntry || []).map(s => ({
      site_url: s.siteUrl,
      permission_level: s.permissionLevel,
    }));
    return Response.json({ ok: true, total: sites.length, sites });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});