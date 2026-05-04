import { Recycle, Droplet, Leaf } from 'lucide-react';

/**
 * Datos de Impacto Real — Resumen dinámico del impacto ambiental del carrito.
 *
 * Cálculo (estimaciones internas PEYU validadas en ESG report 2025):
 *  - Plástico rescatado: 80g por unidad de carcasa/producto reciclado.
 *    Productos de fibra de trigo no suman plástico (compostables) pero sí CO₂.
 *  - Agua ahorrada vs producción virgen: ~3.2L por unidad.
 *  - CO₂ evitado: ~0.18 kg por unidad.
 *
 * Si en el futuro existe `producto.gramos_plastico_reciclado` por SKU,
 * conviene leerlo desde el item; mientras tanto usamos el promedio.
 */

const PLASTICO_GRAMOS_POR_UNIDAD = 80;   // g de plástico post-consumo evitado del océano
const AGUA_LITROS_POR_UNIDAD = 3.2;      // L vs producción virgen
const CO2_KG_POR_UNIDAD = 0.18;          // kg CO₂eq evitado

const esCompostable = (item) =>
  /trigo|compostable|fibra/i.test(item?.nombre || '') ||
  /^FT-/i.test(item?.sku || '');

export default function ImpactoAmbiental({ carrito }) {
  if (!carrito || carrito.length === 0) return null;

  // Solo cuentan plástico los productos NO compostables (carcasas, escritorio, etc.)
  const unidadesPlastico = carrito.reduce(
    (sum, i) => sum + (esCompostable(i) ? 0 : i.cantidad),
    0
  );
  const unidadesTotales = carrito.reduce((sum, i) => sum + i.cantidad, 0);

  const gramosPlastico = Math.round(unidadesPlastico * PLASTICO_GRAMOS_POR_UNIDAD);
  const litrosAgua = Math.round(unidadesTotales * AGUA_LITROS_POR_UNIDAD * 10) / 10;
  const kgCO2 = Math.round(unidadesTotales * CO2_KG_POR_UNIDAD * 100) / 100;

  // Equivalencia visual: 1 botella PET = ~20g
  const botellasEquivalentes = Math.max(1, Math.round(gramosPlastico / 20));

  // Si no hay plástico (carrito 100% compostable), mostramos solo CO₂ y agua
  const mostrarPlastico = gramosPlastico > 0;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/70 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <h3 className="font-poppins font-bold text-emerald-900 text-sm leading-tight">
            Tu impacto real
          </h3>
          <p className="text-[10px] text-emerald-700/70">
            Con esta compra evitarás:
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {mostrarPlastico && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-emerald-100">
            <div className="flex items-center gap-2.5">
              <Recycle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-poppins font-bold text-emerald-900 text-base leading-none">
                  {gramosPlastico.toLocaleString('es-CL')}<span className="text-xs font-semibold ml-0.5">g</span>
                </p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5 leading-tight">
                  plástico rescatado del océano · ≈ {botellasEquivalentes} botella{botellasEquivalentes !== 1 ? 's' : ''} PET
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Droplet className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-[9px] font-semibold text-blue-700 uppercase tracking-wide">Agua</p>
            </div>
            <p className="font-poppins font-bold text-blue-900 text-sm leading-none">
              {litrosAgua}<span className="text-[10px] font-semibold ml-0.5">L</span>
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Leaf className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <p className="text-[9px] font-semibold text-teal-700 uppercase tracking-wide">CO₂</p>
            </div>
            <p className="font-poppins font-bold text-teal-900 text-sm leading-none">
              {kgCO2}<span className="text-[10px] font-semibold ml-0.5">kg</span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-emerald-700/60 mt-3 leading-relaxed">
        💚 Estimación basada en LCA de productos PEYU vs producción virgen.
      </p>
    </div>
  );
}