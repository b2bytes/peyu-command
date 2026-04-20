import { ThumbsUp, MessageCircle, Share2, Globe2, MoreHorizontal } from 'lucide-react';

export default function FacebookMockup({ post, scale = 'md' }) {
  const sizes = {
    sm: 'max-w-[260px] text-[10px]',
    md: 'max-w-[360px] text-xs',
    lg: 'max-w-[420px] text-sm',
  }[scale];

  return (
    <div className={`w-full ${sizes} bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mx-auto font-inter`}>
      <div className="flex items-start gap-2 p-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black">P</div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">PEYU Chile</p>
          <p className="text-[10px] text-gray-500 flex items-center gap-1">2 h · <Globe2 className="w-2.5 h-2.5" /></p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </div>
      <div className="px-3 pb-2 text-gray-900 leading-relaxed">
        <p className="line-clamp-4 whitespace-pre-wrap">{post.copy || 'Tu contenido aparecerá aquí'}</p>
        {post.hashtags && <p className="text-[#1877f2] mt-1 font-medium line-clamp-1">{post.hashtags}</p>}
      </div>
      {post.imagen_url && (
        <div className="aspect-[1.91/1] bg-gray-100">
          <img src={post.imagen_url} className="w-full h-full object-cover" alt="" />
        </div>
      )}
      <div className="px-3 py-2 flex items-center justify-between text-[10px] text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-[#1877f2] flex items-center justify-center"><ThumbsUp className="w-2.5 h-2.5 text-white fill-white" /></div>
          <span>{((post.likes || 0) + 842).toLocaleString()}</span>
        </div>
        <span>{(post.comentarios || 0) + 34} comentarios · {(post.shares || 0) + 12} compartidos</span>
      </div>
      <div className="grid grid-cols-3 py-1 text-gray-600">
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><ThumbsUp className="w-3.5 h-3.5" /><span className="font-semibold">Me gusta</span></button>
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><MessageCircle className="w-3.5 h-3.5" /><span className="font-semibold">Comentar</span></button>
        <button className="flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded"><Share2 className="w-3.5 h-3.5" /><span className="font-semibold">Compartir</span></button>
      </div>
    </div>
  );
}