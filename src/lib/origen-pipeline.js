// ============================================================================
// origen-pipeline · Cruza el ORIGEN de cada lead B2B con su ETAPA actual.
// Objetivo: detectar qué fuentes de tráfico traen leads que se estancan antes
// de cerrar (quedan en Contactado / En revisión / Propuesta enviada).
// ============================================================================

export const ETAPAS = ['Nuevo', 'Contactado', 'En revisión', 'Propuesta enviada', 'Aceptado', 'Perdido'];
// Etapas intermedias: el lead entró al pipeline pero no cerró ni se descartó.
export const ETAPAS_ESTANCADAS = ['Contactado', 'En revisión', 'Propuesta enviada'];

/** Origen legible del lead: UTM si existe, si no la fuente declarada. */
export function origenDeLead(lead) {
  const utm = (lead.utm_source || '').trim();
  if (utm) return utm;
  return lead.source || 'Otro';
}

/** Días sin movimiento desde la última actualización. */
export function diasSinMovimiento(lead) {
  const ref = lead.updated_date || lead.created_date;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
}

/**
 * Agrupa los leads por origen y calcula, para cada uno, cuántos hay en cada
 * etapa, su tasa de cierre y su tasa de estancamiento.
 */
export function agruparPorOrigen(leads, { diasEstancado = 7 } = {}) {
  const mapa = {};

  for (const lead of leads) {
    const origen = origenDeLead(lead);
    if (!mapa[origen]) {
      mapa[origen] = {
        origen,
        total: 0,
        etapas: Object.fromEntries(ETAPAS.map((e) => [e, 0])),
        estancados: 0,
        cerrados: 0,
        perdidos: 0,
        leadsEstancados: [],
      };
    }
    const g = mapa[origen];
    g.total++;
    if (g.etapas[lead.status] !== undefined) g.etapas[lead.status]++;

    if (lead.status === 'Aceptado') g.cerrados++;
    else if (lead.status === 'Perdido') g.perdidos++;
    else if (ETAPAS_ESTANCADAS.includes(lead.status) && diasSinMovimiento(lead) >= diasEstancado) {
      g.estancados++;
      g.leadsEstancados.push(lead);
    }
  }

  return Object.values(mapa)
    .map((g) => ({
      ...g,
      cierrePct: g.total > 0 ? Math.round((g.cerrados / g.total) * 100) : 0,
      estancadoPct: g.total > 0 ? Math.round((g.estancados / g.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Origen con más leads estancados en términos absolutos. */
export function origenMasProblematico(grupos) {
  const conEstancados = grupos.filter((g) => g.estancados > 0);
  if (conEstancados.length === 0) return null;
  return conEstancados.reduce((a, b) => (b.estancados > a.estancados ? b : a));
}