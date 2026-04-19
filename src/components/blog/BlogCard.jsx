import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag } from 'lucide-react';

export default function BlogCard({ post, featured = false }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-teal-400/50 hover:bg-white/10 transition-all ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? 'aspect-[2/1]' : 'aspect-[4/3]'}`}>
        <img
          src={post.imagen_portada}
          alt={post.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 bg-teal-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
            {post.categoria}
          </span>
          {post.destacado && (
            <span className="px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
              ⭐ Destacado
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className={`font-bold text-white mb-2 group-hover:text-teal-300 transition-colors line-clamp-2 ${featured ? 'text-xl' : 'text-base'}`}>
          {post.titulo}
        </h3>
        <p className="text-white/60 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-[11px] text-white/40">
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