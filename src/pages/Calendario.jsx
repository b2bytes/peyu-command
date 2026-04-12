import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle2,
  AlertTriangle, Clock, FileText, Package, Users, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Tipos de evento y su configuración visual ───────────────────────────────
const TIPO_CONFIG = {
  tarea:       { label: "Tarea",        color: "#3b82f6", bg: "#eff6ff",  icon: CheckCircle2 },
  cotizacion:  { label: "Cotización",   color: "#D96B4D", bg: "#fdf3f0",  icon: FileText },
  lead:        { label: "Lead",         color: "#0F8B6C", bg: "#f0faf7",  icon: Users },
  produccion:  { label: "Producción",   color: "#9333ea", bg: "#faf5ff",  icon: Package },
};

const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + (str.includes('T') ? '' : 'T12:00:00'));
  return isNaN(d) ? null : d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

// Chip compacto para el calendario
function EventChip({ evento }) {
  const cfg = TIPO_CONFIG[evento.tipo];
  const Icon = cfg.icon;
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate cursor-pointer hover:opacity-80 transition-opacity"
      style={{ background: cfg.bg, color: cfg.color }}
      title={evento.titulo}
    >
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      <span className="truncate">{evento.titulo}</span>
    </div>
  );
}

// Panel lateral — detalle de eventos del día
function DayPanel({ date, eventos, onClose }) {
  if (!date) return null;
  const del_dia = eventos.filter(e => e.fecha && isSameDay(e.fecha, date));
  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm h-fit sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-poppins font-semibold">{date.getDate()} de {MESES[date.getMonth()]}</p>
          <p className="text-xs text-muted-foreground">{DIAS[date.getDay()]}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>
      {del_dia.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin eventos este día</p>
      ) : (
        <div className="space-y-2">
          {del_dia.map((e, i) => {
            const cfg = TIPO_CONFIG[e.tipo];
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-border">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</p>
                  <p className="text-sm font-medium truncate">{e.titulo}</p>
                  {e.sub && <p className="text-xs text-muted-foreground truncate">{e.sub}</p>}
                  {e.estado && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted mt-1 inline-block">{e.estado}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Calendario() {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth());
  const [anio, setAnio] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tarea: true, cotizacion: true, lead: true, produccion: true });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [tareas, cotizaciones, leads, ordenes] = await Promise.all([
        base44.entities.Tarea.list('-created_date', 500),
        base44.entities.Cotizacion.list('-created_date', 300),
        base44.entities.Lead.list('-created_date', 300),
        base44.entities.OrdenProduccion.list('-created_date', 300),
      ]);

      const evs = [];

      tareas.forEach(t => {
        const f = parseDate(t.fecha_limite);
        if (f) evs.push({ tipo: 'tarea', fecha: f, titulo: t.titulo, sub: `${t.area} · ${t.responsable || ''}`, estado: t.estado, id: t.id });
        const fc = parseDate(t.fecha_completada);
        if (fc && t.estado === 'Completada') evs.push({ tipo: 'tarea', fecha: fc, titulo: `✓ ${t.titulo}`, sub: t.area, estado: t.estado, id: t.id + '_c' });
      });

      cotizaciones.forEach(c => {
        const f = parseDate(c.fecha_vencimiento);
        if (f) evs.push({ tipo: 'cotizacion', fecha: f, titulo: `Vence: ${c.empresa}`, sub: `${c.numero || ''} · ${c.total ? '$' + Number(c.total).toLocaleString('es-CL') : ''}`, estado: c.estado, id: c.id });
        const fe = parseDate(c.fecha_envio);
        if (fe) evs.push({ tipo: 'cotizacion', fecha: fe, titulo: `Envío: ${c.empresa}`, sub: c.sku || '', estado: c.estado, id: c.id + '_e' });
      });

      leads.forEach(l => {
        const f = parseDate(l.next_action_date);
        if (f) evs.push({ tipo: 'lead', fecha: f, titulo: l.empresa, sub: l.next_action || 'Follow-up', estado: l.estado, id: l.id });
        const fe = parseDate(l.fecha_evento);
        if (fe) evs.push({ tipo: 'lead', fecha: fe, titulo: `Evento: ${l.empresa}`, sub: l.producto_interes || '', estado: l.estado, id: l.id + '_ev' });
      });

      ordenes.forEach(o => {
        const f = parseDate(o.fecha_entrega_prometida);
        if (f) evs.push({ tipo: 'produccion', fecha: f, titulo: `Entrega: ${o.empresa}`, sub: `${o.sku} · ${o.cantidad}u · ${o.estado}`, estado: o.estado, id: o.id });
        const fi = parseDate(o.fecha_inicio);
        if (fi) evs.push({ tipo: 'produccion', fecha: fi, titulo: `Inicio OP: ${o.empresa}`, sub: `${o.sku}`, estado: o.estado, id: o.id + '_i' });
      });

      setEventos(evs);
      setLoading(false);
    };
    load();
  }, []);

  const prevMes = () => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); };

  // Calcular días del mes
  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(anio, mes, d));

  const eventosFiltrados = eventos.filter(e => filtros[e.tipo]);

  // Eventos del mes en curso para el panel resumen
  const eventosMes = eventosFiltrados.filter(e => e.fecha && e.fecha.getMonth() === mes && e.fecha.getFullYear() === anio);
  const proximosSemana = eventosFiltrados.filter(e => {
    if (!e.fecha) return false;
    const diff = (e.fecha - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).sort((a, b) => a.fecha - b.fecha);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold">Agenda Comercial</h1>
          <p className="text-muted-foreground text-sm mt-1">Tareas · Cotizaciones · Follow-ups · Producción</p>
        </div>
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>}
      </div>

      {/* Filtros de tipo */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={tipo}
              onClick={() => setFiltros(f => ({ ...f, [tipo]: !f[tipo] }))}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium"
              style={filtros[tipo]
                ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + '60' }
                : { background: 'transparent', color: '#9ca3af', borderColor: '#e5e7eb' }}
            >
              <Icon className="w-3 h-3" />{cfg.label}
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground flex items-center">{eventosMes.length} eventos este mes</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Calendario */}
        <div className="xl:col-span-3 space-y-4">
          {/* Nav mes */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={prevMes}><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="font-poppins font-semibold text-lg">{MESES[mes]} {anio}</h2>
              <Button variant="ghost" size="icon" onClick={nextMes}><ChevronRight className="w-4 h-4" /></Button>
            </div>

            {/* Cabecera días */}
            <div className="grid grid-cols-7 border-b border-border">
              {DIAS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7">
              {celdas.map((date, i) => {
                if (!date) return <div key={`e-${i}`} className="border-r border-b border-border min-h-[90px] bg-muted/10" />;
                const isToday = isSameDay(date, today);
                const isSelected = selectedDay && isSameDay(date, selectedDay);
                const dayEvs = eventosFiltrados.filter(e => e.fecha && isSameDay(e.fecha, date));
                const hasAlert = dayEvs.some(e => e.tipo === 'cotizacion' || (e.tipo === 'tarea' && e.estado !== 'Completada'));
                return (
                  <div
                    key={date.getDate()}
                    className={`border-r border-b border-border min-h-[90px] p-1.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-50' : 'hover:bg-muted/20'
                    }`}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'text-white' : 'text-foreground'
                      }`} style={isToday ? { background: '#0F8B6C' } : {}}>
                        {date.getDate()}
                      </span>
                      {hasAlert && dayEvs.length > 0 && (
                        <span className="text-[10px] font-bold px-1 rounded-full" style={{ background: '#fdf3f0', color: '#D96B4D' }}>
                          {dayEvs.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvs.slice(0, 3).map((e, ei) => <EventChip key={ei} evento={e} />)}
                      {dayEvs.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1">+{dayEvs.length - 3} más</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {selectedDay ? (
            <DayPanel date={selectedDay} eventos={eventosFiltrados} onClose={() => setSelectedDay(null)} />
          ) : (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: '#0F8B6C' }} />
                <h3 className="font-poppins font-semibold text-sm">Próximos 7 días</h3>
              </div>
              {proximosSemana.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin eventos próximos</p>
              ) : (
                <div className="space-y-2">
                  {proximosSemana.slice(0, 12).map((e, i) => {
                    const cfg = TIPO_CONFIG[e.tipo];
                    const Icon = cfg.icon;
                    const diff = Math.round((e.fecha - today) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={i} className="flex gap-2.5 p-2.5 rounded-xl border border-border hover:bg-muted/10 cursor-pointer">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{e.titulo}</p>
                          {e.sub && <p className="text-[10px] text-muted-foreground truncate">{e.sub}</p>}
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: diff === 0 ? '#D96B4D' : diff <= 2 ? '#f59e0b' : cfg.color }}>
                            {diff === 0 ? '🔴 Hoy' : diff === 1 ? '🟡 Mañana' : `En ${diff} días`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Resumen mes */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-poppins font-semibold text-sm mb-3">Resumen {MESES[mes]}</h3>
            <div className="space-y-2">
              {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => {
                const count = eventosMes.filter(e => e.tipo === tipo).length;
                return (
                  <div key={tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                      <span className="text-xs text-muted-foreground">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}