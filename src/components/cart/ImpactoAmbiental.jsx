import { Recycle, Droplet, Leaf, Sprout } from 'lucide-react';
import { buildImpactoCarrito } from '@/lib/impacto-ambiental';

/**
 * Tu impacto real — Resumen del impacto ambiental del carrito.
 *
 * Datos basados en LCA reales (ver lib/impacto-ambiental.js):
 *  - Plástico reciclado: 30g por unidad rescatado en Chile, 2.1 kg CO₂eq evitado, ~12L agua.
 *  - Fibra de trigo: 30g paja valorizada, 2.4 kg CO₂eq evitado, ~6L agua.
 *
 * Variantes:
 *  - "card" (default): caja gradient completa — uso standalone.
 *  - "inline": footer minimalista para integrarse dentro de otro card (ej: Resumen).
 */
export default function ImpactoAmbiental({ carrito, variant = 'card' }) {
  if (!carrito || carrito.length === 0) return null;

  const i = buildImpactoCarrito(carrito);
  if (!i) return null;

  const { plastico_g, paja_g, co2_kg, agua_l, botellas_equiv } = i;
  const mostrarPlastico = plastico_g > 0;
  const mostrarPaja = paja_g > 0;

  // ── Variante INLINE — para usar como footer dentro de otro card ──────
  if (variant === 'inline') {
    return (
      <div className="border-t border-emerald-100 mt-4 pt-4 -mx-1">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Tu impacto real</p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          {mostrarPlastico && (
            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-700 mb-0.5">
                <Recycle className="w-3 h-3" />
                <span className="text-[9px] font-semibold uppercase tracking-wide">Plástico</span>
              </div>
              <p className="font-poppins font-bold text-emerald-900 text-sm leading-none tabular-nums">
                {plastico_g}<span className="text-[9px] font-semibold ml-0.5 text-emerald-700/70">g</span>
              </p>
              <p className="text-[8.5px] text-emerald-700/70 mt-0.5">≈ {botellas_equiv} botella{botellas_equiv !== 1 ? 's' : ''} PET</p>
            </div>
          )}

          {mostrarPaja && !mostrarPlastico && (
            <div>
              <div className="flex items-center justify-center gap-1 text-amber-700 mb-0.5">
                <Sprout className="w-3 h-3" />
                <span className="text-[9px] font-semibold uppercase tracking-wide">Trigo</span>
              </div>
              <p className="font-poppins font-bold text-amber-900 text-sm leading-none tabular-nums">
                {paja_g}<span className="text-[9px] font-semibold ml-0.5 text-amber-700/70">g</span>
              </p>
              <p className="text-[8.5px] text-amber-700/70 mt-0.5">paja valorizada</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-center gap-1 text-blue-700 mb-0.5">
              <Droplet className="w-3 h-3" />
              <span className="text-[9px] font-semibold uppercase tracking-wide">Agua</span>
            </div>
            <p className="font-poppins font-bold text-blue-900 text-sm leading-none tabular-nums">
              {agua_l}<span className="text-[9px] font-semibold ml-0.5 text-blue-700/70">L</span>
            </p>
            <p className="text-[8.5px] text-blue-700/70 mt-0.5">ahorrados</p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-teal-700 mb-0.5">
              <Leaf className="w-3 h-3" />
              <span className="text-[9px] font-semibold uppercase tracking-wide">CO₂</span>
            </div>
            <p className="font-poppins font-bold text-teal-900 text-sm leading-none tabular-nums">
              {co2_kg}<span className="text-[9px] font-semibold ml-0.5 text-teal-700/70">kg</span>
            </p>
            <p className="text-[8.5px] text-teal-700/70 mt-0.5">evitados</p>
          </div>
        </div>

        <p className="text-[9px] text-gray-400 mt-2.5 text-center leading-relaxed">
          Estimación basada en LCA · vs. producción virgen
        </p>
      </div>
    );
  }

  // ── Variante CARD (legacy / standalone) ────────────────────────────
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
          <p className="text-[10px] text-emerald-700/70">Con esta compra evitarás:</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {mostrarPlastico && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-emerald-100 flex items-center gap-2.5">
            <Recycle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-poppins font-bold text-emerald-900 text-base leading-none tabular-nums">
                {plastico_g.toLocaleString('es-CL')}<span className="text-xs font-semibold ml-0.5">g</span>
              </p>
              <p className="text-[10px] text-emerald-700/80 mt-0.5 leading-tight">
                plástico rescatado · ≈ {botellas_equiv} botella{botellas_equiv !== 1 ? 's' : ''} PET
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Droplet className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-[9px] font-semibold text-blue-700 uppercase tracking-wide">Agua</p>
            </div>
            <p className="font-poppins font-bold text-blue-900 text-sm leading-none tabular-nums">
              {agua_l}<span className="text-[10px] font-semibold ml-0.5">L</span>
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Leaf className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <p className="text-[9px] font-semibold text-teal-700 uppercase tracking-wide">CO₂</p>
            </div>
            <p className="font-poppins font-bold text-teal-900 text-sm leading-none tabular-nums">
              {co2_kg}<span className="text-[10px] font-semibold ml-0.5">kg</span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-emerald-700/60 mt-3 leading-relaxed">
        💚 Estimación basada en LCA de productos PEYU vs. producción virgen.
      </p>
    </div>
  );
}