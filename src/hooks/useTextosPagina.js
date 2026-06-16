import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// ════════════════════════════════════════════════════════════════════════
// useTextosPagina — Lee los textos editables de una página pública.
// ------------------------------------------------------------------------
// Devuelve una función t(clave, fallback) que entrega el texto guardado en
// la entidad TextoPagina o, si esa clave no existe todavía, el `fallback`
// (el copy por defecto que vive en el código). De esta forma la página NUNCA
// queda en blanco: si el founder no ha editado nada, se ve igual que hoy.
//
// Uso:
//   const { t, loading } = useTextosPagina('nosotros');
//   <h1>{t('nosotros.hero.titulo', 'Desde una terraza...')}</h1>
// ════════════════════════════════════════════════════════════════════════
export default function useTextosPagina(pagina) {
  const [mapa, setMapa] = useState({});

  useEffect(() => {
    let cancelado = false;
    base44.entities.TextoPagina.filter({ pagina })
      .then((rows) => {
        if (cancelado) return;
        const m = {};
        (rows || []).forEach((r) => { if (r.clave) m[r.clave] = r.valor; });
        setMapa(m);
      })
      .catch(() => { /* sin conexión → solo fallbacks */ });
    return () => { cancelado = true; };
  }, [pagina]);

  // t(clave, fallback): texto guardado o el copy por defecto del código.
  const t = (clave, fallback = '') => {
    const v = mapa[clave];
    return (v !== undefined && v !== null && v !== '') ? v : fallback;
  };

  return { t };
}