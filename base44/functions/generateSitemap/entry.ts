// ============================================================================
// PEYU · generateSitemap
// Genera sitemap.xml dinámico con productos + páginas estáticas.
// Sube el XML a storage público y devuelve la URL firmada (file_url).
// Puede ejecutarse on-demand (POST) o vía automatización sobre Producto.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://peyuchile.cl';

// Páginas estáticas priorizadas para indexación
const STATIC_ROUTES = [
  { loc: '/',                    priority: '1.0', changefreq: 'daily' },
  { loc: '/lanzamiento',         priority: '0.95', changefreq: 'weekly' },
  { loc: '/shop',                priority: '0.9', changefreq: 'daily' },
  { loc: '/catalogo-visual',     priority: '0.85', changefreq: 'weekly' },
  { loc: '/b2b/catalogo',        priority: '0.9', changefreq: 'weekly' },
  { loc: '/b2b/contacto',        priority: '0.9', changefreq: 'monthly' },
  { loc: '/b2b/self-service',    priority: '0.8', changefreq: 'monthly' },
  { loc: '/personalizar',        priority: '0.8', changefreq: 'monthly' },
  { loc: '/nosotros',            priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog',                priority: '0.8', changefreq: 'weekly' },
  { loc: '/contacto',            priority: '0.6', changefreq: 'monthly' },
  { loc: '/faq',                 priority: '0.6', changefreq: 'monthly' },
  { loc: '/envios',              priority: '0.5', changefreq: 'monthly' },
  { loc: '/cambios',             priority: '0.5', changefreq: 'monthly' },
  { loc: '/terminos',            priority: '0.3', changefreq: 'yearly' },
  { loc: '/privacidad',          priority: '0.3', changefreq: 'yearly' },
  { loc: '/cookies',             priority: '0.3', changefreq: 'yearly' },
];

// Escapa caracteres XML especiales en URLs
const escapeXml = (unsafe) =>
  String(unsafe).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]));

// Construye una entrada <url>
const buildUrlEntry = ({ loc, lastmod, changefreq, priority, image }) => {
  const lines = ['  <url>'];
  lines.push(`    <loc>${escapeXml(loc)}</loc>`);
  if (lastmod)    lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority)   lines.push(`    <priority>${priority}</priority>`);
  if (image) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(image)}</image:loc>`);
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
  return lines.join('\n');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Cargar todos los productos activos (service role: la función puede correr
    // desde una automatización entity sin usuario autenticado).
    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
    const activos = (productos || []).filter(p => p.activo !== false);

    const today = new Date().toISOString().split('T')[0];

    // 1. Páginas estáticas
    const staticEntries = STATIC_ROUTES.map(r => buildUrlEntry({
      loc: `${SITE_URL}${r.loc}`,
      lastmod: today,
      changefreq: r.changefreq,
      priority: r.priority,
    }));

    // 2. Páginas de producto
    const productEntries = activos.map(p => buildUrlEntry({
      loc: `${SITE_URL}/producto/${p.id}`,
      lastmod: (p.updated_date || p.created_date || today).split('T')[0],
      changefreq: 'weekly',
      priority: '0.8',
      image: p.imagen_url || undefined,
    }));

    // 3. Ensamblar XML completo
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticEntries, ...productEntries].join('\n')}
</urlset>`;

    // 4. Subir como archivo público
    const blob = new Blob([xml], { type: 'application/xml' });
    const file = new File([blob], `sitemap-${Date.now()}.xml`, { type: 'application/xml' });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    const payload = {
      success: true,
      generated_at: new Date().toISOString(),
      static_routes: STATIC_ROUTES.length,
      products: activos.length,
      total_urls: STATIC_ROUTES.length + activos.length,
      sitemap_url: uploaded.file_url,
    };

    // 5. Log de indexación (traza auditable)
    try {
      await base44.asServiceRole.entities.IndexationLog.create({
        action_type: 'sitemap_submit',
        site_url: SITE_URL,
        sitemap_url: uploaded.file_url,
        status: 'success',
        pages_submitted: payload.total_urls,
        notes: `Sitemap regenerado automáticamente. ${activos.length} productos + ${STATIC_ROUTES.length} páginas estáticas.`,
      });
    } catch (e) {
      console.log('IndexationLog skipped:', e.message);
    }

    console.log(`✅ Sitemap generado: ${payload.total_urls} URLs`);
    return Response.json(payload);
  } catch (error) {
    console.error('❌ generateSitemap error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});