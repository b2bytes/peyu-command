import { MoreHorizontal, Share2, Upload } from 'lucide-react';

export default function PinterestMockup({ post, scale = 'md' }) {
  const sizes = {
    sm: 'max-w-[200px]',
    md: 'max-w-[260px]',
    lg: 'max-w-[320px]',
  }[scale];

  return (
    <div className={`w-full ${sizes} mx-auto font-inter`}>
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 group" style={{ aspectRatio: '2/3' }}>
        {post.imagen_url ? (
          <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100" />
        )}
        <div className="absolute top-2 right-2 bg-[#e60023] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow">Guardar</div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
          <div className="flex items-center gap-1.5 text-white text-[10px]">
            <Share2 className="w-3 h-3" />
            <Upload className="w-3 h-3" />
            <MoreHorizontal className="w-3 h-3 ml-auto" />
          </div>
        </div>
      </div>
      <p className="text-xs font-bold text-gray-900 mt-2 line-clamp-2">{post.titulo}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-[8px] font-black">P</div>
        <span className="text-[10px] text-gray-600 font-semibold">peyuchile</span>
      </div>
    </div>
  );
}