import { useState, useMemo } from 'react';
import { LAUNCH_ROADMAP, SNAPSHOT_HOY, PHASE_META, getRoadmapStats, getPhaseProgress } from '@/lib/launch-roadmap';
import {
  AlertTriangle, CheckCircle2, Clock, Flame, Lock, Target, Rocket,
  ChevronDown, ChevronRight, Calendar, Wrench
} from 'lucide-react';

const IMPACT_BADGE = {
  critical: { label: 'Urgente',     bg: 'bg-red-50',     fg: 'text-red-700',     border: 'border-red-200' },
  high:     { label: 'Importante',  bg: 'bg-amber-50',   fg: 'text-amber-800',   border: 'border-amber-200' },
  medium:   { label: 'Medio',       bg: 'bg-sky-50',     fg: 'text-sky-800',     border: 'border-sky-200' },
  low:      { label: 'Liviano',     bg: 'bg-slate-50',   fg: 'text-slate-700',   border: 'border-slate-200' },
};

const OWNER_ICON = {
  constructor: '🤖',
  humano: '👤',
  'humano + constructor': '🤝',
  'constructor + humano': '🤝',
};

function PhaseCard({ phase, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = PHASE_META[phase.status] || PHASE_META.pending;
  const progress = getPhaseProgress(phase);
  const totalHours = phase.items.reduce((s, i) => s + (i.effort_hours || 0), 0);

  return (
    <div className="ld-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-start gap-4 hover:bg-ld-bg-soft transition-colors text-left"
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
          style={{ background: 'var(--ld-grad-action)' }}
        >
          {phase.id.replace('fase-', '')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-poppins font-bold text-lg text-ld-fg">{phase.nombre}</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-ld-fg-muted flex-wrap">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {phase.semana}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{totalHours}h</span>
            <span className="inline-flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {phase.items.length} tareas</span>
          </div>
          <p className="text-sm text-ld-fg-soft mt-2 leading-relaxed">{phase.objetivo}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ld-border)' }}>
              <div
                className="h-full transition-all"
                style={{ width: `${progress}%`, background: 'var(--ld-grad-action)' }}
              />
            </div>
            <span className="text-xs font-bold text-ld-fg-soft tabular-nums">{progress}%</span>
          </div>
        </div>
        <div className="flex-shrink-0 self-center">
          {open ? <ChevronDown className="w-5 h-5 text-ld-fg-muted" /> : <ChevronRight className="w-5 h-5 text-ld-fg-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-ld-border bg-ld-bg-soft">
          {/* Cómo sabemos que esta fase terminó */}
          <div
            className="px-5 py-3 border-b flex items-start gap-2"
            style={{ background: 'var(--ld-action-soft)', borderColor: 'var(--ld-border)' }}
          >
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
            <div className="text-xs">
              <p className="font-bold text-ld-fg">¿Cómo sabemos que terminó?</p>
              <p className="text-ld-fg-soft mt-0.5">{phase.gate_salida}</p>
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-ld-border">
            {phase.items.map((item, i) => {
              const impact = IMPACT_BADGE[item.impact] || IMPACT_BADGE.medium;
              return (
                <div key={i} className="p-4 flex items-start gap-3 hover:bg-ld-bg-elevated transition-colors">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${impact.bg} ${impact.border} border flex items-center justify-center text-xs font-bold ${impact.fg}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ld-fg leading-snug">{item.title}</p>
                    <p className="text-xs text-ld-fg-muted mt-1 leading-relaxed">{item.detail}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${impact.bg} ${impact.fg}`}>
                        {impact.label}
                      </span>
                      <span className="text-[10px] text-ld-fg-muted inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{item.effort_hours}h
                      </span>
                      <span className="text-[10px] text-ld-fg-muted inline-flex items-center gap-1">
                        {OWNER_ICON[item.owner] || '👤'} {item.owner}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaunchRoadmap() {
  const stats = useMemo(() => getRoadmapStats(), []);

  return (
    <div className="ld-canvas min-h-full">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* HERO — usa la paleta del sistema, sin negros duros */}
        <div className="relative overflow-hidden rounded-3xl ld-glass-strong p-6 sm:p-8">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-action-soft)', opacity: 0.6 }}
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-highlight-soft)', opacity: 0.4 }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--ld-action)' }}>
              <Rocket className="w-3.5 h-3.5" />
              Plan de lanzamiento · actualizado 15-may
            </div>
            <h1 className="ld-display text-3xl sm:text-5xl mt-3 leading-[1.05] text-ld-fg">
              De catálogo a medio terminar a{' '}
              <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
                máquina vendiendo sola
              </span>
            </h1>
            <p className="text-ld-fg-soft mt-3 max-w-2xl leading-relaxed text-sm sm:text-base">
              Plan honesto, paso a paso. Cada fase termina cuando algo concreto funciona.
              <strong className="text-ld-fg"> Estabilidad primero, escala después.</strong>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="ld-glass rounded-2xl p-3">
                <p className="text-xs text-ld-fg-muted">Fases</p>
                <p className="font-bold text-2xl mt-0.5 text-ld-fg">{stats.totalPhases}</p>
              </div>
              <div className="ld-glass rounded-2xl p-3">
                <p className="text-xs text-ld-fg-muted">Tareas</p>
                <p className="font-bold text-2xl mt-0.5 text-ld-fg">{stats.total}</p>
              </div>
              <div className="ld-glass rounded-2xl p-3">
                <p className="text-xs text-ld-fg-muted">Trabajo total</p>
                <p className="font-bold text-2xl mt-0.5 text-ld-fg">~{stats.totalHours}h</p>
              </div>
              <div className="ld-glass rounded-2xl p-3">
                <p className="text-xs text-ld-fg-muted">Arranca</p>
                <p className="font-bold text-2xl mt-0.5" style={{ color: 'var(--ld-action)' }}>Sáb 16</p>
              </div>
            </div>
          </div>
        </div>

        {/* SNAPSHOT — lenguaje cliente, sin jerga */}
        <div className="ld-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--ld-highlight)' }} />
            <h2 className="font-poppins font-bold text-lg text-ld-fg">Cómo está PEYU hoy, sin maquillaje</h2>
          </div>
          <p className="text-sm text-ld-fg-muted mb-4">
            Esto es lo que detectamos esta semana. 🟥 hay que arreglarlo ya, 🟧 esta semana, 🟨 cuando se pueda, 🟩 ya funcionando bien.
          </p>
          <div className="space-y-2">
            {SNAPSHOT_HOY.hallazgos_criticos.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-ld-bg-soft border border-ld-border">
                <span className="text-lg flex-shrink-0">{h.tag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ld-fg">{h.titulo}</p>
                  <p className="text-xs text-ld-fg-muted mt-0.5">{h.simple}</p>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-4 p-3 rounded-xl flex items-start gap-2"
            style={{ background: 'var(--ld-action-soft)', borderColor: 'var(--ld-border)' }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
            <p className="text-xs text-ld-fg leading-relaxed">
              <strong>La buena noticia:</strong> la base es sólida. La mayoría del trabajo está hecho. Lo que falta es{' '}
              <strong>limpiar, ajustar y darle play</strong>. No es construir desde cero, es ordenar y lanzar.
            </p>
          </div>
        </div>

        {/* FASES */}
        <div className="space-y-3">
          {LAUNCH_ROADMAP.map((phase, idx) => (
            <PhaseCard key={phase.id} phase={phase} defaultOpen={idx === 0} />
          ))}
        </div>

        {/* CTA Final */}
        <div className="ld-card p-6 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-highlight-soft)', opacity: 0.7 }}
          />
          <div className="relative flex items-start gap-4">
            <Flame className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--ld-highlight)' }} />
            <div className="flex-1">
              <h3 className="font-poppins font-bold text-lg text-ld-fg">Empezamos mañana sábado 16</h3>
              <p className="text-sm text-ld-fg-soft mt-1 leading-relaxed">
                La Fase 0 son aproximadamente <strong className="text-ld-fg">4 horas de trabajo</strong>. Si arrancamos
                temprano, el domingo en la tarde ya tienes todo en verde para empujar Fase 1 con tranquilidad.
              </p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <a
                  href="/admin/plan"
                  className="ld-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                >
                  <Wrench className="w-4 h-4" /> Crear tareas en Plan de Acción
                </a>
                <a
                  href="/admin/estado-actual"
                  className="ld-btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-ld-fg"
                >
                  Ver roadmap general
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}