import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag } from 'lucide-react';

export default function BlogCard({ post, featured = false }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group block bg-slate-800/80 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden hover:border-teal-400/60 hover:bg-slate-800 hover:shadow-2xl hover:shadow-teal-500/10 transition-all ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${featured ? 'aspect-[2/1]' : 'aspect-[4/3]'}`}>
        {post.imagen_portada ? (
          <img
            src={post.imagen_portada}
            alt={post.titulo}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20" />
        )}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className="px-2.5 py-1 bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wide rounded-full shadow-lg">
            {post.categoria}
          </span>
          {post.destacado && (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide rounded-full shadow-lg">
              ⭐ Destacado
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className={`font-bold text-white mb-2 group-hover:text-teal-300 transition-colors line-clamp-2 ${featured ? 'text-xl' : 'text-base'}`}>
          {post.titulo}
        </h3>
        <p className="text-white/80 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-[11px] text-white/60 flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.fecha_publicacion}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.tiempo_lectura_min || 5} min</span>
          {post.fuente_original && (
            <span className="flex items-center gap-1 text-amber-300"><Tag className="w-3 h-3" />{post.fuente_original}</span>
          )}
        </div>
      </div>
    </Link>
  );
}