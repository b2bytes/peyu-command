// Preview de un PMax/Demand Gen ad en YouTube (in-feed video card look).
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

export default function YouTubeAdPreview({ businessName = 'PEYU Chile', headlines = [], descriptions = [], cta = 'Saber más', imageUrl = '' }) {
  const headline = headlines[0] || 'Tu producto sustentable favorito';
  const desc = descriptions[0] || 'Hecho en Chile con materiales reciclados.';

  return (
    <div className="bg-[#0f0f0f] rounded-xl overflow-hidden shadow-2xl max-w-md font-roboto text-white">
      {/* Video area */}
      <div className="relative aspect-video bg-gray-800">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">[Visual / video del asset group]</div>
        )}
        {/* Skip ad badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] font-medium px-2 py-1 rounded">
          Anuncio · Saltar en 5s
        </div>
        {/* CTA overlay */}
        <button className="absolute bottom-3 right-3 bg-white text-black text-[12px] font-semibold px-3 py-1.5 rounded hover:bg-gray-100">
          {cta} →
        </button>
      </div>
      {/* Channel info */}
      <div className="p-3 flex gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {businessName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-medium leading-tight line-clamp-2">{headline}</h4>
          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
            <span className="font-medium">{businessName}</span>
            <span>·</span>
            <span>Patrocinado</span>
          </div>
          <p className="text-[11px] text-gray-300 mt-1.5 line-clamp-2">{desc}</p>
        </div>
      </div>
      {/* Action bar */}
      <div className="flex items-center gap-4 px-3 pb-3 text-[11px] text-gray-400">
        <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Me gusta</div>
        <div className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comentar</div>
        <div className="flex items-center gap-1"><Share2 className="w-3 h-3" /> Compartir</div>
      </div>
    </div>
  );
}