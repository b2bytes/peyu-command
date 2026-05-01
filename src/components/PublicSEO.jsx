import SEO from '@/components/SEO';
import { PUBLIC_PAGES, B2B_LANDINGS, absUrl, DEFAULT_OG_IMAGE } from '@/lib/seo-catalog';
import { buildOrganizationSchema, buildWebSiteSchema, buildBreadcrumbSchema, combineSchemas } from '@/lib/schemas-peyu';

/**
 * <PublicSEO />
 * Componente único que inyecta meta-tags + JSON-LD para las páginas públicas
 * usando como fuente de verdad lib/seo-catalog.js. Evita duplicar strings.
 *
 * Uso:
 *   <PublicSEO pageKey="shop" />
 *   <PublicSEO pageKey="b2bContacto" breadcrumbs={[{name:'Inicio', url:'/'}, ...]} />
 *
 * Si la página no está en el catálogo, usa overrides title/description directos.
 */
export default function PublicSEO({
  pageKey,
  title: titleOverride,
  description: descriptionOverride,
  canonical: canonicalOverride,
  image,
  jsonLd: extraJsonLd,
  breadcrumbs,
  noindex = false,
  product = null,
}) {
  const meta = pageKey ? (PUBLIC_PAGES[pageKey] || B2B_LANDINGS[pageKey] || null) : null;

  const title = titleOverride || meta?.title || 'PEYU Chile';
  const description = descriptionOverride || meta?.description || '';
  const canonical = canonicalOverride || (meta?.path ? absUrl(meta.path) : undefined);

  // JSON-LD: organización + sitio web siempre, + breadcrumbs si hay, + extra del caller
  const schemas = [buildOrganizationSchema(), buildWebSiteSchema()];
  if (breadcrumbs?.length) schemas.push(buildBreadcrumbSchema(breadcrumbs));
  if (extraJsonLd) schemas.push(extraJsonLd);

  return (
    <SEO
      title={title}
      description={description}
      canonical={canonical}
      image={image || DEFAULT_OG_IMAGE}
      jsonLd={combineSchemas(...schemas)}
      noindex={noindex}
      product={product}
    />
  );
}