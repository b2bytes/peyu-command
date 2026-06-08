// ============================================================================
// WeeklyPlannerPanel — Genera plan semanal + vista calendario de posts.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Sparkles, Loader2, Check, AlertCircle, Lightbulb, ChevronLeft, ChevronRight, Instagram, Linkedin, Facebook, Music2, Trash2, X } from 'lucide-react';
import PostEditorModal from './PostEditorModal';

const TEMAS_SUGERIDOS = [
  '🌱 Sostenibilidad y economía circular',
  '🎁 Gifting corporativo de fin de año',
  '🇨🇱 Hecho en Chile, diseño consciente',
  '♻️ Cómo reciclamos plástico oceánico',
  '💼 Casos de éxito B2B',
  '🏆 Premios y reconocimientos PEYU',
];

const REDES_DISPONIBLES = ['Instagram', 'LinkedIn', 'Facebook', 'TikTok'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ICONO_RED = { Instagram, LinkedIn: Linkedin, Facebook, TikTok: Music2 };
const COLOR_RED = {
  Instagram: 'from-pink-500 to-orange-500',
  LinkedIn:  'from-sky-500 to-blue-600',
  Facebook:  'from-blue-500 to-indigo-600',
  TikTok:    'from-slate-600 to-slate-800',
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Lunes como inicio
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

// Mini chip de un post en el calendario — clicable
function PostChip({ post, onDelete, onEdit }) {
  const Icon = ICONO_RED[post.red_social] || Sparkles;
  const grad = COLOR_RED[post.red_social] || 'from-violet-500 to-pink-500';
  return (
    <div
      onClick={() => onEdit(post)}
      className={`group cursor-pointer relative flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r ${grad} bg-opacity-90 hover:bg-opacity-100 transition-all hover:shadow-lg active:scale-[0.98]`}
    >
      <Icon className="w-2.5 h-2.5 text-white flex-shrink-0" />
      <span className="text-[9px] text-white font-semibold truncate max-w-[60px]">{post.titulo || post.red_social}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-white/80 hover:text-white hover:bg-white/20 rounded p-0.5 flex-shrink-0"
        title="Eliminar post"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export default function WeeklyPlannerPanel({ onGenerated }) {
  const [tema, setTema] = useState('');
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [redes, setRedes] = useState(['Instagram', 'LinkedIn']);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Calendario
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const loadPosts = async () => {
    setLoadingPosts(true);
    const data = await base44.entities.ContentPost.list('-created_date', 300);
    setPosts(data || []);
    setLoadingPosts(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const toggleRed = (r) => {
    setRedes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const generar = async () => {
    if (!tema) return setError('Ingresa un tema central para la semana');
    if (redes.length === 0) return setError('Selecciona al menos 1 red');
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('generateWeeklyContentPlan', {
        tema_semanal: tema,
        fecha_inicio: fechaInicio,
        redes,
      });
      setResult(res.data);
      onGenerated?.();
      await loadPosts();
      // Saltar al calendario mostrando la semana generada
      setWeekStart(getWeekStart(new Date(fechaInicio)));
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (postId) => {
    setDeletingId(postId);
    try {
      await base44.entities.ContentPost.delete(postId);
      await loadPosts();
      onGenerated?.();
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
  };

  const handleClosEditor = async (updated) => {
    if (updated) {
      await loadPosts();
      onGenerated?.();
    }
    setSelectedPost(null);
  };

  // Semana visible
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Posts agrupados por día
  const postsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => {
      const key = d.toDateString();
      map[key] = posts.filter((p) => {
        if (!p.fecha_publicacion) return false;
        return isSameDay(new Date(p.fecha_publicacion), d);
      });
    });
    return map;
  }, [posts, weekDays]);

  const totalWeek = weekDays.reduce((acc, d) => acc + (postsByDay[d.toDateString()]?.length || 0), 0);
  const today = new Date();

  return (
    <div className="h-full flex flex-col min-h-0 gap-3">
      {selectedPost && <PostEditorModal post={selectedPost} onClose={handleClosEditor} />}
      {/* Header del calendario */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">Calendario semanal</h3>
            <p className="text-[10px] text-white/50">{totalWeek} posts esta semana</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Navegación semana */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-white/70 font-medium px-2 whitespace-nowrap">
              {weekDays[0].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} –{' '}
              {weekDays[6].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
            </span>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            Hoy
          </button>

          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:from-violet-600 hover:to-pink-600 transition-all shadow-lg shadow-violet-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generar semana
          </button>
        </div>
      </div>

      {/* Formulario colapsable */}
      {showForm && (
        <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Tema central</label>
              <Input
                value={tema}
                onChange={e => setTema(e.target.value)}
                placeholder="Ej: Lanzamiento línea fibra de trigo"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Fecha inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-9 w-36"
              />
            </div>
            <Button
              onClick={generar}
              disabled={generating || !tema}
              className="h-9 gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-md"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? 'Generando…' : 'Generar'}
            </Button>
          </div>

          {/* Redes */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Redes:</span>
            {REDES_DISPONIBLES.map(r => (
              <button
                key={r}
                onClick={() => toggleRed(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  redes.includes(r) ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Temas sugeridos */}
          <div className="flex flex-wrap gap-1.5">
            {TEMAS_SUGERIDOS.map(t => (
              <button
                key={t}
                onClick={() => setTema(t.replace(/^[^\s]+ /, ''))}
                className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1"
              >
                <Lightbulb className="w-2.5 h-2.5" /> {t}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2.5 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-2.5 text-xs text-emerald-200 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              {result.posts_creados} posts creados para {redes.length} red(es) · Revisa el calendario ↓
            </div>
          )}
        </div>
      )}

      {/* Grid del calendario — protagonista */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Cabecera de días */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 flex-shrink-0">
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <div key={i} className="text-center">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{DIAS[i]}</p>
                <p className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-all ${
                  isToday ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-md' : 'text-white/70'
                }`}>
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Celdas de contenido */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light">
          {weekDays.map((d, i) => {
            const key = d.toDateString();
            const dayPosts = postsByDay[key] || [];
            const isToday = isSameDay(d, today);
            return (
              <div
                key={i}
                className={`rounded-xl p-1.5 flex flex-col gap-1 min-h-[120px] transition-all ${
                  isToday
                    ? 'bg-violet-500/10 border border-violet-400/30'
                    : 'bg-white/3 border border-white/8 hover:bg-white/5'
                }`}
              >
                {loadingPosts ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white/20" />
                  </div>
                ) : dayPosts.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[9px] text-white/15 text-center">—</p>
                  </div>
                ) : (
                 <div className="space-y-1">
                   {dayPosts.map((p) => (
                     <PostChip key={p.id} post={p} onDelete={handleDelete} onEdit={handleEdit} />
                   ))}
                 </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda de redes */}
      <div className="flex-shrink-0 flex items-center gap-3 flex-wrap pt-1">
        {Object.entries(COLOR_RED).map(([red, grad]) => {
          const Icon = ICONO_RED[red];
          return (
            <div key={red} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${grad}`} />
              <span className="text-[10px] text-white/40 font-medium">{red}</span>
            </div>
          );
        })}
        <span className="text-[10px] text-white/25 ml-auto">Clic para editar · Hover para eliminar</span>
      </div>
    </div>
  );
}