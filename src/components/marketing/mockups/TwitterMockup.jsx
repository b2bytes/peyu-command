import { MessageCircle, Repeat2, Heart, BarChart3, Upload, MoreHorizontal, BadgeCheck } from 'lucide-react';

export default function TwitterMockup({ post, scale = 'md' }) {
  const sizes = {
    sm: 'max-w-[260px] text-[10px]',
    md: 'max-w-[360px] text-xs',
    lg: 'max-w-[420px] text-sm',
  }[scale];

  return (
    <div className={`w-full ${sizes} bg-black text-white rounded-2xl shadow-xl border border-gray-800 overflow-hidden mx-auto font-inter`}>
      <div className="flex items-start gap-2 p-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black flex-shrink-0">P</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold">PEYU Chile</span>
            <BadgeCheck className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0]" />
            <span className="text-gray-500">@peyuchile · 2h</span>
          </div>
          <p className="mt-1 leading-snug line-clamp-5 whitespace-pre-wrap">{post.copy || 'Tu tweet aparecerá aquí'}</p>
          {post.hashtags && <p className="text-[#1d9bf0] mt-1 line-clamp-1">{post.hashtags}</p>}
          {post.imagen_url && (
            <div className="mt-2 rounded-xl overflow-hidden border border-gray-800 aspect-[16/9]">
              <img src={post.imagen_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between mt-3 text-gray-500 text-[10px]">
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {(post.comentarios || 0) + 24}</span>
            <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> {(post.shares || 0) + 142}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {((post.likes || 0) + 1284).toLocaleString()}</span>
            <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> 42K</span>
            <Upload className="w-3.5 h-3.5" />
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </div>
    </div>
  );
}