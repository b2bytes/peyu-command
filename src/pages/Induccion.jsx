import { GraduationCap, Lightbulb } from 'lucide-react';
import { VISION_GENERAL, FLUJOS, TIPS } from '@/lib/induccion-data';
import ModulosMapa from '@/components/induccion/ModulosMapa';
import FlujoInteractivo from '@/components/induccion/FlujoInteractivo';

// ════════════════════════════════════════════════════════════════════════
// /admin/induccion — Inducción completa del sistema PEYU para el equipo.
// Orden lógico: 1) visión general → 2) mapa de módulos → 3) flujos paso a
// paso (pedido, etiqueta, despacho, producción, B2B) → 4) tips.
// Contenido editable en lib/induccion-data.js.
// ════════════════════════════════════════════════════════════════════════
export default function Induccion() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: 'var(--ld-grad-action)' }}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-jakarta font-bold text-2xl text-ld-fg">Inducción del sistema PEYU</h1>
            <p className="text-sm text-ld-fg-muted">Guía rápida y completa: qué es el sistema, dónde está cada cosa y cómo se opera, paso a paso.</p>
          </div>
        </div>
      </div>

      {/* 1 · Visión general */}
      <section>
        <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-1">1 · {VISION_GENERAL.titulo}</h2>
        <p className="text-sm text-ld-fg-muted leading-relaxed mb-4">{VISION_GENERAL.resumen}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {VISION_GENERAL.pilares.map((p) => (
            <div key={p.titulo} className="ld-card p-3.5">
              <p className="text-xl mb-1">{p.emoji}</p>
              <p className="font-bold text-sm text-ld-fg">{p.titulo}</p>
              <p className="text-xs text-ld-fg-muted leading-relaxed mt-0.5">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2 · Mapa de módulos */}
      <section>
        <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-1">2 · Mapa de páginas admin</h2>
        <p className="text-sm text-ld-fg-muted mb-4">Agrupadas por área, en orden de importancia diaria. Cada tarjeta es un link directo.</p>
        <ModulosMapa />
      </section>

      {/* 3 · Flujos paso a paso */}
      <section>
        <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-1">3 · Flujos operativos paso a paso (interactivos)</h2>
        <p className="text-sm text-ld-fg-muted mb-4">Avanza opción por opción y marca cada paso como hecho — tu progreso se guarda solo. Cubre operación, ventas B2B, marketing y administración.</p>
        <div className="space-y-4">
          {FLUJOS.map((f) => <FlujoInteractivo key={f.id} flujo={f} />)}
        </div>
      </section>

      {/* 4 · Tips */}
      <section>
        <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-3">4 · Reglas de oro</h2>
        <div className="ld-card p-4 space-y-2.5">
          {TIPS.map((t, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-ld-fg-soft leading-relaxed">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-ld-highlight" />
              {t}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}