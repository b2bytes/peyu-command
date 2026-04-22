import { useState, useMemo, useEffect } from 'react';
import { Calendar, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import PostMockup from './mockups/PostMockup';
import PostPreviewModal from './PostPreviewModal';

const ESTADO_COLORS = {
  'Borrador': 'bg-gray-100 text-gray-700 border-gray-200',
  'En revisión': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Aprobado': 'bg-blue-100 text-blue-700 border-blue-200',
  'Programado': 'bg-purple-100 text-purple-700 border-purple-200',
  'Publicado': 'bg-green-100 text-green-700 border-green-200',
  'Pausado': 'bg-orange-100 text-orange-700 border-orange-200',
  'Archivado': 'bg-gray-100 text-gray-500 border-gray-200',
};

const REDES_FILTER = ['Todas', 'Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Twitter/X', 'Pinterest', 'Threads', 'YouTube'];
const ESTADOS_FILTER = ['Todos', 'Borrador', 'En revisión', 'Aprobado', 'Programado', 'Publicado'];

export default function ContentPostsList({ posts, onUpdated, initialEstado }) {
  const [selected, setSelected] = useState(null);
  const [red, setRed] = useState('Todas');
  const [estado, setEstado] = useState('Todos');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');

  // Filtro externo desde panel de sugerencias IA
  useEffect(() => {
    if (initialEstado) setEstado(initialEstado);
  }, [initialEstado]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (red !== 'Todas' && p.red_social !== red) return false;
      if (estado !== 'Todos' && p.estado !== estado) return false;
      if (search && !(p.titulo?.toLowerCase().includes(search.toLowerCase()) || p.copy?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [posts, red, estado, search]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Aún no hay posts creados</p>
        <p className="text-xs mt-1">Usa el Generador Agéntico arriba ☝️</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar posts..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:border-purple-400 transition"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={red} onChange={e => setRed(e.target.value)} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold flex-1 min-w-[100px]">
            {REDES_FILTER.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={estado} onChange={e => setEstado(e.target.value)} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold flex-1 min-w-[100px]">
            {ESTADOS_FILTER.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow' : ''}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow' : ''}`}><ListIcon className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 font-semibold">{filtered.length} de {posts.length} posts</p>
      </div>

      {/* Grid de mockups */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all text-left"
            >
              <div className="absolute top-2 right-2 z-10">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${ESTADO_COLORS[p.estado] || 'bg-gray-100'}`}>
                  {p.estado}
                </span>
              </div>
              <div className="flex items-center justify-center min-h-[220px]">
                <PostMockup post={p} scale="sm" />
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.titulo}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>{p.red_social}</span>
                  <span>·</span>
                  <span>{p.tipo_post}</span>
                  {p.fecha_publicacion && (
                    <><span>·</span><Calendar className="w-2.5 h-2.5 inline" /> {new Date(p.fecha_publicacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lista compacta */}
      {view === 'list' && (
        <div className="space-y-1.5">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-2.5 hover:shadow-md hover:border-purple-300 transition text-left"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {p.imagen_url ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-xs text-gray-900 truncate">{p.titulo}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${ESTADO_COLORS[p.estado] || 'bg-gray-100'}`}>{p.estado}</span>
                </div>
                <p className="text-[10px] text-gray-500">{p.red_social} · {p.tipo_post}{p.pillar_contenido ? ` · ${p.pillar_contenido}` : ''}</p>
                {p.copy && <p className="text-[10px] text-gray-600 line-clamp-1 mt-0.5">{p.copy}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      <PostPreviewModal
        post={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onUpdated={() => { setSelected(null); onUpdated?.(); }}
      />
    </div>
  );
}