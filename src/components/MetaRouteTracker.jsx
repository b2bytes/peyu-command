// ============================================================================
// MetaRouteTracker · Dispara automáticamente el evento estándar de Meta Pixel
// correcto según la ruta actual, en CADA navegación del sitio público.
// Se monta una sola vez (en PublicPageLayout) y escucha los cambios de URL.
//
// Eventos por ruta:
//   /gracias            → Purchase (lee numero + total de la URL, con dedup)
//   /contacto, /soporte → Contact
//
// PageView ya lo dispara el código base del pixel en index.html en cada carga.
// ViewContent / AddToCart / InitiateCheckout / Lead se disparan en sus propios
// componentes (ficha de producto, carrito, checkout, formularios B2B) porque
// dependen de datos que solo esos componentes conocen.
// ============================================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPurchase, trackContact } from '@/lib/meta-pixel';
import { track } from '@/lib/activity-tracker';

export default function MetaRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    // No trackear el backoffice: solo el sitio público cuenta como visita.
    if (path.startsWith('/admin')) return;
    const params = new URLSearchParams(location.search);

    // Recorrido del cliente: cada cambio de página registra una visita en
    // nuestra base de datos (ActivityLog → journey 360° en /admin/trazabilidad)
    // y dispara PageView al píxel de Meta (en SPA no se recarga index.html, así
    // que sin esto Meta perdía las visitas internas al navegar entre páginas).
    track.pageView(location.pathname + location.search);
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      try { window.fbq('track', 'PageView'); } catch { /* fbq aún no listo */ }
    }

    if (path.startsWith('/gracias')) {
      const numero = params.get('numero') || undefined;
      const totalRaw = params.get('total');
      const value = totalRaw ? Number(String(totalRaw).replace(/\D/g, '')) : undefined;
      trackPurchase({ value, order_id: numero });
    } else if (path.startsWith('/contacto') || path.startsWith('/soporte')) {
      trackContact({ content_name: path });
    }
  }, [location.pathname, location.search]);

  return null;
}