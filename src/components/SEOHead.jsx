import { Helmet } from 'react-helmet-async';

/**
 * SEOHead — Componente reutilizable para inyectar metaetiquetas dinámicas en <head>
 * Usado por ProductoNuevo, CatalogoNuevo, TiendaNueva, etc.
 * 
 * Props:
 * - title: Título página (50-60 chars ideal)
 * - description: Meta description (150-160 chars ideal)
 * - image: URL imagen para OG/Twitter (1200x630 recomendado)
 * - url: URL canónica completa (ej: https://peyuchile.cl/ProductoNuevo?id=123)
 * - type: og:type (website, product, etc.)
 * - keywords: string separado por comas (opcional)
 * - schema: object JSON-LD (opcional)
 */
export default function SEOHead({ title, description, image, url, type = 'website', keywords, schema, children }) {
  const siteUrl = 'https://peyuchile.cl';
  const finalUrl = url || siteUrl;
  const finalImage = image || 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg';

  return (
    <Helmet prioritizeSeoTags>
      {/* Basic SEO */}
      <title>{title || 'PEYU Chile — Regalos Corporativos Sostenibles'}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph (Facebook, LinkedIn, etc.) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content="PEYU Chile" />
      <meta property="og:locale" content="es_CL" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImage} />

      {/* JSON-LD Schema (Google Rich Snippets) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}

      {/* Adicionales inyectados por el componente hijo */}
      {children}
    </Helmet>
  );
}