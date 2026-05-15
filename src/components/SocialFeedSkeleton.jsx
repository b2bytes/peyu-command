/**
 * SocialFeedSkeleton — Card fantasma con shimmer que imita exactamente
 * la estructura de una ProductCard del SocialProductFeed.
 *
 * Por qué un skeleton y no un spinner:
 * • Mantiene el layout (no hay salto cuando llegan los productos reales).
 * • Da sensación inmediata de carga rápida (perceived performance).
 * • Familiar para el usuario que viene de Instagram/Facebook.
 *
 * Usa la clase `peyu-shimmer` ya definida en index.css.
 */
export default function SocialFeedSkeleton() {
  return (
    <article className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-gray-200 peyu-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-24 rounded bg-gray-200 peyu-shimmer" />
          <div className="h-2 w-16 rounded bg-gray-100 peyu-shimmer" />
        </div>
        <div className="h-5 w-12 rounded-full bg-teal-50 peyu-shimmer" />
      </div>

      {/* Imagen */}
      <div className="aspect-square bg-gray-100 peyu-shimmer" />

      {/* Actions row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded bg-gray-200 peyu-shimmer" />
          <div className="w-6 h-6 rounded bg-gray-200 peyu-shimmer" />
          <div className="w-6 h-6 rounded bg-gray-200 peyu-shimmer" />
        </div>
        <div className="w-6 h-6 rounded bg-gray-200 peyu-shimmer" />
      </div>

      {/* Likes + copy */}
      <div className="px-4 pb-3 space-y-2">
        <div className="h-2.5 w-20 rounded bg-gray-200 peyu-shimmer" />
        <div className="h-3 w-3/4 rounded bg-gray-200 peyu-shimmer" />
        <div className="h-2.5 w-1/2 rounded bg-gray-100 peyu-shimmer" />
      </div>

      {/* Precio + CTAs */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gradient-to-br from-gray-50 to-white space-y-2.5">
        <div className="h-7 w-24 rounded bg-gray-200 peyu-shimmer" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 rounded-xl bg-gray-200 peyu-shimmer" />
          <div className="h-9 rounded-xl bg-teal-100 peyu-shimmer" />
        </div>
      </div>
    </article>
  );
}