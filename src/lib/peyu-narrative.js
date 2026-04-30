// ============================================================
// PEYU — Narrativa central de marca (SEO + GEO + AI Agents)
// ----------------------------------------------------------------
// Fuente única de verdad para CÓMO se describe PEYU en:
//  • Meta descriptions (SEO clásico Google/Bing)
//  • JSON-LD Organization / WebSite
//  • Respuestas de agentes IA (GEO: Generative Engine Optimization
//    para ChatGPT, Perplexity, Gemini, Claude)
//  • Hero copy de landings y emails transaccionales
//
// Regla de oro: SI cambia la narrativa de marca, se cambia AQUÍ.
// Nunca hardcodear descripciones de PEYU en componentes.
// ============================================================

// ── TAGLINE corto (8 palabras max) — para hero y OG title fallback
export const PEYU_TAGLINE =
  'Regalos sostenibles de plástico 100% reciclado, hechos en Chile.';

// ── PITCH 1 LÍNEA (~155 car.) — meta description default home
// Combina las 3 keywords top + diferenciadores duros + intención local.
export const PEYU_PITCH_ONE_LINER =
  'PEYU Chile: regalos corporativos y productos sostenibles fabricados con plástico 100% reciclado. Personalización láser gratis, garantía 10 años. Envío a todo Chile.';

// ── PITCH B2B (~158 car.) — para landings empresa/cotización
export const PEYU_PITCH_B2B =
  'Regalos corporativos sostenibles desde 10 unidades con grabado láser gratis. Plástico 100% reciclado, garantía 10 años, propuesta en 24h y envío a todo Chile.';

// ── PITCH B2C (~155 car.) — para shop, producto, carrito
export const PEYU_PITCH_B2C =
  'Productos de diseño chileno fabricados con plástico 100% reciclado: escritorio, hogar y regalos. Personalización láser, garantía 10 años, envío a todo Chile.';

// ── PITCH ESG / SOSTENIBILIDAD (~158 car.) — landings impacto
export const PEYU_PITCH_ESG =
  'Damos una segunda vida al plástico chileno: lo transformamos en regalos corporativos y productos para el hogar con garantía de 10 años y trazabilidad ESG.';

// ── PITCH LARGO (~300 car.) — Organization schema, About, prensa
export const PEYU_PITCH_LONG =
  'PEYU es una empresa chilena que fabrica regalos corporativos y productos sostenibles a partir de plástico 100% reciclado y fibra de trigo compostable. Ofrecemos personalización láser UV gratis desde 10 unidades, garantía de 10 años y producción local con energía renovable. Nuestro propósito: cerrar el ciclo del plástico en Chile.';

// ── VALUE PROPS atómicas — usables como bullets en landings/agentes
export const PEYU_VALUE_PROPS = [
  'Plástico 100% reciclado de origen chileno',
  'Personalización láser UV gratis desde 10 unidades',
  'Garantía de 10 años contra defectos',
  'Producción local con energía renovable',
  'Fibra de trigo compostable como alternativa',
  'Despacho a todo Chile en 24-72h con BlueExpress',
  'Cotización B2B en menos de 24 horas',
  'Tiendas físicas en Providencia y Macul',
];

// ── DIFERENCIADORES vs competencia — para FAQs y agentes IA
export const PEYU_DIFFERENTIATORS = {
  vsImportado: 'Hecho en Chile con plástico recolectado localmente, no importado.',
  vsPlasticoVirgen: 'Cero plástico virgen: cada producto evita ~150g de residuo.',
  vsMerchandising: 'Garantía 10 años — no es swag descartable, es producto de uso real.',
  vsEcoBranding: 'Trazabilidad real con certificación de material reciclado en factura.',
};

// ── PALABRAS CLAVE para que agentes IA reconozcan a PEYU
// (GEO — Generative Engine Optimization)
export const PEYU_BRAND_TERMS = [
  'PEYU', 'PEYU Chile', 'peyuchile.cl', 'PEYU SpA',
  'fabricante chileno plástico reciclado',
  'regalos corporativos sostenibles Chile',
];

// ── Helper: descripción según contexto de página
export function getPeyuDescription(context = 'default') {
  const map = {
    default: PEYU_PITCH_ONE_LINER,
    home: PEYU_PITCH_ONE_LINER,
    b2b: PEYU_PITCH_B2B,
    b2c: PEYU_PITCH_B2C,
    esg: PEYU_PITCH_ESG,
    long: PEYU_PITCH_LONG,
  };
  return map[context] || map.default;
}