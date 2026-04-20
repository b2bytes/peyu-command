import { Heart, MessageCircle, Bookmark, Share2, Music2, Plus } from 'lucide-react';

export default function TikTokMockup({ post, scale = 'md' }) {
  const sizes = {
    sm: 'max-w-[180px]',
    md: 'max-w-[240px]',
    lg: 'max-w-[280px]',
  }[scale];

  return (
    <div className={`w-full ${sizes} aspect-[9/16] bg-black rounded-2xl shadow-2xl overflow-hidden relative mx-auto font-inter`}>
      {/* Imagen de fondo */}
      {post.imagen_url ? (
        <img src={post.imagen_url} alt={post.titulo} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700" />
      )}

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-center gap-5 pt-3 text-white text-[10px] font-semibold">
        <span className="opacity-70">Siguiendo</span>
        <span className="border-b-2 border-white pb-0.5">Para ti</span>
      </div>

      {/* Right actions */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3 text-white">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border-2 border-white flex items-center justify-center text-sm font-black">P</div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#ff0050] flex items-center justify-center"><Plus className="w-2.5 h-2.5 text-white" /></div>
        </div>
        <div className="flex flex-col items-center">
          <Heart className="w-7 h-7 fill-white" />
          <span className="text-[10px] font-bold">{(post.likes || 12400).toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle className="w-7 h-7 fill-white text-black" />
          <span className="text-[10px] font-bold">{(post.comentarios || 284).toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
          <Bookmark className="w-7 h-7 fill-yellow-400 text-yellow-400" />
          <span className="text-[10px] font-bold">{(post.saves || 1200).toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
          <Share2 className="w-7 h-7 fill-white" />
          <span className="text-[10px] font-bold">Compartir</span>
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 inset-x-0 p-3 text-white">
        <p className="text-xs font-bold mb-1">@peyuchile</p>
        <p className="text-[11px] leading-snug line-clamp-3 mb-1.5">{post.copy || 'Tu caption aparecerá aquí'}</p>
        {post.hashtags && <p className="text-[10px] font-semibold line-clamp-1">{post.hashtags}</p>}
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
          <Music2 className="w-3 h-3" />
          <span className="truncate">sonido original · peyuchile</span>
        </div>
      </div>
    </div>
  );
}