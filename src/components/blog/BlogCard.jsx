import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ExternalLink } from 'lucide-react';

// Coincide con `entities/BlogPost.json` enum
// Versión LIGHT: para fondos claros (creme/blanco). Versión DARK: para el resto del sitio (fondo oscuro).
const CATEGORY_COLORS_LIGHT = {
  'Historia PEYU':                'bg-amber-50 text-amber-800 border-amber-200',
  'Reciclaje y Medio Ambiente':   'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Guías y Tips':                 'bg-pink-50 text-pink-800 border-pink-200',
  'Casos de Éxito':               'bg-purple-50 text-purple-800 border-purple-200',
  'Noticias y Prensa':            'bg-blue-50 text-blue-800 border-blue-200',
  'Regalos Corporativos':         'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Educación Ambiental':          'bg-teal-50 text-teal-800 border-teal-200',
};

const CATEGORY_COLORS_DARK = {
  'Historia PEYU':                'bg-amber-500/20 text-amber-200 border-amber-400/30',
  'Reciclaje y Medio Ambiente':   'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  'Guías y Tips':                 'bg-pink-500/20 text-pink-200 border-pink-400/30',
  'Casos de Éxito':               'bg-purple-500/20 text-purple-200 border-purple-400/30',
  'Noticias y Prensa':            'bg-blue-500/20 text-blue-200 border-blue-400/30',
  'Regalos Corporativos':         'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
  'Educación Ambiental':          'bg-teal-500/20 text-teal-200 border-teal-400/30',
};

const CATEGORY_FALLBACK_IMG = {
  'Historia PEYU':              'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
  'Reciclaje y Medio Ambiente': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&auto=format&fit=crop&q=80',
  'Guías y Tips':               'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=80',
  'Casos de Éxito':             'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=80',
  'Noticias y Prensa':          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
  'Regalos Corporativos':       'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&auto=format&fit=crop&q=80',
  'Educación Ambiental':        'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200&auto=format&fit=crop&q=80',
};

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

/**
 * BlogCard — variantes:
 *  - "light"  → fondo blanco, texto oscuro (para listados sobre creme/blanco como /blog y relacionados)
 *  - "dark"   → glass sobre fondo oscuro (legacy, no se usa actualmente)
 */
export default function BlogCard({ post, featured = false, variant = 'light' }) {
  const isDark = variant === 'dark';
  const colorMap = isDark ? CATEGORY_COLORS_DARK : CATEGORY_COLORS_LIGHT;
  const cat = colorMap[post.categoria] || (isDark ? 'bg-white/10 text-white/80 border-white/20' : 'bg-stone-100 text-slate-700 border-stone-200');
  const img = post.imagen_portada
    || CATEGORY_FALLBACK_IMG[post.categoria]
    || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80';

  if (isDark) {
    // Variante legacy oscura
    return (
      <Link
        to={`/blog/${post.slug || post.id}`}
        className={`group block bg-white/5 hover:bg-white/10 border border-white/15 hover:border-teal-400/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
          featured ? 'sm:col-span-2 lg:col-span-2' : ''
        }`}
      >
        <div className={`relative overflow-hidden bg-white/5 ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
          <img src={img} alt={post.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[calc(100%-1.5rem)]">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur ${cat}`}>{post.categoria || 'Artículo'}</span>
            {featured && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-400/90 text-yellow-950 backdrop-blur">Destacado</span>}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className={`font-poppins font-bold text-white leading-tight mb-2 line-clamp-2 group-hover:text-teal-300 transition-colors ${featured ? 'text-lg sm:text-xl' : 'text-base'}`}>
            {post.titulo}
          </h3>
          {post.excerpt && <p className="text-white/60 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">{post.excerpt}</p>}
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <div className="flex items-center gap-3">
              <span>{formatDate(post.fecha_publicacion)}</span>
              {post.tiempo_lectura_min && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.tiempo_lectura_min} min</span>}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    );
  }

  // Variante LIGHT (default) — editorial, clean
  return (
    <Link
      to={`/blog/${post.slug || post.id}`}
      className={`group block bg-white border border-stone-200 hover:border-teal-300 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/5 ${
        featured ? 'sm:col-span-2 lg:col-span-2' : ''
      }`}
    >
      <div className={`relative overflow-hidden bg-stone-100 ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        <img
          src={img}
          alt={post.titulo}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[calc(100%-1.5rem)]">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cat}`}>
            {post.categoria || 'Artículo'}
          </span>
          {featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 shadow-md">
              ★ Destacado
            </span>
          )}
          {post.fuente_original && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-slate-700 border border-stone-200 flex items-center gap-1">
              <ExternalLink className="w-2.5 h-2.5" /> {post.fuente_original}
            </span>
          )}
        </div>
      </div>

      <div className={`p-5 ${featured ? 'sm:p-6' : ''}`}>
        <h3 className={`font-poppins font-extrabold text-slate-900 leading-[1.2] tracking-tight mb-2.5 line-clamp-2 group-hover:text-teal-700 transition-colors ${
          featured ? 'text-xl sm:text-[1.5rem]' : 'text-[1.05rem]'
        }`}>
          {post.titulo}
        </h3>
        {post.excerpt && (
          <p className="text-slate-600 text-[13.5px] line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-[12px] text-slate-500 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-3 font-medium">
            <span>{formatDate(post.fecha_publicacion)}</span>
            {post.tiempo_lectura_min && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.tiempo_lectura_min} min
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-teal-700 font-bold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            Leer <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}