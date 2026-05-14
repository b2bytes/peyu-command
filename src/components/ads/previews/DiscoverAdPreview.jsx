// Preview de un Demand Gen ad en Google Discover (mobile feed look).
export default function DiscoverAdPreview({ businessName = 'PEYU Chile', headlines = [], descriptions = [], cta = 'Saber más', imageUrl = '' }) {
  const headline = headlines[0] || 'Regalos corporativos sustentables';
  const desc = descriptions[0] || 'Hechos en Chile con plástico 100% reciclado. Personalización láser UV gratis desde 10 unidades.';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg max-w-sm border border-gray-200">
      {/* Hero image */}
      <div className="relative aspect-[4/5] bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">[Visual del asset group 4:5]</div>
        )}
      </div>
      {/* Content */}
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
            {businessName[0]}
          </div>
          <span className="text-[12px] text-gray-700 font-medium">{businessName}</span>
          <span className="text-[11px] text-gray-400">· Anuncio</span>
        </div>
        <h4 className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">{headline}</h4>
        <p className="text-[12px] text-gray-600 mt-1 line-clamp-3 leading-snug">{desc}</p>
        <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold py-2 rounded-full">
          {cta}
        </button>
      </div>
    </div>
  );
}