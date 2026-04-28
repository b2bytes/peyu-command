import { useEffect } from 'react';
import { ensureGtagLoaded, getMeasurementId } from '@/lib/analytics-peyu';

/**
 * Componente SEO ligero para SPA sin Next/Remix.
 * Inyecta title, meta description, OG, canonical, JSON-LD y gtag.js (GA4).
 *
 * Para páginas de producto pasa la prop `product` con:
 *   { price, currency, availability, condition, brand, sku, category }
 *   Esto inyecta los meta tags Open Graph product / product:* que Facebook,
 *   Google Merchant Center y Pinterest usan para feeds de Shopping.
 */
export default function SEO({
  title,
  description,
  canonical,
  image = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  type = 'website',
  jsonLd = null,
  noindex = false,
  product = null,
  measurementId,
}) {
  useEffect(() => {
    const mid = measurementId || getMeasurementId();
    if (mid) ensureGtagLoaded(mid);
  }, [measurementId]);

  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    // Track de meta tags creadas/actualizadas para limpieza
    const managed = [];

    const setMeta = (selector, attrName, attrValue, key, value) => {
      if (value === null || value === undefined || value === '') return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        if (key && attrName === 'name') el.setAttribute('name', key);
        document.head.appendChild(el);
        managed.push(el);
      }
      el.setAttribute('content', String(value));
    };

    const setOG = (property, value) => {
      if (value === null || value === undefined || value === '') return;
      let el = document.head.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
        managed.push(el);
      }
      el.setAttribute('content', String(value));
    };

    const setName = (name, value) => {
      if (value === null || value === undefined || value === '') return;
      let el = document.head.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
        managed.push(el);
      }
      el.setAttribute('content', String(value));
    };

    // ── Básicos ──
    setName('description', description);
    setName('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // ── Open Graph (Facebook / LinkedIn / WhatsApp) ──
    setOG('og:title', title);
    setOG('og:description', description);
    setOG('og:type', type);
    setOG('og:image', image);
    setOG('og:image:alt', title);
    setOG('og:url', canonical || window.location.href);
    setOG('og:site_name', 'PEYU Chile');
    setOG('og:locale', 'es_CL');

    // ── Twitter Card ──
    setName('twitter:card', 'summary_large_image');
    setName('twitter:title', title);
    setName('twitter:description', description);
    setName('twitter:image', image);
    setName('twitter:site', '@peyuchile');

    // ── Open Graph PRODUCT (Facebook Shop, Pinterest, Google Merchant) ──
    if (product) {
      const {
        price,
        currency = 'CLP',
        availability = 'in stock',     // 'in stock' | 'out of stock' | 'preorder' | 'limited availability'
        condition = 'new',             // 'new' | 'refurbished' | 'used'
        brand = 'PEYU',
        sku,
        category,
        retailerItemId,
        ageGroup = 'adult',
        gender,
      } = product;

      // OG product (Facebook Shop)
      setOG('og:price:amount', price);
      setOG('og:price:currency', currency);
      setOG('og:availability', availability);

      // product:* (Pinterest / Facebook product feed)
      setOG('product:price:amount', price);
      setOG('product:price:currency', currency);
      setOG('product:availability', availability);
      setOG('product:condition', condition);
      setOG('product:brand', brand);
      setOG('product:category', category);
      setOG('product:retailer_item_id', retailerItemId || sku);
      setOG('product:age_group', ageGroup);
      if (gender) setOG('product:gender', gender);
      setOG('product:locale', 'es_CL');
    }

    // ── Canonical link ──
    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
      managed.push(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical || window.location.href);

    // ── hreflang (es-CL) ──
    let hreflangEl = document.head.querySelector('link[rel="alternate"][hreflang="es-CL"]');
    if (!hreflangEl) {
      hreflangEl = document.createElement('link');
      hreflangEl.setAttribute('rel', 'alternate');
      hreflangEl.setAttribute('hreflang', 'es-CL');
      document.head.appendChild(hreflangEl);
      managed.push(hreflangEl);
    }
    hreflangEl.setAttribute('href', canonical || window.location.href);

    // ── JSON-LD ──
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
  }, [title, description, canonical, image, type, jsonLd, noindex, product]);

  return null;
}