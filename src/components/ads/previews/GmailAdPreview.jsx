// Preview de un Demand Gen ad en Gmail Promotions tab.
import { Tag } from 'lucide-react';

export default function GmailAdPreview({ businessName = 'PEYU Chile', headlines = [], descriptions = [], imageUrl = '' }) {
  const headline = headlines[0] || 'Regalos corporativos sustentables';
  const desc = descriptions[0] || 'Hechos en Chile con materiales reciclados. Personalización gratis desde 10 u.';

  return (
    <div className="bg-white border border-gray-200 rounded-lg max-w-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      {/* Header row */}
      <div className="flex items-start gap-3 p-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Tag className="w-4 h-4 text-green-700" />
          <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">Promoción</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
          {businessName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-gray-900 truncate">{businessName}</span>
            <span className="text-[11px] text-gray-500 flex-shrink-0">14:32</span>
          </div>
          <div className="text-[13px] text-gray-700 truncate">
            <span className="font-medium">{headline}</span>
            <span className="text-gray-500"> — {desc}</span>
          </div>
        </div>
      </div>
      {/* Image */}
      {imageUrl && (
        <div className="aspect-[1.91/1] bg-gray-100">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}