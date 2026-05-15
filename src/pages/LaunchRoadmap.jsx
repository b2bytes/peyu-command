import { useState, useMemo } from 'react';
import { LAUNCH_ROADMAP, SNAPSHOT_HOY, PHASE_META, getRoadmapStats, getPhaseProgress } from '@/lib/launch-roadmap';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, CheckCircle2, Clock, Flame, Lock, Target, Rocket,
  ChevronDown, ChevronRight, Calendar, User, Wrench
} from 'lucide-react';

const IMPACT_BADGE = {
  critical: { label: 'CRÍTICO', bg: 'bg-red-50',     fg: 'text-red-700',     border: 'border-red-200' },
  high:     { label: 'ALTO',    bg: 'bg-amber-50',   fg: 'text-amber-700',   border: 'border-amber-200' },
  medium:   { label: 'MEDIO',   bg: 'bg-sky-50',     fg: 'text-sky-700',     border: 'border-sky-200' },
  low:      { label: 'BAJO',    bg: 'bg-slate-50',   fg: 'text-slate-600',   border: 'border-slate-200' },
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
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
          {phase.id.replace('fase-', '')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-poppins font-bold text-lg text-slate-900">{phase.nombre}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${meta.color}-100 text-${meta.color}-700`}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 flex-wrap">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {phase.semana}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{totalHours}h trabajo</span>
            <span className="inline-flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {phase.items.length} items</span>
          </div>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">{phase.objetivo}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 tabular-nums">{progress}%</span>
          </div>
        </div>
        <div className="flex-shrink-0 self-center">
          {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {/* Gate de salida */}
          <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100 flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">Gate de salida</p>
              <p className="text-emerald-800 mt-0.5">{phase.gate_salida}</p>
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {phase.items.map((item, i) => {
              const impact = IMPACT_BADGE[item.impact] || IMPACT_BADGE.medium;
              return (
                <div key={i} className="p-4 flex items-start gap-3 hover:bg-white transition-colors">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${impact.bg} ${impact.border} border flex items-center justify-center text-xs font-bold ${impact.fg}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 leading-snug">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${impact.bg} ${impact.fg}`}>
                        {impact.label}
                      </span>
                      <span className="text-[10px] text-slate-500 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{item.effort_hours}h
                      </span>
                      <span className="text-[10px] text-slate-500 inline-flex items-center gap-1">
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
    </Card>
  );
}

export default function LaunchRoadmap() {
  const stats = useMemo(() => getRoadmapStats(), []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white p-6 sm:p-8">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-teal-300">
            <Rocket className="w-3.5 h-3.5" />
            Roadmap de lanzamiento · v15-may-2026
          </div>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl mt-3 leading-tight">
            De catálogo desordenado<br />a máquina vendiendo sola
          </h1>
          <p className="text-white/75 mt-3 max-w-2xl leading-relaxed text-sm sm:text-base">
            Construido tras auditar el estado real del sitio. Cada fase tiene un{' '}
            <strong className="text-white">gate de salida</strong> — no se pasa hasta que esté firme.
            Estabilidad primero, escala después.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
              <p className="text-xs text-white/70">Fases</p>
              <p className="font-bold text-2xl mt-0.5">{stats.totalPhases}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
              <p className="text-xs text-white/70">Items</p>
              <p className="font-bold text-2xl mt-0.5">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
              <p className="text-xs text-white/70">Horas trabajo</p>
              <p className="font-bold text-2xl mt-0.5">~{stats.totalHours}h</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
              <p className="text-xs text-white/70">Arranca</p>
              <p className="font-bold text-2xl mt-0.5">Sáb 16</p>
            </div>
          </div>
        </div>
      </div>

      {/* SNAPSHOT HOY */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-poppins font-bold text-lg text-slate-900">Snapshot honesto del proyecto · hoy</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Lo que encontré al auditar antes de armar el roadmap. Sin maquillaje.
        </p>
        <div className="space-y-2">
          {SNAPSHOT_HOY.hallazgos_criticos.map((h, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-lg flex-shrink-0">{h.tag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900">{h.titulo}</p>
                <p className="text-xs text-slate-500 mt-0.5">{h.evidencia}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-relaxed">
            <strong>Lo bueno:</strong> la infraestructura está sólida (60+ funciones backend, anti-fraude funcionando, agentes
            generando contenido). Lo que falta es <strong>limpiar, ajustar y empujar el botón ON</strong>. No es construir, es lanzar.
          </p>
        </div>
      </Card>

      {/* FASES */}
      <div className="space-y-3">
        {LAUNCH_ROADMAP.map((phase, idx) => (
          <PhaseCard key={phase.id} phase={phase} defaultOpen={idx === 0} />
        ))}
      </div>

      {/* CTA Final */}
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
        <div className="flex items-start gap-4">
          <Flame className="w-8 h-8 text-orange-500 flex-shrink-0" />
          <div>
            <h3 className="font-poppins font-bold text-lg text-slate-900">Empezamos mañana sábado 16</h3>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
              La Fase 0 son <strong>~7 horas de trabajo del constructor + tu validación</strong>. Si arrancamos al amanecer,
              el domingo en la noche tenemos todo en verde para empujar Fase 1 el lunes con confianza.
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <a href="/admin/plan" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                <Wrench className="w-4 h-4" /> Crear tareas en Plan de Acción
              </a>
              <a href="/admin/estado-actual" className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors">
                Ver roadmap general
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}