// ============================================================================
// WeeklyPlannerPanel — Genera plan semanal de contenido con un tema central.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Sparkles, Loader2, Check, AlertCircle, Lightbulb } from 'lucide-react';

const TEMAS_SUGERIDOS = [
  '🌱 Sostenibilidad y economía circular',
  '🎁 Gifting corporativo de fin de año',
  '🇨🇱 Hecho en Chile, diseño consciente',
  '♻️ Cómo reciclamos plástico oceánico',
  '💼 Casos de éxito B2B',
  '🏆 Premios y reconocimientos PEYU',
];

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

  const REDES_DISPONIBLES = ['Instagram', 'LinkedIn', 'Facebook', 'TikTok'];

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
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-400/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-bold text-white text-lg">Planner semanal IA</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Define un tema central y la IA genera 7 días de contenido editorial coherente, con productos relacionados, copy y visuales únicos.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Tema central de la semana</label>
          <Input
            value={tema}
            onChange={e => setTema(e.target.value)}
            placeholder="Ej: Lanzamiento línea fibra de trigo"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {TEMAS_SUGERIDOS.map(t => (
              <button
                key={t}
                onClick={() => setTema(t.replace(/^[^\s]+ /, ''))}
                className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3" /> {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Fecha inicio (lunes)</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Redes destino</label>
            <div className="grid grid-cols-2 gap-1.5">
              {REDES_DISPONIBLES.map(r => (
                <button
                  key={r}
                  onClick={() => toggleRed(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    redes.includes(r) ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2.5 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {result && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 text-xs text-emerald-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Plan generado</p>
            <p>{result.posts_creados} posts creados para {redes.length} red(es)</p>
            {result.calendar_id && <p className="text-emerald-300/70">Calendario: {result.calendar_id}</p>}
            <p className="text-emerald-300/70 mt-1">Revisa la cola de aprobación →</p>
          </div>
        )}

        <Button
          onClick={generar}
          disabled={generating || !tema}
          className="w-full gap-2 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generando 7 días de contenido…' : 'Generar plan semanal'}
        </Button>
      </div>
    </div>
  );
}