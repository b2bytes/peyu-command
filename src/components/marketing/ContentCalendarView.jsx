import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus } from 'lucide-react';
import PostPreviewModal from './PostPreviewModal';

/**
 * Vista calendario mensual de posts programados.
 * Muestra un grid 7×N con los posts ubicados en su fecha_publicacion.
 * Click en post → abre PostPreviewModal (ya existente).
 * Click en día vacío → sugiere crear contenido para esa fecha.
 */

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const RED_COLORS = {
  'Instagram':  'bg-gradient-to-r from-purple-500 to-pink-500',
  'Facebook':   'bg-blue-600',
  'LinkedIn':   'bg-sky-700',
  'TikTok':     'bg-gray-900',
  'Twitter/X':  'bg-gray-800',
  'Pinterest':  'bg-red-600',
  'Threads':    'bg-gray-700',
  'YouTube':    'bg-red-700',
};

function buildMonthGrid(year, month) {
  // month 0-indexed
  const first = new Date(year, month, 1);
  // lunes = 0 .. domingo = 6
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function iso(d) {
  return d ? d.toISOString().split('T')[0] : null;
}

export default function ContentCalendarView({ posts, onUpdated, onAskDirector }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const cells = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      if (!p.fecha_publicacion) return;
      const key = p.fecha_publicacion.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  const prev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const next = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  const todayIso = iso(today);

  const handleEmptyDay = (date) => {
    const fecha = iso(date);
    onAskDirector?.(`Genera un post para el ${fecha}. Elige el pilar que mejor balance el calendario y propón red social + hora óptima.`);
  };

  return (
    <div className="space-y-3">
      {/* Header mes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-poppins font-bold text-sm text-gray-900 min-w-[140px] text-center">
            {MESES[cursor.getMonth()]} {cursor.getFullYear()}
          </h3>
          <button onClick={next} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={goToday} className="text-[11px] font-bold bg-gray-100 hover:bg-gray-200 px-3 h-8 rounded-lg">
          Hoy
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {cells.map((date, i) => {
            const key = iso(date);
            const dayPosts = date ? (postsByDay[key] || []) : [];
            const isToday = key === todayIso;
            const isPast = date && date < new Date(today.toDateString());

            return (
              <div
                key={i}
                className={`min-h-[90px] border-r border-b border-gray-100 p-1.5 ${!date ? 'bg-gray-50/50' : 'bg-white'} ${isToday ? 'bg-purple-50/50 ring-1 ring-purple-300 ring-inset' : ''} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
              >
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold ${isToday ? 'text-purple-700' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                        {date.getDate()}
                      </span>
                      {dayPosts.length === 0 && !isPast && (
                        <button
                          onClick={() => handleEmptyDay(date)}
                          className="opacity-0 hover:opacity-100 group-hover:opacity-60 w-4 h-4 rounded-full bg-gray-100 hover:bg-purple-100 text-gray-400 hover:text-purple-600 flex items-center justify-center transition-all"
                          title="Pedir al Director que genere contenido"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className={`w-full text-left text-[9px] font-semibold text-white px-1.5 py-0.5 rounded truncate ${RED_COLORS[p.red_social] || 'bg-gray-500'} hover:opacity-80 transition`}
                          title={`${p.red_social} · ${p.titulo}`}
                        >
                          {p.titulo}
                        </button>
                      ))}
                      {dayPosts.length > 3 && (
                        <p className="text-[9px] text-gray-500 font-semibold pl-1.5">+{dayPosts.length - 3} más</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-500">
        <CalIcon className="w-3 h-3" />
        {Object.entries(RED_COLORS).slice(0, 5).map(([red, cls]) => (
          <span key={red} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-sm ${cls}`} /> {red}
          </span>
        ))}
      </div>

      <PostPreviewModal
        post={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onUpdated={() => { setSelected(null); onUpdated?.(); }}
      />
    </div>
  );
}