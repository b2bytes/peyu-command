import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  Sostenibilidad: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  Producto: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  Corporativo: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
  Historias: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  Tips: 'bg-pink-500/20 text-pink-200 border-pink-400/30',
  Novedades: 'bg-teal-500/20 text-teal-200 border-teal-400/30',
};

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function BlogCard({ post, featured = false }) {
  const cat = CATEGORY_COLORS[post.categoria] || 'bg-white/10 text-white/80 border-white/20';
  const img = post.imagen_portada || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop';

  return (
    <Link
      to={`/blog/${post.slug || post.id}`}
      className={`group block bg-white/5 hover:bg-white/10 border border-white/15 hover:border-teal-400/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
        featured ? 'sm:col-span-2 lg:col-span-2 lg:row-span-1' : ''
      }`}
    >
      <div className={`relative overflow-hidden bg-white/5 ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        <img
          src={img}
          alt={post.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur ${cat}`}>
            {post.categoria || 'Artículo'}
          </span>
          {featured && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-400/90 text-yellow-950 backdrop-blur">
              Destacado
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className={`font-poppins font-bold text-white leading-tight mb-2 line-clamp-2 group-hover:text-teal-300 transition-colors ${
          featured ? 'text-lg sm:text-xl' : 'text-base'
        }`}>
          {post.titulo}
        </h3>
        {post.excerpt && (
          <p className="text-white/60 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-3">
            <span>{formatDate(post.fecha_publicacion)}</span>
            {post.tiempo_lectura && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.tiempo_lectura} min
              </span>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}