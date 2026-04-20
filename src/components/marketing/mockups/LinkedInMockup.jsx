import { ThumbsUp, MessageSquare, Repeat2, Send, Globe2, MoreHorizontal } from 'lucide-react';

export default function LinkedInMockup({ post, scale = 'md' }) {
  const sizes = {
    sm: 'max-w-[260px] text-[10px]',
    md: 'max-w-[360px] text-xs',
    lg: 'max-w-[420px] text-sm',
  }[scale];

  return (
    <div className={`w-full ${sizes} bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mx-auto font-inter`}>
      {/* Header */}
      <div className="flex items-start gap-2 p-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-sm font-black flex-shrink-0">P</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 leading-tight">PEYU Chile</p>
          <p className="text-[10px] text-gray-500 line-clamp-1">Regalos corporativos sostenibles · 12.4K seguidores</p>
          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">2h · <Globe2 className="w-2.5 h-2.5" /></p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </div>

      {/* Copy */}
      <div className="px-3 pb-2 text-gray-900 leading-relaxed">
        <p className="line-clamp-6 whitespace-pre-wrap">{post.copy || 'Tu copy aparecerá aquí...'}</p>
        {post.hashtags && <p className="text-[#0a66c2] mt-1.5 font-medium line-clamp-1">{post.hashtags}</p>}
      </div>

      {/* Imagen */}
      {post.imagen_url && (
        <div className="aspect-[1.91/1] bg-gray-100 overflow-hidden">
          <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Métricas */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center"><ThumbsUp className="w-2 h-2 text-white fill-white" /></div>
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-white text-[7px]">❤</div>
          </div>
          <span>{((post.likes || 0) + 124).toLocaleString()}</span>
        </div>
        <span>{(post.comentarios || 0) + 18} comentarios · {(post.shares || 0) + 7} veces compartido</span>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-4 py-1.5 text-gray-600">
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><ThumbsUp className="w-3.5 h-3.5" /><span className="font-semibold">Recomendar</span></button>
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><MessageSquare className="w-3.5 h-3.5" /><span className="font-semibold">Comentar</span></button>
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><Repeat2 className="w-3.5 h-3.5" /><span className="font-semibold">Compartir</span></button>
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><Send className="w-3.5 h-3.5" /><span className="font-semibold">Enviar</span></button>
      </div>
    </div>
  );
}