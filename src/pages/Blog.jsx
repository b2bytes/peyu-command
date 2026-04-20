import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import BlogCard from '../components/blog/BlogCard';

const CATEGORIAS = [
  'Todos',
  'Historia PEYU',
  'Reciclaje y Medio Ambiente',
  'Guías y Tips',
  'Casos de Éxito',
  'Noticias y Prensa',
  'Regalos Corporativos',
  'Educación Ambiental',
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categoria, setCategoria] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 50)
      .then(r => { setPosts(r || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtrados = categoria === 'Todos' ? posts : posts.filter(p => p.categoria === categoria);
  const destacado = filtrados.find(p => p.destacado);
  const resto = filtrados.filter(p => p.id !== destacado?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Blog PEYU</h1>
              <p className="text-white/85 text-sm">Historias reales, reciclaje y diseño consciente desde Chile</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIAS.map(c => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoria === c
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-slate-800/70 text-white/85 hover:bg-slate-700 border border-white/15'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/70">Cargando artículos...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-white/70">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-60" />
            <p>No hay artículos en esta categoría todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destacado && <BlogCard post={destacado} featured />}
            {resto.map(p => <BlogCard key={p.id} post={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}