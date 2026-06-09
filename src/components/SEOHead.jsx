import { useEffect } from 'react';

/**
 * SEOHead — Inyecta metaetiquetas dinámicas sin librerías externas.
 * Usa useEffect para actualizar document.head directamente.
 */
export default function SEOHead({ title, description, image, url, type = 'website', schema }) {
  const defaultImage = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg';
  const finalTitle = title || 'PEYU Chile — Regalos Corporativos Sostenibles';
  const finalImage = image || defaultImage;
  const finalUrl = url || 'https://peyuchile.cl';

  useEffect(() => {
    // Title
    document.title = finalTitle;

    const setMeta = (nameOrProp, attr, content) => {
      if (!content) return;
      const selector = `meta[${attr}="${nameOrProp}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Basic SEO
    setMeta('description', 'name', description);
    setMeta('robots', 'name', 'index, follow');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = finalUrl;

    // Open Graph
    setMeta('og:title', 'property', finalTitle);
    setMeta('og:description', 'property', description);
    setMeta('og:url', 'property', finalUrl);
    setMeta('og:image', 'property', finalImage);
    setMeta('og:type', 'property', type);

    // Twitter
    setMeta('twitter:title', 'name', finalTitle);
    setMeta('twitter:description', 'name', description);
    setMeta('twitter:image', 'name', finalImage);
    setMeta('twitter:card', 'name', 'summary_large_image');

    // JSON-LD Schema
    if (schema) {
      const id = 'seohead-jsonld';
      let ld = document.getElementById(id);
      if (!ld) { ld = document.createElement('script'); ld.id = id; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify(schema);
    }
  }, [finalTitle, description, finalImage, finalUrl, type]);

  return null;
}