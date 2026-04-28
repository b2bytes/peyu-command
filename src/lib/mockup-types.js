// ============================================================================
// mockup-types — Detecta el tipo de mockup según el producto.
// ----------------------------------------------------------------------------
// Cada producto PEYU acepta un tipo de personalización distinto:
//   • logo            → grabado láser de logo/texto (default — la mayoría)
//   • retrato         → cuadro con foto/retrato impreso
//   • foto            → posavasos con foto a color (sublimación)
//   • jenga           → grabado en algunas piezas seleccionadas
//   • diseno_paisaje  → diseños pre-armados (no editable, sólo visualización)
//
// La detección usa el SKU primero (más confiable) y cae a categoría/nombre.
// ============================================================================

export const MOCKUP_TYPES = {
  LOGO: 'logo',
  RETRATO: 'retrato',
  FOTO: 'foto',
  JENGA: 'jenga',
  NONE: 'none',
};

const SKU_PATTERNS = {
  // Cuadros → admiten retrato/foto impresa
  retrato: [/^HOG-CUADRO/i, /^HOG-RETRATO/i, /^HOG-FOTO/i],
  // Jenga → grabado en piezas individuales
  jenga: [/^ENT-JENGA/i, /^ENT-DOMINO/i],
  // Posavasos → admiten foto a color
  foto: [/^HOG-POSAV/i, /^COR-POSAV/i],
};

const NAME_KEYWORDS = {
  retrato: ['cuadro', 'retrato', 'marco', 'portarretrato'],
  jenga: ['jenga', 'domino', 'dominó'],
  foto: ['posavaso', 'posavasos'],
};

/**
 * Devuelve el tipo de mockup recomendado según el producto.
 */
export function detectMockupType(producto) {
  if (!producto) return MOCKUP_TYPES.LOGO;

  const sku = String(producto.sku || '').toUpperCase();
  const nombre = String(producto.nombre || '').toLowerCase();

  // Gift Cards → no aplica mockup
  if (sku.startsWith('GC-PEYU')) return MOCKUP_TYPES.NONE;

  // Detectar por SKU pattern
  for (const [type, patterns] of Object.entries(SKU_PATTERNS)) {
    if (patterns.some(p => p.test(sku))) return type;
  }

  // Detectar por keywords en nombre
  for (const [type, keywords] of Object.entries(NAME_KEYWORDS)) {
    if (keywords.some(k => nombre.includes(k))) return type;
  }

  // Default: grabado láser de logo
  return MOCKUP_TYPES.LOGO;
}

/**
 * Configuración UI para cada tipo de mockup.
 */
export const MOCKUP_UI_CONFIG = {
  logo: {
    title: 'Grabado láser UV',
    icon: '✨',
    description: 'Sube tu logo o escribe el texto que quieres grabar.',
    inputLabel: 'Texto a grabar',
    inputPlaceholder: 'Tu marca, frase o nombre',
    fileLabel: 'Sube tu logo',
    fileHint: 'PNG, JPG o SVG · máx 10MB',
    showText: true,
    showFile: true,
    fileRequired: false,
  },
  retrato: {
    title: 'Cuadro con tu foto / retrato',
    icon: '🖼️',
    description: 'Sube la fotografía que quieres imprimir en el cuadro.',
    inputLabel: 'Texto opcional bajo la foto',
    inputPlaceholder: 'Familia López · 2026',
    fileLabel: 'Sube la fotografía',
    fileHint: 'JPG o PNG · alta resolución recomendada',
    showText: true,
    showFile: true,
    fileRequired: true,
  },
  foto: {
    title: 'Posavasos con foto',
    icon: '📷',
    description: 'Sube la imagen que se imprimirá a color en cada posavaso.',
    inputLabel: 'Texto opcional',
    inputPlaceholder: 'Mensaje breve',
    fileLabel: 'Sube la imagen',
    fileHint: 'JPG o PNG · cuadrada recomendada',
    showText: true,
    showFile: true,
    fileRequired: true,
  },
  jenga: {
    title: 'Jenga personalizado',
    icon: '🪵',
    description: 'Grabamos tu logo en piezas seleccionadas (no en todas) para que la torre conserve estabilidad y estética.',
    inputLabel: 'Texto a grabar',
    inputPlaceholder: 'Nombre empresa / Slogan',
    fileLabel: 'Sube tu logo',
    fileHint: 'PNG transparente recomendado',
    showText: true,
    showFile: true,
    fileRequired: false,
  },
  none: {
    title: 'Sin personalización',
    icon: '—',
    description: 'Este producto no admite personalización.',
    showText: false,
    showFile: false,
  },
};