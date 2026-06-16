// Helpers de fecha para el Agent OS (CRM/ERP). Muestran fechas precisas y
// legibles en hora Chile, con texto relativo ("hace 2h", "ayer") para que el
// founder sepa exactamente CUÁNDO pasó cada cosa: llegó el lead, se pagó el
// pedido, se generó la etiqueta, etc.

const TZ = 'America/Santiago';

// Fecha + hora exacta: "16 jun, 14:32"
export function fmtFechaHora(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleString('es-CL', {
      timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return null; }
}

// Fecha sola: "16 jun 2026"
export function fmtFecha(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('es-CL', {
      timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return null; }
}

// Texto relativo preciso: "ahora", "hace 5 min", "hace 2h", "ayer", "hace 3 días".
export function fmtRelativo(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date)) return null;
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return `hace ${Math.floor(dias / 7)} sem`;
  return fmtFecha(d);
}

// Combo para chips de tarjetas: "16 jun, 14:32 · hace 2h"
export function fmtFechaCompleta(d) {
  if (!d) return null;
  const abs = fmtFechaHora(d);
  const rel = fmtRelativo(d);
  return rel && rel !== abs ? `${abs} · ${rel}` : abs;
}