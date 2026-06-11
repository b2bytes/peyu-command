import { BookOpen, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GUIAS, TIPS_FUNDADORES } from '@/lib/guia-fundadores-data';
import FlujoInteractivo from '@/components/induccion/FlujoInteractivo';

// ════════════════════════════════════════════════════════════════════════
// /admin/guia-fundadores — Guía educativa para los founders:
// administrar productos, generar etiquetas y gestionar ventas, paso a paso
// e interactivo (progreso guardado). Contenido en lib/guia-fundadores-data.
// ════════════════════════════════════════════════════════════════════════
export default function GuiaFundadores() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--ld-grad-action)' }}>
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-jakarta font-bold text-2xl text-ld-fg">Guía para Fundadores</h1>
          <p className="text-sm text-ld-fg-muted">
            Los 3 flujos esenciales del negocio, paso a paso. Avanza, marca como hecho y tu progreso se guarda solo.
            {' '}¿Quieres la inducción completa? <Link to="/admin/induccion" className="font-bold text-ld-action hover:underline">Está aquí</Link>.
            {' '}Tip: pulsa <kbd className="px-1.5 py-0.5 rounded bg-ld-action-soft text-ld-action text-[10px] font-bold">Ctrl+K</kbd> en cualquier pantalla para saltar a un módulo al instante.
          </p>
        </div>
      </div>

      {/* Flujos interactivos */}
      <div className="space-y-4">
        {GUIAS.map((g) => <FlujoInteractivo key={g.id} flujo={g} />)}
      </div>

      {/* Tips */}
      <section>
        <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-3">Reglas de oro del founder</h2>
        <div className="ld-card p-4 space-y-2.5">
          {TIPS_FUNDADORES.map((t, i) => (
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