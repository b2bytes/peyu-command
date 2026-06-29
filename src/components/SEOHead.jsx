import { useEffect } from 'react';

/**
 * SEOHead — Inyecta metaetiquetas dinámicas sin librerías externas.
 * Usa useEffect para actualizar document.head directamente.
 */
export default function SEOHead({ title, description, image, url, type = 'website', schema, keywords }) {
  const defaultImage = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg';
  const defaultDescription = 'Regalos corporativos sostenibles hechos en Chile con plástico 100% reciclado. Personalización láser UV gratis desde 10 unidades. Envío a todo Chile.';
  const finalTitle = title || 'PEYU Chile — Regalos Corporativos Sostenibles';
  const finalImage = image || defaultImage;
  const finalUrl = url || 'https://peyuchile.cl';
  // Nunca dejamos description vacía: si la página no pasa una, usamos el default.
  // Esto evita que Google herede la description de la página anterior al navegar.
  const finalDescription = description || defaultDescription;

  useEffect(() => {
    // Title
    document.title = finalTitle;

    const setMeta = (nameOrProp, attr, content) => {
      // Siempre actualiza (incluso a vacío) para que NO quede pegado el valor
      // de la página anterior en navegaciones SPA.
      const selector = `meta[${attr}="${nameOrProp}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content || '');
    };

    // Basic SEO
    setMeta('description', 'name', finalDescription);
    setMeta('robots', 'name', 'index, follow, max-image-preview:large, max-snippet:-1');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = finalUrl;

    // hreflang es-CL (alineado con la canonical de la página actual)
    let hreflang = document.querySelector('link[rel="alternate"][hreflang="es-CL"]');
    if (!hreflang) { hreflang = document.createElement('link'); hreflang.rel = 'alternate'; hreflang.setAttribute('hreflang', 'es-CL'); document.head.appendChild(hreflang); }
    hreflang.href = finalUrl;

    // Open Graph — incluye site_name + locale para que Google muestre "PEYU Chile"
    // como nombre del sitio (no el título genérico de la plantilla).
    setMeta('og:title', 'property', finalTitle);
    setMeta('og:description', 'property', finalDescription);
    setMeta('og:url', 'property', finalUrl);
    setMeta('og:image', 'property', finalImage);
    setMeta('og:type', 'property', type);
    setMeta('og:site_name', 'property', 'PEYU Chile');
    setMeta('og:locale', 'property', 'es_CL');

    // Twitter
    setMeta('twitter:title', 'name', finalTitle);
    setMeta('twitter:description', 'name', finalDescription);
    setMeta('twitter:image', 'name', finalImage);
    setMeta('twitter:card', 'name', 'summary_large_image');

    // JSON-LD Schema
    if (schema) {
      const id = 'seohead-jsonld';
      let ld = document.getElementById(id);
      if (!ld) { ld = document.createElement('script'); ld.id = id; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify(schema);
    }
  }, [finalTitle, finalDescription, finalImage, finalUrl, type, keywords]);

  return null;
}