import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, Calendar, User, ExternalLink, Tag, Eye } from 'lucide-react';
import BlogShareButtons from '../components/blog/BlogShareButtons';
import BlogCard from '../components/blog/BlogCard';
import SEO from '@/components/SEO';
import { combineSchemas, buildOrganizationSchema, buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schemas-peyu';

// Imagen temática coherente cuando el post no trae portada
const CATEGORY_FALLBACK_IMG = {
  'Historia PEYU':              'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&auto=format&fit=crop&q=80',
  'Reciclaje y Medio Ambiente': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1600&auto=format&fit=crop&q=80',
  'Guías y Tips':               'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1600&auto=format&fit=crop&q=80',
  'Casos de Éxito':             'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&auto=format&fit=crop&q=80',
  'Noticias y Prensa':          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&auto=format&fit=crop&q=80',
  'Regalos Corporativos':       'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1600&auto=format&fit=crop&q=80',
  'Educación Ambiental':        'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1600&auto=format&fit=crop&q=80',
};

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
        try { await base44.entities.BlogPost.update(found.id, { vistas: (found.vistas || 0) + 1 }); } catch {}
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
      <div className="bg-[#FAF7F2] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse">
          <div className="h-4 bg-stone-200 rounded w-24 mb-6" />
          <div className="h-12 bg-stone-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-stone-200 rounded w-1/2 mb-10" />
          <div className="aspect-[16/9] bg-stone-200 rounded-2xl mb-8" />
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-stone-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-2xl font-bold text-slate-900 mb-3">Artículo no encontrado</p>
          <p className="text-slate-500 mb-6">Quizás fue movido o aún no se publica.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  const img = post.imagen_portada
    || CATEGORY_FALLBACK_IMG[post.categoria]
    || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&auto=format&fit=crop&q=80';
  const canonicalUrl = `https://peyuchile.cl/blog/${post.slug || post.id}`;

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

      {/* Fondo creme/papel — separa visualmente al blog del resto del sitio */}
      <div className="bg-[#FAF7F2] min-h-screen text-slate-900">
        {/* Reading progress bar */}
        <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-stone-200/40">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <article className="max-w-[720px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">
          {/* Breadcrumb / volver */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-teal-700 mb-8 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al blog
          </Link>

          {/* HEADER editorial */}
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-5">
              {post.categoria && (
                <span className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800">
                  {post.categoria}
                </span>
              )}
              {post.fuente_original && (
                <a
                  href={post.fuente_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-slate-700 hover:bg-stone-200 transition"
                >
                  <ExternalLink className="w-3 h-3" /> {post.fuente_original}
                </a>
              )}
            </div>

            <h1 className="font-poppins font-extrabold text-slate-900 leading-[1.08] tracking-tight text-[2rem] sm:text-[2.5rem] lg:text-[3rem] mb-5">
              {post.titulo}
            </h1>

            {post.excerpt && (
              <p className="text-lg sm:text-xl text-slate-600 leading-[1.55] font-normal mb-8 max-w-[640px]">
                {post.excerpt}
              </p>
            )}

            {/* Meta autor + fecha */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-500 border-y border-stone-200 py-4">
              {post.autor && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  {post.autor}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.fecha_publicacion)}
              </span>
              {post.tiempo_lectura_min && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.tiempo_lectura_min} min de lectura
                </span>
              )}
              {typeof post.vistas === 'number' && post.vistas > 10 && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Eye className="w-3.5 h-3.5" />
                  {post.vistas.toLocaleString('es-CL')} lecturas
                </span>
              )}
            </div>
          </header>

          {/* Hero image — sin frame oscuro */}
          <figure className="mb-12 -mx-4 sm:mx-0">
            <div className="aspect-[16/9] sm:rounded-2xl overflow-hidden bg-stone-100 shadow-sm">
              <img src={img} alt={post.titulo} className="w-full h-full object-cover" />
            </div>
          </figure>

          {/* CONTENIDO — tipografía editorial sólida */}
          <div className="prose prose-lg max-w-none
            prose-headings:font-poppins prose-headings:text-slate-900 prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:scroll-mt-24
            prose-h2:text-[1.65rem] prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-stone-200
            prose-h3:text-[1.3rem] prose-h3:mt-10 prose-h3:mb-3 prose-h3:text-teal-800
            prose-h4:text-[1.1rem] prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-slate-700 prose-p:leading-[1.8] prose-p:text-[1.0625rem]
            prose-a:text-teal-700 prose-a:font-semibold prose-a:no-underline prose-a:border-b-2 prose-a:border-teal-200 hover:prose-a:border-teal-500 hover:prose-a:text-teal-800
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-em:text-slate-700 prose-em:italic
            prose-img:rounded-xl prose-img:shadow-md prose-img:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/60 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-blockquote:font-medium
            prose-code:text-teal-800 prose-code:bg-teal-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.9em] prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-slate-900 prose-pre:rounded-xl prose-pre:shadow-md
            prose-ul:my-6 prose-ol:my-6
            prose-li:text-slate-700 prose-li:leading-[1.7] prose-li:my-1.5 prose-li:marker:text-teal-600
            prose-hr:border-stone-200 prose-hr:my-12">
            <ReactMarkdown>{post.contenido_md || ''}</ReactMarkdown>
          </div>

          {/* Fuente original */}
          {post.fuente_url && (
            <aside className="mt-12 bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-teal-700 font-bold mb-2">Fuente original</p>
              <a
                href={post.fuente_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-slate-900 hover:text-teal-700 font-bold text-base transition-colors group"
              >
                {post.fuente_original || 'Leer artículo original'}
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                Citamos siempre nuestras fuentes para que puedas verificar la información.
              </p>
            </aside>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-stone-200">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-3 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Etiquetas
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(t => (
                  <span key={t} className="text-[12px] px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-slate-600 hover:bg-stone-200 hover:text-slate-900 transition font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Compartir */}
          <div className="mt-10 pt-8 border-t border-stone-200">
            <p className="text-[13px] text-slate-500 mb-3 font-medium">¿Te sirvió? Compártelo:</p>
            <BlogShareButtons title={post.titulo} variant="light" />
          </div>
        </article>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="bg-white border-t border-stone-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-teal-700 font-bold mb-1">Sigue leyendo</p>
                  <h2 className="text-2xl sm:text-3xl font-poppins font-extrabold text-slate-900 tracking-tight">También te puede interesar</h2>
                </div>
                <Link to="/blog" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 font-semibold">
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map(p => <BlogCard key={p.id} post={p} variant="light" />)}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}