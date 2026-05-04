import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, BookOpen, TrendingUp, Clock, X } from 'lucide-react';
import BlogCard from '../components/blog/BlogCard';
import BlogTopicChips, { BLOG_TOPICS, postMatchesTopic } from '../components/blog/BlogTopicChips';
import EducationSection from '../components/blog/EducationSection';
import SEO from '@/components/SEO';
import { combineSchemas, buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/schemas-peyu';
import NewsletterCTA from '@/components/newsletter/NewsletterCTA';

// Categorías del schema BlogPost
const CATEGORIAS = [
  'Todas',
  'Reciclaje y Medio Ambiente',
  'Educación Ambiental',
  'Guías y Tips',
  'Historia PEYU',
  'Casos de Éxito',
  'Noticias y Prensa',
  'Regalos Corporativos',
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('Todas');
  const [topic, setTopic] = useState('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const data = await base44.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 100);
      setPosts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (categoria !== 'Todas' && p.categoria !== categoria) return false;
      if (topic !== 'todos' && !postMatchesTopic(p, topic)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.titulo?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, categoria, topic, search]);

  // Conteo por topic para mostrar en chips
  const topicCounts = useMemo(() => {
    const counts = {};
    BLOG_TOPICS.forEach(t => {
      counts[t.id] = posts.filter(p => postMatchesTopic(p, t.id)).length;
    });
    return counts;
  }, [posts]);

  const destacado = filtered.find(p => p.destacado) || filtered[0];
  const resto = filtered.filter(p => p.id !== destacado?.id);

  const hayFiltrosActivos = categoria !== 'Todas' || topic !== 'todos' || !!search;

  // SEO: schema Blog + Breadcrumb
  const blogJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Blog', url: 'https://peyuchile.cl/blog' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog PEYU Chile',
      url: 'https://peyuchile.cl/blog',
      description: 'Educación sobre reciclaje, materiales sostenibles, consejos de uso y noticias de PEYU Chile.',
      inLanguage: 'es-CL',
      publisher: { '@type': 'Organization', name: 'PEYU Chile' },
    },
  );

  return (
    <>
      <SEO
        title="Blog PEYU · Reciclaje, sostenibilidad y educación ambiental"
        description="Aprende sobre plástico reciclado, fibra de trigo compostable, consejos de uso y noticias de PEYU Chile. Educación ambiental sin greenwashing."
        canonical="https://peyuchile.cl/blog"
        jsonLd={blogJsonLd}
      />
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">

          {/* Hero */}
          <header className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-500/15 border border-teal-400/30 text-teal-300 px-3 py-1 rounded-full text-[11px] font-semibold mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Blog Peyu
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight leading-[1.1]">
              Educación que <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">recicla</span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Sostenibilidad, materiales reciclados y consejos prácticos. Todo lo que aprendemos fabricando en Santiago con plástico recuperado.
            </p>
          </header>

          {/* Sección educativa */}
          <EducationSection />

          {/* Buscador */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar artículos por título, tag o palabra clave..."
                className="w-full h-12 pl-11 pr-10 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:bg-white/15 focus:border-teal-400/50 backdrop-blur-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {posts.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-white/50">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {posts.length} artículos</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Actualizado semanalmente</span>
              </div>
            )}
          </div>

          {/* Topic Chips (impacto / consejos / noticias) */}
          <div className="mb-6">
            <BlogTopicChips value={topic} onChange={setTopic} counts={topicCounts} />
          </div>

          {/* Categorías secundarias (scroll horizontal) */}
          <div className="overflow-x-auto pb-2 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 justify-start sm:justify-center min-w-max sm:min-w-0">
              {CATEGORIAS.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                    categoria === c
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Reset filtros */}
          {hayFiltrosActivos && (
            <div className="text-center mb-6">
              <button
                onClick={() => { setCategoria('Todas'); setTopic('todos'); setSearch(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 border border-white/15 hover:border-white/30 rounded-full px-3 py-1.5 transition"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-white/60">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-white">
                {search ? `Sin resultados para "${search}"` : 'Pronto publicaremos nuevos artículos'}
              </p>
              {search && <p className="text-sm mt-1">Intenta con otras palabras o limpia los filtros</p>}
            </div>
          )}

          {/* Grid principal */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {destacado && <BlogCard post={destacado} featured />}
              {resto.map(p => <BlogCard key={p.id} post={p} />)}
            </div>
          )}

          {/* Newsletter — captura email para envíos educativos quincenales */}
          {!loading && filtered.length > 0 && (
            <div className="max-w-2xl mx-auto mt-14">
              <NewsletterCTA variant="blog" />
            </div>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="text-center mt-10 text-white/50 text-xs flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Publicamos contenido nuevo cada semana</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}