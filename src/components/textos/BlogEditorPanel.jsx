import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import {
  Loader2, Plus, Edit2, Trash2, Save, X, Star, Eye, EyeOff, Search,
  Sparkles, ImagePlus, Upload, Hash, Newspaper, Clock, ArrowLeft,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// BlogEditorPanel — Estudio de publicación de artículos del blog (BlogPost).
// Listado con buscador + editor profesional de 2 columnas: a la izquierda el
// contenido (título, resumen, Markdown con vista previa en vivo); a la derecha
// los ajustes de publicación (portada con IA, categoría, tags, SEO, estado).
// ════════════════════════════════════════════════════════════════════════
const CATEGORIAS = [
  'Historia PEYU', 'Reciclaje y Medio Ambiente', 'Guías y Tips', 'Casos de Éxito',
  'Noticias y Prensa', 'Regalos Corporativos', 'Educación Ambiental',
];

const C = {
  bg: '#F8F3ED', surface: '#FFFFFF', soft: '#FBF8F3', border: '#D4C4B0',
  fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070', action: '#0F8B6C',
};

const slugify = (s) => (s || '')
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const tiempoLectura = (md) => {
  const palabras = (md || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
};

const VACIO = {
  titulo: '', slug: '', excerpt: '', contenido_md: '', categoria: 'Regalos Corporativos',
  imagen_portada: '', autor: 'Equipo PEYU', tags: [], seo_description: '',
  destacado: false, publicado: true, fecha_publicacion: new Date().toISOString().split('T')[0],
};

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm outline-none transition-colors focus:border-[#0F8B6C]';
const inputStyle = { border: `1.5px solid ${C.border}`, color: C.fg, background: C.soft };

function Campo({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-bold" style={{ color: C.fgSoft }}>{label}</label>
        {hint && <span className="text-[10px]" style={{ color: C.fgMuted }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Editor de tags inline ──────────────────────────────────────────────
function TagsInput({ tags, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft('');
  };
  return (
    <div className="rounded-xl px-2.5 py-2 flex flex-wrap gap-1.5 items-center" style={inputStyle}>
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
          style={{ background: 'rgba(15,139,108,.1)', color: C.action }}>
          <Hash className="w-3 h-3" />{t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={tags.length ? '' : 'reciclaje, regalos…'}
        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none"
        style={{ color: C.fg }}
      />
    </div>
  );
}

function PostForm({ post, onCancel, onSaved }) {
  const [form, setForm] = useState(post || VACIO);
  const [saving, setSaving] = useState(false);
  const [genImg, setGenImg] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const lectura = useMemo(() => tiempoLectura(form.contenido_md), [form.contenido_md]);
  const valido = form.titulo && form.excerpt && form.contenido_md;

  // Genera una imagen de portada editorial con IA a partir del título.
  const generarPortada = async () => {
    if (!form.titulo) return;
    setGenImg(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Editorial blog cover photo for an article titled "${form.titulo}" about ${form.categoria}. Sustainable, eco-friendly, warm natural lighting, recycled plastic products, Chilean brand PEYU aesthetic, clean minimal composition, high quality, no text overlay.`,
      });
      if (res?.url) set('imagen_portada', res.url);
    } catch (e) { /* noop */ }
    setGenImg(false);
  };

  // Sube una imagen de portada desde el computador.
  const subirPortada = async (file) => {
    if (!file) return;
    setGenImg(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) set('imagen_portada', res.file_url);
    } catch (e) { /* noop */ }
    setGenImg(false);
  };

  const guardar = async () => {
    if (!valido) return;
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.titulo),
      seo_description: form.seo_description || form.excerpt,
      tiempo_lectura_min: lectura,
    };
    if (post?.id) await base44.entities.BlogPost.update(post.id, payload);
    else await base44.entities.BlogPost.create(payload);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      {/* Barra superior del editor */}
      <div className="flex items-center justify-between gap-3 sticky top-0 z-10 py-2" style={{ background: C.bg }}>
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: C.fgSoft }}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview((p) => !p)}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-bold"
            style={{ border: `1.5px solid ${C.border}`, color: showPreview ? C.action : C.fgSoft }}>
            <Eye className="w-4 h-4" /> {showPreview ? 'Editar' : 'Vista previa'}
          </button>
          <button onClick={guardar} disabled={!valido || saving}
            className="flex items-center gap-1.5 px-5 h-10 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ background: C.action }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {post?.id ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* ── Columna izquierda: contenido ── */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
          {showPreview ? (
            <article className="space-y-3">
              {form.imagen_portada && <img src={form.imagen_portada} alt="" className="w-full aspect-[16/9] object-cover rounded-xl" referrerPolicy="no-referrer" />}
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.action }}>{form.categoria}</p>
              <h1 className="font-fraunces text-3xl leading-tight" style={{ color: C.fg }}>{form.titulo || 'Título del artículo'}</h1>
              <p className="text-sm italic" style={{ color: C.fgSoft }}>{form.excerpt}</p>
              <div className="ld-prose pt-2" style={{ color: C.fg }}>
                <ReactMarkdown>{form.contenido_md || '_Escribe el contenido para verlo aquí…_'}</ReactMarkdown>
              </div>
            </article>
          ) : (
            <>
              <Campo label="Título del artículo *">
                <input className={`${inputCls} text-base font-bold`} style={inputStyle} value={form.titulo}
                  onChange={(e) => { set('titulo', e.target.value); if (!post?.id) set('slug', slugify(e.target.value)); }}
                  placeholder="Ej: 5 ideas de regalos corporativos sostenibles" />
              </Campo>

              <Campo label="Resumen corto *" hint="Aparece en la tarjeta del blog">
                <textarea rows={2} className={`${inputCls} resize-y`} style={inputStyle} value={form.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)} placeholder="Una o dos frases que enganchen al lector." />
              </Campo>

              <Campo label="Contenido (Markdown) *" hint={`${lectura} min de lectura`}>
                <textarea rows={16} className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`} style={inputStyle} value={form.contenido_md}
                  onChange={(e) => set('contenido_md', e.target.value)}
                  placeholder={'## Subtítulo\n\nEscribe aquí con **negrita**, listas y enlaces.\n\n- Punto 1\n- Punto 2'} />
              </Campo>
            </>
          )}
        </div>

        {/* ── Columna derecha: ajustes de publicación ── */}
        <div className="space-y-3">
          {/* Portada */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.fgMuted }}>Imagen de portada</p>
            <div className="aspect-[16/9] rounded-xl overflow-hidden flex items-center justify-center" style={{ background: C.soft, border: `1.5px solid ${C.border}` }}>
              {genImg ? (
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.action }} />
              ) : form.imagen_portada ? (
                <img src={form.imagen_portada} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <ImagePlus className="w-8 h-8" style={{ color: C.fgMuted }} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={generarPortada} disabled={!form.titulo || genImg}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold text-white disabled:opacity-40" style={{ background: C.action }}>
                <Sparkles className="w-3.5 h-3.5" /> Crear con IA
              </button>
              <label className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold cursor-pointer"
                style={{ border: `1.5px solid ${C.border}`, color: C.fgSoft }}>
                <Upload className="w-3.5 h-3.5" /> Subir
                <input type="file" accept="image/*" className="hidden" onChange={(e) => subirPortada(e.target.files?.[0])} />
              </label>
            </div>
            <input className={`${inputCls} text-xs`} style={inputStyle} value={form.imagen_portada}
              onChange={(e) => set('imagen_portada', e.target.value)} placeholder="o pega una URL…" />
          </div>

          {/* Clasificación */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
            <Campo label="Categoría">
              <select className={inputCls} style={inputStyle} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Tags" hint="Enter para añadir">
              <TagsInput tags={form.tags || []} onChange={(t) => set('tags', t)} />
            </Campo>
          </div>

          {/* Metadatos */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Autor">
                <input className={inputCls} style={inputStyle} value={form.autor} onChange={(e) => set('autor', e.target.value)} />
              </Campo>
              <Campo label="Fecha">
                <input type="date" className={inputCls} style={inputStyle} value={form.fecha_publicacion || ''} onChange={(e) => set('fecha_publicacion', e.target.value)} />
              </Campo>
            </div>
            <Campo label="Slug (URL)">
              <input className={`${inputCls} font-mono text-xs`} style={inputStyle} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
            </Campo>
            <Campo label="Meta descripción SEO" hint="Opcional · usa el resumen si se deja vacío">
              <textarea rows={2} className={`${inputCls} resize-y text-xs`} style={inputStyle} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
            </Campo>
          </div>

          {/* Estado */}
          <div className="rounded-2xl p-4 space-y-2.5" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
            <label className="flex items-center justify-between text-sm font-semibold cursor-pointer" style={{ color: C.fgSoft }}>
              <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Publicado</span>
              <input type="checkbox" checked={!!form.publicado} onChange={(e) => set('publicado', e.target.checked)} className="w-4 h-4 accent-[#0F8B6C]" />
            </label>
            <label className="flex items-center justify-between text-sm font-semibold cursor-pointer" style={{ color: C.fgSoft }}>
              <span className="flex items-center gap-2"><Star className="w-4 h-4" /> Destacado</span>
              <input type="checkbox" checked={!!form.destacado} onChange={(e) => set('destacado', e.target.checked)} className="w-4 h-4 accent-[#0F8B6C]" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogEditorPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // post | 'new' | null
  const [search, setSearch] = useState('');

  const cargar = async () => {
    setLoading(true);
    const rows = await base44.entities.BlogPost.list('-fecha_publicacion', 100).catch(() => []);
    setPosts(rows || []);
    setLoading(false);
  };
  useEffect(() => { cargar(); }, []);

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
    await base44.entities.BlogPost.delete(id);
    cargar();
  };

  const filtered = useMemo(() => {
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter((p) => p.titulo?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q));
  }, [posts, search]);

  if (editing) {
    return (
      <PostForm
        post={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); cargar(); }}
      />
    );
  }

  const publicados = posts.filter((p) => p.publicado).length;

  return (
    <div className="space-y-4">
      {/* Barra: stats + buscador + nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-4 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.fgSoft }}>
            <Newspaper className="w-4 h-4" style={{ color: C.action }} /> {posts.length} artículos
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.fgSoft }}>
            <Eye className="w-4 h-4" style={{ color: C.action }} /> {publicados} publicados
          </span>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.fgMuted }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar artículo…"
            className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl text-white font-bold text-sm" style={{ background: C.action }}>
          <Plus className="w-4 h-4" /> Nuevo artículo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C.action }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 rounded-2xl" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
          <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: C.soft }}>
            <Newspaper className="w-6 h-6" style={{ color: C.fgMuted }} />
          </div>
          <p className="text-sm font-bold mb-1" style={{ color: C.fg }}>{search ? 'Sin resultados' : 'Aún no hay artículos'}</p>
          <p className="text-sm" style={{ color: C.fgSoft }}>{search ? 'Prueba con otra búsqueda.' : 'Publica tu primer artículo con “Nuevo artículo”.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl p-3 transition-all hover:shadow-sm" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
              {p.imagen_portada ? (
                <img src={p.imagen_portada} alt="" className="w-16 h-12 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: C.soft }}>
                  <ImagePlus className="w-4 h-4" style={{ color: C.fgMuted }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.destacado && <Star className="w-3 h-3 flex-shrink-0" style={{ color: '#E0A030', fill: '#E0A030' }} />}
                  <p className="text-sm font-bold truncate" style={{ color: C.fg }}>{p.titulo}</p>
                </div>
                <p className="text-[11px] truncate flex items-center gap-1.5" style={{ color: C.fgMuted }}>
                  {p.categoria} · {p.fecha_publicacion || 'sin fecha'}
                  {p.tiempo_lectura_min ? <span className="inline-flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{p.tiempo_lectura_min}min</span> : null}
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                style={{ background: p.publicado ? 'rgba(15,139,108,.1)' : C.soft, color: p.publicado ? C.action : C.fgMuted }}>
                {p.publicado ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {p.publicado ? 'Publicado' : 'Borrador'}
              </span>
              <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-black/5"><Edit2 className="w-4 h-4" style={{ color: C.fgSoft }} /></button>
              <button onClick={() => eliminar(p.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}