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
    <div className="min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-bold uppercase tracking-wide rounded-full">
              {post.categoria}
            </span>
            {post.fuente_original && (
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold rounded-full flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {post.fuente_original}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">{post.titulo}</h1>
          <p className="text-lg text-white/70 mb-5">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 border-t border-b border-white/10 py-3">
            <span>Por <strong className="text-white/80">{post.autor || 'Equipo PEYU'}</strong></span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{post.fecha_publicacion}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.tiempo_lectura_min || 5} min de lectura</span>
          </div>
        </div>

        {/* Imagen portada */}
        {post.imagen_portada && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8 border border-white/10">
            <img src={post.imagen_portada} alt={post.titulo} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Contenido */}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-white/80 prose-a:text-teal-300 prose-strong:text-white prose-li:text-white/80 prose-blockquote:border-teal-400 prose-blockquote:text-white/70">
          {hasRichTags ? (
            <ChatMessageContentLight content={post.contenido_md} />
          ) : (
            <ReactMarkdown>{post.contenido_md}</ReactMarkdown>
          )}
        </div>

        {/* Galería */}
        {post.imagenes_galeria && post.imagenes_galeria.length > 1 && (
          <div className="mt-10">
            <h3 className="text-white font-bold mb-4 text-lg">Galería</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {post.imagenes_galeria.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fuente */}
        {post.fuente_url && (
          <div className="mt-8 p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
            <p className="text-sm text-amber-100">
              📰 Fuente original: <a href={post.fuente_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{post.fuente_original}</a>
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map(t => (
              <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/60 text-xs rounded-md">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Relacionados */}
        {related.length > 0 && (
          <div className="mt-14 pt-10 border-t border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6">También te puede interesar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-teal-400/40 transition-all">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={r.imagen_portada} alt={r.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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