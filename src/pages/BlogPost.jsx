import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, Calendar, User, ExternalLink, Tag } from 'lucide-react';
import BlogShareButtons from '../components/blog/BlogShareButtons';
import BlogCard from '../components/blog/BlogCard';
import SEO from '@/components/SEO';
import { combineSchemas, buildOrganizationSchema, buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schemas-peyu';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
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

        // Incrementar contador de vistas (best-effort)
        try {
          await base44.entities.BlogPost.update(found.id, { vistas: (found.vistas || 0) + 1 });
        } catch {}
      }
      setLoading(false);
    }
    load();
    window.scrollTo({ top: 0 });
  }, [slug]);

  // Barra progreso lectura
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

  const CATEGORY_FALLBACK_IMG = {
    'Historia PEYU':              'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&auto=format&fit=crop&q=80',
    'Reciclaje y Medio Ambiente': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1600&auto=format&fit=crop&q=80',
    'Guías y Tips':               'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1600&auto=format&fit=crop&q=80',
    'Casos de Éxito':             'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&auto=format&fit=crop&q=80',
    'Noticias y Prensa':          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&auto=format&fit=crop&q=80',
    'Regalos Corporativos':       'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1600&auto=format&fit=crop&q=80',
    'Educación Ambiental':        'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1600&auto=format&fit=crop&q=80',
  };
  const img = post.imagen_portada
    || CATEGORY_FALLBACK_IMG[post.categoria]
    || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&auto=format&fit=crop&q=80';
  const canonicalUrl = `https://peyuchile.cl/blog/${post.slug || post.id}`;

  // SEO
  const seoTitle = `${post.titulo} | Blog PEYU Chile`;
  const seoDescription = (post.seo_description || post.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const articleJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Blog', url: 'https://peyuchile.cl/blog' },
      { name: post.categoria, url: `https://peyuchile.cl/blog?cat=${encodeURIComponent(post.categoria || '')}` },
      { name: post.titulo, url: canonicalUrl },
    ]),
    buildArticleSchema(post, canonicalUrl),
  );

  return (
    <>
      <SEO
        title={seoTitle.slice(0, 65)}
        description={seoDescription}
        canonical={canonicalUrl}
        image={post.imagen_portada}
        type="article"
        jsonLd={articleJsonLd}
      />

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
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categoria && (
                <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200">
                  {post.categoria}
                </span>
              )}
              {post.fuente_original && (
                <a
                  href={post.fuente_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> Fuente: {post.fuente_original}
                </a>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
              {post.titulo}
            </h1>
            {post.excerpt && (
              <p className="text-base sm:text-lg text-white/90 leading-relaxed mb-6 font-medium">
                {post.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 border-y border-white/10 py-3">
              {post.autor && (
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.autor}</span>
              )}
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.fecha_publicacion)}</span>
              {post.tiempo_lectura_min && (
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.tiempo_lectura_min} min lectura</span>
              )}
              {typeof post.vistas === 'number' && post.vistas > 10 && (
                <span className="text-white/40">· {post.vistas.toLocaleString('es-CL')} lecturas</span>
              )}
            </div>
          </header>

          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-10 bg-white/5 border border-white/10">
            <img src={img} alt={post.titulo} className="w-full h-full object-cover" />
          </div>

          {/* Lectura sobre lienzo sólido — máximo contraste */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl">
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:font-poppins prose-headings:text-white prose-headings:font-bold
              prose-p:text-slate-100 prose-p:leading-[1.8]
              prose-a:text-teal-300 prose-a:font-semibold hover:prose-a:text-teal-200
              prose-strong:text-white prose-strong:font-bold
              prose-em:text-slate-200
              prose-img:rounded-xl prose-img:shadow-xl
              prose-blockquote:border-l-4 prose-blockquote:border-teal-400 prose-blockquote:text-slate-200 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-code:text-teal-200 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
              prose-li:text-slate-100 prose-li:marker:text-teal-400
              prose-hr:border-white/20">
              <ReactMarkdown>{post.contenido_md || ''}</ReactMarkdown>
            </div>
          </div>

          {/* Fuente original al final del artículo */}
          {post.fuente_url && (
            <div className="mt-10 bg-white/5 border border-white/15 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-widest text-teal-300 font-bold mb-2">Fuente original</p>
              <a
                href={post.fuente_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-teal-300 font-semibold text-sm transition-colors"
              >
                {post.fuente_original || 'Leer artículo original'}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-xs text-white/50 mt-2">
                Citamos siempre nuestras fuentes para que puedas verificar la información.
              </p>
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-white/10">
              <p className="text-[11px] uppercase tracking-widest text-white/50 font-bold mb-3 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Etiquetas
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(t => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Compartir */}
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
    </>
  );
}