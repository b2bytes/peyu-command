import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ChatMessageContentLight from '../components/chat/ChatMessageContentLight';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const results = await base44.entities.BlogPost.filter({ slug, publicado: true });
      const found = results?.[0];
      setPost(found);
      if (found) {
        const rel = await base44.entities.BlogPost.filter({ categoria: found.categoria, publicado: true }, '-fecha_publicacion', 4);
        setRelated((rel || []).filter(r => r.id !== found.id).slice(0, 3));
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/60">Cargando...</div>;
  if (!post) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white/60 gap-4">
      <p>Artículo no encontrado</p>
      <Link to="/blog" className="text-teal-300 underline">Volver al blog</Link>
    </div>
  );

  const hasRichTags = /\[\[(PRODUCTO|ACTION):[^\]]+\]\]/.test(post.contenido_md || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-teal-500 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-lg">
              {post.categoria}
            </span>
            {post.fuente_original && (
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg">
                <ExternalLink className="w-3 h-3" /> {post.fuente_original}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">{post.titulo}</h1>
          <p className="text-lg text-white/90 mb-5 leading-relaxed">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/75 border-t border-b border-white/20 py-3">
            <span>Por <strong className="text-white">{post.autor || 'Equipo PEYU'}</strong></span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{post.fecha_publicacion}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.tiempo_lectura_min || 5} min de lectura</span>
          </div>
        </div>

        {/* Imagen portada */}
        {post.imagen_portada && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-white/15 bg-slate-900 shadow-2xl">
            <img src={post.imagen_portada} alt={post.titulo} className="w-full h-auto object-contain max-h-[70vh] mx-auto" />
          </div>
        )}

        {/* Contenido */}
        <div className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-white/95 prose-p:leading-relaxed
          prose-a:text-teal-300 prose-a:font-semibold hover:prose-a:text-teal-200
          prose-strong:text-white prose-strong:font-bold
          prose-li:text-white/95
          prose-blockquote:border-l-4 prose-blockquote:border-teal-400 prose-blockquote:text-white/90 prose-blockquote:bg-white/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
          prose-code:text-teal-200 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-img:rounded-xl prose-img:border prose-img:border-white/15 prose-img:bg-slate-900 prose-img:mx-auto prose-img:w-full
          prose-hr:border-white/20">
          {hasRichTags ? (
            <ChatMessageContentLight content={post.contenido_md} />
          ) : (
            <ReactMarkdown
              components={{
                img: ({ src, alt }) => (
                  <span className="block my-6 rounded-xl overflow-hidden border border-white/15 bg-slate-900">
                    <img src={src} alt={alt || ''} className="w-full h-auto object-contain max-h-[60vh] mx-auto" loading="lazy" />
                  </span>
                ),
              }}
            >
              {post.contenido_md}
            </ReactMarkdown>
          )}
        </div>

        {/* Galería */}
        {post.imagenes_galeria && post.imagenes_galeria.length > 1 && (
          <div className="mt-10">
            <h3 className="text-white font-bold mb-4 text-lg">Galería</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {post.imagenes_galeria.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/15 bg-slate-900 flex items-center justify-center">
                  <img src={url} alt="" className="w-full h-full object-contain hover:scale-105 transition-transform" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fuente */}
        {post.fuente_url && (
          <div className="mt-8 p-4 bg-amber-500/15 border border-amber-400/40 rounded-xl">
            <p className="text-sm text-amber-100">
              📰 Fuente original: <a href={post.fuente_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-50">{post.fuente_original}</a>
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map(t => (
              <span key={t} className="px-2.5 py-1 bg-slate-800 border border-white/15 text-white/85 text-xs rounded-md font-medium">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Relacionados */}
        {related.length > 0 && (
          <div className="mt-14 pt-10 border-t border-white/15">
            <h3 className="text-2xl font-bold text-white mb-6">También te puede interesar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block bg-slate-800/80 border border-white/15 rounded-xl overflow-hidden hover:border-teal-400/60 hover:bg-slate-800 transition-all">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img src={r.imagen_portada} alt={r.titulo} className="w-full h-full object-contain group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-teal-300">{r.titulo}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}