// ============================================================
// PEYU — Generadores de Schema.org (JSON-LD)
// Alimentan los rich results de Google:
// - Product → estrellas, precio, stock en SERP
// - BreadcrumbList → migas de pan en SERP
// - FAQPage → acordeones desplegables en SERP
// - LocalBusiness → panel de conocimiento con horario y mapa
// - Organization ya está en index.html (global, una vez).
// ============================================================

import { SITE_URL, SITE_NAME } from './seo-catalog';

// -------- Product Schema (producto individual) --------
export function productSchema({
  name,
  description,
  image,
  sku,
  priceCLP,
  rating = 5.0,
  reviewCount = null,
  inStock = true,
  url,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    sku,
    brand: { '@type': 'Brand', name: SITE_NAME },
    manufacturer: { '@type': 'Organization', name: 'PEYU Chile SpA' },
    offers: {
      '@type': 'Offer',
      url: url || SITE_URL,
      priceCurrency: 'CLP',
      price: priceCLP,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
    ...(reviewCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
      },
    } : {}),
  };
}

// -------- BreadcrumbList (migas de pan) --------
// items: [{ name, path }]
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${SITE_URL}${item.path}`,
    })),
  };
}

// -------- FAQPage (preguntas frecuentes de una landing) --------
// faqs: [{ question, answer }]
export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

// -------- LocalBusiness (tiendas físicas) --------
export function localBusinessSchema({ branch = 'providencia' } = {}) {
  const branches = {
    providencia: {
      name: 'PEYU Providencia',
      street: 'F. Bilbao 3775',
      locality: 'Providencia',
      lat: -33.4378,
      lng: -70.6100,
    },
    macul: {
      name: 'PEYU Macul',
      street: 'P. de Valdivia 6603',
      locality: 'Macul',
      lat: -33.4869,
      lng: -70.5931,
    },
  };
  const b = branches[branch] || branches.providencia;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    image: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.street,
      addressLocality: b.locality,
      addressRegion: 'Región Metropolitana',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: b.lat,
      longitude: b.lng,
    },
    telephone: '+56935040242',
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '19:00',
    }],
    priceRange: '$$',
  };
}

// -------- Service (servicio B2B) — útil para landings B2B --------
export function serviceSchema({ name, description, areaServed = 'CL' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: areaServed === 'CL' ? 'Chile' : areaServed },
    serviceType: 'Gifting corporativo sostenible',
  };
}

// -------- Article (blog post) --------
export function articleSchema({ title, description, image, datePublished, dateModified, author = 'PEYU Chile', url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: { '@type': 'Organization', name: author, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}