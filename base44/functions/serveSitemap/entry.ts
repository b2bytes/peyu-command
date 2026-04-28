// ============================================================================
// PEYU · serveSitemap
// Endpoint PÚBLICO que sirve sitemap.xml dinámico en tiempo real.
// Sirve XML con Content-Type: application/xml + cache HTTP 1h.
// Soporta sitemap index con: ?type=index | products | blog | static
// Default (sin query): sitemap completo con todos los URLs.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://peyuchile.cl';

const STATIC_ROUTES = [
  { loc: '/',                  priority: '1.0',  changefreq: 'daily' },
  { loc: '/lanzamiento',       priority: '0.95', changefreq: 'weekly' },
  { loc: '/shop',              priority: '0.9',  changefreq: 'daily' },
  { loc: '/catalogo-visual',   priority: '0.85', changefreq: 'weekly' },
  { loc: '/b2b/catalogo',      priority: '0.9',  changefreq: 'weekly' },
  { loc: '/b2b/contacto',      priority: '0.9',  changefreq: 'monthly' },
  { loc: '/b2b/self-service',  priority: '0.8',  changefreq: 'monthly' },
  { loc: '/personalizar',      priority: '0.8',  changefreq: 'monthly' },
  { loc: '/nosotros',          priority: '0.7',  changefreq: 'monthly' },
  { loc: '/blog',              priority: '0.8',  changefreq: 'weekly' },
  { loc: '/contacto',          priority: '0.6',  changefreq: 'monthly' },
  { loc: '/faq',               priority: '0.6',  changefreq: 'monthly' },
  { loc: '/envios',            priority: '0.5',  changefreq: 'monthly' },
  { loc: '/cambios',           priority: '0.5',  changefreq: 'monthly' },
  { loc: '/terminos',          priority: '0.3',  changefreq: 'yearly' },
  { loc: '/privacidad',        priority: '0.3',  changefreq: 'yearly' },
  { loc: '/cookies',           priority: '0.3',  changefreq: 'yearly' },
];

const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const urlEntry = ({ loc, lastmod, changefreq, priority, image, imageTitle, imageCaption }) => {
  const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod)    lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority)   lines.push(`    <priority>${priority}</priority>`);
  if (image) {
    lines.push(`    <image:image>`);
    lines.push(`      <image:loc>${escapeXml(image)}</image:loc>`);
    if (imageTitle)   lines.push(`      <image:title>${escapeXml(imageTitle)}</image:title>`);
    if (imageCaption) lines.push(`      <image:caption>${escapeXml(imageCaption)}</image:caption>`);
    lines.push(`    </image:image>`);
  }
  lines.push(`  </url>`);
  return lines.join('\n');
};

const wrapUrlset = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;

const wrapIndex = (sitemaps) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

const xmlResponse = (xml) => new Response(xml, {
  status: 200,
  headers: {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'X-Robots-Tag': 'noindex',
  },
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all';
    const today = new Date().toISOString().split('T')[0];
    const base44 = createClientFromRequest(req);

    // ── Index (sitemap de sitemaps) ──
    if (type === 'index') {
      const fnUrl = `${url.origin}${url.pathname}`;
      return xmlResponse(wrapIndex([
        { loc: `${fnUrl}?type=static`,   lastmod: today },
        { loc: `${fnUrl}?type=products`, lastmod: today },
        { loc: `${fnUrl}?type=blog`,     lastmod: today },
      ]));
    }

    // ── Estático ──
    if (type === 'static') {
      const entries = STATIC_ROUTES.map(r => urlEntry({
        loc: `${SITE_URL}${r.loc}`,
        lastmod: today,
        changefreq: r.changefreq,
        priority: r.priority,
      }));
      return xmlResponse(wrapUrlset(entries));
    }

    // ── Productos ──
    if (type === 'products') {
      const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
      const activos = (productos || []).filter(p => p.activo !== false && p.canal !== 'B2B Exclusivo');
      const entries = activos.map(p => urlEntry({
        loc: `${SITE_URL}/producto/${p.id}`,
        lastmod: (p.updated_date || p.created_date || today).split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
        image: p.imagen_url || undefined,
        imageTitle: p.nombre,
        imageCaption: p.descripcion?.slice(0, 200),
      }));
      return xmlResponse(wrapUrlset(entries));
    }

    // ── Blog ──
    if (type === 'blog') {
      const posts = await base44.asServiceRole.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 500);
      const entries = (posts || []).map(p => urlEntry({
        loc: `${SITE_URL}/blog/${p.slug || p.id}`,
        lastmod: (p.updated_date || p.fecha_publicacion || today).split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
        image: p.imagen_portada || undefined,
        imageTitle: p.titulo,
      }));
      return xmlResponse(wrapUrlset(entries));
    }

    // ── Default: sitemap completo ──
    const [productos, posts] = await Promise.all([
      base44.asServiceRole.entities.Producto.list('-updated_date', 1000),
      base44.asServiceRole.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 500),
    ]);
    const activos = (productos || []).filter(p => p.activo !== false && p.canal !== 'B2B Exclusivo');

    const entries = [
      ...STATIC_ROUTES.map(r => urlEntry({
        loc: `${SITE_URL}${r.loc}`,
        lastmod: today,
        changefreq: r.changefreq,
        priority: r.priority,
      })),
      ...activos.map(p => urlEntry({
        loc: `${SITE_URL}/producto/${p.id}`,
        lastmod: (p.updated_date || p.created_date || today).split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
        image: p.imagen_url || undefined,
        imageTitle: p.nombre,
        imageCaption: p.descripcion?.slice(0, 200),
      })),
      ...(posts || []).map(p => urlEntry({
        loc: `${SITE_URL}/blog/${p.slug || p.id}`,
        lastmod: (p.updated_date || p.fecha_publicacion || today).split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
        image: p.imagen_portada || undefined,
        imageTitle: p.titulo,
      })),
    ];

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error('serveSitemap error:', error);
    return new Response(`<!-- error: ${error.message} -->`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
});