import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

export default function InstagramMockup({ post, scale = 'md' }) {
  const sizes = {
    sm: { w: 'w-full max-w-[240px]', text: 'text-[10px]', img: 'aspect-square' },
    md: { w: 'w-full max-w-[340px]', text: 'text-xs', img: 'aspect-square' },
    lg: { w: 'w-full max-w-[400px]', text: 'text-sm', img: 'aspect-square' },
  }[scale];

  return (
    <div className={`${sizes.w} bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mx-auto font-inter`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-black">P</div>
            </div>
          </div>
          <div>
            <p className={`${sizes.text} font-bold text-gray-900 leading-tight`}>peyuchile</p>
            <p className="text-[9px] text-gray-500">Santiago, Chile</p>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-700" />
      </div>

      {/* Imagen */}
      <div className={`${sizes.img} bg-gradient-to-br from-emerald-100 to-teal-100 relative overflow-hidden`}>
        {post.imagen_url ? (
          <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin imagen</div>
        )}
        {post.tipo_post === 'Reel' && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">REEL</div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex gap-3">
            <Heart className="w-5 h-5 text-gray-900" />
            <MessageCircle className="w-5 h-5 text-gray-900" />
            <Send className="w-5 h-5 text-gray-900" />
          </div>
          <Bookmark className="w-5 h-5 text-gray-900" />
        </div>
        <p className={`${sizes.text} font-bold text-gray-900 mb-1`}>{(post.likes || 1240).toLocaleString()} Me gusta</p>
        <p className={`${sizes.text} text-gray-900 leading-snug`}>
          <span className="font-bold">peyuchile</span>{' '}
          <span className="line-clamp-3">{post.copy || 'Tu contenido aparecerá aquí...'}</span>
        </p>
        {post.hashtags && (
          <p className={`${sizes.text} text-blue-900 mt-1 line-clamp-1`}>{post.hashtags}</p>
        )}
        <p className="text-[9px] text-gray-400 uppercase mt-1.5">HACE 2 HORAS</p>
      </div>
    </div>
  );
}