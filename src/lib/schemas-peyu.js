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

export const buildProductSchema = (p = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.nombre,
  sku: p.sku,
  description: p.descripcion || `${p.nombre} — ${p.material || 'material reciclado'}. Fabricación local PEYU Chile.`,
  image: p.imagen_url || undefined,
  brand: { '@type': 'Brand', name: 'PEYU' },
  category: p.categoria,
  material: p.material,
  countryOfOrigin: 'CL',
  offers: p.precio_b2c ? {
    '@type': 'Offer',
    url: `${SITE_URL}/producto/${p.sku}`,
    priceCurrency: 'CLP',
    price: p.precio_b2c,
    availability: p.stock_actual > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    seller: { '@type': 'Organization', name: 'PEYU Chile' },
  } : undefined,
});

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