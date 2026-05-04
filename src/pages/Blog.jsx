import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, BookOpen, TrendingUp, Clock, X } from 'lucide-react';
import BlogCard from '../components/blog/BlogCard';
import BlogTopicChips, { BLOG_TOPICS, postMatchesTopic } from '../components/blog/BlogTopicChips';
import EducationSection from '../components/blog/EducationSection';
import SEO from '@/components/SEO';
import { combineSchemas, buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/schemas-peyu';
import NewsletterCTA from '@/components/newsletter/NewsletterCTA';

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

      {/* Fondo creme/papel — separa visualmente al blog del resto del sitio */}
      <div className="bg-[#FAF7F2] min-h-screen text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">

          {/* HERO editorial — más compacto en mobile */}
          <header className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] mb-4 sm:mb-5">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Blog Peyu
            </div>
            <h1 className="font-poppins font-extrabold text-slate-900 mb-3 sm:mb-4 tracking-tight leading-[1.05] text-[2rem] sm:text-6xl lg:text-7xl">
              Educación que{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent italic">
                recicla
              </span>
            </h1>
            <p className="text-slate-600 text-[14px] sm:text-lg max-w-2xl mx-auto leading-relaxed px-2">
              Sostenibilidad, materiales reciclados y consejos prácticos. Todo lo que aprendemos fabricando en Santiago con plástico recuperado.
            </p>
          </header>

          {/* Sección educativa */}
          <EducationSection />

          {/* Buscador */}
          <div className="max-w-2xl mx-auto mb-7">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título, tag o palabra clave..."
                className="w-full h-12 pl-11 pr-10 bg-white border border-stone-200 text-slate-900 placeholder:text-slate-400 rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {posts.length > 0 && (
              <div className="flex items-center justify-center gap-5 mt-4 text-[12px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-teal-600" /> {posts.length} artículos</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Actualizado semanalmente</span>
              </div>
            )}
          </div>

          {/* Topic Chips */}
          <div className="mb-7">
            <BlogTopicChips value={topic} onChange={setTopic} counts={topicCounts} />
          </div>

          {/* Categorías secundarias */}
          <div className="overflow-x-auto pb-2 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex gap-2 justify-start sm:justify-center min-w-max sm:min-w-0">
              {CATEGORIAS.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition whitespace-nowrap border ${
                    categoria === c
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white border-stone-200 text-slate-600 hover:bg-stone-50 hover:text-slate-900 hover:border-stone-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Reset filtros */}
          {hayFiltrosActivos && (
            <div className="text-center mb-8">
              <button
                onClick={() => { setCategoria('Todas'); setTopic('todos'); setSearch(''); }}
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-slate-900 bg-white border border-stone-200 hover:border-stone-300 rounded-full px-3.5 py-1.5 transition font-medium"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white border border-stone-200 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-stone-100" />
                  <div className="p-5 space-y-2.5">
                    <div className="h-3 bg-stone-200 rounded w-1/3" />
                    <div className="h-5 bg-stone-200 rounded w-full" />
                    <div className="h-3 bg-stone-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-bold text-slate-900 text-lg">
                {search ? `Sin resultados para "${search}"` : 'Pronto publicaremos nuevos artículos'}
              </p>
              {search && <p className="text-sm text-slate-500 mt-1.5">Intenta con otras palabras o limpia los filtros</p>}
            </div>
          )}

          {/* Grid principal */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {destacado && <BlogCard post={destacado} featured variant="light" />}
              {resto.map(p => <BlogCard key={p.id} post={p} variant="light" />)}
            </div>
          )}

          {/* Newsletter */}
          {!loading && filtered.length > 0 && (
            <div className="max-w-2xl mx-auto mt-16">
              <NewsletterCTA variant="blog" />
            </div>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="text-center mt-10 text-slate-500 text-[12px] flex items-center justify-center gap-2 font-medium">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Publicamos contenido nuevo cada semana</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}