/**
 * generateSitemapPages — Genera sitemap XML para páginas estáticas + dinámicas nuevas
 * Llamado por CRON semanal o manualmente desde admin
 * Retorna XML listo para servir en /sitemap.xml
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const baseUrl = 'https://peyuchile.cl';
    const today = new Date().toISOString().split('T')[0];

    // ─ PÁGINAS ESTÁTICAS (alta prioridad)
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/CatalogoNuevo', priority: 0.95, changefreq: 'daily' },
      { path: '/TiendaNueva', priority: 0.95, changefreq: 'daily' },
      { path: '/EmpresasNuevo', priority: 0.9, changefreq: 'weekly' },
      { path: '/b2b/self-service', priority: 0.85, changefreq: 'weekly' },
      { path: '/nosotros', priority: 0.7, changefreq: 'monthly' },
      { path: '/blog', priority: 0.7, changefreq: 'weekly' },
      { path: '/faq', priority: 0.6, changefreq: 'monthly' },
      { path: '/contacto', priority: 0.6, changefreq: 'monthly' },
    ];

    // ─ PRODUCTOS DINÁMICOS (query /ProductoNuevo?id=...)
    let productos = [];
    try {
      productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
    } catch (e) {
      console.log('Warning: Could not fetch productos for sitemap', e.message);
    }

    const productUrls = (productos || [])
      .filter((p) => p.activo !== false)
      .slice(0, 500) // Limita a 500 (Google límite pragmático)
      .map((p) => ({
        url: `${baseUrl}/ProductoNuevo?id=${p.id}`,
        lastmod: p.updated_date || today,
        priority: 0.8,
        changefreq: 'weekly',
      }));

    // ─ Genera XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Estáticas
    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Productos
    productUrls.forEach((item) => {
      xml += `  <url>\n`;
      xml += `    <loc>${item.url}</loc>\n`;
      xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += '</urlset>\n';

    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});