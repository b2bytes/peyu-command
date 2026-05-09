// ============================================================================
// ApprovalQueuePanel — Cola de posts pendientes de aprobación / publicación.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Loader2, Check, X, Send, Image as ImageIcon, Copy, ExternalLink, Calendar,
  Clock, Instagram, Linkedin, Facebook, Music2, AlertCircle, Sparkles, Pencil,
} from 'lucide-react';

const RED_ICONS = { Instagram, LinkedIn: Linkedin, Facebook, TikTok: Music2 };

const ESTADO_FILTROS = [
  { id: 'En revisión', label: 'En revisión', color: 'amber' },
  { id: 'Aprobado', label: 'Aprobados', color: 'emerald' },
  { id: 'Programado', label: 'Programados', color: 'violet' },
  { id: 'Publicado', label: 'Publicados', color: 'sky' },
  { id: 'Borrador', label: 'Borradores', color: 'slate' },
];

export default function ApprovalQueuePanel({ refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('En revisión');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ContentPost.filter({ estado: filter }, '-created_date', 100);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, refreshKey]);

  const counts = useMemo(() => {
    // count se hace en backend si crece, por ahora lazy
    return posts.length;
  }, [posts]);

  const handleStateChange = async (postId, nuevo) => {
    await base44.entities.ContentPost.update(postId, { estado: nuevo });
    if (selected?.id === postId) setSelected({ ...selected, estado: nuevo });
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-4 h-full min-h-0">
      {/* Lista */}
      <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-white/10 flex-shrink-0 flex flex-wrap gap-1">
          {ESTADO_FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-violet-500 text-white shadow'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-2 min-h-0">
          {loading ? (
            <div className="text-center py-8 text-white/50 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando posts…
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay posts {filter.toLowerCase()}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {posts.map(p => (
                <PostCard
                  key={p.id}
                  post={p}
                  active={selected?.id === p.id}
                  onClick={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detalle / Editor */}
      <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40">
            <Sparkles className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Selecciona un post para revisar</p>
          </div>
        ) : (
          <PostDetail
            post={selected}
            onStateChange={handleStateChange}
            onUpdate={(patch) => {
              setPosts(prev => prev.map(x => x.id === selected.id ? { ...x, ...patch } : x));
              setSelected({ ...selected, ...patch });
            }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}

function PostCard({ post, active, onClick }) {
  const Icon = RED_ICONS[post.red_social] || Instagram;
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white/5 border rounded-xl overflow-hidden hover:bg-white/10 transition-all ${
        active ? 'border-violet-400 ring-2 ring-violet-400/30' : 'border-white/10'
      }`}
    >
      <div className="aspect-square bg-black/40">
        {post.imagen_url ? (
          <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1">
          <Icon className="w-3 h-3 text-white/70" />
          <span className="text-[10px] font-medium text-white/70">{post.red_social}</span>
          <span className="text-[10px] text-white/40">·</span>
          <span className="text-[10px] text-white/40">{post.pillar_contenido || '—'}</span>
        </div>
        <p className="text-xs font-semibold text-white line-clamp-2">{post.titulo}</p>
        {post.fecha_publicacion && (
          <div className="flex items-center gap-1 text-[10px] text-white/50">
            <Calendar className="w-2.5 h-2.5" />
            {post.fecha_publicacion} {post.hora_publicacion && `· ${post.hora_publicacion}`}
          </div>
        )}
      </div>
    </button>
  );
}

function PostDetail({ post, onStateChange, onUpdate, onClose }) {
  const Icon = RED_ICONS[post.red_social] || Instagram;
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({ copy: post.copy || '', hashtags: post.hashtags || '', cta: post.cta || '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    setDraft({ copy: post.copy || '', hashtags: post.hashtags || '', cta: post.cta || '' });
    setEditMode(false);
    setPublishResult(null);
  }, [post.id]);

  const fullCaption = [post.copy, post.hashtags].filter(Boolean).join('\n\n');

  const copy = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  const guardarEdicion = async () => {
    setSavingEdit(true);
    try {
      await base44.entities.ContentPost.update(post.id, draft);
      onUpdate(draft);
      setEditMode(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const publicar = async (modo) => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await base44.functions.invoke('publishContentPost', { post_id: post.id, modo });
      setPublishResult(res.data);
      if (res.data?.ok) onUpdate({ estado: 'Publicado' });
    } catch (e) {
      setPublishResult({ ok: false, error: e.message });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Icon className="w-3.5 h-3.5" />
            <span>{post.red_social}</span>
            <span>·</span>
            <span>{post.tipo_post}</span>
            <span>·</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              post.estado === 'Aprobado' ? 'bg-emerald-500/20 text-emerald-300' :
              post.estado === 'Publicado' ? 'bg-sky-500/20 text-sky-300' :
              post.estado === 'Programado' ? 'bg-violet-500/20 text-violet-300' :
              'bg-amber-500/20 text-amber-300'
            }`}>{post.estado}</span>
          </div>
          <h3 className="text-base font-poppins font-bold text-white mt-1 truncate">{post.titulo}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-white/40 lg:hidden flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-4 space-y-3 min-h-0">
        {/* Imagen */}
        <div className="aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/10">
          {post.imagen_url ? (
            <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {post.fecha_publicacion && (
            <span className="bg-white/5 border border-white/10 rounded-md px-2 py-1 flex items-center gap-1 text-white/70">
              <Calendar className="w-3 h-3" /> {post.fecha_publicacion}
            </span>
          )}
          {post.hora_publicacion && (
            <span className="bg-white/5 border border-white/10 rounded-md px-2 py-1 flex items-center gap-1 text-white/70">
              <Clock className="w-3 h-3" /> {post.hora_publicacion}
            </span>
          )}
          {post.pillar_contenido && (
            <span className="bg-violet-500/15 border border-violet-400/30 rounded-md px-2 py-1 text-violet-200">
              {post.pillar_contenido}
            </span>
          )}
          {post.producto_relacionado_sku && (
            <span className="bg-emerald-500/15 border border-emerald-400/30 rounded-md px-2 py-1 text-emerald-200 font-mono">
              {post.producto_relacionado_sku}
            </span>
          )}
        </div>

        {/* Copy / Hashtags / CTA editables */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Contenido</span>
            <button
              onClick={() => editMode ? guardarEdicion() : setEditMode(true)}
              disabled={savingEdit}
              className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
            >
              {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
              {editMode ? (savingEdit ? 'Guardando…' : 'Guardar') : 'Editar'}
            </button>
          </div>

          <Field
            label="Copy"
            value={editMode ? draft.copy : post.copy}
            editable={editMode}
            onChange={(v) => setDraft(d => ({ ...d, copy: v }))}
            onCopy={() => copy(post.copy || '', 'copy')}
            copied={copiedField === 'copy'}
            multiline
          />
          <Field
            label="Hashtags"
            value={editMode ? draft.hashtags : post.hashtags}
            editable={editMode}
            onChange={(v) => setDraft(d => ({ ...d, hashtags: v }))}
            onCopy={() => copy(post.hashtags || '', 'hashtags')}
            copied={copiedField === 'hashtags'}
          />
          <Field
            label="CTA"
            value={editMode ? draft.cta : post.cta}
            editable={editMode}
            onChange={(v) => setDraft(d => ({ ...d, cta: v }))}
            onCopy={() => copy(post.cta || '', 'cta')}
            copied={copiedField === 'cta'}
          />
        </div>

        {publishResult && (
          <div className={`rounded-lg p-3 text-xs border ${
            publishResult.ok
              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
          }`}>
            {publishResult.ok ? (
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {publishResult.modo === 'auto' ? 'Publicado en redes' : 'Listo para publicación manual'}</p>
                {publishResult.link && (
                  <a href={publishResult.link} target="_blank" rel="noreferrer" className="underline flex items-center gap-1">
                    Ver post publicado <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {publishResult.assets?.composer_url && (
                  <div className="space-y-1.5 mt-2">
                    <button
                      onClick={() => copy(publishResult.assets.caption_completo, 'caption')}
                      className="flex items-center gap-1 text-emerald-200 hover:text-white"
                    >
                      <Copy className="w-3 h-3" /> {copiedField === 'caption' ? 'Copiado ✓' : 'Copiar caption + hashtags'}
                    </button>
                    <a
                      href={publishResult.assets.composer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline"
                    >
                      Abrir composer {post.red_social} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {publishResult.error || publishResult.reason}</p>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="border-t border-white/10 p-3 flex flex-wrap gap-2 flex-shrink-0">
        {post.estado === 'En revisión' && (
          <>
            <Button onClick={() => onStateChange(post.id, 'Aprobado')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="w-4 h-4" /> Aprobar
            </Button>
            <Button onClick={() => onStateChange(post.id, 'Archivado')} variant="outline" className="gap-1.5 bg-white/5 border-white/20 text-white hover:bg-white/10">
              <X className="w-4 h-4" /> Descartar
            </Button>
          </>
        )}
        {(post.estado === 'Aprobado' || post.estado === 'Programado') && (
          <>
            <Button onClick={() => publicar('auto')} disabled={publishing} className="gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar ahora
            </Button>
            <Button onClick={() => publicar('manual')} disabled={publishing} variant="outline" className="gap-1.5 bg-white/5 border-white/20 text-white hover:bg-white/10">
              <ExternalLink className="w-4 h-4" /> Publicar manual
            </Button>
          </>
        )}
        {post.estado === 'Publicado' && post.link_publicado && (
          <a href={post.link_publicado} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-sky-500/20 text-sky-200 hover:bg-sky-500/30">
            <ExternalLink className="w-4 h-4" /> Ver publicado
          </a>
        )}
      </div>
    </>
  );
}

function Field({ label, value, editable, onChange, onCopy, copied, multiline }) {
  return (
    <div className="bg-black/20 rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</span>
        <button onClick={onCopy} className="text-[10px] text-white/50 hover:text-white flex items-center gap-1">
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>
      {editable ? (
        multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white resize-none"
          />
        ) : (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white"
          />
        )
      ) : (
        <p className="text-xs text-white/85 whitespace-pre-line leading-relaxed">{value || <span className="text-white/30">— vacío —</span>}</p>
      )}
    </div>
  );
}