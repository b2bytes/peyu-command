import { useEffect } from 'react';

/**
 * Componente SEO ligero para SPA sin Next/Remix.
 * Inyecta title, meta description, OG, canonical y JSON-LD sin dependencias externas.
 */
export default function SEO({
  title,
  description,
  canonical,
  image = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  type = 'website',
  jsonLd = null,
  noindex = false,
}) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const setMeta = (selector, attr, key, value) => {
      if (!value) return null;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
      return el;
    };

    const created = [];
    created.push(setMeta('meta[name="description"]', 'name', 'description', description));
    created.push(setMeta('meta[property="og:title"]', 'property', 'og:title', title));
    created.push(setMeta('meta[property="og:description"]', 'property', 'og:description', description));
    created.push(setMeta('meta[property="og:type"]', 'property', 'og:type', type));
    created.push(setMeta('meta[property="og:image"]', 'property', 'og:image', image));
    created.push(setMeta('meta[property="og:url"]', 'property', 'og:url', canonical || window.location.href));
    created.push(setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title));
    created.push(setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description));
    created.push(setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image));
    created.push(setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow'));

    // Canonical
    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical || window.location.href);

    // JSON-LD
    let script = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      script.setAttribute('data-seo', 'page');
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      if (script) script.remove();
    };
  }, [title, description, canonical, image, type, jsonLd, noindex]);

  return null;
}