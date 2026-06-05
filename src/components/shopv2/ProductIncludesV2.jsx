import { Package, Leaf, Recycle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// Sección "Incluye" + Impacto ambiental del Shop v2 (Baymard 2026 #7).
// Lee incluye_items_v2 / incluye / tapitas_aprox del producto. Calcula gramos
// de plástico salvado (estimación: ~2.2g por tapita). Todo visual y honesto.
// ════════════════════════════════════════════════════════════════════════
const GRAMOS_POR_TAPITA = 2.2;

export default function ProductIncludesV2({ producto, cantidad = 1 }) {
  if (!producto) return null;

  const items = Array.isArray(producto.incluye_items_v2) && producto.incluye_items_v2.length
    ? producto.incluye_items_v2
    : (producto.incluye_v2 || producto.incluye
        ? String(producto.incluye_v2 || producto.incluye).split(/[·,•\n]/).map((s) => s.trim()).filter(Boolean)
        : []);

  const tapitas = (producto.tapitas_aprox || 0) * cantidad;
  const gramos = Math.round(tapitas * GRAMOS_POR_TAPITA);

  if (!items.length && !tapitas) return null;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EBE3D6] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#0F8B6C]" />
            <h3 className="text-sm font-bold text-[#2A2420]">Qué incluye</h3>
          </div>
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#4B4F54]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0F8B6C] flex-shrink-0" />
                {it}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tapitas > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-[#0F8B6C]/20 bg-gradient-to-br from-[#0F8B6C]/8 to-[#A7D9C9]/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-[#0F8B6C]" />
            <h3 className="text-sm font-bold text-[#0F6B54]">Tu impacto positivo</h3>
          </div>
          <p className="text-sm text-[#4B4F54] leading-relaxed">
            Con esta compra salvas aprox.{' '}
            <span className="font-poppins font-bold text-[#0F8B6C]">{gramos.toLocaleString('es-CL')} g</span>{' '}
            de plástico (~{tapitas.toLocaleString('es-CL')} tapitas) de terminar en vertederos u océanos.
          </p>
          <Recycle className="absolute -bottom-3 -right-3 w-20 h-20 text-[#0F8B6C]/8" />
        </div>
      )}
    </div>
  );
}