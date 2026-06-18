// ════════════════════════════════════════════════════════════════════════
// Las 4 campañas Google Ads PEYU pre-configuradas (briefs profesionales).
// Cada una alimenta a adsGenerateCampaign2026 para generar la campaña completa
// y luego adsExportEditor para descargar el CSV de Google Ads Editor.
// Estrategia alineada a tendencias Google Ads 2026/2027:
//   - Performance Max + Demand Gen dominan el gasto AI (78% en 2026).
//   - AI Max para Search (reemplazo de DSA, +7% conversiones).
//   - Shopping vía Merchant API para empresas.
// ════════════════════════════════════════════════════════════════════════

const BASE = 'https://peyuchile.cl';

export const CAMPANAS_PEYU = [
  {
    key: 'general',
    titulo: 'PEYU General',
    subtitulo: 'Performance Max · B2C todo el catálogo',
    icon: '🛍️',
    color: '#0F8B6C',
    config: {
      codename: 'PEYU_GENERAL_2026',
      campaign_type: 'Performance Max',
      audience: 'B2C Regalos',
      objective: 'Sales B2C',
      daily_budget_clp: 18000,
      landing_url: `${BASE}/`,
      generate_visuals: false,
      operation_brief:
        'Campaña always-on de marca PEYU para B2C. Objetivo: vender el catálogo completo (carcasas recicladas, juegos, hogar, escritorio) a consumidores chilenos que buscan regalos sostenibles y productos de diseño hechos con plástico 100% reciclado en Chile. Performance Max que abarque Search, Shopping, YouTube, Discover, Gmail y Display, dejando que la IA de Google optimice hacia conversiones. Posicionar PEYU como la marca chilena líder en regalos con propósito.',
    },
  },
  {
    key: 'fiestas_empresas',
    titulo: 'Fiestas Patrias · Empresas',
    subtitulo: 'Search + Shopping · Regalos corporativos B2B',
    icon: '🇨🇱',
    color: '#D96B4D',
    config: {
      codename: 'FIESTAS_PATRIAS_EMPRESAS_2026',
      campaign_type: 'Search',
      audience: 'B2B Corporativo',
      objective: 'Leads B2B',
      daily_budget_clp: 22000,
      landing_url: `${BASE}/fiestas-patrias/empresas`,
      generate_visuals: false,
      operation_brief:
        'Campaña estacional de Fiestas Patrias dirigida a EMPRESAS que buscan regalos corporativos para sus colaboradores y clientes en Septiembre. Captar a encargados de RRHH, marketing y compras corporativas que buscan en Google "regalos fiestas patrias empresa", "regalos corporativos 18 de septiembre", "regalos empresariales sostenibles". Diferenciadores clave: personalización con logo láser UV gratis desde 10 unidades, plástico 100% reciclado, hecho en Chile, cotización rápida por volumen, garantía 10 años, despacho a todo Chile. Tono profesional B2B enfocado en volumen, ESG corporativo y entrega a tiempo para el 18. Dirigir todo el tráfico a la landing de empresas de Fiestas Patrias.',
    },
  },
  {
    key: 'carcasas',
    titulo: 'Carcasas B2C',
    subtitulo: 'Demand Gen · YouTube + Discover visual',
    icon: '📱',
    color: '#22D3EE',
    config: {
      codename: 'CARCASAS_DEMANDGEN_2026',
      campaign_type: 'Demand Gen',
      audience: 'B2C Sostenibilidad',
      objective: 'Sales B2C',
      daily_budget_clp: 15000,
      landing_url: `${BASE}/CatalogoNuevo`,
      generate_visuals: true,
      num_visuals: 4,
      operation_brief:
        'Campaña Demand Gen visual para vender carcasas biodegradables de celular (iPhone, Huawei, etc.) hechas con plástico 100% reciclado. Audiencia: jóvenes y adultos chilenos eco-conscientes que descubren productos en YouTube Shorts, Discover y Gmail. Creative-first: mostrar las carcasas en uso real, colores vibrantes, personalización con grabado láser, historia de impacto ambiental (rescate de tapitas plásticas). Generar deseo y descubrimiento, no responder a búsqueda directa. Dirigir al catálogo.',
    },
  },
  {
    key: 'marca',
    titulo: 'Marca · Awareness',
    subtitulo: 'Demand Gen · Historia e impacto PEYU',
    icon: '🐢',
    color: '#8BAD8A',
    config: {
      codename: 'PEYU_AWARENESS_2026',
      campaign_type: 'Demand Gen',
      audience: 'B2C Sostenibilidad',
      objective: 'Awareness',
      daily_budget_clp: 12000,
      landing_url: `${BASE}/nosotros`,
      generate_visuals: true,
      num_visuals: 4,
      operation_brief:
        'Campaña de awareness de marca para contar la historia de PEYU: de dos amigos del colegio a la fábrica de plástico reciclado de Chile, con +216K de comunidad. Objetivo: construir reconocimiento de marca y conexión emocional con el propósito sostenible, no venta directa. Demand Gen en YouTube y Discover con narrativa de impacto ambiental, fabricación local en Chile y comunidad. Dirigir a la página Nosotros para profundizar el vínculo.',
    },
  },
];