import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Newspaper, Loader2, Search, Sparkles, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import BlogPostEditModal from './BlogPostEditModal';

const CATEGORIAS = [
  'Reciclaje y Medio Ambiente', 'Guías y Tips', 'Regalos Corporativos', 'Historia PEYU',
  'Casos de Éxito', 'Noticias y Prensa', 'Educación Ambiental',
];

// Gestor del blog embebido en el chat del Agente OS: crear artículos con IA,
// editar, publicar/despublicar y eliminar — sin salir de la conversación.
export default function BlogManagerCard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editando, setEditando] = useState(null);
  const [topic, setTopic] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [generando, setGenerando] = useState(false);
  const [errorGen, setErrorGen] = useState('');

  const load = async () => {
    const rows = await base44.entities.BlogPost.list('-fecha_publicacion', 100).catch(() => []);
    setPosts(rows || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generarConIA = async () => {
    if (!topic.trim() || generando) return;
    setGenerando(true);
    setErrorGen('');
    const r = await base44.functions.invoke('generateBlogPost', { topic: topic.trim(), categoria }).catch((e) => ({ data: { error: e.message } }));
    setGenerando(false);
    if (r?.data?.success) {
      setTopic('');
      await load();
    } else {
      setErrorGen(r?.data?.error || 'No se pudo generar el artículo. Intenta de nuevo.');
    }
  };

  const togglePublicado = async (p) => {
    await base44.entities.BlogPost.update(p.id, { publicado: !p.publicado }).catch(() => null);
    load();
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar el artículo "${p.titulo}"? Esta acción no se puede deshacer.`)) return;
    await base44.entities.BlogPost.delete(p.id).catch(() => null);
    load();
  };

  const filtrados = posts.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase().trim();
    return [p.titulo, p.categoria, p.excerpt].some((v) => (v || '').toLowerCase().includes(s));
  });

  return (
    <div className="ld-card rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-ld-action-soft flex items-center justify-center flex-shrink-0">
          <Newspaper className="w-4 h-4 text-ld-action" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ld-fg leading-tight">Blog PEYU</p>
          <p className="text-[11px] text-ld-fg-muted">{posts.filter((p) => p.publicado !== false).length} publicados de {posts.length}</p>
        </div>
        <Link to="/blog" target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ld-btn-ghost">
          <ExternalLink className="w-3 h-3" /> Ver blog
        </Link>
      </div>

      {/* Crear artículo con IA */}
      <div className="rounded-xl border border-ld-border bg-ld-bg-elevated p-3 mb-3">
        <p className="text-[11px] font-bold text-ld-fg mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-ld-action" /> Escribir artículo nuevo con IA
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generarConIA()}
            placeholder="Tema (ej. cómo reciclar tapitas plásticas en casa)"
            className="flex-1 min-w-[180px] h-9 rounded-xl ld-input text-xs px-3"
          />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="h-9 rounded-xl ld-input text-xs px-2">
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={generarConIA}
            disabled={generando || !topic.trim()}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold text-white ld-btn-primary disabled:opacity-50"
          >
            {generando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generando ? 'Escribiendo…' : 'Generar y publicar'}
          </button>
        </div>
        {errorGen && <p className="text-[10px] text-ld-highlight font-semibold mt-1.5">{errorGen}</p>}
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artículo…" className="w-full h-8 pl-8 pr-3 rounded-xl ld-input text-xs" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ld-fg-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando artículos…
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-xs text-ld-fg-muted text-center py-8">Sin artículos para este filtro.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto peyu-scrollbar pr-1">
          {filtrados.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-ld-border bg-ld-bg-elevated p-2">
              {p.imagen_portada && (
                <img src={p.imagen_portada} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ld-fg truncate">{p.titulo}</p>
                <p className="text-[10px] text-ld-fg-muted truncate">{p.categoria} · {p.fecha_publicacion || 'sin fecha'} {p.publicado === false && '· 🔒 borrador'}</p>
              </div>
              <button onClick={() => togglePublicado(p)} title={p.publicado !== false ? 'Despublicar' : 'Publicar'} className="w-7 h-7 rounded-lg ld-btn-ghost flex items-center justify-center flex-shrink-0">
                {p.publicado !== false ? <Eye className="w-3.5 h-3.5 text-ld-action" /> : <EyeOff className="w-3.5 h-3.5 text-ld-fg-muted" />}
              </button>
              <button onClick={() => setEditando(p)} title="Editar" className="w-7 h-7 rounded-lg ld-btn-ghost flex items-center justify-center flex-shrink-0">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => eliminar(p)} title="Eliminar" className="w-7 h-7 rounded-lg ld-btn-ghost flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-ld-highlight" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <BlogPostEditModal post={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); load(); }} />
      )}
    </div>
  );
}