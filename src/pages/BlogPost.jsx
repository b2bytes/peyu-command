import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import BlogShareButtons from '../components/blog/BlogShareButtons';
import BlogCard from '../components/blog/BlogCard';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Buscar por slug o por id
      let data = await base44.entities.BlogPost.filter({ slug, publicado: true });
      if (!data?.length) {
        try { data = [await base44.entities.BlogPost.get(slug)]; } catch { data = []; }
      }
      const found = data?.[0] || null;
      setPost(found);

      if (found) {
        const rel = await base44.entities.BlogPost.filter(
          { publicado: true, categoria: found.categoria },
          '-fecha_publicacion',
          4,
        );
        setRelated((rel || []).filter(p => p.id !== found.id).slice(0, 3));
      }
      setLoading(false);
    }
    load();
    window.scrollTo({ top: 0 });
  }, [slug]);

  // Barra de progreso de lectura
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? (h.scrollTop / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function formatDate(d) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-6" />
        <div className="h-10 bg-white/10 rounded w-3/4 mb-4" />
        <div className="h-4 bg-white/10 rounded w-1/2 mb-10" />
        <div className="aspect-[16/9] bg-white/5 rounded-2xl mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-white/10 rounded" />)}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center text-white/70">
        <p className="text-xl font-semibold mb-3">Artículo no encontrado</p>
        <Link to="/blog" className="inline-flex items-center gap-2 text-teal-300 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>
      </div>
    );
  }

  const img = post.imagen_portada || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&auto=format&fit=crop';

  return (
    <div className="min-h-screen">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-teal-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al blog
        </Link>

        <header className="mb-8">
          {post.categoria && (
            <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 mb-4">
              {post.categoria}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
            {post.titulo}
          </h1>
          {post.excerpt && (
            <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 border-y border-white/10 py-3">
            {post.autor && (
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.autor}</span>
            )}
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.fecha_publicacion)}</span>
            {post.tiempo_lectura && (
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.tiempo_lectura} min lectura</span>
            )}
          </div>
        </header>

        <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-10 bg-white/5 border border-white/10">
          <img src={img} alt={post.titulo} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-invert prose-teal max-w-none prose-headings:font-poppins prose-headings:text-white prose-p:text-white/75 prose-p:leading-relaxed prose-a:text-teal-300 prose-strong:text-white prose-img:rounded-xl prose-blockquote:border-l-teal-400 prose-blockquote:text-white/80">
          <ReactMarkdown>{post.contenido || ''}</ReactMarkdown>
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap gap-2">
            {post.tags.map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-white/60">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50 mb-3">¿Te gustó? Compártelo</p>
          <BlogShareButtons title={post.titulo} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map(p => <BlogCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}