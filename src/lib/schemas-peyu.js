// ============================================================================
// PEYU · Schema.org JSON-LD builders
// ----------------------------------------------------------------------------
// Centraliza la generación de structured data para rich snippets en Google.
// Uso: import { buildOrganizationSchema, buildProductSchema } from '@/lib/schemas-peyu'
// ============================================================================

const SITE_URL = 'https://peyuchile.cl';
const LOGO_URL = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/logo-peyu.png';

export const buildOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PEYU Chile',
  legalName: 'PEYU SpA',
  url: SITE_URL,
  logo: LOGO_URL,
  foundingDate: '2024',
  description: 'Fabricante chileno de productos 100% reciclados y compostables para regalo corporativo y hogar. Personalización láser, producción local.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CL',
    addressLocality: 'Santiago',
    addressRegion: 'Región Metropolitana',
  },
  contactPoint: [{
    '@type': 'ContactPoint',
    telephone: '+56-9-0000-0000',
    contactType: 'sales',
    email: 'ti@peyuchile.cl',
    areaServed: 'CL',
    availableLanguage: ['Spanish'],
  }],
  sameAs: [
    'https://www.instagram.com/peyuchile',
    'https://www.linkedin.com/company/peyuchile',
    'https://peyuchile.lat',
  ],
});

export const buildWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PEYU Chile',
  url: SITE_URL,
  inLanguage: 'es-CL',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/shop?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildBreadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: it.url,
  })),
});

/**
 * Product schema enriquecido (Google Merchant + Rich Results 2025+).
 * Acepta:
 *   p.id (preferido sobre sku para URL)
 *   p.precio_final (si lo pasas, se usa como precio actual; si no, se calcula -15% sobre precio_b2c)
 *   p.images (array opcional para galería)
 *   p.rating ({ value, count })
 *   p.canonicalUrl (si quieres forzar URL)
 */
export const buildProductSchema = (p = {}) => {
  const precioBase = Number(p.precio_b2c) || 0;
  const precioFinal = Number(p.precio_final) || (precioBase ? Math.floor(precioBase * 0.85) : 0);
  const productUrl = p.canonicalUrl || `${SITE_URL}/producto/${p.id || p.sku}`;
  const stock = Number(p.stock_actual);
  const availability = !Number.isFinite(stock)
    ? 'https://schema.org/InStock'
    : stock > 5
      ? 'https://schema.org/InStock'
      : stock > 0
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/OutOfStock';

  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.imagen_url ? [p.imagen_url] : undefined);

  const cleanDescription = (p.descripcion || '')
    .replace(/[⭐🌾✨💚🇨🇱♻️]/g, '')
    .trim()
    .slice(0, 5000) ||
    `${p.nombre} fabricado en Chile con ${p.material || 'material reciclado'}. ${p.area_laser_mm ? `Personalización láser UV área ${p.area_laser_mm}. ` : ''}Garantía ${p.garantia_anios || 10} años. Envío a todo Chile.`;

  // Validez del precio: 1 año desde hoy (formato YYYY-MM-DD)
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const offer = precioFinal ? {
    '@type': 'Offer',
    url: productUrl,
    priceCurrency: 'CLP',
    price: precioFinal,
    priceValidUntil,
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'PEYU Chile', url: SITE_URL },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'CL',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: precioFinal >= 40000 ? 0 : 5990,
        currency: 'CLP',
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'CL',
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
      },
    },
    // Google Merchant Center: hasMerchantReturnPolicy detallado
    eligibleRegion: { '@type': 'Country', name: 'CL' },
  } : undefined;

  // Si hay precios B2B por volumen, exponerlos como AggregateOffer adicionales
  const volumeOffers = [];
  if (precioFinal && p.precio_base_b2b) volumeOffers.push({ qty: 10, price: p.precio_base_b2b });
  if (precioFinal && p.precio_50_199) volumeOffers.push({ qty: 50, price: p.precio_50_199 });
  if (precioFinal && p.precio_200_499) volumeOffers.push({ qty: 200, price: p.precio_200_499 });
  if (precioFinal && p.precio_500_mas) volumeOffers.push({ qty: 500, price: p.precio_500_mas });

  const allOffers = volumeOffers.length > 0 && offer
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'CLP',
        lowPrice: Math.min(precioFinal, ...volumeOffers.map(v => v.price)),
        highPrice: Math.max(precioFinal, ...volumeOffers.map(v => v.price)),
        offerCount: 1 + volumeOffers.length,
        offers: [
          offer,
          ...volumeOffers.map(v => ({
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'CLP',
            price: v.price,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: v.price,
              priceCurrency: 'CLP',
              eligibleQuantity: { '@type': 'QuantitativeValue', minValue: v.qty, unitCode: 'C62' },
            },
            availability,
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: 'PEYU Chile' },
          })),
        ],
      }
    : offer;

  const aggregateRating = p.rating?.value && p.rating?.count ? {
    '@type': 'AggregateRating',
    ratingValue: p.rating.value,
    reviewCount: p.rating.count,
    bestRating: 5,
    worstRating: 1,
  } : undefined;

  const additionalProperty = [
    p.material && { '@type': 'PropertyValue', name: 'Material', value: p.material },
    p.area_laser_mm && { '@type': 'PropertyValue', name: 'Área grabado láser', value: p.area_laser_mm },
    p.garantia_anios && { '@type': 'PropertyValue', name: 'Garantía', value: `${p.garantia_anios} años` },
    p.lead_time_sin_personal && { '@type': 'PropertyValue', name: 'Lead time', value: `${p.lead_time_sin_personal} días hábiles` },
    p.canal && { '@type': 'PropertyValue', name: 'Canal', value: p.canal },
    p.moq_personalizacion && { '@type': 'PropertyValue', name: 'MOQ personalización', value: `${p.moq_personalizacion} unidades` },
  ].filter(Boolean);

  // Reviews destacadas (Google Shopping muestra estrellas)
  const review = p.rating?.value && p.rating?.count ? {
    '@type': 'Review',
    reviewRating: { '@type': 'Rating', ratingValue: p.rating.value, bestRating: 5 },
    author: { '@type': 'Organization', name: 'Clientes PEYU' },
    reviewBody: `Producto verificado con ${p.rating.count} reseñas de clientes reales.`,
  } : undefined;

  // Google Merchant Center: identifier_exists=false si no tenemos GTIN/MPN real
  // pero usamos SKU como mpn para que Google entienda que es producto único.
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: p.nombre,
    sku: p.sku,
    mpn: p.sku,
    productID: `peyu:${p.sku}`,
    description: cleanDescription,
    image: images,
    url: productUrl,
    brand: { '@type': 'Brand', name: 'PEYU', logo: LOGO_URL },
    manufacturer: { '@type': 'Organization', name: 'PEYU Chile', url: SITE_URL },
    category: p.categoria,
    material: p.material,
    countryOfOrigin: 'CL',
    // Google Shopping requiere itemCondition a nivel producto también
    itemCondition: 'https://schema.org/NewCondition',
    // Audiencia (B2C / B2B mixto)
    audience: {
      '@type': 'PeopleAudience',
      audienceType: p.canal?.includes('B2B') ? 'Empresas y consumidores' : 'Consumidores',
    },
    // Color visible (si se infiere)
    ...(p.color ? { color: p.color } : {}),
    ...(p.peso_gr ? {
      weight: { '@type': 'QuantitativeValue', value: p.peso_gr, unitCode: 'GRM' },
    } : {}),
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(review ? { review } : {}),
    ...(allOffers ? { offers: allOffers } : {}),
    // Política de devolución a nivel producto (Google Merchant Center)
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'CL',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
      refundType: 'https://schema.org/FullRefund',
    },
  };
};

/**
 * Article / BlogPosting schema (Google Rich Results para blog).
 * Acepta:
 *   p.titulo, p.slug, p.excerpt, p.contenido_md, p.imagen_portada
 *   p.fecha_publicacion, p.autor, p.categoria, p.tags
 *   p.fuente_original, p.fuente_url, p.tiempo_lectura_min
 *   canonicalUrl (opcional)
 */
export const buildArticleSchema = (p = {}, canonicalUrl) => {
  const url = canonicalUrl || `${SITE_URL}/blog/${p.slug || p.id}`;
  const wordCount = (p.contenido_md || '').trim().split(/\s+/).filter(Boolean).length;
  const datePublished = p.fecha_publicacion || p.created_date;
  const dateModified = p.updated_date || datePublished;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: (p.titulo || '').slice(0, 110),
    description: p.seo_description || p.excerpt,
    image: p.imagen_portada || undefined,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: p.autor || 'Equipo PEYU',
      url: `${SITE_URL}/nosotros`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PEYU Chile',
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
    articleSection: p.categoria,
    keywords: Array.isArray(p.tags) ? p.tags.join(', ') : undefined,
    inLanguage: 'es-CL',
    wordCount: wordCount || undefined,
    timeRequired: p.tiempo_lectura_min ? `PT${p.tiempo_lectura_min}M` : undefined,
    isAccessibleForFree: true,
    ...(p.fuente_url ? {
      citation: {
        '@type': 'CreativeWork',
        name: p.fuente_original || 'Fuente externa',
        url: p.fuente_url,
      },
    } : {}),
    url,
  };
};

export const buildFaqSchema = (faqs = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

// Combina múltiples schemas en un @graph (mejor práctica SEO 2025+)
export const combineSchemas = (...schemas) => ({
  '@context': 'https://schema.org',
  '@graph': schemas.filter(Boolean).map(s => {
    const { '@context': _ctx, ...rest } = s;
    return rest;
  }),
});