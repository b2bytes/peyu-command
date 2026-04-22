import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, BookOpen, TrendingUp, Clock } from 'lucide-react';
import BlogCard from '../components/blog/BlogCard';

const CATEGORIAS = ['Todas', 'Sostenibilidad', 'Producto', 'Corporativo', 'Historias', 'Tips', 'Novedades'];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('Todas');
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
  }, [posts, categoria, search]);

  const destacado = filtered.find(p => p.destacado) || filtered[0];
  const resto = filtered.filter(p => p.id !== destacado?.id);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">

        {/* Hero */}
        <header className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-teal-500/15 border border-teal-400/30 text-teal-300 px-3 py-1 rounded-full text-[11px] font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Blog Peyu
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight leading-[1.1]">
            Historias que <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">inspiran</span>
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Sostenibilidad, diseño y economía circular. Todo lo que aprendemos fabricando en Santiago con plástico reciclado.
          </p>
        </header>

        {/* Buscador + Stats */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artículos..."
              className="w-full h-12 pl-11 pr-4 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:bg-white/15 focus:border-teal-400/50 backdrop-blur-sm"
            />
          </div>
          {posts.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-white/50">
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {posts.length} artículos</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Actualizado semanalmente</span>
            </div>
          )}
        </div>

        {/* Categorías (scroll horizontal en móvil) */}
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

        {/* Grid principal */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-white/60">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium text-white">
              {search ? `Sin resultados para "${search}"` : 'Pronto publicaremos nuevos artículos'}
            </p>
            {search && <p className="text-sm mt-1">Intenta con otras palabras</p>}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {destacado && <BlogCard post={destacado} featured />}
            {resto.map(p => <BlogCard key={p.id} post={p} />)}
          </div>
        )}

        {/* Footer de blog */}
        {!loading && filtered.length > 0 && (
          <div className="text-center mt-14 text-white/50 text-xs flex items-center justify-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Publicamos contenido nuevo cada semana</span>
          </div>
        )}
      </div>
    </div>
  );
}