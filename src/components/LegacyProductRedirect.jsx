import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * LegacyProductRedirect — Redirige URLs antiguas de productos a ProductoNuevo
 * preservando el ID en la query string.
 * 
 * Uso: <Route path="/producto/:id" element={<LegacyProductRedirect />} />
 */
export default function LegacyProductRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Redirige a la nueva URL con ID en query string
      navigate(`/ProductoNuevo?id=${encodeURIComponent(id)}`, { replace: true });
    } else {
      // Sin ID válido, va al catálogo nuevo
      navigate('/CatalogoNuevo', { replace: true });
    }
  }, [id, navigate]);

  return null;
}