// ============================================================================
// ApprovalQueuePanel · 2027 redesign
// Grid de imágenes grande, hover overlays, filtros por red, drawer detail
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Send, Instagram, Linkedin, Facebook, Music2, Twitter, RefreshCw, Sparkles, Clock, ExternalLink, Copy, Image as ImageIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PostDetailDrawer from './PostDetailDrawer';

const ICONOS_RED = { Instagram, LinkedIn: Linkedin, Facebook, TikTok: Music2, 'Twitter/X': Twitter };

const ESTADOS = [
  { id: 'En revisión', label: 'En revisión', color: 'from-amber-400 to-orange-500',  textColor: 'text-amber-200' },
  { id: 'Aprobado',    label: 'Aprobados',   color: 'from-emerald-400 to-teal-500',  textColor: 'text-emerald-200' },
  { id: 'Publicado',   label: 'Publicados',  color: 'from-sky-400 to-blue-500',      textColor: 'text-sky-200' },
  { id: 'Borrador',    label: 'Borradores',  color: 'from-slate-400 to-slate-600',   textColor: 'text-slate-200' },
];

const REDES_FILTRO = [
  { id: 'all',       label: 'Todas', icon: ImageIcon },
  { id: 'Instagram', label: 'IG',    icon: Instagram },
  { id: 'LinkedIn',  label: 'LI',    icon: Linkedin },
  { id: 'Facebook',  label: 'FB',    icon: Facebook },
  { id: 'TikTok',    label: 'TT',    icon: Music2 },
];

export default function ApprovalQueuePanel({ refreshKey, onChange }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('En revisión');
  const [redFiltro, setRedFiltro] = useState('all');
  const [search, setSearch] = useState('');
  const [actioning, setActioning] = useState(null);
  const [detailPost, setDetailPost] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ContentPost.list('-created_date', 200);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = posts.filter(p => p.estado === estado);
    if (redFiltro !== 'all') list = list.filter(p => p.red_social === redFiltro);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.titulo?.toLowerCase().includes(q) || p.copy?.toLowerCase().includes(q));
    }
    return list;
  }, [posts, estado, redFiltro, search]);

  const counts = useMemo(() => ESTADOS.reduce((acc, e) => {
    acc[e.id] = posts.filter(p => p.estado === e.id).length;
    return acc;
  }, {}), [posts]);

  const handleAction = async (postId, action) => {
    setActioning(postId);
    try {
      if (action === 'approve')   await base44.entities.ContentPost.update(postId, { estado: 'Aprobado' });
      if (action === 'reject')    await base44.entities.ContentPost.update(postId, { estado: 'Archivado' });
      if (action === 'publish')   await base44.functions.invoke('publishContentPost', { post_id: postId });
      await load();
      onChange?.();
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setActioning(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-3">
      {/* Filtros · estado + red + search */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
        {/* Estado pills */}
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS.map(e => {
            const active = estado === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setEstado(e.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active ? 'text-white' : 'text-white/55 hover:text-white/85 bg-white/5 border border-white/10'
                }`}
              >
                {active && <span className={`absolute inset-0 rounded-xl bg-gradient-to-br ${e.color} opacity-90`} />}
                <span className="relative flex items-center gap-1.5">
                  {e.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60'}`}>
                    {counts[e.id] || 0}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10" />

        {/* Red social */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          {REDES_FILTRO.map(r => {
            const Icon = r.icon;
            const active = redFiltro === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRedFiltro(r.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  active ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
                }`}
                title={r.id}
              >
                <Icon className="w-3 h-3" />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar copy o título…"
            className="pl-8 h-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs"
          />
        </div>

        <Button onClick={load} variant="ghost" size="sm" className="h-8 text-white/60 hover:text-white hover:bg-white/10 gap-1">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Grid de imágenes — protagonista absoluto */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 -mr-2 pr-2">
        {loading ? (
          <div className="text-center py-16 text-white/40">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />
            <p className="text-sm">Cargando cola…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState estado={estado} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filtered.map(post => (
              <PostTile
                key={post.id}
                post={post}
                actioning={actioning === post.id}
                onAction={(a) => handleAction(post.id, a)}
                onOpen={() => setDetailPost(post)}
              />
            ))}
          </div>
        )}
      </div>

      {detailPost && (
        <PostDetailDrawer
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onAction={async (a) => { await handleAction(detailPost.id, a); setDetailPost(null); }}
          actioning={actioning === detailPost.id}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PostTile · card protagonizada por la imagen
// ─────────────────────────────────────────────────────────────────────────
function PostTile({ post, actioning, onAction, onOpen }) {
  const Icon = ICONOS_RED[post.red_social] || Sparkles;

  return (
    <div
      onClick={onOpen}
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
    >
      {/* Imagen full-bleed */}
      {post.imagen_url ? (
        <img
          src={post.imagen_url}
          alt={post.titulo}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/30 to-pink-900/30">
          <ImageIcon className="w-8 h-8 text-white/30" />
        </div>
      )}

      {/* Gradient bottom — mejor lectura del texto */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Top chips · red + pillar */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full">
          <Icon className="w-3 h-3 text-white" />
          <span className="text-[10px] text-white font-semibold">{post.red_social}</span>
        </div>
        {post.pillar_contenido && (
          <span className="text-[9px] font-bold bg-violet-500/90 backdrop-blur px-2 py-0.5 rounded-full text-white max-w-[60%] truncate">
            {post.pillar_contenido}
          </span>
        )}
      </div>

      {/* Bottom · título + meta */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1.5">
          {post.titulo}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-white/70">
          {post.fecha_publicacion && (
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date(post.fecha_publicacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {post.tipo_post && <span className="text-white/50">· {post.tipo_post}</span>}
        </div>
      </div>

      {/* Hover overlay con acciones */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
        {post.estado === 'En revisión' && (
          <>
            <Button
              onClick={(e) => { e.stopPropagation(); onAction('approve'); }}
              disabled={actioning}
              size="sm"
              className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 shadow-lg shadow-emerald-500/30"
            >
              {actioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />} Aprobar
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); onAction('reject'); }}
              disabled={actioning}
              size="sm"
              variant="outline"
              className="w-full h-8 bg-white/5 border-white/20 text-white hover:bg-rose-500/30 hover:border-rose-400/50"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Rechazar
            </Button>
          </>
        )}
        {post.estado === 'Aprobado' && (
          <Button
            onClick={(e) => { e.stopPropagation(); onAction('publish'); }}
            disabled={actioning}
            size="sm"
            className="w-full h-9 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white gap-1.5 shadow-lg shadow-pink-500/30"
          >
            {actioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-4 h-4" />} Publicar
          </Button>
        )}
        <Button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          variant="ghost"
          size="sm"
          className="h-8 text-white/80 hover:text-white hover:bg-white/10 text-[11px]"
        >
          Ver detalle →
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ estado }) {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-violet-300" />
      </div>
      <p className="text-white/80 font-medium">Sin posts en "{estado}"</p>
      <p className="text-xs text-white/40 mt-1">
        Genera contenido desde el tab <span className="text-white/70 font-semibold">Generar lote</span> o <span className="text-white/70 font-semibold">Plan semanal</span>.
      </p>
    </div>
  );
}