import { useEffect } from 'react';

/**
 * <NoIndex />
 * Marca la página actual como NO indexable para buscadores.
 * Inyecta <meta name="robots" content="noindex, nofollow"> mientras la página
 * está montada y lo restaura al desmontar (navegación SPA limpia).
 *
 * Úsalo en páginas internas/transaccionales que NO deben aparecer en Google
 * (checkout, carrito, gracias, paneles internos, enlaces de firma, etc.).
 *
 * IMPORTANTE (SEO): para que Google respete el noindex, la URL NO debe estar
 * bloqueada en robots.txt — si está bloqueada, Google nunca rastrea la página
 * y por tanto nunca lee este meta, indexándola "a ciegas".
 */
export default function NoIndex() {
  useEffect(() => {
    let el = document.head.querySelector('meta[name="robots"]');
    const created = !el;
    const prev = el ? el.getAttribute('content') : null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    el.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (created) {
        el.remove();
      } else if (prev !== null) {
        el.setAttribute('content', prev);
      }
    };
  }, []);

  return null;
}