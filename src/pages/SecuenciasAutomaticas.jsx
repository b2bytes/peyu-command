import { useState } from 'react';
import {
  Workflow, Zap, Clock, Webhook, ArrowDown, ShoppingCart, Undo2, Heart,
  Briefcase, FileText, Truck, Boxes, Mail, ChevronRight,
} from 'lucide-react';
import { AUDIENCIAS, TRIGGERS, FLUJOS } from '@/lib/secuencias-automaticas';

// Iconos por flujo y por trigger (resueltos desde strings del data file).
const FLUJO_ICONS = { ShoppingCart, Undo2, Heart, Briefcase, FileText, Truck, Boxes, Mail };
const TRIGGER_ICONS = { Zap, Clock, Webhook };

// ════════════════════════════════════════════════════════════════════════
// SecuenciasAutomaticas — Diagrama de flujo centralizado de todas las
// secuencias automáticas (emails, notificaciones, CRONs, automatizaciones)
// para clientes B2C/B2B, equipo y sistema. Cada flujo es una columna de nodos
// encadenados disparador → función → destinatario. Solo lectura / visual.
// ════════════════════════════════════════════════════════════════════════
export default function SecuenciasAutomaticas() {
  const [filtroAudiencia, setFiltroAudiencia] = useState('todos');

  const flujosVisibles = FLUJOS
    .map((f) => ({
      ...f,
      pasos: filtroAudiencia === 'todos' ? f.pasos : f.pasos.filter((p) => p.a === filtroAudiencia),
    }))
    .filter((f) => f.pasos.length > 0);

  const totalPasos = FLUJOS.reduce((s, f) => s + f.pasos.length, 0);

  return (
    <div className="ld-canvas min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-6 pb-5 border-b border-ld-border">
        <div className="flex items-center gap-2 mb-1">
          <Workflow className="w-4 h-4 text-ld-action" />
          <p className="text-[11px] font-bold tracking-widest uppercase text-ld-action">Automatizaciones</p>
        </div>
        <h1 className="ld-display text-2xl sm:text-3xl text-ld-fg">Mapa de secuencias automáticas</h1>
        <p className="text-sm text-ld-fg-muted mt-1 max-w-2xl">
          Cómo se conectan todas las notificaciones, emails y procesos automáticos que activamos
          para clientes y el equipo. {FLUJOS.length} flujos · {totalPasos} pasos.
        </p>

        {/* Leyenda de tipos de disparador */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4">
          {Object.entries(TRIGGERS).map(([key, t]) => {
            const Icon = TRIGGER_ICONS[t.icon];
            return (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs text-ld-fg-muted">
                <Icon className="w-3.5 h-3.5 text-ld-fg-subtle" /> {t.label}
              </span>
            );
          })}
        </div>

        {/* Filtro por audiencia */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          <button
            onClick={() => setFiltroAudiencia('todos')}
            className={`px-3.5 h-9 rounded-full text-xs font-semibold transition-all ${
              filtroAudiencia === 'todos' ? 'ld-btn-primary text-white' : 'ld-btn-ghost text-ld-fg'
            }`}
          >
            Todos
          </button>
          {Object.entries(AUDIENCIAS).map(([key, a]) => {
            const activo = filtroAudiencia === key;
            return (
              <button
                key={key}
                onClick={() => setFiltroAudiencia(key)}
                className="px-3.5 h-9 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                style={{
                  background: activo ? a.color : a.bg,
                  color: activo ? 'white' : a.color,
                  border: `1px solid ${a.color}${activo ? '' : '33'}`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: activo ? 'white' : a.color }} />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diagrama: columnas con scroll horizontal */}
      <div className="px-4 sm:px-8 py-6 overflow-x-auto peyu-scrollbar">
        <div className="flex gap-4 sm:gap-5 min-w-min items-start pb-4">
          {flujosVisibles.map((flujo) => {
            const FlujoIcon = FLUJO_ICONS[flujo.icon] || Workflow;
            return (
              <div key={flujo.id} className="flex-shrink-0 w-[290px]">
                {/* Cabecera del flujo */}
                <div className="ld-glass rounded-2xl px-4 py-3.5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-ld-action-soft">
                      <FlujoIcon className="w-4.5 h-4.5 text-ld-action" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-jakarta font-bold text-sm text-ld-fg leading-tight">{flujo.titulo}</h2>
                      <p className="text-[11px] text-ld-fg-muted leading-tight mt-0.5">{flujo.descripcion}</p>
                    </div>
                  </div>
                </div>

                {/* Cadena de pasos */}
                <div className="space-y-0">
                  {flujo.pasos.map((paso, idx) => {
                    const aud = AUDIENCIAS[paso.a] || AUDIENCIAS.sistema;
                    const trig = TRIGGERS[paso.trigger];
                    const TrigIcon = TRIGGER_ICONS[trig?.icon] || Zap;
                    return (
                      <div key={idx}>
                        <PasoNodo paso={paso} aud={aud} TrigIcon={TrigIcon} trigLabel={trig?.label} />
                        {idx < flujo.pasos.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowDown className="w-4 h-4 text-ld-fg-subtle" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Nodo individual del diagrama: disparador → función → destinatario.
function PasoNodo({ paso, aud, TrigIcon, trigLabel }) {
  return (
    <div
      className="ld-card rounded-2xl p-3.5 relative overflow-hidden"
      style={{ borderLeft: `3px solid ${aud.color}` }}
    >
      {/* Disparador */}
      <div className="flex items-center gap-1.5 mb-2">
        <TrigIcon className="w-3.5 h-3.5 flex-shrink-0 text-ld-fg-subtle" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-ld-fg-subtle">{trigLabel}</span>
      </div>
      <p className="text-xs font-semibold text-ld-fg leading-snug mb-2">{paso.disparador}</p>

      {/* Qué envía → a quién */}
      <div className="flex items-start gap-1.5 mb-2.5">
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: aud.color }} />
        <p className="text-[12px] text-ld-fg-soft leading-snug">{paso.envia}</p>
      </div>

      {/* Footer: destinatario + función técnica */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ld-border">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: aud.bg, color: aud.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: aud.color }} />
          {aud.label}
        </span>
        <code className="text-[9px] text-ld-fg-subtle font-mono truncate max-w-[120px]" title={paso.funcion}>
          {paso.funcion}
        </code>
      </div>
    </div>
  );
}