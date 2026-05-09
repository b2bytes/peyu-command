// ============================================================================
// WeeklyPlannerPanel — Genera plan semanal (7 posts) desde un tema base.
// Usa Backlinks recientes como insight para PR / autoridad.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Sparkles, Loader2, Check, AlertCircle, Globe, Lightbulb } from 'lucide-react';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const TEMAS_SUGERIDOS = [
  '🌱 Día de la Tierra · economía circular',
  '🎁 Gifting corporativo de fin de año',
  '🏭 Detrás de PEYU · proceso reciclaje',
  '📊 Impacto medible · kg rescatados',
  '✨ Nuevos lanzamientos del mes',
  '🇨🇱 Hecho en Chile · diseño local',
];

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day; // próximo lunes
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyPlannerPanel({ onGenerated }) {
  const [tema, setTema] = useState('');
  const [fechaInicio, setFechaInicio] = useState(getNextMonday());
  const [redSocial, setRedSocial] = useState('Instagram');
  const [horaDefault, setHoraDefault] = useState('19:00');
  const [usarBacklinks, setUsarBacklinks] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [calendarios, setCalendarios] = useState([]);
  const [loadingCals, setLoadingCals] = useState(true);

  const [backlinksRecientes, setBacklinksRecientes] = useState([]);

  useEffect(() => {
    base44.entities.ContentCalendar.list('-created_date', 10).then(c => {
      setCalendarios(c);
      setLoadingCals(false);
    });
    base44.entities.Backlink.filter({ autoridad: 'Alta (Emol, T13, BioBio, gov)' }, '-fecha_publicacion', 5).then(setBacklinksRecientes).catch(() => {});
  }, []);

  const generar = async () => {
    if (!tema) return setError('Define el tema semanal');
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('generateWeeklyContentPlan', {
        tema_semanal: tema,
        fecha_inicio: fechaInicio,
        red_social: redSocial,
        hora_default: horaDefault,
        usar_backlinks: usarBacklinks,
        incluir_imagen: true,
      });
      setResult(res.data);
      onGenerated?.();
      // Reload calendarios
      base44.entities.ContentCalendar.list('-created_date', 10).then(setCalendarios);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-4 h-full min-h-0">
      {/* Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 overflow-y-auto peyu-scrollbar-light">
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Generar plan semanal
          </h3>
          <p className="text-xs text-white/50 mt-0.5">7 posts diarios coherentes desde un único tema</p>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Tema semanal</label>
          <Input
            value={tema}
            onChange={e => setTema(e.target.value)}
            placeholder="Ej: Día de la Tierra · economía circular"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {TEMAS_SUGERIDOS.map(t => (
              <button
                key={t}
                onClick={() => setTema(t)}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1 block">Fecha inicio (Lun)</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1 block">Hora default</label>
            <Input
              type="time"
              value={horaDefault}
              onChange={e => setHoraDefault(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Red social</label>
          <div className="grid grid-cols-2 gap-1.5">
            {['Instagram', 'LinkedIn', 'Facebook', 'TikTok'].map(r => (
              <button
                key={r}
                onClick={() => setRedSocial(r)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  redSocial === r ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usarBacklinks}
            onChange={e => setUsarBacklinks(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <p className="text-xs font-bold text-white">Inyectar backlinks como insights</p>
            <p className="text-[10px] text-white/50">La IA usará menciones de prensa recientes como social proof</p>
          </div>
        </label>

        {backlinksRecientes.length > 0 && usarBacklinks && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-2.5">
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3" /> {backlinksRecientes.length} menciones de PR alta autoridad
            </p>
            <ul className="text-[10px] text-amber-200/80 space-y-0.5">
              {backlinksRecientes.slice(0, 3).map(b => (
                <li key={b.id} className="truncate">• {b.dominio}: {b.titulo}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2.5 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {result?.ok && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 text-xs text-emerald-200">
            <p className="font-bold flex items-center gap-1.5 mb-1"><Check className="w-3.5 h-3.5" /> Plan creado</p>
            <p>{result.posts.length} posts del {result.fecha_inicio} al {result.fecha_fin}</p>
            {result.estrategia && <p className="text-emerald-300/70 mt-1 italic">"{result.estrategia.slice(0, 140)}…"</p>}
          </div>
        )}

        <Button
          onClick={generar}
          disabled={generating || !tema}
          className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Diseñando 7 posts diarios…' : 'Generar plan de 7 días'}
        </Button>
      </div>

      {/* Resultado / Calendarios anteriores */}
      <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {result?.posts ? 'Plan recién generado' : 'Calendarios recientes'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-3 min-h-0">
          {result?.posts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {result.posts.map((p, i) => (
                <div key={p.post_id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-black/30">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="text-[10px] font-bold text-cyan-300">{DIAS[i] || p.dia} · {p.fecha}</p>
                    <p className="text-xs font-semibold text-white line-clamp-2">{p.titulo}</p>
                    {p.producto_sku && <p className="text-[9px] font-mono text-white/40">{p.producto_sku}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : loadingCals ? (
            <div className="text-center py-8 text-white/50 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando…
            </div>
          ) : calendarios.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aún no hay calendarios generados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendarios.map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{c.nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                      c.estado === 'Activo' ? 'bg-emerald-500/20 text-emerald-300' :
                      c.estado === 'Completado' ? 'bg-sky-500/20 text-sky-300' :
                      'bg-white/10 text-white/60'
                    }`}>{c.estado}</span>
                  </div>
                  <p className="text-[11px] text-white/60">{c.fecha_inicio} → {c.fecha_fin}</p>
                  <div className="flex items-center gap-3 text-[11px] text-white/50 mt-1">
                    <span>📝 {c.num_posts_planificados || 0} planificados</span>
                    <span>📤 {c.num_posts_publicados || 0} publicados</span>
                  </div>
                  {c.notas_estrategia && (
                    <p className="text-[10px] text-white/40 mt-1.5 italic line-clamp-2">"{c.notas_estrategia}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}