import { Mail, Users, Building2 } from 'lucide-react';
import { EMAIL_FLOWS, TONOS } from '@/lib/email-sequences-data';
import EmailFlowColumn from '@/components/flujo-correos/EmailFlowColumn';

// ════════════════════════════════════════════════════════════════════════
// /admin/flujo-correos — Diagrama de flujo de las secuencias de correos
// completas B2C y B2B, explicado paso a paso. Lectura de izq→der (B2C | B2B),
// cada columna baja cronológicamente por etapas y correos reales.
// ════════════════════════════════════════════════════════════════════════
export default function FlujoCorreos() {
  return (
    <div className="ld-canvas min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'var(--ld-grad-action)' }}>
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ld-fg">Flujo de correos</h1>
              <p className="text-sm text-ld-fg-muted">Todas las secuencias de email automáticas, B2C y B2B, explicadas paso a paso.</p>
            </div>
          </div>

          {/* Leyenda de tonos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.values(TONOS).map((t) => (
              <span key={t.label} className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: t.bg, color: t.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-2xl border p-4" style={{ background: EMAIL_FLOWS.b2c.colorSoft, borderColor: EMAIL_FLOWS.b2c.color + '40' }}>
            <Users className="w-5 h-5 mb-2" style={{ color: EMAIL_FLOWS.b2c.color }} />
            <p className="text-2xl font-bold" style={{ color: EMAIL_FLOWS.b2c.color }}>
              {EMAIL_FLOWS.b2c.etapas.reduce((s, e) => s + e.correos.length, 0)}
            </p>
            <p className="text-xs text-ld-fg-muted">correos en el flujo B2C</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ background: EMAIL_FLOWS.b2b.colorSoft, borderColor: EMAIL_FLOWS.b2b.color + '40' }}>
            <Building2 className="w-5 h-5 mb-2" style={{ color: EMAIL_FLOWS.b2b.color }} />
            <p className="text-2xl font-bold" style={{ color: EMAIL_FLOWS.b2b.color }}>
              {EMAIL_FLOWS.b2b.etapas.reduce((s, e) => s + e.correos.length, 0)}
            </p>
            <p className="text-xs text-ld-fg-muted">correos en el flujo B2B</p>
          </div>
        </div>

        {/* Diagrama: dos columnas (B2C | B2B) en desktop, apiladas en mobile */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <EmailFlowColumn flow={EMAIL_FLOWS.b2c} />
          {/* Separador vertical en desktop */}
          <div className="hidden lg:block w-px bg-ld-border flex-shrink-0" />
          <EmailFlowColumn flow={EMAIL_FLOWS.b2b} />
        </div>

        <p className="text-[11px] text-ld-fg-subtle mt-10 text-center max-w-2xl mx-auto leading-relaxed">
          Cada tarjeta es un correo real que envía el sistema automáticamente. El nombre técnico (⚙) corresponde a la función backend que lo dispara. Los correos de seguimiento se detienen automáticamente cuando el cliente avanza (paga, acepta o rechaza).
        </p>
      </div>
    </div>
  );
}