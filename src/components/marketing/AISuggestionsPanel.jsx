import { useMemo } from 'react';
import { Lightbulb, AlertTriangle, Calendar, TrendingUp, Clock, Target, ArrowRight } from 'lucide-react';

/**
 * Panel de sugerencias proactivas del Director IA.
 * Analiza el estado actual de posts/calendarios/campañas y propone
 * acciones concretas con CTAs listos para enviar al chat del Director.
 *
 * NO hace fetch — recibe la data ya cargada del MarketingHub.
 */

// Fechas clave Chile próximas 45 días
const FECHAS_CLAVE = [
  { fecha: '2026-05-05', label: 'Día Mundial Medio Ambiente (prep)', pilar: 'Sostenibilidad/ESG' },
  { fecha: '2026-05-17', label: 'Día Mundial del Reciclaje', pilar: 'Sostenibilidad/ESG' },
  { fecha: '2026-05-30', label: 'Día del Patrimonio Chile', pilar: 'Branding' },
  { fecha: '2026-06-05', label: 'Día Medio Ambiente', pilar: 'Sostenibilidad/ESG' },
  { fecha: '2026-09-10', label: 'Fiestas Patrias (anticipar regalos corp.)', pilar: 'Producto' },
];

const PILARES_IDEAL = {
  'Producto': 0.30,
  'Sostenibilidad/ESG': 0.25,
  'Educativo': 0.20,
  'Detrás de escena': 0.10,
  'Testimonios': 0.10,
  'Promoción': 0.05,
};

function daysBetween(a, b) {
  return Math.round((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));
}

function buildSuggestions({ posts, campanas }) {
  const today = new Date();
  const next30 = new Date(today.getTime() + 30 * 86400000);
  const suggestions = [];

  // 1. Posts en revisión hace +7 días
  const stuck = posts.filter(p => {
    if (p.estado !== 'En revisión') return false;
    const d = daysBetween(today, p.updated_date || p.created_date);
    return d >= 7;
  });
  if (stuck.length > 0) {
    suggestions.push({
      id: 'stuck',
      icon: AlertTriangle,
      tone: 'amber',
      title: `${stuck.length} post${stuck.length > 1 ? 's' : ''} atascado${stuck.length > 1 ? 's' : ''} en revisión`,
      desc: `Llevan +7 días en "En revisión". Revísalos o aprueba para no perder ritmo.`,
      prompt: `Revisa los ${stuck.length} posts en estado "En revisión" que llevan más de 7 días sin avanzar. Dime cuáles aprobar, cuáles descartar y cuáles ajustar.`,
    });
  }

  // 2. Huecos de calendario en los próximos 30 días
  const publishedNext = posts.filter(p => {
    if (!p.fecha_publicacion) return false;
    const d = new Date(p.fecha_publicacion);
    return d >= today && d <= next30 && ['Programado', 'Aprobado'].includes(p.estado);
  });
  const postsPerWeek = publishedNext.length / 4;
  if (postsPerWeek < 3) {
    suggestions.push({
      id: 'gap',
      icon: Calendar,
      tone: 'purple',
      title: `Calendario con poca actividad (${publishedNext.length} posts / 30 días)`,
      desc: `Lo ideal son 12-20 posts/mes. Te faltan ${Math.max(0, 12 - publishedNext.length)} para llegar al mínimo recomendado.`,
      prompt: `Arma un calendario editorial completo para los próximos 30 días con 4 posts por semana rotando pilares PEYU. Genera los borradores automáticamente.`,
    });
  }

  // 3. Pilares sub-representados (últimos 60 días)
  const recent = posts.filter(p => {
    const d = new Date(p.fecha_publicacion || p.created_date);
    return daysBetween(today, d) <= 60;
  });
  if (recent.length >= 5) {
    const counts = {};
    recent.forEach(p => { if (p.pillar_contenido) counts[p.pillar_contenido] = (counts[p.pillar_contenido] || 0) + 1; });
    const total = recent.length;
    Object.entries(PILARES_IDEAL).forEach(([pilar, ideal]) => {
      const actual = (counts[pilar] || 0) / total;
      if (actual < ideal * 0.5) {
        suggestions.push({
          id: `pilar-${pilar}`,
          icon: Target,
          tone: 'blue',
          title: `Pilar "${pilar}" bajo la meta`,
          desc: `Tienes ${Math.round(actual * 100)}% — deberías estar cerca de ${Math.round(ideal * 100)}%. Genera 2-3 posts para balancear.`,
          prompt: `Genera 3 posts del pilar "${pilar}" para Instagram, LinkedIn y TikTok, guárdalos en Borradores.`,
        });
      }
    });
  }

  // 4. Fechas clave próximas sin contenido asociado
  FECHAS_CLAVE.forEach(fk => {
    const fkDate = new Date(fk.fecha);
    const days = daysBetween(fkDate, today);
    if (days > 0 && days <= 30) {
      const hasContent = posts.some(p => {
        if (!p.fecha_publicacion) return false;
        const pd = daysBetween(fkDate, new Date(p.fecha_publicacion));
        return Math.abs(pd) <= 3;
      });
      if (!hasContent) {
        suggestions.push({
          id: `fk-${fk.fecha}`,
          icon: Clock,
          tone: 'pink',
          title: `${fk.label} en ${days} días`,
          desc: `No hay contenido programado cerca de esta fecha clave. Crea una mini-campaña.`,
          prompt: `Crea 3 posts para la fecha "${fk.label}" (${fk.fecha}) del pilar ${fk.pilar}, distribuidos entre IG, LinkedIn y TikTok.`,
        });
      }
    }
  });

  // 5. Campañas activas sin gasto registrado
  const camposSinGasto = campanas.filter(c => c.estado === 'Activa' && !c.gasto_real_clp);
  if (camposSinGasto.length > 0) {
    suggestions.push({
      id: 'camp-sin-gasto',
      icon: TrendingUp,
      tone: 'teal',
      title: `${camposSinGasto.length} campaña${camposSinGasto.length > 1 ? 's' : ''} activa${camposSinGasto.length > 1 ? 's' : ''} sin métricas`,
      desc: `Actualiza gasto real, clics y conversiones para calcular ROAS real.`,
      prompt: `Ayúdame a analizar el rendimiento de las campañas activas. ¿Qué métricas pido al agente de Ads?`,
    });
  }

  // 6. Si todo está bien, sugerir crecimiento
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'grow',
      icon: Lightbulb,
      tone: 'emerald',
      title: '¡Calendario saludable! Hora de escalar',
      desc: 'Tu mix de pilares y ritmo es bueno. ¿Probamos A/B testing de copies o una campaña de retargeting?',
      prompt: 'Propón 3 experimentos de marketing para escalar ventas B2B este mes (A/B tests, retargeting, influencers). Detalla presupuesto y KPI esperado.',
    });
  }

  return suggestions.slice(0, 5);
}

const TONE_CLASSES = {
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'bg-amber-100 text-amber-600',     title: 'text-amber-900' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  icon: 'bg-purple-100 text-purple-600',   title: 'text-purple-900' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'bg-blue-100 text-blue-600',       title: 'text-blue-900' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    icon: 'bg-pink-100 text-pink-600',       title: 'text-pink-900' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    icon: 'bg-teal-100 text-teal-600',       title: 'text-teal-900' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', title: 'text-emerald-900' },
};

export default function AISuggestionsPanel({ posts, campanas, onAskDirector }) {
  const suggestions = useMemo(() => buildSuggestions({ posts, campanas }), [posts, campanas]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-bold text-gray-900 text-sm">Sugerencias del Director IA</h3>
            <p className="text-[11px] text-gray-500">Analiza en tiempo real tu estado de marketing</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-white text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">
          {suggestions.length} acción{suggestions.length > 1 ? 'es' : ''}
        </span>
      </div>

      <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {suggestions.map(s => {
          const t = TONE_CLASSES[s.tone] || TONE_CLASSES.blue;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onAskDirector?.(s.prompt)}
              className={`group text-left ${t.bg} ${t.border} border rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${t.icon} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs ${t.title} leading-tight`}>{s.title}</p>
                  <p className="text-[11px] text-gray-600 mt-1 leading-snug line-clamp-2">{s.desc}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-gray-700 opacity-60 group-hover:opacity-100 transition-opacity">
                    Pedir al Director IA <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}