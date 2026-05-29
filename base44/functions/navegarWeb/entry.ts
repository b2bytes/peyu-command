// ============================================================================
// navegarWeb · Navegador web en vivo para PEYU OS
// ─────────────────────────────────────────────────────────────────────────────
// Recibe una URL y devuelve:
//   - screenshot: captura REAL renderizada (image.thum.io ejecuta JS y renderiza
//     sitios pesados como MercadoPublico).
//   - title / description / image (og) / text (modo lector) / links.
// El fetch de texto es respaldo: si falla, igual devolvemos la captura.
// Solo admin. Invocar vía base44.functions.invoke('navegarWeb', { url }).
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { url } = await req.json();
    if (!url || !/^https?:\/\//i.test(url)) {
      return Response.json({ ok: false, error: 'URL inválida' }, { status: 400 });
    }

    const screenshot = `https://image.thum.io/get/width/1200/viewportWidth/1280/png/${url}`;
    let title = url, description = '', ogImage = '', text = '';
    const links = [];

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const resp = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PeyuOS/1.0)' },
      });
      clearTimeout(t);
      const finalUrl = resp.url || url;
      const html = await resp.text();

      const tm = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      title = tm ? decode(tm[1].trim()) : finalUrl;
      const dm = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
      description = dm ? decode(dm[1]) : '';
      const om = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
      ogImage = om ? om[1] : '';
      text = decode(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
      ).replace(/\s+/g, ' ').trim().slice(0, 6000);

      const linkRe = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRe.exec(html)) && links.length < 25) {
        const txt = decode(m[2].replace(/<[^>]+>/g, '').trim());
        if (!txt) continue;
        let href = m[1];
        try { href = new URL(href, finalUrl).toString(); } catch { continue; }
        links.push({ href, text: txt.slice(0, 80) });
      }
    } catch (_) { /* la captura es suficiente como respaldo */ }

    return Response.json({ ok: true, url, screenshot, title, description, image: ogImage, text, links });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 200 });
  }
});