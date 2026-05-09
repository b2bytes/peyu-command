// ============================================================================
// ApprovalQueuePanel — Cola de posts en revisión, listos para aprobar/publicar.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Send, Instagram, Linkedin, Facebook, Music2, Twitter, RefreshCw, Sparkles, Clock, ExternalLink, Copy } from 'lucide-react';

const ICONOS_RED = {
  Instagram, LinkedIn: Linkedin, Facebook, TikTok: Music2, 'Twitter/X': Twitter,
};

const ESTADOS = [
  { id: 'En revisión', label: 'En revisión', color: 'amber' },
  { id: 'Aprobado', label: 'Aprobados', color: 'emerald' },
  { id: 'Publicado', label: 'Publicados', color: 'sky' },
  { id: 'Borrador', label: 'Borradores', color: 'slate' },
];

export default function ApprovalQueuePanel({ refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('En revisión');
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ContentPost.list('-created_date', 100);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const filtered = posts.filter(p => p.estado === filter);

  const aprobar = async (post) => {
    setActioning(post.id);
    await base44.entities.ContentPost.update(post.id, { estado: 'Aprobado' });
    await load();
    setActioning(null);
  };

  const rechazar = async (post) => {
    setActioning(post.id);
    await base44.entities.ContentPost.update(post.id, { estado: 'Archivado' });
    await load();
    setActioning(null);
  };

  const publicar = async (post) => {
    setActioning(post.id);
    try {
      await base44.functions.invoke('publishContentPost', { post_id: post.id });
      await load();
    } catch (e) {
      alert('Error al publicar: ' + e.message);
    }
    setActioning(null);
  };

  const counts = ESTADOS.reduce((acc, e) => {
    acc[e.id] = posts.filter(p => p.estado === e.id).length;
    return acc;
  }, {});

  return (
    <div className="space-y-3 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map(e => (
            <button
              key={e.id}
              onClick={() => setFilter(e.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === e.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {e.label} · {counts[e.id] || 0}
            </button>
          ))}
        </div>
        <Button onClick={load} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0">
        {loading ? (
          <div className="text-center py-12 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Cargando cola…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay posts en estado "{filter}"</p>
            <p className="text-xs mt-1">Genera contenido desde el tab "Generador masivo"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                actioning={actioning === post.id}
                onAprobar={() => aprobar(post)}
                onRechazar={() => rechazar(post)}
                onPublicar={() => publicar(post)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, actioning, onAprobar, onRechazar, onPublicar }) {
  const Icon = ICONOS_RED[post.red_social] || Sparkles;
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    const txt = `${post.copy}\n\n${post.hashtags || ''}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
      {post.imagen_url && (
        <div className="aspect-square bg-black/30 relative">
          <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-full">
            <Icon className="w-3 h-3 text-white" />
            <span className="text-[10px] text-white font-medium">{post.red_social}</span>
          </div>
          {post.pillar_contenido && (
            <div className="absolute top-2 right-2 bg-violet-500/90 backdrop-blur px-2 py-1 rounded-full">
              <span className="text-[10px] text-white font-medium">{post.pillar_contenido}</span>
            </div>
          )}
        </div>
      )}

      <div className="p-3 flex-1 flex flex-col gap-2">
        <p className="text-xs font-semibold text-white truncate" title={post.titulo}>{post.titulo}</p>
        <p className="text-[11px] text-white/70 line-clamp-3 leading-relaxed">{post.copy}</p>
        {post.hashtags && (
          <p className="text-[10px] text-violet-300 line-clamp-2">{post.hashtags}</p>
        )}
        {post.cta && (
          <p className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" /> {post.cta}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] text-white/40 mt-auto pt-2">
          <Clock className="w-3 h-3" />
          {post.fecha_publicacion ? new Date(post.fecha_publicacion).toLocaleDateString('es-CL') : 'Sin fecha'}
          {post.hora_publicacion && ` · ${post.hora_publicacion}`}
        </div>

        <div className="flex gap-1.5 pt-1">
          {post.estado === 'En revisión' && (
            <>
              <Button onClick={onAprobar} disabled={actioning} size="sm" className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                {actioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Aprobar
              </Button>
              <Button onClick={onRechazar} disabled={actioning} size="sm" variant="outline" className="h-7 text-[11px] bg-white/5 border-white/10 text-white hover:bg-rose-500/20">
                <X className="w-3 h-3" />
              </Button>
            </>
          )}
          {post.estado === 'Aprobado' && (
            <Button onClick={onPublicar} disabled={actioning} size="sm" className="flex-1 h-7 text-[11px] bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white gap-1">
              {actioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Publicar
            </Button>
          )}
          <Button onClick={copyText} size="sm" variant="outline" className="h-7 text-[11px] bg-white/5 border-white/10 text-white hover:bg-white/10">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>

        {post.link_publicado && (
          <a href={post.link_publicado} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-300 hover:underline flex items-center gap-1 mt-1">
            <ExternalLink className="w-2.5 h-2.5" /> Ver publicación
          </a>
        )}
      </div>
    </div>
  );
}