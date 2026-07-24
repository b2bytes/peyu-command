import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useFeatureFlag(clave) — consulta si un módulo público está activado desde el
 * admin (/admin/fidelizacion). Regla de seguridad: mientras carga o si el flag
 * no existe / falla la lectura, el módulo queda APAGADO (default false).
 * Cache simple en memoria para no repetir la consulta entre componentes.
 */
const cache = {};

export default function useFeatureFlag(clave) {
  const [enabled, setEnabled] = useState(() => cache[clave] === true);

  useEffect(() => {
    if (clave in cache) { setEnabled(cache[clave] === true); return; }
    let alive = true;
    base44.entities.FeatureFlag.filter({ clave })
      .then((rows) => {
        const on = rows?.[0]?.activo === true;
        cache[clave] = on;
        if (alive) setEnabled(on);
      })
      .catch(() => { cache[clave] = false; });
    return () => { alive = false; };
  }, [clave]);

  return enabled;
}