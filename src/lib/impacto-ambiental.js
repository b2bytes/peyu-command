// ─────────────────────────────────────────────────────────────────────────────
// Impacto ambiental real por unidad de producto PEYU
// ─────────────────────────────────────────────────────────────────────────────
// Datos basados en LCA (Life Cycle Assessment) publicados:
//   - ACS Sustainable Chem. Eng. (2022) — bioplásticos vs PET
//   - MDPI Sustainability 16/4013 (2024) — pirólisis paja de trigo
//   - CE Delft (2023) — biobased plastics carbon footprint
//   - Science of Total Environment (2024) — bioplastics LCA
//   - rarecustom.com (2025) — phone case industry baseline 3.5 kg CO₂/u
//
// Datos PEYU operacionales:
//   - Peso promedio carcasa: 25g (fibra trigo) / 30g (plástico reciclado)
//   - Producción local en Santiago → 0 emisiones de import
// ─────────────────────────────────────────────────────────────────────────────

// Detección de material a partir del producto
export function getTipoMaterial(producto) {
  if (!producto) return 'reciclado';
  const mat = (producto.material || '').toLowerCase();
  const cat = (producto.categoria || '').toLowerCase();
  const nom = (producto.nombre || '').toLowerCase();
  const sku = (producto.sku || '').toLowerCase();

  // Fibra de trigo / compostable
  if (
    mat.includes('trigo') ||
    mat.includes('compost') ||
    mat.includes('fibra') ||
    nom.includes('trigo') ||
    sku.startsWith('ft-') ||
    cat.includes('carcas')   // todas las carcasas PEYU son fibra de trigo
  ) {
    return 'fibra_trigo';
  }
  return 'reciclado';
}

// Impacto por unidad según material
// Fuentes: LCA papers citados arriba + producción local PEYU
export const IMPACTO_POR_UNIDAD = {
  fibra_trigo: {
    // Carcasa de fibra de trigo (~25 g)
    paja_valorizada_g: 30,         // gramos de paja de trigo agrícola valorizada
    co2_evitado_kg: 2.4,           // vs. carcasa de policarbonato virgen (3.5 → 1.1)
    co2_quema_evitado_kg: 0.3,     // CO₂ que NO se emite porque la paja no se quema en campo
    agua_ahorrada_l: 6,            // vs producción virgen (4-7 L/kg bioplásticos)
    petroleo_evitado_g: 50,        // ~50 g petróleo crudo no usado
    biodegradacion_dias: 180,      // compostaje industrial (90-180 días)
    microplasticos: 0,             // CERO
  },
  reciclado: {
    // Producto de plástico 100% post-consumo (~30 g)
    plastico_rescatado_g: 30,      // gramos de plástico post-consumo rescatado en Chile
    co2_evitado_kg: 2.1,           // vs producir desde petróleo virgen
    agua_ahorrada_l: 12,           // ~12 L (35 L/kg PC virgen → ~10 L/kg reciclado)
    petroleo_evitado_g: 70,        // 1 kg plástico = ~2.3 kg petróleo
    botellas_pet_equiv: 1.5,       // ~20 g de PET por botella
  },
};

// Construye el resumen de impacto para mostrar en UI (3 KPIs principales)
export function buildImpactoUnidad(producto) {
  const tipo = getTipoMaterial(producto);
  const data = IMPACTO_POR_UNIDAD[tipo];

  if (tipo === 'fibra_trigo') {
    return {
      tipo,
      titulo: 'Impacto real por unidad',
      narrativa: 'Esta carcasa nace de paja de trigo: el residuo agrícola que tradicionalmente se quema en campo (contamina el aire) o se descarta. Aquí lo convertimos en biocomposite duradero, 100% compostable al final de su vida útil. Sin policarbonato virgen, sin microplásticos.',
      kpis: [
        {
          icon: '🌾',
          label: 'Paja de trigo valorizada',
          valor: `${data.paja_valorizada_g} g`,
          detalle: 'residuo agrícola convertido en producto · evita quema en campo',
        },
        {
          icon: '🌱',
          label: 'CO₂ evitado',
          valor: `${data.co2_evitado_kg} kg CO₂eq`,
          detalle: `vs. carcasa de policarbonato virgen (industria: ~3.5 kg/u)`,
        },
        {
          icon: '💧',
          label: 'Agua ahorrada',
          valor: `~${data.agua_ahorrada_l} L`,
          detalle: 'vs. producción de plástico virgen (35 L/kg → 4 L/kg)',
        },
      ],
      eol: {
        titulo: 'Final de vida útil',
        items: [
          { e: '♻️', t: `Compostable industrial en ${data.biodegradacion_dias} días` },
          { e: '🚫', t: 'Cero microplásticos al degradarse' },
          { e: '🌍', t: 'Sin huella tóxica permanente' },
        ],
      },
    };
  }

  // Reciclado
  return {
    tipo,
    titulo: 'Impacto real por unidad',
    narrativa: 'Este producto se fabrica con plástico post-consumo recolectado en Santiago — botellas, tapas y envases que iban a vertedero o al mar. Cada pieza es única: el marmolado nace del proceso de inyección con materiales reciclados mezclados artesanalmente.',
    kpis: [
      {
        icon: '♻️',
        label: 'Plástico rescatado',
        valor: `${data.plastico_rescatado_g} g`,
        detalle: `≈ ${data.botellas_pet_equiv} botellas PET fuera del vertedero`,
      },
      {
        icon: '🌱',
        label: 'CO₂ evitado',
        valor: `${data.co2_evitado_kg} kg CO₂eq`,
        detalle: 'vs. producir plástico virgen desde petróleo',
      },
      {
        icon: '💧',
        label: 'Agua ahorrada',
        valor: `~${data.agua_ahorrada_l} L`,
        detalle: 'reciclar vs. producción virgen (PC: 35 L/kg)',
      },
    ],
    eol: {
      titulo: 'Diseño circular',
      items: [
        { e: '🔁', t: 'Reciclable nuevamente al final de uso' },
        { e: '🛡️', t: 'Garantía 10 años: durabilidad = sostenibilidad' },
        { e: '🇨🇱', t: 'Producción local: cero millas marítimas' },
      ],
    },
  };
}

// Para el carrito agregado: suma impacto de varios items
export function buildImpactoCarrito(carrito) {
  if (!carrito?.length) return null;

  let totalUnidades = 0;
  let plastico_g = 0;
  let paja_g = 0;
  let co2_kg = 0;
  let agua_l = 0;

  carrito.forEach(item => {
    const tipo = getTipoMaterial(item);
    const d = IMPACTO_POR_UNIDAD[tipo];
    const n = item.cantidad || 1;
    totalUnidades += n;
    co2_kg += (d.co2_evitado_kg || 0) * n;
    agua_l += (d.agua_ahorrada_l || 0) * n;
    if (tipo === 'fibra_trigo') paja_g += d.paja_valorizada_g * n;
    else plastico_g += d.plastico_rescatado_g * n;
  });

  return {
    totalUnidades,
    plastico_g: Math.round(plastico_g),
    paja_g: Math.round(paja_g),
    co2_kg: Math.round(co2_kg * 10) / 10,
    agua_l: Math.round(agua_l),
    botellas_equiv: Math.max(1, Math.round(plastico_g / 20)),
  };
}