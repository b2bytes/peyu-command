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
    : stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/PreOrder';

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
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: p.nombre,
    sku: p.sku,
    mpn: p.sku,
    productID: p.sku,
    description: cleanDescription,
    image: images,
    url: productUrl,
    brand: { '@type': 'Brand', name: 'PEYU' },
    manufacturer: { '@type': 'Organization', name: 'PEYU Chile', url: SITE_URL },
    category: p.categoria,
    material: p.material,
    countryOfOrigin: 'CL',
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(allOffers ? { offers: allOffers } : {}),
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