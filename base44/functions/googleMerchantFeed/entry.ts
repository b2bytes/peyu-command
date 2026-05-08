// ============================================================================
// PEYU · googleMerchantFeed
// ----------------------------------------------------------------------------
// Endpoint público que sirve un FEED XML compatible con Google Merchant Center
// (Google Shopping), Facebook Catalog y Pinterest Catalogs.
//
// Spec: https://support.google.com/merchant/answer/7052112  (RSS 2.0 + g:* ns)
// Cache HTTP 1h. Cada item incluye los atributos críticos de Shopping:
//   id, title, description, link, image_link, availability, price,
//   condition, brand, gtin/mpn, google_product_category, shipping.
//
// Endpoint público: configurar en GMC como
//   https://<base44-functions-host>/googleMerchantFeed
//
// Hecho para que PEYU aparezca en Google Shopping (Free listings + Ads).
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://peyuchile.cl';

// ── Sync con lib/delivery-promise.js (single source of truth) ────────
// Si cambias estos valores, actualiza también lib/delivery-promise.js
// para mantener consistencia entre Google Shopping ads y el sitio público.
const SHIPPING_DEFAULT_CLP = 5990;
const FREE_SHIPPING_THRESHOLD = 40000;
// Lead time conservador "Todos los destinos" usado en el atributo g:shipping
// (Merchant Center también usa la config global de Configuración → Envíos).
// Valores: handling 0–1 días + tránsito 2–5 días = 2–6 días hábiles totales.
const TRANSIT_TIME_MIN = 2;
const TRANSIT_TIME_MAX = 5;

// Mapa interno categoría → Google Product Category (taxonomy oficial).
// https://www.google.com/basepages/producttype/taxonomy.es-CL.txt
const GOOGLE_CATEGORY_MAP = {
  'Escritorio': 'Office Supplies > Office & Desk Accessories',
  'Hogar': 'Home & Garden > Decor',
  'Entretenimiento': 'Toys & Games > Games',
  'Corporativo': 'Business & Industrial > Advertising & Marketing > Promotional Items',
  'Carcasas B2C': 'Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases',
};

const escapeXml = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[c]));

// Limpia HTML para descripción (Google rechaza tags).
const cleanText = (s = '') => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Limpia URLs de imagen para GMC:
// - Quita parámetros Jetpack (?fit, ?ssl, ?w, ?h, ?quality) que GMC rechaza como inestables.
// - Quita el wrapper i0.wp.com (CDN Jetpack proxy → puede bloquear Googlebot-Image).
// - Convierte URL relativas a absolutas.
const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let u = url.trim();
  // Quita el prefijo i0.wp.com / i1.wp.com / i2.wp.com → URL canónica directa
  u = u.replace(/^https?:\/\/i[0-9]\.wp\.com\//, 'https://');
  // Quita query params inestables que GMC marca como "URL no canónica"
  u = u.split('?')[0];
  // Si quedó sin protocolo, agregarlo
  if (u.startsWith('//')) u = 'https:' + u;
  return u;
};

// Selecciona la mejor imagen disponible para el feed:
// 1. galeria_urls[0] del CDN Base44 (más estable, sin Jetpack)
// 2. imagen_promo_url del CDN Base44
// 3. imagen_url (legacy WordPress, limpiada)
const pickBestImage = (p) => {
  const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
  const base44Imgs = galeria.filter(u => u && u.includes('media.base44.com'));
  if (base44Imgs.length > 0) return base44Imgs[0];
  if (p.imagen_promo_url && p.imagen_promo_url.includes('media.base44.com')) return p.imagen_promo_url;
  if (galeria[0]) return cleanImageUrl(galeria[0]);
  return cleanImageUrl(p.imagen_url);
};

function buildItem(p) {
  const id = p.sku || p.id;
  const title = p.nombre;
  const description = cleanText(p.descripcion) ||
    `${p.nombre} · Hecho en Chile con ${p.material}. Personalización láser disponible.`;
  const link = `${SITE_URL}/producto/${p.id}`;
  // Imagen principal: prefiere CDN Base44 (estable) > Jetpack limpio (legacy)
  const image = pickBestImage(p);
  // Imagen promo: solo si difiere de la principal y es Base44 CDN
  const promoImage = p.imagen_promo_url && p.imagen_promo_url !== image ? p.imagen_promo_url : null;
  // Galería adicional limpia (solo Base44 CDN o WordPress sin params)
  const galeria = (Array.isArray(p.galeria_urls) ? p.galeria_urls : [])
    .map(cleanImageUrl)
    .filter(Boolean)
    .slice(0, 9);
  const price = Math.round(p.precio_b2c || 0);
  const stock = Number(p.stock_actual || 0);
  const availability = stock > 0 ? 'in_stock' : 'out_of_stock';
  const googleCat = GOOGLE_CATEGORY_MAP[p.categoria] || 'Business & Industrial > Advertising & Marketing > Promotional Items';

  const lines = [
    '    <item>',
    `      <g:id>${escapeXml(id)}</g:id>`,
    `      <title>${escapeXml(title.slice(0, 150))}</title>`,
    `      <description>${escapeXml(description.slice(0, 5000))}</description>`,
    `      <link>${escapeXml(link)}</link>`,
    image ? `      <g:image_link>${escapeXml(image)}</g:image_link>` : null,
    promoImage && promoImage !== image ? `      <g:additional_image_link>${escapeXml(promoImage)}</g:additional_image_link>` : null,
    ...galeria
      .filter(u => u && u !== image && u !== promoImage)
      .map(u => `      <g:additional_image_link>${escapeXml(u)}</g:additional_image_link>`),
    `      <g:availability>${availability}</g:availability>`,
    `      <g:price>${price} CLP</g:price>`,
    `      <g:condition>new</g:condition>`,
    `      <g:brand>PEYU</g:brand>`,
    `      <g:mpn>${escapeXml(p.sku || p.id)}</g:mpn>`,
    `      <g:identifier_exists>no</g:identifier_exists>`,
    `      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(p.categoria)} > ${escapeXml(p.material)}</g:product_type>`,
    `      <g:custom_label_0>${escapeXml(p.canal || '')}</g:custom_label_0>`,
    `      <g:custom_label_1>${escapeXml(p.material || '')}</g:custom_label_1>`,
    `      <g:custom_label_2>Hecho en Chile</g:custom_label_2>`,
    `      <g:shipping>`,
    `        <g:country>CL</g:country>`,
    `        <g:service>BlueExpress Express</g:service>`,
    `        <g:price>${price >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_DEFAULT_CLP} CLP</g:price>`,
    `        <g:min_transit_time>${TRANSIT_TIME_MIN}</g:min_transit_time>`,
    `        <g:max_transit_time>${TRANSIT_TIME_MAX}</g:max_transit_time>`,
    `      </g:shipping>`,
    `      <g:max_handling_time>1</g:max_handling_time>`,
    `      <g:min_handling_time>0</g:min_handling_time>`,
    p.peso_kg ? `      <g:shipping_weight>${p.peso_kg} kg</g:shipping_weight>` : null,
    '    </item>',
  ].filter(Boolean);

  return lines.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
    const elegibles = (productos || []).filter(p => {
      // Reglas GMC para incluir un producto en el feed:
      if (p.activo === false) return false;                    // 1. Activo
      if (p.canal === 'B2B Exclusivo') return false;           // 2. Disponible al público (no solo B2B)
      if (!p.precio_b2c || p.precio_b2c <= 0) return false;    // 3. Precio válido
      if (!p.nombre || p.nombre.length < 3) return false;      // 4. Título mínimo
      if (!p.id) return false;                                 // 5. ID válido para link
      // 6. Tiene al menos UNA imagen válida (Base44 CDN o WordPress)
      const hasImage = pickBestImage(p);
      if (!hasImage) return false;
      return true;
    });

    const items = elegibles.map(buildItem).join('\n');
    const today = new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>PEYU Chile · Catálogo</title>
    <link>${SITE_URL}</link>
    <description>Productos sostenibles hechos en Chile · Plástico 100% reciclado · Personalización láser</description>
    <language>es-CL</language>
    <lastBuildDate>${today}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Item-Count': String(elegibles.length),
      },
    });
  } catch (err) {
    console.error('googleMerchantFeed error:', err);
    return new Response(`<!-- error: ${err.message} -->`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
});