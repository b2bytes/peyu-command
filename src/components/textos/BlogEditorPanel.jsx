import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Edit2, Trash2, Save, X, Star, Eye, EyeOff } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// BlogEditorPanel — Gestión de posts del blog (entidad BlogPost).
// Listar, crear, editar y eliminar artículos. Contenido en Markdown.
// ════════════════════════════════════════════════════════════════════════
const CATEGORIAS = ['Historia PEYU', 'Reciclaje y Medio Ambiente', 'Guías y Tips', 'Casos de Éxito', 'Noticias y Prensa', 'Regalos Corporativos', 'Educación Ambiental'];

const C = {
  bg: '#F8F3ED', surface: '#FFFFFF', border: '#D4C4B0',
  fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070', action: '#0F8B6C',
};

const slugify = (s) => (s || '')
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const VACIO = {
  titulo: '', slug: '', excerpt: '', contenido_md: '', categoria: 'Guías y Tips',
  imagen_portada: '', autor: 'Equipo PEYU', destacado: false, publicado: true,
  fecha_publicacion: new Date().toISOString().split('T')[0],
};

function Campo({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1" style={{ color: C.fgSoft }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl px-3 py-2 text-sm outline-none";
const inputStyle = { border: `1.5px solid ${C.border}`, color: C.fg, background: '#FBF8F3' };

function PostForm({ post, onCancel, onSaved }) {
  const [form, setForm] = useState(post || VACIO);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.titulo) return;
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.titulo) };
    if (post?.id) await base44.entities.BlogPost.update(post.id, payload);
    else await base44.entities.BlogPost.create(payload);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm" style={{ color: C.fg }}>{post?.id ? 'Editar artículo' : 'Nuevo artículo'}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-black/5"><X className="w-4 h-4" style={{ color: C.fgMuted }} /></button>
      </div>

      <Campo label="Título *">
        <input className={inputCls} style={inputStyle} value={form.titulo}
          onChange={(e) => { set('titulo', e.target.value); if (!post?.id) set('slug', slugify(e.target.value)); }} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Slug (URL)">
          <input className={inputCls} style={inputStyle} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
        </Campo>
        <Campo label="Categoría">
          <select className={inputCls} style={inputStyle} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Campo>
      </div>

      <Campo label="Resumen corto">
        <textarea rows={2} className={`${inputCls} resize-y`} style={inputStyle} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
      </Campo>

      <Campo label="Imagen portada (URL)">
        <input className={inputCls} style={inputStyle} value={form.imagen_portada} onChange={(e) => set('imagen_portada', e.target.value)} placeholder="https://..." />
      </Campo>

      <Campo label="Contenido (Markdown)">
        <textarea rows={10} className={`${inputCls} resize-y font-mono text-xs`} style={inputStyle} value={form.contenido_md} onChange={(e) => set('contenido_md', e.target.value)} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Autor">
          <input className={inputCls} style={inputStyle} value={form.autor} onChange={(e) => set('autor', e.target.value)} />
        </Campo>
        <Campo label="Fecha publicación">
          <input type="date" className={inputCls} style={inputStyle} value={form.fecha_publicacion || ''} onChange={(e) => set('fecha_publicacion', e.target.value)} />
        </Campo>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: C.fgSoft }}>
          <input type="checkbox" checked={!!form.publicado} onChange={(e) => set('publicado', e.target.checked)} /> Publicado
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: C.fgSoft }}>
          <input type="checkbox" checked={!!form.destacado} onChange={(e) => set('destacado', e.target.checked)} /> Destacado
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 h-10 rounded-xl text-sm font-bold" style={{ border: `1.5px solid ${C.border}`, color: C.fgSoft }}>Cancelar</button>
        <button onClick={guardar} disabled={!form.titulo || saving}
          className="flex items-center gap-1.5 px-5 h-10 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: C.action }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
        </button>
      </div>
    </div>
  );
}

export default function BlogEditorPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // post object | 'new' | null

  const cargar = async () => {
    setLoading(true);
    const rows = await base44.entities.BlogPost.list('-fecha_publicacion', 100).catch(() => []);
    setPosts(rows || []);
    setLoading(false);
  };
  useEffect(() => { cargar(); }, []);

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    await base44.entities.BlogPost.delete(id);
    cargar();
  };

  if (editing) {
    return (
      <PostForm
        post={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); cargar(); }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-white font-bold text-sm" style={{ background: C.action }}>
          <Plus className="w-4 h-4" /> Nuevo artículo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C.action }} /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-sm" style={{ background: C.surface, border: `1.5px solid ${C.border}`, color: C.fgSoft }}>
          Aún no hay artículos. Crea el primero con “Nuevo artículo”.
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
              {p.imagen_portada ? (
                <img src={p.imagen_portada} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: '#F2EBE1' }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.destacado && <Star className="w-3 h-3 flex-shrink-0" style={{ color: '#E0A030', fill: '#E0A030' }} />}
                  <p className="text-sm font-bold truncate" style={{ color: C.fg }}>{p.titulo}</p>
                </div>
                <p className="text-[11px] truncate" style={{ color: C.fgMuted }}>{p.categoria} · {p.fecha_publicacion || 'sin fecha'}</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                style={{ background: p.publicado ? 'rgba(15,139,108,.1)' : '#F2EBE1', color: p.publicado ? C.action : C.fgMuted }}>
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